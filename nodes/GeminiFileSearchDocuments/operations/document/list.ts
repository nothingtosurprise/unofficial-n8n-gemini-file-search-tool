import { IExecuteFunctions } from 'n8n-workflow';
import { geminiApiRequest, geminiApiRequestAllItems } from '../../../../utils/apiClient';
import { Document } from '../../../../utils/types';
import { validateStoreName } from '../../../../utils/validators';

interface ListResponse {
  documents?: Document[];
}

/**
 * Lists documents in a Gemini File Search Store with optional pagination
 *
 * Retrieves all documents or a limited number based on node parameters.
 * Supports both paginated and full list retrieval.
 *
 * @param this - n8n execution context
 * @param index - Item index in the workflow execution
 * @returns Promise resolving to array of Document objects
 * @throws {NodeOperationError} When store name format is invalid
 * @throws {NodeApiError} When API request fails or store not found
 *
 * @example
 * ```typescript
 * // Get all documents from a store
 * const allDocs = await list.call(this, 0); // returnAll = true
 * console.log(`Total documents: ${allDocs.length}`);
 *
 * // Get first 20 documents
 * const docs = await list.call(this, 0); // returnAll = false, limit = 20
 * docs.forEach(doc => {
 *   console.log(`${doc.displayName} (${doc.state})`);
 * });
 * ```
 */
export async function list(this: IExecuteFunctions, index: number): Promise<Document[]> {
  const storeName = this.getNodeParameter('storeName', index) as string;
  const returnAll = this.getNodeParameter('returnAll', index) as boolean;

  validateStoreName.call(this, storeName);

  if (returnAll) {
    // API client returns 'any[]', but we know this endpoint returns Document[]
    return geminiApiRequestAllItems.call(
      this,
      'documents',
      'GET',
      `/${storeName}/documents`,
    ) as Promise<Document[]>;
  }

  const limit = this.getNodeParameter('limit', index);
  const response = (await geminiApiRequest.call(
    this,
    'GET',
    `/${storeName}/documents`,
    {},
    { pageSize: limit },
  )) as ListResponse;

  return response.documents || [];
}
