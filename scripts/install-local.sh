#!/bin/bash

# n8n Gemini File Search Tool - Local Installation Script
# This script builds and installs the package for local n8n development

set -e  # Exit on error

echo "=================================="
echo "n8n Gemini File Search Tool"
echo "Local Installation Script"
echo "=================================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Clean previous build
echo -e "\n${YELLOW}Step 1: Cleaning previous build...${NC}"
if [ -d "dist" ]; then
  rm -rf dist
  echo "✓ Cleaned dist/ folder"
fi

# Step 2: Install dependencies
echo -e "\n${YELLOW}Step 2: Installing dependencies...${NC}"
npm install
echo "✓ Dependencies installed"

# Step 3: Run linting
echo -e "\n${YELLOW}Step 3: Running linter...${NC}"
npm run lint
echo "✓ Linting passed"

# Step 4: Run tests
echo -e "\n${YELLOW}Step 4: Running tests...${NC}"
npm test -- --testPathPattern="unit" --silent
echo "✓ All tests passed"

# Step 5: Build the package
echo -e "\n${YELLOW}Step 5: Building package...${NC}"
npm run build
echo "✓ Build complete"

# Step 6: Create npm link
echo -e "\n${YELLOW}Step 6: Creating npm link...${NC}"
npm link
echo "✓ Package linked globally"

# Step 7: Set up n8n custom folder
echo -e "\n${YELLOW}Step 7: Setting up n8n custom folder...${NC}"
N8N_CUSTOM_DIR="$HOME/.n8n/custom"
mkdir -p "$N8N_CUSTOM_DIR"
echo "✓ Created $N8N_CUSTOM_DIR"

# Step 8: Link to n8n
echo -e "\n${YELLOW}Step 8: Linking to n8n...${NC}"
cd "$N8N_CUSTOM_DIR"
npm link n8n-nodes-gemini-file-search
cd -
echo "✓ Package linked to n8n"

# Step 9: Create .env file if it doesn't exist
echo -e "\n${YELLOW}Step 9: Configuring n8n environment...${NC}"
N8N_ENV_FILE="$HOME/.n8n/.env"
if [ ! -f "$N8N_ENV_FILE" ]; then
  cat > "$N8N_ENV_FILE" << EOF
# n8n Environment Configuration
N8N_CUSTOM_EXTENSIONS=$HOME/.n8n/custom
EOF
  echo "✓ Created $N8N_ENV_FILE"
else
  if ! grep -q "N8N_CUSTOM_EXTENSIONS" "$N8N_ENV_FILE"; then
    echo "N8N_CUSTOM_EXTENSIONS=$HOME/.n8n/custom" >> "$N8N_ENV_FILE"
    echo "✓ Added N8N_CUSTOM_EXTENSIONS to existing .env"
  else
    echo "✓ N8N_CUSTOM_EXTENSIONS already configured"
  fi
fi

# Final instructions
echo -e "\n${GREEN}=================================="
echo "✓ Installation Complete!"
echo "==================================${NC}"
echo ""
echo "Next steps:"
echo "1. ${YELLOW}Restart n8n${NC} if it's running:"
echo "   ${GREEN}n8n start${NC}"
echo ""
echo "2. ${YELLOW}Open n8n${NC} in your browser:"
echo "   ${GREEN}http://localhost:5678${NC}"
echo ""
echo "3. ${YELLOW}Search for 'Gemini'${NC} when adding nodes"
echo "   You should see:"
echo "   - Gemini File Search Stores"
echo "   - Gemini File Search Documents"
echo ""
echo "4. ${YELLOW}Configure credentials:${NC}"
echo "   - Add 'Gemini API' credential"
echo "   - Enter your Google AI API key"
echo ""
echo "Package version: $(node -p "require('./package.json').version")"
echo ""
echo "For troubleshooting, check n8n logs for:"
echo "  'Loaded custom node: Gemini File Search Stores'"
echo "  'Loaded custom node: Gemini File Search Documents'"
echo ""
