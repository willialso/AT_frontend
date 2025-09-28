#!/bin/bash

# ✅ ATTICUS BUILD SCRIPT FOR RENDER
# Following odin.fun pattern: Off-chain frontend deployment

echo "🚀 Starting Atticus build process..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the project
echo "🔨 Building project..."
npm run build

echo "✅ Build completed successfully!"
