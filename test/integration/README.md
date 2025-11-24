# Integration Test Suite

Integration tests verify that the n8n Gemini File Search nodes work correctly with the real Gemini API. These tests create actual resources in your Google Cloud project and verify end-to-end workflows.

## Overview

The integration test environment provides:

- **Test Environment Setup** - Configuration and validation
- **Resource Tracking** - Automatic cleanup of test resources
- **Helper Functions** - Utilities for store and document operations
- **Test Fixtures** - Sample data for consistent testing

## Prerequisites

1. **Google Cloud Project** with Gemini API enabled
2. **API Key** with File Search API access
3. **Test API Key** set in environment

### Setup

#### 1. Create a `.env.test` file

```bash
cp .env.test.example .env.test
```

Edit `.env.test` and add your test API key:

```bash
GEMINI_API_KEY_TEST=your_gemini_api_key_here
```

Or set environment variable:

```bash
export GEMINI_API_KEY_TEST=your_gemini_api_key_here
```

#### 2. Verify Environment

The test suite validates the environment before running:

```typescript
import { validateTestEnvironment } from './setup/testEnvironment';

validateTestEnvironment(); // Throws if GEMINI_API_KEY_TEST not set
```

## Running Integration Tests

### Run All Integration Tests

```bash
npm run test:integration
```

### Run Specific Test File

```bash
npm run test:integration -- test/integration/stores.test.ts
```

### Run with Coverage

```bash
npm run test:coverage -- --testPathPattern=test/integration
```

### Run in Watch Mode

```bash
npm run test:watch -- --testPathPattern=test/integration
```

## Test Structure

```
test/integration/
├── setup/
│   ├── testEnvironment.ts    # Configuration and validation
│   └── cleanup.ts             # Resource tracking and cleanup
├── helpers/
│   ├── fixtures.ts            # Test data and payloads
│   ├── storeHelpers.ts        # Store operation utilities
│   └── documentHelpers.ts     # Document operation utilities
├── README.md                  # This file
└── your-tests.test.ts         # Your integration test files
```

## Using Test Helpers

### Test Environment

```typescript
import { TEST_CONFIG, validateTestEnvironment, getTestStoreName } from './setup/testEnvironment';

// Validate API key is set
validateTestEnvironment();

// Get a unique test store name
const storeName = getTestStoreName('my-test');
// Result: test-n8n-integration-1705355123456-my-test
```

### Resource Tracker

The resource tracker automatically tracks created resources for cleanup:

```typescript
import { resourceTracker, setupCleanupHandlers } from './setup/cleanup';

describe('My Integration Tests', () => {
  setupCleanupHandlers(); // Enable auto-cleanup after all tests

  it('should create and cleanup resources', async () => {
    const store = await createTestStore('My Store');
    resourceTracker.trackStore(store.name);

    const doc = await uploadTestDocument(store.name, buffer, 'doc.pdf');
    resourceTracker.trackDocument(doc.name, store.name);

    // Resources automatically deleted after all tests complete
  });
});
```

### Store Helpers

```typescript
import {
  createTestStore,
  getTestStore,
  listTestStores,
  deleteTestStore,
  waitForStoreReady,
  getStoreStats,
  verifyStoreState,
} from './helpers/storeHelpers';

// Create a store
const store = await createTestStore('My Test Store');
// Result: FileSearchStore object

// Get store details
const store = await getTestStore('fileSearchStores/xyz123');

// List all stores
const { stores, nextPageToken } = await listTestStores(20);

// Wait for all documents to be processed
const readyStore = await waitForStoreReady(store.name);

// Get store statistics
const stats = await getStoreStats(store.name);
console.log(`Active: ${stats.activeDocuments}, Size: ${stats.sizeKB}KB`);

// Verify store state
await verifyStoreState(
  store.name,
  expectedActive = 5,
  expectedPending = 0,
  expectedFailed = 0
);

// Delete a store
await deleteTestStore(store.name);
```

### Document Helpers

