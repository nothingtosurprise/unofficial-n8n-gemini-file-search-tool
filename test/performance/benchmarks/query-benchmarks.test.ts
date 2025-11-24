/**
 * Query Performance Benchmarks
 * Tests query performance for file search operations
 */

import { createTestStore } from '../../integration/helpers/storeHelpers';
import { uploadTestDocument, listTestDocuments } from '../../integration/helpers/documentHelpers';
import { validateTestEnvironment, TEST_TIMEOUTS } from '../../integration/setup/testEnvironment';
import { setupCleanupHandlers } from '../../integration/setup/cleanup';

describe('Query Performance Benchmarks', () => {
  jest.setTimeout(TEST_TIMEOUTS.query * 2);

  let testStoreName: string;

  beforeAll(async () => {
    validateTestEnvironment();
    const store = await createTestStore('Query Performance Tests');
    testStoreName = store.name;

    // Upload test documents
    await Promise.all([
      uploadTestDocument(
        store.name,
        Buffer.from('Document about AI and machine learning'),
        'AI Doc',
        'text/plain',
        [{ key: 'topic', stringValue: 'AI' }],
      ),
      uploadTestDocument(
        store.name,
        Buffer.from('Document about quantum computing'),
        'Quantum Doc',
        'text/plain',
        [{ key: 'topic', stringValue: 'quantum' }],
      ),
      uploadTestDocument(
        store.name,
        Buffer.from('Document about neural networks'),
        'Neural Doc',
        'text/plain',
        [{ key: 'topic', stringValue: 'AI' }],
      ),
    ]);

    // Wait for indexing
    await new Promise((resolve) => setTimeout(resolve, 5000));
  });

  setupCleanupHandlers();

  describe('List Response Time', () => {
    it('should list documents in under 10 seconds', async () => {
      const start = Date.now();
      const result = await listTestDocuments(testStoreName);
      const duration = Date.now() - start;

      expect(result.documents).toBeDefined();
      expect(result.documents.length).toBeGreaterThan(0);
      expect(duration).toBeLessThan(10000);
      console.log(`✓ Simple list: ${duration}ms`);
    });

    it('should list with pagination in under 10 seconds', async () => {
      const start = Date.now();
      const result = await listTestDocuments(testStoreName, 2); // Page size 2
      const duration = Date.now() - start;

      expect(result.documents).toBeDefined();
      expect(duration).toBeLessThan(10000);
      console.log(`✓ Paginated list: ${duration}ms`);
    });
  });

  describe('Concurrent List Performance', () => {
    it('should handle 3 concurrent list operations', async () => {
      const start = Date.now();

      const queries = Array(3)
        .fill(null)
        .map(() => listTestDocuments(testStoreName));

      const results = await Promise.all(queries);
      const duration = Date.now() - start;
      const avgPerQuery = duration / 3;

      expect(results).toHaveLength(3);
      console.log(`✓ 3 concurrent lists: ${duration}ms total (${avgPerQuery.toFixed(0)}ms avg)`);
    });
  });

  describe('Store Size Impact', () => {
    it(
      'should measure list performance with growing store size',
      async () => {
        const listTimes: number[] = [];

        // List with 3 documents
        let start = Date.now();
        await listTestDocuments(testStoreName);
        listTimes.push(Date.now() - start);

        // Add 7 more documents (10 total)
        const uploads = Array(7)
          .fill(null)
          .map((_, i) =>
            uploadTestDocument(
              testStoreName,
              Buffer.from(`Doc ${i}`),
              `Size Test ${i}`,
              'text/plain',
            ),
          );
        await Promise.all(uploads);
        await new Promise((resolve) => setTimeout(resolve, 3000));

        // List with 10 documents
        start = Date.now();
        await listTestDocuments(testStoreName);
        listTimes.push(Date.now() - start);

        console.log(`✓ List with 3 docs: ${listTimes[0]}ms`);
        console.log(`✓ List with 10 docs: ${listTimes[1]}ms`);
        console.log(
          `✓ Performance degradation: ${((listTimes[1] / listTimes[0] - 1) * 100).toFixed(1)}%`,
        );

        // Performance should not degrade significantly
        expect(listTimes[1]).toBeLessThan(listTimes[0] * 1.5); // <50% degradation
      },
      TEST_TIMEOUTS.query * 2,
    );
  });
});
