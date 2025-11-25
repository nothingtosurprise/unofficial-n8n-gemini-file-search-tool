import { IDataObject, IExecuteFunctions } from 'n8n-workflow';
import {
  geminiApiRequest,
  geminiApiRequestAllItems,
  geminiResumableUpload,
  pollOperation,
} from '../../../../utils/apiClient';
import { CustomMetadata, Document, Operation } from '../../../../utils/types';
import {
  validateCustomMetadata,
  validateDisplayName,
  validateFileSize,
  validateStoreName,
} from '../../../../utils/validators';

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

interface DeletedDocumentInfo {
  found: boolean;
  searchedFilename: string;
  documentName?: string;
  displayName?: string;
  message: string;
}

interface ReplaceUploadResult {
  upload: Operation;
  deletedDocument: DeletedDocumentInfo;
}

/**
 * Uploads a new document and deletes the old one with matching filename
 *
 * This operation is a workaround for the Google API limitation that doesn't allow
 * updating or replacing documents. It performs the following steps:
 * 1. Uploads the new document (same as regular upload)
 * 2. If upload succeeds, searches for documents with matching displayName (filename)
 * 3. If found, deletes the old document(s)
 *
 * @param this - n8n execution context
 * @param index - Item index in the workflow execution
 * @returns Promise resolving to upload result with deletion info
 * @throws {NodeOperationError} When store name invalid, file size exceeds 100MB, or metadata invalid
 * @throws {NodeApiError} When upload fails or operation polling times out
 *
 * @example
 * ```typescript
 * // Replace upload with old document deletion
 * const result = await replaceUpload.call(this, 0);
 * // Parameters from node:
 * // - storeName: 'fileSearchStores/my-store'
 * // - binaryPropertyName: 'data'
 * // - displayName: 'Technical Documentation'
 * // - oldDocumentFilename: 'old-document.pdf'
 * // - forceDelete: true
 * // - waitForCompletion: true
 *
 * console.log(result.upload.response.name); // New document resource name
 * console.log(result.deletedDocument.found); // true if old document was found and deleted
 * ```
 */
export async function replaceUpload(
  this: IExecuteFunctions,
  index: number,
): Promise<ReplaceUploadResult> {
  const storeName = this.getNodeParameter('storeName', index) as string;
  const binaryPropertyName = this.getNodeParameter('binaryPropertyName', index);
  const displayName = this.getNodeParameter('displayName', index, '') as string;
  const waitForCompletion = this.getNodeParameter('waitForCompletion', index) as boolean;
  const oldDocumentFilename = this.getNodeParameter('oldDocumentFilename', index) as string;
  const forceDelete = this.getNodeParameter('forceDelete', index, true) as boolean;

  validateStoreName.call(this, storeName);
  if (displayName) {
    validateDisplayName.call(this, displayName);
  }

  // Get binary data
  const binaryData = this.helpers.assertBinaryData(index, binaryPropertyName);
  const fileBuffer = await this.helpers.getBinaryDataBuffer(index, binaryPropertyName);

  validateFileSize.call(this, fileBuffer.length);

  // Build metadata
  const metadata: IDataObject = {};
  if (displayName) {
    metadata.displayName = displayName;
  }

  // Parse custom metadata
  const customMetadataParam = this.getNodeParameter(
    'customMetadata',
    index,
    {},
  ) as CustomMetadataParam;
  if (customMetadataParam.metadataValues && customMetadataParam.metadataValues.length > 0) {
    metadata.customMetadata = customMetadataParam.metadataValues.map((item: MetadataValue) => {
      const metadataItem: CustomMetadata = { key: item.key };
      if (item.valueType === 'string' && item.value !== undefined) {
        metadataItem.stringValue = item.value;
      } else if (item.valueType === 'number' && item.value !== undefined) {
        metadataItem.numericValue = parseFloat(item.value);
      } else if (item.valueType === 'stringList' && item.values !== undefined) {
        metadataItem.stringListValue = {
          values: item.values.split(',').map((v: string) => v.trim()),
        };
      }
      return metadataItem;
    });

    validateCustomMetadata.call(this, metadata.customMetadata as CustomMetadata[]);
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

  // Step 1: Upload the new file
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

  // Step 2: Search for old document by filename (displayName)
  let deletedDocumentInfo: DeletedDocumentInfo = {
    found: false,
    searchedFilename: oldDocumentFilename,
    message: `No document found with filename "${oldDocumentFilename}" to delete`,
  };

  // Get all documents from the store to search by displayName
  const documents = (await geminiApiRequestAllItems.call(
    this,
    'documents',
    'GET',
    `/${storeName}/documents`,
  )) as Document[];

  // Find document with matching displayName (case-insensitive)
  const oldDocumentFilenameLower = oldDocumentFilename.toLowerCase();
  const matchingDocument = documents.find(
    (doc) => doc.displayName && doc.displayName.toLowerCase() === oldDocumentFilenameLower,
  );

  // Step 3: Delete the old document if found
  if (matchingDocument) {
    const qs: IDataObject = {};
    if (forceDelete) {
      qs.force = true;
    }

    await geminiApiRequest.call(this, 'DELETE', `/${matchingDocument.name}`, {}, qs);

    deletedDocumentInfo = {
      found: true,
      searchedFilename: oldDocumentFilename,
      documentName: matchingDocument.name,
      displayName: matchingDocument.displayName,
      message: `Successfully deleted old document: ${matchingDocument.displayName}`,
    };
  }

  return {
    upload: uploadResult,
    deletedDocument: deletedDocumentInfo,
  };
}
