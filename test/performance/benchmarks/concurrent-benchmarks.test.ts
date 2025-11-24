/**
 * Concurrent Operations Benchmarks
 * Tests performance of concurrent operations
 */

import { createTestStore, listTestStores } from '../../integration/helpers/storeHelpers';
import { uploadTestDocument, listTestDocuments } from '../../integration/helpers/documentHelpers';
import { validateTestEnvironment, TEST_TIMEOUTS } from '../../integration/setup/testEnvironment';
import { setupCleanupHandlers } from '../../integration/setup/cleanup';

describe('Concurrent Operations Benchmarks', () => {
  jest.setTimeout(TEST_TIMEOUTS.upload * 3);

  beforeAll(() => {
    validateTestEnvironment();
  });

  setupCleanupHandlers();

  describe('Mixed Operation Concurrency', () => {
    it('should handle mixed operations concurrently', async () => {
      const store = await createTestStore('Mixed Ops Test');
      const file = Buffer.alloc(5120, 'a');

      const start = Date.now();

      const operations = [
        uploadTestDocument(store.name, file, 'Upload 1', 'text/plain'),
        uploadTestDocument(store.name, file, 'Upload 2', 'text/plain'),
        listTestStores(),
        listTestDocuments(store.name),
      ];

      const results = await Promise.all(operations);
      const duration = Date.now() - start;

      expect(results).toHaveLength(4);
      console.log(`✓ 4 mixed concurrent operations: ${duration}ms`);
    });
  });

  describe('Sequential vs Parallel Performance', () => {
    it(
      'should demonstrate parallel performance benefit',
      async () => {
        const store = await createTestStore('Parallel Test');
        const file = Buffer.alloc(5120, 'a');

        // Sequential
        const seqStart = Date.now();
        await uploadTestDocument(store.name, file, 'Seq 1', 'text/plain');
        await uploadTestDocument(store.name, file, 'Seq 2', 'text/plain');
        await uploadTestDocument(store.name, file, 'Seq 3', 'text/plain');
        const seqDuration = Date.now() - seqStart;

        // Parallel
        const parStart = Date.now();
        await Promise.all([
          uploadTestDocument(store.name, file, 'Par 1', 'text/plain'),
          uploadTestDocument(store.name, file, 'Par 2', 'text/plain'),
          uploadTestDocument(store.name, file, 'Par 3', 'text/plain'),
        ]);
        const parDuration = Date.now() - parStart;

        const speedup = seqDuration / parDuration;
        console.log(`✓ Sequential: ${seqDuration}ms`);
        console.log(`✓ Parallel: ${parDuration}ms`);
        console.log(`✓ Speedup: ${speedup.toFixed(2)}x`);

        expect(parDuration).toBeLessThan(seqDuration);
      },
      TEST_TIMEOUTS.upload * 3,
    );
  });

  describe('Batch Upload Performance', () => {
    it(
      'should handle batch uploads efficiently',
      async () => {
        const store = await createTestStore('Batch Upload Test');
        const file = Buffer.alloc(5120, 'a');

        const start = Date.now();

        // Upload 10 files in batches of 5
        const batch1 = Array(5)
          .fill(null)
          .map((_, i) => uploadTestDocument(store.name, file, `Batch1 ${i}`, 'text/plain'));

        await Promise.all(batch1);

        const batch2 = Array(5)
          .fill(null)
          .map((_, i) => uploadTestDocument(store.name, file, `Batch2 ${i}`, 'text/plain'));

        await Promise.all(batch2);

        const duration = Date.now() - start;
        const avgPerFile = duration / 10;

        console.log(`✓ 10 files uploaded in 2 batches: ${duration}ms`);
        console.log(`✓ Average per file: ${avgPerFile.toFixed(0)}ms`);

        expect(duration).toBeLessThan(90000); // Should complete within 90s
      },
      TEST_TIMEOUTS.upload * 3,
    );
  });
});
