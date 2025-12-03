import { IExecuteFunctions } from 'n8n-workflow';
import { geminiApiRequest } from '../../../../utils/apiClient';
import { FileSearchStore } from '../../../../utils/types';
import { validateStoreName } from '../../../../utils/validators';

/**
 * Retrieves details of a specific Gemini File Search Store
 *
 * Fetches complete information about a store including document counts and size.
 *
 * @param this - n8n execution context
 * @param index - Item index in the workflow execution
 * @returns Promise resolving to FileSearchStore details
 * @throws {NodeOperationError} When store name format is invalid
 * @throws {NodeApiError} When API request fails or store not found
 *
 * @example
 * ```typescript
 * // Get store details
 * const store = await get.call(this, 0);
 * console.log(`Store: ${store.displayName}`);
 * console.log(`Active documents: ${store.activeDocumentsCount}`);
 * console.log(`Size: ${store.sizeBytes} bytes`);
 * ```
 */
export async function get(this: IExecuteFunctions, index: number): Promise<FileSearchStore> {
  const storeName = this.getNodeParameter('storeName', index, '', { extractValue: true }) as string;
  validateStoreName.call(this, storeName);

  // API client returns 'any', but we know the endpoint returns a FileSearchStore
  return geminiApiRequest.call(this, 'GET', `/${storeName}`) as Promise<FileSearchStore>;
}
