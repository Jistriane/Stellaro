#!/bin/bash

# Generate Proving and Verification Keys for ZK Circuit
# This script generates the cryptographic keys needed for proof generation

set -e

echo "🔑 Generating ZK Circuit Keys..."
echo ""

# Check if circuit is compiled
if [ ! -f "credit_score_optimized.r1cs" ]; then
  echo "❌ Error: Circuit not compiled. Run ./setup-circom.sh first"
  exit 1
fi

# Check if Powers of Tau exists
if [ ! -f "pot12_final.ptau" ]; then
  echo "⚠️  Powers of Tau not found. Using existing pot12_final.ptau or downloading..."
  
  if [ ! -f "pot12_final.ptau" ]; then
    echo "📥 Downloading Powers of Tau (12)..."
    # For circuits with ~45K constraints, pot12 (2^12 = 4096 constraints) is NOT enough
    # We need pot16 (2^16 = 65536 constraints)
    echo "📥 Downloading pot16 (this may take a while)..."
    wget https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_16.ptau -O pot16_final.ptau
    POT_FILE="pot16_final.ptau"
  else
    POT_FILE="pot12_final.ptau"
  fi
else
  POT_FILE="pot12_final.ptau"
fi

# 1. Initial setup
echo "1️⃣  Initial Groth16 setup..."
snarkjs groth16 setup \
  credit_score_optimized.r1cs \
  ${POT_FILE} \
  credit_score_optimized_0000.zkey

# 2. Contribute to ceremony (adds randomness)
echo ""
echo "2️⃣  Contributing to trusted setup ceremony..."
echo "   (This adds randomness to ensure security)"
snarkjs zkey contribute \
  credit_score_optimized_0000.zkey \
  credit_score_optimized_final.zkey \
  --name="Stellaro Initial Contribution" \
  -v -e="$(openssl rand -hex 32)"

# 3. Export verification key
echo ""
echo "3️⃣  Exporting verification key..."
snarkjs zkey export verificationkey \
  credit_score_optimized_final.zkey \
  verification_key_optimized.json

# 4. Verify the setup
echo ""
echo "4️⃣  Verifying setup..."
snarkjs zkey verify \
  credit_score_optimized.r1cs \
  ${POT_FILE} \
  credit_score_optimized_final.zkey

# 5. Show key info
echo ""
echo "📊 Key Statistics:"
ls -lh credit_score_optimized_final.zkey verification_key_optimized.json

echo ""
echo "✅ Key generation complete!"
echo ""
echo "Generated files:"
echo "  - credit_score_optimized_final.zkey (proving key)"
echo "  - verification_key_optimized.json (verification key)"
echo ""
echo "Next steps:"
echo "  1. Test proof generation: cd test && npm test"
echo "  2. Integrate with Soroban: See INTEGRATION_GUIDE.md"
