# Project Structure

**Project:** n8n Gemini File Search Tool
**Version:** 1.0.0
**Last Updated:** 2025-11-24

---

## Directory Tree

```
n8n-gemini-file-search-tool/
│
├── .github/                          # GitHub configuration
│   └── workflows/                    # CI/CD workflows
│       ├── ci.yml                    # Continuous integration
│       └── release.yml               # Release automation
│
├── assets/                           # Static assets
│   └── gemini.svg                    # Gemini logo for nodes
│
├── credentials/                      # n8n credential definitions
│   └── GeminiApi.credentials.ts      # Gemini API authentication
│
├── nodes/                            # n8n node implementations
│   ├── index.ts                      # Node registry/exports
│   │
│   ├── GeminiFileSearchStores/       # Store management node
│   │   ├── GeminiFileSearchStores.node.ts       # Main node class
│   │   ├── GeminiFileSearchStores.node.json     # Node metadata
│   │   │
│   │   ├── descriptions/             # UI field descriptions
│   │   │   └── StoreDescription.ts   # Store operation fields
│   │   │
│   │   └── operations/               # Operation implementations
│   │       └── store/
│   │           ├── create.ts         # Create store operation
│   │           ├── list.ts           # List stores operation
│   │           ├── get.ts            # Get store operation
│   │           ├── delete.ts         # Delete store operation
│   │           ├── getOperation.ts   # Get operation status
│   │           └── index.ts          # Barrel export
│   │
│   └── GeminiFileSearchDocuments/    # Document management node
│       ├── GeminiFileSearchDocuments.node.ts    # Main node class
│       ├── GeminiFileSearchDocuments.node.json  # Node metadata
│       ├── gemini.svg                # Node icon
│       │
│       ├── descriptions/             # UI field descriptions
│       │   └── DocumentDescription.ts # Document operation fields
│       │
│       └── operations/               # Operation implementations
│           └── document/
│               ├── upload.ts         # Upload document operation
│               ├── import.ts         # Import document operation
│               ├── list.ts           # List documents operation
│               ├── get.ts            # Get document operation
│               ├── delete.ts         # Delete document operation
│               ├── query.ts          # Query documents operation
│               └── index.ts          # Barrel export
│
├── utils/                            # Shared utility modules
│   ├── types.ts                      # TypeScript type definitions
│   ├── validators.ts                 # Input validation functions
│   ├── rateLimiter.ts                # API rate limiting
│   └── apiClient.ts                  # Gemini API communication
│
├── test/                             # Test suites
│   │
│   ├── unit/                         # Unit tests
│   │   │
│   │   ├── credentials/              # Credential tests
│   │   │   └── GeminiApi.test.ts
│   │   │
│   │   ├── utils/                    # Utility tests
│   │   │   ├── apiClient.test.ts
│   │   │   ├── validators.test.ts
│   │   │   └── rateLimiter.test.ts
│   │   │
│   │   └── nodes/                    # Node operation tests
│   │       ├── stores/               # Store operation tests
│   │       │   ├── create.test.ts
│   │       │   ├── list.test.ts
│   │       │   ├── get.test.ts
│   │       │   ├── delete.test.ts
│   │       │   └── getOperation.test.ts
│   │       │
│   │       └── documents/            # Document operation tests
│   │           ├── upload.test.ts
│   │           ├── import.test.ts
│   │           ├── list.test.ts
│   │           ├── get-delete.test.ts
│   │           └── query.test.ts
│   │
│   ├── integration/                  # Integration tests (Phase 3)
│   │   └── .gitkeep
│   │
│   ├── e2e/                          # End-to-end tests (Phase 3)
│   │   └── .gitkeep
│   │
│   ├── fixtures/                     # Test data fixtures
│   │   ├── apiEndpoints.ts           # API endpoint constants
│   │   ├── sampleStore.json          # Example store data
│   │   └── sampleDocument.json       # Example document data
│   │
│   ├── utils/                        # Test utilities
│   │   ├── testHelpers.ts            # Testing helper functions
│   │   └── mockApiResponses.ts       # Mock API responses
│   │
│   └── example.test.ts               # Framework verification test
│
├── docs/                             # Documentation
│   │
│   ├── refs/                         # Reference documentation
│   │   ├── gemini/                   # Gemini API docs
│   │   │   ├── document.md           # Document API reference
│   │   │   ├── file-search.md        # File Search RAG reference
│   │   │   └── file-search-stores.md # Store API reference
│   │   │
│   │   └── n8n/                      # n8n documentation
│   │       └── n8n-development.md    # n8n node development guide
│   │
│   ├── specs/                        # Project specifications
│   │   │
│   │   ├── implementation-plan.md    # Master implementation plan
│   │   │
│   │   ├── phase_01/                 # Phase 1 (Infrastructure Setup)
│   │   │   ├── README.md
│   │   │   ├── PHASE_01_COMPLETE.md
│   │   │   ├── TEST_REPORT.md
│   │   │   ├── reports/
│   │   │   └── logs/
│   │   │
│   │   └── phase_02/                 # Phase 2 (Core Implementation)
│   │       ├── README.md             # Phase overview
│   │       ├── PHASE_02_COMPLETE.md  # Completion summary
│   │       ├── TEST_REPORT.md        # Detailed test results
│   │       │
│   │       ├── reports/              # Implementation reports
│   │       │   ├── 2.1-credential-system.md
│   │       │   ├── 2.2-shared-utilities.md
│   │       │   ├── 2.3-store-operations.md
│   │       │   └── 2.4-document-operations.md
│   │       │
│   │       └── logs/                 # Implementation logs
│   │
│   ├── examples/                     # Usage examples (Phase 4)
│   │   └── .gitkeep
│   │
│   └── PROJECT_STRUCTURE.md          # This file
│
├── dist/                             # Build output (gitignored)
│   ├── credentials/
│   ├── nodes/
│   └── utils/
│
├── node_modules/                     # Dependencies (gitignored)
│
├── .env                              # Environment variables (gitignored)
├── .gitignore                        # Git ignore rules
├── .eslintrc.js                      # ESLint configuration
├── .prettierrc                       # Prettier configuration
├── .lintstagedrc.json                # Lint-staged configuration
├── .nvmrc                            # Node version specification
│
├── package.json                      # Project metadata & dependencies
├── package-lock.json                 # Dependency lock file
├── tsconfig.json                     # TypeScript configuration
├── jest.config.js                    # Jest test configuration
│
├── CLAUDE.md                         # Claude Code directives
├── README.md                         # Project readme
├── LICENSE                           # Project license
└── CHANGELOG.md                      # Version history

```

