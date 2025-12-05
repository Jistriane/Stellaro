#!/bin/bash
# Prevent turbopack from running on Vercel builds
export TURBOPACK=false
export NEXT_TURBOPACK_ENABLED=false

cd apps/frontend
npm run build
