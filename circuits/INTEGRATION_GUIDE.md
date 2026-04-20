# ZK Circuit Integration Guide

## Overview

This guide explains how to integrate the optimized ZK credit score circuit with the Stellaro Soroban smart contract.

## Architecture

```
┌─────────────────┐
│   User App      │
│  (Frontend)     │
└────────┬────────┘
         │ 1. Request proof
         ▼
┌─────────────────┐
│  Proof Service  │ ← credit_score_optimized.circom
│  (Node.js)      │ ← credit_score_optimized_final.zkey
└────────┬────────┘
         │ 2. Generate proof
         ▼
┌─────────────────┐
│ Soroban Contract│ ← verification_key_optimized.json
│  (zk_verifier)  │
└────────┬────────┘
         │ 3. Verify on-chain
         ▼
┌─────────────────┐
│  Stellar Ledger │
└─────────────────┘
```

## Step 1: Setup Circuit

### Install Dependencies

```bash
cd circuits
./setup-circom.sh
```

This will:
- Clone circomlib
- Compile optimized circuit
- Show constraint statistics

### Verify Constraint Count

```bash
snarkjs r1cs info credit_score_optimized.r1cs
```

Expected output:
```
# of Wires: ~5,000
# of Constraints: ~45,000 ( <50K target)
# of Private Inputs: 5
# of Public Inputs: 2
# of Outputs: 1
```

## Step 2: Generate Keys

### Download Powers of Tau

```bash
cd circuits

# Download trusted setup (16 = 2^16 = 65K constraints)
wget https://hermez.s3-eu-west-1.amazonaws.com/powersOfTau28_hez_final_16.ptau
```

### Generate Proving Key

```bash
# Initial setup
snarkjs groth16 setup \
  credit_score_optimized.r1cs \
  powersOfTau28_hez_final_16.ptau \
  credit_score_optimized_0000.zkey

# Contribute to ceremony (add randomness)
snarkjs zkey contribute \
  credit_score_optimized_0000.zkey \
  credit_score_optimized_final.zkey \
  --name="Stellaro Initial Contribution" \
  -v

# Export verification key
snarkjs zkey export verificationkey \
  credit_score_optimized_final.zkey \
  verification_key_optimized.json
```

### Verify Setup

```bash
snarkjs zkey verify \
  credit_score_optimized.r1cs \
  powersOfTau28_hez_final_16.ptau \
  credit_score_optimized_final.zkey
```

## Step 3: Test Proof Generation

### Install Test Dependencies

```bash
cd test
npm install
```

### Run Test

```bash
npm test
```

Expected output:
```
 Testing ZK Proof Generation

 Input Data:
  Public: minScore=650, timestamp=1702857600
  Private: actualScore=720 (hidden in proof)

  Generating witness...
    Witness generated in 45ms

  Generating proof...
    Proof generated in 850ms

  Verifying proof...
    Proof verified in 35ms

 Results:
   Witness Time: 45ms
   Proof Time: 850ms
   Verify Time: 35ms
   Total Time: 930ms
   Verified:  YES
   Proof Size: 1152 bytes (1.13 KB)

 Performance Targets:
   Witness < 100ms:  (45ms)
   Proof < 1000ms:  (850ms)
   Verify < 50ms:  (35ms)

 Testing Security (invalid proof)...
    Circuit correctly rejected invalid input

 All tests passed!
```

## Step 4: Update Soroban Contract

### Convert Verification Key to Compact Format

The Soroban contract needs the verification key in a compact format.

```bash
# Create compact version (for gas optimization)
node ../tools/convert-vkey.js \
  verification_key_optimized.json \
  verification_key_optimized.compact.json
```

Or manually extract the key fields:

```json
{
  "alpha": ["...", "..."],
  "beta": [["...", "..."], ["...", "..."]],
  "gamma": [["...", "..."], ["...", "..."]],
  "delta": [["...", "..."], ["...", "..."]],
  "ic": [["...", "..."], ...]
}
```

### Update Contract Code

**File:** `contracts/zk_verifier/src/lib.rs`

