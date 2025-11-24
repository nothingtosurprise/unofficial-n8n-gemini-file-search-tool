/**
 * Integration Test Fixtures
 * Test data, metadata examples, and sample queries
 */

import { FileSearchStore, Document, CustomMetadata, DocumentState } from '../../../utils/types';

/**
 * Sample Store Creation Payload
 */
export const createStorePayloads = {
  basic: {
    displayName: 'Integration Test Store - Basic',
  },

  withOptionalFields: {
    displayName: 'Integration Test Store - Full',
    description: 'A test store with all optional fields',
  },
};

/**
 * Sample Store Response Objects
 */
export const mockStores = {
  basic: {
    name: 'fileSearchStores/test-store-001',
    displayName: 'Integration Test Store - Basic',
    createTime: '2025-01-15T10:30:00Z',
    updateTime: '2025-01-15T10:30:00Z',
    activeDocumentsCount: '0',
    pendingDocumentsCount: '0',
    failedDocumentsCount: '0',
    sizeBytes: '0',
  } as FileSearchStore,

  withDocuments: {
    name: 'fileSearchStores/test-store-002',
    displayName: 'Integration Test Store - With Docs',
    createTime: '2025-01-15T10:30:00Z',
    updateTime: '2025-01-15T11:00:00Z',
    activeDocumentsCount: '3',
    pendingDocumentsCount: '1',
    failedDocumentsCount: '0',
    sizeBytes: '1024000',
  } as FileSearchStore,
};

/**
 * Sample Document Creation Payloads
 */
export const createDocumentPayloads = {
  basic: {
    displayName: 'test-document.pdf',
    mimeType: 'application/pdf',
  },

  withMetadata: {
    displayName: 'test-document-meta.pdf',
    mimeType: 'application/pdf',
    customMetadata: [
      {
        key: 'category',
        stringValue: 'technical',
      },
      {
        key: 'department',
        stringValue: 'engineering',
      },
      {
        key: 'version',
        numericValue: 2,
      },
    ],
  },

  withListMetadata: {
    displayName: 'test-document-list.pdf',
    mimeType: 'application/pdf',
    customMetadata: [
      {
        key: 'tags',
        stringListValue: {
          values: ['ai', 'search', 'integration'],
        },
      },
      {
        key: 'authors',
        stringListValue: {
          values: ['Alice', 'Bob'],
        },
      },
    ],
  },
};

/**
 * Sample Document Response Objects
 */
export const mockDocuments = {
  basic: {
    name: 'fileSearchStores/test-store-001/documents/doc-001',
    displayName: 'test-document.pdf',
    createTime: '2025-01-15T10:31:00Z',
    updateTime: '2025-01-15T10:31:00Z',
    state: DocumentState.STATE_ACTIVE,
    sizeBytes: '51200',
    mimeType: 'application/pdf',
  } as Document,

  withMetadata: {
    name: 'fileSearchStores/test-store-001/documents/doc-002',
    displayName: 'test-document-meta.pdf',
    createTime: '2025-01-15T10:32:00Z',
    updateTime: '2025-01-15T10:32:00Z',
    state: DocumentState.STATE_ACTIVE,
    sizeBytes: '102400',
    mimeType: 'application/pdf',
    customMetadata: [
      {
        key: 'category',
        stringValue: 'technical',
      },
      {
        key: 'department',
        stringValue: 'engineering',
      },
      {
        key: 'version',
        numericValue: 2,
      },
    ],
  } as Document,

  pending: {
    name: 'fileSearchStores/test-store-001/documents/doc-003',
    displayName: 'test-document-pending.pdf',
    createTime: '2025-01-15T10:33:00Z',
    updateTime: '2025-01-15T10:33:00Z',
    state: DocumentState.STATE_PENDING,
    sizeBytes: '51200',
    mimeType: 'application/pdf',
  } as Document,

  failed: {
    name: 'fileSearchStores/test-store-001/documents/doc-004',
    displayName: 'test-document-failed.pdf',
    createTime: '2025-01-15T10:34:00Z',
    updateTime: '2025-01-15T10:34:00Z',
    state: DocumentState.STATE_FAILED,
    sizeBytes: '0',
    mimeType: 'application/pdf',
  } as Document,
};

/**
 * Sample Query Payloads
 */
export const queryPayloads = {
  simple: {
    textQuery: 'integration test documentation',
  },

  withMetadataFilter: {
    textQuery: 'python implementation',
    metadataFilter: {
      key: 'category',
      stringValue: 'technical',
    },
  },

  withListFilter: {
    textQuery: 'search results',
    metadataFilter: {
      key: 'tags',
      stringListValue: {
        values: ['search'],
      },
    },
  },

  withNumericFilter: {
    textQuery: 'version 2 documentation',
    metadataFilter: {
      key: 'version',
      numericValue: 2,
    },
  },

  multipleMetadataFilters: {
    textQuery: 'engineering docs',
    metadataFilters: [
      {
        key: 'department',
        stringValue: 'engineering',
      },
      {
        key: 'status',
        stringValue: 'active',
      },
    ],
  },
};

