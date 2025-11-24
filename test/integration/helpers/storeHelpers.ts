/**
 * Store Helper Functions for Integration Tests
 * Provides utilities for store operations in integration tests
 */

import { TEST_CONFIG, TEST_TIMEOUTS, getTestStoreName, formatTime } from '../setup/testEnvironment';
import { FileSearchStore } from '../../../utils/types';

interface StoreCreateRequest {
  displayName?: string;
  description?: string;
  [key: string]: unknown;
}

interface PaginatedStoresResponse {
  fileSearchStores?: FileSearchStore[];
  nextPageToken?: string;
}

/**
 * Makes an authenticated API request to the Gemini API
 * This is a simplified version for integration testing
 */
async function makeGeminiRequest<T>(method: string, endpoint: string, body?: unknown): Promise<T> {
  const url = `${TEST_CONFIG.baseUrl}${endpoint}?key=${TEST_CONFIG.apiKey}`;

  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`API request failed: ${response.status} ${response.statusText}\n${errorBody}`);
  }

  if (response.status === 204) {
    return { success: true } as unknown as T;
  }

  const contentType = response.headers.get('content-type');
  if (contentType?.includes('application/json')) {
    return response.json() as Promise<T>;
  }

  return {} as T;
}

/**
 * Creates a new file search store
 * @param displayName Display name for the store
 * @param timeout Optional timeout in milliseconds
 * @returns Created store object
 */
export async function createTestStore(
  displayName?: string,
  timeout: number = TEST_TIMEOUTS.api,
): Promise<FileSearchStore> {
  const storeName = getTestStoreName();
  const payload: StoreCreateRequest = {
    displayName: displayName || `Integration Test Store - ${storeName}`,
  };

  console.log(`\n📦 Creating test store: ${storeName}`);

  const startTime = Date.now();

  try {
    const store = await makeGeminiRequest<FileSearchStore>('POST', '/fileSearchStores', payload);

    const elapsed = formatTime(Date.now() - startTime);
    console.log(`  ✓ Store created: ${store.name} (${elapsed})`);
    console.log(`    Display Name: ${store.displayName}`);
    console.log(`    Created At: ${store.createTime}`);

    return store;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`  ✗ Failed to create store: ${errorMsg}`);
    throw error;
  }
}

/**
 * Gets a specific store by name
 * @param storeName Full store name (e.g., "fileSearchStores/xyz123")
 * @param timeout Optional timeout in milliseconds
 * @returns Store object
 */
export async function getTestStore(
  storeName: string,
  timeout: number = TEST_TIMEOUTS.api,
): Promise<FileSearchStore> {
  console.log(`\n📦 Getting store: ${storeName}`);

  const startTime = Date.now();

  try {
    const store = await makeGeminiRequest<FileSearchStore>(
      'GET',
      `/fileSearchStores/${storeName.split('/').pop()}`,
    );

    const elapsed = formatTime(Date.now() - startTime);
    console.log(`  ✓ Retrieved store (${elapsed})`);
    console.log(`    Active Documents: ${store.activeDocumentsCount}`);
    console.log(`    Pending Documents: ${store.pendingDocumentsCount}`);
    console.log(`    Failed Documents: ${store.failedDocumentsCount}`);
    console.log(`    Size: ${parseInt(store.sizeBytes) / 1024}KB`);

    return store;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`  ✗ Failed to get store: ${errorMsg}`);
    throw error;
  }
}

/**
 * Lists all file search stores (paginated)
 * @param pageSize Page size (default: 20)
 * @param pageToken Optional page token for pagination
 * @param timeout Optional timeout in milliseconds
 * @returns Stores and next page token
 */
export async function listTestStores(
  pageSize: number = 20,
  pageToken?: string,
  timeout: number = TEST_TIMEOUTS.api,
): Promise<{
  stores: FileSearchStore[];
  nextPageToken?: string;
}> {
  console.log(`\n📦 Listing stores (page size: ${pageSize})`);

  const startTime = Date.now();
  const params = new URLSearchParams();
  params.append('pageSize', pageSize.toString());
  if (pageToken) {
    params.append('pageToken', pageToken);
  }

  try {
    const response = await makeGeminiRequest<PaginatedStoresResponse>(
      'GET',
      `/fileSearchStores?${params.toString()}`,
    );

    const stores = response.fileSearchStores || [];
    const elapsed = formatTime(Date.now() - startTime);

    console.log(`  ✓ Retrieved ${stores.length} stores (${elapsed})`);
    stores.forEach((store) => {
      const isTest = store.displayName?.includes('Integration Test') ? ' [TEST]' : '';
      console.log(`    - ${store.name}${isTest}`);
    });

    if (response.nextPageToken) {
      console.log(
        `  📄 More results available (token: ${response.nextPageToken.substring(0, 10)}...)`,
      );
    }

    return {
      stores,
      nextPageToken: response.nextPageToken,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`  ✗ Failed to list stores: ${errorMsg}`);
    throw error;
  }
}

