# Phase 6: AI Model Integration

**Status**: In Progress
**Start Date**: 2025-11-30
**Target Completion**: 2025-11-30

---

## Overview

Phase 6 implements Gemini File Search as a native AI Model for n8n's AI Agent, enabling **single API call** RAG queries instead of the inefficient two-call approach when using File Search as a tool.

### Problem Statement

When using Gemini File Search as a tool in n8n AI Agent:
1. **Call 1**: AI Agent's model decides to use the file search tool
2. **Call 2**: File search tool calls Gemini's `generateContent` API

This results in **two LLM calls** per query - inefficient and costly.

### Solution

Create a custom Chat Model using n8n's **LangChain Code Node** that:
- Extends LangChain's `BaseChatModel`
- Wraps Gemini's `generateContent` API with `fileSearch` tool pre-configured
- Works with AI Agent as the **primary model** (single call)
- Preserves grounding metadata and citations

---

## Deliverables

| # | Deliverable | Status |
|---|------------|--------|
| 1 | GeminiFileSearchChatModel class | Pending |
| 2 | n8n Workflow Template | Pending |
| 3 | Usage Documentation | Pending |
| 4 | Test Workflow | Pending |
| 5 | Project Documentation Updates | Pending |

---

## Sub-Phases

### 6.1 Core Model Implementation
- Create `GeminiFileSearchChatModel` class
- Implement `_generate()` method
- Message conversion (LangChain → Gemini)
- Response conversion with grounding metadata

### 6.2 n8n Workflow Template
- Create workflow with LangChain Code Node
- Configure AI Agent integration
- Export as reusable template

### 6.3 Usage Documentation
- Setup instructions
- Configuration options
- Usage examples
- Troubleshooting guide

### 6.4 Testing & Validation
- Validate single API call behavior
- Verify grounding metadata preservation
- Test error handling

### 6.5 Documentation Updates
- Update CLAUDE.md
- Update README.md
- Update PROJECT_STRUCTURE.md
- Update ORGANIZATION_SUMMARY.md

### 6.6 Completion
- Phase completion summary
- Final build verification
- Git commit

---

## Technical Approach

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      n8n AI Agent                           │
│  ┌─────────────────────────────────────────────────────┐   │
│  │           LangChain Code Node (Model)               │   │
│  │  ┌───────────────────────────────────────────────┐  │   │
│  │  │     GeminiFileSearchChatModel                 │  │   │
│  │  │     (extends BaseChatModel)                   │  │   │
│  │  │                                               │  │   │
│  │  │  ┌─────────────────────────────────────────┐  │  │   │
│  │  │  │  generateContent API                    │  │  │   │
│  │  │  │  + fileSearch tool (pre-configured)     │  │  │   │
│  │  │  │  + Store names                          │  │  │   │
│  │  │  │  + Metadata filter                      │  │  │   │
│  │  │  └─────────────────────────────────────────┘  │  │   │
│  │  └───────────────────────────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────┘   │
│                           │                                 │
│                     SINGLE API CALL                         │
│                           ▼                                 │
│              Gemini Response + Grounding                    │
└─────────────────────────────────────────────────────────────┘
```

### Key Components

1. **GeminiFileSearchChatModel** - Custom LangChain model class
2. **Message Conversion** - LangChain messages → Gemini format
3. **Response Conversion** - Gemini response → LangChain format
4. **Grounding Metadata** - Preserve citations in `additional_kwargs`

---

## Requirements

### Prerequisites
- n8n **self-hosted** installation (required for LangChain Code Node)
- Gemini API key with File Search access
- Pre-created File Search Store(s) with documents

### Limitations
- Not available on n8n Cloud
- Code is inline (not a reusable package)
- No streaming support (initial version)

---

## Reports

| Report | Description | Status |
|--------|-------------|--------|
| [6.1-langchain-model.md](reports/6.1-langchain-model.md) | Model implementation details | Pending |
| [6.2-workflow-template.md](reports/6.2-workflow-template.md) | Workflow documentation | Pending |
| [6.3-usage-guide.md](reports/6.3-usage-guide.md) | User guide | Pending |

---

## Success Criteria

1. Single API call per query (vs. two with tool approach)
2. Works with n8n AI Agent node
3. Preserves grounding metadata and citations
4. Configurable stores and metadata filter
5. Clear documentation and examples
6. Test workflow validates functionality

---

## References

- [LangChain Code Node Documentation](https://docs.n8n.io/integrations/builtin/cluster-nodes/root-nodes/n8n-nodes-langchain.code/)
- [n8n AI Agent Documentation](https://docs.n8n.io/integrations/builtin/cluster-nodes/root-nodes/n8n-nodes-langchain.agent/)
- [Gemini File Search API](https://ai.google.dev/gemini-api/docs/file-search)
- [LangChain BaseChatModel API](https://v03.api.js.langchain.com/classes/_langchain_core.language_models_chat_models.BaseChatModel.html)

---

**Created**: 2025-11-30
**Last Updated**: 2025-11-30

🤖 Generated with [Claude Code](https://claude.com/claude-code)
Co-Authored-By: Claude <noreply@anthropic.com>
