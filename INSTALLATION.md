# Installation Guide - n8n Gemini File Search Tool

Complete guide to building and installing the n8n Gemini File Search Tool package.

---

## 🚀 Quick Start (Recommended)

### Automated Installation Script

The easiest way to install for local development:

```bash
# Run the installation script
./scripts/install-local.sh
```

This script will:
1. ✅ Clean previous builds
2. ✅ Install dependencies
3. ✅ Run linter and tests
4. ✅ Build the package
5. ✅ Link to n8n
6. ✅ Configure environment
7. ✅ Provide next steps

Then restart n8n and you're ready to go!

---

## 📋 Manual Installation Methods

### Method 1: Local Development (npm link)

**Step 1: Build the Package**
```bash
# Clean previous build
rm -rf dist

# Install dependencies
npm install

# Build TypeScript
npm run build
```

**Step 2: Create Global Link**
```bash
# Create global npm link
npm link
```

**Step 3: Link to n8n**
```bash
# Create n8n custom folder
mkdir -p ~/.n8n/custom

# Navigate to custom folder
cd ~/.n8n/custom

# Link the package
npm link n8n-nodes-gemini-file-search

# Go back to your project
cd -
```

**Step 4: Configure n8n**

Create or edit `~/.n8n/.env`:
```bash
N8N_CUSTOM_EXTENSIONS=~/.n8n/custom
```

**Step 5: Restart n8n**
```bash
# If n8n is running, stop it (Ctrl+C)
# Then start it again
n8n start

# Or
npx n8n
```

---

### Method 2: Install from Tarball (Offline/Testing)

**Step 1: Pack the Module**
```bash
# Build and create tarball
npm run build
npm pack

# This creates: n8n-nodes-gemini-file-search-1.0.0.tgz
```

**Step 2: Install Tarball**
```bash
# Install globally
npm install -g ./n8n-nodes-gemini-file-search-1.0.0.tgz

# Or in n8n custom folder
cd ~/.n8n/custom
npm install ../path/to/n8n-nodes-gemini-file-search-1.0.0.tgz
```

---

### Method 3: Publish to npm Registry

**Step 1: Prepare for Publishing**
```bash
# Update version if needed
npm version patch  # or minor, major

# Login to npm
npm login
```

**Step 2: Publish**
```bash
# Publish to npm registry
npm publish

# Or publish as scoped package
npm publish --access public
```

**Step 3: Install in n8n**
```bash
# Install globally
npm install -g n8n-nodes-gemini-file-search

# Or in custom folder
cd ~/.n8n/custom
npm install n8n-nodes-gemini-file-search
```

---

### Method 4: Docker Installation

**Option A: Custom Dockerfile**

Create `Dockerfile`:
```dockerfile
FROM n8nio/n8n:latest

USER root

# Install custom nodes
RUN npm install -g n8n-nodes-gemini-file-search

USER node

# Optional: Set custom extensions path
ENV N8N_CUSTOM_EXTENSIONS=/data/custom
```

Build and run:
```bash
docker build -t n8n-with-gemini .
docker run -p 5678:5678 n8n-with-gemini
```

**Option B: Docker Compose**

Create `docker-compose.yml`:
```yaml
version: '3.8'

services:
  n8n:
    image: n8nio/n8n:latest
    ports:
      - "5678:5678"
    environment:
      - N8N_CUSTOM_EXTENSIONS=/data/custom
    volumes:
      - ~/.n8n:/data
      # Mount your built package
      - ./dist:/data/custom/n8n-nodes-gemini-file-search
    restart: unless-stopped
```

Run:
```bash
docker-compose up -d
```

---

## ✅ Verification

### 1. Check n8n Logs

Look for these messages when n8n starts:
```
Loaded custom node: Gemini File Search Stores
Loaded custom node: Gemini File Search Documents
```

### 2. Verify in n8n UI

1. Open n8n: http://localhost:5678
2. Create a new workflow
3. Click "+" to add a node
4. Search for "Gemini"
5. You should see:
   - **Gemini File Search Stores** ✅
   - **Gemini File Search Documents** ✅

### 3. Test Node Functionality

