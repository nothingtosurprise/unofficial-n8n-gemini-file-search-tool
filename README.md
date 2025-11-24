# n8n Gemini File Search Tool

[![CI](https://github.com/YOUR_USERNAME/n8n-gemini-file-search-tool/actions/workflows/ci.yml/badge.svg)](https://github.com/YOUR_USERNAME/n8n-gemini-file-search-tool/actions/workflows/ci.yml)
[![codecov](https://codecov.io/gh/YOUR_USERNAME/n8n-gemini-file-search-tool/branch/main/graph/badge.svg)](https://codecov.io/gh/YOUR_USERNAME/n8n-gemini-file-search-tool)

Custom n8n nodes for interacting with Google's Gemini File Search Tool, enabling advanced document search and management capabilities within your n8n workflows.

## Features

- **Corpus Management**: Create, list, and delete document stores (corpora)
- **Document Operations**: Upload, query, and manage documents with metadata
- **Gemini Integration**: Seamless integration with Gemini 2.5 Flash and Pro models
- **Advanced Search**: Query documents with metadata filtering capabilities

## Installation

```bash
# Installation instructions coming soon
npm install n8n-gemini-file-search-tool
```

## Requirements

- Node.js 18+ LTS
- n8n 1.0.0+
- Google Gemini API Key

## Nodes

### 1. Gemini Corpus Manager
Manage document stores (corpora) for organizing your searchable documents:
- List all corpora
- Create new corpora
- Delete existing corpora

### 2. Gemini Document Manager & Query
Handle documents within a specific corpus:
- Upload documents with metadata and chunking options
- Delete documents
- List documents and their metadata
- Query documents with advanced filtering

## Supported Models

- gemini-2.5-flash
- gemini-2.5-pro

## Documentation

For detailed documentation, see:
- n8n reference: `/docs/refs/n8n`
- Gemini File Search Tool reference: `/docs/refs/gemini`
- Implementation plan: `/docs/specs/implementation-plan.md`

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Run tests
npm run test

# Lint
npm run lint
```

## License

MIT

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.
