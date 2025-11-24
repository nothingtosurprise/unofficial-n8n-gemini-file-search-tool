/**
 * Document Helper Functions for Integration Tests
 * Provides utilities for document operations in integration tests
 */

import { TEST_TIMEOUTS, formatTime } from '../setup/testEnvironment';
import { TEST_CONFIG } from '../setup/testEnvironment';
import { Document, CustomMetadata, DocumentState, Operation } from '../../../utils/types';

interface DocumentCreateRequest {
  displayName?: string;
  mimeType?: string;
  customMetadata?: CustomMetadata[];
  [key: string]: unknown;
}

interface PaginatedDocumentsResponse {
  documents?: Document[];
  nextPageToken?: string;
}

interface QueryRequest {
  textQuery?: string;
  metadataFilter?: CustomMetadata;
  metadataFilters?: CustomMetadata[];
}

/**
 * Makes an authenticated API request to the Gemini API
 */
async function makeGeminiRequest<T>(method: string, endpoint: string, body?: unknown): Promise<T> {
  // Use & if endpoint already has query parameters, otherwise use ?
  const separator = endpoint.includes('?') ? '&' : '?';
  const url = `${TEST_CONFIG.baseUrl}${endpoint}${separator}key=${TEST_CONFIG.apiKey}`;

  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`API request failed: ${response.status} ${response.statusText}\n${errorBody}`);
  }

  if (response.status === 204) {
    return { success: true } as unknown as T;
  }

  const contentType = response.headers.get('content-type');
  if (contentType?.includes('application/json')) {
    return response.json() as Promise<T>;
  }

  return {} as T;
}

/**
 * Uploads a document to a store
 * @param storeName Store name
 * @param fileBuffer File content as buffer
 * @param displayName Display name for the document
 * @param mimeType MIME type of the file
 * @param metadata Optional custom metadata
 * @returns Created document
 */
export async function uploadTestDocument(
  storeName: string,
  fileBuffer: Buffer,
  displayName: string,
  mimeType: string = 'application/pdf',
  metadata?: CustomMetadata[],
  timeout: number = TEST_TIMEOUTS.upload,
): Promise<Document> {
  const storeId = storeName.split('/').pop() || storeName;
  console.log(`\n📄 Uploading document: ${displayName}`);
  console.log(`    Store: ${storeId}`);
  console.log(`    Size: ${(fileBuffer.length / 1024).toFixed(2)}KB`);

  const startTime = Date.now();

  const payload: DocumentCreateRequest = {
    displayName,
    mimeType,
  };

  if (metadata && metadata.length > 0) {
    payload.customMetadata = metadata;
    console.log(`    Metadata: ${metadata.map((m) => m.key).join(', ')}`);
  }

  try {
    // Start resumable upload session
    // Note: Upload endpoint has /upload before /v1beta
    const baseWithoutVersion = TEST_CONFIG.baseUrl.replace('/v1beta', '');
    const uploadUrl = `${baseWithoutVersion}/upload/v1beta/fileSearchStores/${storeId}:uploadToFileSearchStore?key=${TEST_CONFIG.apiKey}`;

    const startResponse = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'X-Goog-Upload-Protocol': 'resumable',
        'X-Goog-Upload-Command': 'start',
        'X-Goog-Upload-Header-Content-Length': fileBuffer.length.toString(),
        'X-Goog-Upload-Header-Content-Type': mimeType,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!startResponse.ok) {
      throw new Error(
        `Failed to start upload: ${startResponse.status} ${startResponse.statusText}`,
      );
    }

    const uploadSessionUrl = startResponse.headers.get('x-goog-upload-url');
    if (!uploadSessionUrl) {
      throw new Error('No upload session URL in response');
    }

    // Upload file data
    const uploadResponse = await fetch(uploadSessionUrl, {
      method: 'POST',
      headers: {
        'Content-Length': fileBuffer.length.toString(),
        'X-Goog-Upload-Offset': '0',
        'X-Goog-Upload-Command': 'upload, finalize',
      },
      body: fileBuffer,
    });

    if (!uploadResponse.ok) {
      throw new Error(`Upload failed: ${uploadResponse.status} ${uploadResponse.statusText}`);
    }

    const operation = (await uploadResponse.json()) as Operation;
    const uploadElapsed = formatTime(Date.now() - startTime);

    // Extract document name from operation response
    const documentName = operation.response?.documentName as string;
    if (!documentName) {
      throw new Error(
        `Upload operation did not return a documentName. Operation: ${JSON.stringify(operation)}`,
      );
    }

    console.log(`  ✓ Document upload operation completed (${uploadElapsed})`);
    console.log(`    Document name: ${documentName}`);

    // Extract document ID and fetch full document details
    const docId = documentName.split('/').pop() || '';
    const document = await getTestDocument(storeName, docId);

    return document;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`  ✗ Failed to upload document: ${errorMsg}`);
    throw error;
  }
}

/**
 * Imports a document from Google Files API
 * @param storeName Store name
 * @param fileUri URI of the file in Google Files API
 * @param customMetadata Optional metadata
 * @returns Created document
 */
