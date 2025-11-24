import { IExecuteFunctions } from 'n8n-workflow';
import { geminiApiRequest } from '../../../../utils/apiClient';
import { Operation } from '../../../../utils/types';

export async function getOperation(this: IExecuteFunctions, index: number): Promise<Operation> {
  const operationName = this.getNodeParameter('operationName', index) as string;

  // API client returns 'any', but we know the endpoint returns an Operation
  return geminiApiRequest.call(this, 'GET', `/${operationName}`) as Promise<Operation>;
}
