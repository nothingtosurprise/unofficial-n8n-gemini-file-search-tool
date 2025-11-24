# Gemini File Search Tool - n8n Nodes Specification

## Document Information
- **Version**: 1.0
- **Date**: 2025-11-24
- **Purpose**: Comprehensive specification for two n8n nodes enabling Gemini File Search Tool functionality

## Table of Contents
1. [Overview](#overview)
2. [Architecture & Design Decisions](#architecture--design-decisions)
3. [Node 1: Gemini File Search Stores](#node-1-gemini-file-search-stores)
4. [Node 2: Gemini File Search Documents](#node-2-gemini-file-search-documents)
5. [Credential Configuration](#credential-configuration)
6. [Data Models](#data-models)
7. [Error Handling](#error-handling)
8. [User Workflows](#user-workflows)
9. [Technical Implementation Notes](#technical-implementation-notes)

---

## Overview

This specification defines two n8n nodes for interacting with Google's Gemini File Search Tool API, which provides a hosted Retrieval Augmented Generation (RAG) service. The File Search tool enables semantic search over uploaded documents by converting them into embeddings and storing them in specialized File Search stores.

### Key Capabilities
- **Store Management**: Create, list, retrieve, and delete File Search stores
- **Document Operations**: Upload, import, list, retrieve, and delete documents
- **Advanced Features**: Custom metadata, chunking configuration, metadata filtering
- **RAG Integration**: Query documents using Gemini models with file search context

---

## Architecture & Design Decisions

### Node Type: LLM Model Nodes (Not Tool Nodes)
The File Search tool is embedded in the model call rather than being a standalone tool. This design decision is based on:
- The tool is passed as a parameter to `generateContent` API calls
- Only specific Gemini models support this feature
- The tool configuration includes store selection and metadata filtering

### Supported Models
Only the following Gemini models support File Search:
- `gemini-3-pro-preview`
- `gemini-2.5-pro`
- `gemini-2.5-flash` (and preview versions)
- `gemini-2.5-flash-lite` (and preview versions)

### API Base URL
All endpoints use: `https://generativelanguage.googleapis.com/v1beta/`

---

## Node 1: Gemini File Search Stores

### Node Metadata
- **Node Name**: `Gemini File Search Stores`
- **Display Name**: `Gemini File Search Stores`
- **Description**: `Manage File Search stores for Gemini RAG operations`
- **Icon**: Google Gemini logo
- **Category**: `AI`
- **Subcategory**: `Language Models`

### Operations

#### 1. Create Store
Creates a new empty File Search store.

**API Endpoint**: `POST /fileSearchStores`

**Input Fields**:
| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| displayName | string | No | - | Human-readable display name (max 512 characters) |

**Output**:
```json
{
  "name": "fileSearchStores/my-store-123a456b789c",
  "displayName": "My Store",
  "createTime": "2025-11-24T10:00:00Z",
  "updateTime": "2025-11-24T10:00:00Z",
  "activeDocumentsCount": "0",
  "pendingDocumentsCount": "0",
  "failedDocumentsCount": "0",
  "sizeBytes": "0"
}
```

#### 2. List Stores
Lists all File Search stores owned by the user.

**API Endpoint**: `GET /fileSearchStores`

**Input Fields**:
| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| pageSize | integer | No | 10 | Max stores per page (max: 20) |
| pageToken | string | No | - | Token for pagination |

**Output**:
```json
{
  "fileSearchStores": [
    {
      "name": "fileSearchStores/store-1",
      "displayName": "Store 1",
      "createTime": "...",
      "updateTime": "...",
      "activeDocumentsCount": "5",
      "pendingDocumentsCount": "0",
      "failedDocumentsCount": "0",
      "sizeBytes": "1048576"
    }
  ],
  "nextPageToken": "abc123"
}
```

**Pagination**: Returns `nextPageToken` if more results exist.

#### 3. Get Store
Retrieves information about a specific File Search store.

**API Endpoint**: `GET /fileSearchStores/{name}`

**Input Fields**:
| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| name | string | Yes | - | Store resource name (e.g., `fileSearchStores/my-store-123`) |

**Output**: Same structure as Create Store response.

#### 4. Delete Store
Deletes a File Search store.

**API Endpoint**: `DELETE /fileSearchStores/{name}`

**Input Fields**:
| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| name | string | Yes | - | Store resource name |
| force | boolean | No | false | Delete with all documents if true; fails if store has documents and force=false |

**Output**: Empty JSON object on success.

**Error Cases**:
- `FAILED_PRECONDITION`: Store contains documents and `force=false`

#### 5. Get Upload Operation Status
Monitors the status of a long-running upload operation.

**API Endpoint**: `GET /fileSearchStores/{filesearchstore}/upload/operations/{operation}`

**Input Fields**:
| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| name | string | Yes | - | Operation resource name |

**Output**:
```json
{
  "name": "fileSearchStores/store-1/upload/operations/op-123",
  "metadata": {
    "@type": "type.googleapis.com/...",
    "progressPercent": 50
  },
  "done": false
}
```

#### 6. Get Import Operation Status
Monitors the status of a long-running import operation.

**API Endpoint**: `GET /fileSearchStores/{filesearchstore}/operations/{operation}`

**Input Fields**:
| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| name | string | Yes | - | Operation resource name |

**Output**: Same structure as Upload Operation Status.

---

## Node 2: Gemini File Search Documents

### Node Metadata
- **Node Name**: `Gemini File Search Documents`
- **Display Name**: `Gemini File Search Documents`
- **Description**: `Manage and query documents in Gemini File Search stores`
- **Icon**: Google Gemini logo
- **Category**: `AI`
- **Subcategory**: `Language Models`

### Operations

#### 1. Upload Document
Directly uploads a file to a File Search store, chunks it, embeds it, and stores it.

**API Endpoint**: `POST /upload/v1beta/{fileSearchStoreName}:uploadToFileSearchStore`

**Upload Protocol**: Resumable upload with the following headers:
- `X-Goog-Upload-Protocol: resumable`
- `X-Goog-Upload-Command: start` (initial), then `upload, finalize` (data)
- `X-Goog-Upload-Header-Content-Length: {NUM_BYTES}`
- `X-Goog-Upload-Header-Content-Type: {MIME_TYPE}`

**Input Fields**:
| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| fileSearchStoreName | string | Yes | - | Store name (e.g., `fileSearchStores/my-store-123`) |
| file | binary | Yes | - | File to upload (max 100MB) |
| displayName | string | No | - | Display name for document |
| mimeType | string | No | auto-detect | MIME type of file |
| customMetadata | array | No | [] | Custom metadata key-value pairs (max 20) |
| chunkingConfig | object | No | default | Chunking configuration |

**Chunking Config Fields**:
| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| whiteSpaceConfig.maxTokensPerChunk | integer | No | - | Max tokens per chunk |
| whiteSpaceConfig.maxOverlapTokens | integer | No | - | Max overlapping tokens |

**Custom Metadata Fields**:
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| key | string | Yes | Metadata key |
| stringValue | string | No | String value (one of stringValue, stringListValue, numericValue) |
| stringListValue | object | No | List of strings |
| numericValue | number | No | Numeric value |

**Output**: Operation object for long-running operation tracking.

**Supported File Types**:
- Documents: PDF, Word (.doc, .docx), Excel, PowerPoint, OpenDocument
- Text: Plain text, Markdown, HTML, RTF, CSV, TSV, JSON, XML
- Code: Most programming languages (Python, JavaScript, Java, C++, etc.)
- Archives: ZIP

#### 2. Import File
Imports a previously uploaded file (via Files API) into a File Search store.

**API Endpoint**: `POST /fileSearchStores/{fileSearchStoreName}:importFile`

**Input Fields**:
| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| fileSearchStoreName | string | Yes | - | Store name |
| fileName | string | Yes | - | File resource name (e.g., `files/abc-123`) |
| customMetadata | array | No | [] | Custom metadata (max 20) |
| chunkingConfig | object | No | default | Chunking configuration |

**Output**: Operation object for long-running operation tracking.

**Workflow**:
1. User first uploads file via Files API (separate operation)
2. User gets file name from upload response
3. User calls importFile with the file name
4. System chunks, embeds, and indexes the file

#### 3. List Documents
Lists all documents in a File Search store.

**API Endpoint**: `GET /fileSearchStores/{parent}/documents`

**Input Fields**:
| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| parent | string | Yes | - | Store name (e.g., `fileSearchStores/my-store-123`) |
| pageSize | integer | No | 10 | Max documents per page (max: 20) |
| pageToken | string | No | - | Token for pagination |

**Output**:
```json
{
  "documents": [
    {
      "name": "fileSearchStores/store-1/documents/doc-abc",
      "displayName": "My Document",
      "customMetadata": [
        {"key": "author", "stringValue": "John Doe"},
        {"key": "year", "numericValue": 2024}
      ],
      "createTime": "2025-11-24T10:00:00Z",
      "updateTime": "2025-11-24T10:00:00Z",
      "state": "STATE_ACTIVE",
      "sizeBytes": "1048576",
      "mimeType": "application/pdf"
    }
  ],
  "nextPageToken": "xyz789"
}
```

**Document States**:
- `STATE_UNSPECIFIED`: Default/unknown state
- `STATE_PENDING`: Chunks being processed
- `STATE_ACTIVE`: All chunks processed, ready for querying
- `STATE_FAILED`: Some chunks failed processing

#### 4. Get Document
Retrieves information about a specific document.

**API Endpoint**: `GET /fileSearchStores/{filesearchstore}/documents/{document}`

**Input Fields**:
| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| name | string | Yes | - | Document name (e.g., `fileSearchStores/store-1/documents/doc-abc`) |

**Output**: Document object (same structure as List Documents).

#### 5. Delete Document
Deletes a document from a File Search store.

**API Endpoint**: `DELETE /fileSearchStores/{filesearchstore}/documents/{document}`

**Input Fields**:
| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| name | string | Yes | - | Document name |
| force | boolean | No | false | Delete with all chunks if true |

**Output**: Empty JSON object on success.

**Error Cases**:
- `FAILED_PRECONDITION`: Document contains chunks and `force=false`

#### 6. Query Documents
Performs a semantic search and generates content using the File Search tool.

**API Endpoint**: `POST /models/{model}:generateContent`

**Supported Models**:
- `gemini-3-pro-preview`
- `gemini-2.5-pro`
- `gemini-2.5-flash`
- `gemini-2.5-flash-lite`

**Input Fields**:
| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| model | string | Yes | - | Model name (dropdown from supported models) |
| contents | string | Yes | - | User query/prompt |
| fileSearchStoreNames | array | Yes | - | List of store names to search |
| metadataFilter | string | No | - | Filter expression (AIP-160 format) |

**Metadata Filter Examples**:
- `author="Robert Graves"`
- `year=2024`
- `category IN ["fiction", "history"]`
- `year>=2020 AND author="John Doe"`

**Output**:
```json
{
  "candidates": [
    {
      "content": {
        "parts": [
          {"text": "Based on the documents..."}
        ]
      },
      "groundingMetadata": {
        "groundingChunks": [
          {
            "documentId": "fileSearchStores/store-1/documents/doc-abc",
            "chunkId": "chunk-123",
            "content": "Original text..."
          }
        ],
        "groundingSupports": [
          {
            "segment": {"startIndex": 0, "endIndex": 50},
            "groundingChunkIndices": [0]
          }
        ]
      }
    }
  ]
}
```

**Citations**: The response includes `groundingMetadata` that shows which document chunks were used to generate the answer.

---

## Credential Configuration

### Credential Type: `geminiApi`

**Fields**:
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| apiKey | string | Yes | Google Gemini API Key |

**Display Properties**:
- **Name**: `Gemini API`
- **Documentation URL**: `https://ai.google.dev/gemini-api/docs/api-key`
- **Test Endpoint**: `GET /fileSearchStores` (with pageSize=1)

**Authentication Method**:
- API Key passed as query parameter: `?key={apiKey}`
- Alternative: Header `x-goog-api-key: {apiKey}`

**Credential Validation**:
- Test connection on save
- Show clear error messages for invalid keys
- Support environment variable substitution

---

## Data Models

### FileSearchStore
```typescript
interface FileSearchStore {
  name: string;                    // Output only
  displayName?: string;            // Optional
  createTime: string;              // Output only, RFC 3339
  updateTime: string;              // Output only, RFC 3339
  activeDocumentsCount: string;    // Output only, int64 as string
  pendingDocumentsCount: string;   // Output only
  failedDocumentsCount: string;    // Output only
  sizeBytes: string;               // Output only
}
```

### Document
```typescript
interface Document {
  name: string;                    // Resource name
  displayName?: string;            // Optional, max 512 chars
  customMetadata?: CustomMetadata[]; // Max 20 items
  createTime: string;              // Output only, RFC 3339
  updateTime: string;              // Output only
  state: State;                    // Output only
  sizeBytes: string;               // Output only
  mimeType: string;                // Output only
}
```

### CustomMetadata
```typescript
interface CustomMetadata {
  key: string;
  value: StringValue | StringListValue | NumericValue;
}

type StringValue = { stringValue: string };
type StringListValue = { stringListValue: { values: string[] } };
type NumericValue = { numericValue: number };
```

### ChunkingConfig
```typescript
interface ChunkingConfig {
  whiteSpaceConfig?: {
    maxTokensPerChunk?: number;
    maxOverlapTokens?: number;
  };
}
```

### Operation
```typescript
interface Operation {
  name: string;
  metadata?: {
    "@type": string;
    [key: string]: any;
  };
  done: boolean;
  result?: {
    error?: Status;
    response?: any;
  };
}
```

### State Enum
```typescript
enum State {
  STATE_UNSPECIFIED = "STATE_UNSPECIFIED",
  STATE_PENDING = "STATE_PENDING",
  STATE_ACTIVE = "STATE_ACTIVE",
  STATE_FAILED = "STATE_FAILED"
}
```

---

## Error Handling

### Common Error Codes

#### 400 - Bad Request
- Invalid field values
- Missing required fields
- Invalid metadata filter syntax

**Handling**:
- Show clear validation messages
- Highlight problematic fields
- Provide syntax examples for metadata filters

#### 401 - Unauthorized
- Invalid or expired API key

**Handling**:
- Show credential configuration prompt
- Link to API key documentation
- Suggest re-authenticating

#### 403 - Forbidden
- Insufficient permissions
- Quota exceeded

**Handling**:
- Display quota information
- Link to billing/upgrade page
- Show current usage stats

#### 404 - Not Found
- Store or document doesn't exist
- Invalid resource name

**Handling**:
- Validate resource names before requests
- Provide resource browser/picker
- Show available resources

#### 409 - Conflict
- Resource already exists
- Concurrent modification

**Handling**:
- Suggest unique names
- Implement retry logic
- Show conflict resolution options

#### 412 - Precondition Failed
- `FAILED_PRECONDITION`: Store/document has dependencies

**Handling**:
- Prompt to use `force=true`
- Show dependent resources
- Confirm destructive operations

#### 413 - Payload Too Large
- File exceeds 100MB limit
- Total store size exceeds tier limit

**Handling**:
- Show file size limits
- Display current usage
- Suggest file splitting strategies

#### 429 - Too Many Requests
- Rate limit exceeded

**Handling**:
- Implement exponential backoff
- Show retry timing
- Display rate limit info

#### 500 - Internal Server Error
- Server-side issues

**Handling**:
- Retry with exponential backoff
- Show status page link
- Capture error details for support

### Long-Running Operations

**Polling Strategy**:
1. Initial request returns operation object
2. Poll operation status every 5 seconds
3. Maximum polling duration: 10 minutes
4. Show progress indicator to user

**Timeout Handling**:
- If operation doesn't complete in 10 minutes, show warning
- Allow user to manually check status
- Store operation name for later retrieval

**Error States**:
- Check `operation.done` and `operation.result.error`
- Display detailed error message from `error.message`
- Provide retry option

---

## User Workflows

### Workflow 1: Create Store and Upload Document

1. **Create Store**
   - User selects "Create Store" operation
   - Enters display name: "My Research Papers"
   - Receives store name: `fileSearchStores/research-papers-123`

2. **Upload Document**
   - User selects "Upload Document" operation
   - Selects store: `fileSearchStores/research-papers-123`
   - Uploads file: `paper.pdf`
   - Sets display name: "AI Research Paper 2024"
   - Adds metadata:
     - `author`: "Dr. Jane Smith"
     - `year`: 2024
     - `category`: "artificial-intelligence"
   - Configures chunking:
     - Max tokens per chunk: 200
     - Max overlap tokens: 20

3. **Monitor Upload**
   - System polls operation status
   - Shows progress indicator
   - Notifies when complete

4. **Verify Document**
   - User lists documents in store
   - Confirms document is in `STATE_ACTIVE`
   - Reviews document metadata

### Workflow 2: Query Documents with Metadata Filtering

1. **Query Setup**
   - User selects "Query Documents" operation
   - Chooses model: `gemini-2.5-flash`
   - Enters query: "What are the key findings about transformer models?"

2. **Configure Search**
   - Selects stores: `fileSearchStores/research-papers-123`
   - Sets metadata filter: `category="artificial-intelligence" AND year>=2023`

3. **Execute Query**
   - System sends request to Gemini API
   - Retrieves relevant document chunks
   - Generates response with citations

4. **Review Results**
   - User reads generated response
   - Checks grounding metadata for sources
   - Verifies citations match expected documents

### Workflow 3: Import Existing File

1. **Upload to Files API**
   - User uploads file via separate Files API node
   - Gets file name: `files/abc-123`

2. **Import to Store**
   - User selects "Import File" operation
   - Selects store: `fileSearchStores/documents-456`
   - Provides file name: `files/abc-123`
   - Adds custom metadata

3. **Monitor Import**
   - System polls import operation
   - Shows progress
   - Notifies on completion

### Workflow 4: Bulk Document Management

1. **List All Documents**
   - User lists documents with pagination
   - Reviews document states
   - Identifies failed or pending documents

2. **Delete Failed Documents**
   - User filters documents by state: `STATE_FAILED`
   - Selects "Delete Document" operation
   - Sets `force=true` to delete with chunks

3. **Re-upload Documents**
   - User re-uploads failed documents
   - Monitors new upload operations

### Workflow 5: Store Cleanup

1. **Check Store Stats**
   - User gets store details
   - Reviews document counts and size
   - Identifies unused stores

2. **Delete Old Documents**
   - User lists documents
   - Filters by metadata (e.g., old dates)
   - Deletes outdated documents

3. **Delete Empty Store**
   - User verifies store is empty
   - Deletes store (force=false)
   - Confirms deletion

---

## Technical Implementation Notes

### n8n Node Structure

#### File Organization
```
nodes/
├── GeminiFileSearchStores/
│   ├── GeminiFileSearchStores.node.ts
│   ├── GeminiFileSearchStores.node.json
│   └── gemini-logo.svg
└── GeminiFileSearchDocuments/
    ├── GeminiFileSearchDocuments.node.ts
    ├── GeminiFileSearchDocuments.node.json
    └── gemini-logo.svg

credentials/
└── GeminiApi.credentials.ts
```

#### Node Properties

**Resource Selection**:
```typescript
{
  displayName: 'Resource',
  name: 'resource',
  type: 'options',
  noDataExpression: true,
  options: [
    {
      name: 'Store',
      value: 'store',
    },
    {
      name: 'Document',
      value: 'document',
    },
  ],
  default: 'store',
}
```

**Operation Selection** (dynamic based on resource):
```typescript
{
  displayName: 'Operation',
  name: 'operation',
  type: 'options',
  noDataExpression: true,
  displayOptions: {
    show: {
      resource: ['store'],
    },
  },
  options: [
    {
      name: 'Create',
      value: 'create',
      description: 'Create a new File Search store',
      action: 'Create a store',
    },
    // ... other operations
  ],
  default: 'create',
}
```

### API Request Handling

#### Authentication
```typescript
async function authenticate(
  this: IExecuteFunctions | ILoadOptionsFunctions,
): Promise<OptionsWithUri> {
  const credentials = await this.getCredentials('geminiApi');

  return {
    headers: {
      'x-goog-api-key': credentials.apiKey,
    },
  };
}
```

#### Pagination
```typescript
async function listWithPagination(
  this: IExecuteFunctions,
  endpoint: string,
  pageSize: number,
): Promise<any[]> {
  const items: any[] = [];
  let pageToken: string | undefined;

  do {
    const qs: IDataObject = { pageSize };
    if (pageToken) {
      qs.pageToken = pageToken;
    }

    const response = await apiRequest.call(this, 'GET', endpoint, {}, qs);
    items.push(...(response.fileSearchStores || response.documents || []));
    pageToken = response.nextPageToken;
  } while (pageToken);

  return items;
}
```

#### Long-Running Operations
```typescript
async function pollOperation(
  this: IExecuteFunctions,
  operationName: string,
  maxAttempts: number = 120, // 10 minutes with 5s intervals
): Promise<any> {
  for (let i = 0; i < maxAttempts; i++) {
    const operation = await apiRequest.call(
      this,
      'GET',
      `/v1beta/${operationName}`,
    );

    if (operation.done) {
      if (operation.error) {
        throw new NodeOperationError(
          this.getNode(),
          `Operation failed: ${operation.error.message}`,
        );
      }
      return operation.response;
    }

    await new Promise(resolve => setTimeout(resolve, 5000));
  }

  throw new NodeOperationError(
    this.getNode(),
    'Operation timeout: exceeded 10 minutes',
  );
}
```

#### Resumable Upload
```typescript
async function uploadFile(
  this: IExecuteFunctions,
  storeName: string,
  file: Buffer,
  mimeType: string,
  config: IDataObject,
): Promise<any> {
  const uploadUrl = `https://generativelanguage.googleapis.com/upload/v1beta/${storeName}:uploadToFileSearchStore`;

  // Start upload session
  const startResponse = await this.helpers.request({
    method: 'POST',
    url: uploadUrl,
    headers: {
      'X-Goog-Upload-Protocol': 'resumable',
      'X-Goog-Upload-Command': 'start',
      'X-Goog-Upload-Header-Content-Length': file.length.toString(),
      'X-Goog-Upload-Header-Content-Type': mimeType,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(config),
    resolveWithFullResponse: true,
  });

  const uploadSessionUrl = startResponse.headers['x-goog-upload-url'];

  // Upload file data
  const uploadResponse = await this.helpers.request({
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

  return uploadResponse;
}
```

### Field Validation

#### Store Name
```typescript
function validateStoreName(name: string): void {
  const pattern = /^fileSearchStores\/[a-z0-9-]{1,40}$/;
  if (!pattern.test(name)) {
    throw new NodeOperationError(
      this.getNode(),
      'Invalid store name format. Must be: fileSearchStores/{id}',
    );
  }
}
```

#### Display Name
```typescript
function validateDisplayName(name: string): void {
  if (name.length > 512) {
    throw new NodeOperationError(
      this.getNode(),
      'Display name must be 512 characters or less',
    );
  }
}
```

#### Custom Metadata
```typescript
function validateCustomMetadata(metadata: any[]): void {
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
        'Custom metadata must have exactly one value type',
      );
    }
  }
}
```

#### Metadata Filter
```typescript
function validateMetadataFilter(filter: string): void {
  // Basic validation for AIP-160 format
  // Full validation would require a parser
  const validOperators = ['=', '!=', '<', '<=', '>', '>=', 'IN', 'AND', 'OR', 'NOT'];

  // Check for balanced quotes
  const quotes = filter.match(/"/g);
  if (quotes && quotes.length % 2 !== 0) {
    throw new NodeOperationError(
      this.getNode(),
      'Metadata filter has unbalanced quotes',
    );
  }
}
```

### Resource Loading

#### Store Picker
```typescript
{
  displayName: 'Store',
  name: 'storeName',
  type: 'resourceLocator',
  default: { mode: 'list', value: '' },
  required: true,
  modes: [
    {
      displayName: 'From List',
      name: 'list',
      type: 'list',
      typeOptions: {
        searchListMethod: 'searchStores',
        searchable: true,
      },
    },
    {
      displayName: 'By Name',
      name: 'name',
      type: 'string',
      validation: [
        {
          type: 'regex',
          properties: {
            regex: 'fileSearchStores/[a-z0-9-]+',
            errorMessage: 'Not a valid store name',
          },
        },
      ],
      placeholder: 'fileSearchStores/my-store-123',
    },
  ],
}
```

```typescript
async searchStores(
  this: ILoadOptionsFunctions,
  filter?: string,
): Promise<INodeListSearchResult> {
  const stores = await listWithPagination.call(this, '/fileSearchStores', 20);

  let results = stores.map(store => ({
    name: store.displayName || store.name,
    value: store.name,
    url: `https://aistudio.google.com/app/stores/${store.name}`,
  }));

  if (filter) {
    const filterLower = filter.toLowerCase();
    results = results.filter(r =>
      r.name.toLowerCase().includes(filterLower) ||
      r.value.toLowerCase().includes(filterLower)
    );
  }

  return { results };
}
```

### Rate Limiting

**Implementation**:
```typescript
class RateLimiter {
  private requests: number[] = [];
  private readonly maxRequests = 10;
  private readonly windowMs = 60000; // 1 minute

  async throttle(): Promise<void> {
    const now = Date.now();
    this.requests = this.requests.filter(t => now - t < this.windowMs);

    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = this.requests[0];
      const waitTime = this.windowMs - (now - oldestRequest);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    this.requests.push(Date.now());
  }
}
```

### Testing

#### Unit Tests
- Validate field inputs
- Test error handling
- Mock API responses
- Test pagination logic
- Test operation polling

#### Integration Tests
- Test with real API (using test credentials)
- Verify file upload/download
- Test long-running operations
- Test error scenarios
- Validate outputs

#### E2E Tests
- Complete workflows
- Multi-node interactions
- Error recovery
- Performance testing

---

## Rate Limits & Quotas

### File Search API Limits
- **Max file size per document**: 100 MB
- **Total store size by tier**:
  - Free: 1 GB
  - Tier 1: 10 GB
  - Tier 2: 100 GB
  - Tier 3: 1 TB
- **Recommended store size**: < 20 GB (for optimal latency)
- **Max custom metadata per document**: 20 items
- **Max display name length**: 512 characters
- **Max page size**: 20 items

### Backend Calculation
Store size = input data + embeddings ≈ 3x input data size

### Pricing
- **Embeddings (indexing)**: $0.15 per 1M tokens
- **Storage**: Free
- **Query embeddings**: Free
- **Retrieved tokens**: Charged as context tokens (standard model pricing)

---

## Security Considerations

### API Key Security
- Store credentials securely using n8n's credential encryption
- Never log API keys
- Rotate keys regularly
- Use environment variables in production

### Data Privacy
- Files are stored in Google's infrastructure
- Embeddings persist until manually deleted
- Temporary files (Files API) auto-delete after 48 hours
- Store data persists indefinitely

### Access Control
- API keys are user-scoped
- Stores are private to the API key owner
- No sharing mechanism between users

### Input Sanitization
- Validate all user inputs
- Sanitize file paths
- Escape special characters in queries
- Validate metadata filter syntax

---

## Future Enhancements

### Phase 2 Features
1. **Batch Operations**
   - Bulk document upload
   - Batch metadata updates
   - Bulk delete operations

2. **Advanced Querying**
   - Hybrid search (semantic + keyword)
   - Multi-store queries
   - Custom ranking parameters

3. **Monitoring & Analytics**
   - Usage statistics
   - Query performance metrics
   - Cost tracking

4. **Store Templates**
   - Pre-configured chunking strategies
   - Industry-specific metadata schemas
   - Best practice defaults

5. **Document Processing**
   - OCR for images
   - Table extraction
   - Multi-modal support

### Phase 3 Features
1. **Webhook Integration**
   - Document processing notifications
   - Store event triggers

2. **Advanced Metadata**
   - Nested metadata structures
   - Computed metadata fields
   - Metadata validation rules

3. **Version Control**
   - Document versioning
   - Rollback capabilities
   - Change history

---

## References

### API Documentation
- [Gemini File Search Overview](https://ai.google.dev/gemini-api/docs/file-search)
- [File Search Stores API](https://ai.google.dev/api/file-search/file-search-stores)
- [File Search Documents API](https://ai.google.dev/api/file-search/documents)
- [AIP-160: Filtering](https://google.aip.dev/160)

### n8n Documentation
- [Creating Nodes](https://docs.n8n.io/integrations/creating-nodes/overview/)
- [Node Development](https://docs.n8n.io/integrations/creating-nodes/build/)
- [Credentials](https://docs.n8n.io/integrations/creating-nodes/build/credentials/)

### Supported Models
- [Gemini 2.5 Pro](https://ai.google.dev/gemini-api/docs/models#gemini-2.5-pro)
- [Gemini 2.5 Flash](https://ai.google.dev/gemini-api/docs/models#gemini-2.5-flash)

---

## Appendix A: Complete API Endpoint Reference

### Store Operations
| Operation | Method | Endpoint | Auth |
|-----------|--------|----------|------|
| Create Store | POST | `/v1beta/fileSearchStores` | API Key |
| List Stores | GET | `/v1beta/fileSearchStores` | API Key |
| Get Store | GET | `/v1beta/fileSearchStores/{name}` | API Key |
| Delete Store | DELETE | `/v1beta/fileSearchStores/{name}` | API Key |
| Get Operation | GET | `/v1beta/{operationName}` | API Key |

### Document Operations
| Operation | Method | Endpoint | Auth |
|-----------|--------|----------|------|
| Upload Document | POST | `/upload/v1beta/{storeName}:uploadToFileSearchStore` | API Key |
| Import File | POST | `/v1beta/{storeName}:importFile` | API Key |
| List Documents | GET | `/v1beta/{storeName}/documents` | API Key |
| Get Document | GET | `/v1beta/{storeName}/documents/{docName}` | API Key |
| Delete Document | DELETE | `/v1beta/{storeName}/documents/{docName}` | API Key |

### Query Operations
| Operation | Method | Endpoint | Auth |
|-----------|--------|----------|------|
| Generate Content | POST | `/v1beta/models/{model}:generateContent` | API Key |

---

## Appendix B: Example Request/Response Payloads

### Create Store Request
```bash
POST /v1beta/fileSearchStores?key={API_KEY}
Content-Type: application/json

{
  "displayName": "Research Papers"
}
```

### Create Store Response
```json
{
  "name": "fileSearchStores/research-papers-123a456b789c",
  "displayName": "Research Papers",
  "createTime": "2025-11-24T10:00:00Z",
  "updateTime": "2025-11-24T10:00:00Z",
  "activeDocumentsCount": "0",
  "pendingDocumentsCount": "0",
  "failedDocumentsCount": "0",
  "sizeBytes": "0"
}
```

### Upload Document Request
```bash
# Step 1: Start upload
POST /upload/v1beta/fileSearchStores/my-store-123:uploadToFileSearchStore?key={API_KEY}
X-Goog-Upload-Protocol: resumable
X-Goog-Upload-Command: start
X-Goog-Upload-Header-Content-Length: 1048576
X-Goog-Upload-Header-Content-Type: application/pdf
Content-Type: application/json

{
  "displayName": "AI Research Paper",
  "customMetadata": [
    {"key": "author", "stringValue": "Dr. Jane Smith"},
    {"key": "year", "numericValue": 2024}
  ],
  "chunkingConfig": {
    "whiteSpaceConfig": {
      "maxTokensPerChunk": 200,
      "maxOverlapTokens": 20
    }
  }
}

# Response contains: x-goog-upload-url header

# Step 2: Upload file data
POST {x-goog-upload-url}
Content-Length: 1048576
X-Goog-Upload-Offset: 0
X-Goog-Upload-Command: upload, finalize

[binary file data]
```

### Upload Document Response
```json
{
  "name": "fileSearchStores/my-store-123/upload/operations/op-789xyz",
  "metadata": {
    "@type": "type.googleapis.com/google.ai.generativelanguage.v1beta.UploadMetadata",
    "progressPercent": 0
  },
  "done": false
}
```

### Query Documents Request
```bash
POST /v1beta/models/gemini-2.5-flash:generateContent?key={API_KEY}
Content-Type: application/json

{
  "contents": [{
    "parts": [{"text": "What are the key findings about transformer models?"}]
  }],
  "tools": [{
    "fileSearch": {
      "fileSearchStoreNames": ["fileSearchStores/research-papers-123"],
      "metadataFilter": "category=\"artificial-intelligence\" AND year>=2023"
    }
  }]
}
```

### Query Documents Response
```json
{
  "candidates": [{
    "content": {
      "parts": [{
        "text": "Based on the research papers, transformer models have revolutionized..."
      }],
      "role": "model"
    },
    "groundingMetadata": {
      "groundingChunks": [{
        "web": null,
        "retrievedContext": {
          "uri": "fileSearchStores/research-papers-123/documents/doc-abc",
          "title": "AI Research Paper"
        }
      }],
      "groundingSupports": [{
        "segment": {
          "startIndex": 0,
          "endIndex": 156
        },
        "groundingChunkIndices": [0],
        "confidenceScores": [0.95]
      }]
    },
    "finishReason": "STOP"
  }],
  "usageMetadata": {
    "promptTokenCount": 1024,
    "candidatesTokenCount": 256,
    "totalTokenCount": 1280
  }
}
```

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-11-24 | AI Assistant | Initial specification document |

---

**END OF SPECIFICATION**