export async function importTestDocument(
  storeName: string,
  fileUri: string,
  customMetadata?: CustomMetadata[],
  timeout: number = TEST_TIMEOUTS.api,
): Promise<Document> {
  const storeId = storeName.split('/').pop() || storeName;
  console.log(`\n📄 Importing document: ${fileUri}`);
  console.log(`    Store: ${storeId}`);

  const startTime = Date.now();

  const payload: DocumentCreateRequest = {
    importReferenceSource: {
      fileUri,
    },
  };

  if (customMetadata && customMetadata.length > 0) {
    payload.customMetadata = customMetadata;
  }

  try {
    const document = await makeGeminiRequest<Document>(
      'POST',
      `/fileSearchStores/${storeId}/documents`,
      payload,
    );

    const elapsed = formatTime(Date.now() - startTime);
    console.log(`  ✓ Document imported: ${document.name} (${elapsed})`);

    return document;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`  ✗ Failed to import document: ${errorMsg}`);
    throw error;
  }
}

/**
 * Lists documents in a store (paginated)
 * @param storeName Store name
 * @param pageSize Page size
 * @param pageToken Optional page token
 * @returns Documents and next page token
 */
export async function listTestDocuments(
  storeName: string,
  pageSize: number = 20,
  pageToken?: string,
  timeout: number = TEST_TIMEOUTS.api,
): Promise<{
  documents: Document[];
  nextPageToken?: string;
}> {
  const storeId = storeName.split('/').pop() || storeName;
  console.log(`\n📄 Listing documents (store: ${storeId}, page size: ${pageSize})`);

  const startTime = Date.now();
  const params = new URLSearchParams();
  params.append('pageSize', pageSize.toString());
  if (pageToken) {
    params.append('pageToken', pageToken);
  }

  try {
    const response = await makeGeminiRequest<PaginatedDocumentsResponse>(
      'GET',
      `/fileSearchStores/${storeId}/documents?${params.toString()}`,
    );

    const documents = response.documents || [];
    const elapsed = formatTime(Date.now() - startTime);

    console.log(`  ✓ Retrieved ${documents.length} documents (${elapsed})`);
    documents.forEach((doc) => {
      console.log(`    - ${doc.displayName} [${doc.state}]`);
    });

    if (response.nextPageToken) {
      console.log(
        `  📄 More results available (token: ${response.nextPageToken.substring(0, 10)}...)`,
      );
    }

    return {
      documents,
      nextPageToken: response.nextPageToken,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`  ✗ Failed to list documents: ${errorMsg}`);
    throw error;
  }
}

/**
 * Gets a specific document
 * @param storeName Store name
 * @param documentId Document ID
 * @returns Document object
 */
export async function getTestDocument(
  storeName: string,
  documentId: string,
  timeout: number = TEST_TIMEOUTS.api,
): Promise<Document> {
  const storeId = storeName.split('/').pop() || storeName;
  console.log(`\n📄 Getting document: ${documentId}`);

  const startTime = Date.now();

  try {
    const document = await makeGeminiRequest<Document>(
      'GET',
      `/fileSearchStores/${storeId}/documents/${documentId}`,
    );

    const elapsed = formatTime(Date.now() - startTime);
    console.log(`  ✓ Retrieved document (${elapsed})`);
    console.log(`    Display Name: ${document.displayName}`);
    console.log(`    State: ${document.state}`);
    console.log(`    Size: ${(parseInt(document.sizeBytes) / 1024).toFixed(2)}KB`);

    return document;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`  ✗ Failed to get document: ${errorMsg}`);
    throw error;
  }
}

/**
 * Deletes a document
 * @param storeName Store name
 * @param documentId Document ID
 * @param force Force delete
 * @returns True if deleted successfully
 */
export async function deleteTestDocument(
  storeName: string,
  documentId: string,
  force: boolean = true,
  timeout: number = TEST_TIMEOUTS.api,
): Promise<boolean> {
  const storeId = storeName.split('/').pop() || storeName;
  console.log(`\n📄 Deleting document: ${documentId}`);

  const startTime = Date.now();
  const endpoint = force
    ? `/fileSearchStores/${storeId}/documents/${documentId}?force=true`
    : `/fileSearchStores/${storeId}/documents/${documentId}`;

  try {
    await makeGeminiRequest('DELETE', endpoint);

    const elapsed = formatTime(Date.now() - startTime);
    console.log(`  ✓ Document deleted successfully (${elapsed})`);
    return true;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`  ✗ Failed to delete document: ${errorMsg}`);
    throw error;
  }
}

/**
 * Queries documents in a store using file search
 * @param storeName Store name
 * @param query Query text
 * @param metadataFilter Optional metadata filter
 * @returns Query results
 */
