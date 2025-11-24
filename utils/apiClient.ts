import {
  IDataObject,
  IExecuteFunctions,
  ILoadOptionsFunctions,
  NodeApiError,
  NodeOperationError,
} from 'n8n-workflow';
import { Operation } from './types';

interface PaginatedResponse {
  nextPageToken?: string;
  [key: string]: unknown;
}

interface UploadStartResponse {
  headers: {
    'x-goog-upload-url'?: string;
    [key: string]: unknown;
  };
}

/**
 * Makes an HTTP request to the Google Gemini API with automatic authentication
 *
 * This function uses n8n's httpRequestWithAuthentication helper to automatically
 * inject the API key as a query parameter. The credential's authenticate property
 * defines how the API key is added to each request.
 *
 * @param this - n8n execution context (IExecuteFunctions or ILoadOptionsFunctions)
 * @param method - HTTP method (GET, POST, DELETE, etc.)
 * @param endpoint - API endpoint path starting with / (e.g., '/fileSearchStores')
 * @param body - Request body data (default: empty object)
 * @param qs - Query string parameters (default: empty object, API key added automatically by credential)
 * @returns Promise resolving to API response (structure varies by endpoint)
 * @throws {NodeApiError} When the API request fails or returns an error response
 *
 * @example
 * ```typescript
 * // Create a new file search store
 * const store = await geminiApiRequest.call(
 *   this,
 *   'POST',
 *   '/fileSearchStores',
 *   { displayName: 'My Store' }
 * );
 *
 * // Get a specific store
 * const store = await geminiApiRequest.call(
 *   this,
 *   'GET',
 *   '/fileSearchStores/store-id'
 * );
 * ```
 *
 * @internal Return type is 'any' due to n8n's dynamic response structures
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function geminiApiRequest(
  this: IExecuteFunctions | ILoadOptionsFunctions,
  method: string,
  endpoint: string,
  body: IDataObject = {},
  qs: IDataObject = {},
): Promise<any> {
  // Method must be 'any' as n8n accepts various HTTP method types
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
  const requestMethod: any = method;

  const options = {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    method: requestMethod,
    body,
    qs,
    url: `https://generativelanguage.googleapis.com/v1beta${endpoint}`,
    json: true,
  };

  try {
    // Use httpRequestWithAuthentication to automatically inject credentials
    // Must return 'any' as response structure varies by endpoint
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return await this.helpers.httpRequestWithAuthentication.call(this, 'geminiApi', options);
  } catch (error) {
    // NodeApiError constructor expects error object with compatible structure
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
    throw new NodeApiError(this.getNode(), error as any);
  }
}

/**
 * Retrieves all items from a paginated Gemini API endpoint
 *
 * This function automatically handles pagination by following nextPageToken values
 * until all items are retrieved. Default page size is 20 items per request.
 *
 * @param this - n8n execution context (IExecuteFunctions or ILoadOptionsFunctions)
 * @param propertyName - Name of the property containing items in response (e.g., 'fileSearchStores', 'documents')
 * @param method - HTTP method (typically 'GET' for list operations)
 * @param endpoint - API endpoint path starting with / (e.g., '/fileSearchStores')
 * @param body - Request body data (default: empty object)
 * @param qs - Query string parameters (default: empty object, pageSize and pageToken added automatically)
 * @returns Promise resolving to array of all items across all pages
 * @throws {NodeApiError} When any API request fails
 *
 * @example
 * ```typescript
 * // Get all file search stores
 * const stores = await geminiApiRequestAllItems.call(
 *   this,
 *   'fileSearchStores',
 *   'GET',
 *   '/fileSearchStores'
 * );
 * console.log(`Retrieved ${stores.length} stores`);
 *
 * // Get all documents from a store
 * const documents = await geminiApiRequestAllItems.call(
 *   this,
 *   'documents',
 *   'GET',
 *   '/fileSearchStores/store-id/documents'
 * );
 * ```
 *
 * @internal Return type is 'any[]' as item structure varies by endpoint
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function geminiApiRequestAllItems(
  this: IExecuteFunctions | ILoadOptionsFunctions,
  propertyName: string,
  method: string,
  endpoint: string,
  body: IDataObject = {},
  qs: IDataObject = {},
): Promise<any[]> {
  // Must use 'any[]' as items can be Documents, FileSearchStores, etc.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const returnData: any[] = [];
  qs.pageSize = qs.pageSize || 20;

  let responseData: PaginatedResponse;

  do {
    responseData = (await geminiApiRequest.call(
      this,
      method,
      endpoint,
      body,
      qs,
    )) as PaginatedResponse;
    qs.pageToken = responseData.nextPageToken;
    const items = responseData[propertyName];
    if (Array.isArray(items)) {
      // Items are typed as unknown[], but we know they match the expected type
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      returnData.push(...items);
    }
  } while (responseData.nextPageToken);

  // Must return 'any[]' as item type varies by endpoint
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return returnData;
}

/**
 * Performs a resumable upload of a file to a Gemini file search store
 *
 * This function implements Google's resumable upload protocol with two steps:
 * 1. Start upload session and receive upload URL
 * 2. Upload file data to the session URL
 *
 * Supports files up to 100MB with custom metadata and chunking configuration.
 *
 * @param this - n8n execution context (IExecuteFunctions)
 * @param storeName - Full store name (e.g., 'fileSearchStores/my-store-id')
 * @param file - File content as Buffer
 * @param mimeType - MIME type of the file (e.g., 'application/pdf', 'text/plain')
 * @param metadata - Document metadata including displayName, customMetadata, and chunkingConfig
 * @returns Promise resolving to Operation object tracking the upload status
 * @throws {NodeApiError} When upload session creation or file upload fails
 * @throws {NodeOperationError} When file size exceeds 100MB limit (validated before calling)
 *
 * @example
 * ```typescript
 * // Upload a PDF with metadata
 * const operation = await geminiResumableUpload.call(
 *   this,
 *   'fileSearchStores/my-store',
 *   fileBuffer,
 *   'application/pdf',
 *   {
 *     displayName: 'Technical Documentation',
 *     customMetadata: [
 *       { key: 'category', stringValue: 'docs' },
 *       { key: 'version', numericValue: 2.0 }
 *     ],
 *     chunkingConfig: {
 *       whiteSpaceConfig: {
 *         maxTokensPerChunk: 800,
 *         maxOverlapTokens: 100
 *       }
 *     }
 *   }
 * );
 * console.log(operation.name); // Use for polling operation status
 * ```
 *
 * @internal Return type is 'any' as response structure is defined by Google API
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function geminiResumableUpload(
  this: IExecuteFunctions,
  storeName: string,
  file: Buffer,
  mimeType: string,
  metadata: IDataObject,
): Promise<any> {
  const credentials = await this.getCredentials('geminiApi');
  const uploadUrl = `https://generativelanguage.googleapis.com/upload/v1beta/${storeName}:uploadToFileSearchStore`;

  // Start upload session
  const startResponse = (await this.helpers.request({
    method: 'POST',
    url: `${uploadUrl}?key=${credentials.apiKey as string}`,
    headers: {
      'X-Goog-Upload-Protocol': 'resumable',
      'X-Goog-Upload-Command': 'start',
      'X-Goog-Upload-Header-Content-Length': file.length.toString(),
      'X-Goog-Upload-Header-Content-Type': mimeType,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(metadata),
    resolveWithFullResponse: true,
  })) as UploadStartResponse;

  const uploadSessionUrl = startResponse.headers['x-goog-upload-url'] as string;

  // Upload file data
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return
  return this.helpers.request({
    method: 'POST',
    url: uploadSessionUrl,
    headers: {
      'Content-Length': file.length.toString(),
      'X-Goog-Upload-Offset': '0',
      'X-Goog-Upload-Command': 'upload, finalize',
    },
    body: file,
    json: true,
  });
}

/**
 * Polls a long-running Gemini API operation until it completes or times out
 *
 * This function repeatedly checks operation status at regular intervals until
 * the operation finishes (successfully or with error) or maximum attempts are reached.
 * Default timeout is 10 minutes (120 attempts × 5 seconds).
 *
 * @param this - n8n execution context (IExecuteFunctions)
 * @param operationName - Full operation name returned from API (e.g., 'operations/abc123')
 * @param maxAttempts - Maximum number of polling attempts (default: 120)
 * @param intervalMs - Milliseconds between polling attempts (default: 5000)
 * @returns Promise resolving to the operation response when done
 * @throws {NodeOperationError} When operation completes with error or exceeds timeout
 *
 * @example
 * ```typescript
 * // Poll an upload operation until completion
 * const uploadOp = await geminiResumableUpload.call(this, storeName, file, mime, metadata);
 * const result = await pollOperation.call(this, uploadOp.name);
 * console.log(result.name); // Document name: 'fileSearchStores/store/documents/doc-id'
 *
 * // Poll with custom timeout (30 seconds)
 * const result = await pollOperation.call(
 *   this,
 *   operationName,
 *   6,     // maxAttempts
 *   5000   // 6 × 5s = 30 seconds
 * );
 * ```
 *
 * @internal Return type is 'any' as response structure varies by operation type
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function pollOperation(
  this: IExecuteFunctions,
  operationName: string,
  maxAttempts: number = 120,
  intervalMs: number = 5000,
): Promise<any> {
  for (let i = 0; i < maxAttempts; i++) {
    const operation = (await geminiApiRequest.call(this, 'GET', `/${operationName}`)) as Operation;

    if (operation.done) {
      if (operation.error) {
        throw new NodeOperationError(
          this.getNode(),
          `Operation failed: ${operation.error.message}`,
          {
            description: operation.error.details
              ? JSON.stringify(operation.error.details)
              : undefined,
          },
        );
      }
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return operation.response;
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  throw new NodeOperationError(this.getNode(), 'Operation timeout: exceeded 10 minutes');
}
