/**
 * Upload Performance Benchmarks
 * Tests upload performance for various file sizes and scenarios
 */

import { createTestStore } from '../../integration/helpers/storeHelpers';
import { uploadTestDocument } from '../../integration/helpers/documentHelpers';
import { validateTestEnvironment, TEST_TIMEOUTS } from '../../integration/setup/testEnvironment';
import { setupCleanupHandlers } from '../../integration/setup/cleanup';

describe('Upload Performance Benchmarks', () => {
  jest.setTimeout(TEST_TIMEOUTS.upload * 2);

  let testStoreName: string;

  beforeAll(async () => {
    validateTestEnvironment();
    const store = await createTestStore('Performance Tests');
    testStoreName = store.name;
  });

  setupCleanupHandlers();

  describe('File Size Performance', () => {
    it('should upload 1KB file in under 10 seconds', async () => {
      const file1KB = Buffer.alloc(1024, 'a');
      const start = Date.now();

      await uploadTestDocument(testStoreName, file1KB, '1KB Performance Test', 'text/plain');

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(10000);
      console.log(`✓ 1KB upload: ${duration}ms`);
    });

    it('should upload 10KB file in under 15 seconds', async () => {
      const file10KB = Buffer.alloc(10240, 'a');
      const start = Date.now();

      await uploadTestDocument(testStoreName, file10KB, '10KB Performance Test', 'text/plain');

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(15000);
      console.log(`✓ 10KB upload: ${duration}ms`);
    });

    it('should upload 100KB file in under 30 seconds', async () => {
      const file100KB = Buffer.alloc(102400, 'a');
      const start = Date.now();

      await uploadTestDocument(testStoreName, file100KB, '100KB Performance Test', 'text/plain');

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(30000);
      console.log(`✓ 100KB upload: ${duration}ms`);
    });

    it('should upload 1MB file in under 60 seconds', async () => {
      const file1MB = Buffer.alloc(1048576, 'a');
      const start = Date.now();

      await uploadTestDocument(testStoreName, file1MB, '1MB Performance Test', 'text/plain');

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(60000);
      console.log(`✓ 1MB upload: ${duration}ms`);
    }, 70000);
  });

  describe('Concurrent Upload Performance', () => {
    it('should handle 3 concurrent uploads efficiently', async () => {
      const file = Buffer.alloc(5120, 'a'); // 5KB
      const start = Date.now();

      const uploads = Array(3)
        .fill(null)
        .map((_, i) => uploadTestDocument(testStoreName, file, `Concurrent ${i}`, 'text/plain'));

      await Promise.all(uploads);
      const duration = Date.now() - start;
      const avgPerUpload = duration / 3;

      expect(duration).toBeLessThan(30000);
      console.log(`✓ 3 concurrent uploads: ${duration}ms total (${avgPerUpload.toFixed(0)}ms avg)`);
    });

    it('should handle 5 concurrent uploads', async () => {
      const file = Buffer.alloc(5120, 'a');
      const start = Date.now();

      const uploads = Array(5)
        .fill(null)
        .map((_, i) => uploadTestDocument(testStoreName, file, `Concurrent5 ${i}`, 'text/plain'));

      await Promise.all(uploads);
      const duration = Date.now() - start;
      const avgPerUpload = duration / 5;

      console.log(`✓ 5 concurrent uploads: ${duration}ms total (${avgPerUpload.toFixed(0)}ms avg)`);
    }, 60000);
  });

  describe('Upload with Metadata Performance', () => {
    it('should upload with metadata without significant overhead', async () => {
      const file = Buffer.alloc(10240, 'a');

      // Upload without metadata
      const start1 = Date.now();
      await uploadTestDocument(testStoreName, file, 'No Metadata', 'text/plain');
      const duration1 = Date.now() - start1;

      // Upload with metadata
      const start2 = Date.now();
      await uploadTestDocument(testStoreName, file, 'With Metadata', 'text/plain', [
        { key: 'author', stringValue: 'Test' },
        { key: 'year', numericValue: 2024 },
        { key: 'tags', stringListValue: { values: ['test', 'perf'] } },
      ]);
      const duration2 = Date.now() - start2;

      const overhead = ((duration2 - duration1) / duration1) * 100;
      console.log(`✓ Without metadata: ${duration1}ms`);
      console.log(`✓ With metadata: ${duration2}ms`);
      console.log(`✓ Overhead: ${overhead.toFixed(1)}%`);

      expect(overhead).toBeLessThan(50); // Less than 50% overhead
    });
  });
});
