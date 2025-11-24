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
