# n8n-nodes-gemini-file-search

[![npm version](https://img.shields.io/npm/v/n8n-nodes-gemini-file-search.svg)](https://www.npmjs.com/package/n8n-nodes-gemini-file-search)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![n8n](https://img.shields.io/badge/n8n-community-FF6D5A.svg)](https://www.n8n.io)

Community nodes for integrating Google's Gemini File Search Tool API with n8n workflows. Build powerful document search and retrieval systems with AI-powered semantic search capabilities.

## Features

### Gemini File Search Stores Node
- **Create Stores**: Set up file search stores for document organization
- **List Stores**: View all available file search stores
- **Get Store Details**: Retrieve detailed information about specific stores
- **Delete Stores**: Remove stores (with force delete option)
- **Get Operation Status**: Monitor long-running operations

### Gemini File Search Documents Node
- **Upload Documents**: Upload files with resumable upload support (up to 100MB)
  - Binary data support from n8n workflows
  - Custom chunking configuration (chunk size, overlap)
  - Metadata attachment (AIP-160 filter format)
- **Import Documents**: Import files from Google Files API
- **List Documents**: Paginated document listing with filtering
- **Get Document Details**: Retrieve specific document information
- **Delete Documents**: Remove documents from stores
- **Query Documents**: Perform RAG-based semantic search
  - Natural language queries
  - Metadata filtering (AIP-160 format)
  - Configurable result limits
  - Citation tracking

## Installation

### From npm

```bash
npm install n8n-nodes-gemini-file-search
```

### In n8n

1. Go to **Settings** > **Community Nodes**
2. Select **Install**
3. Enter `n8n-nodes-gemini-file-search` in the search bar
4. Click **Install**

### From source

```bash
# Clone the repository
git clone https://github.com/yourusername/n8n-nodes-gemini-file-search.git
cd n8n-nodes-gemini-file-search

# Install dependencies
npm install

# Build the nodes
npm run build

# Link to your n8n installation
npm link
cd ~/.n8n/nodes
npm link n8n-nodes-gemini-file-search
```

## Quick Start

### 1. Set Up Credentials

1. Get a Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. In n8n, create a new **Gemini API** credential
3. Enter your API key

### 2. Create a File Search Store

Add the **Gemini File Search Stores** node to your workflow:
- **Operation**: Create Store
- **Display Name**: "My Document Store"

### 3. Upload Documents

Add the **Gemini File Search Documents** node:
- **Operation**: Upload Document
- **Store Name**: (output from step 2)
- **Binary Property**: Select your file input
- **Metadata** (optional): Add custom metadata for filtering

### 4. Query Documents

Add another **Gemini File Search Documents** node:
- **Operation**: Query Documents
- **Store Name**: (output from step 2)
- **Query**: "What is the main topic discussed?"
- **Result Limit**: 5

## Configuration

### Chunking Configuration

When uploading documents, you can customize how documents are split:

```json
{
  "chunkSize": 1000,
  "chunkOverlap": 100
}
```

- **chunkSize**: Number of tokens per chunk (default: 1000)
- **chunkOverlap**: Number of overlapping tokens between chunks (default: 100)

### Metadata Filtering

Metadata follows the [AIP-160 filtering format](https://google.aip.dev/160):

**Examples:**
```
name="important_doc"
category="financial" AND year=2024
status="active" OR priority="high"
tags:*="urgent"
```

**Supported Operators:**
- `=`: Equals
- `!=`: Not equals
- `>`, `<`, `>=`, `<=`: Comparisons
- `AND`, `OR`, `NOT`: Logical operators
- `:*=`: Array contains

## Documentation

- **[Project Structure](docs/PROJECT_STRUCTURE.md)**: Overview of codebase organization
- **[API Reference](docs/refs/gemini/)**: Gemini API documentation
  - [File Search Stores](docs/refs/gemini/file-search-stores.md)
  - [Documents](docs/refs/gemini/document.md)
  - [File Search RAG](docs/refs/gemini/file-search.md)
- **[Development Guide](docs/specs/)**: Implementation plans and guides
- **[Troubleshooting](docs/TROUBLESHOOTING.md)**: Common issues and solutions
- **[Examples](docs/examples/)**: Sample workflows and use cases

## API Limits

- **File Size**: Up to 100MB per file
- **Store Limit**: Check your Gemini API quota
- **Rate Limits**: Subject to Gemini API rate limits

## Troubleshooting

### Upload Fails for Large Files

**Solution**: Files over 20MB automatically use resumable upload. Ensure your n8n instance has adequate timeout settings.

### Metadata Filter Not Working

**Solution**: Verify your filter follows AIP-160 format. Use `=` for exact matches and ensure proper quoting for string values.

### Query Returns No Results

**Solution**:
- Verify documents are uploaded and indexed (check operation status)
- Try broader queries
- Check metadata filters aren't too restrictive

For more issues, see [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md)

## Development

### Prerequisites

- Node.js >=18.0.0
- npm or yarn
- n8n installed (for testing)

### Setup

```bash
# Install dependencies
npm install

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Build
npm run build

# Lint
npm run lint

# Format code
npm run format
```

### Project Structure

```
.
├── nodes/                     # Node implementations
│   ├── GeminiFileSearchStores/
│   └── GeminiFileSearchDocuments/
├── credentials/               # Credential definitions
├── utils/                     # Shared utilities
├── test/                      # Test suites
│   ├── unit/
│   ├── integration/
│   └── e2e/
└── docs/                      # Documentation
```

See [docs/PROJECT_STRUCTURE.md](docs/PROJECT_STRUCTURE.md) for complete structure.

## Contributing

Contributions are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Quick Contribution Guide

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass: `npm test`
6. Commit with conventional commits: `git commit -m "feat: add new feature"`
7. Push to your fork: `git push origin feature/my-feature`
8. Open a pull request

## Testing

This project maintains high test coverage (>95%):

```bash
# Run all tests
npm test

# Unit tests only
npm run test:unit

# Integration tests
npm run test:integration

# E2E tests
npm run test:e2e

# Coverage report
npm run test:coverage
```

## License

[MIT License](LICENSE)

Copyright (c) 2025

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

## Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/n8n-nodes-gemini-file-search/issues)
- **Documentation**: [docs/](docs/)
- **n8n Community**: [community.n8n.io](https://community.n8n.io)

## Acknowledgments

- Built for [n8n](https://n8n.io) workflow automation
- Powered by [Google Gemini API](https://ai.google.dev/gemini-api)
- Implements [AIP-160](https://google.aip.dev/160) filtering standard

## Related Projects

- [n8n](https://github.com/n8n-io/n8n) - Workflow automation platform
- [n8n-nodes-starter](https://github.com/n8n-io/n8n-nodes-starter) - Template for n8n nodes

## Roadmap

- [ ] Support for additional file formats
- [ ] Batch upload operations
- [ ] Advanced metadata search UI
- [ ] Store templates
- [ ] Performance analytics

---

Made with ❤️ for the n8n community

🤖 Generated with [Claude Code](https://claude.com/claude-code)