/**
 * Sample Query Response
 */
export const mockQueryResponse = {
  answers: [
    {
      semanticAnswer: 'This is a semantic answer extracted from documents.',
      sources: [
        {
          document: 'fileSearchStores/test-store-001/documents/doc-001',
          snippets: [
            {
              content: 'Relevant snippet from document 1',
              startIndex: 100,
              endIndex: 150,
            },
          ],
        },
      ],
    },
  ],
};

/**
 * Sample Upload Request Payload
 */
export const uploadPayloads = {
  basic: {
    displayName: 'uploaded-document.pdf',
    mimeType: 'application/pdf',
  },

  withMetadata: {
    displayName: 'uploaded-document-meta.pdf',
    mimeType: 'application/pdf',
    customMetadata: [
      {
        key: 'source',
        stringValue: 'integration-test',
      },
      {
        key: 'uploadedAt',
        stringValue: new Date().toISOString(),
      },
    ],
  },

  textFile: {
    displayName: 'test-document.txt',
    mimeType: 'text/plain',
  },

  jsonFile: {
    displayName: 'test-data.json',
    mimeType: 'application/json',
  },

  markdownFile: {
    displayName: 'readme.md',
    mimeType: 'text/markdown',
  },
};

/**
 * Sample File Content for Testing
 */
export const sampleFileContents = {
  textDocument: `
# Integration Test Document

This is a sample text document for integration testing.

## Section 1: Introduction
Integration tests verify that different components work together correctly.

## Section 2: Key Topics
- File Search: Query documents by content
- Metadata: Add custom metadata to documents
- Stores: Organize documents into stores

## Section 3: Example Code
\`\`\`python
def search_documents(query: str):
    results = file_search_store.query(query)
    return results
\`\`\`

## Conclusion
This test document contains enough content for search operations.
  `.trim(),

  pdfContent: Buffer.from(
    '%PDF-1.4\n%Sample PDF content for testing\n' +
      '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n' +
      '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n' +
      '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >>\nendobj\n' +
      '4 0 obj\n<< >>\nstream\nBT /F1 12 Tf 100 700 Td (Integration Test PDF) Tj ET\nendstream\nendobj\nxref\ntrailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n500\n%%EOF',
  ),

  jsonData: {
    title: 'Integration Test Data',
    version: 1,
    testCases: [
      { id: 1, name: 'Test Case 1', status: 'pass' },
      { id: 2, name: 'Test Case 2', status: 'pass' },
      { id: 3, name: 'Test Case 3', status: 'pending' },
    ],
  },

  csvContent: `name,email,department,role
Alice Smith,alice@example.com,Engineering,Senior Engineer
Bob Johnson,bob@example.com,Product,Product Manager
Carol White,carol@example.com,Design,UX Designer
David Brown,david@example.com,Engineering,Junior Engineer`,
};

/**
 * Common Metadata Examples
 */
export const metadataExamples = {
  category: (value: string): CustomMetadata => ({
    key: 'category',
    stringValue: value,
  }),

  tags: (values: string[]): CustomMetadata => ({
    key: 'tags',
    stringListValue: { values },
  }),

  version: (value: number): CustomMetadata => ({
    key: 'version',
    numericValue: value,
  }),

  department: (value: string): CustomMetadata => ({
    key: 'department',
    stringValue: value,
  }),

  confidential: (value: boolean): CustomMetadata => ({
    key: 'confidential',
    stringValue: value ? 'true' : 'false',
  }),

  lastModified: (date: Date): CustomMetadata => ({
    key: 'lastModified',
    stringValue: date.toISOString(),
  }),
};

/**
 * Helper to create batch metadata
 */
export function createMetadata(...items: CustomMetadata[]): CustomMetadata[] {
  return items;
}

/**
 * Pagination Test Data
 */
export const paginationData = {
  page1: {
    documents: [mockDocuments.basic, mockDocuments.withMetadata],
    nextPageToken: 'token-2',
  },

  page2: {
    documents: [mockDocuments.pending, mockDocuments.failed],
    nextPageToken: undefined,
  },
};

/**
 * Error Response Examples
 */
export const errorResponses = {
  notFound: {
    error: {
      code: 404,
      message: 'Resource not found',
      status: 'NOT_FOUND',
    },
  },

  invalidArgument: {
    error: {
      code: 400,
      message: 'Invalid argument: displayName is required',
      status: 'INVALID_ARGUMENT',
    },
  },

  permissionDenied: {
    error: {
      code: 403,
      message: 'Permission denied on resource',
      status: 'PERMISSION_DENIED',
    },
  },

  quotaExceeded: {
    error: {
      code: 429,
      message: 'Quota exceeded',
      status: 'RESOURCE_EXHAUSTED',
    },
  },

  internalError: {
    error: {
      code: 500,
      message: 'Internal server error',
      status: 'INTERNAL',
    },
  },
};
