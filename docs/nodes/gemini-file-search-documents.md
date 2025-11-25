# Gemini File Search Documents Node

## Overview

The **Gemini File Search Documents** node enables you to manage documents within File Search stores and query them using Google Gemini's AI models. This node supports uploading files, importing from the Files API, listing and deleting documents, and performing semantic search queries with Retrieval-Augmented Generation (RAG).

Use this node to build intelligent document search systems, knowledge bases, and AI-powered question-answering applications.

## Prerequisites

Before using this node, ensure you have:

- **Google Cloud Account**: Active Google Cloud account with billing enabled
- **Gemini API Key**: API key with File Search API access enabled
- **n8n Instance**: Self-hosted or cloud-based n8n instance (version 1.0.0 or higher)
- **File Search Store**: At least one store created using the [Gemini File Search Stores](./gemini-file-search-stores.md) node

## Credentials Setup

This node requires **Gemini API** credentials. See the [Store node credentials setup](./gemini-file-search-stores.md#credentials-setup) for detailed instructions.

## Operations

### Upload Document

Uploads a binary file directly to a File Search store. The file is automatically chunked, embedded, and indexed for semantic search.

#### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| Store | string | Yes | — | Resource name of the target store |
| Input Binary Field | string | Yes | `data` | Name of the binary property containing the file |
| Display Name | string | No | — | Human-readable name for the document |
| Custom Metadata | collection | No | — | Key-value metadata pairs (max 20) |
| Chunking Options | collection | No | — | Configuration for document chunking |
| Wait for Completion | boolean | No | true | Whether to wait for processing to complete |

#### Custom Metadata Structure

| Field | Type | Description |
|-------|------|-------------|
| Key | string | Metadata key (alphanumeric, hyphens, underscores) |
| Value Type | options | `string`, `number`, or `stringList` |
| Value | string | Single value (for string or number types) |
| Values | string | Comma-separated list (for stringList type) |

#### Chunking Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| Max Tokens Per Chunk | number | 200 | Maximum tokens in each chunk (50-1000) |
| Max Overlap Tokens | number | 20 | Overlapping tokens between chunks (0-200) |

#### Returns

**If `waitForCompletion=true`** (default):
Returns a completed operation object with the document details in `response`:

```json
{
  "name": "fileSearchStores/store-abc/operations/op-123",
  "done": true,
  "response": {
    "@type": "type.googleapis.com/google.ai.generativelanguage.v1beta.Document",
    "name": "fileSearchStores/store-abc/documents/doc-xyz",
    "displayName": "Annual Report 2024.pdf",
    "state": "STATE_ACTIVE",
    "sizeBytes": "5242880",
    "mimeType": "application/pdf",
    "createTime": "2025-11-24T10:30:00Z",
    "updateTime": "2025-11-24T10:30:15Z",
    "customMetadata": [
      {
        "key": "year",
        "numericValue": 2024
      },
      {
        "key": "department",
        "stringValue": "Finance"
      }
    ]
  }
}
```

**If `waitForCompletion=false`**:
Returns an operation object that you can poll using the Store node's "Get Operation Status":

```json
{
  "name": "fileSearchStores/store-abc/operations/op-123",
  "done": false,
  "metadata": {
    "@type": "type.googleapis.com/google.ai.generativelanguage.v1beta.UploadDocumentMetadata",
    "totalBytes": "5242880",
    "uploadedBytes": "2621440",
    "percentComplete": 50
  }
}
```

#### Example Workflow

**Input Binary Data:**
```
Binary file from HTTP Request, Read File, or other source
Property name: "data"
File: research-paper.pdf (2.5 MB)
```

**Node Configuration:**
```json
{
  "storeName": "fileSearchStores/research-papers-abc123",
  "binaryPropertyName": "data",
  "displayName": "Transformer Architecture Paper",
  "customMetadata": {
    "metadataValues": [
      {
        "key": "author",
        "valueType": "string",
        "value": "Vaswani et al."
      },
      {
        "key": "year",
        "valueType": "number",
        "value": "2017"
      },
      {
        "key": "topics",
        "valueType": "stringList",
        "values": "machine learning, NLP, attention mechanism"
      }
    ]
  },
  "chunkingOptions": {
    "maxTokensPerChunk": 300,
    "maxOverlapTokens": 30
  },
  "waitForCompletion": true
}
```

#### Supported File Types

| Format | MIME Type | Max Size |
|--------|-----------|----------|
| PDF | `application/pdf` | 100 MB |
| Plain Text | `text/plain` | 100 MB |
| HTML | `text/html` | 100 MB |
| Markdown | `text/markdown` | 100 MB |
| CSV | `text/csv` | 100 MB |
| Microsoft Word | `application/vnd.openxmlformats-officedocument.wordprocessingml.document` | 100 MB |
| Microsoft PowerPoint | `application/vnd.openxmlformats-officedocument.presentationml.presentation` | 100 MB |
| EPUB | `application/epub+zip` | 100 MB |

#### Use Cases

- Uploading documents from file system or HTTP requests
- Batch processing files from a directory
- Building document libraries with metadata
- Ingesting user-uploaded content

#### Notes

- Documents are processed asynchronously
- Large files (>10MB) may take several minutes to process
- Duplicate uploads create separate documents (no deduplication)
- Failed uploads can be retried safely

---

### Import Document

Imports a file from the Google Files API into a File Search store. Use this when you've already uploaded files using the standalone Files API.

#### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| Store | string | Yes | — | Resource name of the target store |
| File Name | string | Yes | — | Resource name of the file from Files API |
| Display Name | string | No | — | Human-readable name for the document |
| Custom Metadata | collection | No | — | Key-value metadata pairs (max 20) |
| Chunking Options | collection | No | — | Configuration for document chunking |
| Wait for Completion | boolean | No | true | Whether to wait for processing to complete |

#### Returns

Same structure as [Upload Document](#upload-document), but the operation type is "import" instead of "upload".

#### Example

**Input:**
```json
{
  "storeName": "fileSearchStores/legal-docs-abc123",
  "fileName": "files/xyz789",
  "displayName": "Contract Template v2.docx",
  "customMetadata": {
    "metadataValues": [
      {
        "key": "category",
        "valueType": "string",
        "value": "contract"
      },
      {
        "key": "version",
        "valueType": "number",
        "value": "2"
      }
    ]
  },
  "waitForCompletion": true
}
```

#### Use Cases

- Importing files previously uploaded to Files API
- Sharing files across multiple stores
- Separating file upload from store assignment
- Working with files managed by other systems

#### Notes

- Files API has separate quota and limits
- File must exist and be accessible with your API key
- Import is faster than re-uploading the same content
- Original file remains in Files API (not moved)

---

### List Documents

Lists all documents in a File Search store with optional pagination and client-side metadata filtering.

#### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| Store | string | Yes | — | Resource name of the store |
| Return All | boolean | No | false | Whether to return all documents |
| Limit | number | No | 10 | Maximum documents to return (1-20) |
| Metadata Filter | string | No | — | Client-side filter expression (see [List Metadata Filtering](#list-metadata-filtering)) |

#### Returns

An array of document objects:

```json
[
  {
    "name": "fileSearchStores/store-abc/documents/doc-123",
    "displayName": "Q4 Sales Report.pdf",
    "state": "STATE_ACTIVE",
    "sizeBytes": "1048576",
    "mimeType": "application/pdf",
    "createTime": "2025-11-20T10:00:00Z",
    "updateTime": "2025-11-20T10:00:30Z",
    "customMetadata": [
      {
        "key": "quarter",
        "stringValue": "Q4"
      },
      {
        "key": "year",
        "numericValue": 2024
      }
    ]
  },
  {
    "name": "fileSearchStores/store-abc/documents/doc-456",
    "displayName": "Product Roadmap 2025.pptx",
    "state": "STATE_PENDING",
    "sizeBytes": "3145728",
    "mimeType": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    "createTime": "2025-11-24T09:30:00Z",
    "updateTime": "2025-11-24T09:30:15Z"
  }
]
```

#### Document States

| State | Description |
|-------|-------------|
| `STATE_UNSPECIFIED` | Unknown state (rare) |
| `STATE_PENDING` | Document is being processed |
| `STATE_ACTIVE` | Document is ready for search |
| `STATE_FAILED` | Processing failed (check error details) |

#### List Metadata Filtering

The List operation supports **client-side** metadata filtering, allowing you to filter documents after retrieval. This is different from the Query operation which uses server-side filtering.

**Supported Operators:**

| Operator | Syntax | Description | Case Sensitive |
|----------|--------|-------------|----------------|
| Equals | `key="value"` | Exact string match | No |
| Contains | `key~"value"` | Substring match | No |
| Starts with | `key^="value"` | Prefix match | No |
| Ends with | `key$="value"` | Suffix match | No |
| Greater than | `key>number` | Numeric comparison | — |
| Greater or equal | `key>=number` | Numeric comparison | — |
| Less than | `key<number` | Numeric comparison | — |
| Less or equal | `key<=number` | Numeric comparison | — |
| Numeric equals | `key=number` | Numeric comparison | — |

**Logical Operators:**

| Operator | Description |
|----------|-------------|
| `AND` | Both conditions must match |
| `OR` | Either condition matches |
| `()` | Grouping for precedence |

**Examples:**

```
# Find documents containing "Latour" in filename (case-insensitive)
filename~"Latour"

# Find documents from 2024
filename~"2024"

# Find all PDF files
filename$=".pdf"

# Find documents starting with specific author
filename^="Acselrad"

# Combine with AND/OR
filename~"Actor-network" AND filename$=".pdf"

# Find documents by author OR year
filename~"Latour" OR filename~"2023"

# Complex expressions with parentheses
(filename~"Latour" OR filename~"Callon") AND filename$=".pdf"

# Combine string and numeric filters
filename~"report" AND year>=2020

# Multiple conditions
filename^="A" AND filename~"2024" AND filename$=".pdf"
```

**Note:** All string operators (`=`, `~`, `^=`, `$=`) are **case-insensitive** for convenience.

#### Use Cases

- Auditing documents in a store
- Finding documents by state (pending, failed, active)
- Building document management dashboards
- Verifying upload success
- Calculating storage usage
- **Filtering documents by filename patterns**
- **Finding documents by metadata values**

#### Notes

- Results ordered by creation time (newest first)
- Maximum 20 documents per page (API limit)
- "Return All" handles pagination automatically
- Metadata included in response
- **Metadata filtering is applied client-side after retrieval**
- **For server-side filtering, use the Query operation instead**

---

### Get Document

Retrieves detailed information about a specific document.

#### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| Document Name | string | Yes | — | Full resource name of the document |

#### Returns

A single document object with all fields as shown in [List Documents](#list-documents).

#### Example

**Input:**
```json
{
  "documentName": "fileSearchStores/research-abc/documents/paper-xyz"
}
```

**Output:**
```json
{
  "name": "fileSearchStores/research-abc/documents/paper-xyz",
  "displayName": "Attention Is All You Need.pdf",
  "state": "STATE_ACTIVE",
  "sizeBytes": "2097152",
  "mimeType": "application/pdf",
  "createTime": "2025-11-15T14:20:00Z",
  "updateTime": "2025-11-15T14:20:45Z",
  "customMetadata": [
    {
      "key": "author",
      "stringValue": "Vaswani et al."
    },
    {
      "key": "year",
      "numericValue": 2017
    },
    {
      "key": "citations",
      "numericValue": 89000
    }
  ]
}
```

#### Use Cases

- Checking document processing status
- Retrieving document metadata
- Verifying document exists before querying
- Getting document details for UI display

#### Error Handling

**Document Not Found:**
```json
{
  "error": {
    "code": 404,
    "message": "Document not found"
  }
}
```

---

### Delete Document

Permanently deletes a document from a File Search store.

#### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| Document Name | string | Yes | — | Full resource name of the document |
| Force | boolean | No | false | Delete even if chunks exist |

#### Returns

Empty object `{}` on successful deletion.

#### Example

**Input:**
```json
{
  "documentName": "fileSearchStores/store-abc/documents/old-doc-123",
  "force": true
}
```

**Output:**
```json
{}
```

#### Use Cases

- Removing outdated documents
- Cleaning up failed uploads
- Managing storage costs
- Implementing document lifecycle policies

#### Notes

> **Warning**: Deletion is **irreversible**. Document content and embeddings are permanently removed.

- Set `force=true` to delete documents with processed chunks
- Deletion is immediate but search indexes update asynchronously
- Deleted documents may appear in searches briefly (eventual consistency)
- Document names cannot be reused for 24-48 hours

---

### Query Documents

Performs semantic search across documents using a Gemini model. This is the core RAG (Retrieval-Augmented Generation) operation that enables AI-powered question answering.

#### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| Model | options | Yes | `gemini-2.5-flash` | Gemini model to use for query |
| System Prompt | string | No | — | Instructions to guide the AI model response |
| Query | string | Yes | — | Natural language question or search query |
| Store Names | string | Yes | — | Comma-separated list of store names to search |
| Metadata Filter | string | No | — | Filter expression in AIP-160 format |
| Include Source Metadata | boolean | No | false | Fetch full document metadata for cited sources |

#### Available Models

| Model | Description | Best For |
|-------|-------------|----------|
| `gemini-2.5-flash` | Fast, efficient model | Quick queries, high throughput |
| `gemini-2.5-pro` | Advanced reasoning | Complex questions, detailed analysis |
| `gemini-3-pro-preview` | Latest preview | Cutting-edge capabilities (experimental) |

#### Returns

A response object containing the AI-generated answer with cited sources:

```json
{
  "candidates": [
    {
      "content": {
        "parts": [
          {
            "text": "Based on the documents, transformer models use self-attention mechanisms..."
          }
        ],
        "role": "model"
      },
      "finishReason": "STOP",
      "groundingMetadata": {
        "groundingChunks": [
          {
            "retrievedContext": {
              "title": "Attention Is All You Need.pdf",
              "text": "The dominant sequence transduction models are based on complex...",
              "fileSearchStore": "fileSearchStores/research-abc"
            }
          }
        ],
        "groundingSupports": [
          {
            "segment": {
              "startIndex": 0,
              "endIndex": 150,
              "text": "Based on the documents, transformer models use self-attention mechanisms..."
            },
            "groundingChunkIndices": [0],
            "confidenceScores": [0.95]
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

#### Include Source Metadata

When **Include Source Metadata** is enabled, each grounding chunk includes full document details:

```json
{
  "groundingChunks": [
    {
      "retrievedContext": {
        "title": "Attention Is All You Need.pdf",
        "text": "The dominant sequence transduction models...",
        "fileSearchStore": "fileSearchStores/research-abc",
        "documentMetadata": {
          "name": "fileSearchStores/research-abc/documents/paper-xyz",
          "displayName": "Attention Is All You Need.pdf",
          "customMetadata": [
            { "key": "author", "stringValue": "Vaswani et al." },
            { "key": "year", "numericValue": 2017 }
          ],
          "state": "STATE_ACTIVE",
          "mimeType": "application/pdf",
          "sizeBytes": "2097152",
          "createTime": "2025-11-15T14:20:00Z",
          "updateTime": "2025-11-15T14:20:45Z"
        }
      }
    }
  ]
}
```

> **Note**: Enabling this option adds one API call per unique source document to fetch its metadata. This is useful when you need to access custom metadata (author, category, version, etc.) from cited sources.

#### Example Query

**Input:**
```json
{
  "model": "gemini-2.5-flash",
  "query": "What are the main advantages of transformer models over RNNs?",
  "storeNames": "fileSearchStores/research-papers-abc,fileSearchStores/ml-docs-xyz",
  "metadataFilter": "year >= 2017 AND topics:machine-learning"
}
```

#### Query Metadata Filtering (Server-Side)

The Query operation uses **server-side** metadata filtering via Google's AIP-160 format. Filters are applied by the API before documents are retrieved for the AI model.

> **Note:** This is different from the [List operation's client-side filtering](#list-metadata-filtering), which supports additional operators like contains (`~`), starts with (`^=`), and ends with (`$=`).

Use AIP-160 format to filter documents by metadata before querying:

**Syntax:**

```
key operator value [AND/OR key operator value ...]
```

**Operators:**

| Operator | Types | Example |
|----------|-------|---------|
| `=` | string, number | `author = "John Doe"` |
| `!=` | string, number | `status != "draft"` |
| `>` | number | `year > 2020` |
| `>=` | number | `version >= 2` |
| `<` | number | `priority < 5` |
| `<=` | number | `score <= 100` |
| `:` | string, stringList | `topics:machine-learning` |

**Logical Operators:**
- `AND`: All conditions must be true
- `OR`: At least one condition must be true
- Use parentheses for complex expressions: `(A AND B) OR C`

**Examples:**

```
Basic equality:
author = "Jane Smith"

Numeric comparison:
year >= 2023 AND citations > 1000

String list contains:
topics:nlp OR topics:computer-vision

Complex filter:
(department = "Engineering" AND year = 2024) OR (priority >= 8 AND status = "active")

Multiple conditions:
author = "John Doe" AND year >= 2020 AND topics:machine-learning
```

**String Quoting Rules:**
- Use double quotes for strings with spaces: `title = "Annual Report"`
- No quotes needed for single words: `status = active`
- Keys never need quotes: `myKey = value`

#### Use Cases

1. **Customer Support Chatbot**
   ```
   Query: "How do I reset my password?"
   Store: customer-support-docs
   Filter: category = "authentication"
   ```

2. **Research Assistant**
   ```
   Query: "Summarize recent findings about climate change impacts"
   Store: research-papers
   Filter: year >= 2023 AND topics:climate-science
   ```

3. **Legal Document Search**
   ```
   Query: "Find clauses related to data privacy"
   Store: legal-contracts
   Filter: type = "contract" AND jurisdiction = "EU"
   ```

4. **Product Documentation**
   ```
   Query: "How to configure SSL certificates?"
   Store: product-docs
   Filter: product = "api-gateway" AND version >= 2.0
   ```

#### Query Best Practices

1. **Be Specific**: Clear, detailed questions get better answers
   - ❌ "Tell me about AI"
   - ✅ "What are the main challenges in training large language models?"

2. **Use Context**: Include relevant details in your query
   - ❌ "How does it work?"
   - ✅ "How does the authentication flow work in OAuth 2.0?"

3. **Filter Effectively**: Narrow down the search space with metadata
   - Faster queries
   - More relevant results
   - Lower token usage

4. **Choose the Right Model**:
   - Use `gemini-2.5-flash` for quick lookups (95% of use cases)
   - Use `gemini-2.5-pro` for complex analysis or multi-step reasoning
   - Preview models for experimental features

5. **Handle Multiple Stores**: Search across related stores simultaneously
   ```
   "fileSearchStores/store-1,fileSearchStores/store-2,fileSearchStores/store-3"
   ```

#### Token Usage & Costs

Query operations consume tokens based on:
- Query length (input tokens)
- Retrieved document chunks (input tokens)
- Generated response (output tokens)

**Approximate Costs** (as of Nov 2024):
- **gemini-2.5-flash**: $0.075 per 1M input tokens, $0.30 per 1M output tokens
- **gemini-2.5-pro**: $1.25 per 1M input tokens, $5.00 per 1M output tokens

**Optimization Tips**:
- Use metadata filters to reduce retrieved chunks
- Keep queries concise but clear
- Use Flash model for most queries
- Batch related questions when possible

---

### Replace Upload

Uploads a new document and optionally deletes existing document(s) based on matching criteria. This is a workaround for the Google API limitation that doesn't support direct document updates.

#### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| Store | string | Yes | — | Resource name of the target store |
| Input Binary Field | string | Yes | `data` | Name of the binary property containing the file |
| Display Name | string | Yes | — | Display name for the new document |
| Delete Old Document By | options | No | `none` | How to find old document(s) to delete |
| Old Document Filename | string | Conditional | — | Filename to match (when using Custom Filename) |
| Metadata Key | string | Conditional | — | Metadata key to match (when using Metadata) |
| Metadata Value | string | Conditional | — | Metadata value to match (when using Metadata) |
| Delete All Matches | boolean | No | false | Delete all matching documents (metadata only) |
| Preserve Old Document Metadata | boolean | No | false | Copy metadata from old document |
| Metadata Merge Strategy | options | Conditional | `preferNew` | How to merge old and new metadata |
| Custom Metadata | collection | No | — | New metadata key-value pairs |
| Chunking Options | collection | No | — | Configuration for document chunking |
| Force Delete | boolean | No | true | Force delete even if chunks exist |
| Wait for Completion | boolean | No | true | Wait for upload to complete |

#### Delete Old Document By Options

| Option | Description |
|--------|-------------|
| `None (Upload Only)` | Just upload without deleting any existing documents |
| `Display Name` | Find and delete documents matching the Display Name field |
| `Custom Filename` | Find and delete documents matching a different filename |
| `Metadata Key-Value` | Find and delete documents by specific metadata (can match multiple) |

#### Metadata Merge Strategies

When **Preserve Old Document Metadata** is enabled:

| Strategy | Description |
|----------|-------------|
| `Prefer New` | New metadata values override old values for same keys |
| `Prefer Old` | Old metadata kept, new values only fill gaps |
| `Merge All` | All unique keys from both old and new are included |
| `Use Old Only` | Only use old metadata, ignore new metadata |

#### Returns

A comprehensive result object:

```json
{
  "upload": {
    "name": "fileSearchStores/store-abc/operations/op-123",
    "done": true,
    "response": {
      "name": "fileSearchStores/store-abc/documents/new-doc-xyz",
      "displayName": "Report v2.pdf",
      "state": "STATE_ACTIVE"
    }
  },
  "deletedDocuments": {
    "matchBy": "displayName",
    "matchCriteria": "Report v2.pdf",
    "totalFound": 1,
    "totalDeleted": 1,
    "deleteAllMatches": false,
    "documents": [
      {
        "name": "fileSearchStores/store-abc/documents/old-doc-123",
        "displayName": "Report v2.pdf",
        "deleted": true
      }
    ]
  },
  "metadata": {
    "preserved": true,
    "sourceDocument": "fileSearchStores/store-abc/documents/old-doc-123",
    "strategy": "preferNew",
    "oldMetadataCount": 3,
    "newMetadataCount": 2,
    "finalMetadataCount": 4
  }
}
```

#### Example: Replace by Display Name

```json
{
  "storeName": "fileSearchStores/docs-store",
  "binaryPropertyName": "data",
  "displayName": "API Documentation v2.pdf",
  "matchBy": "displayName",
  "preserveMetadata": true,
  "metadataMergeStrategy": "preferNew",
  "customMetadata": {
    "metadataValues": [
      { "key": "version", "valueType": "number", "value": "2" }
    ]
  }
}
```

#### Example: Replace by Metadata

```json
{
  "storeName": "fileSearchStores/docs-store",
  "binaryPropertyName": "data",
  "displayName": "Monthly Report November.pdf",
  "matchBy": "metadata",
  "matchMetadataKey": "reportId",
  "matchMetadataValue": "monthly-2024-11",
  "deleteAllMatches": false,
  "preserveMetadata": true,
  "metadataMergeStrategy": "mergeAll"
}
```

#### Use Cases

1. **Version Updates**: Replace old document versions with new ones
2. **Content Refresh**: Update documents while preserving metadata
3. **Atomic Updates**: Delete-then-upload in a single operation
4. **Metadata Migration**: Merge old metadata with new during updates

#### Notes

- Delete happens **before** upload (ensures old document is removed first)
- If delete fails, upload still proceeds (errors logged in response)
- Metadata from first matched document is used when multiple match
- Maximum 20 metadata items after merge (validation enforced)

---

## Chunking Configuration Guide

Chunking is the process of splitting documents into smaller pieces for embedding and retrieval. Proper chunking is crucial for search quality.

### How Chunking Works

1. **Document Split**: Text is divided into chunks based on token count
2. **Overlap**: Chunks share tokens to preserve context across boundaries
3. **Embedding**: Each chunk is converted to a vector embedding
4. **Indexing**: Embeddings are stored for fast semantic search

### Configuration Options

#### Max Tokens Per Chunk

Controls the size of each chunk.

- **Default**: 200 tokens (~150 words)
- **Range**: 50-1000 tokens
- **Recommendations**:
  - **50-150**: Short, precise answers (FAQs, glossaries)
  - **150-300**: Balanced (most use cases)
  - **300-500**: Longer context (articles, reports)
  - **500-1000**: Maximum context (academic papers, legal docs)

**Trade-offs**:
- Smaller chunks: More precise, less context
- Larger chunks: More context, less precision

#### Max Overlap Tokens

Controls how much chunks overlap.

- **Default**: 20 tokens (~15 words)
- **Range**: 0-200 tokens
- **Recommendations**:
  - **0**: No overlap (fast indexing, may miss context)
  - **10-30**: Light overlap (recommended for most cases)
  - **30-100**: Heavy overlap (when context is critical)
  - **100-200**: Maximum overlap (specialized use cases)

**Trade-offs**:
- More overlap: Better context preservation, more storage, slower indexing
- Less overlap: Faster processing, less storage, may split important content

### Chunking Strategies by Document Type

| Document Type | Max Tokens | Max Overlap | Reasoning |
|---------------|------------|-------------|-----------|
| FAQs | 100 | 10 | Short, self-contained Q&A pairs |
| Product Docs | 250 | 25 | Balanced for code examples and explanations |
| Research Papers | 400 | 40 | Preserve academic context and citations |
| Legal Contracts | 500 | 50 | Maintain clause relationships |
| News Articles | 300 | 30 | Keep story flow intact |
| Code Documentation | 200 | 20 | Balance between functions and context |
| Meeting Transcripts | 300 | 50 | Capture conversational flow |

### Testing Your Configuration

1. **Upload Sample Document** with default settings
2. **Query** with typical questions
3. **Evaluate** answer quality and relevance
4. **Adjust** chunk size based on results:
   - Answers too vague → Increase chunk size
   - Answers include irrelevant info → Decrease chunk size
   - Missing context across boundaries → Increase overlap
5. **Iterate** until results are satisfactory

### Example Configurations

**Customer Support FAQs:**
```json
{
  "maxTokensPerChunk": 100,
  "maxOverlapTokens": 10
}
```

**Technical Documentation:**
```json
{
  "maxTokensPerChunk": 250,
  "maxOverlapTokens": 25
}
```

**Legal Contracts:**
```json
{
  "maxTokensPerChunk": 500,
  "maxOverlapTokens": 50
}
```

---

## Common Use Cases

### 1. Building a Knowledge Base

Create a searchable knowledge base from company documents:

```
Step 1: Create Store (Stores node)
  displayName: "Company Knowledge Base"

Step 2: Upload Documents (Documents node - batch)
  - Loop through directory of files
  - Upload each with metadata (department, category)
  - Wait for completion

Step 3: Query Store (Documents node)
  - Accept user questions via webhook
  - Query with metadata filters
  - Return AI-generated answers
```

### 2. Document Q&A Chatbot

Build an AI chatbot that answers questions from your documents:

```
Workflow:
1. Webhook receives user question
2. Query Documents node:
   - model: gemini-2.5-flash
   - query: {{$json.question}}
   - storeNames: your-docs-store
3. Extract answer from response.candidates[0].content.parts[0].text
4. Return to user via Webhook Response
```

### 3. Content Management System

Manage and search documents with metadata:

```
Upload with Metadata:
- Upload Document with:
  - displayName: "{{$json.fileName}}"
  - customMetadata:
    - author: "{{$json.author}}"
    - category: "{{$json.category}}"
    - publishDate: "{{$json.date}}"

Search by Metadata:
- Query Documents with:
  - metadataFilter: "author = '{{$json.authorName}}' AND category = '{{$json.cat}}'"
```

### 4. Research Assistant

Search across multiple document stores:

```
Query Configuration:
- model: gemini-2.5-pro (for complex analysis)
- query: "Compare methodologies used in recent studies"
- storeNames: "store-1,store-2,store-3"
- metadataFilter: "year >= 2023 AND docType = 'research-paper'"
```

---

## Troubleshooting

### Issue: "File size exceeds limit"

**Cause**: File is larger than 100 MB

**Solution**:
1. Compress or optimize the file (especially PDFs)
2. Split large files into smaller parts
3. Use cloud storage and provide file URL instead
4. Contact Google for enterprise quotas (>100MB limit)

---

### Issue: "Unsupported file format"

**Cause**: File MIME type not supported

**Solution**:
1. Check [supported file types](#supported-file-types)
2. Convert file to supported format (e.g., PDF, DOCX)
3. Extract text and upload as .txt or .md
4. Use third-party conversion tools

**Note**: Verify MIME type is correct (some files have wrong extensions)

---

### Issue: Document stuck in "STATE_PENDING"

**Cause**: Processing taking longer than expected or failed

**Solution**:
1. Wait 5-10 minutes for large files
2. Use Get Operation Status to check progress
3. If pending > 30 minutes, likely failed:
   - Check file format is valid
   - Verify file isn't corrupted
   - Try re-uploading with smaller file
4. Delete and re-upload if necessary

---

### Issue: Query returns irrelevant results

**Cause**: Poor chunking configuration or vague query

**Solution**:
1. **Improve Query**:
   - Be more specific and detailed
   - Include context and keywords
   - Use metadata filters

2. **Adjust Chunking**:
   - Increase chunk size for more context
   - Increase overlap to preserve relationships
   - Re-upload documents with new settings

3. **Filter by Metadata**:
   - Narrow search to relevant documents
   - Use date ranges, categories, authors

4. **Use Better Model**:
   - Switch to `gemini-2.5-pro` for complex queries

---

### Issue: "Metadata validation failed"

**Cause**: Invalid metadata format or values

**Solution**:
1. **Check Key Format**:
   - Use only letters, numbers, hyphens, underscores
   - No spaces or special characters
   - Example: `doc-category` not `doc category!`

2. **Check Value Types**:
   - String: Any text value
   - Number: Must be valid number (integer or float)
   - StringList: Comma-separated values

3. **Check Limits**:
   - Maximum 20 metadata entries per document
   - Keys: max 128 characters
   - String values: max 1024 characters
   - StringList: max 20 values per list

---

### Issue: Operation timeout

**Cause**: Large file upload or slow processing

**Solution**:
1. Set `waitForCompletion=false`
2. Extract `operation.name` from response
3. Poll with Get Operation Status (Store node)
4. Implement retry logic with exponential backoff
5. Increase workflow timeout in n8n settings

---

## Best Practices

### Upload Operations

1. **Always Add Metadata**
   - Makes documents searchable and filterable
   - Include: author, date, category, type, version
   - Plan metadata schema before bulk uploads

2. **Use Meaningful Display Names**
   - Include date: "Q4 Report 2024-11-20"
   - Include version: "API Docs v2.1"
   - Include category: "[Legal] Contract Template"

3. **Configure Chunking Thoughtfully**
   - Start with defaults (200/20)
   - Test with sample documents
   - Adjust based on query results
   - Document your settings

4. **Handle Large Files**
   - Use `waitForCompletion=false` for files >10MB
   - Implement polling logic
   - Consider splitting very large files (>50MB)

5. **Implement Error Handling**
   - Catch upload failures
   - Retry with exponential backoff
   - Log failed uploads for review
   - Alert on persistent failures

### Query Operations

1. **Write Clear Queries**
   - Be specific and detailed
   - Include context and constraints
   - Use complete sentences
   - Avoid ambiguous terms

2. **Use Metadata Filters**
   - Narrow search scope
   - Improve relevance
   - Reduce token usage
   - Speed up queries

3. **Choose the Right Model**
   - Flash: Default for 95% of queries
   - Pro: Complex reasoning, detailed analysis
   - Preview: Experimental features only

4. **Parse Responses Properly**
   - Extract text from `candidates[0].content.parts[0].text`
   - Check `finishReason` for completeness
   - Use `groundingMetadata` for source citations
   - Monitor `usageMetadata` for costs

5. **Implement Caching**
   - Cache frequent queries
   - Use n8n's cache node
   - Set reasonable TTL (time-to-live)
   - Invalidate on document updates

### Metadata Design

1. **Plan Your Schema**
   - Document all metadata keys
   - Define value types clearly
   - Use consistent naming conventions
   - Share schema across team

2. **Use Hierarchical Categories**
   ```
   category: "engineering"
   subcategory: "backend"
   team: "platform"
   ```

3. **Include Temporal Data**
   ```
   year: 2024
   quarter: "Q4"
   publishDate: "2024-11-24"
   ```

4. **Enable Multi-Dimensional Filtering**
   ```
   author: "Jane Smith"
   topics: ["AI", "ML", "NLP"]  // stringList
   priority: 8  // numeric
   status: "published"
   ```

### Performance Optimization

1. **Batch Operations**
   - Upload multiple documents in parallel (use n8n's SplitInBatches)
   - Set reasonable batch size (5-10 concurrent uploads)
   - Implement rate limiting to avoid API throttling

2. **Minimize Token Usage**
   - Use metadata filters to reduce retrieved chunks
   - Keep queries concise
   - Use Flash model for simple queries
   - Cache frequent queries

3. **Monitor Costs**
   - Track `usageMetadata.totalTokenCount`
   - Set up cost alerts
   - Review expensive queries
   - Optimize filters and chunking

4. **Optimize Chunking**
   - Smaller chunks = faster indexing
   - Test different configurations
   - Balance precision vs. context
   - Re-chunk only when necessary

---

## Related Resources

- **[Gemini File Search Stores Node](./gemini-file-search-stores.md)**: Manage File Search stores
- **[Getting Started Guide](../GETTING_STARTED.md)**: Complete setup walkthrough
- **[API Reference](../API.md)**: Detailed API documentation
- **[Google Gemini File Search API](https://ai.google.dev/gemini-api/docs/file-search)**: Official documentation
- **[AIP-160 Filtering](https://google.aip.dev/160)**: Metadata filter syntax reference

---

## Support

**Issues or Questions?**
- Check the [troubleshooting section](#troubleshooting) above
- Review [common use cases](#common-use-cases)
- Consult [Google's API documentation](https://ai.google.dev/api/file-search/documents)
- Join the [n8n community forum](https://community.n8n.io/)

---

**Last Updated**: 2025-11-25
**Node Version**: 1.0.0
**API Version**: v1beta
