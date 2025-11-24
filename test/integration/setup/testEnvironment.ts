/**
 * Integration Test Environment Configuration
 * Manages API credentials, timeouts, and test parameters
 */

import dotenv from 'dotenv';

// Load .env.test if it exists
// Always try to load for integration tests
dotenv.config({ path: '.env.test' });

export interface TestConfig {
  apiKey: string;
  baseUrl: string;
  timeout: number;
  maxRetries: number;
  testStorePrefix: string;
  cleanupOnComplete: boolean;
}

export const TEST_CONFIG: TestConfig = {
  apiKey: process.env.GEMINI_API_KEY_TEST || process.env.GEMINI_API_KEY || '',
  baseUrl: process.env.GEMINI_BASE_URL || 'https://generativelanguage.googleapis.com/v1beta',
  timeout: parseInt(process.env.TEST_TIMEOUT || '60000', 10),
  maxRetries: parseInt(process.env.TEST_MAX_RETRIES || '3', 10),
  testStorePrefix: process.env.TEST_STORE_PREFIX || 'test-n8n-integration-',
  cleanupOnComplete: process.env.CLEANUP_ON_COMPLETE !== 'false',
};

export const TEST_TIMEOUTS = {
  api: 30000, // 30s for API calls
  upload: 60000, // 60s for file uploads
  poll: 120000, // 2min for polling operations
  query: 45000, // 45s for query operations
};

/**
 * Validates that the test environment has required configuration
 * @throws Error if GEMINI_API_KEY_TEST is not set
 */
export function validateTestEnvironment(): void {
  if (!TEST_CONFIG.apiKey) {
    throw new Error(
      'GEMINI_API_KEY_TEST environment variable not set.\n' +
        'Create .env.test with your test API key:\n' +
        '  echo "GEMINI_API_KEY_TEST=your_gemini_api_key_here" > .env.test\n\n' +
        'Or set it in your environment:\n' +
        '  export GEMINI_API_KEY_TEST=your_gemini_api_key_here',
    );
  }

  console.log('\n✓ Test environment validated');
  console.log(`  - API Base URL: ${TEST_CONFIG.baseUrl}`);
  console.log(`  - Timeout: ${TEST_CONFIG.timeout}ms`);
  console.log(`  - Max Retries: ${TEST_CONFIG.maxRetries}`);
  console.log(`  - Test Store Prefix: ${TEST_CONFIG.testStorePrefix}`);
  console.log(`  - Cleanup on Complete: ${TEST_CONFIG.cleanupOnComplete}\n`);
}

/**
 * Gets a unique test store name with timestamp
 * @param suffix Optional suffix to append
 * @returns Unique store name
 */
export function getTestStoreName(suffix?: string): string {
  const timestamp = Date.now();
  return `${TEST_CONFIG.testStorePrefix}${timestamp}${suffix ? `-${suffix}` : ''}`;
}

/**
 * Gets a unique test document name with timestamp
 * @param storeId ID of the parent store
 * @param suffix Optional suffix to append
 * @returns Unique document name
 */
export function getTestDocumentName(storeId: string, suffix?: string): string {
  const timestamp = Date.now();
  return `${storeId}/documents/doc-${timestamp}${suffix ? `-${suffix}` : ''}`;
}

/**
 * Checks if a store name is a test store
 * @param storeName Name to check
 * @returns True if the store is a test store
 */
export function isTestStore(storeName: string): boolean {
  return storeName.includes(TEST_CONFIG.testStorePrefix);
}

/**
 * Formats an API response time for logging
 * @param ms Time in milliseconds
 * @returns Formatted string
 */
export function formatTime(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}
