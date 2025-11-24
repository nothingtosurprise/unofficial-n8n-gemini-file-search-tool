import { IDataObject, IExecuteFunctions } from 'n8n-workflow';
import { geminiApiRequest } from '../../../../utils/apiClient';

interface DeleteResponse {
  success: boolean;
}

export async function deleteDocument(
  this: IExecuteFunctions,
  index: number,
): Promise<DeleteResponse> {
  const documentName = this.getNodeParameter('documentName', index) as string;
  const force = this.getNodeParameter('force', index) as boolean;

  const qs: IDataObject = {};
  if (force) {
    qs.force = true;
  }

  await geminiApiRequest.call(this, 'DELETE', `/${documentName}`, {}, qs);

  return { success: true };
}
