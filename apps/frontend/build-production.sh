#!/bin/bash
# Force disable turbopack for any build on Vercel
export TURBOPACK=false
export NEXT_TURBOPACK_ENABLED=false

# Change to the correct directory
if [ -d "apps/frontend" ]; then
  cd apps/frontend
fi

# Run npm build with turbopack disabled
npm run build
