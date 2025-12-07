# ZK Circuits - Stellaro Credit Score

Zero-Knowledge proof circuit for privacy-preserving credit score verification on Stellar/Soroban.

## 📋 Quick Start

### Option 1: Automatic Setup (Recommended)

Run everything in one command:

```bash
./quick-setup.sh
```

This will:
1. ✅ Compile the optimized circuit
2. ✅ Generate proving and verification keys
3. ✅ Run tests to verify everything works

### Option 2: Manual Setup

```bash
# 1. Compile circuit
./setup-circom.sh

# 2. Generate keys
./generate-keys.sh

# 3. Test
cd test && npm install && npm test
```

## 📁 Files Overview

### Core Circuit Files
- `credit_score_optimized.circom` - Optimized ZK circuit (~45K constraints)
- `credit_score.circom` - Original circuit (~150K constraints) - legacy

### Scripts
- `quick-setup.sh` - **START HERE** - Complete automated setup
- `setup-circom.sh` - Compile circuit only
- `generate-keys.sh` - Generate cryptographic keys

### Generated Files (after setup)
- `credit_score_optimized.r1cs` - R1CS constraint system
- `credit_score_optimized_js/` - WASM witness generator
- `credit_score_optimized_final.zkey` - Proving key (~10MB)
- `verification_key_optimized.json` - Verification key (~2KB)

### Documentation
- `OPTIMIZATION_GUIDE.md` - Circuit optimization details
- `INTEGRATION_GUIDE.md` - Soroban contract integration

### Tests
- `test/test-proof-generation.js` - Comprehensive test suite
- `test/package.json` - Test dependencies

## 🎯 What Does This Circuit Do?

Proves that a user has a credit score ≥ `minScore` **WITHOUT revealing**:
- ❌ Actual credit score
- ❌ Transaction history
- ❌ Account balance
- ❌ Personal data

### Public Inputs (visible on-chain)
- `minScore`: Minimum required score (e.g., 650)
- `timestamp`: Proof generation time

### Private Inputs (hidden)
- `actualScore`: User's real credit score
- `txCount`: Number of transactions
- `avgRepaymentTime`: Average loan repayment time
- `liquidityProvided`: Liquidity contributions
- `salt`: Random value for privacy

## 🔬 Technical Specifications

| Metric | Value |
|--------|-------|
| **Constraints** | ~45,000 (70% reduction from original) |
| **Proof Generation** | <1 second |
| **Proof Size** | 1.2 KB (Groth16) |
| **Verification Time** | <50ms |
| **Security** | 128-bit (BN254 curve) |

## 📊 Performance Comparison

| Version | Constraints | Proof Time | Improvement |
|---------|-------------|------------|-------------|
| Original | ~150,000 | ~3s | Baseline |
| **Optimized** | **~45,000** | **<1s** | **70% faster** |

## 🔧 Requirements

### System Requirements
- **circom**: Circuit compiler (v2.1.0+)
  ```bash
  npm install -g circom
  ```

- **snarkjs**: Proof generation library
  ```bash
  npm install -g snarkjs
  ```

- **Node.js**: v16+ (for tests)

### Installation Check

```bash
# Check circom
circom --version  # Should show: circom compiler 2.1.x

# Check snarkjs
snarkjs --version  # Should show: snarkjs@0.7.x

# Check Node.js
node --version  # Should show: v16.x or higher
```

## 🧪 Testing

After running `./quick-setup.sh`, you should see:

```
🧪 Testing ZK Proof Generation

📥 Input Data:
  Public: minScore=650, timestamp=1702857600
  Private: actualScore=720 (hidden in proof)

1️⃣  Generating witness...
   ✅ Witness generated in 45ms

2️⃣  Generating proof...
   ✅ Proof generated in 850ms

3️⃣  Verifying proof...
   ✅ Proof verified in 35ms

📊 Results:
   Witness Time: 45ms
   Proof Time: 850ms
   Verify Time: 35ms
   Total Time: 930ms
   Verified: ✅ YES
   Proof Size: 1152 bytes (1.13 KB)

🎯 Performance Targets:
   Witness < 100ms: ✅ (45ms)
   Proof < 1000ms: ✅ (850ms)
   Verify < 50ms: ✅ (35ms)

🔒 Testing Security (invalid proof)...
   ✅ Circuit correctly rejected invalid input

✅ All tests passed!
```

## 🔐 Security Notes

### Trusted Setup
- Uses Powers of Tau ceremony (pot16 = 2^16 constraints)
- Initial contribution adds randomness
- For production: Use multi-party computation (MPC) ceremony

### Zero-Knowledge Properties
1. ✅ **Soundness**: Cannot forge valid proof for invalid score
2. ✅ **Zero-Knowledge**: No information leaked about private inputs
3. ✅ **Completeness**: Valid proofs always verify

### Replay Protection
- `timestamp` prevents reusing old proofs
- Smart contract should check timestamp freshness

## 🚀 Integration with Soroban

After setup, integrate with the `zk_verifier` Soroban contract:

1. Copy verification key:
   ```bash
   cp verification_key_optimized.json ../contracts/zk_verifier/
   ```

2. Update contract code to use new key

3. Rebuild and deploy contract

See `INTEGRATION_GUIDE.md` for detailed steps.

## 📚 Documentation

- **Optimization Guide**: `OPTIMIZATION_GUIDE.md` - How we reduced constraints by 70%
- **Integration Guide**: `INTEGRATION_GUIDE.md` - Soroban contract integration
- **Test Suite**: `test/test-proof-generation.js` - Comprehensive testing

## 🐛 Troubleshooting

### "circom: command not found"
```bash
npm install -g circom
```

### "snarkjs: command not found"
```bash
npm install -g snarkjs
```

### "Error: WASM file not found"
Run setup first:
```bash
./setup-circom.sh
```

### "Error: Proving key not found"
Generate keys:
```bash
./generate-keys.sh
```

### Powers of Tau download fails
Manually download:
```bash
wget https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_16.ptau -O pot16_final.ptau
```

## 📞 Support

For issues or questions:
- Check `OPTIMIZATION_GUIDE.md` for technical details
- Review `INTEGRATION_GUIDE.md` for integration help
- See test output for debugging hints

## 📝 License

Part of the Stellaro project.

---

**Ready to start?** Run `./quick-setup.sh` now! 🚀
