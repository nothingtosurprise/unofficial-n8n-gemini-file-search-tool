import { IDataObject, IExecuteFunctions } from 'n8n-workflow';
import { geminiResumableUpload, pollOperation } from '../../../../utils/apiClient';
import { CustomMetadata, Operation } from '../../../../utils/types';
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

/**
 * Uploads a binary file to a Gemini File Search Store
 *
 * Performs resumable upload of file content with optional metadata and chunking configuration.
 * Supports files up to 100MB. Can optionally wait for processing to complete.
 *
 * @param this - n8n execution context
 * @param index - Item index in the workflow execution
 * @returns Promise resolving to Operation object (or completed result if waitForCompletion=true)
 * @throws {NodeOperationError} When store name invalid, file size exceeds 100MB, or metadata invalid
 * @throws {NodeApiError} When upload fails or operation polling times out
 *
 * @example
 * ```typescript
 * // Upload PDF with metadata and custom chunking
 * const operation = await upload.call(this, 0);
 * // Parameters from node:
 * // - storeName: 'fileSearchStores/my-store'
 * // - binaryPropertyName: 'data'
 * // - displayName: 'Technical Documentation'
 * // - customMetadata: [{ key: 'category', stringValue: 'docs' }]
 * // - chunkingOptions: { maxTokensPerChunk: 800, maxOverlapTokens: 100 }
 * // - waitForCompletion: true
 *
 * console.log(operation.response.name); // Document resource name
 * ```
 */
export async function upload(this: IExecuteFunctions, index: number): Promise<Operation> {
  const storeName = this.getNodeParameter('storeName', index) as string;
  const binaryPropertyName = this.getNodeParameter('binaryPropertyName', index);
  const displayName = this.getNodeParameter('displayName', index, '') as string;
  const waitForCompletion = this.getNodeParameter('waitForCompletion', index) as boolean;

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
    const customMetadata = customMetadataParam.metadataValues
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

    if (customMetadata.length > 0) {
      metadata.customMetadata = customMetadata;
      validateCustomMetadata.call(this, customMetadata);
    }
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

  // Upload file
  const operation = (await geminiResumableUpload.call(
    this,
    storeName,
    fileBuffer,
    binaryData.mimeType,
    metadata,
  )) as Operation;

  // Wait for completion if requested
  if (waitForCompletion) {
    // pollOperation returns 'any', but we know it returns an Operation result
    return pollOperation.call(this, operation.name) as Promise<Operation>;
  }

  return operation;
}
