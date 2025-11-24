import { IDataObject, IExecuteFunctions } from 'n8n-workflow';
import { geminiApiRequest } from '../../../../utils/apiClient';

interface DeleteResponse {
  success: boolean;
}

/**
 * Deletes a document from a Gemini File Search Store
 *
 * Permanently removes a document. Use force=true to delete documents regardless of state.
 * Without force, deletion may fail for documents in certain states.
 *
 * @param this - n8n execution context
 * @param index - Item index in the workflow execution
 * @returns Promise resolving to success confirmation object
 * @throws {NodeApiError} When API request fails or document cannot be deleted
 *
 * @example
 * ```typescript
 * // Delete document
 * const result = await deleteDocument.call(this, 0);
 * // Parameters:
 * // - documentName: 'fileSearchStores/store/documents/doc-123'
 * // - force: true
 *
 * console.log('Deleted successfully:', result.success);
 * ```
 */
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
