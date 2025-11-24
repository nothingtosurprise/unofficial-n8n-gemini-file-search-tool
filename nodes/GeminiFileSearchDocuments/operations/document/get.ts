import { IExecuteFunctions } from 'n8n-workflow';
import { geminiApiRequest } from '../../../../utils/apiClient';
import { Document } from '../../../../utils/types';

/**
 * Retrieves details of a specific document in a File Search Store
 *
 * Fetches complete information about a document including metadata, state, and file properties.
 *
 * @param this - n8n execution context
 * @param index - Item index in the workflow execution
 * @returns Promise resolving to Document details
 * @throws {NodeApiError} When API request fails or document not found
 *
 * @example
 * ```typescript
 * // Get document details
 * const doc = await get.call(this, 0);
 * // Parameter: documentName = 'fileSearchStores/store/documents/doc-123'
 *
 * console.log(`Document: ${doc.displayName}`);
 * console.log(`State: ${doc.state}`);
 * console.log(`Size: ${doc.sizeBytes} bytes`);
 * console.log(`MIME: ${doc.mimeType}`);
 * if (doc.customMetadata) {
 *   console.log('Metadata:', doc.customMetadata);
 * }
 * ```
 */
export async function get(this: IExecuteFunctions, index: number): Promise<Document> {
  const documentName = this.getNodeParameter('documentName', index) as string;

  // API client returns 'any', but we know the endpoint returns a Document
  return geminiApiRequest.call(this, 'GET', `/${documentName}`) as Promise<Document>;
}
