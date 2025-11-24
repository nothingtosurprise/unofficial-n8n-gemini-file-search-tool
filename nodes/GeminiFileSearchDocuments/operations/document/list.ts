import { IExecuteFunctions } from 'n8n-workflow';
import { geminiApiRequest, geminiApiRequestAllItems } from '../../../../utils/apiClient';
import { Document } from '../../../../utils/types';
import { validateStoreName } from '../../../../utils/validators';

interface ListResponse {
  documents?: Document[];
}

export async function list(this: IExecuteFunctions, index: number): Promise<Document[]> {
  const storeName = this.getNodeParameter('storeName', index) as string;
  const returnAll = this.getNodeParameter('returnAll', index) as boolean;

  validateStoreName.call(this, storeName);

  if (returnAll) {
    // API client returns 'any[]', but we know this endpoint returns Document[]
    return geminiApiRequestAllItems.call(
      this,
      'documents',
      'GET',
      `/${storeName}/documents`,
    ) as Promise<Document[]>;
  }

  const limit = this.getNodeParameter('limit', index);
  const response = (await geminiApiRequest.call(
    this,
    'GET',
    `/${storeName}/documents`,
    {},
    { pageSize: limit },
  )) as ListResponse;

  return response.documents || [];
}
