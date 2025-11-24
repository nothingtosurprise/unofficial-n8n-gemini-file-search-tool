import { IExecuteFunctions } from 'n8n-workflow';
import { geminiApiRequest } from '../../../../utils/apiClient';
import { Operation } from '../../../../utils/types';

/**
 * Retrieves the status of a long-running operation
 *
 * Checks the current state of an asynchronous operation (e.g., document upload/import).
 * Poll this endpoint until operation.done is true.
 *
 * @param this - n8n execution context
 * @param index - Item index in the workflow execution
 * @returns Promise resolving to Operation status object
 * @throws {NodeApiError} When API request fails or operation not found
 *
 * @example
 * ```typescript
 * // Check operation status
 * const op = await getOperation.call(this, 0);
 * if (op.done) {
 *   if (op.error) {
 *     console.error('Operation failed:', op.error.message);
 *   } else {
 *     console.log('Operation completed:', op.response);
 *   }
 * } else {
 *   console.log('Operation still running...');
 * }
 * ```
 */
export async function getOperation(this: IExecuteFunctions, index: number): Promise<Operation> {
  const operationName = this.getNodeParameter('operationName', index) as string;

  // API client returns 'any', but we know the endpoint returns an Operation
  return geminiApiRequest.call(this, 'GET', `/${operationName}`) as Promise<Operation>;
}