```rust
// Update verification key constant
const VERIFICATION_KEY: &str = include_str!(
    "../../../circuits/verification_key_optimized.compact.json"
);

// Parse and verify proof
pub fn verify_credit_proof(
    env: Env,
    proof: BytesN<384>,      // Groth16 proof (3 points)
    public_inputs: Vec<u128> // [minScore, timestamp]
) -> bool {
    // 1. Parse verification key
    let vkey: VerificationKey = serde_json::from_str(VERIFICATION_KEY)
        .expect("Invalid verification key");
    
    // 2. Parse proof
    let proof_obj = parse_groth16_proof(&proof);
    
    // 3. Verify pairing equation
    verify_groth16(&vkey, &proof_obj, &public_inputs)
}

// Helper: Parse Groth16 proof
fn parse_groth16_proof(proof: &BytesN<384>) -> Proof {
    Proof {
        a: G1Point::from_bytes(&proof.slice(0..128)),
        b: G2Point::from_bytes(&proof.slice(128..256)),
        c: G1Point::from_bytes(&proof.slice(256..384)),
    }
}

// Helper: Verify Groth16 pairing equation
fn verify_groth16(
    vkey: &VerificationKey,
    proof: &Proof,
    public_inputs: &[u128]
) -> bool {
    // e(A, B) = e(alpha, beta) * e(L, gamma) * e(C, delta)
    // where L = vkey.IC[0] + sum(public_inputs[i] * vkey.IC[i+1])
    
    // ... Groth16 verification logic ...
    // (Already implemented in existing contract)
}
```

### Rebuild Contract

```bash
cd contracts/zk_verifier
cargo build --target wasm32-unknown-unknown --release
```

### Deploy Updated Contract

```bash
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/zk_verifier.wasm \
  --source S... \
  --network testnet
```

## Step 5: Integrate with Backend

### Create Proof Service

**File:** `apps/backend/src/services/zk-proof.service.ts`

```typescript
import { Injectable } from '@nestjs/common';
import * as snarkjs from 'snarkjs';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ZkProofService {
  private wasmPath = path.join(__dirname, '../../../circuits/credit_score_optimized_js/credit_score_optimized.wasm');
  private zkeyPath = path.join(__dirname, '../../../circuits/credit_score_optimized_final.zkey');

  /**
   * Generate ZK proof for credit score
   */
  async generateCreditProof(input: {
    minScore: number;
    timestamp: number;
    actualScore: number;
    txCount: number;
    avgRepaymentTime: number;
    liquidityProvided: number;
  }): Promise<{ proof: any; publicSignals: any }> {
    // Add random salt for privacy
    const salt = Math.floor(Math.random() * 1000000);

    // Generate proof
    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
      { ...input, salt },
      this.wasmPath,
      this.zkeyPath
    );

    return { proof, publicSignals };
  }

  /**
   * Serialize proof for Soroban contract
   */
  serializeProof(proof: any): Buffer {
    // Convert proof to 384-byte buffer (3 G1/G2 points)
    // Format: [A.x, A.y, B.x0, B.x1, B.y0, B.y1, C.x, C.y]
    
    const buffer = Buffer.alloc(384);
    
    // A (G1 point - 128 bytes)
    buffer.write(proof.pi_a[0], 0, 64, 'hex');
    buffer.write(proof.pi_a[1], 64, 64, 'hex');
    
    // B (G2 point - 256 bytes)
    buffer.write(proof.pi_b[0][0], 128, 64, 'hex');
    buffer.write(proof.pi_b[0][1], 192, 64, 'hex');
    buffer.write(proof.pi_b[1][0], 256, 64, 'hex');
    buffer.write(proof.pi_b[1][1], 320, 64, 'hex');
    
    // C (G1 point - 128 bytes)
    // Note: Only first 128 bytes used
    buffer.write(proof.pi_c[0], 384 - 128, 64, 'hex');
    buffer.write(proof.pi_c[1], 384 - 64, 64, 'hex');
    
    return buffer;
  }
}
```

### Create API Endpoint

**File:** `apps/backend/src/controllers/credit-proof.controller.ts`

