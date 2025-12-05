#!/bin/bash
set -e

# Disable Turbopack and build frontend only
export TURBOPACK=false
export NEXT_PUBLIC_NETWORK=testnet

cd apps/frontend
npm run build
