#!/bin/bash

# Start n8n with Gemini File Search nodes
# This script ensures n8n loads the custom nodes correctly

echo "Starting n8n with Gemini File Search Tool..."
echo "=============================================="

# Set environment variables
export N8N_COMMUNITY_PACKAGES_ENABLED=true

# Start n8n with debug logging to see if nodes load
echo ""
echo "n8n will start on http://localhost:5678"
echo "Look for these messages in the output:"
echo "  - 'Loaded: Gemini File Search Stores'"
echo "  - 'Loaded: Gemini File Search Documents'"
echo ""
echo "Press Ctrl+C to stop n8n"
echo "=============================================="
echo ""

# Start n8n
n8n start