---

## Module Organization

### Core Modules

| Directory | Purpose | Key Files |
|-----------|---------|-----------|
| `credentials/` | Authentication | GeminiApi.credentials.ts |
| `utils/` | Shared utilities | apiClient.ts, validators.ts, types.ts |
| `nodes/` | n8n node implementations | Store & Document nodes |
| `test/` | Test suites | Unit, integration, e2e tests |

### Documentation

| Directory | Purpose | Content |
|-----------|---------|---------|
| `docs/refs/` | API reference docs | Gemini & n8n documentation |
| `docs/specs/` | Project specifications | Implementation plans, phase reports |
| `docs/examples/` | Usage examples | Workflow templates, tutorials |

### Configuration

| File | Purpose |
|------|---------|
| `package.json` | Project metadata, dependencies, scripts |
| `tsconfig.json` | TypeScript compiler configuration |
| `jest.config.js` | Test framework configuration |
| `.eslintrc.js` | Code linting rules |
| `.prettierrc` | Code formatting rules |
| `CLAUDE.md` | AI assistant directives |

---

## File Naming Conventions

### TypeScript Files

- **Nodes:** `NodeName.node.ts` (e.g., `GeminiFileSearchStores.node.ts`)
- **Credentials:** `CredentialName.credentials.ts` (e.g., `GeminiApi.credentials.ts`)
- **Operations:** `operationName.ts` (e.g., `create.ts`, `delete.ts`)
- **Utilities:** `camelCase.ts` (e.g., `apiClient.ts`, `validators.ts`)
- **Tests:** `targetFile.test.ts` (e.g., `apiClient.test.ts`)

### JSON Files

- **Node metadata:** `NodeName.node.json`
- **Fixtures:** `camelCase.json` (e.g., `sampleStore.json`)

### Markdown Files

- **Documentation:** `SCREAMING_SNAKE_CASE.md` for major docs (e.g., `README.md`)
- **Reports:** `kebab-case.md` for reports (e.g., `implementation-plan.md`)
- **Phase docs:** `phase-number.section-name.md` (e.g., `2.1-credential-system.md`)

---

## Import Patterns

### Relative Imports

