# Gemini File Search Stores Node

## Overview

The **Gemini File Search Stores** node enables you to manage File Search stores for Google Gemini's Retrieval-Augmented Generation (RAG) operations. File Search stores are containers that hold documents and enable semantic search capabilities powered by Gemini's AI models.

Use this node to create, list, retrieve, and delete stores, as well as monitor the status of long-running operations.

## Prerequisites

Before using this node, ensure you have:

- **Google Cloud Account**: Active Google Cloud account with billing enabled
- **Gemini API Key**: API key with File Search API access enabled
- **n8n Instance**: Self-hosted or cloud-based n8n instance (version 1.0.0 or higher)

## Credentials Setup

This node requires **Gemini API** credentials to authenticate with Google's Gemini API.

### Step-by-Step Setup

1. **Obtain Your API Key**:
   - Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
   - Click "Create API Key" or select an existing project
   - Copy your API key

2. **Configure Credentials in n8n**:
   - In n8n, click on "Credentials" in the left sidebar
   - Click "New" and search for "Gemini API"
   - Paste your API key in the "API Key" field
   - Click "Save"

3. **Test Connection**:
   - The credential will automatically test the connection by listing stores
   - If successful, you'll see a green checkmark

> **Warning**: Keep your API key secure. Never commit it to version control or share it publicly.

## Operations

### Create Store

Creates a new empty File Search store. Stores act as containers for documents and enable semantic search capabilities.

#### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| Display Name | string | No | — | Human-readable name for the store (max 512 characters) |

#### Returns

A store object containing:

- `name`: Resource name (e.g., `fileSearchStores/store-abc123`)
- `displayName`: The human-readable name (if provided)
- `createTime`: ISO 8601 timestamp when the store was created
- `updateTime`: ISO 8601 timestamp of last update
- `activeDocumentsCount`: Number of successfully processed documents
- `pendingDocumentsCount`: Number of documents being processed
- `failedDocumentsCount`: Number of documents that failed processing
- `sizeBytes`: Total size of all documents in bytes

#### Example

**Input:**
```json
{
  "displayName": "Research Papers Q4 2024"
}
```

**Output:**
```json
{
  "name": "fileSearchStores/research-papers-q4-2024-abc123",
  "displayName": "Research Papers Q4 2024",
  "createTime": "2025-11-24T10:30:00.123456Z",
  "updateTime": "2025-11-24T10:30:00.123456Z",
  "activeDocumentsCount": "0",
  "pendingDocumentsCount": "0",
  "failedDocumentsCount": "0",
  "sizeBytes": "0"
}
```

#### Use Cases

- Creating a knowledge base for customer support documents
- Setting up a research repository for academic papers
- Building a product documentation store
- Organizing legal documents by case or client

#### Notes

- Display names are optional but recommended for organization
- Store names are automatically generated and globally unique
- Empty stores have zero storage cost
- Stores can contain unlimited documents (subject to API quotas)

---

### List Stores

Lists all File Search stores in your project. Supports pagination to handle large numbers of stores.

#### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| Return All | boolean | No | false | Whether to return all stores or limit results |
| Limit | number | No | 10 | Maximum number of stores to return (1-20) |

> **Note**: "Limit" only appears when "Return All" is set to false.

#### Returns