```typescript
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

// Upload a document
const doc = await uploadTestDocument(
  storeName,
  fileBuffer,
  'document.pdf',
  'application/pdf',
  metadata // optional
);

// List documents in a store
const { documents, nextPageToken } = await listTestDocuments(storeName, 20);

// Get document details
const doc = await getTestDocument(storeName, 'doc-001');

// Wait for document to be processed
const readyDoc = await waitForDocumentProcessing(
  storeName,
  'doc-001',
  DocumentState.STATE_ACTIVE
);

// Query documents
const results = await queryTestDocuments(
  storeName,
  'search query',
  metadataFilter // optional
);

// Batch upload multiple documents
const docs = await batchUploadDocuments(
  storeName,
  [
    { buffer: buf1, displayName: 'doc1.pdf' },
    { buffer: buf2, displayName: 'doc2.pdf' },
    { buffer: buf3, displayName: 'doc3.pdf' },
  ],
  concurrency = 3
);

// Verify document properties
await verifyDocument(
  storeName,
  'doc-001',
  expectedDisplayName = 'document.pdf',
  expectedState = DocumentState.STATE_ACTIVE
);

// Delete a document
await deleteTestDocument(storeName, 'doc-001');
```

### Test Fixtures

```typescript
import {
  createStorePayloads,
  createDocumentPayloads,
  uploadPayloads,
  sampleFileContents,
  metadataExamples,
  queryPayloads,
  mockStores,
  mockDocuments,
  mockQueryResponse,
} from './helpers/fixtures';

// Use preset payloads
const store = await createTestStore('My Store');

// Use sample content
const buffer = Buffer.from(sampleFileContents.textDocument);

// Use metadata helpers
const metadata = [
  metadataExamples.category('technical'),
  metadataExamples.tags(['ai', 'search']),
  metadataExamples.version(2),
];

// Upload with metadata
const doc = await uploadTestDocument(
  store.name,
  Buffer.from(sampleFileContents.textDocument),
  'readme.txt',
  'text/plain',
  metadata
);

// Query with metadata filter
const results = await queryTestDocuments(
  store.name,
  'integration test',
  metadataExamples.category('technical')
);
```

## Example Integration Test

```typescript
import { TEST_CONFIG, validateTestEnvironment } from '../setup/testEnvironment';
import { resourceTracker, setupCleanupHandlers } from '../setup/cleanup';
import {
  createTestStore,
  waitForStoreReady,
  deleteTestStore,
} from '../helpers/storeHelpers';
import {
  uploadTestDocument,
  waitForDocumentProcessing,
  listTestDocuments,
} from '../helpers/documentHelpers';
import { sampleFileContents, metadataExamples, createMetadata } from '../helpers/fixtures';

describe('Store and Document Integration', () => {
  setupCleanupHandlers(); // Auto-cleanup after tests

  beforeAll(() => {
    validateTestEnvironment(); // Ensure API key is set
  });

  it('should create store, upload document, and query', async () => {
    // Create store
    const store = await createTestStore('Integration Test - Upload & Query');
    resourceTracker.trackStore(store.name);

    // Upload document
    const buffer = Buffer.from(sampleFileContents.textDocument);
    const metadata = createMetadata(
      metadataExamples.category('documentation'),
      metadataExamples.tags(['integration', 'test'])
    );

    const doc = await uploadTestDocument(
      store.name,
      buffer,
      'integration-guide.txt',
      'text/plain',
      metadata
    );
    resourceTracker.trackDocument(doc.name, store.name);

    // Wait for document to be processed
    const readyDoc = await waitForDocumentProcessing(store.name, doc.name.split('/').pop()!);
    expect(readyDoc.state).toBe('STATE_ACTIVE');

    // List documents
    const { documents } = await listTestDocuments(store.name);
    expect(documents.length).toBeGreaterThan(0);
    expect(documents[0].displayName).toBe('integration-guide.txt');
  });

  it('should handle metadata filtering', async () => {
    const store = await createTestStore('Metadata Filter Test');
    resourceTracker.trackStore(store.name);

    const metadata = createMetadata(
      metadataExamples.category('technical'),
      metadataExamples.version(1)
    );

    const doc = await uploadTestDocument(
      store.name,
      Buffer.from(sampleFileContents.jsonData),
      'data.json',
      'application/json',
      metadata
    );
    resourceTracker.trackDocument(doc.name, store.name);

    // Verify metadata was stored
    const retrieved = await getTestDocument(
      store.name,
      doc.name.split('/').pop()!
    );
    expect(retrieved.customMetadata).toBeDefined();
  });
});
```

