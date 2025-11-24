import { IExecuteFunctions } from 'n8n-workflow';
import { geminiApiRequest } from '../../../../utils/apiClient';
import { FileSearchStore } from '../../../../utils/types';
import { validateStoreName } from '../../../../utils/validators';

export async function get(this: IExecuteFunctions, index: number): Promise<FileSearchStore> {
  const storeName = this.getNodeParameter('storeName', index) as string;
  validateStoreName.call(this, storeName);

  // API client returns 'any', but we know the endpoint returns a FileSearchStore
  return geminiApiRequest.call(this, 'GET', `/${storeName}`) as Promise<FileSearchStore>;
}
