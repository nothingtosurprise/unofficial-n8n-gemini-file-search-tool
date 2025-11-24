/**
 * Stress Tests
 * Tests system behavior under sustained load
 */

import { createTestStore } from '../../integration/helpers/storeHelpers';
import { uploadTestDocument } from '../../integration/helpers/documentHelpers';
import { validateTestEnvironment, TEST_TIMEOUTS } from '../../integration/setup/testEnvironment';
import { setupCleanupHandlers } from '../../integration/setup/cleanup';

describe('Stress Tests', () => {
  jest.setTimeout(120000); // 2 minutes

  beforeAll(() => {
    validateTestEnvironment();
  });

  setupCleanupHandlers();

  it('should handle sustained load for 30 seconds', async () => {
    const store = await createTestStore('Stress Test');
    const file = Buffer.alloc(5120, 'a');
    const duration = 30000; // 30 seconds
    const start = Date.now();
    let operations = 0;
    let errors = 0;

    while (Date.now() - start < duration) {
      try {
        await uploadTestDocument(store.name, file, `Stress ${operations}`, 'text/plain');
        operations++;
      } catch (error: unknown) {
        errors++;
        const errorMsg = error instanceof Error ? error.message : String(error);
        if (errorMsg.includes('429')) {
          // Rate limited - expected
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }
    }

    const actualDuration = Date.now() - start;
    const opsPerSecond = (operations / (actualDuration / 1000)).toFixed(2);

    console.log(`✓ Completed ${operations} operations in ${actualDuration}ms`);
    console.log(`✓ Operations per second: ${opsPerSecond}`);
    console.log(`✓ Errors encountered: ${errors}`);

    expect(operations).toBeGreaterThan(0);
  });

  it('should recover from rate limiting', async () => {
    const rapidOps = Array(20)
      .fill(null)
      .map((_, i) => createTestStore(`Rate Limit Test ${i}`));

    const results = await Promise.allSettled(rapidOps);
    const successful = results.filter((r) => r.status === 'fulfilled');
    const failed = results.filter((r) => r.status === 'rejected');

    console.log(`✓ ${successful.length} succeeded, ${failed.length} failed`);

    // Wait for rate limit cooldown
    await new Promise((resolve) => setTimeout(resolve, 10000));

    // Should succeed after cooldown
    const retryResult = await createTestStore('After Rate Limit');
    expect(retryResult.name).toBeDefined();

    console.log(`✓ Successfully recovered from rate limiting`);
  }, 60000);

  it('should handle error conditions gracefully', async () => {
    const store = await createTestStore('Error Handling Test');
    const errors: string[] = [];

    // Try to upload invalid data
    try {
      await uploadTestDocument(store.name, Buffer.alloc(0), 'Empty File', 'text/plain');
    } catch (error: unknown) {
      errors.push(error instanceof Error ? error.message : String(error));
    }

    // Try to upload with invalid MIME type
    try {
      await uploadTestDocument(store.name, Buffer.from('test'), 'Invalid MIME', 'invalid/type');
    } catch (error: unknown) {
      errors.push(error instanceof Error ? error.message : String(error));
    }

    console.log(`✓ Caught ${errors.length} errors gracefully`);
    expect(errors.length).toBeGreaterThan(0);
  });
});
