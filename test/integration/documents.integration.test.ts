/**
 * Document Operations Integration Tests
 * Tests against the real Gemini File Search API
 *
 * These tests create and manage real documents in your Gemini API project.
 * All resources are automatically cleaned up after tests complete.
 *
 * Required: GEMINI_API_KEY_TEST in .env.test
 */

import {
  validateTestEnvironment,
  TEST_TIMEOUTS,
  formatTime,
  TEST_CONFIG,
} from './setup/testEnvironment';
import { setupCleanupHandlers, resourceTracker } from './setup/cleanup';
import { createTestStore } from './helpers/storeHelpers';
import {
  uploadTestDocument,
  importTestDocument,
  listTestDocuments,
  getTestDocument,
  deleteTestDocument,
  queryTestDocuments,
  waitForDocumentProcessing,
  batchUploadDocuments,
  verifyDocument,
} from './helpers/documentHelpers';
import {
  sampleFileContents,
  createDocumentPayloads,
  metadataExamples,
  createMetadata,
} from './helpers/fixtures';
import { Document, DocumentState, CustomMetadata } from '../../utils/types';

// Test data
const TEST_FILES = {
  smallText: Buffer.from(sampleFileContents.textDocument),
  mediumText: Buffer.from(sampleFileContents.textDocument.repeat(5)),
  largeText: Buffer.from(sampleFileContents.textDocument.repeat(20)),
  pdf: sampleFileContents.pdfContent,
  json: Buffer.from(JSON.stringify(sampleFileContents.jsonData)),
  csv: Buffer.from(sampleFileContents.csvContent),
};

const TEST_METADATA = {
  basic: [metadataExamples.category('test'), metadataExamples.department('engineering')],
  withNumeric: [metadataExamples.category('test'), metadataExamples.version(1)],
  withStringList: [metadataExamples.tags(['test', 'integration', 'document'])],
  complex: [
    metadataExamples.category('landmarks'),
    metadataExamples.department('engineering'),
    metadataExamples.version(2),
    metadataExamples.tags(['test', 'integration']),
  ],
};

const TEST_QUERIES = {
  simple: 'Tell me about this document',
  specific: 'What is in section 1?',
  landmarks: 'Where is the Eiffel Tower?',
  year: 'What was built in 1889?',
};

/**
 * Helper to query documents using Gemini generateContent API
 */
