# CLAUDE.md

This file provides mandatory directives to Claude Code (claude.ai/code) when working with code in this repository.

---

## Project Overview

This repository contains two custom n8n nodes that integrate with Google's Gemini File Search Tool API. The nodes enable users to manage file search stores and perform document operations (upload, query, delete) with metadata support.

### Implemented Nodes

1. **Gemini File Search Stores Node** (`GeminiFileSearchStores`)
   - Create stores
   - List stores
   - Get store details
   - Delete stores
   - Get operation status

2. **Gemini File Search Documents Node** (`GeminiFileSearchDocuments`)
   - Upload documents with binary data
   - Import documents from Files API
   - List documents with pagination
   - Get document details
   - Delete documents
   - Query documents with metadata filtering

3. **Gemini File Search AI Model** (LangChain Code Node)
   - Custom `GeminiFileSearchChatModel` class
   - Single API call RAG queries (vs two-call tool approach)
   - Works with n8n AI Agent as primary model
   - Preserves grounding metadata and citations
   - **Requires**: n8n self-hosted (LangChain Code Node)

---

## Mandatory Directives

### 1. File Organization (CRITICAL)

**NEVER create files in the root directory.** All files MUST be placed in their designated folders:

| File Type | Location | Example |
|-----------|----------|---------|
| Node implementations | `nodes/NodeName/` | `nodes/GeminiFileSearchStores/` |
| Operations | `nodes/NodeName/operations/` | `nodes/GeminiFileSearchStores/operations/store/` |
| Credentials | `credentials/` | `credentials/GeminiApi.credentials.ts` |
| Utilities | `utils/` | `utils/apiClient.ts` |
| Tests | `test/unit/` | `test/unit/nodes/stores/` |
| Reports | `temp/reports/[yy-mm-dd]/` | `temp/reports/2025-11-24/` |
| Final docs | `docs/specs/phase_XX/` | `docs/specs/phase_02/` |
| Assets | `assets/` | `assets/gemini.svg` |

**See:** [docs/PROJECT_STRUCTURE.md](docs/PROJECT_STRUCTURE.md) for complete structure.

---

### 2. Testing Requirements (MANDATORY)

**ALL implementations MUST be tested before delivery:**

```bash
# Run tests before completing any task
npm test

# Verify coverage meets requirements (>80%)
npm run test:coverage

# Ensure build succeeds
npm run build
```

**Testing Standards:**
- ✅ Unit tests for ALL new functions/operations
- ✅ >80% code coverage (aim for >95%)
- ✅ Test success cases AND error cases
- ✅ Test validation logic thoroughly
- ✅ Use `test-master` skill for complex testing

**Test File Naming:**
- Test files MUST be named: `targetFile.test.ts`
- Test files MUST be in: `test/unit/[category]/`
- Mirror source structure in test structure

---

### 3. Phase-Based Development (REQUIRED)

**All work MUST be organized by phase:**

```
docs/specs/
├── phase_01/              # Infrastructure Setup
├── phase_02/              # Core Implementation
├── phase_03/              # Testing Strategy
├── phase_04/              # Documentation
├── phase_05/              # QA & Deployment
└── phase_06/              # AI Model Integration (CURRENT)
```

**Each phase MUST have:**
1. `README.md` - Phase overview and summary
2. `PHASE_XX_COMPLETE.md` - Completion summary with results
3. `TEST_REPORT.md` - Detailed test results
4. `reports/` - Subsection reports (X.1, X.2, etc.)
5. `logs/` - Implementation logs (optional)

**Report Workflow:**
1. Create temporary reports in: `temp/reports/[yy-mm-dd]/[subject].md`
2. Copy finalized reports to: `docs/specs/phase_XX/reports/`
3. Update phase README and completion documents

---

### 4. Git Commit Best Practices (MANDATORY)

**Commit often with descriptive messages:**

```bash
# Format: type(scope): description
feat(stores): implement create store operation
fix(upload): handle large file upload errors
docs(phase-2): add Phase 2 completion summary
test(validators): add edge case tests for metadata validation
```