export async function queryTestDocuments(
  storeName: string,
  query: string,
  metadataFilter?: CustomMetadata,
  timeout: number = TEST_TIMEOUTS.query,
): Promise<unknown> {
  const storeId = storeName.split('/').pop() || storeName;
  console.log(`\n🔍 Querying documents: "${query}"`);
  console.log(`    Store: ${storeId}`);

  const startTime = Date.now();

  const payload: QueryRequest = {
    textQuery: query,
  };

  if (metadataFilter) {
    payload.metadataFilter = metadataFilter;
    console.log(
      `    Filter: ${metadataFilter.key}=${metadataFilter.stringValue || metadataFilter.numericValue}`,
    );
  }

  try {
    // Note: Actual query implementation depends on Gemini API structure
    // This is a placeholder for the query endpoint
    const results = await makeGeminiRequest(
      'POST',
      `/fileSearchStores/${storeId}/documents:search`,
      payload,
    );

    const elapsed = formatTime(Date.now() - startTime);
    console.log(`  ✓ Query completed (${elapsed})`);

    return results;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`  ✗ Failed to query documents: ${errorMsg}`);
    throw error;
  }
}

/**
 * Waits for a document to be processed
 * @param storeName Store name
 * @param documentId Document ID
 * @param expectedState Expected document state
 * @returns Final document state
 */
export async function waitForDocumentProcessing(
  storeName: string,
  documentId: string,
  expectedState: DocumentState = DocumentState.STATE_ACTIVE,
  timeout: number = TEST_TIMEOUTS.poll,
  pollInterval: number = 5000,
): Promise<Document> {
  console.log(`\n⏳ Waiting for document processing: ${documentId}`);
  console.log(`    Expected state: ${expectedState}`);

  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    try {
      const document = await getTestDocument(storeName, documentId);

      if (document.state === expectedState) {
        const elapsed = formatTime(Date.now() - startTime);
        console.log(`  ✓ Document is ready (${elapsed})`);
        return document;
      }

      if (document.state === DocumentState.STATE_FAILED) {
        throw new Error(`Document processing failed: ${documentId}`);
      }

      console.log(`  ⏳ Still processing... (current state: ${document.state})`);
      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.warn(`  ⚠ Error checking document status: ${errorMsg}`);
      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }
  }

  throw new Error(
    `Document did not reach ${expectedState} within ${formatTime(timeout)}: ${documentId}`,
  );
}

/**
 * Batch uploads multiple documents
 * @param storeName Store name
 * @param documents Array of {buffer, displayName, mimeType, metadata?}
 * @param concurrency Number of concurrent uploads
 * @returns Array of created documents
 */
export async function batchUploadDocuments(
  storeName: string,
  documents: Array<{
    buffer: Buffer;
    displayName: string;
    mimeType?: string;
    metadata?: CustomMetadata[];
  }>,
  concurrency: number = 3,
): Promise<Document[]> {
  console.log(`\n📄 Batch uploading ${documents.length} documents`);

  const results: Document[] = [];
  const errors: Array<{ doc: string; error: string }> = [];

  // Process in batches
  for (let i = 0; i < documents.length; i += concurrency) {
    const batch = documents.slice(i, i + concurrency);
    const promises = batch.map((doc) =>
      uploadTestDocument(
        storeName,
        doc.buffer,
        doc.displayName,
        doc.mimeType || 'application/pdf',
        doc.metadata,
      ).catch((error) => ({
        error: true,
        displayName: doc.displayName,
        message: error instanceof Error ? error.message : String(error),
      })),
    );

    const batchResults = await Promise.all(promises);
    batchResults.forEach((result) => {
      if ('error' in result && result.error) {
        errors.push({
          doc: result.displayName,
          error: result.message,
        });
      } else {
        results.push(result as Document);
      }
    });
  }

  console.log(`  ✓ Batch upload complete: ${results.length} succeeded, ${errors.length} failed`);

  if (errors.length > 0) {
    console.log(`  Failed uploads:`);
    errors.forEach(({ doc, error }) => {
      console.log(`    - ${doc}: ${error}`);
    });
  }

  return results;
}

/**
 * Verifies document exists and has expected properties
 * @param storeName Store name
 * @param documentId Document ID
 * @param expectedDisplayName Expected display name
 * @param expectedState Expected state
 * @returns True if verification passed
 */
export async function verifyDocument(
  storeName: string,
  documentId: string,
  expectedDisplayName?: string,
  expectedState?: DocumentState,
): Promise<boolean> {
  try {
    const document = await getTestDocument(storeName, documentId);

    const checks = [
      expectedDisplayName ? document.displayName === expectedDisplayName : true,
      expectedState ? document.state === expectedState : true,
    ];

    if (!checks.every((c) => c)) {
      console.warn(`\n⚠ Document verification failed:`);
      if (expectedDisplayName && document.displayName !== expectedDisplayName) {
        console.warn(
          `  Display Name: expected "${expectedDisplayName}", got "${document.displayName}"`,
        );
      }
      if (expectedState && document.state !== expectedState) {
        console.warn(`  State: expected "${expectedState}", got "${document.state}"`);
      }
      return false;
    }

    console.log(`\n✓ Document verification passed`);
    return true;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`  ✗ Document verification error: ${errorMsg}`);
    return false;
  }
}
