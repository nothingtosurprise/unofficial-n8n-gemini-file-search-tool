import { IDataObject, IExecuteFunctions, NodeOperationError } from 'n8n-workflow';
import {
  geminiApiRequest,
  geminiApiRequestAllItems,
  geminiResumableUpload,
  pollOperation,
} from '../../../../utils/apiClient';
import {
  CustomMetadata,
  DeletedDocumentDetail,
  Document,
  MatchByType,
  MetadataMergeStrategy,
  Operation,
  ReplaceUploadResult,
} from '../../../../utils/types';
import {
  validateCustomMetadata,
  validateDisplayName,
  validateFileSize,
  validateStoreName,
} from '../../../../utils/validators';
import { findMatchingDocuments, getMatchCriteria, mergeMetadata } from './replaceUploadHelpers';

interface MetadataValue {
  key: string;
  valueType: 'string' | 'number' | 'stringList';
  value?: string;
  values?: string;
}

interface CustomMetadataParam {
  metadataValues?: MetadataValue[];
}

interface ChunkingOptionsParam {
  maxTokensPerChunk?: number;
  maxOverlapTokens?: number;
}

/**
 * Uploads a new document and optionally deletes old document(s) based on matching criteria
 *
 * This operation is a workaround for the Google API limitation that doesn't allow
 * updating or replacing documents. It performs the following steps:
 * 1. Validates inputs and binary data
 * 2. If matchBy !== 'none': Lists documents, finds matches, optionally preserves metadata
 * 3. DELETES old document(s) FIRST (before upload)
 * 4. Uploads the new document with potentially merged metadata
 * 5. Returns comprehensive result with deletion and metadata info
 *
 * @param this - n8n execution context
 * @param index - Item index in the workflow execution
 * @returns Promise resolving to upload result with deletion and metadata info
 * @throws {NodeOperationError} When required fields missing, file size exceeds 100MB, or metadata invalid
 * @throws {NodeApiError} When upload fails or operation polling times out
 *
 * @example
 * ```typescript
 * // Replace upload by display name
 * const result = await replaceUpload.call(this, 0);
 * // Parameters:
 * // - matchBy: 'displayName'
 * // - displayName: 'Technical Documentation'
 * // - preserveMetadata: true
 * // - metadataMergeStrategy: 'preferNew'
 *
 * console.log(result.upload.response.name); // New document resource name
 * console.log(result.deletedDocuments?.totalDeleted); // Number of documents deleted
 * console.log(result.metadata?.finalMetadataCount); // Final metadata count after merge
 * ```
 */
