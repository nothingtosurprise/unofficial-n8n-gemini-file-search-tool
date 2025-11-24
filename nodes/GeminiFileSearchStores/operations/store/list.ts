import { IExecuteFunctions } from 'n8n-workflow';
import { geminiApiRequest, geminiApiRequestAllItems } from '../../../../utils/apiClient';
import { FileSearchStore } from '../../../../utils/types';

interface ListResponse {
  fileSearchStores?: FileSearchStore[];
}

export async function list(this: IExecuteFunctions, index: number): Promise<FileSearchStore[]> {
  const returnAll = this.getNodeParameter('returnAll', index);

  if (returnAll) {
    // API client returns 'any[]', but we know this endpoint returns FileSearchStore[]
    return geminiApiRequestAllItems.call(
      this,
      'fileSearchStores',
      'GET',
      '/fileSearchStores',
    ) as Promise<FileSearchStore[]>;
  } else {
    const limit = this.getNodeParameter('limit', index);
    const response = (await geminiApiRequest.call(
      this,
      'GET',
      '/fileSearchStores',
      {},
      { pageSize: limit },
    )) as ListResponse;
    return response.fileSearchStores || [];
  }
}
