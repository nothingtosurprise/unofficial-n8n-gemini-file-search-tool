# Implementation Plan: Gemini File Search Tool n8n Nodes

## Document Information
- **Version**: 1.0
- **Date**: 2025-11-24
- **Total Estimated Timeline**: 30-39 days (6-8 weeks)
- **Based On**: n8n-gemini-file-search-nodes-spec.md v1.0

---

## Table of Contents

1. [Overview](#overview)
2. [Phase 1: Infrastructure Setup](#phase-1-infrastructure-setup)
3. [Phase 2: Core Implementation](#phase-2-core-implementation)
4. [Phase 3: Testing Strategy](#phase-3-testing-strategy)
5. [Phase 4: Documentation](#phase-4-documentation)
6. [Phase 5: Quality Assurance & Deployment](#phase-5-quality-assurance--deployment)
7. [Timeline & Milestones](#timeline--milestones)
8. [Risk Management](#risk-management)
9. [Success Criteria](#success-criteria)

---

## Overview

This implementation plan outlines the detailed phases for developing two custom n8n nodes that integrate with Google's Gemini File Search Tool API. The plan follows a structured approach ensuring quality, testability, and maintainability.

### Project Scope

**Deliverables:**
1. Gemini File Search Stores Node (6 operations)
2. Gemini File Search Documents Node (6 operations)
3. Gemini API Credentials Node
4. Comprehensive test suite (unit, integration, E2E)
5. Complete documentation (code, user, API examples)

**Key Technical Challenges:**
- Resumable file upload protocol implementation
- Long-running operation polling mechanism
- Metadata filter validation (AIP-160 format)
- Dynamic resource loading for store/document pickers
- Rate limiting and quota management

---

## Phase 1: Infrastructure Setup

**Duration**: 3-5 days
**Complexity**: Moderate
**Dependencies**: None

### Objectives
- Set up development environment for n8n node development
- Create project structure following n8n conventions
- Configure build tools, linting, and testing frameworks
- Set up CI/CD pipeline for automated testing and deployment

### Tasks

#### 1.1 Development Environment Setup
**Complexity**: Simple
**Duration**: 0.5 days

**Tasks:**
- [ ] Install Node.js 18+ LTS version
- [ ] Install n8n CLI: `npm install -g n8n`
- [ ] Clone n8n nodes starter template
- [ ] Set up VS Code with recommended extensions:
  - ESLint
  - Prettier
  - TypeScript
  - n8n snippets
- [ ] Configure Git hooks with Husky for pre-commit checks

**Acceptance Criteria:**
- Development environment can run `n8n` command
- VS Code properly highlights TypeScript errors
- Git hooks run linting on commit

**Dependencies:** None

---

#### 1.2 Project Scaffolding
**Complexity**: Moderate
**Duration**: 1 day

**Tasks:**
- [ ] Create project directory structure:
  ```
  n8n-nodes-gemini-file-search/
  ├── nodes/
  │   ├── GeminiFileSearchStores/
  │   │   ├── GeminiFileSearchStores.node.ts
  │   │   ├── GeminiFileSearchStores.node.json
  │   │   ├── operations/
  │   │   │   ├── store/
  │   │   │   │   ├── create.ts
  │   │   │   │   ├── list.ts
  │   │   │   │   ├── get.ts
  │   │   │   │   ├── delete.ts
  │   │   │   │   └── getOperation.ts
  │   │   │   └── index.ts
  │   │   └── descriptions/
  │   │       └── StoreDescription.ts
  │   └── GeminiFileSearchDocuments/
  │       ├── GeminiFileSearchDocuments.node.ts
  │       ├── GeminiFileSearchDocuments.node.json
  │       ├── operations/
  │       │   ├── document/
  │       │   │   ├── upload.ts
  │       │   │   ├── import.ts
  │       │   │   ├── list.ts
  │       │   │   ├── get.ts
  │       │   │   ├── delete.ts
  │       │   │   └── query.ts
  │       │   └── index.ts
  │       └── descriptions/
  │           └── DocumentDescription.ts
  ├── credentials/
  │   └── GeminiApi.credentials.ts
  ├── utils/
  │   ├── apiClient.ts
  │   ├── validators.ts
  │   ├── rateLimiter.ts
  │   └── types.ts
  ├── test/
  │   ├── unit/
  │   ├── integration/
  │   └── e2e/
  ├── docs/
  │   ├── nodes/
  │   └── examples/
  ├── assets/
  │   └── gemini-logo.svg
  ├── package.json
  ├── tsconfig.json
  ├── .eslintrc.js
  ├── .prettierrc
  └── README.md
  ```
- [ ] Initialize npm project: `npm init`
- [ ] Create initial package.json with n8n node metadata
- [ ] Set up TypeScript configuration
- [ ] Create placeholder files for all major components

**Acceptance Criteria:**
- All directories and placeholder files exist
- Project structure matches n8n conventions
- TypeScript compiles without errors

**Dependencies:** 1.1

---

#### 1.3 Dependencies Installation
**Complexity**: Simple
**Duration**: 0.5 days

**Tasks:**
- [ ] Install core dependencies:
  ```json
  {
    "dependencies": {
      "n8n-workflow": "^1.0.0",
      "n8n-core": "^1.0.0"
    },
    "devDependencies": {
      "@types/node": "^18.0.0",
      "typescript": "^5.0.0",
      "eslint": "^8.0.0",
      "@typescript-eslint/eslint-plugin": "^6.0.0",
      "@typescript-eslint/parser": "^6.0.0",
      "prettier": "^3.0.0",
      "jest": "^29.0.0",
      "@types/jest": "^29.0.0",
      "ts-jest": "^29.0.0",
      "nock": "^13.0.0",
      "husky": "^8.0.0",
      "lint-staged": "^15.0.0"
    }
  }
  ```
- [ ] Run `npm install`
- [ ] Verify all dependencies installed correctly
- [ ] Create `.nvmrc` file specifying Node version

**Acceptance Criteria:**
- `node_modules` directory exists
- No dependency conflicts
- `npm run build` script defined (even if empty)

**Dependencies:** 1.2

---

#### 1.4 Build Configuration
**Complexity**: Moderate
**Duration**: 1 day

**Tasks:**
- [ ] Configure TypeScript (`tsconfig.json`):
  ```json
  {
    "compilerOptions": {
      "target": "ES2020",
      "module": "commonjs",
      "lib": ["ES2020"],
      "declaration": true,
      "outDir": "./dist",
      "rootDir": "./",
      "strict": true,
      "esModuleInterop": true,
      "skipLibCheck": true,
      "forceConsistentCasingInFileNames": true,
      "resolveJsonModule": true
    },
    "include": ["nodes/**/*", "credentials/**/*", "utils/**/*"],
    "exclude": ["node_modules", "dist", "test"]
  }
  ```
- [ ] Configure ESLint (`.eslintrc.js`):
  - Enable TypeScript rules
  - Set up n8n-specific rules
  - Configure import sorting
- [ ] Configure Prettier (`.prettierrc`):
  - Set consistent formatting rules
  - Integrate with ESLint
- [ ] Create npm scripts in `package.json`:
  ```json
  {
    "scripts": {
      "build": "tsc",
      "lint": "eslint . --ext .ts",
      "lint:fix": "eslint . --ext .ts --fix",
      "format": "prettier --write \"**/*.ts\"",
      "test": "jest",
      "test:watch": "jest --watch",
      "test:coverage": "jest --coverage",
      "prepublishOnly": "npm run build && npm run lint && npm run test"
    }
  }
  ```

**Acceptance Criteria:**
- `npm run build` compiles TypeScript successfully
- `npm run lint` runs without errors
- `npm run format` formats all files consistently

**Dependencies:** 1.3

---

#### 1.5 Testing Framework Setup
**Complexity**: Moderate
**Duration**: 1 day

**Tasks:**
- [ ] Configure Jest (`jest.config.js`):
  ```javascript
  module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>/test'],
    testMatch: ['**/*.test.ts'],
    collectCoverageFrom: [
      'nodes/**/*.ts',
      'credentials/**/*.ts',
      'utils/**/*.ts',
      '!**/*.node.ts',
      '!**/node_modules/**',
    ],
    coverageThreshold: {
      global: {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80,
      },
    },
  };
  ```
- [ ] Create test utilities directory: `test/utils/`
- [ ] Set up test fixtures directory: `test/fixtures/`
- [ ] Create mock API response fixtures
- [ ] Install additional testing libraries:
  - `nock` for HTTP mocking
  - `@faker-js/faker` for test data generation
- [ ] Create example test file to verify setup

**Acceptance Criteria:**
- `npm run test` executes successfully
- Example test passes
- Coverage report generates correctly

**Dependencies:** 1.4

---

#### 1.6 CI/CD Pipeline Configuration
**Complexity**: Moderate
**Duration**: 1 day

**Tasks:**
- [ ] Create `.github/workflows/ci.yml`:
  ```yaml
  name: CI

  on:
    push:
      branches: [main, develop]
    pull_request:
      branches: [main, develop]

  jobs:
    test:
      runs-on: ubuntu-latest
      strategy:
        matrix:
          node-version: [18.x, 20.x]
      steps:
        - uses: actions/checkout@v3
        - name: Use Node.js ${{ matrix.node-version }}
          uses: actions/setup-node@v3
          with:
            node-version: ${{ matrix.node-version }}
        - run: npm ci
        - run: npm run build
        - run: npm run lint
        - run: npm run test
        - name: Upload coverage
          uses: codecov/codecov-action@v3

    security:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v3
        - name: Run security audit
          run: npm audit --audit-level=moderate
  ```
- [ ] Create `.github/workflows/release.yml` for publishing
- [ ] Set up branch protection rules
- [ ] Configure Codecov or similar for coverage tracking
- [ ] Add CI status badge to README

**Acceptance Criteria:**
- CI pipeline runs on push/PR
- All tests pass in CI environment
- Coverage reports upload successfully
- Security audit runs without critical issues

**Dependencies:** 1.5

---

### Phase 1 Deliverables

- [ ] Fully configured development environment
- [ ] Project structure following n8n conventions
- [ ] Build tools and linting configured
- [ ] Testing framework operational
- [ ] CI/CD pipeline running

### Phase 1 Acceptance Criteria

- [ ] Developer can clone repo and run `npm install && npm run build` successfully
- [ ] All linting passes with zero errors
- [ ] Sample test runs and passes
- [ ] CI pipeline executes successfully on GitHub

---

## Phase 2: Core Implementation

**Duration**: 12-15 days
**Complexity**: Complex
**Dependencies**: Phase 1

### Objectives
- Implement credential system for Gemini API authentication
- Build all operations for Store node
- Build all operations for Document node
- Create shared API client with error handling
- Implement validation and rate limiting

---

### 2.1 Credential System Implementation

**Duration**: 1-2 days
**Complexity**: Simple

#### 2.1.1 Create Credential Node
**Tasks:**
- [ ] Create `credentials/GeminiApi.credentials.ts`:
  ```typescript
  import {
    IAuthenticateGeneric,
    ICredentialTestRequest,
    ICredentialType,
    INodeProperties,
  } from 'n8n-workflow';

  export class GeminiApi implements ICredentialType {
    name = 'geminiApi';
    displayName = 'Gemini API';
    documentationUrl = 'https://ai.google.dev/gemini-api/docs/api-key';
    properties: INodeProperties[] = [
      {
        displayName: 'API Key',
        name: 'apiKey',
        type: 'string',
        typeOptions: {
          password: true,
        },
        default: '',
        required: true,
        description: 'Your Google Gemini API Key',
      },
    ];

    authenticate: IAuthenticateGeneric = {
      type: 'generic',
      properties: {
        headers: {
          'x-goog-api-key': '={{$credentials.apiKey}}',
        },
      },
    };

    test: ICredentialTestRequest = {
      request: {
        baseURL: 'https://generativelanguage.googleapis.com/v1beta',
        url: '/fileSearchStores',
        qs: {
          pageSize: 1,
        },
      },
    };
  }
  ```
- [ ] Add credential to package.json under `n8n.credentials`
- [ ] Create unit tests for credential configuration
- [ ] Test credential validation with valid/invalid keys

**Acceptance Criteria:**
- Credential appears in n8n credential selector
- Test connection succeeds with valid API key
- Test connection fails with invalid API key
- Error message is user-friendly

**Dependencies:** Phase 1

---

### 2.2 Shared Utilities Implementation

**Duration**: 2-3 days
**Complexity**: Moderate

#### 2.2.1 API Client
**Tasks:**
- [ ] Create `utils/apiClient.ts`:
  ```typescript
  import {
    IExecuteFunctions,
    ILoadOptionsFunctions,
    IDataObject,
    NodeApiError,
    NodeOperationError,
  } from 'n8n-workflow';

  export async function geminiApiRequest(
    this: IExecuteFunctions | ILoadOptionsFunctions,
    method: string,
    endpoint: string,
    body: IDataObject = {},
    qs: IDataObject = {},
  ): Promise<any> {
    const credentials = await this.getCredentials('geminiApi');

    const options = {
      method,
      body,
      qs: {
        ...qs,
        key: credentials.apiKey,
      },
      uri: `https://generativelanguage.googleapis.com/v1beta${endpoint}`,
      json: true,
    };

    try {
      return await this.helpers.request(options);
    } catch (error) {
      throw new NodeApiError(this.getNode(), error);
    }
  }

  export async function geminiApiRequestAllItems(
    this: IExecuteFunctions | ILoadOptionsFunctions,
    propertyName: string,
    method: string,
    endpoint: string,
    body: IDataObject = {},
    qs: IDataObject = {},
  ): Promise<any[]> {
    const returnData: IDataObject[] = [];
    let responseData;
    qs.pageSize = qs.pageSize || 20;

    do {
      responseData = await geminiApiRequest.call(this, method, endpoint, body, qs);
      qs.pageToken = responseData.nextPageToken;
      returnData.push(...responseData[propertyName]);
    } while (responseData.nextPageToken);

    return returnData;
  }
  ```
- [ ] Implement resumable upload function:
  ```typescript
  export async function geminiResumableUpload(
    this: IExecuteFunctions,
    storeName: string,
    file: Buffer,
    mimeType: string,
    metadata: IDataObject,
  ): Promise<any> {
    const credentials = await this.getCredentials('geminiApi');
    const uploadUrl = `https://generativelanguage.googleapis.com/upload/v1beta/${storeName}:uploadToFileSearchStore`;

    // Start upload session
    const startResponse = await this.helpers.request({
      method: 'POST',
      url: `${uploadUrl}?key=${credentials.apiKey}`,
      headers: {
        'X-Goog-Upload-Protocol': 'resumable',
        'X-Goog-Upload-Command': 'start',
        'X-Goog-Upload-Header-Content-Length': file.length.toString(),
        'X-Goog-Upload-Header-Content-Type': mimeType,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(metadata),
      resolveWithFullResponse: true,
    });

    const uploadSessionUrl = startResponse.headers['x-goog-upload-url'];

    // Upload file data
    return await this.helpers.request({
      method: 'POST',
      url: uploadSessionUrl,
      headers: {
        'Content-Length': file.length.toString(),
        'X-Goog-Upload-Offset': '0',
        'X-Goog-Upload-Command': 'upload, finalize',
      },
      body: file,
      json: true,
    });
  }
  ```
- [ ] Implement operation polling function:
  ```typescript
  export async function pollOperation(
    this: IExecuteFunctions,
    operationName: string,
    maxAttempts: number = 120,
    intervalMs: number = 5000,
  ): Promise<any> {
    for (let i = 0; i < maxAttempts; i++) {
      const operation = await geminiApiRequest.call(
        this,
        'GET',
        `/${operationName}`,
      );

      if (operation.done) {
        if (operation.error) {
          throw new NodeOperationError(
            this.getNode(),
            `Operation failed: ${operation.error.message}`,
            { description: operation.error.details }
          );
        }
        return operation.response;
      }

      await new Promise(resolve => setTimeout(resolve, intervalMs));
    }

    throw new NodeOperationError(
      this.getNode(),
      'Operation timeout: exceeded 10 minutes',
    );
  }
  ```
- [ ] Create unit tests for API client functions
- [ ] Test error handling for various HTTP status codes
- [ ] Test pagination logic
- [ ] Test resumable upload flow
- [ ] Test operation polling with mocked responses

**Acceptance Criteria:**
- API client successfully makes authenticated requests
- Pagination retrieves all items correctly
- Resumable upload handles large files
- Operation polling detects completion and errors
- All error cases have appropriate error messages

**Dependencies:** 2.1

---

#### 2.2.2 Validators
**Tasks:**
- [ ] Create `utils/validators.ts`:
  ```typescript
  import { NodeOperationError, IExecuteFunctions } from 'n8n-workflow';

  export function validateStoreName(
    this: IExecuteFunctions,
    name: string,
  ): void {
    const pattern = /^fileSearchStores\/[a-z0-9-]{1,40}$/;
    if (!pattern.test(name)) {
      throw new NodeOperationError(
        this.getNode(),
        'Invalid store name format. Must be: fileSearchStores/{id} where id is 1-40 lowercase alphanumeric characters or dashes',
      );
    }
  }

  export function validateDisplayName(
    this: IExecuteFunctions,
    name: string,
  ): void {
    if (name.length > 512) {
      throw new NodeOperationError(
        this.getNode(),
        'Display name must be 512 characters or less',
      );
    }
  }

  export function validateCustomMetadata(
    this: IExecuteFunctions,
    metadata: any[],
  ): void {
    if (metadata.length > 20) {
      throw new NodeOperationError(
        this.getNode(),
        'Maximum 20 custom metadata items allowed',
      );
    }

    for (const item of metadata) {
      if (!item.key) {
        throw new NodeOperationError(
          this.getNode(),
          'Custom metadata must have a key',
        );
      }

      const valueCount = [
        item.stringValue,
        item.stringListValue,
        item.numericValue,
      ].filter(v => v !== undefined).length;

      if (valueCount !== 1) {
        throw new NodeOperationError(
          this.getNode(),
          `Custom metadata "${item.key}" must have exactly one value type (stringValue, stringListValue, or numericValue)`,
        );
      }
    }
  }

  export function validateMetadataFilter(
    this: IExecuteFunctions,
    filter: string,
  ): void {
    // Check for balanced quotes
    const quotes = filter.match(/"/g);
    if (quotes && quotes.length % 2 !== 0) {
      throw new NodeOperationError(
        this.getNode(),
        'Metadata filter has unbalanced quotes',
      );
    }

    // Check for balanced parentheses
    let depth = 0;
    for (const char of filter) {
      if (char === '(') depth++;
      if (char === ')') depth--;
      if (depth < 0) {
        throw new NodeOperationError(
          this.getNode(),
          'Metadata filter has unbalanced parentheses',
        );
      }
    }
    if (depth !== 0) {
      throw new NodeOperationError(
        this.getNode(),
        'Metadata filter has unbalanced parentheses',
      );
    }
  }

  export function validateFileSize(
    this: IExecuteFunctions,
    sizeBytes: number,
  ): void {
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (sizeBytes > maxSize) {
      throw new NodeOperationError(
        this.getNode(),
        `File size (${(sizeBytes / 1024 / 1024).toFixed(2)}MB) exceeds maximum of 100MB`,
      );
    }
  }
  ```
- [ ] Create unit tests for each validator
- [ ] Test edge cases (empty strings, special characters, etc.)
- [ ] Test error messages are user-friendly

**Acceptance Criteria:**
- All validators catch invalid inputs
- Error messages clearly explain what's wrong
- Valid inputs pass without errors

**Dependencies:** 2.1

---

#### 2.2.3 Rate Limiter
**Tasks:**
- [ ] Create `utils/rateLimiter.ts`:
  ```typescript
  export class RateLimiter {
    private requests: number[] = [];
    private readonly maxRequests: number;
    private readonly windowMs: number;

    constructor(maxRequests: number = 10, windowMs: number = 60000) {
      this.maxRequests = maxRequests;
      this.windowMs = windowMs;
    }

    async throttle(): Promise<void> {
      const now = Date.now();
      this.requests = this.requests.filter(t => now - t < this.windowMs);

      if (this.requests.length >= this.maxRequests) {
        const oldestRequest = this.requests[0];
        const waitTime = this.windowMs - (now - oldestRequest);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        return this.throttle(); // Retry after waiting
      }

      this.requests.push(Date.now());
    }

    reset(): void {
      this.requests = [];
    }
  }
  ```
- [ ] Create unit tests for rate limiter
- [ ] Test that requests are throttled correctly
- [ ] Test reset functionality

**Acceptance Criteria:**
- Rate limiter prevents exceeding configured limits
- Requests wait appropriate amount before retrying
- Reset clears request history

**Dependencies:** 2.1

---

#### 2.2.4 Type Definitions
**Tasks:**
- [ ] Create `utils/types.ts`:
  ```typescript
  export interface FileSearchStore {
    name: string;
    displayName?: string;
    createTime: string;
    updateTime: string;
    activeDocumentsCount: string;
    pendingDocumentsCount: string;
    failedDocumentsCount: string;
    sizeBytes: string;
  }

  export interface Document {
    name: string;
    displayName?: string;
    customMetadata?: CustomMetadata[];
    createTime: string;
    updateTime: string;
    state: DocumentState;
    sizeBytes: string;
    mimeType: string;
  }

  export interface CustomMetadata {
    key: string;
    stringValue?: string;
    stringListValue?: { values: string[] };
    numericValue?: number;
  }

  export enum DocumentState {
    STATE_UNSPECIFIED = 'STATE_UNSPECIFIED',
    STATE_PENDING = 'STATE_PENDING',
    STATE_ACTIVE = 'STATE_ACTIVE',
    STATE_FAILED = 'STATE_FAILED',
  }

  export interface ChunkingConfig {
    whiteSpaceConfig?: {
      maxTokensPerChunk?: number;
      maxOverlapTokens?: number;
    };
  }

  export interface Operation {
    name: string;
    metadata?: {
      '@type': string;
      [key: string]: any;
    };
    done: boolean;
    error?: {
      code: number;
      message: string;
      details?: any[];
    };
    response?: any;
  }
  ```
- [ ] Export all types from index file
- [ ] Ensure TypeScript compilation succeeds

**Acceptance Criteria:**
- All types match API specification
- Types are properly exported and importable
- No TypeScript compilation errors

**Dependencies:** None (can be done in parallel with other tasks)

---

### 2.3 Store Operations Node Implementation

**Duration**: 3-4 days
**Complexity**: Moderate

#### 2.3.1 Node Setup
**Tasks:**
- [ ] Create `nodes/GeminiFileSearchStores/GeminiFileSearchStores.node.ts`:
  ```typescript
  import {
    IExecuteFunctions,
    INodeExecutionData,
    INodeType,
    INodeTypeDescription,
  } from 'n8n-workflow';
  import { storeOperations, storeFields } from './descriptions/StoreDescription';
  import * as store from './operations/store';

  export class GeminiFileSearchStores implements INodeType {
    description: INodeTypeDescription = {
      displayName: 'Gemini File Search Stores',
      name: 'geminiFileSearchStores',
      icon: 'file:gemini.svg',
      group: ['transform'],
      version: 1,
      subtitle: '={{$parameter["operation"]}}',
      description: 'Manage File Search stores for Gemini RAG operations',
      defaults: {
        name: 'Gemini File Search Stores',
      },
      inputs: ['main'],
      outputs: ['main'],
      credentials: [
        {
          name: 'geminiApi',
          required: true,
        },
      ],
      properties: [
        {
          displayName: 'Operation',
          name: 'operation',
          type: 'options',
          noDataExpression: true,
          options: [
            {
              name: 'Create',
              value: 'create',
              description: 'Create a new File Search store',
              action: 'Create a store',
            },
            {
              name: 'Delete',
              value: 'delete',
              description: 'Delete a File Search store',
              action: 'Delete a store',
            },
            {
              name: 'Get',
              value: 'get',
              description: 'Get a File Search store',
              action: 'Get a store',
            },
            {
              name: 'Get Operation Status',
              value: 'getOperation',
              description: 'Get status of a long-running operation',
              action: 'Get operation status',
            },
            {
              name: 'List',
              value: 'list',
              description: 'List all File Search stores',
              action: 'List stores',
            },
          ],
          default: 'create',
        },
        ...storeFields,
      ],
    };

    async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
      const items = this.getInputData();
      const returnData: INodeExecutionData[] = [];
      const operation = this.getNodeParameter('operation', 0) as string;

      for (let i = 0; i < items.length; i++) {
        try {
          let responseData;

          if (operation === 'create') {
            responseData = await store.create.call(this, i);
          } else if (operation === 'delete') {
            responseData = await store.deleteStore.call(this, i);
          } else if (operation === 'get') {
            responseData = await store.get.call(this, i);
          } else if (operation === 'getOperation') {
            responseData = await store.getOperation.call(this, i);
          } else if (operation === 'list') {
            responseData = await store.list.call(this, i);
          }

          const executionData = this.helpers.constructExecutionMetaData(
            this.helpers.returnJsonArray(responseData),
            { itemData: { item: i } },
          );

          returnData.push(...executionData);
        } catch (error) {
          if (this.continueOnFail()) {
            returnData.push({
              json: { error: error.message },
              pairedItem: { item: i },
            });
            continue;
          }
          throw error;
        }
      }

      return [returnData];
    }
  }
  ```
- [ ] Create node metadata file `GeminiFileSearchStores.node.json`
- [ ] Add Gemini logo to assets directory
- [ ] Register node in package.json

**Acceptance Criteria:**
- Node appears in n8n node palette
- Operation selector shows all 5 operations
- Node has proper icon and description

**Dependencies:** 2.2

---

#### 2.3.2 Store Descriptions
**Tasks:**
- [ ] Create `nodes/GeminiFileSearchStores/descriptions/StoreDescription.ts`:
  ```typescript
  import { INodeProperties } from 'n8n-workflow';

  export const storeFields: INodeProperties[] = [
    // Create operation fields
    {
      displayName: 'Display Name',
      name: 'displayName',
      type: 'string',
      default: '',
      displayOptions: {
        show: {
          operation: ['create'],
        },
      },
      description: 'Human-readable display name for the store (max 512 characters)',
    },

    // Get/Delete operation fields
    {
      displayName: 'Store Name',
      name: 'storeName',
      type: 'string',
      required: true,
      displayOptions: {
        show: {
          operation: ['get', 'delete'],
        },
      },
      placeholder: 'fileSearchStores/my-store-123',
      description: 'The resource name of the store',
    },

    // Delete operation fields
    {
      displayName: 'Force',
      name: 'force',
      type: 'boolean',
      default: false,
      displayOptions: {
        show: {
          operation: ['delete'],
        },
      },
      description: 'Whether to delete the store even if it contains documents',
    },

    // List operation fields
    {
      displayName: 'Return All',
      name: 'returnAll',
      type: 'boolean',
      default: false,
      displayOptions: {
        show: {
          operation: ['list'],
        },
      },
      description: 'Whether to return all results or only up to a given limit',
    },
    {
      displayName: 'Limit',
      name: 'limit',
      type: 'number',
      default: 10,
      displayOptions: {
        show: {
          operation: ['list'],
          returnAll: [false],
        },
      },
      typeOptions: {
        minValue: 1,
        maxValue: 20,
      },
      description: 'Max number of results to return',
    },

    // Get Operation fields
    {
      displayName: 'Operation Name',
      name: 'operationName',
      type: 'string',
      required: true,
      displayOptions: {
        show: {
          operation: ['getOperation'],
        },
      },
      placeholder: 'fileSearchStores/my-store-123/operations/op-456',
      description: 'The resource name of the operation',
    },
  ];
  ```

**Acceptance Criteria:**
- All field descriptions are accurate
- Fields show/hide based on operation selection
- Field validations work correctly

**Dependencies:** 2.3.1

---

#### 2.3.3 Store Operations Implementation
**Tasks:**
- [ ] Implement `nodes/GeminiFileSearchStores/operations/store/create.ts`:
  ```typescript
  import { IExecuteFunctions } from 'n8n-workflow';
  import { geminiApiRequest } from '../../../../utils/apiClient';
  import { validateDisplayName } from '../../../../utils/validators';

  export async function create(
    this: IExecuteFunctions,
    index: number,
  ): Promise<any> {
    const displayName = this.getNodeParameter('displayName', index) as string;

    if (displayName) {
      validateDisplayName.call(this, displayName);
    }

    const body: any = {};
    if (displayName) {
      body.displayName = displayName;
    }

    return await geminiApiRequest.call(
      this,
      'POST',
      '/fileSearchStores',
      body,
    );
  }
  ```
- [ ] Implement `list.ts`:
  ```typescript
  import { IExecuteFunctions } from 'n8n-workflow';
  import { geminiApiRequest, geminiApiRequestAllItems } from '../../../../utils/apiClient';

  export async function list(
    this: IExecuteFunctions,
    index: number,
  ): Promise<any> {
    const returnAll = this.getNodeParameter('returnAll', index);

    if (returnAll) {
      return await geminiApiRequestAllItems.call(
        this,
        'fileSearchStores',
        'GET',
        '/fileSearchStores',
      );
    } else {
      const limit = this.getNodeParameter('limit', index) as number;
      const response = await geminiApiRequest.call(
        this,
        'GET',
        '/fileSearchStores',
        {},
        { pageSize: limit },
      );
      return response.fileSearchStores || [];
    }
  }
  ```
- [ ] Implement `get.ts`:
  ```typescript
  import { IExecuteFunctions } from 'n8n-workflow';
  import { geminiApiRequest } from '../../../../utils/apiClient';
  import { validateStoreName } from '../../../../utils/validators';

  export async function get(
    this: IExecuteFunctions,
    index: number,
  ): Promise<any> {
    const storeName = this.getNodeParameter('storeName', index) as string;
    validateStoreName.call(this, storeName);

    return await geminiApiRequest.call(
      this,
      'GET',
      `/${storeName}`,
    );
  }
  ```
- [ ] Implement `delete.ts`:
  ```typescript
  import { IExecuteFunctions } from 'n8n-workflow';
  import { geminiApiRequest } from '../../../../utils/apiClient';
  import { validateStoreName } from '../../../../utils/validators';

  export async function deleteStore(
    this: IExecuteFunctions,
    index: number,
  ): Promise<any> {
    const storeName = this.getNodeParameter('storeName', index) as string;
    const force = this.getNodeParameter('force', index) as boolean;

    validateStoreName.call(this, storeName);

    await geminiApiRequest.call(
      this,
      'DELETE',
      `/${storeName}`,
      {},
      { force },
    );

    return { success: true };
  }
  ```
- [ ] Implement `getOperation.ts`:
  ```typescript
  import { IExecuteFunctions } from 'n8n-workflow';
  import { geminiApiRequest } from '../../../../utils/apiClient';

  export async function getOperation(
    this: IExecuteFunctions,
    index: number,
  ): Promise<any> {
    const operationName = this.getNodeParameter('operationName', index) as string;

    return await geminiApiRequest.call(
      this,
      'GET',
      `/${operationName}`,
    );
  }
  ```
- [ ] Create barrel export `operations/store/index.ts`:
  ```typescript
  export { create } from './create';
  export { list } from './list';
  export { get } from './get';
  export { deleteStore } from './delete';
  export { getOperation } from './getOperation';
  ```
- [ ] Create unit tests for each operation
- [ ] Test error handling for each operation

**Acceptance Criteria:**
- All 5 store operations work correctly
- Validation catches invalid inputs
- Error messages are user-friendly
- Operations return expected data structures

**Dependencies:** 2.3.2

---

### 2.4 Document Operations Node Implementation

**Duration**: 5-6 days
**Complexity**: Complex

#### 2.4.1 Node Setup
**Tasks:**
- [ ] Create `nodes/GeminiFileSearchDocuments/GeminiFileSearchDocuments.node.ts`
- [ ] Create node metadata file
- [ ] Register node in package.json
- [ ] Add node to n8n palette

**Acceptance Criteria:**
- Node appears in n8n palette
- Operation selector shows all 6 operations
- Node has proper icon and description

**Dependencies:** 2.2

---

#### 2.4.2 Document Descriptions
**Tasks:**
- [ ] Create `nodes/GeminiFileSearchDocuments/descriptions/DocumentDescription.ts`:
  ```typescript
  import { INodeProperties } from 'n8n-workflow';

  export const documentFields: INodeProperties[] = [
    // Common: Store selection
    {
      displayName: 'Store',
      name: 'storeName',
      type: 'string',
      required: true,
      displayOptions: {
        show: {
          operation: ['upload', 'import', 'list'],
        },
      },
      placeholder: 'fileSearchStores/my-store-123',
      description: 'The name of the File Search store',
    },

    // Upload operation fields
    {
      displayName: 'Input Binary Field',
      name: 'binaryPropertyName',
      type: 'string',
      default: 'data',
      required: true,
      displayOptions: {
        show: {
          operation: ['upload'],
        },
      },
      description: 'Name of the binary property containing the file to upload',
    },
    {
      displayName: 'Display Name',
      name: 'displayName',
      type: 'string',
      default: '',
      displayOptions: {
        show: {
          operation: ['upload', 'import'],
        },
      },
      description: 'Human-readable display name for the document',
    },
    {
      displayName: 'Custom Metadata',
      name: 'customMetadata',
      type: 'fixedCollection',
      typeOptions: {
        multipleValues: true,
      },
      default: {},
      displayOptions: {
        show: {
          operation: ['upload', 'import'],
        },
      },
      description: 'Custom metadata key-value pairs (max 20)',
      options: [
        {
          name: 'metadataValues',
          displayName: 'Metadata',
          values: [
            {
              displayName: 'Key',
              name: 'key',
              type: 'string',
              default: '',
              description: 'Metadata key',
            },
            {
              displayName: 'Value Type',
              name: 'valueType',
              type: 'options',
              options: [
                {
                  name: 'String',
                  value: 'string',
                },
                {
                  name: 'Number',
                  value: 'number',
                },
                {
                  name: 'String List',
                  value: 'stringList',
                },
              ],
              default: 'string',
            },
            {
              displayName: 'Value',
              name: 'value',
              type: 'string',
              default: '',
              displayOptions: {
                show: {
                  valueType: ['string', 'number'],
                },
              },
            },
            {
              displayName: 'Values',
              name: 'values',
              type: 'string',
              default: '',
              displayOptions: {
                show: {
                  valueType: ['stringList'],
                },
              },
              description: 'Comma-separated list of values',
            },
          ],
        },
      ],
    },
    {
      displayName: 'Chunking Options',
      name: 'chunkingOptions',
      type: 'collection',
      placeholder: 'Add Option',
      default: {},
      displayOptions: {
        show: {
          operation: ['upload', 'import'],
        },
      },
      options: [
        {
          displayName: 'Max Tokens Per Chunk',
          name: 'maxTokensPerChunk',
          type: 'number',
          default: 200,
          description: 'Maximum number of tokens per chunk',
        },
        {
          displayName: 'Max Overlap Tokens',
          name: 'maxOverlapTokens',
          type: 'number',
          default: 20,
          description: 'Maximum number of overlapping tokens between chunks',
        },
      ],
    },
    {
      displayName: 'Wait for Completion',
      name: 'waitForCompletion',
      type: 'boolean',
      default: true,
      displayOptions: {
        show: {
          operation: ['upload', 'import'],
        },
      },
      description: 'Whether to wait for the upload/import operation to complete',
    },

    // Import operation fields
    {
      displayName: 'File Name',
      name: 'fileName',
      type: 'string',
      required: true,
      displayOptions: {
        show: {
          operation: ['import'],
        },
      },
      placeholder: 'files/abc-123',
      description: 'The resource name of the file to import (from Files API)',
    },

    // List operation fields
    {
      displayName: 'Return All',
      name: 'returnAll',
      type: 'boolean',
      default: false,
      displayOptions: {
        show: {
          operation: ['list'],
        },
      },
      description: 'Whether to return all results or only up to a given limit',
    },
    {
      displayName: 'Limit',
      name: 'limit',
      type: 'number',
      default: 10,
      displayOptions: {
        show: {
          operation: ['list'],
          returnAll: [false],
        },
      },
      typeOptions: {
        minValue: 1,
        maxValue: 20,
      },
      description: 'Max number of results to return',
    },

    // Get/Delete operation fields
    {
      displayName: 'Document Name',
      name: 'documentName',
      type: 'string',
      required: true,
      displayOptions: {
        show: {
          operation: ['get', 'delete'],
        },
      },
      placeholder: 'fileSearchStores/my-store-123/documents/doc-abc',
      description: 'The resource name of the document',
    },
    {
      displayName: 'Force',
      name: 'force',
      type: 'boolean',
      default: false,
      displayOptions: {
        show: {
          operation: ['delete'],
        },
      },
      description: 'Whether to delete the document even if it contains chunks',
    },

    // Query operation fields
    {
      displayName: 'Model',
      name: 'model',
      type: 'options',
      required: true,
      displayOptions: {
        show: {
          operation: ['query'],
        },
      },
      options: [
        {
          name: 'Gemini 2.5 Flash',
          value: 'gemini-2.5-flash',
        },
        {
          name: 'Gemini 2.5 Pro',
          value: 'gemini-2.5-pro',
        },
        {
          name: 'Gemini 3 Pro Preview',
          value: 'gemini-3-pro-preview',
        },
      ],
      default: 'gemini-2.5-flash',
      description: 'The Gemini model to use for querying',
    },
    {
      displayName: 'Query',
      name: 'query',
      type: 'string',
      required: true,
      displayOptions: {
        show: {
          operation: ['query'],
        },
      },
      typeOptions: {
        rows: 4,
      },
      default: '',
      description: 'The query to search for in the documents',
      placeholder: 'What are the key findings about transformer models?',
    },
    {
      displayName: 'Store Names',
      name: 'storeNames',
      type: 'string',
      required: true,
      displayOptions: {
        show: {
          operation: ['query'],
        },
      },
      default: '',
      description: 'Comma-separated list of store names to search',
      placeholder: 'fileSearchStores/store-1,fileSearchStores/store-2',
    },
    {
      displayName: 'Metadata Filter',
      name: 'metadataFilter',
      type: 'string',
      default: '',
      displayOptions: {
        show: {
          operation: ['query'],
        },
      },
      description: 'Filter expression in AIP-160 format',
      placeholder: 'author="John Doe" AND year>=2023',
    },
  ];
  ```

**Acceptance Criteria:**
- All fields display correctly based on operation
- Field validations work properly
- Custom metadata collection allows multiple entries
- Chunking options are optional

**Dependencies:** 2.4.1

---

#### 2.4.3 Document Operations Implementation
**Tasks:**
- [ ] Implement `upload.ts`:
  ```typescript
  import { IExecuteFunctions } from 'n8n-workflow';
  import {
    geminiResumableUpload,
    pollOperation,
  } from '../../../../utils/apiClient';
  import {
    validateStoreName,
    validateDisplayName,
    validateCustomMetadata,
    validateFileSize,
  } from '../../../../utils/validators';

  export async function upload(
    this: IExecuteFunctions,
    index: number,
  ): Promise<any> {
    const storeName = this.getNodeParameter('storeName', index) as string;
    const binaryPropertyName = this.getNodeParameter('binaryPropertyName', index) as string;
    const displayName = this.getNodeParameter('displayName', index, '') as string;
    const waitForCompletion = this.getNodeParameter('waitForCompletion', index) as boolean;

    validateStoreName.call(this, storeName);
    if (displayName) {
      validateDisplayName.call(this, displayName);
    }

    // Get binary data
    const binaryData = this.helpers.assertBinaryData(index, binaryPropertyName);
    const fileBuffer = await this.helpers.getBinaryDataBuffer(index, binaryPropertyName);

    validateFileSize.call(this, fileBuffer.length);

    // Build metadata
    const metadata: any = {};
    if (displayName) {
      metadata.displayName = displayName;
    }

    // Parse custom metadata
    const customMetadataParam = this.getNodeParameter('customMetadata', index, {}) as any;
    if (customMetadataParam.metadataValues?.length) {
      metadata.customMetadata = customMetadataParam.metadataValues.map((item: any) => {
        const metadataItem: any = { key: item.key };
        if (item.valueType === 'string') {
          metadataItem.stringValue = item.value;
        } else if (item.valueType === 'number') {
          metadataItem.numericValue = parseFloat(item.value);
        } else if (item.valueType === 'stringList') {
          metadataItem.stringListValue = {
            values: item.values.split(',').map((v: string) => v.trim()),
          };
        }
        return metadataItem;
      });

      validateCustomMetadata.call(this, metadata.customMetadata);
    }

    // Parse chunking options
    const chunkingOptions = this.getNodeParameter('chunkingOptions', index, {}) as any;
    if (chunkingOptions.maxTokensPerChunk || chunkingOptions.maxOverlapTokens) {
      metadata.chunkingConfig = {
        whiteSpaceConfig: {
          ...(chunkingOptions.maxTokensPerChunk && {
            maxTokensPerChunk: chunkingOptions.maxTokensPerChunk,
          }),
          ...(chunkingOptions.maxOverlapTokens && {
            maxOverlapTokens: chunkingOptions.maxOverlapTokens,
          }),
        },
      };
    }

    // Upload file
    const operation = await geminiResumableUpload.call(
      this,
      storeName,
      fileBuffer,
      binaryData.mimeType,
      metadata,
    );

    // Wait for completion if requested
    if (waitForCompletion) {
      return await pollOperation.call(this, operation.name);
    }

    return operation;
  }
  ```
- [ ] Implement `import.ts`:
  ```typescript
  import { IExecuteFunctions } from 'n8n-workflow';
  import {
    geminiApiRequest,
    pollOperation,
  } from '../../../../utils/apiClient';
  import {
    validateStoreName,
    validateDisplayName,
    validateCustomMetadata,
  } from '../../../../utils/validators';

  export async function importFile(
    this: IExecuteFunctions,
    index: number,
  ): Promise<any> {
    const storeName = this.getNodeParameter('storeName', index) as string;
    const fileName = this.getNodeParameter('fileName', index) as string;
    const displayName = this.getNodeParameter('displayName', index, '') as string;
    const waitForCompletion = this.getNodeParameter('waitForCompletion', index) as boolean;

    validateStoreName.call(this, storeName);
    if (displayName) {
      validateDisplayName.call(this, displayName);
    }

    // Build request body
    const body: any = { fileName };
    if (displayName) {
      body.displayName = displayName;
    }

    // Parse custom metadata
    const customMetadataParam = this.getNodeParameter('customMetadata', index, {}) as any;
    if (customMetadataParam.metadataValues?.length) {
      body.customMetadata = customMetadataParam.metadataValues.map((item: any) => {
        const metadataItem: any = { key: item.key };
        if (item.valueType === 'string') {
          metadataItem.stringValue = item.value;
        } else if (item.valueType === 'number') {
          metadataItem.numericValue = parseFloat(item.value);
        } else if (item.valueType === 'stringList') {
          metadataItem.stringListValue = {
            values: item.values.split(',').map((v: string) => v.trim()),
          };
        }
        return metadataItem;
      });

      validateCustomMetadata.call(this, body.customMetadata);
    }

    // Parse chunking options
    const chunkingOptions = this.getNodeParameter('chunkingOptions', index, {}) as any;
    if (chunkingOptions.maxTokensPerChunk || chunkingOptions.maxOverlapTokens) {
      body.chunkingConfig = {
        whiteSpaceConfig: {
          ...(chunkingOptions.maxTokensPerChunk && {
            maxTokensPerChunk: chunkingOptions.maxTokensPerChunk,
          }),
          ...(chunkingOptions.maxOverlapTokens && {
            maxOverlapTokens: chunkingOptions.maxOverlapTokens,
          }),
        },
      };
    }

    // Import file
    const operation = await geminiApiRequest.call(
      this,
      'POST',
      `/${storeName}:importFile`,
      body,
    );

    // Wait for completion if requested
    if (waitForCompletion) {
      return await pollOperation.call(this, operation.name);
    }

    return operation;
  }
  ```
- [ ] Implement `list.ts`, `get.ts`, `delete.ts` (similar patterns to Store operations)
- [ ] Implement `query.ts`:
  ```typescript
  import { IExecuteFunctions } from 'n8n-workflow';
  import { geminiApiRequest } from '../../../../utils/apiClient';
  import { validateMetadataFilter } from '../../../../utils/validators';

  export async function query(
    this: IExecuteFunctions,
    index: number,
  ): Promise<any> {
    const model = this.getNodeParameter('model', index) as string;
    const query = this.getNodeParameter('query', index) as string;
    const storeNamesParam = this.getNodeParameter('storeNames', index) as string;
    const metadataFilter = this.getNodeParameter('metadataFilter', index, '') as string;

    const storeNames = storeNamesParam.split(',').map(s => s.trim());

    if (metadataFilter) {
      validateMetadataFilter.call(this, metadataFilter);
    }

    const body: any = {
      contents: [
        {
          parts: [{ text: query }],
        },
      ],
      tools: [
        {
          fileSearch: {
            fileSearchStoreNames: storeNames,
            ...(metadataFilter && { metadataFilter }),
          },
        },
      ],
    };

    return await geminiApiRequest.call(
      this,
      'POST',
      `/models/${model}:generateContent`,
      body,
    );
  }
  ```
- [ ] Create barrel exports
- [ ] Create unit tests for each operation
- [ ] Test error handling

**Acceptance Criteria:**
- All 6 document operations work correctly
- File upload handles binary data properly
- Metadata is properly formatted
- Query returns results with grounding metadata
- All validations work correctly

**Dependencies:** 2.4.2

---

### Phase 2 Deliverables

- [ ] Functional credential node
- [ ] Complete Store operations node (5 operations)
- [ ] Complete Document operations node (6 operations)
- [ ] Shared utilities (API client, validators, rate limiter)
- [ ] Type definitions
- [ ] Unit tests for all components

### Phase 2 Acceptance Criteria

- [ ] All nodes appear in n8n palette
- [ ] All operations execute without errors
- [ ] Validation catches invalid inputs
- [ ] Error messages are user-friendly
- [ ] Unit tests pass with >80% coverage

---

## Phase 3: Testing Strategy

**Duration**: 8-10 days
**Complexity**: Complex
**Dependencies**: Phase 2

### Objectives
- Comprehensive unit test coverage
- Integration tests with real API
- End-to-end workflow tests
- Performance and load testing
- Test data management

---

### 3.1 Unit Testing

**Duration**: 3-4 days
**Complexity**: Moderate

#### 3.1.1 Utility Function Tests
**Tasks:**
- [ ] Create `test/unit/utils/apiClient.test.ts`:
  - Test successful API requests
  - Test authentication
  - Test pagination logic
  - Test error handling for different HTTP status codes
  - Test resumable upload flow
  - Test operation polling (success, timeout, error)
- [ ] Create `test/unit/utils/validators.test.ts`:
  - Test each validator with valid inputs
  - Test each validator with invalid inputs
  - Test edge cases (empty strings, special characters, etc.)
  - Test error messages
- [ ] Create `test/unit/utils/rateLimiter.test.ts`:
  - Test rate limiting behavior
  - Test reset functionality
  - Test concurrent requests
- [ ] Run tests: `npm run test:unit`
- [ ] Verify coverage: `npm run test:coverage`

**Acceptance Criteria:**
- All utility unit tests pass
- Coverage >90% for utils directory
- Edge cases covered
- Mock responses realistic

**Dependencies:** Phase 2 complete

---

#### 3.1.2 Store Operations Tests
**Tasks:**
- [ ] Create `test/unit/nodes/stores/create.test.ts`:
  ```typescript
  import { IExecuteFunctions } from 'n8n-workflow';
  import { create } from '../../../../nodes/GeminiFileSearchStores/operations/store/create';
  import * as apiClient from '../../../../utils/apiClient';

  jest.mock('../../../../utils/apiClient');

  describe('Store Create Operation', () => {
    let mockExecuteFunctions: IExecuteFunctions;

    beforeEach(() => {
      mockExecuteFunctions = {
        getNodeParameter: jest.fn(),
        getNode: jest.fn(() => ({ name: 'Test Node' })),
      } as unknown as IExecuteFunctions;
    });

    it('should create store with display name', async () => {
      (mockExecuteFunctions.getNodeParameter as jest.Mock)
        .mockReturnValue('My Test Store');
      (apiClient.geminiApiRequest as jest.Mock).mockResolvedValue({
        name: 'fileSearchStores/test-123',
        displayName: 'My Test Store',
      });

      const result = await create.call(mockExecuteFunctions, 0);

      expect(result.name).toBe('fileSearchStores/test-123');
      expect(apiClient.geminiApiRequest).toHaveBeenCalledWith(
        'POST',
        '/fileSearchStores',
        { displayName: 'My Test Store' },
      );
    });

    it('should create store without display name', async () => {
      (mockExecuteFunctions.getNodeParameter as jest.Mock).mockReturnValue('');
      (apiClient.geminiApiRequest as jest.Mock).mockResolvedValue({
        name: 'fileSearchStores/test-456',
      });

      const result = await create.call(mockExecuteFunctions, 0);

      expect(result.name).toBe('fileSearchStores/test-456');
      expect(apiClient.geminiApiRequest).toHaveBeenCalledWith(
        'POST',
        '/fileSearchStores',
        {},
      );
    });

    it('should validate display name length', async () => {
      const longName = 'a'.repeat(513);
      (mockExecuteFunctions.getNodeParameter as jest.Mock).mockReturnValue(longName);

      await expect(create.call(mockExecuteFunctions, 0)).rejects.toThrow(
        'Display name must be 512 characters or less',
      );
    });
  });
  ```
- [ ] Create tests for all store operations: `list.test.ts`, `get.test.ts`, `delete.test.ts`, `getOperation.test.ts`
- [ ] Test success cases
- [ ] Test error cases
- [ ] Test validation
- [ ] Run tests and verify coverage

**Acceptance Criteria:**
- All store operation tests pass
- Coverage >85% for store operations
- Error cases properly tested
- Validation tests comprehensive

**Dependencies:** 3.1.1

---

#### 3.1.3 Document Operations Tests
**Tasks:**
- [ ] Create tests for `upload.test.ts`:
  - Test file upload with metadata
  - Test chunking configuration
  - Test file size validation
  - Test wait for completion
  - Test binary data handling
- [ ] Create tests for `import.test.ts`:
  - Test file import
  - Test metadata
  - Test chunking options
- [ ] Create tests for `list.test.ts`, `get.test.ts`, `delete.test.ts`
- [ ] Create tests for `query.test.ts`:
  - Test query with single store
  - Test query with multiple stores
  - Test metadata filtering
  - Test different models
  - Test response parsing
- [ ] Run tests and verify coverage

**Acceptance Criteria:**
- All document operation tests pass
- Coverage >85% for document operations
- Binary data handling tested
- Query operation thoroughly tested

**Dependencies:** 3.1.2

---

### 3.2 Integration Testing

**Duration**: 3-4 days
**Complexity**: Complex

#### 3.2.1 Test Environment Setup
**Tasks:**
- [ ] Create test Gemini API key (separate from production)
- [ ] Set up test environment variables:
  ```bash
  # .env.test
  GEMINI_API_KEY=test-api-key-123
  TEST_STORE_NAME=fileSearchStores/test-store
  TEST_TIMEOUT=30000
  ```
- [ ] Create test data fixtures:
  ```typescript
  // test/fixtures/testFiles.ts
  export const testPdfBuffer = Buffer.from('...'); // Small test PDF
  export const testTextBuffer = Buffer.from('Test document content');
  export const testMetadata = [
    { key: 'author', stringValue: 'Test Author' },
    { key: 'year', numericValue: 2024 },
  ];
  ```
- [ ] Create integration test helpers:
  ```typescript
  // test/integration/helpers.ts
  export async function createTestStore(displayName: string) {
    // Create store via API
  }

  export async function cleanupTestStore(storeName: string) {
    // Delete store and all documents
  }

  export async function waitForDocumentActive(documentName: string, maxWait: number) {
    // Poll document until STATE_ACTIVE
  }
  ```

**Acceptance Criteria:**
- Test environment configured
- Test fixtures created
- Helper functions work
- Cleanup functions prevent test pollution

**Dependencies:** Phase 2 complete

---

#### 3.2.2 Store Operations Integration Tests
**Tasks:**
- [ ] Create `test/integration/stores.integration.test.ts`:
  ```typescript
  describe('Store Operations Integration', () => {
    let testStoreName: string;

    afterEach(async () => {
      if (testStoreName) {
        await cleanupTestStore(testStoreName);
      }
    });

    it('should create and retrieve store', async () => {
      // Create store
      const createResult = await createTestStore('Integration Test Store');
      testStoreName = createResult.name;

      expect(createResult.displayName).toBe('Integration Test Store');

      // Retrieve store
      const getResult = await getTestStore(testStoreName);
      expect(getResult.name).toBe(testStoreName);
    });

    it('should list stores', async () => {
      // Create test store
      testStoreName = (await createTestStore('Test List Store')).name;

      // List stores
      const stores = await listTestStores();
      expect(stores.length).toBeGreaterThan(0);
      expect(stores.some(s => s.name === testStoreName)).toBe(true);
    });

    it('should delete store with force', async () => {
      // Create store with document
      testStoreName = (await createTestStore('Test Delete Store')).name;
      await uploadTestDocument(testStoreName, testTextBuffer);

      // Delete should fail without force
      await expect(deleteTestStore(testStoreName, false)).rejects.toThrow();

      // Delete should succeed with force
      await deleteTestStore(testStoreName, true);
      testStoreName = null; // Prevent cleanup

      // Verify deletion
      await expect(getTestStore(testStoreName)).rejects.toThrow();
    });
  });
  ```
- [ ] Test all store operations with real API
- [ ] Test error scenarios (404, 409, etc.)
- [ ] Test pagination
- [ ] Verify cleanup after tests

**Acceptance Criteria:**
- All integration tests pass
- Tests don't leave orphaned resources
- Error scenarios properly handled
- Tests complete in reasonable time (<5 min)

**Dependencies:** 3.2.1

---

#### 3.2.3 Document Operations Integration Tests
**Tasks:**
- [ ] Create `test/integration/documents.integration.test.ts`:
  ```typescript
  describe('Document Operations Integration', () => {
    let testStoreName: string;
    let testDocumentName: string;

    beforeAll(async () => {
      testStoreName = (await createTestStore('Integration Test Store')).name;
    });

    afterAll(async () => {
      await cleanupTestStore(testStoreName);
    });

    afterEach(async () => {
      if (testDocumentName) {
        await deleteTestDocument(testDocumentName, true);
        testDocumentName = null;
      }
    });

    it('should upload document and wait for completion', async () => {
      const operation = await uploadTestDocument(
        testStoreName,
        testTextBuffer,
        { displayName: 'Test Document' },
        true, // wait for completion
      );

      testDocumentName = operation.name;

      // Verify document is active
      const doc = await getTestDocument(testDocumentName);
      expect(doc.state).toBe('STATE_ACTIVE');
    });

    it('should upload document with custom metadata', async () => {
      const metadata = [
        { key: 'author', stringValue: 'John Doe' },
        { key: 'year', numericValue: 2024 },
        { key: 'tags', stringListValue: { values: ['test', 'integration'] } },
      ];

      const operation = await uploadTestDocument(
        testStoreName,
        testTextBuffer,
        { displayName: 'Doc with Metadata', customMetadata: metadata },
        true,
      );

      testDocumentName = operation.name;

      const doc = await getTestDocument(testDocumentName);
      expect(doc.customMetadata).toHaveLength(3);
      expect(doc.customMetadata[0].stringValue).toBe('John Doe');
    });

    it('should list documents', async () => {
      // Upload test document
      const operation = await uploadTestDocument(
        testStoreName,
        testTextBuffer,
        { displayName: 'List Test' },
        true,
      );
      testDocumentName = operation.name;

      // List documents
      const docs = await listTestDocuments(testStoreName);
      expect(docs.length).toBeGreaterThan(0);
      expect(docs.some(d => d.name === testDocumentName)).toBe(true);
    });

    it('should query documents', async () => {
      // Upload document with known content
      const content = 'The Eiffel Tower is located in Paris, France.';
      const buffer = Buffer.from(content);

      const operation = await uploadTestDocument(
        testStoreName,
        buffer,
        { displayName: 'Query Test' },
        true,
      );
      testDocumentName = operation.name;

      // Query documents
      const result = await queryTestDocuments(
        testStoreName,
        'Where is the Eiffel Tower located?',
        'gemini-2.5-flash',
      );

      expect(result.candidates).toHaveLength(1);
      expect(result.candidates[0].content.parts[0].text).toContain('Paris');
    });

    it('should query with metadata filter', async () => {
      // Upload documents with different metadata
      const op1 = await uploadTestDocument(
        testStoreName,
        Buffer.from('Document about AI from 2024'),
        {
          displayName: 'AI Doc 2024',
          customMetadata: [
            { key: 'category', stringValue: 'AI' },
            { key: 'year', numericValue: 2024 },
          ],
        },
        true,
      );

      const op2 = await uploadTestDocument(
        testStoreName,
        Buffer.from('Document about ML from 2023'),
        {
          displayName: 'ML Doc 2023',
          customMetadata: [
            { key: 'category', stringValue: 'ML' },
            { key: 'year', numericValue: 2023 },
          ],
        },
        true,
      );

      // Query with filter
      const result = await queryTestDocuments(
        testStoreName,
        'Tell me about AI',
        'gemini-2.5-flash',
        'category="AI" AND year=2024',
      );

      // Should only return AI doc from 2024
      expect(result.candidates[0].groundingMetadata.groundingChunks).toHaveLength(1);

      // Cleanup
      await deleteTestDocument(op1.name, true);
      await deleteTestDocument(op2.name, true);
    });
  });
  ```
- [ ] Test upload with various file types
- [ ] Test import operation
- [ ] Test chunking configuration
- [ ] Test delete with force
- [ ] Test query with different models
- [ ] Test metadata filtering

**Acceptance Criteria:**
- All document integration tests pass
- File uploads work correctly
- Queries return relevant results
- Metadata filtering works
- Tests clean up properly

**Dependencies:** 3.2.2

---

### 3.3 End-to-End Testing

**Duration**: 2-3 days
**Complexity**: Moderate

#### 3.3.1 Workflow Tests
**Tasks:**
- [ ] Create `test/e2e/workflows/complete-workflow.test.ts`:
  ```typescript
  describe('Complete RAG Workflow', () => {
    it('should complete full RAG workflow', async () => {
      // 1. Create store
      const store = await n8nTestNode('geminiFileSearchStores', {
        operation: 'create',
        displayName: 'E2E Test Store',
      });

      // 2. Upload documents
      const doc1 = await n8nTestNode('geminiFileSearchDocuments', {
        operation: 'upload',
        storeName: store.name,
        file: testPdf1,
        displayName: 'Research Paper 1',
        customMetadata: [
          { key: 'author', stringValue: 'Dr. Smith' },
          { key: 'year', numericValue: 2024 },
        ],
        waitForCompletion: true,
      });

      const doc2 = await n8nTestNode('geminiFileSearchDocuments', {
        operation: 'upload',
        storeName: store.name,
        file: testPdf2,
        displayName: 'Research Paper 2',
        customMetadata: [
          { key: 'author', stringValue: 'Dr. Jones' },
          { key: 'year', numericValue: 2023 },
        ],
        waitForCompletion: true,
      });

      // 3. List documents
      const docs = await n8nTestNode('geminiFileSearchDocuments', {
        operation: 'list',
        storeName: store.name,
        returnAll: true,
      });

      expect(docs.length).toBe(2);

      // 4. Query documents
      const queryResult = await n8nTestNode('geminiFileSearchDocuments', {
        operation: 'query',
        model: 'gemini-2.5-flash',
        query: 'What are the main findings?',
        storeNames: store.name,
      });

      expect(queryResult.candidates[0].content.parts[0].text).toBeTruthy();
      expect(queryResult.candidates[0].groundingMetadata).toBeTruthy();

      // 5. Query with filter
      const filteredResult = await n8nTestNode('geminiFileSearchDocuments', {
        operation: 'query',
        model: 'gemini-2.5-flash',
        query: 'What did Dr. Smith find?',
        storeNames: store.name,
        metadataFilter: 'author="Dr. Smith"',
      });

      expect(filteredResult.candidates).toBeTruthy();

      // 6. Delete documents
      await n8nTestNode('geminiFileSearchDocuments', {
        operation: 'delete',
        documentName: doc1.name,
        force: true,
      });

      await n8nTestNode('geminiFileSearchDocuments', {
        operation: 'delete',
        documentName: doc2.name,
        force: true,
      });

      // 7. Delete store
      await n8nTestNode('geminiFileSearchStores', {
        operation: 'delete',
        storeName: store.name,
        force: true,
      });
    });
  });
  ```
- [ ] Create workflow for error handling scenarios
- [ ] Create workflow for pagination testing
- [ ] Create workflow for concurrent operations
- [ ] Test with real n8n workflows (JSON format)

**Acceptance Criteria:**
- Complete workflow executes successfully
- All steps produce expected results
- Cleanup completes properly
- Workflows can be imported into n8n

**Dependencies:** 3.2.3

---

### 3.4 Performance & Load Testing

**Duration**: 1-2 days
**Complexity**: Moderate

#### 3.4.1 Performance Tests
**Tasks:**
- [ ] Create `test/performance/upload-performance.test.ts`:
  - Test upload of various file sizes (1MB, 10MB, 50MB, 100MB)
  - Measure upload time
  - Test concurrent uploads
  - Monitor memory usage
- [ ] Create `test/performance/query-performance.test.ts`:
  - Test query response time with different store sizes
  - Test concurrent queries
  - Measure latency
- [ ] Create performance benchmarks:
  ```typescript
  describe('Performance Benchmarks', () => {
    it('should upload 10MB file in under 30 seconds', async () => {
      const start = Date.now();
      await uploadTestDocument(storeName, file10MB, {}, true);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(30000);
    });

    it('should handle 10 concurrent queries', async () => {
      const queries = Array(10).fill(null).map(() =>
        queryTestDocuments(storeName, 'test query', 'gemini-2.5-flash')
      );

      const results = await Promise.all(queries);
      expect(results).toHaveLength(10);
      results.forEach(r => expect(r.candidates).toBeTruthy());
    });
  });
  ```
- [ ] Document performance metrics
- [ ] Create performance report template

**Acceptance Criteria:**
- Performance tests complete successfully
- Metrics documented
- No memory leaks detected
- Concurrent operations handled properly

**Dependencies:** 3.3

---

### Phase 3 Deliverables

- [ ] Comprehensive unit test suite (>80% coverage)
- [ ] Integration tests with real API
- [ ] End-to-end workflow tests
- [ ] Performance benchmarks and metrics
- [ ] Test documentation

### Phase 3 Acceptance Criteria

- [ ] All tests pass consistently
- [ ] Code coverage >80% overall
- [ ] Integration tests complete in <10 minutes
- [ ] E2E tests demonstrate full workflows
- [ ] Performance metrics documented

---

## Phase 4: Documentation

**Duration**: 3-4 days
**Complexity**: Simple
**Dependencies**: Phases 2 & 3

### Objectives
- Complete code documentation with TSDoc
- Create user-facing node documentation
- Write API usage examples
- Develop troubleshooting guides
- Create contribution guidelines

---

### 4.1 Code Documentation

**Duration**: 1 day
**Complexity**: Simple

#### 4.1.1 TSDoc Comments
**Tasks:**
- [ ] Add TSDoc comments to all public functions:
  ```typescript
  /**
   * Creates a new File Search store
   *
   * @param this - n8n execution context
   * @param index - Item index in workflow
   * @returns Promise resolving to created store object
   * @throws {NodeOperationError} If display name exceeds 512 characters
   *
   * @example
   * ```typescript
   * const store = await create.call(this, 0);
   * console.log(store.name); // fileSearchStores/my-store-123
   * ```
   */
  export async function create(
    this: IExecuteFunctions,
    index: number,
  ): Promise<FileSearchStore> {
    // ...
  }
  ```
- [ ] Document all utility functions
- [ ] Document validators with examples
- [ ] Document API client functions
- [ ] Generate API documentation with TypeDoc

**Acceptance Criteria:**
- All public functions documented
- Examples provided where helpful
- TypeDoc generates without errors
- Documentation HTML viewable

**Dependencies:** Phase 2

---

### 4.2 User Documentation

**Duration**: 1-2 days
**Complexity**: Moderate

#### 4.2.1 Node Documentation
**Tasks:**
- [ ] Create `docs/nodes/gemini-file-search-stores.md`:
  ```markdown
  # Gemini File Search Stores Node

  ## Overview
  Manage File Search stores for Google Gemini RAG operations.

  ## Prerequisites
  - Google Cloud account
  - Gemini API key with File Search API enabled
  - n8n instance (self-hosted or cloud)

  ## Credentials
  This node requires Gemini API credentials. See [Credential Setup](#credential-setup).

  ## Operations

  ### Create Store
  Creates a new empty File Search store.

  **Parameters:**
  - **Display Name** (optional): Human-readable name for the store (max 512 characters)

  **Returns:**
  - Store object with name, timestamps, and document counts

  **Example:**
  Input:
  - Display Name: "Research Papers"

  Output:
  ```json
  {
    "name": "fileSearchStores/research-papers-123",
    "displayName": "Research Papers",
    "createTime": "2025-11-24T10:00:00Z",
    "activeDocumentsCount": "0"
  }
  ```

  ### List Stores
  Lists all File Search stores.

  **Parameters:**
  - **Return All**: Get all stores (pagination handled automatically)
  - **Limit**: Max stores to return (1-20)

  **Returns:**
  - Array of store objects

  ...
  ```
- [ ] Create `docs/nodes/gemini-file-search-documents.md`:
  - Document all 6 operations
  - Include parameter descriptions
  - Provide input/output examples
  - Add troubleshooting tips
- [ ] Create `docs/GETTING_STARTED.md`:
  - Installation instructions
  - Credential setup
  - First workflow example
  - Common use cases
- [ ] Create `docs/API.md`:
  - API endpoint reference
  - Authentication details
  - Rate limits and quotas
  - Error codes

**Acceptance Criteria:**
- All operations documented clearly
- Examples are accurate and helpful
- Documentation covers common issues
- Links to official API docs included

**Dependencies:** Phase 2

---

### 4.3 Examples & Tutorials

**Duration**: 1 day
**Complexity**: Simple

#### 4.3.1 Example Workflows
**Tasks:**
- [ ] Create `docs/examples/basic-rag-workflow.json`:
  - Create store
  - Upload documents
  - Query store
  - Export as n8n workflow JSON
- [ ] Create `docs/examples/bulk-document-upload.json`:
  - Read files from directory
  - Upload to store with metadata
  - Monitor progress
- [ ] Create `docs/examples/filtered-search.json`:
  - Query with metadata filters
  - Parse results
  - Format for output
- [ ] Create `docs/examples/README.md`:
  - Overview of examples
  - How to import into n8n
  - Prerequisites
  - Expected results
- [ ] Create tutorial: `docs/tutorials/building-a-knowledge-base.md`:
  - Step-by-step guide
  - Screenshots (if applicable)
  - Tips and best practices

**Acceptance Criteria:**
- Examples work in n8n
- Tutorials are clear and complete
- All examples documented
- README explains usage

**Dependencies:** Phase 2

---

### 4.4 Troubleshooting Guide

**Duration**: 0.5 days
**Complexity**: Simple

#### 4.4.1 Common Issues
**Tasks:**
- [ ] Create `docs/TROUBLESHOOTING.md`:
  ```markdown
  # Troubleshooting Guide

  ## Authentication Issues

  ### Error: 401 Unauthorized
  **Cause:** Invalid or expired API key

  **Solution:**
  1. Verify API key in credentials
  2. Check key permissions in Google Cloud Console
  3. Ensure File Search API is enabled
  4. Try regenerating the API key

  ### Error: 403 Forbidden
  **Cause:** Insufficient permissions or quota exceeded

  **Solution:**
  1. Check API quotas in Google Cloud Console
  2. Verify billing is enabled
  3. Check rate limits
  4. Review IAM permissions

  ## Upload Issues

  ### Error: File size exceeds 100MB
  **Cause:** File too large for upload

  **Solution:**
  1. Split large files into smaller chunks
  2. Use compression if applicable
  3. Consider summarizing content before upload

  ### Error: Operation timeout
  **Cause:** Upload or import taking longer than 10 minutes

  **Solution:**
  1. Check file size
  2. Verify network connection
  3. Try uploading during off-peak hours
  4. Use "Wait for Completion" = false and poll manually

  ## Query Issues

  ### Empty or irrelevant results
  **Cause:** Documents not indexed or poor query formulation

  **Solution:**
  1. Verify documents are in STATE_ACTIVE
  2. Check document content is relevant
  3. Refine query with more specific terms
  4. Use metadata filters to narrow results

  ...
  ```
- [ ] Document error codes and meanings
- [ ] Include debugging tips
- [ ] Provide contact/support information

**Acceptance Criteria:**
- Common issues documented
- Solutions are actionable
- Error codes explained
- Debugging tips helpful

**Dependencies:** Phase 3 (identifies common issues)

---

### Phase 4 Deliverables

- [ ] Complete TSDoc code documentation
- [ ] User-facing node documentation
- [ ] Example workflows and tutorials
- [ ] Troubleshooting guide
- [ ] API reference documentation

### Phase 4 Acceptance Criteria

- [ ] All public APIs documented
- [ ] Examples work as described
- [ ] Documentation covers 90% of use cases
- [ ] Troubleshooting guide addresses known issues
- [ ] Documentation reviewed by at least one other person

---

## Phase 5: Quality Assurance & Deployment

**Duration**: 4-5 days
**Complexity**: Moderate
**Dependencies**: Phases 2, 3, 4

### Objectives
- Code review and quality checks
- Performance optimization
- Security audit
- Prepare for deployment
- Publishing to npm and n8n community

---

### 5.1 Code Review & Quality

**Duration**: 1-2 days
**Complexity**: Moderate

#### 5.1.1 Code Review Checklist
**Tasks:**
- [ ] Create code review checklist:
  - [ ] Code follows TypeScript best practices
  - [ ] All functions have proper error handling
  - [ ] No hardcoded credentials or secrets
  - [ ] Consistent naming conventions
  - [ ] No unused imports or variables
  - [ ] Proper use of async/await
  - [ ] Memory leaks prevented (event listeners cleaned up)
  - [ ] Rate limiting implemented
  - [ ] Input validation comprehensive
  - [ ] Error messages user-friendly
  - [ ] Logging appropriate (not excessive)
  - [ ] Comments clear and helpful
  - [ ] Code is DRY (Don't Repeat Yourself)
  - [ ] Functions are single-responsibility
  - [ ] Magic numbers avoided (use constants)
- [ ] Conduct peer code review
- [ ] Address review feedback
- [ ] Run linter: `npm run lint`
- [ ] Run formatter: `npm run format`
- [ ] Check for security vulnerabilities: `npm audit`
- [ ] Update dependencies to latest stable versions

**Acceptance Criteria:**
- Code review completed
- All feedback addressed
- No linter errors
- No critical security vulnerabilities
- Code quality score >80% (SonarQube or similar)

**Dependencies:** Phases 2, 3, 4

---

#### 5.1.2 Static Analysis
**Tasks:**
- [ ] Run TypeScript strict mode checks
- [ ] Run SonarQube or similar static analysis
- [ ] Check cyclomatic complexity
- [ ] Verify no duplicate code
- [ ] Check for potential bugs
- [ ] Review test coverage gaps
- [ ] Address findings

**Acceptance Criteria:**
- No high-severity issues
- Complexity metrics within acceptable ranges
- Duplicate code minimal (<3%)
- Coverage gaps addressed or documented

**Dependencies:** 5.1.1

---

### 5.2 Performance Optimization

**Duration**: 1 day
**Complexity**: Moderate

#### 5.2.1 Performance Profiling
**Tasks:**
- [ ] Profile API client performance
- [ ] Identify bottlenecks
- [ ] Optimize resumable upload implementation
- [ ] Optimize polling mechanism
- [ ] Review memory usage
- [ ] Optimize pagination logic
- [ ] Cache API responses where appropriate
- [ ] Test performance improvements
- [ ] Document optimization decisions

**Acceptance Criteria:**
- Upload performance improved by >10%
- Query latency reduced where possible
- Memory usage stable during long operations
- No performance regressions

**Dependencies:** 5.1

---

### 5.3 Security Audit

**Duration**: 1 day
**Complexity**: Moderate

#### 5.3.1 Security Review
**Tasks:**
- [ ] Review credential handling
  - [ ] API keys not logged
  - [ ] Credentials encrypted at rest
  - [ ] No credentials in error messages
- [ ] Review input validation
  - [ ] All user inputs validated
  - [ ] SQL injection not applicable (no SQL)
  - [ ] XSS not applicable (backend only)
  - [ ] Path traversal prevented
  - [ ] File upload validation
- [ ] Review API security
  - [ ] HTTPS enforced
  - [ ] Rate limiting implemented
  - [ ] Timeout handling secure
  - [ ] No sensitive data in URLs
- [ ] Review dependencies
  - [ ] Run `npm audit`
  - [ ] Update vulnerable packages
  - [ ] Review package licenses
- [ ] Review error handling
  - [ ] No stack traces exposed to users
  - [ ] Error messages don't leak sensitive info
  - [ ] Errors logged appropriately
- [ ] Create security documentation
  - [ ] Document security practices
  - [ ] Include security best practices for users

**Acceptance Criteria:**
- No critical security vulnerabilities
- Security best practices followed
- Audit findings documented
- Security documentation complete

**Dependencies:** 5.2

---

### 5.4 Deployment Preparation

**Duration**: 1-2 days
**Complexity**: Moderate

#### 5.4.1 Package Preparation
**Tasks:**
- [ ] Update `package.json`:
  ```json
  {
    "name": "n8n-nodes-gemini-file-search",
    "version": "1.0.0",
    "description": "n8n nodes for Google Gemini File Search Tool API",
    "license": "MIT",
    "author": {
      "name": "Your Name",
      "email": "your.email@example.com"
    },
    "keywords": [
      "n8n",
      "n8n-nodes",
      "n8n-community-node-package",
      "gemini",
      "google",
      "file-search",
      "rag",
      "ai"
    ],
    "repository": {
      "type": "git",
      "url": "https://github.com/yourusername/n8n-nodes-gemini-file-search"
    },
    "n8n": {
      "nodes": [
        "dist/nodes/GeminiFileSearchStores/GeminiFileSearchStores.node.js",
        "dist/nodes/GeminiFileSearchDocuments/GeminiFileSearchDocuments.node.js"
      ],
      "credentials": [
        "dist/credentials/GeminiApi.credentials.js"
      ]
    }
  }
  ```
- [ ] Create comprehensive `README.md`:
  - Installation instructions
  - Quick start guide
  - Feature list
  - Documentation links
  - License information
  - Contributing guidelines
- [ ] Create `CHANGELOG.md`:
  ```markdown
  # Changelog

  ## [1.0.0] - 2025-11-24

  ### Added
  - Initial release
  - Gemini File Search Stores node
    - Create, list, get, delete stores
    - Monitor operation status
  - Gemini File Search Documents node
    - Upload documents with resumable upload
    - Import files from Files API
    - List, get, delete documents
    - Query documents with RAG
    - Metadata filtering support
  - Gemini API credentials
  - Comprehensive test suite
  - Complete documentation
  ```
- [ ] Create `LICENSE` file (MIT recommended)
- [ ] Create `.npmignore`:
  ```
  test/
  .github/
  docs/specs/
  *.test.ts
  tsconfig.json
  .eslintrc.js
  .prettierrc
  ```
- [ ] Build production bundle: `npm run build`
- [ ] Test installation locally:
  ```bash
  npm pack
  cd /path/to/test-n8n-installation
  npm install /path/to/n8n-nodes-gemini-file-search-1.0.0.tgz
  ```
- [ ] Verify nodes load in n8n
- [ ] Test all operations in n8n UI

**Acceptance Criteria:**
- Package.json complete and valid
- README clear and comprehensive
- Build succeeds without errors
- Local installation test succeeds
- Nodes work in n8n

**Dependencies:** 5.3

---

#### 5.4.2 Publishing
**Tasks:**
- [ ] Create npm account (if needed)
- [ ] Verify package name availability
- [ ] Publish to npm:
  ```bash
  npm publish --access public
  ```
- [ ] Verify package on npm: https://www.npmjs.com/package/n8n-nodes-gemini-file-search
- [ ] Test installation from npm:
  ```bash
  npm install n8n-nodes-gemini-file-search
  ```
- [ ] Submit to n8n community nodes:
  - Create PR to n8n community nodes repository
  - Follow submission guidelines
  - Wait for review
- [ ] Create GitHub release:
  - Tag version: `git tag v1.0.0`
  - Push tag: `git push origin v1.0.0`
  - Create release notes on GitHub
- [ ] Announce release:
  - n8n community forum
  - Twitter/X
  - Reddit r/n8n
  - Discord server

**Acceptance Criteria:**
- Package published to npm
- Installation from npm works
- GitHub release created
- Community submission complete
- Announcement posted

**Dependencies:** 5.4.1

---

### Phase 5 Deliverables

- [ ] Code reviewed and optimized
- [ ] Security audit complete
- [ ] Package published to npm
- [ ] GitHub release created
- [ ] Documentation deployed
- [ ] Community announcement posted

### Phase 5 Acceptance Criteria

- [ ] All quality checks passed
- [ ] No critical security issues
- [ ] Package installable from npm
- [ ] Nodes work in production n8n
- [ ] Community can find and use nodes

---

## Timeline & Milestones

### Overall Timeline: 30-39 Days (6-8 Weeks)

| Phase | Duration | Start | Dependencies |
|-------|----------|-------|--------------|
| Phase 1: Infrastructure Setup | 3-5 days | Day 1 | None |
| Phase 2: Core Implementation | 12-15 days | Day 6 | Phase 1 |
| Phase 3: Testing Strategy | 8-10 days | Day 21 | Phase 2 |
| Phase 4: Documentation | 3-4 days | Day 31 | Phases 2 & 3 |
| Phase 5: QA & Deployment | 4-5 days | Day 35 | Phases 2, 3, 4 |

### Key Milestones

**Week 1: Foundation**
- [ ] Development environment ready
- [ ] Project structure complete
- [ ] CI/CD pipeline operational

**Week 2-3: Core Development**
- [ ] Credential system functional
- [ ] Store operations complete
- [ ] Document operations complete
- [ ] All utilities implemented

**Week 4-5: Testing**
- [ ] Unit tests complete (>80% coverage)
- [ ] Integration tests passing
- [ ] E2E workflows validated

**Week 6: Polish**
- [ ] Documentation complete
- [ ] Code reviewed
- [ ] Performance optimized

**Week 7-8: Launch**
- [ ] Security audit passed
- [ ] Package published
- [ ] Community announcement

---

## Risk Management

### Technical Risks

#### Risk: Resumable Upload Implementation Complexity
- **Probability**: Medium
- **Impact**: High
- **Mitigation**:
  - Allocate extra time for upload implementation
  - Reference Google's official examples
  - Test with various file sizes early
  - Have fallback to standard upload for small files

#### Risk: Long-Running Operation Polling Issues
- **Probability**: Low
- **Impact**: Medium
- **Mitigation**:
  - Implement robust polling with exponential backoff
  - Make timeout configurable
  - Provide manual operation status check
  - Test with large files that take time to process

#### Risk: API Rate Limiting
- **Probability**: High
- **Impact**: Medium
- **Mitigation**:
  - Implement rate limiter from start
  - Make limits configurable
  - Test with high volume
  - Document rate limits clearly

#### Risk: Metadata Filter Validation Complexity
- **Probability**: Medium
- **Impact**: Low
- **Mitigation**:
  - Start with basic validation
  - Iterate based on user feedback
  - Provide clear examples
  - Link to AIP-160 documentation

### Project Risks

#### Risk: Scope Creep
- **Probability**: Medium
- **Impact**: High
- **Mitigation**:
  - Stick to specification
  - Document "future enhancements" separately
  - Regular scope reviews
  - Clear phase boundaries

#### Risk: Testing Environment Issues
- **Probability**: Low
- **Impact**: Medium
- **Mitigation**:
  - Set up test environment early
  - Use separate API key for testing
  - Implement cleanup functions
  - Monitor test quotas

#### Risk: Documentation Lag
- **Probability**: High
- **Impact**: Medium
- **Mitigation**:
  - Write docs alongside code
  - Make docs part of acceptance criteria
  - Review docs in code reviews
  - Use examples from tests

---

## Success Criteria

### Phase-Level Success Criteria
See individual phase sections for detailed acceptance criteria.

### Project-Level Success Criteria

**Functional Requirements:**
- [ ] All 12 operations (6 store + 6 document) implemented and working
- [ ] Credential system validates API keys
- [ ] File uploads handle files up to 100MB
- [ ] Long-running operations poll successfully
- [ ] Metadata filtering works correctly
- [ ] Query returns results with grounding metadata

**Quality Requirements:**
- [ ] Code coverage >80%
- [ ] All tests pass consistently
- [ ] No critical security vulnerabilities
- [ ] Performance meets benchmarks
- [ ] Documentation complete and accurate

**User Experience Requirements:**
- [ ] Nodes appear in n8n palette
- [ ] Fields show/hide appropriately
- [ ] Validation messages are clear
- [ ] Error messages are helpful
- [ ] Examples work as described

**Deployment Requirements:**
- [ ] Package published to npm
- [ ] Installation from npm succeeds
- [ ] Nodes work in production n8n
- [ ] Community can discover nodes
- [ ] Support channel established

---

## Appendix A: Development Commands Reference

```bash
# Installation
npm install

# Development
npm run build          # Compile TypeScript
npm run build:watch    # Watch mode compilation
npm run lint           # Run ESLint
npm run lint:fix       # Fix linting issues
npm run format         # Format with Prettier

# Testing
npm run test           # Run all tests
npm run test:unit      # Run unit tests only
npm run test:integration  # Run integration tests only
npm run test:e2e       # Run E2E tests only
npm run test:watch     # Watch mode
npm run test:coverage  # Generate coverage report

# Local Development
n8n start              # Start n8n with nodes
npm link               # Link package locally

# Publishing
npm version patch      # Bump version
npm publish            # Publish to npm
```

---

## Appendix B: File Structure Reference

```
n8n-nodes-gemini-file-search/
├── nodes/
│   ├── GeminiFileSearchStores/
│   │   ├── GeminiFileSearchStores.node.ts
│   │   ├── GeminiFileSearchStores.node.json
│   │   ├── operations/
│   │   │   └── store/
│   │   │       ├── create.ts
│   │   │       ├── list.ts
│   │   │       ├── get.ts
│   │   │       ├── delete.ts
│   │   │       ├── getOperation.ts
│   │   │       └── index.ts
│   │   └── descriptions/
│   │       └── StoreDescription.ts
│   └── GeminiFileSearchDocuments/
│       ├── GeminiFileSearchDocuments.node.ts
│       ├── GeminiFileSearchDocuments.node.json
│       ├── operations/
│       │   └── document/
│       │       ├── upload.ts
│       │       ├── import.ts
│       │       ├── list.ts
│       │       ├── get.ts
│       │       ├── delete.ts
│       │       ├── query.ts
│       │       └── index.ts
│       └── descriptions/
│           └── DocumentDescription.ts
├── credentials/
│   └── GeminiApi.credentials.ts
├── utils/
│   ├── apiClient.ts
│   ├── validators.ts
│   ├── rateLimiter.ts
│   └── types.ts
├── test/
│   ├── unit/
│   │   ├── utils/
│   │   └── nodes/
│   ├── integration/
│   ├── e2e/
│   ├── fixtures/
│   └── helpers/
├── docs/
│   ├── nodes/
│   │   ├── gemini-file-search-stores.md
│   │   └── gemini-file-search-documents.md
│   ├── examples/
│   │   ├── basic-rag-workflow.json
│   │   └── README.md
│   ├── tutorials/
│   ├── specs/
│   ├── GETTING_STARTED.md
│   ├── API.md
│   └── TROUBLESHOOTING.md
├── assets/
│   └── gemini-logo.svg
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── release.yml
├── package.json
├── tsconfig.json
├── jest.config.js
├── .eslintrc.js
├── .prettierrc
├── .gitignore
├── .npmignore
├── README.md
├── CHANGELOG.md
├── LICENSE
└── CONTRIBUTING.md
```

---

## Appendix C: Useful Resources

### Official Documentation
- [n8n Node Development](https://docs.n8n.io/integrations/creating-nodes/overview/)
- [Gemini File Search API](https://ai.google.dev/gemini-api/docs/file-search)
- [Google Resumable Upload Protocol](https://developers.google.com/drive/api/guides/manage-uploads#resumable)
- [AIP-160 Filtering](https://google.aip.dev/160)

### Development Tools
- [n8n CLI](https://www.npmjs.com/package/n8n)
- [TypeDoc](https://typedoc.org/)
- [Jest](https://jestjs.io/)
- [nock](https://github.com/nock/nock)

### Community Resources
- [n8n Community Forum](https://community.n8n.io/)
- [n8n Discord](https://discord.gg/n8n)
- [Reddit r/n8n](https://www.reddit.com/r/n8n/)

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-11-24 | AI Assistant | Initial implementation plan |

---

**END OF IMPLEMENTATION PLAN**
