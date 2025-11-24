# Tutorial: Building a Knowledge Base with Gemini File Search

This comprehensive tutorial will guide you through building a production-ready knowledge base system using n8n and the Gemini File Search Tool. By the end, you'll have a searchable document repository with AI-powered question answering.

**Time Required:** 45-60 minutes
**Difficulty:** Intermediate
**Prerequisites:** Basic familiarity with n8n

---

## Table of Contents

1. [What You'll Build](#what-youll-build)
2. [Prerequisites](#prerequisites)
3. [Part 1: Setting Up Credentials](#part-1-setting-up-credentials)
4. [Part 2: Creating Your First Store](#part-2-creating-your-first-store)
5. [Part 3: Organizing Documents with Metadata](#part-3-organizing-documents-with-metadata)
6. [Part 4: Uploading Documents](#part-4-uploading-documents)
7. [Part 5: Creating Queries](#part-5-creating-queries)
8. [Part 6: Building a Q&A Interface](#part-6-building-a-qa-interface)
9. [Part 7: Advanced Metadata Strategies](#part-7-advanced-metadata-strategies)
10. [Part 8: Performance Optimization](#part-8-performance-optimization)
11. [Troubleshooting](#troubleshooting)
12. [Next Steps](#next-steps)

---

## What You'll Build

In this tutorial, you'll create a **Technical Documentation Knowledge Base** that:

- Stores technical documentation, API guides, and best practices
- Organizes documents with rich metadata (category, author, version, tags)
- Enables AI-powered search and question answering
- Filters results by metadata (e.g., "show only 2024 docs")
- Provides citations and source references
- Handles updates and document versioning

**Real-World Use Case:**

Imagine you're managing technical documentation for a software company. Your team has hundreds of documents across multiple products, versions, and categories. Instead of manually searching through files, you want developers to ask questions like:

> "How do I authenticate API requests in version 2.0?"

And get instant, accurate answers with citations.

---

## Prerequisites

### Required Software

1. **n8n** (v1.0.0 or later)
   - Self-hosted: [Installation Guide](https://docs.n8n.io/hosting/)
   - n8n Cloud: [Sign up here](https://n8n.io/cloud/)

2. **Gemini File Search Tool Nodes**
   ```bash
   npm install n8n-nodes-gemini-file-search
   ```

### Required Accounts

1. **Google AI Studio Account**
   - Sign up at: https://aistudio.google.com/
   - Get your API key: https://aistudio.google.com/app/apikey

### Recommended Knowledge

- Basic n8n workflow creation
- Understanding of JSON data structures
- Basic knowledge of API concepts

### Sample Documents

For this tutorial, prepare 3-5 sample documents:
- **Format:** PDF, TXT, MD, or DOCX
- **Size:** Less than 10MB each (for faster testing)
- **Content:** Technical documentation, guides, or articles
- **Example Topics:** API documentation, deployment guides, architecture overviews

> **Tip:** If you don't have documents ready, you can create simple Markdown files with technical content for testing.

---

## Part 1: Setting Up Credentials

### Step 1.1: Get Your Gemini API Key

1. **Navigate to Google AI Studio**
   - Go to: https://aistudio.google.com/app/apikey

2. **Create or Select a Project**
   - If prompted, create a new Google Cloud project or select an existing one

3. **Generate API Key**
   - Click "Create API Key"
   - Select your project
   - Copy the generated API key (starts with `AIzaSy...`)

> **Security Note:** Never commit API keys to version control or share them publicly. Store them securely.

### Step 1.2: Add Credential to n8n

1. **Open n8n Credentials Page**
   - In n8n, click "Credentials" in the left sidebar
   - Or navigate to: `http://localhost:5678/credentials`

2. **Create New Credential**
   - Click the "+ Add Credential" button (top-right)
   - Search for "Gemini API" in the credential list
   - Click to select it

3. **Configure Credential**
   - **API Key:** Paste your Gemini API key
   - **Credential Name:** Enter a descriptive name (e.g., "Gemini API - Production")

   ![Screenshot location: Credential configuration form with API key field]

4. **Test Connection (Optional)**
   - Some versions of n8n allow testing the connection
   - If available, click "Test" to verify the API key works

5. **Save Credential**
   - Click "Create" to save the credential

> **Success Indicator:** The credential should appear in your credentials list with a green checkmark.

---

## Part 2: Creating Your First Store

A **File Search Store** is a container for your documents. Think of it as a database where your documents are indexed and made searchable.

### Step 2.1: Create a New Workflow

1. **Open n8n**
   - Navigate to: `http://localhost:5678`

2. **Create Workflow**
   - Click "Workflows" in the left sidebar
   - Click "+ Add Workflow"
   - Give it a name: "Technical Documentation Knowledge Base"

### Step 2.2: Add Manual Trigger

1. **Add Trigger Node**
   - Click the "+" button on the canvas
   - Search for "Manual Trigger"
   - Select "When clicking 'Test workflow'"

2. **Position the Node**
   - Drag it to the left side of the canvas
   - This will be our workflow starting point

   ![Screenshot location: Canvas with Manual Trigger node]

### Step 2.3: Add Create Store Node

1. **Add Gemini Store Node**
   - Click the "+" button to the right of the Manual Trigger
   - Search for "Gemini File Search Stores"
   - Select the node

2. **Configure the Node**
   - **Operation:** Create (already selected)
   - **Display Name:** "Technical Documentation Store"

   ![Screenshot location: Store node configuration panel]

3. **Assign Credential**
   - In the "Credential to connect with" dropdown
   - Select the Gemini API credential you created earlier

4. **Add Node Description (Optional)**
   - Click the "Notes" tab
   - Add: "Creates the main store for all technical documentation"

### Step 2.4: Test Store Creation

1. **Execute the Workflow**
   - Click "Execute Workflow" button (top-right)
   - Or press Ctrl/Cmd + Enter

2. **Verify Success**
   - The node should turn green
   - Click the node to view output
   - You should see JSON with:
     ```json
     {
       "name": "fileSearchStores/abc123...",
       "displayName": "Technical Documentation Store",
       "createTime": "2024-11-24T...",
       "updateTime": "2024-11-24T..."
     }
     ```

3. **Note the Store Name**
   - Copy the `name` field (e.g., `fileSearchStores/abc123...`)
   - You'll use this to reference the store in subsequent operations

> **Troubleshooting:** If you get an error:
> - Verify your API key is correct
> - Check your internet connection
> - Ensure you have API quota available

---

## Part 3: Organizing Documents with Metadata

Metadata is the key to building a powerful, searchable knowledge base. Good metadata enables precise filtering and better search results.

### Step 3.1: Design Your Metadata Schema

For a technical documentation knowledge base, here's a recommended metadata schema:

| Field | Type | Purpose | Example |
|-------|------|---------|---------|
| `category` | string | Document type | "api-guide", "deployment", "architecture" |
| `product` | string | Product name | "auth-service", "payment-api" |
| `version` | string | Product version | "2.0", "3.1", "latest" |
| `author` | string | Author name | "Jane Doe", "DevOps Team" |
| `year` | number | Publication year | 2024, 2023 |
| `status` | string | Document status | "draft", "published", "deprecated" |
| `tags` | stringList | Topic tags | ["authentication", "oauth", "jwt"] |
| `difficulty` | string | Complexity level | "beginner", "intermediate", "advanced" |
| `lastUpdated` | string | Last update date | "2024-11-24" |

### Step 3.2: Metadata Best Practices

**DO:**
- ✅ Use consistent naming conventions (lowercase, kebab-case)
- ✅ Limit to 20 metadata keys per document (Gemini API limit)
- ✅ Use descriptive, searchable values
- ✅ Include version information for docs that change
- ✅ Add multiple tags for better discoverability

**DON'T:**
- ❌ Use special characters in keys or values (except hyphens, underscores)
- ❌ Store large text blocks in metadata (use document content instead)
- ❌ Use inconsistent value formats (e.g., "v2.0" vs "2.0" vs "version-2")
- ❌ Leave important fields empty

### Step 3.3: Create a Metadata Template

Create a reusable metadata structure for your documents:

```javascript
// Metadata template for technical documentation
{
  "category": "api-guide",           // Document category
  "product": "auth-service",         // Which product/service
  "version": "2.0",                  // Product version
  "author": "Jane Doe",              // Document author
  "year": 2024,                      // Publication year
  "status": "published",             // Current status
  "tags": ["authentication", "oauth", "jwt", "security"],  // Topics
  "difficulty": "intermediate",      // Complexity level
  "lastUpdated": "2024-11-24",      // Last modified date
  "language": "en"                   // Document language
}
```

> **Tip:** Save this template in a note or comment for reference when uploading documents.

---

## Part 4: Uploading Documents

Now let's upload documents with rich metadata.

### Step 4.1: Prepare Your Documents

For this tutorial, we'll upload 3 sample documents:

1. **API Authentication Guide** (api-auth.pdf)
2. **Deployment Best Practices** (deployment-guide.md)
3. **Architecture Overview** (architecture-v2.pdf)

> **Note:** You can use any documents you have available. Adjust metadata accordingly.

### Step 4.2: Add Read Binary File Nodes

1. **Add First Read Binary Node**
   - Click "+" after the "Create Store" node
   - Search for "Read Binary File"
   - Select the node

2. **Configure the Node**
   - **File Path:** Enter the full path to your first document
     ```
     /Users/your-username/Documents/api-auth.pdf
     ```
   - **Property Name:** `data` (default)

   ![Screenshot location: Read Binary File node configuration]

3. **Add Notes**
   - Click "Notes" tab
   - Add: "Loads API Authentication Guide"

4. **Duplicate for Other Documents**
   - Right-click the node → Duplicate
   - Move the duplicated node below
   - Update the file path for your second document
   - Repeat for third document

### Step 4.3: Add Upload Document Nodes

1. **Add Upload Node**
   - Click "+" after the first "Read Binary File" node
   - Search for "Gemini File Search Documents"
   - Select the node

2. **Configure Basic Settings**
   - **Operation:** Upload
   - **Store:** `={{$node["Create Store"].json.name}}`
     - This expression references the store created earlier
   - **Input Binary Field:** `data`

3. **Set Display Name**
   - **Display Name:** "API Authentication Guide"

   ![Screenshot location: Upload node basic configuration]

### Step 4.4: Add Metadata to Upload

1. **Click "Add Metadata"** (in Custom Metadata section)

2. **Add First Metadata Entry**
   - **Key:** `category`
   - **Value Type:** String
   - **Value:** `api-guide`

3. **Add More Metadata Entries**
   - Click "+ Add Metadata" for each field
   - Enter the following:

   | Key | Value Type | Value |
   |-----|------------|-------|
   | `category` | String | `api-guide` |
   | `product` | String | `auth-service` |
   | `version` | String | `2.0` |
   | `author` | String | `Jane Doe` |
   | `year` | Number | `2024` |
   | `status` | String | `published` |
   | `tags` | String List | `authentication,oauth,jwt,security` |
   | `difficulty` | String | `intermediate` |

   ![Screenshot location: Metadata configuration panel showing multiple entries]

### Step 4.5: Configure Chunking Options

Chunking splits documents into smaller pieces for better retrieval.

1. **Expand "Chunking Options"**

2. **Set Parameters**
   - **Max Tokens Per Chunk:** `200`
     - Good balance for technical docs
     - Adjust based on document density
   - **Max Overlap Tokens:** `20`
     - Provides context between chunks

> **Chunking Tips:**
> - **Small chunks (100-150):** Better for specific facts and code snippets
> - **Medium chunks (200-300):** Good for technical explanations
> - **Large chunks (400-500):** Better for conceptual overviews
> - **Overlap:** Use 10-20% of chunk size to maintain context

### Step 4.6: Enable Wait for Completion

1. **Toggle "Wait for Completion"** to ON
   - This ensures the upload fully completes before proceeding
   - Important for sequential operations

### Step 4.7: Duplicate and Configure Remaining Uploads

1. **Duplicate the Upload Node**
   - Right-click → Duplicate
   - Move below the other nodes

2. **Update for Second Document**
   - **Display Name:** "Deployment Best Practices"
   - **Metadata:**
     - `category`: `deployment-guide`
     - `product`: `infrastructure`
     - `version`: `latest`
     - `author`: `DevOps Team`
     - `year`: `2024`
     - `status`: `published`
     - `tags`: `deployment,kubernetes,docker,cicd`
     - `difficulty`: `advanced`

3. **Update for Third Document**
   - **Display Name:** "Architecture Overview v2"
   - **Metadata:**
     - `category`: `architecture`
     - `product`: `platform`
     - `version`: `2.0`
     - `author`: `Architecture Team`
     - `year`: `2024`
     - `status`: `published`
     - `tags`: `architecture,microservices,system-design`
     - `difficulty`: `intermediate`

### Step 4.8: Connect Read Binary to Upload Nodes

1. **Connect Nodes**
   - From "Create Store" node → Draw 3 connections to each "Read Binary File" node
   - From each "Read Binary File" node → Connect to corresponding "Upload Document" node

   ![Screenshot location: Workflow showing parallel upload structure]

### Step 4.9: Test Document Upload

1. **Execute Workflow**
   - Click "Execute Workflow"

2. **Monitor Progress**
   - Watch each node turn green as it completes
   - Upload nodes may take 10-30 seconds each

3. **Verify Output**
   - Click each Upload node to see the response
   - Look for:
     ```json
     {
       "name": "fileSearchStores/.../documents/...",
       "displayName": "API Authentication Guide",
       "state": "ACTIVE",
       ...
     }
     ```

4. **Check for Errors**
   - Red nodes indicate failures
   - Click to see error details
   - Common issues:
     - File not found → Check file path
     - API quota exceeded → Wait and retry
     - Invalid metadata → Check field types

> **Success:** All three upload nodes should be green with "ACTIVE" state.

---

## Part 5: Creating Queries

Now that documents are uploaded, let's query them.

### Step 5.1: Add Merge Node

Since we have 3 parallel upload operations, we need to wait for all to complete.

1. **Add Merge Node**
   - Click "+" on the canvas
   - Search for "Merge"
   - Select "Merge" node

2. **Configure Merge**
   - **Mode:** "Merge By Position"
   - This waits for all inputs before proceeding

3. **Connect Upload Nodes**
   - Connect all 3 Upload nodes to the Merge node

   ![Screenshot location: Merge node with 3 input connections]

### Step 5.2: Add Query Node

1. **Add Query Node**
   - Click "+" after the Merge node
   - Search for "Gemini File Search Documents"
   - Select the node

2. **Configure Query Operation**
   - **Operation:** Query

3. **Select Model**
   - **Model:** Gemini 2.5 Flash
     - Fast and cost-effective
     - Good for most queries
   - Alternative: Gemini 2.5 Pro (more accurate, slower)

   ![Screenshot location: Query node configuration showing model selection]

### Step 5.3: Write Your First Query

1. **Enter Query Text**
   - **Query:**
     ```
     What are the recommended authentication methods for the Auth Service API v2.0?
     ```

2. **Specify Store Names**
   - **Store Names:** `={{$node["Create Store"].json.name}}`
   - This references the store we created

3. **Leave Metadata Filter Empty** (for now)
   - We'll add filters in the next section

### Step 5.4: Add Result Formatting

1. **Add Set Node**
   - Click "+" after the Query node
   - Search for "Set" (now called "Edit Fields")
   - Select the node

2. **Extract Key Fields**
   - Click "+ Add Field"
   - Add the following fields:

   | Field Name | Value (Expression) |
   |------------|-------------------|
   | `answer` | `={{$json.candidates[0].content.parts[0].text}}` |
   | `query` | `What are the recommended authentication methods?` |
   | `model` | `gemini-2.5-flash` |
   | `storeName` | `={{$node["Create Store"].json.name}}` |
   | `citations` | `={{$json.candidates[0].groundingMetadata}}` |

   ![Screenshot location: Set node showing field mappings]

### Step 5.5: Test the Query

1. **Execute Workflow**
   - Click "Execute Workflow"

2. **View Results**
   - Click the "Set" node
   - Click "Table" or "JSON" view
   - You should see:
     - **answer:** The AI-generated response
     - **citations:** Source documents with page numbers
     - **query:** Your original question

3. **Review the Answer**
   - The AI should reference your uploaded documents
   - Citations show which documents were used
   - Grounding metadata includes chunk references

> **Example Output:**
> ```json
> {
>   "answer": "According to the API Authentication Guide, the Auth Service API v2.0 supports three authentication methods: OAuth 2.0, JWT tokens, and API keys. OAuth 2.0 is recommended for user-facing applications...",
>   "query": "What are the recommended authentication methods?",
>   "model": "gemini-2.5-flash",
>   "citations": {
>     "groundingChunks": [
>       {
>         "documentName": "fileSearchStores/.../documents/...",
>         "pageNumber": 1
>       }
>     ]
>   }
> }
> ```

---

## Part 6: Building a Q&A Interface

Let's enhance the workflow to handle multiple queries and present results nicely.

### Step 6.1: Add Multiple Query Branches

1. **Duplicate Query Node**
   - Right-click the Query node → Duplicate
   - Create 2 more copies

2. **Update Each Query**

   **Query 2:**
   - **Query:** "What are the deployment best practices for Kubernetes?"
   - **Metadata Filter:** `category="deployment-guide"`

   **Query 3:**
   - **Query:** "Explain the microservices architecture used in v2.0"
   - **Metadata Filter:** `category="architecture" AND version="2.0"`

3. **Connect All Queries**
   - Connect the Merge node to all 3 Query nodes in parallel

   ![Screenshot location: Workflow showing 3 parallel query branches]

### Step 6.2: Add Result Aggregation

1. **Add Second Merge Node**
   - After all query nodes
   - Connect all query outputs to this merge

2. **Add Code Node for Report**
   - Click "+" after the second Merge node
   - Search for "Code"
   - Select "Code" node

3. **Generate Summary Report**
   - Paste the following JavaScript:

   ```javascript
   const items = $input.all();

   const results = items.map((item, index) => ({
     questionNumber: index + 1,
     query: item.json.query || 'Unknown query',
     answer: item.json.candidates?.[0]?.content?.parts?.[0]?.text || 'No answer',
     documentCount: item.json.candidates?.[0]?.groundingMetadata?.groundingChunks?.length || 0,
     model: 'gemini-2.5-flash'
   }));

   const summary = {
     totalQueries: results.length,
     storeName: $node["Create Store"].json.name,
     timestamp: new Date().toISOString(),
     results: results
   };

   return { json: summary };
   ```

   ![Screenshot location: Code node with JavaScript]

### Step 6.3: Add Display Node

1. **Add Sticky Note**
   - Click the sticky note icon in the toolbar
   - Drag to create a note next to the Code node

2. **Add Display Template**
   - Paste the following in the sticky note:

   ```markdown
   ## Knowledge Base Q&A Results

   **Store:** {{$json.storeName}}
   **Queries Executed:** {{$json.totalQueries}}
   **Timestamp:** {{$json.timestamp}}

   ---

   {{$json.results.forEach(r => `
   ### Question ${r.questionNumber}
   **Q:** ${r.query}

   **A:** ${r.answer}

   **Sources:** ${r.documentCount} documents
   **Model:** ${r.model}

   ---
   `)}}
   ```

   ![Screenshot location: Sticky note with formatted results]

### Step 6.4: Test Complete Q&A Workflow

1. **Execute Workflow**
   - Click "Execute Workflow"
   - All nodes should execute in sequence

2. **Review Results**
   - Check the Code node output
   - Review the sticky note display
   - Verify all 3 queries have answers

3. **Save the Workflow**
   - Click "Save" in the top-right
   - Give it a final name: "Technical Docs Knowledge Base - Complete"

---

## Part 7: Advanced Metadata Strategies

### Step 7.1: Version-Based Filtering

For documentation that changes across versions:

**Metadata Strategy:**
```javascript
{
  "version": "2.0",          // Current version
  "minVersion": "2.0",       // Minimum applicable version
  "maxVersion": "2.5",       // Maximum applicable version
  "deprecated": "false"      // Deprecation flag
}
```

**Query Filter:**
```
version="2.0" AND deprecated="false"
```

**Use Case:** Show only current, non-deprecated documentation.

### Step 7.2: Multi-Product Organization

For companies with multiple products:

**Metadata Strategy:**
```javascript
{
  "product": "auth-service",
  "productLine": "security",
  "team": "platform-team",
  "audience": "developers"
}
```

**Query Filter:**
```
productLine="security" AND audience="developers"
```

**Use Case:** Filter docs by product line and intended audience.

### Step 7.3: Time-Based Content

For content that becomes outdated:

**Metadata Strategy:**
```javascript
{
  "publishDate": "2024-01-15",
  "lastReviewed": "2024-11-01",
  "expiryDate": "2025-12-31",
  "freshness": "current"      // current, review-needed, outdated
}
```

**Query Filter:**
```
freshness="current" AND lastReviewed>="2024-01-01"
```

**Use Case:** Show only recently reviewed, current documentation.

### Step 7.4: Access Control Hints

**Note:** Gemini File Search doesn't enforce access control, but you can use metadata as hints:

**Metadata Strategy:**
```javascript
{
  "visibility": "public",      // public, internal, confidential
  "requiredRole": "developer", // viewer, developer, admin
  "department": "engineering"
}
```

**Query Filter:**
```
visibility="public" OR visibility="internal"
```

**Use Case:** Filter content by visibility level (enforce access control in your application layer).

---

## Part 8: Performance Optimization

### Step 8.1: Optimize Chunking

**Test Different Chunk Sizes:**

1. Create test workflows with different settings:
   - Small: 100 tokens, 10 overlap
   - Medium: 200 tokens, 20 overlap (recommended)
   - Large: 400 tokens, 40 overlap

2. Run the same query against each
3. Compare:
   - Answer quality
   - Response time
   - Citation accuracy

**Recommendations:**
- **Code documentation:** 100-150 tokens
- **Technical explanations:** 200-300 tokens
- **Conceptual overviews:** 300-500 tokens

### Step 8.2: Choose the Right Model

| Model | Speed | Cost | Accuracy | Use Case |
|-------|-------|------|----------|----------|
| Gemini 2.5 Flash | Fast | Low | Good | General queries, high volume |
| Gemini 2.5 Pro | Slower | Medium | Better | Complex queries, detailed analysis |
| Gemini 3 Pro Preview | Slowest | Higher | Best | Critical queries, maximum accuracy |

**Strategy:**
- Use Flash for routine queries
- Use Pro for complex analysis
- Use Preview for critical decision-making

### Step 8.3: Batch Operations

For bulk uploads, use parallel processing:

1. **Read all files** → List Files node
2. **Filter by type** → IF node
3. **Process in batches of 5** → Split In Batches node
4. **Upload in parallel** → Upload Document node
5. **Add delays between batches** → Wait node (5-10 seconds)

**Benefits:**
- Faster total processing time
- Avoid rate limits
- Better error handling per batch

### Step 8.4: Caching Strategy

For frequently asked questions:

1. **Store Query Results**
   - Use n8n Database node or external DB
   - Cache results by query hash

2. **Check Cache First**
   - IF node: Check if query exists in cache
   - Return cached result if found
   - Query Gemini if not cached

3. **Set Cache Expiry**
   - Invalidate cache after 24 hours
   - Or when documents are updated

**Benefits:**
- Instant responses for common queries
- Reduced API costs
- Lower rate limit usage

---

## Troubleshooting

### Issue: "Store not found"

**Symptoms:** Query fails with "Store does not exist"

**Solutions:**
1. Verify store was created successfully
2. Check store name is correct in query node
3. Ensure store wasn't deleted
4. Try creating a new store

---

### Issue: "No documents found"

**Symptoms:** Query returns empty or generic answers

**Solutions:**
1. Verify documents uploaded successfully (check upload node output)
2. Wait 1-2 minutes for indexing to complete
3. Check metadata filters aren't too restrictive
4. Verify query matches document content

---

### Issue: "Rate limit exceeded"

**Symptoms:** API returns 429 error

**Solutions:**
1. Add Wait nodes between operations (5-10 seconds)
2. Reduce parallel operations
3. Check your API quota
4. Upgrade API tier if needed

---

### Issue: "Upload takes too long"

**Symptoms:** Upload nodes timeout or take >60 seconds

**Solutions:**
1. Reduce document size (< 10MB)
2. Optimize PDFs (remove images, compress)
3. Use smaller chunk sizes
4. Upload fewer documents in parallel

---

### Issue: "Poor answer quality"

**Symptoms:** AI responses are vague or incorrect

**Solutions:**
1. Improve document content quality
2. Add more specific metadata
3. Refine metadata filters
4. Adjust chunk size (try 300-400 tokens)
5. Use Gemini 2.5 Pro model
6. Rephrase your query to be more specific

---

### Issue: "Metadata filter not working"

**Symptoms:** Filter returns wrong documents

**Solutions:**
1. Check filter syntax (use AIP-160 format)
2. Verify metadata keys match exactly (case-sensitive)
3. Use quotes for string values: `category="api-guide"`
4. Use correct operators: `=`, `>`, `>=`, `<`, `<=`, `:`
5. Test without filter first to verify documents exist

---

## Next Steps

Congratulations! You've built a fully functional knowledge base. Here's what to do next:

### 1. Production Deployment

**Convert to Webhook Trigger:**
- Replace Manual Trigger with Webhook node
- Create API endpoint for queries
- Add authentication (API key or OAuth)

**Add Error Handling:**
- Enable "Continue On Fail" on critical nodes
- Add error notification (Email, Slack)
- Log errors to database or file

**Scale Your Store:**
- Upload full document collection
- Organize by categories
- Create multiple stores for different teams/products

### 2. Advanced Features

**Auto-Update Documents:**
- Schedule workflow to check for updated docs
- Re-upload modified documents
- Maintain version history

**Multi-Language Support:**
- Add `language` metadata field
- Filter queries by language
- Provide language-specific stores

**Analytics Dashboard:**
- Track query frequency
- Monitor popular topics
- Identify knowledge gaps

### 3. Integration

**Connect to Applications:**
- Slack bot for team queries
- Website chatbot widget
- VS Code extension
- Mobile app

**Sync with Documentation Platforms:**
- Confluence integration
- GitHub wiki sync
- Notion database sync

### 4. Explore Advanced Workflows

Check out these example workflows:
- [Bulk Document Upload](../examples/bulk-document-upload.json)
- [Filtered Search](../examples/filtered-search.json)
- [Auto-Categorization](../examples/auto-categorization.json)

---

## Best Practices Summary

### Document Organization
- ✅ Use consistent metadata schema
- ✅ Include version information
- ✅ Add comprehensive tags
- ✅ Keep metadata up to date

### Query Design
- ✅ Write specific, clear questions
- ✅ Use metadata filters to narrow results
- ✅ Choose appropriate model for query complexity
- ✅ Test queries iteratively

### Performance
- ✅ Optimize chunk sizes for your content
- ✅ Use Gemini 2.5 Flash for most queries
- ✅ Cache frequent queries
- ✅ Batch upload operations

### Maintenance
- ✅ Regularly review and update documents
- ✅ Monitor API usage and costs
- ✅ Track query analytics
- ✅ Deprecate outdated content

---

## Additional Resources

### Documentation
- [Gemini File Search API Documentation](https://ai.google.dev/gemini-api/docs/file-search)
- [n8n Workflow Documentation](https://docs.n8n.io/)
- [Store Operations Reference](../nodes/gemini-file-search-stores.md)
- [Document Operations Reference](../nodes/gemini-file-search-documents.md)

### Community
- [n8n Community Forum](https://community.n8n.io/)
- [Gemini API Discord](https://discord.gg/google-gemini)
- [Stack Overflow - n8n tag](https://stackoverflow.com/questions/tagged/n8n)

### Support
- [Report Issues](https://github.com/your-repo/issues)
- [Request Features](https://github.com/your-repo/discussions)
- [Read Troubleshooting Guide](../TROUBLESHOOTING.md)

---

## Conclusion

You've successfully built a production-ready knowledge base system! You now have:

- ✅ A searchable document repository
- ✅ AI-powered question answering
- ✅ Rich metadata organization
- ✅ Filtering and search capabilities
- ✅ Scalable architecture

Keep experimenting, adding documents, and refining your queries. The more you use the system, the better you'll understand how to optimize it for your specific needs.

Happy building! 🚀

---

**Tutorial Version:** 1.0.0
**Last Updated:** 2025-11-24
**Estimated Completion Time:** 45-60 minutes

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
