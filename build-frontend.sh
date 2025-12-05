#!/bin/bash
set -e

echo "🏗️  Building Stellaro Frontend for Vercel..."

# Set environment variables
export TURBOPACK=false
export NEXT_PUBLIC_NETWORK=testnet

# Install dependencies at root
echo "📦 Installing dependencies..."
npm install

# Build frontend
echo "🚀 Building frontend..."
cd apps/frontend
TURBOPACK=false npm run build

echo "✅ Build completed successfully!"
