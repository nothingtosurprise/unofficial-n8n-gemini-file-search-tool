import { IExecuteFunctions } from 'n8n-workflow';
import { geminiApiRequest } from '../../../../utils/apiClient';
import { validateStoreName } from '../../../../utils/validators';

interface DeleteResponse {
  success: boolean;
}

export async function deleteStore(this: IExecuteFunctions, index: number): Promise<DeleteResponse> {
  const storeName = this.getNodeParameter('storeName', index) as string;
  const force = this.getNodeParameter('force', index) as boolean;

  validateStoreName.call(this, storeName);

  await geminiApiRequest.call(this, 'DELETE', `/${storeName}`, {}, { force });

  return { success: true };
}
