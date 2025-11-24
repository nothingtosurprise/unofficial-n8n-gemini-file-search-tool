import { IDataObject, IExecuteFunctions } from 'n8n-workflow';
import { geminiApiRequest } from '../../../../utils/apiClient';
import { FileSearchStore } from '../../../../utils/types';
import { validateDisplayName } from '../../../../utils/validators';

export async function create(this: IExecuteFunctions, index: number): Promise<FileSearchStore> {
  const displayName = this.getNodeParameter('displayName', index) as string;

  if (displayName) {
    validateDisplayName.call(this, displayName);
  }

  const body: IDataObject = {};
  if (displayName) {
    body.displayName = displayName;
  }

  // API client returns 'any', but we know the endpoint returns a FileSearchStore
  return geminiApiRequest.call(this, 'POST', '/fileSearchStores', body) as Promise<FileSearchStore>;
}
