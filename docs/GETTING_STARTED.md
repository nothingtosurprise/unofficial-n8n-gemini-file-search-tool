# Getting Started with Gemini File Search for n8n

This guide will walk you through setting up and using the Gemini File Search nodes in n8n to build your first AI-powered document search workflow.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [Credential Setup](#credential-setup)
4. [Your First Workflow](#your-first-workflow)
5. [Common Use Cases](#common-use-cases)
6. [Next Steps](#next-steps)

---

## Prerequisites

Before you begin, ensure you have:

### 1. Google Cloud Setup

- **Google Cloud Account**: [Sign up here](https://cloud.google.com/) if you don't have one
- **Billing Enabled**: File Search API requires an active billing account
- **Gemini API Key**: Generate from [Google AI Studio](https://aistudio.google.com/app/apikey)

### 2. n8n Instance

- **Version**: n8n 1.0.0 or higher
- **Installation Options**:
  - Self-hosted: [n8n self-hosting guide](https://docs.n8n.io/hosting/)
  - Cloud: [n8n Cloud](https://n8n.io/cloud/)
  - Docker: `docker run -it --rm -p 5678:5678 n8nio/n8n`
  - npm: `npm install -g n8n && n8n`

### 3. System Requirements

- **Node.js**: Version 18.0.0 or higher
- **npm**: Version 8.0.0 or higher
- **Storage**: ~50 MB for package and dependencies

---

## Installation

### Option 1: Install from npm (Recommended)

Once published, install directly from npm:

```bash
cd ~/.n8n/custom
npm install n8n-nodes-gemini-file-search
```

Then restart your n8n instance:

```bash
# If running as a service
systemctl restart n8n

# If running via npm
n8n start

# If running via Docker
docker restart n8n
```

### Option 2: Install from Source (Development)

For development or testing the latest version:

```bash
# Clone the repository
git clone https://github.com/yourusername/n8n-nodes-gemini-file-search.git
cd n8n-nodes-gemini-file-search

# Install dependencies
npm install

# Build the package
npm run build

# Link to n8n (for local development)
npm link
cd ~/.n8n/custom
npm link n8n-nodes-gemini-file-search
```

### Option 3: Manual Installation

Download and extract the package to your n8n custom nodes directory:

```bash
# Create custom nodes directory if it doesn't exist
mkdir -p ~/.n8n/custom

# Navigate to the directory
cd ~/.n8n/custom

# Extract the package
# (replace with actual download path)
tar -xzf n8n-nodes-gemini-file-search-0.1.0.tgz
```

### Verify Installation

1. Restart n8n
2. Open n8n in your browser (default: `http://localhost:5678`)
3. Click on a workflow or create a new one
4. Press the **+** button to add a node
5. Search for "Gemini" - you should see:
   - **Gemini File Search Stores**
   - **Gemini File Search Documents**

If you see these nodes, installation was successful!

---

## Credential Setup

### Step 1: Obtain Your Gemini API Key

1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click **"Create API Key"**
4. Select an existing Google Cloud project or create a new one
5. Click **"Create API key in existing project"** or **"Create API key in new project"**
6. Copy your API key (it looks like: `AIzaSyD...`)

> **Important**: Keep your API key secure! Never commit it to version control or share it publicly.

### Step 2: Create Credentials in n8n

1. In n8n, click **"Credentials"** in the left sidebar
2. Click the **"Add Credential"** button (or **"New"**)
3. Search for **"Gemini API"** in the credential types list
4. Click on **"Gemini API"**
5. Enter your credentials:
   - **API Key**: Paste your Gemini API key
   - **Display Name** (optional): Give it a meaningful name like "Gemini Production"
6. Click **"Save"** - n8n will automatically test the connection

### Step 3: Test Your Credentials

The credential will automatically attempt to connect to the Gemini API by listing stores. You'll see:

- ✅ **Green checkmark**: Connection successful
- ❌ **Red X**: Connection failed (check your API key)

**Troubleshooting Failed Tests:**

- Verify the API key is correct (no extra spaces)
- Check that billing is enabled in Google Cloud
- Ensure the Gemini API is enabled for your project
- Verify your Google Cloud project has File Search API access

---

## Your First Workflow

Let's build a simple workflow that:
1. Creates a File Search store
2. Uploads a document
3. Queries the document with a question

### Workflow Overview

```
[Manual Trigger] → [Create Store] → [Upload Document] → [Query Documents] → [Show Result]
```

### Step 1: Create a New Workflow

1. In n8n, click **"Workflows"** → **"Add Workflow"**
2. Give it a name: "My First Gemini Search"
3. Click **"Save"**

### Step 2: Add a Manual Trigger

1. Click the **+** button
2. Search for **"Manual Trigger"**
3. Select it - this allows you to test the workflow manually

### Step 3: Create a File Search Store

1. Click the **+** after Manual Trigger
2. Search for **"Gemini File Search Stores"**
3. Select the node
4. Configure:
   - **Credentials**: Select your Gemini API credential
   - **Operation**: Create
   - **Display Name**: "My Knowledge Base"
5. Click **"Execute Node"** to test

You should see output like:
```json
{
  "name": "fileSearchStores/my-knowledge-base-abc123",
  "displayName": "My Knowledge Base",
  "createTime": "2025-11-24T10:00:00Z",
  "activeDocumentsCount": "0"
}
```

### Step 4: Upload a Document

1. First, add a node to read a file:
   - Click **+** after the Create Store node
   - Search for **"Read Binary File"**
   - Configure:
     - **File Path**: `/path/to/your/document.pdf` (use an actual file path)
   - Execute to verify

2. Add the Upload Document node:
   - Click **+** after Read Binary File
   - Search for **"Gemini File Search Documents"**
   - Configure:
     - **Credentials**: Select your Gemini API credential
     - **Operation**: Upload
     - **Store**: Use an expression to get the store name from step 3:
       ```javascript
       {{ $('Gemini File Search Stores').item.json.name }}
       ```
     - **Input Binary Field**: `data` (default)
     - **Display Name**: "Sample Document"
     - **Wait for Completion**: `true` (recommended for first workflow)
   - Execute node

The upload will take a few seconds to minutes depending on file size. Once complete, you'll see:
```json
{
  "name": "...",
  "done": true,
  "response": {
    "name": "fileSearchStores/.../documents/doc-xyz",
    "displayName": "Sample Document",
    "state": "STATE_ACTIVE"
  }
}
```

### Step 5: Query Your Document

1. Click **+** after the Upload node
2. Add another **"Gemini File Search Documents"** node
3. Configure:
   - **Operation**: Query
   - **Model**: gemini-2.5-flash
   - **Query**: "What is this document about?"
   - **Store Names**: Use expression:
     ```javascript
     {{ $('Gemini File Search Stores').item.json.name }}
     ```
   - **Metadata Filter**: (leave empty for now)
4. Execute node

You'll receive an AI-generated answer based on your document!

### Step 6: Extract and Display the Answer

1. Click **+** after Query node
2. Add a **"Set"** node to extract just the text
3. Configure:
   - **Mode**: Manual Mapping
   - **Fields to Set**:
     - **Name**: `answer`
     - **Value**:
       ```javascript
       {{ $json.candidates[0].content.parts[0].text }}
       ```
4. Execute node

Your final output will be the clean AI-generated answer!

### Complete Workflow

Save your workflow and test it end-to-end by clicking **"Execute Workflow"** at the bottom.

---

## Common Use Cases

### Use Case 1: Building a Knowledge Base

**Scenario**: Create a searchable knowledge base from your company's documentation.

**Workflow Structure**:
```
[Schedule Trigger: Daily]
  → [Google Drive: List Files in Folder]
  → [Loop Over Each File]
    → [Google Drive: Download File]
    → [Gemini Upload Document]
      - Store: "company-kb"
      - Metadata: department, category, date
  → [Slack: Notify on completion]
```

**Key Features**:
- Automatic daily updates
- Metadata tagging by department
- Notification on completion

**Benefits**:
- Always up-to-date knowledge base
- Searchable by department and category
- No manual intervention needed

---

### Use Case 2: Document Q&A System

**Scenario**: Build a chatbot that answers questions from uploaded documents.

**Workflow Structure**:
```
[Webhook Trigger]
  → [Extract Question from Request]
  → [Gemini Query Documents]
    - Query: user's question
    - Store: "support-docs"
    - Filter by category if provided
  → [Format Response]
  → [Webhook Response: Return Answer]
```

**Example Integration**:
```javascript
// Frontend call
fetch('https://your-n8n.com/webhook/ask', {
  method: 'POST',
  body: JSON.stringify({
    question: "How do I reset my password?",
    category: "authentication"
  })
})
```

**Benefits**:
- Instant answers to user questions
- 24/7 availability
- Cites sources from documents
- Scales infinitely

---

### Use Case 3: Research Assistant

**Scenario**: Search across multiple document collections for research purposes.

**Workflow Structure**:
```
[Webhook or Form Trigger]
  → [Extract Research Query]
  → [Gemini Query Documents]
    - Model: gemini-2.5-pro (for detailed analysis)
    - Stores: "research-papers,academic-journals,news-articles"
    - Filter: year >= 2023 AND topics:AI
  → [Format with Sources]
  → [Send Email with Findings]
```

**Advanced Features**:
- Multi-store search
- Date filtering
- Topic filtering
- Detailed analysis with Pro model

---

### Use Case 4: Content Management

**Scenario**: Organize and manage documents with rich metadata.

**Upload Workflow**:
```
[Webhook: Upload Endpoint]
  → [Validate File Type & Size]
  → [Extract Metadata from Form]
  → [Gemini Upload Document]
    - Store: based on category
    - Metadata: author, tags, date, version
    - Chunking: optimized per doc type
  → [Store Document ID in Database]
  → [Return Success Response]
```

**Search Workflow**:
```
[Webhook: Search Endpoint]
  → [Build Metadata Filter]
    - author = "{{author}}"
    - tags:{{tag}}
    - date >= {{startDate}}
  → [Gemini Query Documents]
  → [Return Results with Metadata]
```

**Benefits**:
- Rich metadata support
- Flexible filtering
- Multi-dimensional search
- Version tracking

---

## Advanced Workflow Examples

### Example 1: Batch Document Upload with Error Handling

```
[Manual Trigger]
  → [Read Binary Files from Directory]
  → [Split In Batches: 5 items]
    → [Try Block]
      → [Gemini Upload Document]
        - waitForCompletion: false
      → [Store Operation Name]
    → [Catch Block]
      → [Log Error]
      → [Continue Anyway]
  → [Wait 30 seconds]
  → [Loop: Check All Operation Statuses]
  → [Report: Successful & Failed Uploads]
```

### Example 2: Smart Document Routing

```
[Webhook: Document Upload]
  → [Analyze Document Content (Basic)]
  → [If: Contains Legal Terms]
    → [Upload to "legal-docs" store]
    → [Metadata: category = "legal"]
  → [Else If: Contains Code]
    → [Upload to "technical-docs" store]
    → [Metadata: category = "technical"]
  → [Else]
    → [Upload to "general-docs" store]
  → [Return Document URL]
```

### Example 3: Multilingual Search

```
[Webhook: Query in Any Language]
  → [Detect Language (using AI)]
  → [Gemini Query Documents]
    - Query: original language query
    - Store: "multilingual-docs"
    - Filter: language = "{{detectedLanguage}}"
  → [Translate Response if Needed]
  → [Return in User's Language]
```

---

## Best Practices for Beginners

### 1. Start Small

- Begin with a single document
- Test queries before building complex workflows
- Verify credentials work correctly
- Understand the response structure

### 2. Use Descriptive Names

**Bad**:
```
Store: "store1"
Document: "doc"
```

**Good**:
```
Store: "customer-support-kb-2024"
Document: "password-reset-guide-v2"
```

### 3. Add Metadata Early

Always include metadata when uploading:
```json
{
  "author": "John Doe",
  "department": "Engineering",
  "category": "API Documentation",
  "version": 2,
  "tags": ["api", "rest", "authentication"]
}
```

Benefits:
- Easier filtering later
- Better organization
- Faster searches
- Clearer audit trails

### 4. Handle Errors Gracefully

Always add error handling:
- Use Try/Catch blocks
- Log errors for debugging
- Notify on failures
- Implement retries for transient errors

### 5. Monitor Costs

Keep track of token usage:
- Start with `gemini-2.5-flash` (cheaper)
- Use metadata filters to reduce tokens
- Cache frequent queries
- Set up billing alerts in Google Cloud

### 6. Test Chunking Settings

Default chunking works well for most cases, but test with your documents:
```
1. Upload sample document
2. Query with typical questions
3. Check answer quality
4. Adjust chunk size if needed
5. Re-upload and test again
```

---

## Troubleshooting Common Issues

### Issue: "Node not found in n8n"

**Solution**:
1. Verify installation: `ls ~/.n8n/custom/node_modules`
2. Restart n8n completely
3. Check n8n logs for errors: `~/.n8n/logs/`
4. Reinstall if necessary

---

### Issue: "Credential test failed"

**Solution**:
1. Double-check API key (no spaces, complete key)
2. Enable billing in Google Cloud Console
3. Verify Gemini API is enabled
4. Check API key permissions
5. Try creating a new API key

---

### Issue: "File not found" when uploading

**Solution**:
1. Use absolute file paths: `/home/user/docs/file.pdf`
2. Check file exists: Use Read Binary File node first
3. Verify file permissions
4. Ensure file isn't locked by another process

---

### Issue: "Store name not found" in expression

**Solution**:
```javascript
// Wrong
{{ $node["Gemini File Search Stores"].json.name }}

// Correct
{{ $('Gemini File Search Stores').item.json.name }}

// Or use drag-and-drop expression builder
```

---

## Next Steps

### Learn More

1. **Node Documentation**:
   - [Gemini File Search Stores Node](./nodes/gemini-file-search-stores.md)
   - [Gemini File Search Documents Node](./nodes/gemini-file-search-documents.md)

2. **API Reference**:
   - [API Documentation](./API.md)
   - [Google Gemini File Search API](https://ai.google.dev/gemini-api/docs/file-search)

3. **Advanced Topics**:
   - [Example Workflows](./examples/)
   - [Tutorials](./tutorials/)
   - Chunking strategies
   - Metadata filtering with AIP-160

### Experiment

Try these experiments to learn more:

1. **Test Different Models**:
   - Query the same document with Flash vs Pro
   - Compare response quality and speed
   - Check token usage differences

2. **Optimize Chunking**:
   - Upload same document with different chunk sizes
   - Test queries with each version
   - Find optimal settings for your use case

3. **Build Complex Filters**:
   - Create documents with rich metadata
   - Practice AIP-160 filter syntax
   - Combine multiple conditions

4. **Create Workflows**:
   - Implement one of the [common use cases](#common-use-cases)
   - Add error handling and logging
   - Schedule and automate

### Join the Community

- **n8n Community**: [community.n8n.io](https://community.n8n.io/)
- **n8n Discord**: Join for real-time help
- **GitHub Issues**: Report bugs or request features
- **Share Your Workflows**: Help others by sharing what you build!

---

## Quick Reference

### Essential Commands

```bash
# Install package
npm install n8n-nodes-gemini-file-search

# Restart n8n (systemd)
systemctl restart n8n

# Restart n8n (docker)
docker restart n8n

# Check n8n logs
tail -f ~/.n8n/logs/n8n.log

# Rebuild from source
npm run build
```

### Essential Expressions

```javascript
// Get store name from previous node
{{ $('Gemini File Search Stores').item.json.name }}

// Extract query answer
{{ $json.candidates[0].content.parts[0].text }}

// Get document name from upload
{{ $json.response.name }}

// Build metadata filter
{{ "author = '" + $json.author + "' AND year >= " + $json.year }}
```

### Resource Limits

| Resource | Limit |
|----------|-------|
| File Size | 100 MB per file |
| Metadata Entries | 20 per document |
| String Value Length | 1024 characters |
| Store Name Length | 512 characters |
| Stores per Project | ~1000 (soft limit) |
| Documents per Store | Unlimited (subject to quotas) |

---

## Support

**Need Help?**
- Review this guide and node documentation
- Check [troubleshooting sections](#troubleshooting-common-issues)
- Search the [n8n community forum](https://community.n8n.io/)
- Consult [Google's API docs](https://ai.google.dev/api/file-search)
- Open an issue on GitHub (for bugs)

**Contributing**:
- Report bugs via GitHub Issues
- Suggest features via GitHub Discussions
- Submit pull requests for improvements
- Share your workflows with the community

---

**Last Updated**: 2024-11-24
**Package Version**: 0.1.0
**n8n Compatibility**: 1.0.0+

Happy building! 🚀
