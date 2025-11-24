# Gemini File Search API Reference

This document provides detailed information about the Google Gemini File Search API, including endpoints, authentication, rate limits, error codes, and best practices.

## Table of Contents

1. [API Overview](#api-overview)
2. [Authentication](#authentication)
3. [Base URL & Versioning](#base-url--versioning)
4. [Endpoints Reference](#endpoints-reference)
5. [Error Codes](#error-codes)
6. [Rate Limits & Quotas](#rate-limits--quotas)
7. [Best Practices](#best-practices)
8. [Pagination](#pagination)
9. [Long-Running Operations](#long-running-operations)
10. [External Resources](#external-resources)

---

## API Overview

The Google Gemini File Search API provides a Retrieval-Augmented Generation (RAG) system that enables semantic search across documents using AI embeddings. The API consists of three main resource types:

| Resource | Description |
|----------|-------------|
| **File Search Stores** | Containers for documents with search capabilities |
| **Documents** | Individual files within stores, automatically chunked and embedded |
| **Operations** | Long-running tasks like uploads and imports |

**Key Features**:
- Automatic document chunking and embedding
- Semantic search with natural language queries
- Metadata filtering with AIP-160 syntax
- Support for multiple file formats (PDF, DOCX, TXT, etc.)
- Built-in integration with Gemini models for RAG

---

## Authentication

### API Key Authentication

The Gemini File Search API uses API key authentication via custom headers.

**Header Format**:
```http
x-goog-api-key: YOUR_API_KEY
```

**Example Request**:
```bash
curl -H "x-goog-api-key: AIzaSyD..." \
     https://generativelanguage.googleapis.com/v1beta/fileSearchStores
```

### Obtaining an API Key

1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Create or select a Google Cloud project
4. Click "Create API Key"
5. Copy and securely store your key

### Security Best Practices

✅ **DO**:
- Store keys in environment variables or secret management systems
- Use different keys for development and production
- Rotate keys periodically (every 90 days recommended)
- Monitor API key usage in Google Cloud Console
- Restrict API key permissions to only necessary APIs

❌ **DON'T**:
- Commit API keys to version control
- Share keys in public forums or documentation
- Use production keys in client-side code
- Embed keys in mobile apps without protection
- Use the same key across multiple projects

### Testing Your API Key

**Quick Test**:
```bash
curl -H "x-goog-api-key: YOUR_API_KEY" \
     "https://generativelanguage.googleapis.com/v1beta/fileSearchStores?pageSize=1"
```

**Expected Response** (200 OK):
```json
{
  "fileSearchStores": []
}
```

**Invalid Key Response** (401 Unauthorized):
```json
{
  "error": {
    "code": 401,
    "message": "API key not valid",
    "status": "UNAUTHENTICATED"
  }
}
```

---

## Base URL & Versioning

### Base URL

```
https://generativelanguage.googleapis.com/v1beta
```

All API endpoints are relative to this base URL.

### API Version

Current version: **v1beta**

**Note**: The `v1beta` version indicates the API is in beta. Expect:
- Possible breaking changes (with advance notice)
- New features added regularly
- Production-ready but evolving
- Migration path to v1 when available

### Endpoint Structure

```
{baseURL}/{resource}/{resourceId}:{action}
```

**Examples**:
```
GET  /v1beta/fileSearchStores
POST /v1beta/fileSearchStores
GET  /v1beta/fileSearchStores/{storeId}
POST /v1beta/fileSearchStores/{storeId}:uploadToFileSearchStore
GET  /v1beta/fileSearchStores/{storeId}/documents
POST /v1beta/models/{model}:generateContent
```

---

## Endpoints Reference

### File Search Stores

#### List Stores

```http
GET /v1beta/fileSearchStores
```

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| pageSize | integer | No | Max results per page (1-20, default: 10) |
| pageToken | string | No | Token for next page |

**Response**:
```json
{
  "fileSearchStores": [
    {
      "name": "fileSearchStores/store-123",
      "displayName": "My Store",
      "createTime": "2025-11-24T10:00:00Z",
      "updateTime": "2025-11-24T10:00:00Z",
      "activeDocumentsCount": "5",
      "pendingDocumentsCount": "0",
      "failedDocumentsCount": "0",
      "sizeBytes": "1048576"
    }
  ],
  "nextPageToken": "abc123"
}
```

---

#### Create Store

```http
POST /v1beta/fileSearchStores
```

**Request Body**:
```json
{
  "displayName": "My Knowledge Base"
}
```

**Response**:
```json
{
  "name": "fileSearchStores/my-knowledge-base-abc123",
  "displayName": "My Knowledge Base",
  "createTime": "2025-11-24T10:00:00Z",
  "updateTime": "2025-11-24T10:00:00Z",
  "activeDocumentsCount": "0",
  "pendingDocumentsCount": "0",
  "failedDocumentsCount": "0",
  "sizeBytes": "0"
}
```

---

#### Get Store

```http
GET /v1beta/{storeName}
```

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| storeName | string | Yes | Full resource name (e.g., `fileSearchStores/store-123`) |

**Response**: Same as Create Store

---

#### Delete Store

```http
DELETE /v1beta/{storeName}?force={boolean}
```

**Query Parameters**:
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| force | boolean | No | false | Delete even if store contains documents |

**Response**:
```json
{}
```

---

### Documents

#### Upload Document

**Step 1: Initiate Upload**
```http
POST /v1beta/{storeName}:uploadToFileSearchStore
X-Goog-Upload-Protocol: resumable
X-Goog-Upload-Command: start
X-Goog-Upload-Header-Content-Length: {fileSize}
X-Goog-Upload-Header-Content-Type: {mimeType}

Content-Type: application/json

{
  "displayName": "My Document",
  "customMetadata": [
    {
      "key": "author",
      "stringValue": "John Doe"
    }
  ],
  "chunkingConfig": {
    "whiteSpaceConfig": {
      "maxTokensPerChunk": 200,
      "maxOverlapTokens": 20
    }
  }
}
```

**Response**:
```http
200 OK
X-Goog-Upload-URL: https://...upload-url...
```

**Step 2: Upload File Data**
```http
POST {uploadUrl}
X-Goog-Upload-Command: upload, finalize
X-Goog-Upload-Offset: 0
Content-Type: {mimeType}

[binary file data]
```

**Response**: Long-running operation object

---

#### Import Document

```http
POST /v1beta/{storeName}:importFile
```

**Request Body**:
```json
{
  "fileName": "files/xyz789",
  "displayName": "Imported Document",
  "customMetadata": [
    {
      "key": "source",
      "stringValue": "Files API"
    }
  ]
}
```

**Response**: Long-running operation object

---

#### List Documents

```http
GET /v1beta/{storeName}/documents
```

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| pageSize | integer | No | Max results per page (1-20, default: 10) |
| pageToken | string | No | Token for next page |

**Response**:
```json
{
  "documents": [
    {
      "name": "fileSearchStores/store-123/documents/doc-456",
      "displayName": "Document 1",
      "state": "STATE_ACTIVE",
      "sizeBytes": "1048576",
      "mimeType": "application/pdf",
      "createTime": "2025-11-24T10:00:00Z",
      "updateTime": "2025-11-24T10:00:30Z",
      "customMetadata": [
        {
          "key": "author",
          "stringValue": "John Doe"
        }
      ]
    }
  ],
  "nextPageToken": "xyz"
}
```

---

#### Get Document

```http
GET /v1beta/{documentName}
```

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| documentName | string | Yes | Full resource name |

**Response**: Single document object

---

#### Delete Document

```http
DELETE /v1beta/{documentName}?force={boolean}
```

**Query Parameters**:
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| force | boolean | No | false | Delete even if chunks exist |

**Response**:
```json
{}
```

---

### Query (RAG)

#### Generate Content with File Search

```http
POST /v1beta/models/{model}:generateContent
```

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| model | string | Yes | Model name (e.g., `gemini-2.5-flash`) |

**Request Body**:
```json
{
  "contents": [
    {
      "parts": [
        {
          "text": "What are the key findings about machine learning?"
        }
      ]
    }
  ],
  "tools": [
    {
      "fileSearch": {
        "fileSearchStoreNames": [
          "fileSearchStores/store-123"
        ],
        "metadataFilter": "year >= 2023 AND topics:machine-learning"
      }
    }
  ]
}
```

**Response**:
```json
{
  "candidates": [
    {
      "content": {
        "parts": [
          {
            "text": "Based on the documents, the key findings about machine learning include..."
          }
        ],
        "role": "model"
      },
      "finishReason": "STOP",
      "groundingMetadata": {
        "retrievedContext": [
          {
            "uri": "fileSearchStores/store-123/documents/doc-456",
            "title": "ML Research Paper.pdf"
          }
        ]
      }
    }
  ],
  "usageMetadata": {
    "promptTokenCount": 1245,
    "candidatesTokenCount": 187,
    "totalTokenCount": 1432
  }
}
```

---

### Operations

#### Get Operation Status

```http
GET /v1beta/{operationName}
```

**Path Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| operationName | string | Yes | Full operation resource name |

**Response (In Progress)**:
```json
{
  "name": "fileSearchStores/store-123/operations/op-456",
  "done": false,
  "metadata": {
    "@type": "type.googleapis.com/google.ai.generativelanguage.v1beta.UploadDocumentMetadata",
    "totalBytes": "5242880",
    "uploadedBytes": "2621440",
    "percentComplete": 50
  }
}
```

**Response (Completed)**:
```json
{
  "name": "fileSearchStores/store-123/operations/op-456",
  "done": true,
  "response": {
    "@type": "type.googleapis.com/google.ai.generativelanguage.v1beta.Document",
    "name": "fileSearchStores/store-123/documents/doc-789",
    "state": "STATE_ACTIVE"
  }
}
```

**Response (Failed)**:
```json
{
  "name": "fileSearchStores/store-123/operations/op-456",
  "done": true,
  "error": {
    "code": 400,
    "message": "Invalid file format",
    "details": [...]
  }
}
```

---

## Error Codes

### HTTP Status Codes

| Code | Status | Meaning |
|------|--------|---------|
| 200 | OK | Request succeeded |
| 400 | Bad Request | Invalid parameters or request body |
| 401 | Unauthorized | Invalid or missing API key |
| 403 | Forbidden | API key lacks permissions |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Resource already exists or state conflict |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Google server error |
| 503 | Service Unavailable | Temporary service outage |

### Error Response Format

```json
{
  "error": {
    "code": 400,
    "message": "Invalid file format: application/x-custom",
    "status": "INVALID_ARGUMENT",
    "details": [
      {
        "@type": "type.googleapis.com/google.rpc.ErrorInfo",
        "reason": "INVALID_FILE_FORMAT",
        "domain": "generativelanguage.googleapis.com",
        "metadata": {
          "supportedFormats": "pdf,txt,docx,..."
        }
      }
    ]
  }
}
```

### Common Error Reasons

#### Authentication Errors

**401 UNAUTHENTICATED**
```json
{
  "error": {
    "code": 401,
    "message": "API key not valid. Please pass a valid API key.",
    "status": "UNAUTHENTICATED"
  }
}
```

**Solution**: Verify API key, check it's enabled, ensure billing is active

---

#### Resource Errors

**404 NOT_FOUND**
```json
{
  "error": {
    "code": 404,
    "message": "Store 'fileSearchStores/invalid-store' not found",
    "status": "NOT_FOUND"
  }
}
```

**Solution**: Verify resource name, check it hasn't been deleted, ensure correct format

---

#### Validation Errors

**400 INVALID_ARGUMENT**
```json
{
  "error": {
    "code": 400,
    "message": "Display name exceeds maximum length of 512 characters",
    "status": "INVALID_ARGUMENT"
  }
}
```

**Solution**: Fix parameter values, check validation rules, review API documentation

---

#### Rate Limit Errors

**429 RESOURCE_EXHAUSTED**
```json
{
  "error": {
    "code": 429,
    "message": "Quota exceeded for quota metric 'Create requests' and limit 'Create requests per minute'",
    "status": "RESOURCE_EXHAUSTED"
  }
}
```

**Solution**: Implement exponential backoff, reduce request rate, request quota increase

---

## Rate Limits & Quotas

### API Rate Limits (Free Tier)

| Operation | Limit | Time Window |
|-----------|-------|-------------|
| **List Stores** | 60 requests | per minute |
| **Create Store** | 10 requests | per minute |
| **Delete Store** | 10 requests | per minute |
| **Get Store** | 300 requests | per minute |
| **Upload Document** | 10 requests | per minute |
| **Import Document** | 10 requests | per minute |
| **List Documents** | 60 requests | per minute |
| **Get Document** | 300 requests | per minute |
| **Delete Document** | 10 requests | per minute |
| **Query (generateContent)** | 15 requests | per minute |

### Storage & Resource Quotas

| Resource | Free Tier | Notes |
|----------|-----------|-------|
| **Max File Size** | 100 MB | Per file upload |
| **Max Documents per Store** | Unlimited | Subject to API quotas |
| **Max Stores per Project** | ~1,000 | Soft limit, contact support for more |
| **Max Metadata Entries** | 20 | Per document |
| **Max Tokens per Query** | ~32,000 | Model dependent |

### Token Pricing (as of Nov 2024)

#### Gemini 2.5 Flash
- **Input**: $0.075 per 1M tokens
- **Output**: $0.30 per 1M tokens

#### Gemini 2.5 Pro
- **Input**: $1.25 per 1M tokens
- **Output**: $5.00 per 1M tokens

#### Gemini 3 Pro Preview
- **Pricing**: Contact Google for preview pricing

**Note**: Prices subject to change. Check [Google Cloud Pricing](https://ai.google.dev/pricing) for latest rates.

### Handling Rate Limits

#### Exponential Backoff

```javascript
async function apiRequestWithRetry(requestFn, maxRetries = 5) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await requestFn();
    } catch (error) {
      if (error.code === 429) {
        const delay = Math.min(1000 * Math.pow(2, i), 32000);
        console.log(`Rate limited. Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw error;
      }
    }
  }
  throw new Error('Max retries exceeded');
}
```

#### Request Batching

- Group related operations
- Use pagination to avoid large responses
- Implement request queues
- Monitor quota usage in Google Cloud Console

---

## Best Practices

### API Design Best Practices

#### 1. Use Resource Names Correctly

**Correct**:
```javascript
const storeName = "fileSearchStores/my-store-123";
const documentName = "fileSearchStores/my-store-123/documents/doc-456";
```

**Incorrect**:
```javascript
const storeName = "my-store-123";  // Missing prefix
const documentName = "doc-456";    // Not fully qualified
```

---

#### 2. Implement Proper Error Handling

```javascript
try {
  const result = await apiRequest();
  return result;
} catch (error) {
  if (error.code === 404) {
    // Resource not found - handle gracefully
    console.log('Resource not found, creating new one...');
  } else if (error.code === 429) {
    // Rate limit - implement backoff
    await exponentialBackoff();
    return retry();
  } else if (error.code >= 500) {
    // Server error - retry
    return retryWithBackoff();
  } else {
    // Client error - don't retry
    throw error;
  }
}
```

---

#### 3. Use Pagination Efficiently

```javascript
async function getAllStores() {
  const stores = [];
  let pageToken = null;

  do {
    const response = await listStores({ pageToken, pageSize: 20 });
    stores.push(...response.fileSearchStores);
    pageToken = response.nextPageToken;
  } while (pageToken);

  return stores;
}
```

---

#### 4. Optimize Token Usage

**Use Metadata Filters**:
```json
{
  "metadataFilter": "year >= 2023 AND department = 'Engineering'"
}
```
This reduces retrieved chunks, lowering token costs.

**Choose Appropriate Models**:
- Use Flash for 95% of queries (5x cheaper than Pro)
- Use Pro only for complex reasoning
- Avoid preview models in production

**Cache Frequent Queries**:
```javascript
const cache = new Map();

async function queryWithCache(query, storeNames, ttl = 3600000) {
  const key = `${query}:${storeNames}`;

  if (cache.has(key)) {
    const { result, timestamp } = cache.get(key);
    if (Date.now() - timestamp < ttl) {
      return result;
    }
  }

  const result = await queryDocuments(query, storeNames);
  cache.set(key, { result, timestamp: Date.now() });
  return result;
}
```

---

#### 5. Handle Long-Running Operations

```javascript
async function uploadDocumentAndWait(storeName, file) {
  // Start upload without waiting
  const operation = await uploadDocument(storeName, file, {
    waitForCompletion: false
  });

  // Poll for completion
  while (!operation.done) {
    await sleep(2000);  // Wait 2 seconds
    operation = await getOperationStatus(operation.name);

    if (operation.metadata?.percentComplete) {
      console.log(`Progress: ${operation.metadata.percentComplete}%`);
    }
  }

  if (operation.error) {
    throw new Error(operation.error.message);
  }

  return operation.response;
}
```

---

#### 6. Secure Your API Keys

**Environment Variables**:
```bash
# .env
GEMINI_API_KEY=AIzaSyD...

# Load in code
require('dotenv').config();
const apiKey = process.env.GEMINI_API_KEY;
```

**Secret Management**:
```javascript
// AWS Secrets Manager
const aws = require('aws-sdk');
const secretsManager = new aws.SecretsManager();

async function getApiKey() {
  const secret = await secretsManager.getSecretValue({
    SecretId: 'gemini-api-key'
  }).promise();
  return JSON.parse(secret.SecretString).apiKey;
}
```

---

## Pagination

### How Pagination Works

The API uses token-based pagination for list operations:

1. First request returns results + `nextPageToken`
2. Subsequent requests include `pageToken` parameter
3. Last page returns no `nextPageToken`

### Example: Manual Pagination

```javascript
let pageToken = null;
const allStores = [];

do {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/fileSearchStores?` +
    `pageSize=20${pageToken ? `&pageToken=${pageToken}` : ''}`,
    {
      headers: { 'x-goog-api-key': API_KEY }
    }
  );

  const data = await response.json();
  allStores.push(...(data.fileSearchStores || []));
  pageToken = data.nextPageToken;

} while (pageToken);
```

### Page Size Recommendations

| Use Case | Page Size | Reasoning |
|----------|-----------|-----------|
| Quick checks | 1-5 | Minimize response time |
| UI pagination | 10-15 | Balance UX and performance |
| Batch processing | 20 (max) | Minimize API calls |

---

## Long-Running Operations

### Operation Lifecycle

1. **Initiate**: POST request starts operation, returns operation object
2. **Poll**: GET operation status until `done=true`
3. **Complete**: Check `response` (success) or `error` (failure)

### Polling Strategy

```javascript
async function pollOperation(operationName, {
  maxAttempts = 60,
  intervalMs = 2000,
  onProgress = null
} = {}) {
  for (let i = 0; i < maxAttempts; i++) {
    const operation = await getOperationStatus(operationName);

    if (operation.done) {
      if (operation.error) {
        throw new Error(operation.error.message);
      }
      return operation.response;
    }

    if (onProgress && operation.metadata) {
      onProgress(operation.metadata);
    }

    await sleep(intervalMs);
  }

  throw new Error('Operation timeout');
}
```

### Operation Timeout Guidelines

| File Size | Expected Time | Recommended Timeout |
|-----------|---------------|---------------------|
| < 1 MB | 5-15 seconds | 60 seconds |
| 1-10 MB | 15-60 seconds | 5 minutes |
| 10-50 MB | 1-5 minutes | 10 minutes |
| 50-100 MB | 5-15 minutes | 30 minutes |

---

## External Resources

### Official Documentation

- **[Gemini File Search API](https://ai.google.dev/gemini-api/docs/file-search)**: Main documentation
- **[File Search Stores API](https://ai.google.dev/api/file-search/file-search-stores)**: Stores endpoint reference
- **[Documents API](https://ai.google.dev/api/file-search/documents)**: Documents endpoint reference
- **[AIP-160 Filtering](https://google.aip.dev/160)**: Metadata filter syntax
- **[Google Cloud Pricing](https://ai.google.dev/pricing)**: Latest pricing information

### Developer Resources

- **[Google AI Studio](https://aistudio.google.com/)**: API key management and testing
- **[Google Cloud Console](https://console.cloud.google.com/)**: Project and quota management
- **[Gemini API Quickstart](https://ai.google.dev/gemini-api/docs/quickstart)**: Getting started guide
- **[API Status Page](https://status.cloud.google.com/)**: Service health and incidents

### Community & Support

- **[n8n Community](https://community.n8n.io/)**: n8n-specific help
- **[Google AI Dev Forum](https://discuss.ai.google.dev/)**: Official Google AI forum
- **[Stack Overflow](https://stackoverflow.com/questions/tagged/google-gemini)**: Tagged questions
- **[GitHub Issues](https://github.com/yourusername/n8n-nodes-gemini-file-search/issues)**: Package-specific issues

---

## API Changelog

### v1beta (Current)

**2024-11-24**:
- Initial beta release
- File Search Stores CRUD operations
- Document upload, import, list, get, delete
- Query with metadata filtering
- Chunking configuration support
- Custom metadata (20 entries max)

**Future Planned**:
- Transition to v1 (stable)
- Enhanced metadata types
- Bulk operations
- Webhooks for operation completion
- Advanced chunking strategies

---

## Support

**API Issues**:
- Check [Google AI Status Page](https://status.cloud.google.com/)
- Review error messages and codes above
- Consult [official documentation](https://ai.google.dev/api/file-search)
- Post on [Google AI Dev Forum](https://discuss.ai.google.dev/)

**Integration Issues**:
- Review [node documentation](./nodes/)
- Check [getting started guide](./GETTING_STARTED.md)
- Search [n8n community](https://community.n8n.io/)
- Open [GitHub issue](https://github.com/yourusername/n8n-nodes-gemini-file-search/issues)

---

**Last Updated**: 2024-11-24
**API Version**: v1beta
**Document Version**: 1.0.0
