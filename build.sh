#!/bin/bash
# Vercel build script - disable turbopack and build frontend
export TURBOPACK=false
export NEXT_TURBOPACK_ENABLED=false
export NEXT_PUBLIC_NETWORK=testnet

cd apps/frontend
npm run build
