/**
 * Memory Tests
 * Tests for memory leaks and resource management
 */

import { createTestStore } from '../../integration/helpers/storeHelpers';
import { uploadTestDocument } from '../../integration/helpers/documentHelpers';
import { validateTestEnvironment } from '../../integration/setup/testEnvironment';
import { setupCleanupHandlers } from '../../integration/setup/cleanup';

describe('Memory Tests', () => {
  jest.setTimeout(120000);

  beforeAll(() => {
    validateTestEnvironment();
  });

  setupCleanupHandlers();

  it('should not leak memory during repeated operations', async () => {
    const store = await createTestStore('Memory Test');
    const file = Buffer.alloc(10240, 'a'); // 10KB

    const initialMemory = process.memoryUsage().heapUsed;

    // Perform 20 uploads
    for (let i = 0; i < 20; i++) {
      await uploadTestDocument(store.name, file, `Memory ${i}`, 'text/plain');
    }

    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }

    const finalMemory = process.memoryUsage().heapUsed;
    const memoryIncrease = finalMemory - initialMemory;
    const memoryIncreaseMB = (memoryIncrease / 1024 / 1024).toFixed(2);

    console.log(`✓ Initial memory: ${(initialMemory / 1024 / 1024).toFixed(2)}MB`);
    console.log(`✓ Final memory: ${(finalMemory / 1024 / 1024).toFixed(2)}MB`);
    console.log(`✓ Memory increase: ${memoryIncreaseMB}MB`);

    // Memory should not increase significantly (< 50MB for 20 uploads)
    expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
  }, 120000);

  it('should handle large buffers efficiently', async () => {
    const store = await createTestStore('Large Buffer Test');

    const sizes = [
      { size: 10 * 1024, name: '10KB' },
      { size: 100 * 1024, name: '100KB' },
      { size: 500 * 1024, name: '500KB' },
    ];

    const memorySnapshots: Array<{ name: string; memory: number }> = [];

    for (const { size, name } of sizes) {
      const file = Buffer.alloc(size, 'a');
      await uploadTestDocument(store.name, file, `Size ${name}`, 'text/plain');

      // Force GC if available
      if (global.gc) {
        global.gc();
      }

      const currentMemory = process.memoryUsage().heapUsed;
      memorySnapshots.push({ name, memory: currentMemory });
    }

    console.log(`✓ Memory usage per file size:`);
    memorySnapshots.forEach((snapshot) => {
      console.log(`  ${snapshot.name}: ${(snapshot.memory / 1024 / 1024).toFixed(2)}MB`);
    });

    // Memory should not grow excessively
    const firstMemory = memorySnapshots[0].memory;
    const lastMemory = memorySnapshots[memorySnapshots.length - 1].memory;
    const growth = ((lastMemory - firstMemory) / firstMemory) * 100;

    console.log(`✓ Memory growth: ${growth.toFixed(1)}%`);
    expect(growth).toBeLessThan(100); // Less than 100% growth
  }, 120000);

  it('should clean up resources after operations', async () => {
    const store = await createTestStore('Resource Cleanup Test');
    const file = Buffer.alloc(5120, 'a');

    const beforeOps = process.memoryUsage();

    // Perform operations
    const uploads = Array(10)
      .fill(null)
      .map((_, i) => uploadTestDocument(store.name, file, `Cleanup ${i}`, 'text/plain'));

    await Promise.all(uploads);

    // Wait for cleanup
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Force GC
    if (global.gc) {
      global.gc();
    }

    const afterOps = process.memoryUsage();

    console.log(`✓ Memory before: ${(beforeOps.heapUsed / 1024 / 1024).toFixed(2)}MB`);
    console.log(`✓ Memory after: ${(afterOps.heapUsed / 1024 / 1024).toFixed(2)}MB`);
    console.log(
      `✓ Increase: ${((afterOps.heapUsed - beforeOps.heapUsed) / 1024 / 1024).toFixed(2)}MB`,
    );

    // Should not have massive memory increase
    expect(afterOps.heapUsed - beforeOps.heapUsed).toBeLessThan(30 * 1024 * 1024); // <30MB
  }, 120000);
});
