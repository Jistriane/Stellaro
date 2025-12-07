#!/bin/bash

# Setup Circom Dependencies
# Instala circomlib para usar templates padrão

set -e

echo "🔧 Setting up Circom environment..."

# 1. Compile circuit (optimized version doesn't need circomlib)
echo "🔨 Compiling credit_score_optimized.circom..."
circom credit_score_optimized.circom --r1cs --wasm --sym --c

# 2. Show stats
echo ""
echo "📊 Circuit Statistics:"
if command -v snarkjs &> /dev/null; then
  snarkjs r1cs info credit_score_optimized.r1cs
else
  echo "⚠️  snarkjs not installed globally."
  echo "Install with: npm install -g snarkjs"
  echo ""
  echo "Checking local r1cs file..."
  if [ -f "credit_score_optimized.r1cs" ]; then
    echo "✅ Circuit compiled successfully!"
    echo "   File: credit_score_optimized.r1cs"
    ls -lh credit_score_optimized.r1cs
  fi
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Generate keys: ./generate-keys.sh"
echo "  2. Test proof: cd test && npm test"
echo ""
echo "Or run complete setup:"
echo "  ./generate-keys.sh && cd test && npm install && npm test"
