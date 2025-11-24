/**
 * Mock API Response Utilities
 * Provides mock responses for Gemini File Search API testing
 */

/**
 * Mock response for creating a file search store
 */
export const mockCreateStoreResponse = {
  name: 'stores/test-store-123',
  displayName: 'Test Store',
  createTime: '2024-01-01T00:00:00Z',
  updateTime: '2024-01-01T00:00:00Z',
};

/**
 * Mock response for listing stores
 */
export const mockListStoresResponse = {
  stores: [
    {
      name: 'stores/store-1',
      displayName: 'Store 1',
      createTime: '2024-01-01T00:00:00Z',
      updateTime: '2024-01-01T00:00:00Z',
    },
    {
      name: 'stores/store-2',
      displayName: 'Store 2',
      createTime: '2024-01-02T00:00:00Z',
      updateTime: '2024-01-02T00:00:00Z',
    },
  ],
  nextPageToken: 'next-page-token',
};

/**
 * Mock response for getting a store
 */
export const mockGetStoreResponse = {
  name: 'stores/test-store-123',
  displayName: 'Test Store',
  createTime: '2024-01-01T00:00:00Z',
  updateTime: '2024-01-01T00:00:00Z',
};

/**
 * Mock response for creating a document
 */
export const mockCreateDocumentResponse = {
  name: 'stores/test-store-123/documents/doc-456',
  displayName: 'test-document.pdf',
  mimeType: 'application/pdf',
  sizeBytes: '1024',
  createTime: '2024-01-01T00:00:00Z',
  updateTime: '2024-01-01T00:00:00Z',
  metadata: {},
};

/**
 * Mock response for listing documents
 */
export const mockListDocumentsResponse = {
  documents: [
    {
      name: 'stores/test-store-123/documents/doc-1',
      displayName: 'document1.pdf',
      mimeType: 'application/pdf',
      sizeBytes: '1024',
      createTime: '2024-01-01T00:00:00Z',
      updateTime: '2024-01-01T00:00:00Z',
    },
    {
      name: 'stores/test-store-123/documents/doc-2',
      displayName: 'document2.txt',
      mimeType: 'text/plain',
      sizeBytes: '512',
      createTime: '2024-01-02T00:00:00Z',
      updateTime: '2024-01-02T00:00:00Z',
    },
  ],
  nextPageToken: 'next-page-token',
};

/**
 * Mock error response
 */
export const mockErrorResponse = {
  error: {
    code: 400,
    message: 'Invalid request',
    status: 'INVALID_ARGUMENT',
  },
};
