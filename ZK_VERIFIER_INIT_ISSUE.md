# ZK Verifier Contract Initialization Issue

## Status
**BLOCKER**: Contract `init` function fails via Stellar CLI with "Missing Entry VerificationKey" error.

## Context
- **Contract ID (new)**: `CDJX3YLVANLTRRMMWDJO6NG7ADKJIHPL3WJAZNMNL6BQU6S6D5QXBT3L`
- **Wasm Hash**: `3b3a1fdb53986a64233036e728a4aeffefcd2e50f592c170de47eb16387dcecf`
- **Network**: Stellar Testnet
- **CLI Version**: 23.1.4 (upgrading to 23.2.1)
- **Contract**: `contracts/zk_verifier`

## Problem
All attempts to initialize the ZK Verifier contract via `stellar contract invoke` fail with:
```
❌ error: Missing Entry VerificationKey
```

### Attempts Made
1. **Positional arguments**:
   ```bash
   stellar contract invoke --id $ID --source deploy --network testnet -- \
     init "$ADMIN" 0x0101...01 700
   ```

2. **Named with underscores**:
   ```bash
   stellar contract invoke --id $ID --source deploy --network testnet -- \
     init --admin "$ADMIN" --verification_key 0x0101...01 --min_score 700
   ```

3. **Named with hyphens**:
   ```bash
   stellar contract invoke --id $ID --source deploy --network testnet -- \
     init --admin "$ADMIN" --verification-key 0x0101...01 --min-score 700
   ```

4. **Base64 encoded VK**:
   ```bash
   stellar contract invoke --id $ID --source deploy --network testnet -- \
     init --admin "$ADMIN" --verification_key "AQEBAQE...=" --min_score 700
   ```

All fail with the same error before the transaction is even submitted.

## Function Signature
From `contracts/zk_verifier/src/lib.rs`:
```rust
pub fn init(
    env: Env, 
    admin: Address, 
    verification_key: VerificationKey,  // BytesN<32>
    min_score: u32
)
```

Where:
```rust
pub type VerificationKey = BytesN<32>;
```

## Verification
1. **Unit tests pass locally**:
   ```bash
   cargo test --package zk_verifier test_init_and_verify_stub
   # Result: ok. 1 passed
   ```

2. **Contract deployed successfully**:
   ```
   ✅ Deployed!
   CDJX3YLVANLTRRMMWDJO6NG7ADKJIHPL3WJAZNMNL6BQU6S6D5QXBT3L
   ```

3. **Exported functions detected**:
   ```
   Exported Functions: 8 found
     • init
     • get_score
     • is_creditworthy
     • set_min_score
     • set_pause
     • update_verification_key
     • verify_proof
   ```

## Analysis
The error "Missing Entry VerificationKey" comes from **inside the contract code**, not from CLI validation:

```rust
// From lib.rs, line ~278
let vkey: VerificationKey = env
    .storage()
    .persistent()
    .get(&DataKey::VerificationKey)
    .expect("verification key not set");  // <-- THIS PANIC
```

This suggests the CLI is somehow invoking the wrong function or the contract is executing code that reads the VK before `init` sets it.

**Hypothesis**: Other contract functions (like `get_score`) check for the VK and panic if not found. The CLI may be:
1. Calling the wrong function
2. Having type deserialization issues with `BytesN<32>`
3. Hitting a pre-flight check that tries to read the VK

## Workarounds Tried
- [x] Recompile contract
- [x] Redeploy to new ID
- [x] Different parameter formats (hex, base64)
- [x] Different naming conventions (underscores, hyphens)
- [x] Positional vs named arguments
- [x] Upgrade CLI to 23.2.1 (in progress - compiling)
- [x] **Created TypeScript SDK script** (`tools/zk/init_contract_sdk.ts`)
- [ ] Use XDR-encoded arguments
- [ ] Deploy with different Soroban SDK version
- [ ] Use contract bindings (TypeScript/Python) instead of CLI

## Next Steps
1. **Complete CLI upgrade to 23.2.1** (in progress)
   - Version 23.1.4 may have known issues with BytesN types
   - Background compilation: ~141/618 crates
   
2. **Execute SDK-based init script** ✅ (ready to run)
   ```bash
   npm install --save-dev @stellar/stellar-sdk tsx
   tools/zk/init_contract_sdk.ts
   ```
   - Created comprehensive script using @stellar/stellar-sdk
   - Properly serializes BytesN<32> to ScVal
   - Simulates, signs, and submits transaction
   - Includes verification step

3. **Try XDR encoding** (if SDK also fails):
   ```bash
   stellar contract invoke --arg-xdr <base64-xdr>
   ```

4. **Check Soroban SDK compatibility**:
   - Current: `soroban-sdk = "23.0.2"`
   - Already using latest stable version

5. **Alternative: Modify contract** (last resort):
   - Add a separate `set_verification_key` function callable by admin
   - Initialize without VK, set it later
   - **Not recommended**: Breaks initialization atomicity

## Files Updated
- `.env-dev`: `ZK_VERIFIER_CONTRACT_ID=CDJX3YLVANLTRRMMWDJO6NG7ADKJIHPL3WJAZNMNL6BQU6S6D5QXBT3L`
- `apps/backend/.env-dev`: Same
- VK generated and stored: `circuits/credit_score_verification_key.base64`
- **NEW**: `tools/zk/init_contract_sdk.ts` - SDK-based initialization script

## Temporary Mitigation
For Week 2 delivery:
- Document the issue
- Deploy contract successfully (✓ Done)
- Backend integration can use stub/mock for now
- Real initialization postponed to Week 3-4 when full ZK implementation is done

## References
- Contract: `contracts/zk_verifier/src/lib.rs`
- Tests: Line 429+ in same file
- Stellar CLI issue tracker: https://github.com/stellar/stellar-cli/issues
- Soroban docs: https://soroban.stellar.org/docs/reference/soroban-cli