```typescript
// From operation files
import { geminiApiRequest } from '../../../../utils/apiClient';
import { validateStoreName } from '../../../../utils/validators';

// From node files
import { storeOperations } from './descriptions/StoreDescription';
import * as store from './operations/store';
```

### Barrel Exports

```typescript
// operations/store/index.ts
export { create } from './create';
export { list } from './list';
export { get } from './get';
export { deleteStore } from './delete';
export { getOperation } from './getOperation';
```

---

## Code Organization Principles

### 1. Separation of Concerns

- **Credentials:** Authentication logic only
- **Utilities:** Pure functions, no n8n dependencies
- **Nodes:** n8n integration, UI definitions
- **Operations:** Business logic for each operation
- **Descriptions:** UI field definitions separate from logic

### 2. Modularity

- Each operation in its own file
- Shared utilities in `utils/`
- Test files mirror source structure
- Barrel exports for clean imports

### 3. Testability

- Test files alongside source (in `test/unit/`)
- Mock utilities in `test/utils/`
- Fixtures in `test/fixtures/`
- One-to-one mapping: source file → test file

### 4. Documentation

- Phase-based organization in `docs/specs/`
- Reference docs in `docs/refs/`
- Each phase has its own folder with reports
- Temporary reports in `temp/` (gitignored)

---

## Build Output

### Distribution Structure

```
dist/
├── credentials/
│   └── GeminiApi.credentials.js
│
├── nodes/
│   ├── index.js
│   │
│   ├── GeminiFileSearchStores/
│   │   ├── GeminiFileSearchStores.node.js
│   │   ├── GeminiFileSearchStores.node.json
│   │   ├── descriptions/
│   │   └── operations/
│   │
│   └── GeminiFileSearchDocuments/
│       ├── GeminiFileSearchDocuments.node.js
│       ├── GeminiFileSearchDocuments.node.json
│       ├── gemini.svg
│       ├── descriptions/
│       └── operations/
│
└── utils/
    ├── types.js
    ├── validators.js
    ├── rateLimiter.js
    └── apiClient.js
```

---

## Git Ignore Patterns

```
node_modules/      # Dependencies
dist/              # Build output
temp/              # Temporary files
.env               # Environment variables
*.log              # Log files
coverage/          # Test coverage reports
.DS_Store          # macOS metadata
```

---

## Phase-Based Development

### Phase Folder Structure

Each phase follows this structure:

```
phase_XX/
├── README.md                    # Phase overview
├── PHASE_XX_COMPLETE.md         # Completion summary
├── TEST_REPORT.md               # Test results
├── reports/                     # Detailed reports
│   ├── X.1-subsection.md
│   ├── X.2-subsection.md
│   └── X.3-subsection.md
└── logs/                        # Implementation logs
    ├── YYYY-MM-DD_subsection.log
    └── errors.log
```

### Current Phase Status

- ✅ **Phase 1:** Infrastructure Setup (Complete)
- ✅ **Phase 2:** Core Implementation (Complete)
- ⏳ **Phase 3:** Testing Strategy (Pending)
- ⏳ **Phase 4:** Documentation (Pending)
- ⏳ **Phase 5:** QA & Deployment (Pending)

---

## Best Practices

### File Organization

1. ✅ Keep related files together
2. ✅ Use barrel exports for clean imports
3. ✅ Mirror test structure to source structure
4. ✅ Separate UI descriptions from logic
5. ✅ Keep utilities pure and reusable

### Naming

1. ✅ Use clear, descriptive names
2. ✅ Follow language conventions (camelCase, PascalCase, kebab-case)
3. ✅ Suffix files by type (.node.ts, .test.ts, .credentials.ts)
4. ✅ Use plural for collections (operations/, reports/)
5. ✅ Use singular for single items (store/, document/)

### Documentation

1. ✅ Document at phase level (README.md)
2. ✅ Create detailed reports for each subsection
3. ✅ Keep temporary reports in temp/ (gitignored)
4. ✅ Copy finalized reports to docs/specs/
5. ✅ Include completion summaries for each phase

---

## References

- **n8n Node Structure:** https://docs.n8n.io/integrations/creating-nodes/code/
- **TypeScript Project Structure:** https://www.typescriptlang.org/docs/handbook/project-references.html
- **Jest Testing Structure:** https://jestjs.io/docs/configuration

---

**Last Updated:** 2025-11-24
**Maintained By:** Project Team

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>
