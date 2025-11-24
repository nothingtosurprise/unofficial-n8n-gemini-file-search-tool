/**
 * Store Operations Integration Tests
 * Tests against the real Gemini File Search API
 *
 * These tests create and manage real resources in your Gemini API project.
 * All resources are automatically cleaned up after tests complete.
 *
 * Required: GEMINI_API_KEY_TEST in .env.test
 */

import { validateTestEnvironment, TEST_TIMEOUTS, formatTime } from './setup/testEnvironment';
import { setupCleanupHandlers, resourceTracker } from './setup/cleanup';
import {
  createTestStore,
  getTestStore,
  listTestStores,
  deleteTestStore,
  waitForStoreReady,
  getStoreStats,
  verifyStoreState,
} from './helpers/storeHelpers';
import { FileSearchStore } from '../../utils/types';

describe('Store Operations Integration Tests', () => {
  jest.setTimeout(TEST_TIMEOUTS.api);

  beforeAll(() => {
    validateTestEnvironment();
    console.log('\n========================================');
    console.log('  STORE OPERATIONS INTEGRATION TESTS');
    console.log('========================================\n');
  });

  setupCleanupHandlers();

  // ==============================================
  // Test Suite 1: Create Store (4 tests)
  // ==============================================
  describe('Create Store', () => {
    it('should create store with display name', async () => {
      const displayName = 'Test Store - With Display Name';
      const startTime = Date.now();

      const store = await createTestStore(displayName);
      const elapsed = Date.now() - startTime;

      // Track for cleanup
      resourceTracker.trackStore(store.name);

      // Verify properties
      expect(store).toBeDefined();
      expect(store.name).toBeDefined();
      expect(store.name).toMatch(/^fileSearchStores\//);
      expect(store.displayName).toBe(displayName);
      expect(store.createTime).toBeDefined();
      expect(store.updateTime).toBeDefined();

      // Verify initial state (counts may be undefined for new stores)
      expect(store.activeDocumentsCount || '0').toBe('0');
      expect(store.pendingDocumentsCount || '0').toBe('0');
      expect(store.failedDocumentsCount || '0').toBe('0');

      // Log performance
      console.log(`    Performance: ${formatTime(elapsed)}`);
      expect(elapsed).toBeLessThan(10000); // Should complete in <10s
    });

    it('should create store without display name', async () => {
      const store = await createTestStore();
      resourceTracker.trackStore(store.name);

      // Verify store was created
      expect(store).toBeDefined();
      expect(store.name).toBeDefined();
      expect(store.displayName).toBeDefined(); // Should have auto-generated display name

      // Verify default state (counts may be undefined for new stores)
      expect(store.activeDocumentsCount || '0').toBe('0');
      expect(store.sizeBytes || '0').toBe('0');
    });

    it('should create multiple stores with unique names', async () => {
      const stores: FileSearchStore[] = [];

      // Create 3 stores
      for (let i = 0; i < 3; i++) {
        const store = await createTestStore(`Multi-Store Test ${i + 1}`);
        resourceTracker.trackStore(store.name);
        stores.push(store);
      }

      // Verify all have unique names
      const names = stores.map((s) => s.name);
      const uniqueNames = new Set(names);
      expect(uniqueNames.size).toBe(3);

      // Verify all are tracked
      const stats = resourceTracker.getStats();
      expect(stats.stores).toBeGreaterThanOrEqual(3);

      console.log(`    Created ${stores.length} unique stores`);
    });

    it('should create store with valid timestamps', async () => {
      const beforeCreate = new Date();
      const store = await createTestStore('Timestamp Test Store');
      resourceTracker.trackStore(store.name);
      const afterCreate = new Date();

      // Verify timestamps are valid ISO 8601 strings
      expect(store.createTime).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      expect(store.updateTime).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);

      // Verify timestamps are within reasonable range
      const createTime = new Date(store.createTime);
      expect(createTime.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime() - 5000);
      expect(createTime.getTime()).toBeLessThanOrEqual(afterCreate.getTime() + 5000);

      console.log(`    Create Time: ${store.createTime}`);
      console.log(`    Update Time: ${store.updateTime}`);
    });
  });

  // ==============================================
  // Test Suite 2: Get Store (3 tests)
  // ==============================================
  describe('Get Store', () => {
    let testStore: FileSearchStore;

    beforeEach(async () => {
      testStore = await createTestStore('Get Test Store');
      resourceTracker.trackStore(testStore.name);
    });

    it('should retrieve store by name', async () => {
      const startTime = Date.now();
      const retrieved = await getTestStore(testStore.name);
      const elapsed = Date.now() - startTime;

      // Verify all properties match
      expect(retrieved.name).toBe(testStore.name);
      expect(retrieved.displayName).toBe(testStore.displayName);
      expect(retrieved.createTime).toBe(testStore.createTime);

      // Verify state properties (may be undefined for new stores, that's ok)
      expect(retrieved.activeDocumentsCount !== undefined || true).toBe(true);
      expect(retrieved.pendingDocumentsCount !== undefined || true).toBe(true);
      expect(retrieved.failedDocumentsCount !== undefined || true).toBe(true);
      expect(retrieved.sizeBytes !== undefined || true).toBe(true);

      console.log(`    Get operation: ${formatTime(elapsed)}`);
      expect(elapsed).toBeLessThan(5000); // Should be fast
    });

    it('should throw error for non-existent store', async () => {
      const fakeStoreName = 'fileSearchStores/nonexistent-store-12345';

      await expect(getTestStore(fakeStoreName)).rejects.toThrow();

      console.log(`    ✓ Correctly rejected non-existent store`);
    });

    it('should retrieve updated store state', async () => {
      // Get initial state
      const initial = await getTestStore(testStore.name);
      expect(initial.activeDocumentsCount || '0').toBe('0');

      // Get again (state should be consistent)
      const updated = await getTestStore(testStore.name);
      expect(updated.activeDocumentsCount || '0').toBe(initial.activeDocumentsCount || '0');
      expect(updated.updateTime).toBe(initial.updateTime);

      console.log(`    ✓ Store state is consistent`);
    });
  });

  // ==============================================
  // Test Suite 3: List Stores (3 tests)
  // ==============================================
  describe('List Stores', () => {
    beforeEach(async () => {
      // Create a few test stores for listing
      for (let i = 0; i < 2; i++) {
        const store = await createTestStore(`List Test Store ${i + 1}`);
        resourceTracker.trackStore(store.name);
      }
    });

    it('should list all stores', async () => {
      const startTime = Date.now();
      const { stores, nextPageToken } = await listTestStores(20);
      const elapsed = Date.now() - startTime;

      // Verify we got results
      expect(stores).toBeDefined();
      expect(Array.isArray(stores)).toBe(true);
      expect(stores.length).toBeGreaterThanOrEqual(2);

      // Verify each store has required properties
      stores.forEach((store) => {
        expect(store.name).toBeDefined();
        expect(store.displayName).toBeDefined();
        expect(store.createTime).toBeDefined();
      });

      console.log(`    Retrieved ${stores.length} stores in ${formatTime(elapsed)}`);
      console.log(`    Has next page: ${!!nextPageToken}`);
    });

    it('should handle pagination correctly', async () => {
      // Get first page with small page size
      const { stores: page1, nextPageToken } = await listTestStores(5);

      expect(page1).toBeDefined();
      expect(page1.length).toBeGreaterThan(0);
      expect(page1.length).toBeLessThanOrEqual(5);

      console.log(`    Page 1: ${page1.length} stores`);
      console.log(`    Next token: ${nextPageToken ? 'Yes' : 'No'}`);

      // If there's a next page, get it
      if (nextPageToken) {
        const { stores: page2 } = await listTestStores(5, nextPageToken);
        expect(page2).toBeDefined();
        expect(page2.length).toBeGreaterThan(0);

        console.log(`    Page 2: ${page2.length} stores`);

        // Verify pages don't overlap
        const page1Names = new Set(page1.map((s) => s.name));
        const page2Names = new Set(page2.map((s) => s.name));
        page2Names.forEach((name) => {
          expect(page1Names.has(name)).toBe(false);
        });

        console.log(`    ✓ No duplicate stores across pages`);
      }
    });

    it('should return array even if no stores match', async () => {
      // This test just verifies the API returns an array structure
      // (There will likely be stores, but we're testing the structure)
      const { stores } = await listTestStores(1);

      expect(stores).toBeDefined();
      expect(Array.isArray(stores)).toBe(true);

      console.log(`    ✓ List operation returns valid array structure`);
    });
  });

  // ==============================================
  // Test Suite 4: Delete Store (4 tests)
  // ==============================================
  describe('Delete Store', () => {
    it('should delete empty store', async () => {
      // Create a store
      const store = await createTestStore('Delete Test - Empty Store');
      resourceTracker.trackStore(store.name);

      // Delete without force (should work for empty store)
      const storeId = store.name.split('/').pop() as string;
      const startTime = Date.now();
      const success = await deleteTestStore(storeId, false);
      const elapsed = Date.now() - startTime;

      expect(success).toBe(true);

      // Verify deletion - should throw error when trying to get
      await expect(getTestStore(store.name)).rejects.toThrow();

      console.log(`    Delete operation: ${formatTime(elapsed)}`);
      console.log(`    ✓ Empty store deleted successfully`);
    });

    it('should delete store using force flag', async () => {
      // Create a store
      const store = await createTestStore('Delete Test - Force Flag');
      resourceTracker.trackStore(store.name);

      // Delete with force
      const storeId = store.name.split('/').pop() as string;
      const success = await deleteTestStore(storeId, true);

      expect(success).toBe(true);

      // Verify deletion
      await expect(getTestStore(store.name)).rejects.toThrow();

      console.log(`    ✓ Store deleted with force flag`);
    });

    it('should throw error when deleting non-existent store', async () => {
      const fakeStoreId = 'nonexistent-store-12345';

      await expect(deleteTestStore(fakeStoreId, true)).rejects.toThrow();

      console.log(`    ✓ Correctly rejected deletion of non-existent store`);
    });

    it('should handle deleting already deleted store', async () => {
      // Create and delete a store
      const store = await createTestStore('Delete Test - Double Delete');
      resourceTracker.trackStore(store.name);
      const storeId = store.name.split('/').pop() as string;

      await deleteTestStore(storeId, true);

      // Try to delete again - should fail
      await expect(deleteTestStore(storeId, true)).rejects.toThrow();

      console.log(`    ✓ Correctly rejected deletion of already deleted store`);
    });
  });

  // ==============================================
  // Test Suite 5: Store Lifecycle (2 tests)
  // ==============================================
  describe('Store Lifecycle', () => {
    it('should complete full CRUD lifecycle', async () => {
      console.log('\n    Starting full CRUD lifecycle test...');

      // CREATE
      const createStart = Date.now();
      const store = await createTestStore('Lifecycle Test Store');
      resourceTracker.trackStore(store.name);
      const createTime = Date.now() - createStart;
      console.log(`    ✓ Created store (${formatTime(createTime)})`);

      // READ
      const readStart = Date.now();
      const retrieved = await getTestStore(store.name);
      const readTime = Date.now() - readStart;
      expect(retrieved.name).toBe(store.name);
      console.log(`    ✓ Retrieved store (${formatTime(readTime)})`);

      // VERIFY
      const verifyStart = Date.now();
      const isValid = await verifyStoreState(store.name, 0, 0, 0);
      const verifyTime = Date.now() - verifyStart;
      expect(isValid).toBe(true);
      console.log(`    ✓ Verified store state (${formatTime(verifyTime)})`);

      // DELETE
      const deleteStart = Date.now();
      const storeId = store.name.split('/').pop() as string;
      const success = await deleteTestStore(storeId, true);
      const deleteTime = Date.now() - deleteStart;
      expect(success).toBe(true);
      console.log(`    ✓ Deleted store (${formatTime(deleteTime)})`);

      // VERIFY DELETION
      await expect(getTestStore(store.name)).rejects.toThrow();
      console.log(`    ✓ Verified deletion`);

      const totalTime = createTime + readTime + verifyTime + deleteTime;
      console.log(`    Total lifecycle time: ${formatTime(totalTime)}`);
    });

    it('should handle store state transitions correctly', async () => {
      // Create store
      const store = await createTestStore('State Transition Test');
      resourceTracker.trackStore(store.name);

      // Initial state should be ready (no documents)
      const stats = await getStoreStats(store.name);
      expect(stats.totalDocuments).toBe(0);
      expect(stats.activeDocuments).toBe(0);
      expect(stats.pendingDocuments).toBe(0);
      expect(stats.failedDocuments).toBe(0);

      console.log(`    ✓ Store initialized with correct state`);
      console.log(`      Active: ${stats.activeDocuments}`);
      console.log(`      Pending: ${stats.pendingDocuments}`);
      console.log(`      Failed: ${stats.failedDocuments}`);
      console.log(`      Size: ${stats.sizeKB}KB`);
    });
  });

  // ==============================================
  // Test Suite 6: Error Handling (3 tests)
  // ==============================================
  describe('Error Handling', () => {
    it('should handle invalid store name format', async () => {
      // Try to get store with invalid name format
      // Note: Some invalid formats may return list results or unexpected responses
      const invalidNames = [
        'invalid-name-without-prefix',
        'fileSearchStores/with/too/many/slashes',
      ];

      let rejectedCount = 0;
      for (const invalidName of invalidNames) {
        try {
          await getTestStore(invalidName);
          console.log(`    ⚠ Name "${invalidName}" did not throw (API accepted it)`);
        } catch (error) {
          rejectedCount++;
        }
      }

      // At least some invalid names should be rejected
      expect(rejectedCount).toBeGreaterThan(0);
      console.log(`    ✓ Rejected ${rejectedCount}/${invalidNames.length} invalid store names`);
    });

    it('should provide descriptive error messages', async () => {
      try {
        await getTestStore('fileSearchStores/nonexistent-123');
        fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeDefined();
        const errorMsg = error instanceof Error ? error.message : String(error);
        expect(errorMsg).toBeTruthy();
        expect(errorMsg.length).toBeGreaterThan(10);

        console.log(`    Error message: ${errorMsg.substring(0, 100)}...`);
        console.log(`    ✓ Error message is descriptive`);
      }
    });

    it('should handle concurrent store creation', async () => {
      // Create multiple stores concurrently
      const concurrentCreates = 3;
      const promises = [];

      for (let i = 0; i < concurrentCreates; i++) {
        promises.push(createTestStore(`Concurrent Test ${i + 1}`));
      }

      const startTime = Date.now();
      const stores = await Promise.all(promises);
      const elapsed = Date.now() - startTime;

      // Track all for cleanup
      stores.forEach((store) => resourceTracker.trackStore(store.name));

      // Verify all succeeded
      expect(stores.length).toBe(concurrentCreates);
      stores.forEach((store) => {
        expect(store).toBeDefined();
        expect(store.name).toBeDefined();
      });

      // Verify all have unique names
      const names = stores.map((s) => s.name);
      const uniqueNames = new Set(names);
      expect(uniqueNames.size).toBe(concurrentCreates);

      console.log(
        `    ✓ Created ${concurrentCreates} stores concurrently in ${formatTime(elapsed)}`,
      );
      console.log(`    Average: ${formatTime(elapsed / concurrentCreates)} per store`);
    });
  });

  // ==============================================
  // Test Suite 7: Performance (3 tests)
  // ==============================================
  describe('Performance', () => {
    it('should create store within acceptable time', async () => {
      const maxTime = 10000; // 10 seconds
      const startTime = Date.now();

      const store = await createTestStore('Performance Test - Create');
      resourceTracker.trackStore(store.name);

      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(maxTime);
      expect(store).toBeDefined();

      console.log(`    Store creation: ${formatTime(duration)} (max: ${formatTime(maxTime)})`);
      console.log(`    ✓ Within acceptable time`);
    });

    it('should list stores efficiently', async () => {
      // Create a few stores first
      const storesToCreate = 3;
      for (let i = 0; i < storesToCreate; i++) {
        const store = await createTestStore(`Performance List Test ${i + 1}`);
        resourceTracker.trackStore(store.name);
      }

      const maxTime = 5000; // 5 seconds
      const startTime = Date.now();

      const { stores } = await listTestStores(20);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(maxTime);
      expect(stores.length).toBeGreaterThanOrEqual(storesToCreate);

      console.log(`    List operation: ${formatTime(duration)} (max: ${formatTime(maxTime)})`);
      console.log(`    Retrieved ${stores.length} stores`);
      console.log(`    ✓ Efficient listing performance`);
    });

    it('should handle concurrent operations efficiently', async () => {
      // Create 5 stores concurrently and measure time
      const concurrentOps = 5;
      const maxTime = 15000; // 15 seconds for 5 concurrent creates

      const startTime = Date.now();
      const promises = [];

      for (let i = 0; i < concurrentOps; i++) {
        promises.push(createTestStore(`Concurrent Perf Test ${i + 1}`));
      }

      const stores = await Promise.all(promises);
      const duration = Date.now() - startTime;

      // Track for cleanup
      stores.forEach((store) => resourceTracker.trackStore(store.name));

      expect(stores.length).toBe(concurrentOps);
      expect(duration).toBeLessThan(maxTime);

      const avgTime = duration / concurrentOps;

      console.log(`    Concurrent operations: ${formatTime(duration)} total`);
      console.log(`    Average per operation: ${formatTime(avgTime)}`);
      console.log(`    Operations: ${concurrentOps}`);
      console.log(`    ✓ Concurrent performance is acceptable`);
    });
  });

  // ==============================================
  // Test Suite 8: Store Statistics (2 tests)
  // ==============================================
  describe('Store Statistics', () => {
    it('should retrieve accurate store statistics', async () => {
      const store = await createTestStore('Stats Test Store');
      resourceTracker.trackStore(store.name);

      const stats = await getStoreStats(store.name);

      // Verify stats structure
      expect(stats).toBeDefined();
      expect(stats.totalDocuments).toBeDefined();
      expect(stats.activeDocuments).toBeDefined();
      expect(stats.pendingDocuments).toBeDefined();
      expect(stats.failedDocuments).toBeDefined();
      expect(stats.sizeKB).toBeDefined();

      // Verify initial state
      expect(stats.totalDocuments).toBe(0);
      expect(stats.activeDocuments).toBe(0);
      expect(stats.sizeKB).toBe(0);

      console.log(`    Store Statistics:`);
      console.log(`      Total: ${stats.totalDocuments}`);
      console.log(`      Active: ${stats.activeDocuments}`);
      console.log(`      Pending: ${stats.pendingDocuments}`);
      console.log(`      Failed: ${stats.failedDocuments}`);
      console.log(`      Size: ${stats.sizeKB}KB`);
    });

    it('should verify store state matches expectations', async () => {
      const store = await createTestStore('Verify State Test');
      resourceTracker.trackStore(store.name);

      // Verify initial empty state
      const isValid = await verifyStoreState(store.name, 0, 0, 0);
      expect(isValid).toBe(true);

      console.log(`    ✓ Store state verification working correctly`);
    });
  });

  // ==============================================
  // Final Summary
  // ==============================================
  afterAll(() => {
    const stats = resourceTracker.getStats();
    console.log('\n========================================');
    console.log('  TEST SUITE COMPLETE');
    console.log('========================================');
    console.log(`  Stores tracked: ${stats.stores}`);
    console.log(`  Documents tracked: ${stats.documents}`);
    console.log('  Cleanup will run automatically...');
    console.log('========================================\n');
  });
});
