import { IExecuteFunctions } from 'n8n-workflow';
import { geminiApiRequest } from '../../../../utils/apiClient';
import { Document } from '../../../../utils/types';

export async function get(this: IExecuteFunctions, index: number): Promise<Document> {
  const documentName = this.getNodeParameter('documentName', index) as string;

  // API client returns 'any', but we know the endpoint returns a Document
  return geminiApiRequest.call(this, 'GET', `/${documentName}`) as Promise<Document>;
}