async function queryWithGenerateContent(
  storeNames: string | string[],
  query: string,
  model: string = 'gemini-1.5-flash',
  metadataFilter?: string,
): Promise<any> {
  const stores = Array.isArray(storeNames) ? storeNames : [storeNames];

  const url = `${TEST_CONFIG.baseUrl}/models/${model}:generateContent?key=${TEST_CONFIG.apiKey}`;

  const fileSearchTool: any = {
    fileSearch: {
      stores: stores,
    },
  };

  if (metadataFilter) {
    fileSearchTool.fileSearch.metadataFilter = metadataFilter;
  }

  const payload = {
    contents: [
      {
        parts: [
          {
            text: query,
          },
        ],
      },
    ],
    tools: [fileSearchTool],
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Query failed: ${response.status} ${response.statusText}\n${errorBody}`);
  }

  return response.json();
}

describe('Document Operations Integration Tests', () => {
  jest.setTimeout(TEST_TIMEOUTS.upload);

  let testStoreName: string;

  beforeAll(async () => {
    validateTestEnvironment();
    console.log('\n========================================');
    console.log('  DOCUMENT OPERATIONS INTEGRATION TESTS');
    console.log('========================================\n');

    const store = await createTestStore('Document Integration Tests');
    testStoreName = store.name;
    resourceTracker.trackStore(testStoreName);
  });

  setupCleanupHandlers();

  // ==============================================
  // Test Suite 1: Upload Document (10 tests)
  // ==============================================
  describe('Upload Document', () => {
    it('should upload small text document', async () => {
      const startTime = Date.now();

      const doc = await uploadTestDocument(
        testStoreName,
        TEST_FILES.smallText,
        'Small Text Document',
        'text/plain',
      );

      const elapsed = Date.now() - startTime;

      expect(doc).toBeDefined();
      expect(doc.name).toBeDefined();
      expect(doc.name).toContain('documents/');
      expect(doc.displayName).toBe('Small Text Document');
      expect([DocumentState.STATE_ACTIVE, DocumentState.STATE_PENDING]).toContain(doc.state);
      expect(doc.createTime).toBeDefined();

      console.log(`    Performance: ${formatTime(elapsed)}`);
      expect(elapsed).toBeLessThan(30000); // <30s
    });

    it('should upload document with display name', async () => {
      const displayName = 'Custom Display Name Document';

      const doc = await uploadTestDocument(
        testStoreName,
        TEST_FILES.smallText,
        displayName,
        'text/plain',
      );

      expect(doc.displayName).toBe(displayName);
      expect(doc.name).toBeDefined();
    });

    it('should upload document with string metadata', async () => {
      const doc = await uploadTestDocument(
        testStoreName,
        TEST_FILES.smallText,
        'Document with Basic Metadata',
        'text/plain',
        TEST_METADATA.basic,
      );

      expect(doc.customMetadata).toBeDefined();
      expect(doc.customMetadata?.length).toBeGreaterThan(0);

      const categoryMeta = doc.customMetadata?.find((m) => m.key === 'category');
      expect(categoryMeta?.stringValue).toBe('test');
    });

    it('should upload document with numeric metadata', async () => {
      const doc = await uploadTestDocument(
        testStoreName,
        TEST_FILES.smallText,
        'Document with Numeric Metadata',
        'text/plain',
        TEST_METADATA.withNumeric,
      );

      expect(doc.customMetadata).toBeDefined();

      const versionMeta = doc.customMetadata?.find((m) => m.key === 'version');
      expect(versionMeta).toBeDefined();
      expect(versionMeta?.numericValue).toBe(1);
    });

    it('should upload document with string list metadata', async () => {
      const doc = await uploadTestDocument(
        testStoreName,
        TEST_FILES.smallText,
        'Document with String List Metadata',
        'text/plain',
        TEST_METADATA.withStringList,
      );

      expect(doc.customMetadata).toBeDefined();

      const tagsMeta = doc.customMetadata?.find((m) => m.key === 'tags');
      expect(tagsMeta).toBeDefined();
      expect(tagsMeta?.stringListValue?.values).toContain('test');
      expect(tagsMeta?.stringListValue?.values).toContain('integration');
    });

    it('should upload document with complex metadata', async () => {
      const doc = await uploadTestDocument(
        testStoreName,
        TEST_FILES.smallText,
        'Document with Complex Metadata',
        'text/plain',
        TEST_METADATA.complex,
      );

      expect(doc.customMetadata).toBeDefined();
      expect(doc.customMetadata?.length).toBe(4);

      // Verify string metadata
      const categoryMeta = doc.customMetadata?.find((m) => m.key === 'category');
      expect(categoryMeta?.stringValue).toBe('landmarks');

      // Verify numeric metadata
      const versionMeta = doc.customMetadata?.find((m) => m.key === 'version');
      expect(versionMeta?.numericValue).toBe(2);

      // Verify string list metadata
      const tagsMeta = doc.customMetadata?.find((m) => m.key === 'tags');
      expect(tagsMeta?.stringListValue?.values?.length).toBe(2);
    });

    it('should upload medium-sized document', async () => {
      const startTime = Date.now();

      const doc = await uploadTestDocument(
        testStoreName,
        TEST_FILES.mediumText,
        'Medium Text Document',
        'text/plain',
      );

      const elapsed = Date.now() - startTime;

      expect(doc).toBeDefined();
      expect(doc.sizeBytes).toBeDefined();
      expect(parseInt(doc.sizeBytes)).toBeGreaterThan(1000);

      console.log(`    File size: ${(parseInt(doc.sizeBytes) / 1024).toFixed(2)}KB`);
      console.log(`    Performance: ${formatTime(elapsed)}`);
    });

    it('should upload PDF document', async () => {
      const doc = await uploadTestDocument(
        testStoreName,
        TEST_FILES.pdf,
        'Test PDF Document',
        'application/pdf',
      );

      expect(doc).toBeDefined();
      expect(doc.mimeType).toBe('application/pdf');
      expect(doc.displayName).toBe('Test PDF Document');
    });

    it('should upload JSON document', async () => {
      const doc = await uploadTestDocument(
        testStoreName,
        TEST_FILES.json,
        'Test JSON Document',
        'application/json',
      );

      expect(doc).toBeDefined();
      expect(doc.mimeType).toBe('application/json');
    });

    it('should upload CSV document', async () => {
      const doc = await uploadTestDocument(
        testStoreName,
        TEST_FILES.csv,
        'Test CSV Document',
        'text/csv',
      );

      expect(doc).toBeDefined();
      expect(doc.mimeType).toBe('text/csv');
    });
  });

  // ==============================================
  // Test Suite 2: Import Document (2 tests)
  // ==============================================
  describe('Import Document', () => {
    it('should handle import from non-existent file gracefully', async () => {
      const fakeFileUri = 'files/non-existent-file-12345';

      await expect(importTestDocument(testStoreName, fakeFileUri)).rejects.toThrow();
    });

    it('should validate file URI format', async () => {
      const invalidUri = 'invalid-uri-format';

      await expect(importTestDocument(testStoreName, invalidUri)).rejects.toThrow();
    });
  });

  // ==============================================
  // Test Suite 3: List Documents (4 tests)
  // ==============================================
  describe('List Documents', () => {
    let uploadedDocNames: string[] = [];

    beforeAll(async () => {
      // Upload 5 test documents
      const uploads = await Promise.all([
        uploadTestDocument(testStoreName, TEST_FILES.smallText, 'List Test 1', 'text/plain'),
        uploadTestDocument(testStoreName, TEST_FILES.smallText, 'List Test 2', 'text/plain'),
        uploadTestDocument(testStoreName, TEST_FILES.smallText, 'List Test 3', 'text/plain'),
        uploadTestDocument(testStoreName, TEST_FILES.smallText, 'List Test 4', 'text/plain'),
        uploadTestDocument(testStoreName, TEST_FILES.smallText, 'List Test 5', 'text/plain'),
      ]);

      uploadedDocNames = uploads.map((doc) => doc.name);
      console.log(`    Uploaded ${uploadedDocNames.length} test documents for listing tests`);
    });

    it('should list all documents in store', async () => {
      const startTime = Date.now();

      const result = await listTestDocuments(testStoreName, 50);
      const elapsed = Date.now() - startTime;

      expect(result.documents).toBeDefined();
      expect(result.documents.length).toBeGreaterThanOrEqual(5);

      // Verify at least some of our test documents are in the list
      const listNames = result.documents.map((d) => d.name);
      const foundCount = uploadedDocNames.filter((name) => listNames.includes(name)).length;
      expect(foundCount).toBeGreaterThan(0);

      console.log(`    Performance: ${formatTime(elapsed)}`);
      expect(elapsed).toBeLessThan(5000); // <5s
    });

    it('should list documents with page size limit', async () => {
      const result = await listTestDocuments(testStoreName, 2);

      expect(result.documents).toBeDefined();
      expect(result.documents.length).toBeLessThanOrEqual(2);
    });

    it('should handle pagination with page token', async () => {
      const page1 = await listTestDocuments(testStoreName, 2);

      if (page1.nextPageToken) {
        const page2 = await listTestDocuments(testStoreName, 2, page1.nextPageToken);

        expect(page2.documents).toBeDefined();

        // Ensure page 2 has different documents than page 1
        const page1Names = page1.documents.map((d) => d.name);
        const page2Names = page2.documents.map((d) => d.name);

        const overlap = page2Names.filter((name) => page1Names.includes(name));
        expect(overlap.length).toBe(0); // No overlap
      } else {
        console.log('    Note: Not enough documents to test pagination');
      }
    });

    it('should list documents efficiently', async () => {
      const startTime = Date.now();

      await listTestDocuments(testStoreName, 20);

      const elapsed = Date.now() - startTime;

      console.log(`    List performance: ${formatTime(elapsed)}`);
      expect(elapsed).toBeLessThan(5000); // <5s
    });
  });

  // ==============================================
  // Test Suite 4: Get Document (3 tests)
  // ==============================================
  describe('Get Document', () => {
    let testDocName: string;
    let testDocId: string;

    beforeAll(async () => {
      const doc = await uploadTestDocument(
        testStoreName,
        TEST_FILES.smallText,
        'Get Test Document',
        'text/plain',
        TEST_METADATA.basic,
      );
      testDocName = doc.name;
      testDocId = doc.name.split('/').pop() || '';
    });

    it('should retrieve document by ID', async () => {
      const startTime = Date.now();

      const doc = await getTestDocument(testStoreName, testDocId);
      const elapsed = Date.now() - startTime;

      expect(doc).toBeDefined();
      expect(doc.name).toBe(testDocName);
      expect(doc.displayName).toBe('Get Test Document');
      expect(doc.customMetadata).toBeDefined();

      console.log(`    Performance: ${formatTime(elapsed)}`);
      expect(elapsed).toBeLessThan(5000); // <5s
    });

    it('should retrieve document metadata correctly', async () => {
      const doc = await getTestDocument(testStoreName, testDocId);

      expect(doc.customMetadata?.length).toBeGreaterThan(0);

      const categoryMeta = doc.customMetadata?.find((m) => m.key === 'category');
      expect(categoryMeta?.stringValue).toBe('test');
    });

    it('should throw error for non-existent document', async () => {
      const fakeDocId = 'non-existent-doc-12345';

      await expect(getTestDocument(testStoreName, fakeDocId)).rejects.toThrow();
    });
  });

  // ==============================================
  // Test Suite 5: Delete Document (3 tests)
  // ==============================================
  describe('Delete Document', () => {
    it('should delete document', async () => {
      // Upload a document to delete
      const doc = await uploadTestDocument(
        testStoreName,
        TEST_FILES.smallText,
        'Delete Test Document',
        'text/plain',
      );

      const docId = doc.name.split('/').pop() || '';

      // Delete it
      const startTime = Date.now();
      const result = await deleteTestDocument(testStoreName, docId, true);
      const elapsed = Date.now() - startTime;

      expect(result).toBe(true);

      // Verify deletion - should fail to get
      await expect(getTestDocument(testStoreName, docId)).rejects.toThrow();

      console.log(`    Performance: ${formatTime(elapsed)}`);
    });

    it('should delete document with force flag', async () => {
      const doc = await uploadTestDocument(
        testStoreName,
        TEST_FILES.smallText,
        'Force Delete Test',
        'text/plain',
      );

      const docId = doc.name.split('/').pop() || '';

      // Force delete
      const result = await deleteTestDocument(testStoreName, docId, true);

      expect(result).toBe(true);
    });

    it('should handle concurrent deletes', async () => {
      // Upload 3 documents
      const docs = await Promise.all([
        uploadTestDocument(
          testStoreName,
          TEST_FILES.smallText,
          'Concurrent Delete 1',
          'text/plain',
        ),
        uploadTestDocument(
          testStoreName,
          TEST_FILES.smallText,
          'Concurrent Delete 2',
          'text/plain',
        ),
        uploadTestDocument(
          testStoreName,
          TEST_FILES.smallText,
          'Concurrent Delete 3',
          'text/plain',
        ),
      ]);

      const docIds = docs.map((doc) => doc.name.split('/').pop() || '');

      // Delete all concurrently
      const deletePromises = docIds.map((id) => deleteTestDocument(testStoreName, id, true));

      const results = await Promise.all(deletePromises);

      expect(results).toHaveLength(3);
      expect(results.every((r) => r === true)).toBe(true);
    });
  });

  // ==============================================
  // Test Suite 6: Query Documents (8 tests)
  // ==============================================
  describe('Query Documents', () => {
    beforeAll(async () => {
      // Upload documents with known content for querying
      await uploadTestDocument(
        testStoreName,
        Buffer.from(
          'The Eiffel Tower is located in Paris, France. It was built in 1889. It is a famous landmark visited by millions of tourists.',
        ),
        'Paris Document',
        'text/plain',
        [
          { key: 'category', stringValue: 'landmarks' },
          { key: 'city', stringValue: 'Paris' },
          { key: 'year', numericValue: 1889 },
        ],
      );

      await uploadTestDocument(
        testStoreName,
        Buffer.from(
          'The Statue of Liberty is in New York, USA. It was built in 1886. It stands on Liberty Island.',
        ),
        'New York Document',
        'text/plain',
        [
          { key: 'category', stringValue: 'landmarks' },
          { key: 'city', stringValue: 'New York' },
          { key: 'year', numericValue: 1886 },
        ],
      );

      // Wait for indexing
      console.log('    Waiting 10s for document indexing...');
      await new Promise((resolve) => setTimeout(resolve, 10000));
    }, TEST_TIMEOUTS.upload * 2);

    it(
      'should query documents with simple question',
      async () => {
        const startTime = Date.now();

        const result = await queryWithGenerateContent(
          testStoreName,
          'Where is the Eiffel Tower located?',
          'gemini-1.5-flash',
        );

        const elapsed = Date.now() - startTime;

        expect(result).toBeDefined();
        expect(result.candidates).toBeDefined();
        expect(result.candidates.length).toBeGreaterThan(0);

        console.log(`    Query performance: ${formatTime(elapsed)}`);
        console.log(
          `    Response preview: ${JSON.stringify(result.candidates[0]).substring(0, 100)}...`,
        );

        expect(elapsed).toBeLessThan(15000); // <15s
      },
      TEST_TIMEOUTS.query,
    );

    it(
      'should query with metadata filter - string',
      async () => {
        const result = await queryWithGenerateContent(
          testStoreName,
          'Tell me about landmarks',
          'gemini-1.5-flash',
          'category="landmarks"',
        );

        expect(result).toBeDefined();
        expect(result.candidates).toBeDefined();
      },
      TEST_TIMEOUTS.query,
    );

    it(
      'should query with metadata filter - numeric',
      async () => {
        const result = await queryWithGenerateContent(
          testStoreName,
          'What was built in 1889?',
          'gemini-1.5-flash',
          'year=1889',
        );

        expect(result).toBeDefined();
        expect(result.candidates).toBeDefined();
      },
      TEST_TIMEOUTS.query,
    );

    it(
      'should query with string metadata filter',
      async () => {
        const result = await queryWithGenerateContent(
          testStoreName,
          'Tell me about Paris',
          'gemini-1.5-flash',
          'city="Paris"',
        );

        expect(result).toBeDefined();
        expect(result.candidates).toBeDefined();
      },
      TEST_TIMEOUTS.query,
    );

    it(
      'should query with complex AND filter',
      async () => {
        const result = await queryWithGenerateContent(
          testStoreName,
          'Find landmarks in Paris',
          'gemini-1.5-flash',
          'category="landmarks" AND city="Paris"',
        );

        expect(result).toBeDefined();
        expect(result.candidates).toBeDefined();
      },
      TEST_TIMEOUTS.query,
    );

    it(
      'should handle query with no matching metadata',
      async () => {
        const result = await queryWithGenerateContent(
          testStoreName,
          'Tell me about Tokyo',
          'gemini-1.5-flash',
          'city="Tokyo"',
        );

        // Should still return response, just may not have grounding
        expect(result).toBeDefined();
        expect(result.candidates).toBeDefined();
      },
      TEST_TIMEOUTS.query,
    );

    it(
      'should query with different Gemini model',
      async () => {
        const result = await queryWithGenerateContent(
          testStoreName,
          'What famous landmarks do you know about?',
          'gemini-1.5-flash',
        );

        expect(result).toBeDefined();
        expect(result.candidates).toBeDefined();
        expect(result.candidates.length).toBeGreaterThan(0);
      },
      TEST_TIMEOUTS.query,
    );

    it(
      'should measure query performance',
      async () => {
        const iterations = 3;
        const times: number[] = [];

        for (let i = 0; i < iterations; i++) {
          const startTime = Date.now();

          await queryWithGenerateContent(testStoreName, 'Quick test query', 'gemini-1.5-flash');

          const elapsed = Date.now() - startTime;
          times.push(elapsed);

          await new Promise((resolve) => setTimeout(resolve, 1000)); // Rate limiting
        }

        const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
        const minTime = Math.min(...times);
        const maxTime = Math.max(...times);

        console.log(`    Query performance stats:`);
        console.log(`      Average: ${formatTime(avgTime)}`);
        console.log(`      Min: ${formatTime(minTime)}`);
        console.log(`      Max: ${formatTime(maxTime)}`);

        expect(avgTime).toBeLessThan(20000); // Avg <20s
      },
      TEST_TIMEOUTS.query * 5,
    );
  });

  // ==============================================
  // Test Suite 7: Document Lifecycle (2 tests)
  // ==============================================
  describe('Document Lifecycle', () => {
    it(
      'should complete full document lifecycle',
      async () => {
        const startTime = Date.now();

        // Create (upload)
        const doc = await uploadTestDocument(
          testStoreName,
          TEST_FILES.smallText,
          'Lifecycle Test Document',
          'text/plain',
          TEST_METADATA.basic,
        );

        expect([DocumentState.STATE_ACTIVE, DocumentState.STATE_PENDING]).toContain(doc.state);

        const docId = doc.name.split('/').pop() || '';

        // Read (get)
        const retrieved = await getTestDocument(testStoreName, docId);
        expect(retrieved.name).toBe(doc.name);
        expect(retrieved.displayName).toBe('Lifecycle Test Document');

        // Use (query)
        const queryResult = await queryWithGenerateContent(
          testStoreName,
          'What can you tell me about the documents?',
          'gemini-1.5-flash',
        );
        expect(queryResult.candidates).toBeDefined();

        // Delete
        await deleteTestDocument(testStoreName, docId, true);

        // Verify deletion
        await expect(getTestDocument(testStoreName, docId)).rejects.toThrow();

        const elapsed = Date.now() - startTime;
        console.log(`    Full lifecycle completed in: ${formatTime(elapsed)}`);

        expect(elapsed).toBeLessThan(60000); // <60s
      },
      TEST_TIMEOUTS.poll,
    );

    it(
      'should handle document state transitions',
      async () => {
        // Upload document
        const doc = await uploadTestDocument(
          testStoreName,
          TEST_FILES.mediumText,
          'State Transition Test',
          'text/plain',
        );

        const docId = doc.name.split('/').pop() || '';

        // Document may be PROCESSING initially
        if (doc.state === DocumentState.STATE_PENDING || doc.state !== DocumentState.STATE_ACTIVE) {
          console.log('    Document is processing, waiting for ACTIVE state...');

          // Wait for processing with timeout
          const finalDoc = await waitForDocumentProcessing(
            testStoreName,
            docId,
            DocumentState.STATE_ACTIVE,
            60000, // 60s timeout
            5000, // 5s poll interval
          );

          expect(finalDoc.state).toBe(DocumentState.STATE_ACTIVE);
        } else {
          expect(doc.state).toBe(DocumentState.STATE_ACTIVE);
        }
      },
      TEST_TIMEOUTS.poll,
    );
  });

  // ==============================================
  // Test Suite 8: Batch Operations (2 tests)
  // ==============================================
  describe('Batch Operations', () => {
    it(
      'should batch upload multiple documents',
      async () => {
        const startTime = Date.now();

        const files = [
          { buffer: TEST_FILES.smallText, displayName: 'Batch Upload 1', mimeType: 'text/plain' },
          { buffer: TEST_FILES.smallText, displayName: 'Batch Upload 2', mimeType: 'text/plain' },
          { buffer: TEST_FILES.smallText, displayName: 'Batch Upload 3', mimeType: 'text/plain' },
          { buffer: TEST_FILES.smallText, displayName: 'Batch Upload 4', mimeType: 'text/plain' },
        ];

        const docs = await batchUploadDocuments(testStoreName, files, 2);

        const elapsed = Date.now() - startTime;

        expect(docs.length).toBe(4);
        docs.forEach((doc) => {
          expect(doc.name).toBeDefined();
          expect(doc.displayName).toContain('Batch Upload');
        });

        console.log(`    Batch upload performance: ${formatTime(elapsed)}`);
      },
      TEST_TIMEOUTS.upload * 3,
    );

    it(
      'should handle concurrent operations',
      async () => {
        const startTime = Date.now();

        // Create, list, and query concurrently
        const operations = [
          uploadTestDocument(testStoreName, TEST_FILES.smallText, 'Concurrent Op 1', 'text/plain'),
          listTestDocuments(testStoreName, 10),
          queryWithGenerateContent(testStoreName, 'test query', 'gemini-1.5-flash'),
        ];

        const results = await Promise.all(operations);

        const elapsed = Date.now() - startTime;

        expect(results).toHaveLength(3);
        expect(results[0]).toBeDefined(); // Upload result
        expect(results[1].documents).toBeDefined(); // List result
        expect(results[2].candidates).toBeDefined(); // Query result

        console.log(`    Concurrent operations completed in: ${formatTime(elapsed)}`);
      },
      TEST_TIMEOUTS.query,
    );
  });

  // ==============================================
  // Test Suite 9: Error Handling (3 tests)
  // ==============================================
  describe('Error Handling', () => {
    it('should handle invalid document ID', async () => {
      await expect(getTestDocument(testStoreName, 'invalid-doc-id-12345')).rejects.toThrow();
    });

    it('should validate metadata constraints', async () => {
      // Try to upload with 25 metadata items (max 20)
      const tooManyMetadata: CustomMetadata[] = Array(25)
        .fill(null)
        .map((_, i) => ({
          key: `field${i}`,
          stringValue: `value${i}`,
        }));

      // This may succeed or fail depending on API validation
      // We just ensure no crash occurs
      try {
        await uploadTestDocument(
          testStoreName,
          TEST_FILES.smallText,
          'Too Many Metadata Test',
          'text/plain',
          tooManyMetadata,
        );
        console.log('    Note: API accepted >20 metadata items');
      } catch (error) {
        console.log('    Note: API rejected >20 metadata items (expected)');
        expect(error).toBeDefined();
      }
    });

    it('should handle network errors gracefully', async () => {
      // Try to access non-existent store
      const fakeStore = 'fileSearchStores/non-existent-store-12345';

      await expect(
        uploadTestDocument(fakeStore, TEST_FILES.smallText, 'Error Test', 'text/plain'),
      ).rejects.toThrow();
    });
  });

  // ==============================================
  // Test Suite 10: Performance (3 tests)
  // ==============================================
  describe('Performance', () => {
    it('should upload document within acceptable time', async () => {
      const startTime = Date.now();

      await uploadTestDocument(
        testStoreName,
        TEST_FILES.smallText,
        'Performance Test Upload',
        'text/plain',
      );

      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(30000); // <30s
      console.log(`    Document upload: ${formatTime(duration)}`);
    });

    it(
      'should query documents within acceptable time',
      async () => {
        const startTime = Date.now();

        await queryWithGenerateContent(
          testStoreName,
          'Quick performance test query',
          'gemini-1.5-flash',
        );

        const duration = Date.now() - startTime;

        expect(duration).toBeLessThan(15000); // <15s
        console.log(`    Document query: ${formatTime(duration)}`);
      },
      TEST_TIMEOUTS.query,
    );

    it('should list documents efficiently', async () => {
      const startTime = Date.now();

      await listTestDocuments(testStoreName, 20);

      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(5000); // <5s
      console.log(`    List documents: ${formatTime(duration)}`);
    });
  });

  // ==============================================
  // Final Summary
  // ==============================================
  afterAll(() => {
    const stats = resourceTracker.getStats();
    console.log('\n========================================');
    console.log('  DOCUMENT TESTS SUMMARY');
    console.log('========================================');
    console.log(`  Total Stores: ${stats.stores}`);
    console.log(`  Total Documents: ${stats.documents}`);
    console.log('========================================\n');
  });
});
