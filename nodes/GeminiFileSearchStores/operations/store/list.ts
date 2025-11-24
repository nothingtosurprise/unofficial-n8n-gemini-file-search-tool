import { IExecuteFunctions } from 'n8n-workflow';
import { geminiApiRequest, geminiApiRequestAllItems } from '../../../../utils/apiClient';
import { FileSearchStore } from '../../../../utils/types';

interface ListResponse {
  fileSearchStores?: FileSearchStore[];
}

/**
 * Lists Gemini File Search Stores with optional pagination
 *
 * Retrieves all stores or a limited number based on node parameters.
 * Supports both paginated and full list retrieval.
 *
 * @param this - n8n execution context
 * @param index - Item index in the workflow execution
 * @returns Promise resolving to array of FileSearchStore objects
 * @throws {NodeApiError} When API request fails
 *
 * @example
 * ```typescript
 * // Get all stores
 * const allStores = await list.call(this, 0); // returnAll = true
 *
 * // Get first 10 stores
 * const stores = await list.call(this, 0); // returnAll = false, limit = 10
 * console.log(`Found ${stores.length} stores`);
 * ```
 */
export async function list(this: IExecuteFunctions, index: number): Promise<FileSearchStore[]> {
  const returnAll = this.getNodeParameter('returnAll', index);

  if (returnAll) {
    // API client returns 'any[]', but we know this endpoint returns FileSearchStore[]
    return geminiApiRequestAllItems.call(
      this,
      'fileSearchStores',
      'GET',
      '/fileSearchStores',
    ) as Promise<FileSearchStore[]>;
  } else {
    const limit = this.getNodeParameter('limit', index);
    const response = (await geminiApiRequest.call(
      this,
      'GET',
      '/fileSearchStores',
      {},
      { pageSize: limit },
    )) as ListResponse;
    return response.fileSearchStores || [];
  }
}
