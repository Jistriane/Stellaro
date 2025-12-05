#!/bin/bash
set -e

# Force disable turbopack for any build on Vercel
export TURBOPACK=false
export NEXT_TURBOPACK_ENABLED=false
export NEXT_PUBLIC_NETWORK=testnet

# Navigate to frontend and build
cd "$(dirname "$0")/apps/frontend"
npm run build

