# n8n Gemini File Search - Example Workflows

This directory contains ready-to-use n8n workflow examples demonstrating various use cases for the Gemini File Search Tool nodes.

---

## Available Examples

### 1. Basic RAG Workflow
**File:** `basic-rag-workflow.json`

**Description:**
A complete RAG (Retrieval-Augmented Generation) workflow that demonstrates the core functionality:
- Creates a File Search store
- Uploads 3 documents with metadata (category, author, year, tags)
- Queries the documents using Gemini AI
- Formats and displays results with citations

**Use Case:**
Building a simple knowledge base for technical documentation where you can ask questions and get AI-generated answers based on your documents.

**What You'll Learn:**
- How to create and configure a File Search store
- How to upload documents with rich metadata
- How to query documents and get AI-generated responses
- How to extract and format results with citations

---

### 2. Bulk Document Upload
**File:** `bulk-document-upload.json`

**Description:**
An advanced workflow for uploading multiple documents from a directory with automated metadata extraction and progress tracking:
- Reads all files from a specified directory
- Filters by supported file types (PDF, TXT, MD, DOC, DOCX)
- Extracts metadata from file paths and names
- Uploads each document with error handling
- Generates a comprehensive report with success/failure statistics

**Use Case:**
Migrating a large collection of documents into a File Search store, such as importing an existing documentation library or research paper collection.

**What You'll Learn:**
- How to process multiple files in a loop
- How to extract metadata from filenames and paths
- How to implement robust error handling with `continueOnFail`
- How to track progress and generate reports
- How to handle upload failures gracefully

---

### 3. Gemini File Search AI Agent
**File:** `gemini-file-search-ai-agent.json`

**Description:**
A complete workflow that uses Gemini File Search as an AI Model (not a tool), enabling **single API call** RAG queries. This approach eliminates the double LLM call overhead when using File Search as a tool.

**Use Case:**
Building conversational AI agents that can answer questions based on your document knowledge base with minimal API calls and latency.

**What You'll Learn:**
- How to create a custom LangChain chat model
- How to integrate with n8n's AI Agent node
- How to extract and format grounding metadata (citations)
- How to achieve single-call RAG vs tool-based RAG

**Requirements:**
- n8n **self-hosted** (LangChain Code Node not available on Cloud)
- Gemini API key
- Pre-created File Search Store with documents

**Key Features:**
- Custom `GeminiFileSearchChatModel` class extending LangChain's `BaseChatModel`
- Pre-configured `fileSearch` tool embedded in the model
- Citation extraction and formatting
- Token usage tracking

---

### 4. Filtered Search
**File:** `filtered-search.json`

**Description:**
Demonstrates advanced metadata filtering capabilities:
- Uploads 5 research papers with rich metadata (author, category, year, difficulty, tags, citations)
- Executes 4 different queries with various metadata filters
- Shows different filter operators (=, >, >=, AND, OR, :)
- Exports results to both JSON and CSV formats

**Use Case:**
Building a searchable research paper database where you can filter by author, publication year, difficulty level, citation count, and topic categories.

**What You'll Learn:**
- How to structure metadata for effective filtering
- How to write metadata filter expressions (AIP-160 format)
- How to use comparison operators (=, >, >=, <, <=)
- How to use logical operators (AND, OR, NOT)
- How to use the contains operator (:) for string lists
- How to export search results to different formats

---

## Prerequisites

Before importing these workflows, ensure you have:

