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
    body.customMetadata = customMetadataParam.metadataValues.map((item: MetadataValue) => {
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

    validateCustomMetadata.call(this, body.customMetadata as CustomMetadata[]);
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
