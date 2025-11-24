# End-to-End (E2E) Tests

## Overview

The E2E test framework simulates complete n8n workflow execution for the Gemini File Search nodes. It enables testing of multi-node workflows with data passing, expression resolution, and realistic n8n behavior.

## Architecture

### Core Components

```
test/e2e/
├── workflows/              # Workflow JSON definitions
│   ├── complete-rag-workflow.json
│   ├── error-handling-workflow.json
│   ├── pagination-workflow.json
│   └── multi-store-workflow.json
├── helpers/
│   ├── workflowRunner.ts   # Workflow execution engine
│   └── workflowHelpers.ts  # Utility functions
└── README.md              # This file
```

### WorkflowRunner

The `WorkflowRunner` class simulates n8n workflow execution:

- **Node Registration**: Supports both Gemini File Search node types
- **Expression Resolution**: Resolves n8n expressions like `={{$node['NodeName'].json.field}}`
- **Topological Sorting**: Executes nodes in correct dependency order
- **Error Handling**: Supports `continueOnFail` option
- **Credential Management**: Manages API credentials for nodes

### MockExecuteFunctions

Implements `IExecuteFunctions` interface to provide:

- Parameter resolution with expression support
- Input/output data handling
- Credential access
- Helper functions (request, constructExecutionMetaData, etc.)
- Binary data support

## Running E2E Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run specific E2E test file
npm test -- test/e2e/workflow.test.ts

# Run with coverage
npm run test:coverage -- --testPathPattern=test/e2e

# Run in watch mode
npm run test:watch -- --testPathPattern=test/e2e
```

## Writing E2E Tests

### Basic Example

```typescript
import { WorkflowRunner } from './helpers/workflowRunner';
import { extractNodeOutput } from './helpers/workflowHelpers';

describe('Store Workflow', () => {
  let runner: WorkflowRunner;

  beforeEach(() => {
    runner = new WorkflowRunner();
    runner.setCredentials('geminiApi', {
      apiKey: process.env.GEMINI_API_KEY || 'test-api-key',
    });
  });

  it('should create and list stores', async () => {
    const workflow = require('./workflows/complete-rag-workflow.json');
    const result = await runner.executeWorkflow(workflow);

    expect(result.success).toBe(true);
    expect(result.nodeResults.size).toBeGreaterThan(0);

    // Extract specific node outputs
    const storeName = extractNodeOutput(result.nodeResults, 'Create Store', 'name');
    expect(storeName).toBeDefined();
  });
});
```

### Using Workflow Helpers

```typescript
import {
  createSimpleWorkflow,
  createNode,
  assertNodeOutput,
  assertNodeOutputHasField,
  printExecutionSummary,
} from './helpers/workflowHelpers';

// Create workflow programmatically
const workflow = createSimpleWorkflow('Test Workflow', [
  createNode('Create Store', 'geminiFileSearchStores', {
    operation: 'create',
    displayName: 'Test Store',
  }),
  createNode('List Stores', 'geminiFileSearchStores', {
    operation: 'list',
    returnAll: false,
    limit: 10,
  }),
]);

// Execute workflow
const result = await runner.executeWorkflow(workflow);

// Assert results
assertNodeOutput(result.nodeResults, 'Create Store');
assertNodeOutputHasField(result.nodeResults, 'Create Store', 'name');

// Print summary
printExecutionSummary(result.nodeResults);
```

## Workflow JSON Structure

### Basic Structure

```json
{
  "name": "Workflow Name",
  "nodes": [
    {
      "name": "Node Name",
      "type": "geminiFileSearchStores",
      "typeVersion": 1,
      "position": [250, 300],
      "parameters": {
        "operation": "create",
        "displayName": "My Store"
      }
    }
  ],
  "connections": {
    "Node Name": {
      "main": [[
        {
          "node": "Next Node",
          "type": "main",
          "index": 0
        }
      ]]
    }
  },
  "active": false,
  "settings": {}
}
```

### Expression Resolution

The framework supports n8n expression syntax:

```json
{
  "parameters": {
    "storeName": "={{$node['Create Store'].json.name}}",
    "query": "={{$json.userQuery}}",
    "limit": "={{$node['Previous Node'].json.pageSize}}"
  }
}
```

**Supported Expressions:**

- `$node['NodeName'].json.field` - Access previous node output
- `$json.field` - Access current input data
- `$input.item.json.field` - Access input item data

## Sample Workflows

### 1. Complete RAG Workflow

**File**: `workflows/complete-rag-workflow.json`

**Flow**: Create Store → List Stores → Get Store → Upload Document → List Documents → Query Documents → Delete Store

**Tests**: Full RAG pipeline with document upload and querying

### 2. Error Handling Workflow

**File**: `workflows/error-handling-workflow.json`

**Flow**: Multiple error scenarios with `continueOnFail: true`

**Tests**: Error handling, non-existent resources, validation failures

### 3. Pagination Workflow

**File**: `workflows/pagination-workflow.json`

**Flow**: Tests pagination for list operations

**Tests**: Page tokens, limit parameters, returnAll option

### 4. Multi-Store Workflow

**File**: `workflows/multi-store-workflow.json`

**Flow**: Parallel operations on multiple stores

**Tests**: Multiple stores, isolated operations, concurrent workflows

## Best Practices

### 1. Test Organization

```typescript
describe('E2E: Store Operations', () => {
  describe('Create and Delete', () => {
    it('should create a store successfully', async () => {
      // Test implementation
    });

    it('should delete a store successfully', async () => {
      // Test implementation
    });
  });

  describe('List and Get', () => {
    // More tests
  });
});
```

### 2. Setup and Teardown

```typescript
describe('E2E: Document Operations', () => {
  let runner: WorkflowRunner;
  let testStore: string;

  beforeAll(async () => {
    runner = new WorkflowRunner();
    runner.setCredentials('geminiApi', {
      apiKey: process.env.GEMINI_API_KEY || 'test-api-key',
    });

    // Create test store
    const result = await runner.executeNode(
      'geminiFileSearchStores',
      'Setup',
      { operation: 'create', displayName: 'Test Store' },
    );
    testStore = result[0].json.name;
  });

  afterAll(async () => {
    // Cleanup test store
    await runner.executeNode(
      'geminiFileSearchStores',
      'Teardown',
      { operation: 'delete', storeName: testStore, force: true },
    );
  });

  it('should upload document to store', async () => {
    // Test implementation
  });
});
```

### 3. Assertions

```typescript
// Test workflow execution success
expect(result.success).toBe(true);
expect(result.error).toBeUndefined();

