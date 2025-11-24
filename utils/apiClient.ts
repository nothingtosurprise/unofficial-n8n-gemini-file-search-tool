import {
  IDataObject,
  IExecuteFunctions,
  ILoadOptionsFunctions,
  NodeApiError,
  NodeOperationError,
} from 'n8n-workflow';

/**
 * Makes a request to the Gemini API
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

  const options = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment
    method: method as any,
    body,
    qs: {
      ...qs,
      // eslint-disable-next-line @typescript-eslint/no-base-to-string, @typescript-eslint/restrict-template-expressions
      key: credentials.apiKey,
    },
    uri: `https://generativelanguage.googleapis.com/v1beta${endpoint}`,
    json: true,
  };

  try {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return await this.helpers.request(options);
  } catch (error) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument
    throw new NodeApiError(this.getNode(), error as any);
  }
}

/**
 * Makes paginated requests to retrieve all items
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
  const returnData: IDataObject[] = [];
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  let responseData;
  qs.pageSize = qs.pageSize || 20;

  do {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    responseData = await geminiApiRequest.call(this, method, endpoint, body, qs);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    qs.pageToken = responseData.nextPageToken;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access
    returnData.push(...(responseData[propertyName] || []));
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  } while (responseData.nextPageToken);

  return returnData;
}

/**
 * Performs a resumable upload for large files
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
  // eslint-disable-next-line @typescript-eslint/restrict-template-expressions, @typescript-eslint/no-base-to-string
  const uploadUrl = `https://generativelanguage.googleapis.com/upload/v1beta/${storeName}:uploadToFileSearchStore`;

  // Start upload session
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const startResponse = await this.helpers.request({
    method: 'POST',
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions, @typescript-eslint/no-base-to-string
    url: `${uploadUrl}?key=${credentials.apiKey}`,
    headers: {
      'X-Goog-Upload-Protocol': 'resumable',
      'X-Goog-Upload-Command': 'start',
      'X-Goog-Upload-Header-Content-Length': file.length.toString(),
      'X-Goog-Upload-Header-Content-Type': mimeType,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(metadata),
    resolveWithFullResponse: true,
  });

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
  const uploadSessionUrl = startResponse.headers['x-goog-upload-url'];

  // Upload file data
  // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-assignment
  return this.helpers.request({
    method: 'POST',
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
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
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function pollOperation(
  this: IExecuteFunctions,
  operationName: string,
  maxAttempts: number = 120,
  intervalMs: number = 5000,
): Promise<any> {
  for (let i = 0; i < maxAttempts; i++) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const operation = await geminiApiRequest.call(this, 'GET', `/${operationName}`);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (operation.done) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (operation.error) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/restrict-template-expressions, @typescript-eslint/no-base-to-string
        throw new NodeOperationError(
          this.getNode(),
          `Operation failed: ${operation.error.message}`,
          {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
            description: operation.error.details,
          },
        );
      }
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access
      return operation.response;
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  throw new NodeOperationError(this.getNode(), 'Operation timeout: exceeded 10 minutes');
}
