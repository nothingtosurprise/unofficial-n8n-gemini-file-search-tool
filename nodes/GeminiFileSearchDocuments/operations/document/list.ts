import { IExecuteFunctions } from 'n8n-workflow';
import { geminiApiRequest, geminiApiRequestAllItems } from '../../../../utils/apiClient';
import { filterDocuments } from '../../../../utils/metadataFilter';
import { Document } from '../../../../utils/types';
import { validateStoreName } from '../../../../utils/validators';

interface ListResponse {
  documents?: Document[];
}

/**
 * Lists documents in a Gemini File Search Store with optional pagination and metadata filtering
 *
 * Retrieves all documents or a limited number based on node parameters.
 * Supports both paginated and full list retrieval, with optional client-side metadata filtering.
 *
 * @param this - n8n execution context
 * @param index - Item index in the workflow execution
 * @returns Promise resolving to array of Document objects (filtered if metadata filter is specified)
 * @throws {NodeOperationError} When store name format is invalid
 * @throws {NodeApiError} When API request fails or store not found
 *
 * @example
 * ```typescript
 * // Get all documents from a store
 * const allDocs = await list.call(this, 0); // returnAll = true
 * console.log(`Total documents: ${allDocs.length}`);
 *
 * // Get first 20 documents with metadata filter
 * const docs = await list.call(this, 0); // returnAll = false, limit = 20, metadataFilter = 'author="Latour"'
 * docs.forEach(doc => {
 *   console.log(`${doc.displayName} (${doc.state})`);
 * });
 * ```
 */
export async function list(this: IExecuteFunctions, index: number): Promise<Document[]> {
  const storeName = this.getNodeParameter('storeName', index) as string;
  const returnAll = this.getNodeParameter('returnAll', index) as boolean;
  const metadataFilter = this.getNodeParameter('metadataFilter', index, '') as string;

  validateStoreName.call(this, storeName);

  let documents: Document[];

  if (returnAll) {
    // API client returns 'any[]', but we know this endpoint returns Document[]
    documents = (await geminiApiRequestAllItems.call(
      this,
      'documents',
      'GET',
      `/${storeName}/documents`,
    )) as Document[];
  } else {
    const limit = this.getNodeParameter('limit', index);
    const response = (await geminiApiRequest.call(
      this,
      'GET',
      `/${storeName}/documents`,
      {},
      { pageSize: limit },
    )) as ListResponse;
    documents = response.documents || [];
  }

  // Apply client-side metadata filtering if specified
  if (metadataFilter) {
    documents = filterDocuments(documents, metadataFilter);
  }

  return documents;
}
