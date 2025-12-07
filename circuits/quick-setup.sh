#!/bin/bash

# Quick Setup - Complete ZK Circuit Setup
# Runs all setup steps in sequence

set -e

echo "🚀 Stellaro ZK Circuit - Complete Setup"
echo "========================================"
echo ""

# Step 1: Compile circuit
echo "📦 Step 1/3: Compiling circuit..."
./setup-circom.sh

echo ""
echo "================================"
echo ""

# Step 2: Generate keys
echo "🔑 Step 2/3: Generating cryptographic keys..."
./generate-keys.sh

echo ""
echo "================================"
echo ""

# Step 3: Test
echo "🧪 Step 3/3: Running tests..."
cd test
npm install
npm test

echo ""
echo "================================"
echo ""
echo "✅ Complete setup finished!"
echo ""
echo "All ZK circuit components are ready:"
echo "  ✅ Circuit compiled"
echo "  ✅ Keys generated"
echo "  ✅ Tests passed"
echo ""
echo "Next: Integrate with Soroban contract (see INTEGRATION_GUIDE.md)"
