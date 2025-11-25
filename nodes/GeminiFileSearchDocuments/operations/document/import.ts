import { IDataObject, IExecuteFunctions } from 'n8n-workflow';
import { geminiApiRequest, pollOperation } from '../../../../utils/apiClient';
import { CustomMetadata, Operation } from '../../../../utils/types';
import {
  validateCustomMetadata,
  validateDisplayName,
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
 * Imports a file from Google Files API into a File Search Store
 *
 * References an existing file in Files API by name and imports it into the store.
 * Supports optional metadata and chunking configuration. Can wait for processing completion.
 *
 * @param this - n8n execution context
 * @param index - Item index in the workflow execution
 * @returns Promise resolving to Operation object (or completed result if waitForCompletion=true)
 * @throws {NodeOperationError} When store name invalid, display name too long, or metadata invalid
 * @throws {NodeApiError} When import fails or operation polling times out
 *
 * @example
 * ```typescript
 * // Import file from Files API
 * const operation = await importFile.call(this, 0);
 * // Parameters from node:
 * // - storeName: 'fileSearchStores/my-store'
 * // - fileName: 'files/abc123xyz'
 * // - displayName: 'Imported Document'
 * // - customMetadata: [{ key: 'source', stringValue: 'files-api' }]
 * // - waitForCompletion: true
 *
 * console.log(operation.response.name); // Document resource name
 * ```
 */
export async function importFile(this: IExecuteFunctions, index: number): Promise<Operation> {
  const storeName = this.getNodeParameter('storeName', index) as string;
  const fileName = this.getNodeParameter('fileName', index) as string;
  const displayName = this.getNodeParameter('displayName', index, '') as string;
  const waitForCompletion = this.getNodeParameter('waitForCompletion', index) as boolean;

  validateStoreName.call(this, storeName);
  if (displayName) {
    validateDisplayName.call(this, displayName);
  }

  // Build request body
  const body: IDataObject = { fileName };
  if (displayName) {
    body.displayName = displayName;
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
      body.customMetadata = customMetadata;
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
    body.chunkingConfig = {
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

  // Import file
  const operation = (await geminiApiRequest.call(
    this,
    'POST',
    `/${storeName}:importFile`,
    body,
  )) as Operation;

  // Wait for completion if requested
  if (waitForCompletion) {
    // pollOperation returns 'any', but we know it returns an Operation result
    return pollOperation.call(this, operation.name) as Promise<Operation>;
  }

  return operation;
}
