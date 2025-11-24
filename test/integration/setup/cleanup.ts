/**
 * Integration Test Resource Cleanup Utilities
 * Tracks and cleans up resources created during integration tests
 */

import { TEST_CONFIG, isTestStore, formatTime } from './testEnvironment';

interface ApiRequest {
  method: string;
  endpoint: string;
  apiKey: string;
}

/**
 * Makes a direct API request (for cleanup operations)
 * Does not require n8n context
 */
async function makeApiRequest(method: string, endpoint: string, body?: unknown): Promise<unknown> {
  const url = `${TEST_CONFIG.baseUrl}${endpoint}?key=${TEST_CONFIG.apiKey}`;
  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`API request failed: ${response.status} ${response.statusText}\n${errorBody}`);
  }

  if (response.status === 204) {
    return { success: true };
  }

  const contentType = response.headers.get('content-type');
  if (contentType?.includes('application/json')) {
    return response.json();
  }

  return { success: true };
}

/**
 * Tracks created resources for cleanup
 */
export class ResourceTracker {
  private stores: Map<string, number> = new Map(); // storeName -> createdAt timestamp
  private documents: Map<string, { store: string; createdAt: number }> = new Map(); // docName -> {store, createdAt}
  private operations: Set<string> = new Set(); // operation names for polling

  /**
   * Track a created store
   */
  trackStore(storeName: string): void {
    if (!isTestStore(storeName)) {
      console.warn(`  ⚠ Tracking non-test store: ${storeName}`);
    }
    this.stores.set(storeName, Date.now());
    console.log(`  📦 Tracking store: ${storeName}`);
  }

  /**
   * Track a created document
   */
  trackDocument(documentName: string, storeName: string): void {
    this.documents.set(documentName, { store: storeName, createdAt: Date.now() });
    console.log(`  📄 Tracking document: ${documentName}`);
  }

  /**
   * Track a long-running operation
   */
  trackOperation(operationName: string): void {
    this.operations.add(operationName);
    console.log(`  ⚙ Tracking operation: ${operationName}`);
  }

  /**
   * Get all tracked resources
   */
  getStats(): {
    stores: number;
    documents: number;
    operations: number;
  } {
    return {
      stores: this.stores.size,
      documents: this.documents.size,
      operations: this.operations.size,
    };
  }

  /**
   * Clean up all tracked resources
   * Documents first, then stores
   */
  async cleanupAll(): Promise<{
    success: boolean;
    deletedStores: number;
    deletedDocuments: number;
    failedStores: string[];
    failedDocuments: string[];
  }> {
    console.log('\n🧹 Starting cleanup...');

    const stats = this.getStats();
    console.log(
      `  Total resources to cleanup: ${stats.stores} stores, ${stats.documents} documents`,
    );

    const failedStores: string[] = [];
    const failedDocuments: string[] = [];
    let deletedDocuments = 0;
    let deletedStores = 0;

    // Delete documents first
    if (this.documents.size > 0) {
      console.log(`\n  Cleaning up ${this.documents.size} documents...`);
      for (const [docName] of this.documents) {
        try {
          const startTime = Date.now();
          await makeApiRequest('DELETE', `/${docName}?force=true`);
          const elapsed = formatTime(Date.now() - startTime);
          console.log(`    ✓ Deleted document: ${docName} (${elapsed})`);
          deletedDocuments++;
        } catch (error: unknown) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          console.warn(`    ✗ Failed to delete document ${docName}: ${errorMsg}`);
          failedDocuments.push(docName);
        }
      }
    }

    // Then delete stores
    if (this.stores.size > 0) {
      console.log(`\n  Cleaning up ${this.stores.size} stores...`);
      for (const [storeName] of this.stores) {
        try {
          const startTime = Date.now();
          await makeApiRequest('DELETE', `/fileSearchStores/${storeName}?force=true`);
          const elapsed = formatTime(Date.now() - startTime);
          console.log(`    ✓ Deleted store: ${storeName} (${elapsed})`);
          deletedStores++;
        } catch (error: unknown) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          console.warn(`    ✗ Failed to delete store ${storeName}: ${errorMsg}`);
          failedStores.push(storeName);
        }
      }
    }

    // Clear tracking
    this.stores.clear();
    this.documents.clear();
    this.operations.clear();

    const success = failedStores.length === 0 && failedDocuments.length === 0;
    const status = success ? '✓' : '⚠';
    console.log(
      `\n${status} Cleanup complete: ${deletedStores} stores, ${deletedDocuments} documents deleted`,
    );

    if (failedStores.length > 0 || failedDocuments.length > 0) {
      console.log('  Failed cleanups:');
      failedStores.forEach((s) => console.log(`    - Store: ${s}`));
      failedDocuments.forEach((d) => console.log(`    - Document: ${d}`));
    }

    return {
      success,
      deletedStores,
      deletedDocuments,
      failedStores,
      failedDocuments,
    };
  }

  /**
   * Clean up a single store and all its documents
   */
  async cleanupStore(storeName: string): Promise<boolean> {
    try {
      // Remove tracked documents from this store
      for (const [docName, { store }] of this.documents) {
        if (store === storeName) {
          await makeApiRequest('DELETE', `/${docName}?force=true`);
          this.documents.delete(docName);
        }
      }

      // Delete the store
      await makeApiRequest('DELETE', `/fileSearchStores/${storeName}?force=true`);
      this.stores.delete(storeName);
      return true;
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.warn(`Failed to cleanup store ${storeName}: ${errorMsg}`);
      return false;
    }
  }

  /**
   * Reset tracking (without cleanup)
   */
  reset(): void {
    console.log('  Resetting resource tracker...');
    this.stores.clear();
    this.documents.clear();
    this.operations.clear();
  }
}

/**
 * Global resource tracker instance
 */
export const resourceTracker = new ResourceTracker();

/**
 * Setup cleanup handlers for Jest
 * Call this in your test setup or beforeAll/afterAll hooks
 */
export function setupCleanupHandlers(): void {
  afterAll(async () => {
    if (!TEST_CONFIG.cleanupOnComplete) {
      console.log('\n⏭ Cleanup disabled (CLEANUP_ON_COMPLETE=false)');
      console.log('  Resources may remain in your Gemini API project.');
      return;
    }

    await resourceTracker.cleanupAll();
  });
}

/**
 * Setup per-test cleanup handlers
 * Call this in beforeEach/afterEach if you want cleanup between tests
 */
export function setupPerTestCleanup(): void {
  beforeEach(() => {
    resourceTracker.reset();
  });

  afterEach(async () => {
    await resourceTracker.cleanupAll();
  });
}
