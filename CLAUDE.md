# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This repository contains development for two custom n8n nodes that integrate with Google's Gemini File Search Tool API. The nodes enable users to manage file search stores and perform document operations (upload, query, delete) with metadata support.

### Target Nodes

1. **Manage Stores Node**: Operations for file search stores
   - List stores
   - Create stores
   - Delete stores

2. **Query and Manage Documents Node**: Document operations within stores
   - Upload documents with metadata, chunking options, and all available API parameters
   - Delete documents
   - List documents with metadata
   - Query documents with metadata filtering

### Implementation Architecture

The nodes should be implemented as LLM Model nodes (not Tool nodes) since the Gemini File Search tool is passed as an option in the model call. Only `gemini-2.5-flash` and `gemini-2.5-pro` models support this tool.

## API Reference

### Base Endpoint
- `https://generativelanguage.googleapis.com/v1beta/`

### Key Resources

**File Search Stores:**
- Create/List/Delete operations at `/fileSearchStores/`
- Upload: `POST /fileSearchStores/{name}:uploadToFileSearchStore`
- Import: `POST /fileSearchStores/{name}:importFile`

**Documents:**
- Path pattern: `fileSearchStores/{filesearchstore}/documents/{document}`
- Operations: get, list, delete
- List returns paginated results (default 10, max 20 per page)
- Delete supports `force` parameter to cascade delete chunks

**Document Structure:**
- `name`: Resource identifier (up to 40 chars, lowercase alphanumeric/dashes)
- `displayName`: Human-readable name (max 512 chars)
- `customMetadata[]`: Key-value pairs for querying (max 20 per document)
  - Supports: `stringValue`, `stringListValue`, `numericValue`
- `state`: STATE_UNSPECIFIED | STATE_PENDING | STATE_ACTIVE | STATE_FAILED
- Output-only fields: `createTime`, `updateTime`, `sizeBytes`, `mimeType`

### Authentication
Requires Gemini API Key credential field following n8n credential requirements.

## Development Resources

### Official Documentation
- n8n node creation: https://docs.n8n.io/integrations/creating-nodes/overview/
- Gemini File Search Tool: https://ai.google.dev/gemini-api/docs/file-search
- File Search Stores API: https://ai.google.dev/api/file-search/file-search-stores
- Documents API: https://ai.google.dev/api/file-search/documents

### Local Reference Docs
Key API details are cached in `docs/refs/`:
- `gemini/document.md`: Document resource schema and operations
- `gemini/file-search`: RAG implementation examples
- `gemini/file-search-stores`: Store management and upload methods
- `n8n/n8n-development.md`: n8n integration reference

## File Organization

- `/docs/refs/`: API reference documentation organized by service (gemini, n8n)
- Source code should be organized in appropriate directories (not in root)
- Reports should be saved to: `temp/reports/[yy-mm-dd]/[subject].md`