**Commit Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `test`: Tests
- `refactor`: Code refactoring
- `chore`: Build/tooling

**Always include:**
```
🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

---

### 5. Documentation Standards (REQUIRED)

**Keep documentation organized and current:**

1. **Project Structure**
   - Update `docs/PROJECT_STRUCTURE.md` when adding new directories
   - Keep structure diagram current

2. **Implementation Reports**
   - Create detailed reports for each major task
   - Include: files created, test results, issues encountered
   - Save to: `temp/reports/[date]/[subject].md`

3. **Phase Documentation**
   - Update phase README with progress
   - Create completion summary when phase done
   - Include test reports and coverage data

4. **Code Documentation**
   - Add JSDoc comments for complex functions
   - Document validation rules inline
   - Explain non-obvious logic

---

### 6. Code Quality Standards (MANDATORY)

**All code MUST:**

1. **Pass linting:**
   ```bash
   npm run lint
   npm run format
   ```

2. **Use TypeScript properly:**
   - ✅ Proper type annotations
   - ✅ No `any` unless necessary (n8n compatibility)
   - ✅ Use interfaces from `utils/types.ts`

3. **Follow n8n conventions:**
   - ✅ Use `IExecuteFunctions`, `INodeType`, etc.
   - ✅ Proper error handling with `NodeOperationError`, `NodeApiError`
   - ✅ Support `continueOnFail` option
   - ✅ Use `helpers.constructExecutionMetaData`

4. **Handle errors properly:**
   - ✅ User-friendly error messages
   - ✅ Validate inputs before API calls
   - ✅ Catch and wrap API errors

---

### 7. Frontend/UI Testing (WHEN APPLICABLE)

**For UI changes, use Playwright MCP:**

```bash
# Take screenshots to verify UI
playwright screenshot --url http://localhost:5678

# Check console logs for errors
playwright console --url http://localhost:5678

# Verify UX flows work correctly
playwright test workflows/
```

---

### 8. Project Structure Maintenance (CRITICAL)

**ALWAYS maintain proper structure:**

```
✅ CORRECT:
nodes/GeminiFileSearchStores/operations/store/create.ts
test/unit/nodes/stores/create.test.ts
utils/validators.ts
docs/specs/phase_02/reports/2.1-credential-system.md

❌ WRONG:
create.ts                              # Not in root!
stores_test.ts                         # Wrong naming!
my_validator.ts                        # Not in utils/!
report.md                              # Not in proper phase folder!
```

---

### 9. API Reference Usage

**Base Endpoint:**
- `https://generativelanguage.googleapis.com/v1beta/`

**Key Resources:**

**File Search Stores:**
- List/Create: `GET/POST /fileSearchStores`
- Get: `GET /fileSearchStores/{name}`
- Delete: `DELETE /fileSearchStores/{name}?force=true`
- Upload: `POST /fileSearchStores/{name}:uploadToFileSearchStore`
- Import: `POST /fileSearchStores/{name}:importFile`

**Documents:**
- List: `GET /fileSearchStores/{store}/documents`
- Get: `GET /fileSearchStores/{store}/documents/{doc}`
- Delete: `DELETE /fileSearchStores/{store}/documents/{doc}?force=true`

**Query (via Model):**
- `POST /models/{model}:generateContent` with `fileSearch` tool

**Authentication:**
- Header: `x-goog-api-key: {apiKey}`
- Credential: `geminiApi` (defined in `credentials/GeminiApi.credentials.ts`)

**Local Reference Docs:**
- `docs/refs/gemini/document.md` - Document API details
- `docs/refs/gemini/file-search.md` - RAG implementation
- `docs/refs/gemini/file-search-stores.md` - Store management
- `docs/refs/n8n/n8n-development.md` - n8n integration guide

---

### 10. Implementation Status

**Phase Completion:**