**Create a simple workflow:**
1. Add "Gemini File Search Stores" node
2. Select "Create" operation
3. Add "Gemini API" credentials
4. Test the node

---

## 🔑 Setting Up Credentials

### Get Google AI API Key

1. Visit: https://aistudio.google.com/app/apikey
2. Create or select a project
3. Click "Create API Key"
4. Copy the key

### Add Credentials in n8n

1. Click "Credentials" in n8n sidebar
2. Click "Add Credential"
3. Search for "Gemini API"
4. Enter your API key
5. Save

---

## 🔧 Troubleshooting

### Nodes Not Appearing in n8n

**Check n8n Custom Extensions Path:**
```bash
# Verify environment variable
echo $N8N_CUSTOM_EXTENSIONS

# Or check in ~/.n8n/.env
cat ~/.n8n/.env | grep CUSTOM
```

**Check if Package is Linked:**
```bash
# List globally linked packages
npm list -g --depth=0 | grep gemini

# Check in custom folder
ls -la ~/.n8n/custom/node_modules/ | grep gemini
```

**Rebuild and Relink:**
```bash
# Unlink
npm unlink -g n8n-nodes-gemini-file-search

# Rebuild
npm run build

# Relink
npm link
cd ~/.n8n/custom
npm link n8n-nodes-gemini-file-search
```

### Build Errors

**Clear npm Cache:**
```bash
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
npm run build
```

### n8n Not Loading Nodes

**Restart n8n with Verbose Logging:**
```bash
# Stop n8n
# Start with debug output
N8N_LOG_LEVEL=debug n8n start
```

**Check n8n Version:**
```bash
# Ensure you have compatible n8n version
n8n --version

# Minimum required: ^1.0.0
```

---

## 📦 Development Workflow

### Making Changes

```bash
# 1. Make your changes to the code

# 2. Rebuild
npm run build

# 3. Restart n8n
# The changes will be picked up automatically (if linked)
```

### Running Tests Before Install

```bash
# Run all tests
npm test

# Run only unit tests
npm test -- --testPathPattern=unit

# Run specific test file
npm test -- test/unit/nodes/documents/upload.test.ts
```

### Watch Mode (Auto-rebuild)

```bash
# Terminal 1: Watch and rebuild on changes
npm run build -- --watch

# Terminal 2: Run n8n
n8n start
```

---

## 🗑️ Uninstallation

### Remove Global Link

```bash
# Unlink from n8n
cd ~/.n8n/custom
npm unlink n8n-nodes-gemini-file-search

# Remove global link
npm unlink -g n8n-nodes-gemini-file-search
```

### Remove from n8n Custom Folder

```bash
rm -rf ~/.n8n/custom/node_modules/n8n-nodes-gemini-file-search
```

### Remove Global Installation

```bash
npm uninstall -g n8n-nodes-gemini-file-search
```

---

## 📚 Additional Resources

### Package Information

- **Package Name:** n8n-nodes-gemini-file-search
- **Version:** 1.0.0
- **n8n Version:** ^1.0.0
- **License:** MIT

### Documentation

- [Getting Started Guide](./docs/GETTING_STARTED.md)
- [API Documentation](./docs/API.md)
- [Node Documentation](./docs/nodes/)
- [Troubleshooting Guide](./docs/TROUBLESHOOTING.md)

### Support

- **Issues:** https://github.com/yourusername/n8n-nodes-gemini-file-search/issues
- **Discussions:** https://github.com/yourusername/n8n-nodes-gemini-file-search/discussions
- **n8n Community:** https://community.n8n.io

---

## 🎯 Quick Commands Reference

| Task | Command |
|------|---------|
| **Install (Auto)** | `./scripts/install-local.sh` |
| **Build** | `npm run build` |
| **Test** | `npm test` |
| **Lint** | `npm run lint` |
| **Link** | `npm link` |
| **Unlink** | `npm unlink -g n8n-nodes-gemini-file-search` |
| **Pack** | `npm pack` |
| **Publish** | `npm publish` |
| **Clean** | `rm -rf dist node_modules` |

---

**Last Updated:** 2025-11-24
**Version:** 1.0.0

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
