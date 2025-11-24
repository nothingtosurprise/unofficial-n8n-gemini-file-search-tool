# Troubleshooting Guide

This guide helps you diagnose and resolve common issues when using the n8n Gemini File Search Tool nodes.

## Table of Contents

1. [Authentication Issues](#authentication-issues)
2. [Upload Issues](#upload-issues)
3. [Query Issues](#query-issues)
4. [Store Management Issues](#store-management-issues)
5. [Metadata Issues](#metadata-issues)
6. [Network and API Issues](#network-and-api-issues)
7. [n8n Integration Issues](#n8n-integration-issues)
8. [Performance Issues](#performance-issues)
9. [Data Issues](#data-issues)
10. [Debugging Tips](#debugging-tips)
11. [Common Patterns and Solutions](#common-patterns-and-solutions)
12. [Getting Help](#getting-help)

---

## Authentication Issues

### Error: 401 Unauthorized

**Cause:** Invalid, expired, or missing API key

**Solution:**
1. Verify your API key in the n8n credentials panel
2. Go to [Google AI Studio](https://aistudio.google.com/app/apikey) and check if your key is still valid
3. Ensure the Generative Language API is enabled in your Google Cloud project
4. Try regenerating the API key if it appears valid but still fails
5. Check that you're not using an API key from a different Google Cloud project

**Example:**
```json
{
  "error": {
    "code": 401,
    "message": "API key not valid. Please pass a valid API key.",
    "status": "UNAUTHENTICATED"
  }
}
```

**Prevention:**
- Store API keys securely in n8n credentials
- Regularly rotate API keys as part of security best practices
- Monitor API key usage in Google Cloud Console

**Related Issues:**
- [Error: API key not found](#error-api-key-not-found)
- [Error: Invalid credential format](#error-invalid-credential-format)

---

### Error: 403 Forbidden

**Cause:** Insufficient permissions, quota exceeded, or billing issues

**Solution:**

**For Quota Issues:**
1. Check your API quotas in [Google Cloud Console](https://console.cloud.google.com/apis/api/generativelanguage.googleapis.com/quotas)
2. Review current usage vs. limits
3. Request a quota increase if needed
4. Monitor usage patterns to avoid hitting limits

**For Billing Issues:**
1. Verify billing is enabled for your Google Cloud project
2. Check that your payment method is valid and up-to-date
3. Review any spending limits that may have been reached

**For Permission Issues:**
1. Ensure the API key has the necessary permissions
2. Check IAM roles in Google Cloud Console
3. Verify the Generative Language API is enabled

**Example:**
```json
{
  "error": {
    "code": 403,
    "message": "The caller does not have permission",
    "status": "PERMISSION_DENIED"
  }
}
```

**Prevention:**
- Set up billing alerts in Google Cloud Console
- Monitor quota usage regularly
- Use proper IAM roles and permissions from the start

**Related Issues:**
- [Rate limiting (429 errors)](#error-429-too-many-requests)

---

### Error: API key not found

**Cause:** API key credential not configured in n8n

**Solution:**
1. Go to **Credentials** section in n8n
2. Create a new **Gemini API** credential
3. Enter your API key from [Google AI Studio](https://aistudio.google.com/app/apikey)
4. Test the credential using the built-in test function
5. Ensure the credential is selected in your node configuration

**Prevention:**
- Always configure credentials before using the nodes
- Use credential test feature to verify setup

---

### Error: Invalid credential format

**Cause:** Credential data is malformed or corrupted

**Solution:**
1. Delete the existing credential
2. Create a new credential from scratch
3. Ensure you're copying the entire API key without extra spaces
4. Test the credential immediately after creation

**Prevention:**
- Copy API keys carefully without leading/trailing spaces
- Don't manually edit credential data

---

## Upload Issues

### Error: File size exceeds 100MB

**Cause:** File is larger than the Gemini API's 100MB limit

**Solution:**
1. **Split large files:**
   ```javascript
   // In n8n Code node, split PDF into pages
   // Or split text files into smaller chunks
   ```
2. **Compress files** (if applicable):
   - Use compression for text-based files
   - Optimize images before upload
3. **Summarize content** before uploading if the full file isn't necessary
4. **Use external chunking services** to break down large documents

**Example Error:**
```
File size (152.34MB) exceeds maximum of 100MB
```

**Prevention:**
- Check file sizes before uploading
- Implement file size validation in your workflows
- Consider splitting large documents at the source

**Related Issues:**
- [Upload timeout](#error-upload-timeout)
- [High memory usage](#high-memory-usage)

---

### Error: Invalid MIME type

**Cause:** File type is not supported by the Gemini API

**Solution:**
1. Check [supported MIME types](https://ai.google.dev/gemini-api/docs/file-search#supported-file-formats)
2. Convert files to supported formats:
   - Text: `text/plain`, `text/html`, `text/csv`
   - Documents: `application/pdf`, `application/msword`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
   - Spreadsheets: `application/vnd.ms-excel`, `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
   - Code: Various text-based code formats
3. Ensure binary data has the correct MIME type set

**Example:**
```typescript
// In n8n, ensure binary data has correct MIME type
{
  data: binaryData,
  mimeType: 'application/pdf',
  fileName: 'document.pdf'
}
```

**Prevention:**
- Validate file types before upload
- Set explicit MIME types when creating binary data
- Use n8n's file type detection features

---

### Error: Upload timeout

**Cause:** Upload taking longer than 10 minutes (API timeout limit)

**Solution:**

**Immediate Fix:**
1. Reduce file size if possible
2. Check your network connection speed
3. Try uploading during off-peak hours
4. Use **Wait for Completion = false** and poll status manually

**Manual Polling Workflow:**
```
1. Upload Document Node (Wait for Completion = false)
   ↓ Returns operation name
2. Wait Node (5-10 seconds)
   ↓
3. Get Operation Status Node (in Stores node)
   ↓ Check if operation.done = true
4. Loop until complete or timeout
```

**Network Optimization:**
1. Ensure stable internet connection
2. Check firewall/proxy settings aren't throttling uploads
3. Test upload speed to Google services

**Prevention:**
- Monitor upload times for different file sizes
- Set realistic timeout expectations
- Implement retry logic for failed uploads

**Related Issues:**
- [File size exceeds 100MB](#error-file-size-exceeds-100mb)
- [Connection timeouts](#connection-timeouts)

---

### Error: Resumable upload failed

**Cause:** Upload session was interrupted or expired

**Solution:**
1. Retry the upload from the beginning
2. Check network stability
3. Reduce file size if consistently failing
4. Ensure upload completes within the session timeout

**Technical Details:**
```typescript
// The resumable upload process:
// 1. Start upload session (gets upload URL)
// 2. Upload file data to session URL
// 3. Finalize upload

// If step 2 fails, the entire upload must restart
```

**Prevention:**
- Maintain stable network connection during uploads
- Monitor upload progress if possible
- Implement upload verification

---

### Error: 503 Service Unavailable

**Cause:** Gemini API temporarily unavailable

**Solution:**
1. **Immediate:** Wait 30-60 seconds and retry
2. **Implement exponential backoff:**
   - 1st retry: wait 1 second
   - 2nd retry: wait 2 seconds
   - 3rd retry: wait 4 seconds
   - Continue doubling until max (e.g., 64 seconds)
3. Check [Google Cloud Status Dashboard](https://status.cloud.google.com/)
4. If persistent, report to Google Cloud Support

**Example Retry Logic:**
```javascript
// In n8n Code node
let retries = 0;
const maxRetries = 5;

while (retries < maxRetries) {
  try {
    // Upload attempt
    break;
  } catch (error) {
    if (error.statusCode === 503) {
      retries++;
      await sleep(Math.pow(2, retries) * 1000);
    } else {
      throw error;
    }
  }
}
```

**Prevention:**
- Implement automatic retry logic
- Monitor Google Cloud status
- Have fallback workflows for critical operations

---

### Documents stuck in STATE_PENDING

**Cause:** Document processing taking longer than expected, or processing failed silently

**Solution:**

**Check Document Status:**
1. Use **Get Document** operation to check current state
2. Look at the `state` field:
   - `STATE_PENDING`: Still processing
   - `STATE_ACTIVE`: Ready to use
   - `STATE_FAILED`: Processing failed

**If stuck for >5 minutes:**
1. Use **Get Operation Status** to check the upload operation
2. Look for error details in the operation response
3. If operation shows error, delete and re-upload the document
4. If no error but still pending, wait up to 30 minutes for large documents

**Example:**
```json
// Check document state
{
  "name": "fileSearchStores/store-1/documents/doc-123",
  "state": "STATE_PENDING",
  "createTime": "2025-11-24T10:00:00Z"
}

// If stuck >30 minutes, delete and retry
```

**Prevention:**
- Monitor document state after upload
- Set up alerts for documents stuck in STATE_PENDING
- Keep track of upload times for different file types/sizes

**Related Issues:**
- [Documents in STATE_FAILED](#documents-in-state_failed)
- [Upload timeout](#error-upload-timeout)

---

### Documents in STATE_FAILED

**Cause:** Document processing encountered an error

**Solution:**

**Diagnose the Issue:**
1. Use **Get Operation Status** to see error details
2. Common failure reasons:
   - Corrupted file
   - Unsupported content within supported format
   - Invalid metadata
   - Processing timeout (very large files)

**Fix and Retry:**
1. Delete the failed document using **Delete Document** with `force=true`
2. If file corruption suspected:
   - Re-download or regenerate the source file
   - Verify file integrity
   - Try opening/validating the file locally
3. If metadata issue:
   - Simplify or remove custom metadata
   - Validate metadata format
4. If processing timeout:
   - Split the document into smaller parts
   - Simplify document structure if possible

**Example Error Response:**
```json
{
  "error": {
    "code": 3,
    "message": "Document processing failed: Invalid PDF structure"
  }
}
```

**Prevention:**
- Validate files before upload
- Test upload with small sample first
- Monitor upload operations for failures
- Keep metadata simple initially

---

## Query Issues

### Empty or irrelevant results

**Cause:** Documents not indexed, poor query formulation, or mismatched metadata filters

**Solution:**

**Verify Documents are Ready:**
1. List documents in the store using **List Documents**
2. Check that documents are in `STATE_ACTIVE`
3. Verify `activeDocumentsCount` > 0 in store details

**Improve Query Quality:**
1. **Be more specific:**
   - ❌ "info"
   - ✅ "What are the quarterly revenue figures for Q4 2024?"

2. **Use keywords from your documents:**
   - Include domain-specific terms
   - Reference exact phrases when possible

3. **Try different query formulations:**
   - Ask questions in different ways
   - Break complex queries into simpler ones

**Check Metadata Filters:**
1. Verify metadata filter syntax is correct (AIP-160 format)
2. Ensure metadata keys match exactly (case-sensitive)
3. Test query without filters first, then add filters

**Example:**
```javascript
// Poor query
"information about sales"

// Better query
"What were the total sales figures for the North America region in Q4 2024?"

// With metadata filter
"What were the sales figures?"
// Filter: customMetadata.region.stringValue = "North America"
```

**Prevention:**
- Verify documents are active before querying
- Test queries with known document content
- Start broad, then narrow with filters
- Keep metadata filters simple initially

**Related Issues:**
- [Documents not indexed](#documents-stuck-in-state_pending)
- [Metadata filter syntax errors](#metadata-filter-syntax-errors)

---

### Query timeout

**Cause:** Query taking longer than expected, usually with large document sets

**Solution:**

**Reduce Scope:**
1. **Use metadata filters** to narrow document set:
   ```
   customMetadata.date.stringValue > "2024-01-01"
   ```
2. **Query specific stores** instead of multiple stores
3. **Split into smaller queries** and combine results

**Optimize Store:**
1. Check store size - very large stores (>1000 documents) may be slow
2. Consider splitting into multiple topic-specific stores
3. Remove inactive or irrelevant documents

**Adjust Model:**
1. Try using `gemini-2.5-flash` instead of `gemini-2.5-pro` for faster responses
2. Balance speed vs. quality needs

**Prevention:**
- Keep stores focused and appropriately sized
- Use metadata to organize documents for filtering
- Monitor query performance patterns

**Related Issues:**
- [Performance issues with large stores](#performance-issues-with-large-stores)

---

### Metadata filter syntax errors

**Cause:** Invalid AIP-160 filter expression format

**Solution:**

**Common Syntax Errors:**

1. **Unbalanced quotes:**
   ```
   ❌ customMetadata.author.stringValue = "John Doe
   ✅ customMetadata.author.stringValue = "John Doe"
   ```

2. **Unbalanced parentheses:**
   ```
   ❌ (customMetadata.year.numericValue > 2020 AND customMetadata.type.stringValue = "report"
   ✅ (customMetadata.year.numericValue > 2020 AND customMetadata.type.stringValue = "report")
   ```

3. **Invalid operators:**
   ```
   ❌ customMetadata.year.numericValue == 2024
   ✅ customMetadata.year.numericValue = 2024
   ```

4. **String vs. numeric comparisons:**
   ```
   ❌ customMetadata.year.stringValue > 2020
   ✅ customMetadata.year.numericValue > 2020
   ```

**Validation Tips:**
```javascript
// The nodes validate your filter before sending:
// - Checks for balanced quotes
// - Checks for balanced parentheses
// - Basic syntax validation

// Test complex filters incrementally:
// 1. Start simple: customMetadata.type.stringValue = "report"
// 2. Add conditions: ... AND customMetadata.year.numericValue > 2020
// 3. Add complexity: (filter1) OR (filter2)
```

**Common Patterns:**
```
// Simple equality
customMetadata.category.stringValue = "sales"

// Numeric comparison
customMetadata.year.numericValue >= 2024

// Multiple conditions with AND
customMetadata.region.stringValue = "EMEA" AND customMetadata.year.numericValue = 2024

// Multiple conditions with OR
(customMetadata.type.stringValue = "report") OR (customMetadata.type.stringValue = "analysis")

// Complex nested
(customMetadata.region.stringValue = "NA" OR customMetadata.region.stringValue = "EMEA") AND customMetadata.year.numericValue >= 2024
```

**Prevention:**
- Test filters with simple conditions first
- Build complex filters incrementally
- Use parentheses to group conditions clearly
- Validate filter syntax before running queries

**Related Issues:**
- [AIP-160 syntax errors](#aip-160-syntax-errors)
- [Unbalanced quotes/parentheses](#error-unbalanced-quotesparentheses)

---

### Model not available

**Cause:** Specified model doesn't exist or isn't accessible

**Solution:**

**Verify Model Name:**
Current supported models:
- `gemini-2.5-flash` (faster, good for most queries)
- `gemini-2.5-pro` (more capable, slower)

**Check Model Format:**
```
❌ gemini-flash
❌ gemini-pro
❌ gemini-2.0-flash
✅ gemini-2.5-flash
✅ gemini-2.5-pro
```

**Regional Availability:**
1. Some models may not be available in all regions
2. Check [Gemini API documentation](https://ai.google.dev/gemini-api/docs/models) for current model availability
3. Try alternative models if your preferred one is unavailable

**Prevention:**
- Use model names from the dropdown in n8n (don't type manually)
- Stay updated on model deprecations and new releases
- Have fallback model logic in critical workflows

---

### Grounding metadata missing

**Cause:** Query didn't return grounding information linking to source documents

**Solution:**

**Why Grounding May Be Missing:**
1. **No relevant documents found** - improve query or check document content
2. **Model couldn't ground response** - response is based on general knowledge
3. **Empty document store** - verify documents are active

**Verify Response Structure:**
```json
{
  "candidates": [
    {
      "content": {
        "parts": [{"text": "Answer..."}]
      },
      "groundingMetadata": {
        // If this is missing or empty, no grounding occurred
        "groundingChunks": [
          {
            "documentName": "fileSearchStores/store-1/documents/doc-123"
          }
        ]
      }
    }
  ]
}
```

**Improve Grounding:**
1. Ensure query is specific to document content
2. Verify documents contain relevant information
3. Check that documents are in STATE_ACTIVE
4. Try rephrasing query to be more specific

**Prevention:**
- Ask questions that require document content
- Maintain relevant document sets
- Monitor grounding rates for quality assurance

---

### Performance issues with large stores

**Cause:** Store contains many documents, slowing query performance

**Solution:**

**Optimize Store Organization:**
1. **Split into topic-specific stores:**
   ```
   Instead of:
   - all-documents/ (2000 documents)

   Use:
   - sales-documents/ (500 documents)
   - legal-documents/ (400 documents)
   - technical-docs/ (600 documents)
   - archived-docs/ (500 documents)
   ```

2. **Use metadata for organization:**
   - Add date metadata for time-based filtering
   - Add category metadata for topic filtering
   - Add status metadata (active, archived, etc.)

3. **Regular maintenance:**
   - Remove outdated documents
   - Archive old documents to separate stores
   - Monitor store size and performance

**Query Optimization:**
1. **Always use metadata filters** when querying large stores
2. **Query specific stores** rather than multiple stores
3. **Use time-based filters** to limit scope:
   ```
   customMetadata.date.stringValue > "2024-01-01"
   ```

**Performance Monitoring:**
- Track query response times
- Monitor store sizes
- Set alerts for stores exceeding size thresholds

**Prevention:**
- Plan store structure before uploading
- Implement document lifecycle policies
- Regular cleanup of old/irrelevant documents

**Related Issues:**
- [Query timeout](#query-timeout)
- [High memory usage](#high-memory-usage)

---

## Store Management Issues

### Cannot delete store (has documents)

**Cause:** Store contains documents and `force=true` parameter not set

**Solution:**

**Option 1: Force Delete (Recommended)**
1. Use **Delete Store** operation
2. Set **Force Delete** parameter to `true`
3. This will delete the store and all contained documents

**Option 2: Manual Cleanup**
1. **List all documents** in the store
2. **Delete each document** individually with `force=true`
3. **Delete the store** once empty

**Example Workflow:**
```
1. Delete Store Node
   - Store Name: fileSearchStores/store-1
   - Force Delete: true

   This deletes store + all documents + all chunks
```

**Error Message:**
```json
{
  "error": {
    "code": 9,
    "message": "FAILED_PRECONDITION: Store contains documents. Use force=true to delete.",
    "status": "FAILED_PRECONDITION"
  }
}
```

**Prevention:**
- Always use `force=true` when you're certain you want to delete
- Implement confirmation steps for delete operations
- Maintain document inventories to track what's in stores

**Related Issues:**
- [Store not found](#store-not-found)

---

### Store not found

**Cause:** Store name doesn't exist or is misspelled

**Solution:**

**Verify Store Name:**
1. **List all stores** to see available stores
2. **Check exact format:**
   ```
   ✅ fileSearchStores/my-store-123
   ❌ my-store-123
   ❌ fileSearchStores/my_store_123
   ❌ fileSearchStores/MyStore123
   ```

**Store Name Rules:**
- Must start with `fileSearchStores/`
- ID must be 1-40 characters
- Only lowercase letters, numbers, and hyphens
- No underscores or uppercase letters

**Check Store Status:**
1. Store may have been recently deleted
2. Store may not be created yet
3. Store may be in a different project/API key

**Prevention:**
- Use **List Stores** to get exact store names
- Store IDs in workflow variables to ensure consistency
- Validate store names before operations

---

### Store creation failed

**Cause:** Invalid store name, quota exceeded, or API error

**Solution:**

**Validate Store Name:**
```javascript
// Valid examples:
fileSearchStores/sales-reports-2024
fileSearchStores/legal-docs
fileSearchStores/kb-articles

// Invalid examples:
fileSearchStores/Sales_Reports  // Uppercase and underscore
fileSearchStores/my.store       // Period not allowed
sales-reports                    // Missing prefix
```

**Check Quota:**
1. Verify you haven't exceeded store creation limits
2. Check Google Cloud Console quotas
3. Delete unused stores if near limit

**Handle Creation Errors:**
```json
// Common error responses:
{
  "error": {
    "code": 3,
    "message": "Invalid store name format"
  }
}

{
  "error": {
    "code": 8,
    "message": "RESOURCE_EXHAUSTED: Store quota exceeded"
  }
}
```

**Prevention:**
- Validate store names before creation
- Monitor store count vs. quota
- Reuse existing stores when possible
- Implement store name validation in workflows

---

### Pagination issues

**Cause:** Incorrect handling of pagination tokens or page size

**Solution:**

**Understand Pagination:**
```json
// First request
{
  "pageSize": 20
}

// Response includes nextPageToken if more results exist
{
  "stores": [...],
  "nextPageToken": "eyJwYWdlIjoyfQ=="
}

// Next request uses the token
{
  "pageSize": 20,
  "pageToken": "eyJwYWdlIjoyfQ=="
}
```

**Common Mistakes:**
1. **Reusing old page tokens** - tokens expire and are request-specific
2. **Changing pageSize** between paginated requests
3. **Not checking for nextPageToken** - missing results
4. **Using wrong property name** - it's `pageToken` not `nextPageToken` in request

**Correct Pagination Pattern:**
```javascript
// In n8n workflow:
1. Set initial pageSize
2. Loop:
   a. Make request with current pageToken
   b. Process results
   c. Check if nextPageToken exists
   d. If yes, set pageToken = nextPageToken and continue
   e. If no, done
```

**n8n Built-in Support:**
The nodes handle pagination automatically when using **Return All** option. Only handle manually if using **Limit** option.

**Prevention:**
- Use **Return All** option when possible
- Don't modify pageSize during pagination
- Store pagination state properly in loops
- Test pagination with large result sets

---

## Metadata Issues

### Invalid metadata format

**Cause:** Metadata doesn't conform to the expected structure

**Solution:**

**Correct Metadata Structure:**
```json
{
  "customMetadata": [
    {
      "key": "category",
      "stringValue": "sales"
    },
    {
      "key": "year",
      "numericValue": 2024
    },
    {
      "key": "tags",
      "stringListValue": {
        "values": ["important", "quarterly", "report"]
      }
    }
  ]
}
```

**Common Errors:**

1. **Multiple value types in one item:**
   ```json
   ❌ {
     "key": "mixed",
     "stringValue": "text",
     "numericValue": 123
   }

   ✅ Use separate items for different values
   ```

2. **Missing key:**
   ```json
   ❌ {
     "stringValue": "value"
   }

   ✅ {
     "key": "myKey",
     "stringValue": "value"
   }
   ```

3. **Invalid value type:**
   ```json
   ❌ {
     "key": "date",
     "stringValue": 20240101  // Number instead of string
   }

   ✅ {
     "key": "date",
     "numericValue": 20240101
   }
   // OR
   ✅ {
     "key": "date",
     "stringValue": "2024-01-01"
   }
   ```

**Validation:**
The node automatically validates:
- Each item has a key
- Each item has exactly one value type
- Maximum 20 metadata items

**Prevention:**
- Use consistent metadata schemas
- Document your metadata structure
- Validate metadata before upload
- Test with sample metadata first

**Related Issues:**
- [Too many metadata items](#too-many-metadata-items-20)
- [Custom metadata must have a key](#error-custom-metadata-must-have-a-key)

---

### Too many metadata items (>20)

**Cause:** Document has more than 20 custom metadata items (API limit)

**Solution:**

**Consolidate Metadata:**
```json
// Instead of 25 separate items:
❌ [
  {"key": "tag1", "stringValue": "value1"},
  {"key": "tag2", "stringValue": "value2"},
  // ... 25 total items
]

// Use stringListValue:
✅ [
  {
    "key": "tags",
    "stringListValue": {
      "values": ["value1", "value2", "value3", ...]
    }
  },
  {"key": "category", "stringValue": "main"},
  // ... 18 more items max
]
```

**Prioritize Metadata:**
1. Keep only the most important searchable fields
2. Combine related fields into lists
3. Store less critical data in document displayName or content

**Redesign Strategy:**
```javascript
// Before (30 metadata items):
- author_first_name
- author_last_name
- author_email
- department_name
- department_code
// ... 25 more

// After (5 metadata items):
- author (stringValue: "John Doe")
- contact (stringValue: "john@example.com")
- department (stringValue: "Engineering")
- year (numericValue: 2024)
- tags (stringListValue: ["report", "quarterly"])
```

**Error Message:**
```
Maximum 20 custom metadata items allowed
```

**Prevention:**
- Design metadata schema before implementation
- Use stringListValue for multiple related values
- Keep metadata focused on searchable fields
- Document your 20-item limit strategy

---

### Metadata filter parsing errors

**Cause:** Filter expression cannot be parsed

**Solution:**

**Check Syntax Rules:**

1. **Operator spacing:**
   ```
   ✅ customMetadata.key.stringValue = "value"
   ❌ customMetadata.key.stringValue="value"  // Works but not recommended
   ```

2. **Quote usage:**
   ```
   ✅ customMetadata.key.stringValue = "value with spaces"
   ❌ customMetadata.key.stringValue = value with spaces
   ```

3. **Field path:**
   ```
   ✅ customMetadata.myKey.stringValue
   ✅ customMetadata.myKey.numericValue
   ✅ customMetadata.myKey.stringListValue
   ❌ customMetadata.myKey
   ❌ myKey.stringValue
   ```

**Debug Complex Filters:**
```javascript
// Test incrementally:
// Step 1: Simple
customMetadata.year.numericValue = 2024

// Step 2: Add condition
customMetadata.year.numericValue = 2024 AND customMetadata.type.stringValue = "report"

// Step 3: Add complexity
(customMetadata.year.numericValue = 2024 AND customMetadata.type.stringValue = "report") OR customMetadata.priority.stringValue = "high"
```

**Prevention:**
- Start with simple filters
- Test each condition independently
- Build complexity gradually
- Use parentheses generously for clarity

**Related Issues:**
- [AIP-160 syntax errors](#aip-160-syntax-errors)
- [Metadata filter syntax errors](#metadata-filter-syntax-errors)

---

### AIP-160 syntax errors

**Cause:** Filter doesn't follow AIP-160 filtering standard

**Solution:**

**AIP-160 Basics:**

**Supported Operators:**
- `=` (equals)
- `!=` (not equals)
- `>` (greater than)
- `>=` (greater than or equal)
- `<` (less than)
- `<=` (less than or equal)
- `AND` (logical and)
- `OR` (logical or)

**Field References:**
```
customMetadata.{key}.stringValue
customMetadata.{key}.numericValue
customMetadata.{key}.stringListValue
```

**Examples:**
```
// Equality
customMetadata.status.stringValue = "active"

// Numeric comparison
customMetadata.score.numericValue >= 75

// Combination
customMetadata.category.stringValue = "sales" AND customMetadata.year.numericValue = 2024

// Grouping
(customMetadata.region.stringValue = "NA" OR customMetadata.region.stringValue = "EMEA") AND customMetadata.active.stringValue = "true"

// Inequality
customMetadata.status.stringValue != "archived"
```

**Common Mistakes:**
```
❌ customMetadata.year == 2024          // Use = not ==
❌ customMetadata.year.numericValue > "2024"  // Don't quote numbers
❌ metadata.year.numericValue > 2024    // Must start with customMetadata
❌ customMetadata.tags CONTAINS "value" // CONTAINS not supported, use = with stringListValue
```

**Learn More:**
- [AIP-160 Specification](https://google.aip.dev/160)
- [Google API Filtering Guide](https://cloud.google.com/apis/design/design_patterns#list_filter)

**Prevention:**
- Follow AIP-160 examples closely
- Use supported operators only
- Test filters with known data
- Keep filters simple when possible

---

### Error: Unbalanced quotes/parentheses

**Cause:** Filter string has mismatched quotes or parentheses

**Solution:**

**Quote Issues:**
```javascript
// Count quotes - must be even
❌ customMetadata.name.stringValue = "John Doe
   Quotes: 1 (odd - invalid)

✅ customMetadata.name.stringValue = "John Doe"
   Quotes: 2 (even - valid)

// Escaping quotes within strings not supported
// Use single quotes outside if needed
❌ customMetadata.note.stringValue = "He said "hello""
✅ Split into simpler filter or avoid quotes in values
```

**Parentheses Issues:**
```javascript
// Must balance opening and closing
❌ (customMetadata.a.stringValue = "x" AND customMetadata.b.stringValue = "y"
   Open: 1, Close: 0 - invalid

✅ (customMetadata.a.stringValue = "x" AND customMetadata.b.stringValue = "y")
   Open: 1, Close: 1 - valid

// Nested parentheses must also balance
✅ ((customMetadata.a.stringValue = "x") OR (customMetadata.b.stringValue = "y")) AND customMetadata.c.stringValue = "z"
   Each level balances
```

**Auto-Detection:**
The node validates your filter before sending and will show:
```
Metadata filter has unbalanced quotes
Metadata filter has unbalanced parentheses
```

**Prevention:**
- Use code editor with bracket matching
- Count opening/closing symbols before submitting
- Test incrementally when building complex filters
- Use the node's built-in validation

---

## Network and API Issues

### Error: 429 Too Many Requests

**Cause:** API rate limit exceeded

**Solution:**

**Immediate Action:**
1. **Wait before retrying** - rate limits reset over time
2. **Implement exponential backoff:**
   ```javascript
   Wait times: 1s, 2s, 4s, 8s, 16s, 32s, 64s
   ```
3. **Reduce request rate** if hitting limits frequently

**Rate Limit Information:**
- **Requests per minute:** Varies by operation
- **Requests per day:** Check quota in Google Cloud Console
- **Concurrent uploads:** Limit parallel uploads to 5-10

**Long-term Solutions:**

1. **Request quota increase:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/apis/api/generativelanguage.googleapis.com/quotas)
   - Request higher limits for your use case

2. **Implement queuing:**
   ```
   Instead of:
   - 100 parallel uploads (hits rate limit)

   Use:
   - Queue system processing 5 at a time
   ```

3. **Batch operations:**
   - Group related operations
   - Space out non-urgent requests

**Monitor Usage:**
- Track API calls in Google Cloud Console
- Set up alerts before hitting limits
- Review usage patterns weekly

**Error Response:**
```json
{
  "error": {
    "code": 429,
    "message": "Rate limit exceeded",
    "status": "RESOURCE_EXHAUSTED"
  }
}
```

**Prevention:**
- Implement rate limiting in workflows
- Use queuing for bulk operations
- Monitor quota usage
- Request higher quotas proactively

**Related Issues:**
- [403 Forbidden](#error-403-forbidden)
- [Performance issues](#performance-issues)

---

### Connection timeouts

**Cause:** Network connectivity issues or slow response times

**Solution:**

**Network Troubleshooting:**

1. **Test connectivity:**
   ```bash
   # Test DNS resolution
   nslookup generativelanguage.googleapis.com

   # Test connection
   curl -I https://generativelanguage.googleapis.com/v1beta/fileSearchStores
   ```

2. **Check firewall rules:**
   - Ensure outbound HTTPS (443) is allowed
   - Whitelist `*.googleapis.com` if using domain filtering
   - Check corporate proxy settings

3. **Verify n8n configuration:**
   - Check n8n timeout settings
   - Verify proxy configuration if applicable
   - Test with simple API call first

**Timeout Settings:**
```javascript
// The API client has built-in timeouts:
// - Standard requests: 2 minutes
// - Upload operations: Based on file size
// - Polling operations: 10 minutes max (120 attempts × 5s)
```

**If Timeouts Persist:**
1. **Use smaller operations** - break into chunks
2. **Increase n8n timeout** if self-hosted
3. **Check n8n server location** - closer to Google data centers is better
4. **Try different times** - off-peak may be faster

**Prevention:**
- Monitor network latency
- Use appropriate timeout values
- Implement retry logic
- Test during different times of day

**Related Issues:**
- [Upload timeout](#error-upload-timeout)
- [Query timeout](#query-timeout)

---

### SSL/TLS errors

**Cause:** SSL certificate validation issues

**Solution:**

**Common Scenarios:**

1. **Corporate SSL Inspection:**
   ```
   If your network intercepts SSL traffic:
   - Work with IT to whitelist googleapis.com
   - Import corporate root CA if needed
   - Configure n8n to trust custom certificates
   ```

2. **Outdated certificates:**
   ```bash
   # Update n8n to latest version
   npm update n8n

   # Update Node.js if very old
   node --version  # Should be 18.x or newer
   ```

3. **Self-hosted n8n:**
   ```javascript
   // May need to configure NODE_EXTRA_CA_CERTS
   // if using custom certificates
   ```

**Verification:**
```bash
# Test SSL connection
openssl s_client -connect generativelanguage.googleapis.com:443
```

**Prevention:**
- Keep n8n and Node.js updated
- Work with IT on SSL inspection policies
- Use standard SSL configurations when possible

---

### DNS resolution issues

**Cause:** Cannot resolve `generativelanguage.googleapis.com`

**Solution:**

**Test DNS:**
```bash
# Test resolution
nslookup generativelanguage.googleapis.com

# Try different DNS server
nslookup generativelanguage.googleapis.com 8.8.8.8
```

**Fix DNS Issues:**

1. **Update DNS servers:**
   - Add Google DNS (8.8.8.8, 8.8.4.4)
   - Or Cloudflare DNS (1.1.1.1, 1.0.0.1)

2. **Flush DNS cache:**
   ```bash
   # macOS
   sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder

   # Linux
   sudo systemd-resolve --flush-caches

   # Windows
   ipconfig /flushdns
   ```

3. **Check hosts file:**
   - Ensure no blocking entries for googleapis.com
   - Location: `/etc/hosts` (Linux/Mac) or `C:\Windows\System32\drivers\etc\hosts` (Windows)

**Prevention:**
- Use reliable DNS servers
- Monitor DNS health
- Have fallback DNS configured

---

### Proxy configuration

**Cause:** n8n not configured to use corporate proxy

**Solution:**

**Configure n8n Proxy:**

1. **Environment variables:**
   ```bash
   export HTTP_PROXY=http://proxy.company.com:8080
   export HTTPS_PROXY=http://proxy.company.com:8080
   export NO_PROXY=localhost,127.0.0.1
   ```

2. **n8n configuration:**
   ```javascript
   // In n8n settings
   // Configure proxy settings if available in your version
   ```

3. **Test proxy:**
   ```bash
   curl -x http://proxy.company.com:8080 https://generativelanguage.googleapis.com/v1beta/fileSearchStores
   ```

**Authentication:**
If proxy requires authentication:
```bash
export HTTPS_PROXY=http://username:password@proxy.company.com:8080
```

**Prevention:**
- Document proxy requirements
- Test connectivity before deployment
- Work with network team on proxy configuration

---

## n8n Integration Issues

### Node not appearing in palette

**Cause:** Node not properly installed or n8n not restarted

**Solution:**

**Installation Check:**

1. **Verify installation:**
   ```bash
   cd ~/.n8n/nodes  # or your n8n nodes directory
   ls -la
   # Should see your node package
   ```

2. **Check package.json:**
   ```json
   {
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

3. **Restart n8n:**
   ```bash
   # Stop n8n
   # Start n8n
   n8n start
   ```

4. **Check n8n logs:**
   ```bash
   # Look for errors during startup
   # Nodes should be registered
   ```

**For Development:**
```bash
# Rebuild if developing
npm run build

# Link locally
npm link

# In n8n directory
npm link n8n-nodes-gemini-file-search
```

**Prevention:**
- Follow installation instructions exactly
- Always restart n8n after installing nodes
- Check logs for errors
- Verify file permissions

---

### Credential test failing

**Cause:** Invalid API key or connectivity issues

**Solution:**

**Verify API Key:**
1. Copy API key from [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Ensure no extra spaces or characters
3. Key should start with `AI...`

**Test Manually:**
```bash
# Test API key directly
curl "https://generativelanguage.googleapis.com/v1beta/fileSearchStores?key=YOUR_API_KEY"

# Should return list of stores or empty list
# Should NOT return 401/403 error
```

**Common Issues:**

1. **Wrong API:**
   ```
   Ensure Generative Language API is enabled, not just:
   - Gemini API (different)
   - Cloud AI APIs (different)
   ```

2. **API Key Restrictions:**
   - Check if key has IP restrictions
   - Check if key has API restrictions
   - Ensure File Search API is allowed

3. **Network:**
   - Test from same network as n8n
   - Check firewall/proxy settings

**Prevention:**
- Test API key immediately after generation
- Document API key restrictions
- Keep backup keys for testing

**Related Issues:**
- [401 Unauthorized](#error-401-unauthorized)
- [403 Forbidden](#error-403-forbidden)

---

### Node execution errors

**Cause:** Various runtime errors during node execution

**Solution:**

**Common Execution Errors:**

1. **Missing required parameters:**
   ```
   Error: Parameter 'storeName' is required

   Solution: Fill in all required fields (marked with *)
   ```

2. **Invalid parameter values:**
   ```
   Error: Invalid store name format

   Solution: Check validation rules for the parameter
   ```

3. **Binary data issues:**
   ```
   Error: No binary data found

   Solution: Ensure previous node outputs binary data
   ```

**Debug Steps:**

1. **Check workflow execution:**
   - Look at error message in execution details
   - Check input data to the node
   - Verify previous nodes succeeded

2. **Test with minimal setup:**
   - Remove optional parameters
   - Test with simple, known-good inputs
   - Add complexity incrementally

3. **Check n8n version:**
   ```bash
   n8n --version
   # Ensure compatible with node requirements
   ```

**Error Handling:**
- Enable "Continue on Fail" for error tolerance
- Add error handling nodes (IF, Switch)
- Log errors for troubleshooting

**Prevention:**
- Test workflows thoroughly before production
- Validate inputs before node execution
- Use error handling patterns
- Monitor execution history

---

### Binary data handling issues

**Cause:** Binary data not passed correctly between nodes

**Solution:**

**Verify Binary Data Flow:**

1. **Check previous node:**
   ```json
   // Should output binary data:
   {
     "json": {...},
     "binary": {
       "data": {
         "data": "...",
         "mimeType": "application/pdf",
         "fileName": "document.pdf"
       }
     }
   }
   ```

2. **Binary property name:**
   ```
   Upload Node:
   - Binary Property: "data"  // Must match binary key above
   ```

3. **Common sources:**
   - HTTP Request node (Download file)
   - Read Binary File node
   - Google Drive node (Download)
   - Dropbox node (Download)

**Troubleshooting:**

```javascript
// In Code node before upload, check binary:
if (!$input.binary) {
  throw new Error('No binary data found');
}

if (!$input.binary.data) {
  throw new Error('Binary property "data" not found');
}

return $input.all();
```

**Common Patterns:**

```
Pattern 1: Download and Upload
HTTP Request (Download) → Upload Document
Binary property: "data"

Pattern 2: Local File
Read Binary Files → Upload Document
Binary property: "data"

Pattern 3: Cloud Storage
Google Drive → Upload Document
Binary property: "data"
```

**Prevention:**
- Use consistent binary property names
- Test binary data flow with small files first
- Add validation nodes between steps
- Check MIME type is set correctly

---

### Workflow execution timeout

**Cause:** Workflow takes longer than n8n's timeout limit

**Solution:**

**For Upload Operations:**
```
1. Set "Wait for Completion" to false
2. Store operation name in variable
3. Use separate scheduled workflow to check status
4. This allows upload to complete without blocking
```

**Example Pattern:**
```
Workflow 1: Trigger Upload
├─ Upload Document (Wait = false)
└─ Set variable: operation_name

Workflow 2: Check Status (runs every 30s)
├─ Get Operation Status
├─ IF operation complete
│  ├─ YES: Process result, stop polling
│  └─ NO: Continue polling
```

**Increase Timeout (Self-hosted):**
```javascript
// In n8n environment variables
N8N_EXECUTION_TIMEOUT=600  // 10 minutes

// In workflow settings
Execution timeout: 600 seconds
```

**For Queries:**
- Use metadata filters to reduce scope
- Query smaller stores
- Consider using Flash model instead of Pro

**Prevention:**
- Design workflows for async operations
- Use appropriate timeout values
- Break long operations into smaller steps
- Monitor execution times

---

## Performance Issues

### Slow uploads

**Cause:** Large files, slow network, or API throttling

**Solution:**

**Optimize File Size:**
1. **Compress before upload:**
   - Text files: Use compression utilities
   - PDFs: Reduce quality/resolution if acceptable
   - Images in documents: Optimize before creating PDF

2. **Split large documents:**
   ```
   Instead of:
   - 1 file × 95MB

   Use:
   - 10 files × 9.5MB each
   - Upload in parallel (but respect rate limits)
   ```

**Network Optimization:**
1. **Ensure stable connection**
2. **Upload during off-peak hours** if bandwidth is shared
3. **Consider n8n server location** - closer to Google data centers is faster
4. **Use wired connection** instead of WiFi if possible

**Monitoring:**
```javascript
// Track upload times in your workflow
Start Time → Upload → End Time
Calculate: End - Start = Upload Duration
Log for analysis
```

**Parallel Uploads:**
```
✅ Good: 5-10 parallel uploads
⚠️  Caution: 20+ parallel (may hit rate limits)
❌ Bad: 50+ parallel (will hit rate limits)
```

**Prevention:**
- Baseline performance with test uploads
- Monitor upload speeds over time
- Optimize files before upload
- Use async upload pattern for large files

**Related Issues:**
- [Upload timeout](#error-upload-timeout)
- [High memory usage](#high-memory-usage)

---

### Slow queries

**Cause:** Large document stores or complex queries

**Solution:**

**Query Optimization:**

1. **Use metadata filters:**
   ```
   Without filter: Searches all 1000 documents
   With filter: Searches 50 matching documents

   Result: 10-20x faster
   ```

2. **Choose right model:**
   ```
   gemini-2.5-flash:  Fast, good for most queries
   gemini-2.5-pro:    Slower, better quality/complexity

   Try Flash first
   ```

3. **Narrow scope:**
   - Query specific stores, not multiple
   - Use time-based filters for recent documents
   - Filter by category/type

**Store Organization:**
```
Instead of:
- all-docs (5000 documents)
  Query time: 10-15 seconds

Use:
- current-docs (500 documents) - active queries
- archived-docs (4500 documents) - rarely queried
  Query time: 2-3 seconds
```

**Caching Strategy:**
```
For repeated queries:
1. Cache results in workflow variable
2. Set cache expiration (e.g., 1 hour)
3. Reuse cached results within expiration
4. Refresh cache when expired
```

**Prevention:**
- Keep stores appropriately sized
- Use metadata for filtering
- Monitor query performance
- Archive old documents

**Related Issues:**
- [Performance issues with large stores](#performance-issues-with-large-stores)
- [Query timeout](#query-timeout)

---

### High memory usage

**Cause:** Processing large files or many operations simultaneously

**Solution:**

**Reduce Memory Footprint:**

1. **Process files in batches:**
   ```
   Instead of:
   - Load 100 files into memory
   - Upload all at once

   Use:
   - Load 10 files
   - Upload
   - Clear memory
   - Repeat
   ```

2. **Stream large files** when possible:
   - Use HTTP Request streaming
   - Don't load entire file into variable
   - Process and upload immediately

3. **Limit parallel operations:**
   ```
   High memory: 50 parallel uploads
   Lower memory: 10 parallel uploads
   ```

**Monitor Memory:**
```bash
# Check n8n memory usage
ps aux | grep n8n

# Monitor during execution
# Look for memory spikes
```

**n8n Configuration (Self-hosted):**
```bash
# Increase Node.js memory if needed
NODE_OPTIONS="--max-old-space-size=4096"  # 4GB

# But also fix root cause
# Don't just increase memory indefinitely
```

**Prevention:**
- Process in batches
- Clean up between operations
- Avoid storing large data in variables
- Monitor memory usage patterns

**Related Issues:**
- [Slow uploads](#slow-uploads)
- [Workflow execution timeout](#workflow-execution-timeout)

---

### Long operation polling

**Cause:** Upload/import operations taking longer than expected

**Solution:**

**Understand Polling:**
```javascript
// Default polling behavior:
- Check every 5 seconds
- Max 120 attempts (10 minutes total)
- Throws timeout error if not done
```

**For Very Large Files:**
1. **Use async pattern:**
   ```
   Upload with Wait for Completion = false
   Poll manually at longer intervals (30s-1min)
   More appropriate for very large uploads
   ```

2. **Adjust expectations:**
   ```
   Small files (< 1MB):   30s-2min
   Medium files (10MB):   2-5min
   Large files (50MB):    5-15min
   Very large (95MB):     15-30min
   ```

3. **Monitor operation metadata:**
   ```json
   {
     "name": "operations/abc123",
     "metadata": {
       "progressPercent": 45,  // If available
       // Other progress indicators
     }
   }
   ```

**Custom Polling:**
```
1. Upload (Wait = false)
2. Store operation name
3. Wait 30 seconds (Wait node)
4. Get Operation Status
5. IF not done, go to step 3
6. IF done, process result
```

**Prevention:**
- Set realistic timeout expectations
- Use async pattern for large files
- Monitor typical processing times
- Implement custom polling for edge cases

---

## Data Issues

### Incorrect document state

**Cause:** Document state not what you expect

**Solution:**

**Understand States:**
```
STATE_UNSPECIFIED: Shouldn't normally see this
STATE_PENDING:     Processing (normal for new documents)
STATE_ACTIVE:      Ready for queries (goal state)
STATE_FAILED:      Processing failed (needs investigation)
```

**State Transitions:**
```
Upload → STATE_PENDING → STATE_ACTIVE (success)
                       → STATE_FAILED (error)
```

**Check Current State:**
```
1. Use Get Document operation
2. Check "state" field
3. If STATE_PENDING >30 min, investigate
4. If STATE_FAILED, check operation for error details
```

**Fix Wrong State:**

1. **STATE_PENDING too long:**
   - Check operation status
   - Wait up to 30 minutes for large files
   - If still pending, may be stuck - contact support

2. **STATE_FAILED:**
   - Get operation details for error
   - Delete document
   - Fix issue (file corruption, invalid metadata, etc.)
   - Re-upload

3. **STATE_ACTIVE but not showing in queries:**
   - Verify store name in query
   - Check metadata filters
   - Try query without filters

**Prevention:**
- Monitor state after upload
- Set up alerts for STATE_FAILED
- Track state transition times
- Test with small files first

**Related Issues:**
- [Documents stuck in STATE_PENDING](#documents-stuck-in-state_pending)
- [Documents in STATE_FAILED](#documents-in-state_failed)

---

### Missing metadata

**Cause:** Metadata not set during upload or lost during processing

**Solution:**

**Verify Metadata Upload:**
```json
// Ensure metadata sent in upload:
{
  "displayName": "My Document",
  "customMetadata": [
    {
      "key": "category",
      "stringValue": "sales"
    }
  ]
}
```

**Check Retrieved Metadata:**
```
1. Use Get Document operation
2. Check "customMetadata" field
3. Compare with what you uploaded
```

**Common Issues:**

1. **Metadata not included in upload:**
   ```
   Fix: Ensure "Custom Metadata" parameter is filled
   ```

2. **Invalid metadata format:**
   ```
   Fix: Validate format before upload
   ```

3. **Metadata silently dropped:**
   ```
   Fix: Check document after upload to verify
   ```

**Re-add Metadata:**
Unfortunately, you cannot update metadata after upload. You must:
```
1. Delete document (force=true)
2. Re-upload with correct metadata
```

**Prevention:**
- Verify metadata immediately after upload
- Use consistent metadata schema
- Validate metadata before upload
- Test metadata queries after upload

---

### Incorrect chunk count

**Cause:** Document chunked differently than expected

**Solution:**

**Understand Chunking:**
```
Chunking is automatic and configurable:
- maxTokensPerChunk: Default 1024, max 2048
- maxOverlapTokens: Default 128, max 512

Chunk count depends on:
- Document length
- Chunk size settings
- Content structure
```

**Verify Chunking:**
```
1. Get Document
2. Check chunkCount field
3. Compare with expectations
```

**Adjust Chunking:**
```json
// In Upload operation:
{
  "chunkingConfig": {
    "whiteSpaceConfig": {
      "maxTokensPerChunk": 1024,
      "maxOverlapTokens": 128
    }
  }
}

// Larger chunks = fewer chunks
// Smaller chunks = more chunks
```

**When to Adjust:**

1. **Too many small chunks:**
   - Increase maxTokensPerChunk
   - Better for long-form content

2. **Too few large chunks:**
   - Decrease maxTokensPerChunk
   - Better for granular retrieval

3. **Poor overlap:**
   - Adjust maxOverlapTokens
   - More overlap = better context continuity

**Prevention:**
- Understand your content type
- Test chunking with sample documents
- Monitor chunk counts
- Adjust settings based on query results

---

### Document not indexed

**Cause:** Document exists but doesn't appear in queries

**Solution:**

**Verification Checklist:**

1. **Document state:**
   ```
   Get Document → Check state = STATE_ACTIVE
   If not active, wait or investigate
   ```

2. **Store reference:**
   ```
   Ensure query references correct store name
   Exact match required
   ```

3. **Metadata filters:**
   ```
   Try query WITHOUT filters first
   Then add filters incrementally
   ```

4. **Query relevance:**
   ```
   Ensure query is relevant to document content
   Try specific terms from the document
   ```

**Test Document Indexing:**
```
1. Upload document with unique term (e.g., "xyz123test")
2. Wait for STATE_ACTIVE
3. Query: "Find xyz123test"
4. Should return your document
5. If not, indexing issue
```

**Fix Steps:**

1. **If in STATE_ACTIVE but not queryable:**
   - Wait 5 more minutes (indexing lag)
   - Try query again
   - If still not working, delete and re-upload

2. **If STATE_PENDING too long:**
   - See [Documents stuck in STATE_PENDING](#documents-stuck-in-state_pending)

3. **If STATE_FAILED:**
   - See [Documents in STATE_FAILED](#documents-in-state_failed)

**Prevention:**
- Verify document state before querying
- Test queries with known content
- Monitor indexing times
- Wait appropriate time after upload

---

## Debugging Tips

### Enabling debug mode

**For n8n Workflows:**

1. **Enable workflow execution logging:**
   - Settings → Executions → Log level: All
   - View execution details after each run

2. **Add debug nodes:**
   ```
   Node → Code Node (for debugging)

   return [{
     json: {
       input: $input.all(),
       timestamp: new Date().toISOString()
     }
   }];
   ```

3. **Use sticky notes:**
   - Document expected values
   - Note debugging insights
   - Track issues

**For API Debugging:**

```bash
# Test API directly
curl -v "https://generativelanguage.googleapis.com/v1beta/fileSearchStores?key=YOUR_KEY"

# -v flag shows full request/response
```

**Check n8n Logs (Self-hosted):**
```bash
# Find n8n logs
~/.n8n/logs/

# Watch in real-time
tail -f ~/.n8n/logs/n8n.log
```

**Prevention:**
- Use debug mode during development
- Keep debug nodes in workflows (disable in production)
- Log important data points
- Review logs regularly

---

### Reading error messages

**Error Structure:**
```json
{
  "error": {
    "code": 404,           // HTTP status code
    "message": "...",      // Human-readable message
    "status": "NOT_FOUND", // gRPC status
    "details": [...]       // Additional details
  }
}
```

**Common Error Codes:**

| Code | Status | Meaning | Solution |
|------|--------|---------|----------|
| 400 | INVALID_ARGUMENT | Bad request format | Check parameters |
| 401 | UNAUTHENTICATED | Invalid API key | Check credentials |
| 403 | PERMISSION_DENIED | No permission / quota | Check quotas & billing |
| 404 | NOT_FOUND | Resource doesn't exist | Verify resource name |
| 409 | ALREADY_EXISTS | Resource already exists | Use different name |
| 429 | RESOURCE_EXHAUSTED | Rate limit exceeded | Slow down requests |
| 503 | UNAVAILABLE | Service temporarily down | Retry with backoff |

**n8n Error Format:**
```
NodeOperationError: Human-friendly message
- Validation errors
- User input errors

NodeApiError: API response errors
- Network errors
- API rejections
- Authentication failures
```

**Reading Stack Traces:**
```
Error: File size exceeds 100MB
    at validateFileSize (validators.ts:74)
    at upload (upload.ts:45)
    ^^^
    Shows where error originated
```

**Prevention:**
- Read full error message, not just first line
- Check error codes for quick diagnosis
- Look for "details" field for more info
- Keep error messages for support tickets

---

### Checking API quotas

**Google Cloud Console:**

1. **Navigate to quotas:**
   ```
   https://console.cloud.google.com/apis/api/generativelanguage.googleapis.com/quotas
   ```

2. **Key metrics to monitor:**
   - Requests per minute (RPM)
   - Requests per day (RPD)
   - Concurrent requests
   - Storage quota

3. **Check usage:**
   - Go to API Dashboard
   - View usage charts
   - Compare vs. limits

**Request Quota Increase:**

1. Click quota you want to increase
2. Click "Edit Quotas"
3. Enter new limit request
4. Provide justification
5. Submit and wait for approval (usually 24-48 hours)

**Monitor in Workflows:**
```javascript
// Add quota monitoring
Code Node:
  Track API calls
  Log when approaching limits
  Alert if >80% of quota used
```

**Prevention:**
- Set up quota alerts in Google Cloud
- Monitor usage trends
- Request increases before hitting limits
- Design workflows with quotas in mind

---

### Verifying credentials

**Test Credential:**

1. **In n8n:**
   - Go to Credentials
   - Select Gemini API credential
   - Click "Test" button
   - Should see "Credential test successful"

2. **Manual test:**
   ```bash
   curl "https://generativelanguage.googleapis.com/v1beta/fileSearchStores?key=YOUR_API_KEY&pageSize=1"

   # Success response:
   {
     "fileSearchStores": [],
     "nextPageToken": ""
   }

   # OR
   {
     "fileSearchStores": [{...}],
     ...
   }

   # Failure response:
   {
     "error": {
       "code": 401,
       "message": "API key not valid"
     }
   }
   ```

**Check API Key Configuration:**

1. **In Google AI Studio:**
   - Visit https://aistudio.google.com/app/apikey
   - Verify key exists and is active
   - Check restrictions (if any)

2. **Key restrictions to check:**
   - IP restrictions
   - API restrictions
   - Referrer restrictions

**Common Issues:**

1. **Extra spaces:**
   ```
   ❌ " AIza...xyz "  // Leading/trailing spaces
   ✅ "AIza...xyz"
   ```

2. **Wrong key type:**
   ```
   ❌ OAuth 2.0 client ID
   ❌ Service account key
   ✅ API Key from Google AI Studio
   ```

3. **Expired/deleted key:**
   - Generate new key
   - Update in n8n

**Prevention:**
- Test credentials immediately after setup
- Store backup keys securely
- Document key restrictions
- Monitor key usage

---

### Testing connectivity

**Basic Connectivity:**

```bash
# 1. DNS resolution
nslookup generativelanguage.googleapis.com

# 2. Network reachability
ping generativelanguage.googleapis.com

# 3. HTTPS connectivity
curl -I https://generativelanguage.googleapis.com
```

**From n8n Server:**

```bash
# SSH into n8n server
# Run connectivity tests from there
# Ensures testing from same environment
```

**Test Complete Flow:**

```bash
# Test with actual API key
curl "https://generativelanguage.googleapis.com/v1beta/fileSearchStores?key=YOUR_KEY" \
  -H "Content-Type: application/json"

# Should return JSON response (not error page)
```

**Network Path:**
```
n8n Server → Firewall → Proxy → Internet → Google APIs

Test each segment:
1. n8n can reach firewall
2. Firewall allows HTTPS (443)
3. Proxy forwards requests
4. Internet connectivity
5. Google APIs reachable
```

**Common Blockers:**

- Corporate firewall
- Proxy authentication
- SSL inspection
- DNS filtering
- IP restrictions

**Prevention:**
- Document network requirements
- Test before deploying workflows
- Monitor connectivity health
- Have escalation path for network issues

---

## Common Patterns and Solutions

### Handling long-running operations

**Pattern: Async Upload + Polling**

```
Workflow: Upload Document Async
├─ 1. Upload Document
│  └─ Wait for Completion: false
│     Returns: operation name
│
├─ 2. Store operation name
│  └─ Set workflow variable
│
└─ 3. Trigger polling workflow
   └─ Webhook or schedule next workflow

Workflow: Poll Operation Status
├─ 1. Get Operation Status
│  └─ Use stored operation name
│
├─ 2. Check if done
│  └─ IF node
│
├─ YES: Extract result
│  ├─ Process document data
│  └─ Update tracking system
│
└─ NO: Wait and retry
   ├─ Wait node (30-60 seconds)
   └─ Loop back to step 1
```

**Benefits:**
- No workflow timeout
- Can monitor multiple operations
- Resilient to failures
- Better resource usage

**Implementation Tips:**
- Store operation names in database
- Set maximum retry limit
- Implement exponential backoff
- Log progress for monitoring

---

### Implementing retry logic

**Pattern: Exponential Backoff**

```javascript
// In Code node
const maxRetries = 5;
let retryCount = 0;
let success = false;
let lastError = null;

while (retryCount < maxRetries && !success) {
  try {
    // Your operation here
    success = true;
  } catch (error) {
    lastError = error;
    retryCount++;

    if (retryCount < maxRetries) {
      // Exponential backoff: 1s, 2s, 4s, 8s, 16s
      const waitTime = Math.pow(2, retryCount) * 1000;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }
}

if (!success) {
  throw new Error(`Failed after ${maxRetries} retries: ${lastError.message}`);
}

return [{json: {success: true, retriesTaken: retryCount}}];
```

**Using n8n Nodes:**

```
Try (Error Trigger node)
├─ Upload Document
└─ On Error:
   ├─ IF retryCount < maxRetries
   │  ├─ Wait exponentially
   │  └─ Loop back to Upload
   └─ ELSE: Send error notification
```

**When to Retry:**
- 429 (Rate limit) - Always retry
- 503 (Service unavailable) - Always retry
- 500 (Internal error) - Retry with caution
- Network timeouts - Retry
- 4xx errors - Usually don't retry (except 429)

**Prevention:**
- Implement from the start for critical operations
- Log retry attempts
- Set reasonable retry limits
- Monitor retry patterns

---

### Managing rate limits

**Pattern: Queue-Based Processing**

```
Workflow: Add to Queue
├─ Receive upload requests
├─ Store in database/queue
└─ Return acknowledgment

Workflow: Process Queue (Runs every 10s)
├─ Get next 5 items from queue
├─ Upload in parallel (rate limit friendly)
├─ Update queue status
└─ Handle errors
```

**Rate Limit Budget:**

```javascript
// Track API calls
const rateLimit = {
  requestsPerMinute: 60,
  requestsThisMinute: 0,
  minuteStart: Date.now()
};

// Before each request
if (Date.now() - rateLimit.minuteStart > 60000) {
  // New minute
  rateLimit.requestsThisMinute = 0;
  rateLimit.minuteStart = Date.now();
}

if (rateLimit.requestsThisMinute >= rateLimit.requestsPerMinute) {
  // Wait for next minute
  const waitTime = 60000 - (Date.now() - rateLimit.minuteStart);
  await sleep(waitTime);
}

rateLimit.requestsThisMinute++;
// Make request
```

**Batch Processing:**

```
Instead of:
- Upload 100 files immediately (hits rate limit)

Use:
- Batch 1: Upload 10 files, wait 10s
- Batch 2: Upload 10 files, wait 10s
- ...
- Batch 10: Upload 10 files
```

**Prevention:**
- Build rate limiting into workflows from start
- Monitor usage vs. limits
- Use queuing for bulk operations
- Request higher quotas if needed consistently

---

### Optimizing uploads

**Best Practices:**

1. **Pre-flight checks:**
   ```
   Before upload:
   ├─ Validate file size
   ├─ Check MIME type
   ├─ Validate metadata
   └─ Verify store exists

   Prevents failed uploads
   ```

2. **Batch uploads with throttling:**
   ```
   For 100 files:
   ├─ Group into batches of 10
   ├─ Upload batch
   ├─ Wait 5 seconds
   └─ Repeat
   ```

3. **Parallel uploads (controlled):**
   ```
   Use SplitInBatches node:
   - Batch size: 5-10
   - Parallel processing
   - Rate limit friendly
   ```

4. **File optimization:**
   ```
   Before upload:
   ├─ Compress text files
   ├─ Optimize PDF quality
   ├─ Remove unnecessary metadata
   └─ Split very large files
   ```

5. **Async for large files:**
   ```
   Files > 10MB:
   └─ Use Wait for Completion = false
      └─ Poll separately
   ```

**Monitoring:**
```javascript
// Track metrics
{
  fileName: "document.pdf",
  fileSize: 5242880,  // bytes
  uploadStart: "2025-11-24T10:00:00Z",
  uploadEnd: "2025-11-24T10:00:45Z",
  duration: 45,  // seconds
  throughput: 116508  // bytes/second
}
```

**Prevention:**
- Test upload patterns before bulk operations
- Monitor performance metrics
- Optimize based on data
- Have fallback strategies

---

### Optimizing queries

**Best Practices:**

1. **Always use metadata filters:**
   ```
   Bad:  Query all 1000 documents
   Good: Query 50 documents matching filter

   10-20x performance improvement
   ```

2. **Organize stores by topic:**
   ```
   Instead of:
   - all-documents (mixed content)

   Use:
   - sales-2024
   - technical-docs
   - legal-contracts

   Faster, more relevant results
   ```

3. **Choose appropriate model:**
   ```
   Quick queries:  gemini-2.5-flash
   Complex queries: gemini-2.5-pro

   Flash is 2-3x faster
   ```

4. **Craft specific queries:**
   ```
   ❌ "sales info"
   ✅ "What were Q4 2024 sales figures for North America region?"

   Better results, often faster
   ```

5. **Cache common queries:**
   ```
   For frequently asked questions:
   ├─ Check cache (expire after 1 hour)
   ├─ If cached: Return cached result
   └─ If not: Query, cache, return
   ```

**Query Monitoring:**
```javascript
{
  query: "What were Q4 sales?",
  store: "fileSearchStores/sales-2024",
  filter: "customMetadata.quarter.stringValue = 'Q4'",
  model: "gemini-2.5-flash",
  duration: 2.3,  // seconds
  documentsSearched: 45,
  groundingChunks: 12
}
```

**Prevention:**
- Design metadata schema for filtering
- Monitor query performance
- Test different query formulations
- Keep stores organized and sized appropriately

---

## Getting Help

### Reporting bugs

**Before Reporting:**

1. **Verify it's a bug:**
   - Test with minimal workflow
   - Try with different parameters
   - Check if it's documented behavior

2. **Gather information:**
   - n8n version
   - Node version
   - Error message (full text)
   - Steps to reproduce
   - Expected vs. actual behavior

**Where to Report:**

1. **Node-specific issues:**
   - GitHub repository for this node
   - Include workflow JSON (remove sensitive data)
   - Attach error screenshots

2. **n8n platform issues:**
   - [n8n Community Forum](https://community.n8n.io/)
   - [n8n GitHub Issues](https://github.com/n8n-io/n8n/issues)

3. **Gemini API issues:**
   - [Google Cloud Support](https://cloud.google.com/support)
   - [Gemini API Issue Tracker](https://issuetracker.google.com/issues?q=componentid:1332519)

**Bug Report Template:**

```markdown
## Bug Description
Clear description of the issue

## Steps to Reproduce
1. Create workflow with...
2. Configure node with...
3. Execute workflow
4. See error

## Expected Behavior
What should happen

## Actual Behavior
What actually happens

## Error Message
```
Full error message here
```

## Environment
- n8n version: X.Y.Z
- Node.js version: X.Y.Z
- OS: macOS/Linux/Windows
- Node version: X.Y.Z

## Workflow JSON
```json
{...}
```

## Additional Context
Any other relevant information
```

---

### Feature requests

**How to Request:**

1. **Check existing requests:**
   - Search GitHub issues
   - Check community forum
   - May already be planned

2. **Describe use case:**
   - What you want to do
   - Why current functionality doesn't work
   - How it would help

3. **Submit request:**
   - GitHub repository (preferred)
   - Community forum
   - Include examples

**Feature Request Template:**

```markdown
## Feature Description
What feature you want

## Use Case
Why you need it, what problem it solves

## Proposed Solution
How you envision it working

## Alternatives Considered
Other ways you've tried to solve this

## Additional Context
Examples, mockups, etc.
```

---

### Community resources

**Official Documentation:**
- [Gemini File Search API Docs](https://ai.google.dev/gemini-api/docs/file-search)
- [Gemini File Search Stores API](https://ai.google.dev/api/file-search/file-search-stores)
- [n8n Documentation](https://docs.n8n.io/)
- [n8n Node Development](https://docs.n8n.io/integrations/creating-nodes/)

**Community:**
- [n8n Community Forum](https://community.n8n.io/)
- [n8n Discord](https://discord.gg/n8n)
- [n8n YouTube Channel](https://www.youtube.com/c/n8n-io)

**Code & Examples:**
- [n8n Workflow Templates](https://n8n.io/workflows/)
- [This Node's GitHub](https://github.com/your-repo-here)

**Google Resources:**
- [Google AI Studio](https://aistudio.google.com/)
- [Google Cloud Console](https://console.cloud.google.com/)
- [Google Cloud Status](https://status.cloud.google.com/)

---

### Support channels

**Free Support:**
- Community forum (best for general questions)
- GitHub issues (bugs and feature requests)
- Discord (quick questions, community help)
- Documentation and guides

**Professional Support:**
- n8n Cloud Support (for cloud customers)
- n8n Enterprise Support (for enterprise license holders)
- Google Cloud Support (for API/infrastructure issues)

**Getting Best Help:**

1. **Search first:**
   - Check documentation
   - Search existing issues
   - Review this troubleshooting guide

2. **Provide context:**
   - What you're trying to do
   - What you've tried
   - Error messages
   - Environment details

3. **Simplify:**
   - Minimal workflow that reproduces issue
   - Remove unrelated nodes
   - Remove sensitive data

4. **Be specific:**
   - "Upload fails with 503 error after 45 seconds"
   - Not: "Uploads don't work"

**Response Times:**
- Community forum: Hours to days (community-driven)
- GitHub issues: Days to weeks (maintainer availability)
- Paid support: Per SLA (24 hours or less typically)

---

## Appendix

### Quick Reference: Error Codes

| Code | Name | Common Cause | Quick Fix |
|------|------|--------------|-----------|
| 400 | Bad Request | Invalid parameters | Check request format |
| 401 | Unauthorized | Invalid API key | Verify credentials |
| 403 | Forbidden | Quota/permissions | Check quotas & billing |
| 404 | Not Found | Resource doesn't exist | Verify resource name |
| 409 | Conflict | Already exists | Use different name |
| 429 | Too Many Requests | Rate limit | Slow down, retry later |
| 500 | Internal Error | API issue | Retry with backoff |
| 503 | Service Unavailable | Temporary outage | Retry with backoff |

### Quick Reference: Document States

| State | Meaning | Action |
|-------|---------|--------|
| STATE_UNSPECIFIED | Default/unknown | Should not see this |
| STATE_PENDING | Processing | Wait (up to 30 min) |
| STATE_ACTIVE | Ready | Can query |
| STATE_FAILED | Processing error | Check error, re-upload |

### Quick Reference: Validation Rules

| Item | Validation | Example |
|------|------------|---------|
| Store Name | `fileSearchStores/[a-z0-9-]{1,40}` | `fileSearchStores/my-store-1` |
| Display Name | ≤512 characters | Any UTF-8 string |
| File Size | ≤100MB | 104,857,600 bytes |
| Metadata Items | ≤20 items | Array with max 20 objects |
| Metadata Key | Required string | `"category"` |
| Metadata Value | Exactly one type | stringValue OR numericValue OR stringListValue |

---

**Last Updated:** 2025-11-24
**Node Version:** 1.0.0
**Phase:** 4.4 - Documentation

---

For issues not covered in this guide, please refer to:
- [User Guide](./USER_GUIDE.md)
- [API Reference](./API_REFERENCE.md)
- [GitHub Issues](https://github.com/your-repo/issues)
- [n8n Community](https://community.n8n.io/)

🤖 This troubleshooting guide is maintained by Claude Code