| Phase | Status | Coverage | Tests |
|-------|--------|----------|-------|
| Phase 1: Infrastructure | ✅ Complete | N/A | Framework tests |
| Phase 2: Core Implementation | ✅ Complete | 98.7% | 198/198 passing |
| Phase 3: Testing Strategy | ✅ Complete | - | - |
| Phase 4: Documentation | ⏳ Pending | - | - |
| Phase 5: QA & Deployment | ⏳ Pending | - | - |
| Phase 6: AI Model Integration | ✅ Complete | N/A | Manual validation |

**Current Files:**
- 2 credentials
- 4 utilities
- 2 nodes (11 operations total)
- 1 AI Model (LangChain Code Node)
- 15 test suites (198 tests)
- 4 workflow templates
- 55+ total files

---

### 11. Parallel Execution Strategy

**For complex multi-phase tasks:**

Use parallel agents to maximize efficiency:

```typescript
// Example: Execute Phase X with 4 parallel agents
Task 1: Implement feature A
Task 2: Implement feature B
Task 3: Implement feature C
Task 4: Implement feature D

// Run all 4 agents simultaneously
// Reduces 12-15 days to ~75 minutes
```

**When to use parallel execution:**
- ✅ Independent implementation tasks
- ✅ Multiple node operations
- ✅ Separate utility modules
- ✅ Different test suites

**When NOT to use parallel:**
- ❌ Dependent tasks (B requires A)
- ❌ Shared file modifications
- ❌ Sequential debugging

---

### 12. Reporting Requirements (MANDATORY)

**All reports MUST be saved to:**
```
temp/reports/[yy-mm-dd]/[subject].md
```

**Report Format:**

```markdown
# [Subject] - Report

**Date:** YYYY-MM-DD
**Phase:** X - [Phase Name]
**Status:** [Status]

## Summary
[Brief overview]

## Files Created/Modified
[List of files]

## Test Results
[Test summary]

## Issues Encountered
[Any problems and solutions]

## Next Steps
[What's next]
```

**Final Reports Location:**
```
docs/specs/phase_XX/reports/X.Y-subsection-name.md
```

---

## Quick Reference Commands

```bash
# Development
npm run build              # Build TypeScript
npm run lint               # Run linter
npm run format             # Format code

# Testing
npm test                   # Run all tests
npm run test:coverage      # Run with coverage
npm run test:watch         # Watch mode

# Git
git status                 # Check changes
git add .                  # Stage changes
git commit -m "feat: ..."  # Commit with message
git push                   # Push to remote
```

---

## Important Files

| File | Purpose |
|------|---------|
| `package.json` | Dependencies, scripts, n8n node registration |
| `tsconfig.json` | TypeScript compiler config |
| `jest.config.js` | Test framework config |
| `.eslintrc.js` | Linting rules |
| `docs/PROJECT_STRUCTURE.md` | Complete structure reference |
| `docs/specs/implementation-plan.md` | Master implementation plan |

---

## Key Principles

1. **NEVER** create files in root directory
2. **ALWAYS** test before completing tasks
3. **ALWAYS** organize by phase
4. **ALWAYS** commit often with good messages
5. **ALWAYS** maintain documentation
6. **ALWAYS** follow TypeScript & n8n conventions
7. **ALWAYS** handle errors gracefully
8. **ALWAYS** save reports to correct locations
9. **ALWAYS** verify build succeeds
10. **ALWAYS** maintain >80% test coverage

---

## External Documentation

- **n8n Node Development:** https://docs.n8n.io/integrations/creating-nodes/overview/
- **Gemini File Search API:** https://ai.google.dev/gemini-api/docs/file-search
- **Gemini File Search Stores:** https://ai.google.dev/api/file-search/file-search-stores
- **Gemini Documents API:** https://ai.google.dev/api/file-search/documents

---

**Last Updated:** 2025-11-30
**Project Version:** 1.1.0
**Phase:** 6 - AI Model Integration (Complete)

🤖 This file is maintained by Claude Code