An array of store objects. Each object contains the same fields as described in the [Create Store](#create-store) operation.

#### Example

**Input (Return All = false, Limit = 5):**
```json
{
  "returnAll": false,
  "limit": 5
}
```

**Output:**
```json
[
  {
    "name": "fileSearchStores/customer-support-abc123",
    "displayName": "Customer Support KB",
    "createTime": "2025-11-20T08:00:00Z",
    "updateTime": "2025-11-24T10:15:00Z",
    "activeDocumentsCount": "245",
    "pendingDocumentsCount": "3",
    "failedDocumentsCount": "2",
    "sizeBytes": "15728640"
  },
  {
    "name": "fileSearchStores/research-papers-def456",
    "displayName": "Research Papers",
    "createTime": "2025-11-22T14:30:00Z",
    "updateTime": "2025-11-24T09:45:00Z",
    "activeDocumentsCount": "87",
    "pendingDocumentsCount": "0",
    "failedDocumentsCount": "1",
    "sizeBytes": "42991616"
  }
]
```

#### Use Cases

- Auditing all stores in your project
- Finding stores with failed documents for troubleshooting
- Monitoring document counts and storage usage
- Building dashboards showing store statistics

#### Notes

- API returns maximum 20 stores per page (enforced by Google)
- "Return All" automatically handles pagination for you
- Results are ordered by creation time (newest first)
- Empty list returned if no stores exist

---

### Get Store

Retrieves detailed information about a specific File Search store.

#### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| Store Name | string | Yes | — | The resource name of the store |

#### Returns

A single store object with all fields as described in the [Create Store](#create-store) operation.

#### Example

**Input:**
```json
{
  "storeName": "fileSearchStores/customer-support-abc123"
}
```

**Output:**
```json
{
  "name": "fileSearchStores/customer-support-abc123",
  "displayName": "Customer Support KB",
  "createTime": "2025-11-20T08:00:00.123456Z",
  "updateTime": "2025-11-24T10:15:30.789012Z",
  "activeDocumentsCount": "245",
  "pendingDocumentsCount": "3",
  "failedDocumentsCount": "2",
  "sizeBytes": "15728640"
}
```

#### Use Cases

- Checking document processing status
- Retrieving store metadata before uploading documents
- Monitoring storage usage for cost estimation
- Verifying store exists before performing operations

#### Error Handling

**Store Not Found (404):**
```json
{
  "error": {
    "code": 404,
    "message": "Store 'fileSearchStores/invalid-store' not found"
  }
}
```

#### Notes

- Store name must be in format: `fileSearchStores/{store-id}`
- Names are case-sensitive
- Operation is idempotent and safe to retry
- Very fast operation (<100ms typically)

---

### Delete Store

Permanently deletes a File Search store and all its documents.

#### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| Store Name | string | Yes | — | The resource name of the store |
| Force | boolean | No | false | Delete even if store contains documents |

#### Returns

An empty object `{}` on successful deletion.

#### Example

**Input:**
```json
{
  "storeName": "fileSearchStores/old-store-xyz789",
  "force": true
}
```

**Output:**
```json
{}
```

#### Use Cases

- Cleaning up test or development stores
- Removing outdated knowledge bases
- Freeing storage space
- Archiving completed projects

#### Error Handling

**Store Contains Documents (force = false):**
```json
{
  "error": {
    "code": 400,
    "message": "Cannot delete store with documents. Use force=true to override."
  }
}
```

**Store Not Found:**
```json
{
  "error": {
    "code": 404,
    "message": "Store 'fileSearchStores/invalid-store' not found"
  }
}
```

#### Notes

> **Warning**: This operation is **irreversible**. All documents and metadata will be permanently deleted.

- Set `force=true` to delete non-empty stores
- Deletion is immediate but may take time to propagate
- Document chunks and embeddings are also deleted
- Store names cannot be reused immediately (24-48 hour cooldown)

**Best Practices:**
- Always backup important data before deletion
- Use `force=false` first to check for documents
- Consider archiving documents instead of deleting
- Use descriptive store names to avoid accidental deletion

---

### Get Operation Status

Retrieves the status of a long-running operation, such as document upload or import.

#### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| Operation Name | string | Yes | — | The resource name of the operation |

#### Returns

An operation object containing:

- `name`: Resource name of the operation
- `done`: Boolean indicating if operation completed
- `metadata`: Operation-specific metadata (type, progress, etc.)
- `response`: Result data (if done=true and successful)
- `error`: Error details (if done=true and failed)

#### Example

**Input:**
```json
{
  "operationName": "fileSearchStores/my-store-abc123/operations/upload-def456"
}
```

**Output (In Progress):**
```json
{
  "name": "fileSearchStores/my-store-abc123/operations/upload-def456",
  "done": false,
  "metadata": {
    "@type": "type.googleapis.com/google.ai.generativelanguage.v1beta.UploadDocumentMetadata",
    "totalBytes": "5242880",
    "uploadedBytes": "2621440",
    "percentComplete": 50
  }
}
```

**Output (Completed Successfully):**
```json
{
  "name": "fileSearchStores/my-store-abc123/operations/upload-def456",
  "done": true,
  "metadata": {
    "@type": "type.googleapis.com/google.ai.generativelanguage.v1beta.UploadDocumentMetadata",
    "totalBytes": "5242880",
    "uploadedBytes": "5242880",
    "percentComplete": 100
  },
  "response": {
    "@type": "type.googleapis.com/google.ai.generativelanguage.v1beta.Document",
    "name": "fileSearchStores/my-store-abc123/documents/doc-ghi789",
    "displayName": "Annual Report 2024.pdf",
    "state": "STATE_ACTIVE",
    "sizeBytes": "5242880",
    "mimeType": "application/pdf"
  }
}
```

**Output (Failed):**
```json
{
  "name": "fileSearchStores/my-store-abc123/operations/upload-def456",
  "done": true,
  "error": {
    "code": 400,
    "message": "File format not supported: application/x-custom",
    "details": [
      {
        "@type": "type.googleapis.com/google.rpc.ErrorInfo",
        "reason": "INVALID_FILE_FORMAT"
      }
    ]
  }
}
```

#### Use Cases

- Polling upload progress for large files
- Monitoring batch document imports
- Building progress bars in workflows
- Debugging failed operations
- Implementing retry logic for failed uploads

#### Polling Strategy

For operations with `waitForCompletion=false`, use this operation to poll status:

```javascript
// Pseudo-code workflow
1. Upload document with waitForCompletion=false
2. Extract operation.name from response
3. Loop:
   - Call Get Operation Status
   - If done=true: Process response/error and exit
   - If done=false: Wait 2-5 seconds and retry
   - Implement max retries (e.g., 60 attempts = 5 minutes)
```

#### Notes

- Operation names are in format: `{storeName}/operations/{operation-id}`
- Completed operations remain accessible for 24 hours
- Polling interval should be 2-5 seconds minimum
- Large files (>50MB) may take several minutes to process
- Operations expire after 24 hours if not queried

---

## Common Use Cases

### 1. Building a Knowledge Base

Create a store for your company's documentation:

```
1. Create Store (displayName: "Company Documentation")
2. Upload multiple documents using the Documents node
3. Query the store to answer questions
```

### 2. Organizing by Department

Set up separate stores for different teams:

```
1. Create Store (displayName: "Engineering Docs")
2. Create Store (displayName: "Marketing Materials")
3. Create Store (displayName: "Legal Contracts")
4. Upload relevant documents to each store
```

### 3. Monitoring Store Health

Regular health checks for your stores:

```
1. List Stores (returnAll: true)
2. For each store:
   - Check failedDocumentsCount
   - Alert if failedDocumentsCount > 0
   - Get failed document details
```

### 4. Store Lifecycle Management

Automated cleanup of old stores:

```
1. List Stores (returnAll: true)
2. Filter stores by createTime (older than 90 days)
3. For each old store:
   - Check activeDocumentsCount
   - If count = 0: Delete Store (force: false)
   - If count > 0: Archive or skip
```

## Troubleshooting

### Issue: "Authentication failed"

**Cause**: Invalid or missing API key

**Solution**:
1. Verify API key is correct in Credentials
2. Check API key hasn't expired
3. Ensure File Search API is enabled in Google Cloud Console
4. Test credentials using the built-in test function

---

### Issue: "Store not found"

**Cause**: Incorrect store name or store was deleted

**Solution**:
1. Use List Stores to see all available stores
2. Verify store name format: `fileSearchStores/{store-id}`
3. Check for typos (names are case-sensitive)
4. Remember deleted stores cannot be accessed

---

### Issue: "Cannot delete store" (force=false)

**Cause**: Store contains documents

**Solution**:
1. Set `force=true` to delete store with documents
2. Or delete all documents first, then delete store
3. Use Get Store to check document counts before deletion

---

### Issue: "Rate limit exceeded"

**Cause**: Too many API requests in short time

**Solution**:
1. Implement exponential backoff in your workflow
2. Add delays between operations (use n8n's Wait node)
3. Check your API quota in Google Cloud Console
4. Consider upgrading your API quota if needed

**Rate Limits** (as of 2024):
- **List Stores**: 60 requests per minute
- **Create Store**: 10 requests per minute
- **Delete Store**: 10 requests per minute
- **Get Store**: 300 requests per minute

---

### Issue: Operation timeout

**Cause**: Long-running operation taking longer than expected

**Solution**:
1. Use `waitForCompletion=false` for large uploads
2. Poll status using Get Operation Status
3. Increase workflow timeout settings
4. Check operation.error for failure details

---

## Best Practices

1. **Use Descriptive Names**
   - Always provide meaningful display names
   - Include dates, projects, or departments in names
   - Example: "Customer Support Q4 2024" vs. "Store 1"

2. **Monitor Document Counts**
   - Regularly check `failedDocumentsCount`
   - Investigate failures promptly
   - Set up alerts for failed documents

3. **Implement Error Handling**
   - Use n8n's error handling workflows
   - Catch and log all API errors
   - Implement retry logic for transient failures

4. **Organize Stores Logically**
   - Create separate stores for different use cases
   - Don't mix unrelated documents in one store
   - Consider access control and data isolation

5. **Regular Maintenance**
   - Archive or delete unused stores
   - Monitor storage costs
   - Keep store counts manageable (<100 stores recommended)

6. **Test Before Production**
   - Create test stores for development
   - Validate workflows with small document sets
   - Use force=false initially to prevent accidents

---

## Related Resources

- **[Gemini File Search Documents Node](./gemini-file-search-documents.md)**: Upload and query documents
- **[Getting Started Guide](../GETTING_STARTED.md)**: Complete setup walkthrough
- **[API Reference](../API.md)**: Detailed API documentation
- **[Google Gemini File Search API](https://ai.google.dev/gemini-api/docs/file-search)**: Official Google documentation
- **[n8n Node Development](https://docs.n8n.io/integrations/creating-nodes/)**: n8n integration docs

---

## Support

**Issues or Questions?**
- Check the [troubleshooting section](#troubleshooting) above
- Review [common use cases](#common-use-cases)
- Consult [Google's API documentation](https://ai.google.dev/api/file-search/file-search-stores)
- Join the [n8n community forum](https://community.n8n.io/)

---

**Last Updated**: 2024-11-24
**Node Version**: 1.0.0
**API Version**: v1beta