// Test node outputs
assertNodeOutput(result.nodeResults, 'Create Store');
assertNodeOutputCount(result.nodeResults, 'List Stores', 1);
assertNodeOutputHasField(result.nodeResults, 'Create Store', 'name');

// Test specific values
const storeName = extractNodeOutput(result.nodeResults, 'Create Store', 'name');
expect(storeName).toMatch(/^fileSearchStores\//);

// Test array outputs
const stores = extractNodeOutputs(result.nodeResults, 'List Stores');
expect(stores.length).toBeGreaterThan(0);
expect(stores[0]).toHaveProperty('name');
```

### 4. Error Testing

```typescript
it('should handle errors gracefully', async () => {
  const workflow = require('./workflows/error-handling-workflow.json');
  const result = await runner.executeWorkflow(workflow);

  // Workflow should complete even with errors
  expect(result.success).toBe(true);

  // Check error nodes have error field
  const errorNode = result.nodeResults.get('Get Non-Existent Store');
  expect(errorNode).toBeDefined();
  expect(errorNode![0].json).toHaveProperty('error');
});
```

## Debugging

### Enable Verbose Logging

The WorkflowRunner automatically logs execution progress:

```
🚀 Executing workflow: Complete RAG Workflow
📋 Nodes to execute: Create Store → List Stores → Get Store → Delete Store

▶️  Executing node: Create Store (geminiFileSearchStores)
   ✅ Completed: 1 items returned

▶️  Executing node: List Stores (geminiFileSearchStores)
   ✅ Completed: 5 items returned

✨ Workflow completed successfully in 1234ms
```

### Print Execution Summary

```typescript
import { printExecutionSummary } from './helpers/workflowHelpers';

const result = await runner.executeWorkflow(workflow);
printExecutionSummary(result.nodeResults);
```

Output:

```
📊 Workflow Execution Summary:
================================

Create Store:
  Items: 1
  Fields: name, displayName, createTime, updateTime
  Sample data:
    name: fileSearchStores/abc123
    displayName: Test Store
    createTime: 2024-11-24T10:00:00Z

List Stores:
  Items: 5
  Fields: name, displayName, createTime
  Sample data:
    name: fileSearchStores/xyz789
    displayName: Another Store
    createTime: 2024-11-24T09:00:00Z

================================
```

## Limitations

1. **No Real HTTP Requests**: The framework doesn't make actual API calls. Use integration tests for real API testing.

2. **Simplified Expression Resolution**: Only supports common n8n expression patterns. Complex expressions may not resolve correctly.

3. **No Webhook Support**: Trigger nodes and webhooks are not supported.

4. **No Sub-Workflows**: Sub-workflows and Execute Workflow nodes are not supported.

5. **No Binary Data Files**: Binary data is mocked. Actual file operations are not performed.

## Integration with CI/CD

```yaml
# .github/workflows/test.yml
name: E2E Tests

on: [push, pull_request]

jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:e2e
        env:
          GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
```

## Troubleshooting

### Expression Not Resolving

**Problem**: Node parameter shows `={{$node['NodeName'].json.field}}` instead of actual value

**Solution**: Ensure the referenced node has executed and produced output. Check node names match exactly.

### Node Execution Order Wrong

**Problem**: Nodes execute in wrong order or can't find dependencies

**Solution**: Verify connections in workflow JSON. Use `topologicalSort` to check execution order.

### Credentials Not Found

**Problem**: Error "Credentials of type 'geminiApi' not found"

**Solution**: Call `runner.setCredentials('geminiApi', {...})` before executing workflow.

### Binary Data Error

**Problem**: "No binary data property 'data' exists"

**Solution**: Provide binary data in input or mock it using `createMockBinaryData()`.

## Next Steps

After setting up E2E framework:

1. **Phase 3.3.2**: Implement E2E tests for store workflows
2. **Phase 3.3.3**: Implement E2E tests for document workflows
3. **Phase 3.3.4**: Implement complex scenario tests
4. **Phase 3.3.5**: Test error handling and edge cases

## References

- [n8n Workflow Structure](https://docs.n8n.io/workflows/)
- [n8n Expression Resolution](https://docs.n8n.io/code-examples/expressions/)
- [Jest Testing Framework](https://jestjs.io/docs/getting-started)

---

**Last Updated**: 2024-11-24
**Framework Version**: 1.0.0
**Status**: Complete

🤖 Generated with [Claude Code](https://claude.com/claude-code)
