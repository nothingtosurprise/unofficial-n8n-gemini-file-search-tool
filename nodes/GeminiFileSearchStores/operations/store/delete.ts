import { IExecuteFunctions } from 'n8n-workflow';
import { geminiApiRequest } from '../../../../utils/apiClient';
import { validateStoreName } from '../../../../utils/validators';

interface DeleteResponse {
  success: boolean;
}

/**
 * Deletes a Gemini File Search Store and optionally all its documents
 *
 * Permanently removes a store. Use force=true to delete stores containing documents.
 * Without force, deletion fails if the store has any documents.
 *
 * @param this - n8n execution context
 * @param index - Item index in the workflow execution
 * @returns Promise resolving to success confirmation object
 * @throws {NodeOperationError} When store name format is invalid
 * @throws {NodeApiError} When API request fails or store contains documents (without force)
 *
 * @example
 * ```typescript
 * // Delete empty store
 * const result = await deleteStore.call(this, 0); // force = false
 *
 * // Force delete store with documents
 * const result = await deleteStore.call(this, 0); // force = true
 * console.log('Deleted successfully:', result.success);
 * ```
 */
export async function deleteStore(this: IExecuteFunctions, index: number): Promise<DeleteResponse> {
  const storeName = this.getNodeParameter('storeName', index, '', { extractValue: true }) as string;
  const force = this.getNodeParameter('force', index) as boolean;

  validateStoreName.call(this, storeName);

  await geminiApiRequest.call(this, 'DELETE', `/${storeName}`, {}, { force });

  return { success: true };
}
