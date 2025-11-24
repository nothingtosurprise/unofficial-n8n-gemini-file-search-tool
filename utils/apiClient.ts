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
 * Makes a request to the Gemini API
 * Note: Return type must be 'any' due to n8n's dynamic response structures
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function geminiApiRequest(
  this: IExecuteFunctions | ILoadOptionsFunctions,
  method: string,
  endpoint: string,
  body: IDataObject = {},
  qs: IDataObject = {},
): Promise<any> {
  const credentials = await this.getCredentials('geminiApi');

  // Method must be 'any' as n8n accepts various HTTP method types
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
  const requestMethod: any = method;

  const options = {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    method: requestMethod,
    body,
    qs: {
      ...qs,
      key: credentials.apiKey as string,
    },
    uri: `https://generativelanguage.googleapis.com/v1beta${endpoint}`,
    json: true,
  };

  try {
    // Must return 'any' as response structure varies by endpoint
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return await this.helpers.request(options);
  } catch (error) {
    // NodeApiError constructor expects error object with compatible structure
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
    throw new NodeApiError(this.getNode(), error as any);
  }
}

/**
 * Makes paginated requests to retrieve all items
 * Note: Return type must be 'any[]' as response structure varies by endpoint
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
 * Performs a resumable upload for large files
 * Note: Return type must be 'any' as response structure is defined by Google API
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
 * Polls a long-running operation until completion
 * Note: Return type must be 'any' as response structure varies by operation type
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