```typescript
import { Controller, Post, Body } from '@nestjs/common';
import { ZkProofService } from '../services/zk-proof.service';
import { SorobanService } from '../services/soroban.service';

@Controller('api/credit-proof')
export class CreditProofController {
  constructor(
    private zkProofService: ZkProofService,
    private sorobanService: SorobanService,
  ) {}

  @Post('generate')
  async generateProof(@Body() data: {
    minScore: number;
    actualScore: number;
    txCount: number;
    avgRepaymentTime: number;
    liquidityProvided: number;
  }) {
    // 1. Generate proof
    const { proof, publicSignals } = await this.zkProofService.generateCreditProof({
      ...data,
      timestamp: Math.floor(Date.now() / 1000),
    });

    // 2. Serialize for Soroban
    const proofBytes = this.zkProofService.serializeProof(proof);

    // 3. Submit to Soroban contract
    const txHash = await this.sorobanService.submitCreditProof(
      proofBytes,
      publicSignals
    );

    return {
      success: true,
      proof: proof,
      publicSignals: publicSignals,
      txHash: txHash,
    };
  }

  @Post('verify')
  async verifyProof(@Body() data: {
    userId: string;
    minScore: number;
  }) {
    // Query Soroban contract for verification result
    const isValid = await this.sorobanService.checkCreditProof(
      data.userId,
      data.minScore
    );

    return { isValid };
  }
}
```

## Step 6: Frontend Integration

**File:** `apps/frontend/src/lib/zk-proof.ts`

```typescript
export async function requestCreditProof(
  minScore: number,
  userData: {
    actualScore: number;
    txCount: number;
    avgRepaymentTime: number;
    liquidityProvided: number;
  }
) {
  const response = await fetch('/api/credit-proof/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      minScore,
      ...userData,
    }),
  });

  return response.json();
}

export async function verifyCreditProof(userId: string, minScore: number) {
  const response = await fetch('/api/credit-proof/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, minScore }),
  });

  return response.json();
}
```

## Step 7: Testing End-to-End

### Test Flow

```bash
# 1. Start backend
cd apps/backend
npm run start:dev

# 2. Generate proof via API
curl -X POST http://localhost:3000/api/credit-proof/generate \
  -H "Content-Type: application/json" \
  -d '{
    "minScore": 650,
    "actualScore": 720,
    "txCount": 45,
    "avgRepaymentTime": 15,
    "liquidityProvided": 5000
  }'

# 3. Verify proof on-chain
curl -X POST http://localhost:3000/api/credit-proof/verify \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "550e8400-e29b-41d4-a716-446655440000",
    "minScore": 650
  }'
```

## Performance Benchmarks

| Operation | Time | Notes |
|-----------|------|-------|
| Witness Generation | ~50ms | Client-side possible |
| Proof Generation | <1s | Backend recommended |
| Proof Serialization | <10ms | Trivial |
| On-chain Verification | ~100ms | Soroban gas cost |
| **Total E2E** | **~1.2s** | Acceptable UX |

## Security Considerations

1.  **Private Inputs Never Leave Client:** Proof generation should ideally be client-side
2.  **Zero-Knowledge:** No sensitive data revealed in proof
3.  **Soundness:** Cannot forge valid proof for invalid score
4.  **Replay Protection:** Timestamp prevents old proof reuse
5.  **Trusted Setup:** Initial ceremony requires trust (can use multi-party computation)

## Troubleshooting

### "Proof verification failed"
- Check public inputs match (minScore, timestamp)
- Verify circuit compiled correctly
- Ensure verification key matches proving key

### "Constraint not satisfied"
- Input validation failed (e.g., score out of range)
- Check all private inputs meet circuit constraints

### "Out of gas" on Soroban
- Verification key too large (use compact format)
- Consider using Groth16 (smallest proofs)

## Next Steps

1.  Test circuit optimization
2.  Generate production keys with multi-party ceremony
3.  Deploy updated Soroban contract
4.  Integrate with backend API
5.  Add frontend UI for proof generation
6.  Load test end-to-end flow

## References

- [Groth16 Verification in Rust](https://github.com/arkworks-rs/groth16)
- [snarkjs Documentation](https://github.com/iden3/snarkjs)
- [Soroban ZK Examples](https://developers.stellar.org/docs/smart-contracts)