/**
 * Deletes a store and all its documents
 * @param storeName Full store name
 * @param force Force delete even if not empty
 * @param timeout Optional timeout in milliseconds
 * @returns True if deleted successfully
 */
export async function deleteTestStore(
  storeName: string,
  force: boolean = true,
  timeout: number = TEST_TIMEOUTS.api,
): Promise<boolean> {
  const storeId = storeName.split('/').pop() || storeName;
  console.log(`\n📦 Deleting store: ${storeId}${force ? ' (force)' : ''}`);

  const startTime = Date.now();
  const endpoint = force
    ? `/fileSearchStores/${storeId}?force=true`
    : `/fileSearchStores/${storeId}`;

  try {
    await makeGeminiRequest('DELETE', endpoint);

    const elapsed = formatTime(Date.now() - startTime);
    console.log(`  ✓ Store deleted successfully (${elapsed})`);
    return true;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`  ✗ Failed to delete store: ${errorMsg}`);
    throw error;
  }
}

/**
 * Waits for a store to be ready (all documents processed)
 * @param storeName Store name to wait for
 * @param timeout Total timeout in milliseconds
 * @param pollInterval Poll interval in milliseconds
 * @returns Final store state
 */
export async function waitForStoreReady(
  storeName: string,
  timeout: number = TEST_TIMEOUTS.poll,
  pollInterval: number = 5000,
): Promise<FileSearchStore> {
  console.log(`\n⏳ Waiting for store to be ready: ${storeName}`);
  const startTime = Date.now();
  const storeId = storeName.split('/').pop() || storeName;

  while (Date.now() - startTime < timeout) {
    try {
      const store = await getTestStore(`fileSearchStores/${storeId}`);

      // Check if all documents are processed
      const pending = parseInt(store.pendingDocumentsCount || '0');
      const failed = parseInt(store.failedDocumentsCount || '0');

      if (pending === 0 && failed === 0) {
        const elapsed = formatTime(Date.now() - startTime);
        console.log(`  ✓ Store is ready (${elapsed})`);
        console.log(`    Active Documents: ${store.activeDocumentsCount}`);
        return store;
      }

      console.log(`  ⏳ Waiting... (Pending: ${pending}, Failed: ${failed})`);
      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.warn(`  ⚠ Error checking store status: ${errorMsg}`);
      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }
  }

  throw new Error(`Store did not become ready within ${formatTime(timeout)}: ${storeName}`);
}

/**
 * Retrieves store statistics
 * @param storeName Store name
 * @returns Store statistics
 */
export async function getStoreStats(storeName: string): Promise<{
  totalDocuments: number;
  activeDocuments: number;
  pendingDocuments: number;
  failedDocuments: number;
  sizeKB: number;
}> {
  const store = await getTestStore(storeName);

  return {
    totalDocuments:
      parseInt(store.activeDocumentsCount || '0') +
      parseInt(store.pendingDocumentsCount || '0') +
      parseInt(store.failedDocumentsCount || '0'),
    activeDocuments: parseInt(store.activeDocumentsCount || '0'),
    pendingDocuments: parseInt(store.pendingDocumentsCount || '0'),
    failedDocuments: parseInt(store.failedDocumentsCount || '0'),
    sizeKB: Math.round(parseInt(store.sizeBytes || '0') / 1024),
  };
}

/**
 * Verifies store is in expected state
 * @param storeName Store name
 * @param expectedActive Expected active document count
 * @param expectedPending Expected pending document count
 * @param expectedFailed Expected failed document count
 * @returns True if state matches
 */
export async function verifyStoreState(
  storeName: string,
  expectedActive?: number,
  expectedPending?: number,
  expectedFailed?: number,
): Promise<boolean> {
  const store = await getTestStore(storeName);

  const active = parseInt(store.activeDocumentsCount || '0');
  const pending = parseInt(store.pendingDocumentsCount || '0');
  const failed = parseInt(store.failedDocumentsCount || '0');

  const checks = [
    expectedActive !== undefined ? active === expectedActive : true,
    expectedPending !== undefined ? pending === expectedPending : true,
    expectedFailed !== undefined ? failed === expectedFailed : true,
  ];

  if (!checks.every((c) => c)) {
    console.warn(`\n⚠ Store state mismatch:`);
    if (expectedActive !== undefined) {
      console.warn(`  Active: expected ${expectedActive}, got ${active}`);
    }
    if (expectedPending !== undefined) {
      console.warn(`  Pending: expected ${expectedPending}, got ${pending}`);
    }
    if (expectedFailed !== undefined) {
      console.warn(`  Failed: expected ${expectedFailed}, got ${failed}`);
    }
    return false;
  }

  console.log(`\n✓ Store state verified`);
  return true;
}
