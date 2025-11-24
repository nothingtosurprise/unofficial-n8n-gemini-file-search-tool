import { IDataObject, IExecuteFunctions } from 'n8n-workflow';
import { geminiApiRequest } from '../../../../utils/apiClient';
import { validateMetadataFilter } from '../../../../utils/validators';

interface QueryResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text?: string }>;
    };
  }>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

export async function query(this: IExecuteFunctions, index: number): Promise<QueryResponse> {
  const model = this.getNodeParameter('model', index) as string;
  const queryText = this.getNodeParameter('query', index) as string;
  const storeNamesParam = this.getNodeParameter('storeNames', index) as string;
  const metadataFilter = this.getNodeParameter('metadataFilter', index, '') as string;

  const storeNames = storeNamesParam.split(',').map((s) => s.trim());

  if (metadataFilter) {
    validateMetadataFilter.call(this, metadataFilter);
  }

  const body: IDataObject = {
    contents: [
      {
        parts: [{ text: queryText }],
      },
    ],
    tools: [
      {
        fileSearch: {
          fileSearchStoreNames: storeNames,
          ...(metadataFilter && { metadataFilter }),
        },
      },
    ],
  };

  // API client returns 'any', but we know the endpoint returns a QueryResponse
  return geminiApiRequest.call(
    this,
    'POST',
    `/models/${model}:generateContent`,
    body,
  ) as Promise<QueryResponse>;
}
