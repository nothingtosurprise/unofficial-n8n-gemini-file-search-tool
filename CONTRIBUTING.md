# Contributing to n8n-nodes-gemini-file-search

Thank you for your interest in contributing to n8n-nodes-gemini-file-search! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Making Changes](#making-changes)
- [Testing](#testing)
- [Code Style](#code-style)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Reporting Bugs](#reporting-bugs)
- [Requesting Features](#requesting-features)

## Code of Conduct

This project adheres to a code of conduct that all contributors are expected to follow. Please be respectful and constructive in all interactions.

### Our Standards

- **Be respectful**: Treat all contributors with respect and kindness
- **Be constructive**: Provide helpful feedback and suggestions
- **Be collaborative**: Work together to improve the project
- **Be patient**: Remember that everyone is learning and growing

## Getting Started

### Prerequisites

Before contributing, ensure you have:

- Node.js >= 18.0.0 installed
- npm or yarn package manager
- Git installed and configured
- A GitHub account
- n8n installed (optional, for testing)

### Fork and Clone

1. Fork the repository on GitHub
2. Clone your fork locally:

```bash
git clone https://github.com/YOUR_USERNAME/n8n-nodes-gemini-file-search.git
cd n8n-nodes-gemini-file-search
```

3. Add the upstream repository:

```bash
git remote add upstream https://github.com/ORIGINAL_OWNER/n8n-nodes-gemini-file-search.git
```

## Development Setup

### Install Dependencies

```bash
npm install
```

### Build the Project

```bash
npm run build
```

### Run Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Link to n8n (Optional)

To test your changes in a local n8n instance:

```bash
# In the project directory
npm link

# In your n8n installation directory
cd ~/.n8n/custom
npm link n8n-nodes-gemini-file-search

# Restart n8n
n8n start
```

## Project Structure

```
.
├── nodes/                      # Node implementations
│   ├── GeminiFileSearchStores/
│   │   ├── GeminiFileSearchStores.node.ts
│   │   └── operations/         # Operation implementations
│   └── GeminiFileSearchDocuments/
│       ├── GeminiFileSearchDocuments.node.ts
│       └── operations/
├── credentials/                # Credential definitions
│   └── GeminiApi.credentials.ts
├── utils/                      # Shared utilities
│   ├── apiClient.ts           # API request handling
│   ├── validators.ts          # Input validation
│   ├── helpers.ts             # Helper functions
│   └── types.ts               # TypeScript types
├── test/                       # Test suites
│   ├── unit/                  # Unit tests
│   ├── integration/           # Integration tests
│   └── e2e/                   # End-to-end tests
├── docs/                       # Documentation
└── assets/                     # Icons and assets
```

For detailed structure information, see [docs/PROJECT_STRUCTURE.md](docs/PROJECT_STRUCTURE.md).

## Making Changes

### Creating a Branch

Create a feature branch for your changes:

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

### Branch Naming Convention

- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation changes
- `test/` - Test additions or fixes
- `refactor/` - Code refactoring
- `chore/` - Build/tooling changes

### Making Your Changes

1. **Follow the existing code style**
2. **Write or update tests** for your changes
3. **Update documentation** if needed
4. **Keep changes focused** - one feature/fix per PR

### Adding a New Operation

If adding a new operation to an existing node:

1. Create operation file in `nodes/[NodeName]/operations/[category]/[operation].ts`
2. Implement the operation following existing patterns
3. Add validation in `utils/validators.ts`
4. Update node's main file to include the operation
5. Write comprehensive tests in `test/unit/nodes/[category]/`
6. Update documentation

### Adding a New Node

If adding a completely new node:

1. Create directory structure in `nodes/[NewNodeName]/`
2. Implement node following n8n conventions
3. Add icon in `assets/`
4. Add credential if needed in `credentials/`
5. Write comprehensive tests
6. Update `package.json` n8n section
7. Update documentation

## Testing

### Test Requirements

All contributions must include tests:

- **Unit tests**: Test individual functions and operations
- **Integration tests**: Test component interactions
- **Coverage**: Maintain >80% code coverage (aim for >95%)

### Writing Tests

Tests use Jest framework:

```typescript
describe('OperationName', () => {
  it('should perform expected behavior', async () => {
    // Arrange
    const input = { /* test data */ };

    // Act
    const result = await operation(input);

    // Assert
    expect(result).toEqual(expectedOutput);
  });

  it('should handle errors correctly', async () => {
    // Test error cases
    await expect(operation(invalidInput)).rejects.toThrow();
  });
});
```

### Running Specific Tests

```bash
# Run specific test file
npm test -- path/to/test.test.ts

# Run tests matching pattern
npm test -- --testNamePattern="your test name"

# Run with coverage
npm run test:coverage
```

## Code Style

### TypeScript

- Use TypeScript for all code
- Provide proper type annotations
- Avoid using `any` unless absolutely necessary
- Use interfaces from `utils/types.ts`

### Formatting

- Use Prettier for code formatting
- Run `npm run format` before committing
- Follow existing code patterns

### Linting

- Run ESLint: `npm run lint`
- Fix issues: `npm run lint:fix`
- Ensure no linting errors before submitting PR

### n8n Conventions

- Use n8n's `IExecuteFunctions`, `INodeType`, etc.
- Handle errors with `NodeOperationError` and `NodeApiError`
- Support `continueOnFail` option
- Use `helpers.constructExecutionMetaData` for output

### Best Practices

- **Write clear, self-documenting code**
- **Add comments for complex logic**
- **Keep functions small and focused**
- **Handle errors gracefully**
- **Validate all inputs**
- **Provide helpful error messages**

## Commit Guidelines

### Commit Message Format

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): subject

body (optional)

footer (optional)
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `test`: Test additions or changes
- `refactor`: Code refactoring
- `chore`: Build/tooling changes
- `perf`: Performance improvements
- `style`: Code style changes (formatting, etc.)

### Examples

```bash
feat(stores): add support for store filtering
fix(upload): handle large file timeout errors
docs(readme): update installation instructions
test(validators): add edge case tests for metadata validation
refactor(api-client): simplify error handling logic
```

### Commit Message Rules

- Use present tense ("add feature" not "added feature")
- Use imperative mood ("move cursor to..." not "moves cursor to...")
- Keep subject line under 50 characters
- Capitalize subject line
- Don't end subject line with a period
- Provide detailed body if needed

## Pull Request Process

### Before Submitting

1. **Update your branch** with latest upstream changes:

```bash
git fetch upstream
git rebase upstream/main
```

2. **Run all checks**:

```bash
npm run lint      # Check code style
npm test          # Run all tests
npm run build     # Ensure build succeeds
```

3. **Update documentation** if needed

### Creating a Pull Request

1. Push your branch to your fork:

```bash
git push origin feature/your-feature-name
```

2. Go to the repository on GitHub and click "New Pull Request"

3. Fill out the PR template with:
   - Clear description of changes
   - Related issue numbers (if applicable)
   - Screenshots (if UI changes)
   - Testing instructions
   - Checklist completion

### PR Title Format

Follow commit message format:

```
feat(stores): add support for store filtering
```

### PR Description Template

```markdown
## Description
Brief description of changes

## Related Issues
Fixes #123

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
How to test these changes

## Checklist
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] Linting passes
- [ ] Build succeeds
- [ ] All tests pass
```

### Review Process

1. Maintainers will review your PR
2. Address any requested changes
3. Once approved, your PR will be merged

### After Merge

1. Delete your feature branch:

```bash
git branch -d feature/your-feature-name
git push origin --delete feature/your-feature-name
```

2. Update your local main branch:

```bash
git checkout main
git pull upstream main
```

## Reporting Bugs

### Before Reporting

1. **Search existing issues** to avoid duplicates
2. **Try the latest version** to see if the bug is already fixed
3. **Gather information** about the bug

### Bug Report Template

```markdown
**Describe the bug**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce:
1. Go to '...'
2. Click on '...'
3. See error

**Expected behavior**
What you expected to happen.

**Screenshots**
If applicable, add screenshots.

**Environment:**
- n8n version: [e.g. 1.0.0]
- Node version: [e.g. 18.0.0]
- OS: [e.g. macOS 13.0]
- Package version: [e.g. 1.0.0]

**Additional context**
Any other relevant information.
```

## Requesting Features

### Feature Request Template

```markdown
**Is your feature request related to a problem?**
A clear description of the problem.

**Describe the solution you'd like**
What you want to happen.

**Describe alternatives you've considered**
Other solutions or features you've considered.

**Additional context**
Any other relevant information, mockups, or examples.
```

## Questions?

- **Documentation**: Check [docs/](docs/) first
- **Issues**: Search [existing issues](https://github.com/yourusername/n8n-nodes-gemini-file-search/issues)
- **Discussions**: Start a [discussion](https://github.com/yourusername/n8n-nodes-gemini-file-search/discussions)
- **n8n Community**: Ask in [n8n community forum](https://community.n8n.io)

## Recognition

Contributors will be recognized in:
- Project README
- Release notes
- Contributors list

Thank you for contributing to n8n-nodes-gemini-file-search!

---

🤖 Generated with [Claude Code](https://claude.com/claude-code)