export async function replaceUpload(
  this: IExecuteFunctions,
  index: number,
): Promise<ReplaceUploadResult> {
  // 1. Get all parameters
  const storeName = this.getNodeParameter('storeName', index, '', { extractValue: true }) as string;
  const binaryPropertyName = this.getNodeParameter('binaryPropertyName', index);
  const displayName = this.getNodeParameter('displayName', index) as string; // Now required
  const matchBy = this.getNodeParameter('matchBy', index, 'none') as MatchByType;
  const oldDocumentFilename = this.getNodeParameter('oldDocumentFilename', index, '') as string;
  const matchMetadataKey = this.getNodeParameter('matchMetadataKey', index, '') as string;
  const matchMetadataValue = this.getNodeParameter('matchMetadataValue', index, '') as string;
  const deleteAllMatches = this.getNodeParameter('deleteAllMatches', index, false) as boolean;
  const preserveMetadata = this.getNodeParameter('preserveMetadata', index, false) as boolean;
  const metadataMergeStrategy = this.getNodeParameter(
    'metadataMergeStrategy',
    index,
    'preferNew',
  ) as MetadataMergeStrategy;
  const forceDelete = this.getNodeParameter('forceDelete', index, true) as boolean;
  const waitForCompletion = this.getNodeParameter('waitForCompletion', index, true) as boolean;

  // 2. Validate required fields
  validateStoreName.call(this, storeName);
  validateDisplayName.call(this, displayName);

  // Validate conditional required fields
  if (matchBy === 'customFilename' && !oldDocumentFilename) {
    throw new NodeOperationError(
      this.getNode(),
      'Old Document Filename is required when matching by custom filename',
    );
  }
  if (matchBy === 'metadata') {
    if (!matchMetadataKey) {
      throw new NodeOperationError(
        this.getNode(),
        'Metadata Key is required when matching by metadata',
      );
    }
    if (!matchMetadataValue) {
      throw new NodeOperationError(
        this.getNode(),
        'Metadata Value is required when matching by metadata',
      );
    }
  }

  // 3. Get binary data and validate
  const binaryData = this.helpers.assertBinaryData(index, binaryPropertyName);
  const fileBuffer = await this.helpers.getBinaryDataBuffer(index, binaryPropertyName);
  validateFileSize.call(this, fileBuffer.length);

  // 4. Initialize tracking variables
  let matchingDocuments: Document[] = [];
  const deletedDocuments: DeletedDocumentDetail[] = [];
  let firstMatch: Document | undefined;

  // 5. Build base metadata from custom metadata parameter
  const customMetadataParam = this.getNodeParameter(
    'customMetadata',
    index,
    {},
  ) as CustomMetadataParam;
  let newCustomMetadata: CustomMetadata[] = [];
  if (customMetadataParam.metadataValues && customMetadataParam.metadataValues.length > 0) {
    newCustomMetadata = customMetadataParam.metadataValues
      .map((item: MetadataValue) => {
        const metadataItem: CustomMetadata = { key: item.key };
        // Check for null, undefined, and empty string (value can come as null from n8n expressions)
        if (item.valueType === 'string' && item.value != null && item.value !== '') {
          metadataItem.stringValue = item.value;
        } else if (item.valueType === 'number' && item.value != null && item.value !== '') {
          metadataItem.numericValue = parseFloat(item.value);
        } else if (item.valueType === 'stringList' && item.values != null && item.values !== '') {
          metadataItem.stringListValue = {
            values: item.values
              .split(',')
              .map((v: string) => v.trim())
              .filter((v: string) => v !== ''),
          };
        }
        return metadataItem;
      })
      // Filter out metadata items that don't have any value set
      .filter(
        (item: CustomMetadata) =>
          item.stringValue !== undefined ||
          item.numericValue !== undefined ||
          (item.stringListValue?.values && item.stringListValue.values.length > 0),
      );
  }

  // 6. Only search and delete if matchBy !== 'none'
  if (matchBy !== 'none') {
    // List all documents in the store
    const documents = (await geminiApiRequestAllItems.call(
      this,
      'documents',
      'GET',
      `/${storeName}/documents`,
    )) as Document[];

    // Find matching documents
    matchingDocuments = findMatchingDocuments(
      documents,
      matchBy,
      displayName,
      oldDocumentFilename,
      matchMetadataKey,
      matchMetadataValue,
    );

    firstMatch = matchingDocuments[0];

    // Preserve and merge metadata from FIRST match if enabled
    if (preserveMetadata && firstMatch?.customMetadata) {
      newCustomMetadata = mergeMetadata(
        firstMatch.customMetadata,
        newCustomMetadata,
        metadataMergeStrategy,
      );
    }

    // Validate merged metadata count (max 20 items)
    if (newCustomMetadata.length > 20) {
      throw new NodeOperationError(
        this.getNode(),
        `Merged metadata exceeds maximum of 20 items (got ${newCustomMetadata.length}). ` +
          'Reduce metadata or use a different merge strategy.',
      );
    }

    // DELETE old document(s) FIRST (before upload!)
    const documentsToDelete =
      deleteAllMatches && matchBy === 'metadata'
        ? matchingDocuments
        : firstMatch
          ? [firstMatch]
          : [];

    for (const doc of documentsToDelete) {
      try {
        const qs: IDataObject = forceDelete ? { force: true } : {};
        await geminiApiRequest.call(this, 'DELETE', `/${doc.name}`, {}, qs);
        deletedDocuments.push({
          name: doc.name,
          displayName: doc.displayName,
          deleted: true,
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        deletedDocuments.push({
          name: doc.name,
          displayName: doc.displayName,
          deleted: false,
          error: errorMessage,
        });
        // Continue with other deletes, don't throw
      }
    }
  }

  // 7. Build final metadata for upload
  const metadata: IDataObject = {
    displayName,
  };

  // Final filter to ensure all metadata items have valid values
  // Check for null, undefined, empty strings, and NaN
  const validCustomMetadata = newCustomMetadata
    .filter(
      (item: CustomMetadata) =>
        (item.stringValue != null && item.stringValue !== '') ||
        (item.numericValue != null && !isNaN(item.numericValue)) ||
        (item.stringListValue?.values && item.stringListValue.values.length > 0),
    )
    // Rebuild clean metadata objects with only valid fields
    .map((item: CustomMetadata) => {
      const clean: CustomMetadata = { key: item.key };
      if (item.stringValue != null && item.stringValue !== '') {
        clean.stringValue = item.stringValue;
      } else if (item.numericValue != null && !isNaN(item.numericValue)) {
        clean.numericValue = item.numericValue;
      } else if (item.stringListValue?.values && item.stringListValue.values.length > 0) {
        clean.stringListValue = item.stringListValue;
      }
      return clean;
    })
    // Final safety check - only items with exactly one value type set
    .filter(
      (item: CustomMetadata) =>
        item.stringValue !== undefined ||
        item.numericValue !== undefined ||
        item.stringListValue !== undefined,
    );

  if (validCustomMetadata.length > 0) {
    metadata.customMetadata = validCustomMetadata;
    validateCustomMetadata.call(this, validCustomMetadata);
  }

  // Parse chunking options
  const chunkingOptions = this.getNodeParameter(
    'chunkingOptions',
    index,
    {},
  ) as ChunkingOptionsParam;
  if (chunkingOptions.maxTokensPerChunk || chunkingOptions.maxOverlapTokens) {
    metadata.chunkingConfig = {
      whiteSpaceConfig: {
        ...(chunkingOptions.maxTokensPerChunk && {
          maxTokensPerChunk: chunkingOptions.maxTokensPerChunk,
        }),
        ...(chunkingOptions.maxOverlapTokens && {
          maxOverlapTokens: chunkingOptions.maxOverlapTokens,
        }),
      },
    };
  }

  // 8. Upload new document
  let uploadResult = (await geminiResumableUpload.call(
    this,
    storeName,
    fileBuffer,
    binaryData.mimeType,
    metadata,
  )) as Operation;

  // Wait for completion if requested
  if (waitForCompletion) {
    uploadResult = (await pollOperation.call(this, uploadResult.name)) as Operation;
  }

  // 9. Return comprehensive result
  return {
    upload: uploadResult,
    deletedDocuments:
      matchBy !== 'none'
        ? {
            matchBy,
            matchCriteria: getMatchCriteria(
              matchBy,
              displayName,
              oldDocumentFilename,
              matchMetadataKey,
              matchMetadataValue,
            ),
            totalFound: matchingDocuments.length,
            totalDeleted: deletedDocuments.filter((d) => d.deleted).length,
            deleteAllMatches,
            documents: deletedDocuments,
          }
        : undefined,
    metadata:
      preserveMetadata && matchBy !== 'none'
        ? {
            preserved: !!firstMatch?.customMetadata,
            sourceDocument: firstMatch?.name,
            strategy: metadataMergeStrategy,
            oldMetadataCount: firstMatch?.customMetadata?.length || 0,
            newMetadataCount: customMetadataParam.metadataValues?.length || 0,
            finalMetadataCount: validCustomMetadata.length,
          }
        : undefined,
  };
}