## Configuration Options

Set these environment variables to customize test behavior:

```bash
# API Configuration
GEMINI_API_KEY_TEST=your_api_key          # Test API key (required)
GEMINI_BASE_URL=https://...                # API base URL (default: generativelanguage...)
TEST_TIMEOUT=60000                         # API call timeout (default: 60000ms)
TEST_MAX_RETRIES=3                         # Max API retry attempts (default: 3)

# Test Store Configuration
TEST_STORE_PREFIX=my-test-                 # Prefix for test stores (default: test-n8n-integration-)

# Cleanup Configuration
CLEANUP_ON_COMPLETE=true                   # Auto-cleanup resources (default: true)
```

## Timeouts

The test suite defines specific timeouts for different operations:

```typescript
export const TEST_TIMEOUTS = {
  api: 30000,      // 30s for API calls
  upload: 60000,   // 60s for file uploads
  poll: 120000,    // 2min for polling operations
  query: 45000,    // 45s for query operations
};
```

Customize per operation:

```typescript
await createTestStore('My Store', TEST_TIMEOUTS.api);
await waitForStoreReady(store.name, TEST_TIMEOUTS.poll);
```

## Troubleshooting

### "GEMINI_API_KEY_TEST not set"

**Error:**
```
GEMINI_API_KEY_TEST not set. Create .env.test with your test API key.
```

**Solution:**
1. Create `.env.test` file:
   ```bash
   echo "GEMINI_API_KEY_TEST=your_key_here" > .env.test
   ```

2. Or set environment variable:
   ```bash
   export GEMINI_API_KEY_TEST=your_key_here
   ```

### "API request failed: 401 Unauthorized"

**Error:**
```
API request failed: 401 Unauthorized
```

**Solution:**
- Check API key is valid and has File Search API access
- Verify key hasn't expired
- Check Google Cloud project has Gemini API enabled

### "Store did not become ready within timeout"

**Error:**
```
Store did not become ready within 2min: fileSearchStores/xyz
```

**Solution:**
- Increase timeout: `await waitForStoreReady(store.name, 300000)`
- Check store has documents
- Verify documents processed successfully

### Cleanup Not Running

**Issue:** Test resources not deleted after tests

**Solution:**
1. Check `CLEANUP_ON_COMPLETE` is `true` (default)
2. Ensure `setupCleanupHandlers()` called in test suite
3. Check console output for cleanup errors
4. Manually cleanup in Google Cloud Console if needed

## Best Practices

1. **Always track resources** - Use `resourceTracker` to avoid orphaned resources
2. **Use unique names** - Test store/document names include timestamps
3. **Enable cleanup** - Let auto-cleanup manage resources
4. **Validate environment** - Call `validateTestEnvironment()` before tests
5. **Use helpers** - Leverage helper functions for consistency
6. **Monitor timeouts** - Adjust if tests are slow
7. **Check logs** - Review console output for issues

## Performance

- Store creation: ~1-2s
- Document upload: ~5-10s
- Document processing: ~10-30s
- Document query: ~2-5s
- Cleanup: ~1-2s per resource

## Related Documentation

- [Gemini File Search API](https://ai.google.dev/gemini-api/docs/file-search)
- [n8n Node Development](https://docs.n8n.io/integrations/creating-nodes/overview/)
- [Project Structure](../../docs/PROJECT_STRUCTURE.md)
- [Phase 3 Testing Strategy](../../docs/specs/phase_03/README.md)
