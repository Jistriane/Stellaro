#!/bin/bash
# Force disable turbopack for any build on Vercel
export TURBOPACK=false
export NEXT_TURBOPACK_ENABLED=false

# Run npm build with turbopack disabled
npm run build