1. **n8n Installed**
   - Self-hosted: [Installation Guide](https://docs.n8n.io/hosting/)
   - n8n Cloud: [Sign up here](https://n8n.io/cloud/)

2. **Gemini API Credentials**
   - Get your API key from [Google AI Studio](https://aistudio.google.com/app/apikey)
   - See [Credential Setup](#credential-setup) below

3. **Gemini File Search Tool Nodes Installed**
   - Install via npm: `npm install n8n-nodes-gemini-file-search`
   - Or add to your n8n installation's `package.json`

4. **Sample Documents** (for testing)
   - Prepare 3-5 text documents (PDF, TXT, MD, etc.)
   - Documents should contain meaningful content for testing queries

---

## How to Import Workflows

### Method 1: Import via n8n UI (Recommended)

1. **Open n8n**
   - Navigate to your n8n instance (e.g., `http://localhost:5678`)

2. **Access Workflows**
   - Click on "Workflows" in the left sidebar
   - Click the "+" button or "Add Workflow" to create a new workflow

3. **Import JSON**
   - Click the three-dot menu (⋮) in the top-right corner
   - Select "Import from File" or "Import from URL"
   - Choose the example workflow JSON file

4. **Save the Workflow**
   - Click "Save" to store the imported workflow
   - Give it a meaningful name if you want to customize it

### Method 2: Copy-Paste JSON

1. **Open the JSON File**
   - Open one of the example files in a text editor
   - Copy the entire JSON content

2. **Create New Workflow**
   - In n8n, create a new workflow
   - Click the three-dot menu (⋮) → "Import from File"
   - Paste the JSON content

3. **Save**
   - Click "Save" to store the workflow

### Method 3: Use n8n CLI

```bash
# If you have n8n CLI installed
n8n import:workflow --input=basic-rag-workflow.json
```

---

## Credential Setup

After importing a workflow, you need to configure the Gemini API credentials:

### Step 1: Create Gemini API Credential

1. **Open Credentials**
   - In n8n, click "Credentials" in the left sidebar
   - Click "+ Add Credential"

2. **Select Gemini API**
   - Search for "Gemini API" in the credential list
   - Click to select it

3. **Enter API Key**
   - **API Key:** Paste your Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey)
   - **Credential Name:** Give it a descriptive name (e.g., "Gemini API - Production")

4. **Save**
   - Click "Create" to save the credential

### Step 2: Assign Credentials to Nodes

1. **Open the Imported Workflow**
   - Navigate to the workflow you just imported

2. **Configure Each Node**
   - Click on each Gemini node (they may show a red warning icon)
   - In the node settings, find the "Credential to connect with" dropdown
   - Select the Gemini API credential you created

3. **Save the Workflow**
   - Save the workflow after configuring all nodes

---

## Running the Examples

### Basic RAG Workflow

1. **Prepare Documents**
   - Have 3 sample documents ready (e.g., technical guides, research papers)

2. **Configure Binary Data**
   - The workflow expects documents to be provided as binary data
   - You can use a "Read Binary File" node before the upload nodes
   - Or manually upload via the n8n UI when testing

3. **Execute Workflow**
   - Click "Execute Workflow" or "Test workflow"
   - Watch the nodes execute in sequence
   - Check the "Display Results" sticky note for the query output

4. **View Results**
   - The final node shows the AI-generated answer
   - Citations and grounding metadata are included
   - You can modify the query to ask different questions

**Expected Results:**
- Store created successfully
- 3 documents uploaded with metadata
- Query returns an AI-generated answer with citations
- Execution time: ~2-3 minutes (depending on document size)

---

### Bulk Document Upload

1. **Update Directory Path**
   - Edit the "List Files in Directory" node
   - Change the path to your documents folder:
     ```
     /Users/your-username/Documents/research-papers
     ```

2. **Adjust File Type Filter**
   - Edit the "Filter Supported Files" node if needed
   - Current regex: `^(pdf|txt|md|doc|docx)$`
   - Add or remove file extensions as needed

3. **Execute Workflow**
   - Click "Execute Workflow"
   - Monitor progress in the execution log
   - Check the final report for statistics

4. **Review Report**
   - The "Generate Report" node outputs:
     - Total files processed
     - Successful uploads
     - Failed uploads (with error details)
     - Skipped files (unsupported types)

**Expected Results:**
- Store created successfully
- All supported files uploaded with auto-generated metadata
- Detailed report with success rate
- Error handling for unsupported files
- Execution time: ~10-30 seconds per document

**Troubleshooting:**
- **"Directory not found"**: Verify the directory path exists
- **"Permission denied"**: Ensure n8n has read access to the directory
- **"Upload failed"**: Check document size (must be < 50MB per file)
- **All files skipped**: Verify your files match the filter regex

---

### Filtered Search

1. **Prepare Sample Documents**
   - Have 5 sample documents ready
   - Or modify the workflow to use fewer documents

2. **Update Binary Data Sources**
   - Each "Upload Paper" node expects binary data
   - Add "Read Binary File" nodes before each upload
   - Or upload via the UI during testing

3. **Execute Workflow**
   - Click "Execute Workflow"
   - All 5 uploads will execute in parallel
   - 4 queries will run with different filters

4. **Review Query Results**
   - Each query demonstrates different filter syntax
   - Check the "Filter Syntax Guide" sticky note for reference
   - Results are exported to JSON and CSV

5. **Customize Filters**
   - Edit any query node to try different filters
   - Examples:
     ```
     difficulty="beginner" AND year>=2024
     category="transformers" OR tags:"attention"
     author="Dr. Sarah Johnson" AND citations>150
     category="computer-vision" AND year=2023
     ```

**Expected Results:**
- 5 documents uploaded with rich metadata
- 4 queries return filtered results
- Each query only searches documents matching the filter
- Results exported to both JSON and CSV
- Execution time: ~3-5 minutes total

**Metadata Filter Examples:**

| Filter | Description |
|--------|-------------|
| `author="John Doe"` | Exact match on author field |
| `year>=2024` | Papers from 2024 or later |
| `citations>100` | Papers with more than 100 citations |
| `tags:"machine-learning"` | Papers with "machine-learning" in tags list |
| `category="ai" AND year=2023` | AI papers from 2023 |
| `difficulty="beginner" OR difficulty="intermediate"` | Beginner or intermediate papers |

---

## Customizing the Examples

### Changing Node Parameters

1. **Store Names**
   - Edit the "Create Store" node's `displayName` parameter
   - Update subsequent nodes to use the new store name

2. **Document Metadata**
   - Edit the "Upload Document" nodes
   - Add/remove metadata fields in the "Custom Metadata" section
   - Remember: max 20 metadata keys per document

3. **Query Parameters**
   - Edit the "Query Documents" node
   - Change the `query` text to ask different questions
   - Change the `model` to use different Gemini models:
     - `gemini-2.5-flash` (fast, cost-effective)
     - `gemini-2.5-pro` (more accurate, detailed)
     - `gemini-3-pro-preview` (latest features)

4. **Metadata Filters**
   - Edit the `metadataFilter` parameter
   - Use AIP-160 filter syntax (see examples above)
   - Test filters incrementally to verify syntax

### Adding Error Handling

Enable "Continue On Fail" on any node to handle errors gracefully:

1. Click the node
2. Go to "Settings" tab
3. Toggle "Continue On Fail" to ON
4. Add an "IF" node after to check for errors:
   ```
   {{$json.error !== undefined}}
   ```

### Scheduling Workflows

To run workflows automatically:

1. Replace "Manual Trigger" with a trigger node:
   - **Cron**: Run on a schedule (e.g., daily at 3 AM)
   - **Webhook**: Trigger via HTTP request
   - **Email**: Trigger when email arrives

2. Configure the trigger parameters

3. Activate the workflow (toggle in top-right)

---

## Troubleshooting Common Import Issues

### Issue 1: "Missing node type"

**Cause:** The Gemini File Search nodes are not installed.

**Solution:**
```bash
# Install the nodes
cd ~/.n8n/nodes
npm install n8n-nodes-gemini-file-search

# Restart n8n
n8n restart
```

### Issue 2: "Credential required"

**Cause:** No Gemini API credential is configured.

**Solution:**
Follow the [Credential Setup](#credential-setup) section above.

### Issue 3: "Invalid JSON"

**Cause:** The JSON file is corrupted or incomplete.

**Solution:**
- Re-download the JSON file
- Verify the file is complete (should start with `{` and end with `}`)
- Check for syntax errors using a JSON validator

### Issue 4: "Node execution failed"

**Cause:** Various reasons (missing data, API errors, etc.)

**Solution:**
- Click on the failed node to see the error message
- Check the node's configuration
- Verify API credentials are valid
- Check network connectivity

### Issue 5: "Binary data not found"

**Cause:** Upload nodes expect binary data that isn't present.

**Solution:**
- Add "Read Binary File" nodes before upload nodes
- Configure the binary property name correctly
- Ensure the file path is correct

### Issue 6: "Rate limit exceeded"

**Cause:** Too many API requests in a short time.

**Solution:**
- Add delay nodes between operations
- Reduce the number of parallel uploads
- Check your Gemini API quota and limits

---

## Best Practices

### 1. Test with Small Data First

Start with 1-2 documents to verify the workflow works before processing large batches.

### 2. Use Descriptive Metadata

Good metadata makes filtering more powerful:
- Use consistent naming conventions
- Include searchable fields (author, year, category)
- Add tags for flexible categorization

### 3. Handle Errors Gracefully

- Enable "Continue On Fail" on upload nodes
- Add error tracking and reporting
- Log failed operations for retry

### 4. Optimize Chunking Parameters

Adjust based on your document type:
- **Technical docs:** 200-300 tokens per chunk
- **Research papers:** 150-250 tokens per chunk
- **Code documentation:** 100-200 tokens per chunk
- **Overlap:** 10-20% of chunk size

### 5. Monitor API Usage

- Track number of documents uploaded
- Monitor query frequency
- Set up alerts for quota limits
- Use Gemini 2.5 Flash for cost-effective queries

### 6. Version Control Your Workflows

- Export workflows regularly
- Store in version control (Git)
- Document changes in commit messages
- Test thoroughly before deploying to production

---

## Performance Expectations

| Operation | Time | Notes |
|-----------|------|-------|
| Create Store | 1-2 seconds | Fast operation |
| Upload Document (small) | 5-10 seconds | < 1 MB |
| Upload Document (large) | 30-60 seconds | 10-50 MB |
| Query (Flash) | 2-5 seconds | Simple queries |
| Query (Pro) | 5-15 seconds | Complex queries |
| List Documents | 1-2 seconds | Per page (20 items) |

---

## Next Steps

1. **Try the Basic RAG Workflow**
   Start with the simplest example to understand the basics.

2. **Explore Filtered Search**
   Learn how to use metadata filters for advanced queries.

3. **Build Custom Workflows**
   Combine these examples to create workflows for your specific use case.

4. **Read the Tutorial**
   Check out [building-a-knowledge-base.md](../tutorials/building-a-knowledge-base.md) for a step-by-step guide.

5. **Explore the API Documentation**
   - [Store Operations](../nodes/gemini-file-search-stores.md)
   - [Document Operations](../nodes/gemini-file-search-documents.md)

---

## Additional Resources

- **n8n Documentation:** https://docs.n8n.io/
- **Gemini API Docs:** https://ai.google.dev/gemini-api/docs
- **File Search API:** https://ai.google.dev/gemini-api/docs/file-search
- **n8n Community:** https://community.n8n.io/
- **Report Issues:** https://github.com/your-repo/issues

---

## Support

If you encounter issues or have questions:

1. Check the [Troubleshooting Guide](../TROUBLESHOOTING.md)
2. Review the [API Documentation](../nodes/)
3. Search the [n8n Community](https://community.n8n.io/)
4. Open an issue on [GitHub](https://github.com/your-repo/issues)

---

**Last Updated:** 2025-11-30
**Version:** 1.1.0

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
