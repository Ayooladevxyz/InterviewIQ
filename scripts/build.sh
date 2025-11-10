#!/bin/bash
set -e

echo "Building InterviewIQ for production..."

echo "Step 1: Building frontend with Vite..."
vite build

echo "Step 2: Building backend with esbuild..."
esbuild server/index.ts \
  --bundle \
  --platform=node \
  --packages=external \
  --outfile=dist/index.js \
  --format=esm \
  --banner:js="import { createRequire } from 'module'; const require = createRequire(import.meta.url);"

echo "Build complete! Output:"
echo "  - Frontend: dist/public/"
echo "  - Backend: dist/index.js"
echo ""
echo "To start the production server, run: npm start"
