# WEEK 1 IMPLEMENTATION TASKS - BATCH EXECUTOR v1.0

**Week of May 6-10, 2026**  
**Goal:** Complete Batch Executor with full contract integrations  
**Completion Target:** Friday May 10, 2026 (EOD)

---

## TASK GROUP 1: STABLECOIN TRANSFER INTEGRATION (Mon-Tue)

### Task 1.1: Setup Dependencies & Contract References

**Files to Update:**
- `contracts/batch_executor/Cargo.toml`
- `contracts/batch_executor/src/lib.rs`

**Changes:**
```toml
# In Cargo.toml - ensure correct dependencies
[dependencies]
soroban-sdk = { version = "21.4", features = ["contract"] }
soroban-token-sdk = "21.4"  # Add this for token client generation
```

**Action Items:**
- [ ] Verify Stablecoin contract ID for testnet: `CDWWZ7XPQVRVYQK7UGRVRCSZGPJXWRKSTGNXBUNGNWGXQXDTZLQDZH6`
- [ ] Update environment configuration files with contract constans
- [ ] Create `src/constants.rs` for all contract IDs

**Estimated Time:** 30 min

---

### Task 1.2: Implement `execute_payment()` Function

**File:** `contracts/batch_executor/src/lib.rs`  
**Location:** ~Line 248  

**Implementation Template:**
```rust
use soroban_sdk::{contract, contractimpl, Address, Env, Error, Symbol};
use soroban_token_sdk::TokenClient;

const STABLECOIN_CONTRACT_ID: &str = "CDWWZ7XPQVRVYQK7UGRVRCSZGPJXWRKSTGNXBUNGNWGXQXDTZLQDZH6";

fn execute_payment(
    env: &Env,
    operation: &Operation,
    signer: &Address,
    to: &Address,
    from: &Address,
) -> Result<i128, Error> {
    // Validate operation amount
    if operation.amount <= 0 {
        return Err(Error::from_contract_error(1001)); // InvalidAmount
    }

    // Load stablecoin token client
    let stablecoin_id = Address::from_contract_id(
        env,
        &soroban_sdk::Bytes::from_slice(env, STABLECOIN_CONTRACT_ID.as_bytes()),
    );
    let token_client = TokenClient::new(env, &stablecoin_id);

    // Check from balance before transfer
    let balance = token_client.balance(from);
    if balance < operation.amount {
        return Err(Error::from_contract_error(1002)); // InsufficientBalance
    }

    // Execute transfer with signer authorization
    env.invoke_contract::<()>(
        &stablecoin_id,
        &Symbol::new(env, "transfer"),
        (&from, &to, &operation.amount),
    );

    Ok(operation.amount)
}
```

**Acceptance Criteria:**
- [ ] Function compiles without errors
- [ ] Balance validation works
- [ ] Transfer executes atomically
- [ ] Proper error codes returned on failure

**Estimated Time:** 1 hour

---

### Task 1.3: Write Unit Tests for Payment Execution

**File:** `contracts/batch_executor/src/tests.rs`

**Test Cases:**
```rust
#[test]
fn test_execute_payment_success() {
    // Setup: Create test environment with token balances
    // Execute: Call execute_payment with valid params
    // Assert: Transfer succeeded, balance updated
}

#[test]
fn test_execute_payment_insufficient_balance() {
    // Setup: Create test with insufficient balance
    // Execute: Call execute_payment with excess amount
    // Assert: Error returned, state unchanged
}

#[test]
fn test_execute_payment_invalid_amount() {
    // Setup: Create test with zero/negative amount
    // Execute: Call execute_payment
    // Assert: Error returned immediately
}

#[test]
fn test_execute_payment_unauthorized() {
    // Setup: Use signer without auth
    // Execute: Call execute_payment
    // Assert: require_auth() fails
}
```

**Estimated Time:** 1.5 hours

---

### Task 1.4: Integration Test with Real Testnet Stablecoin

**File:** `contracts/batch_executor/tests/integration_test.rs`

**Test Parameters:**
- Network: Stellar Testnet
- Stablecoin: `CDWWZ7XPQVRVYQK7UGRVRCSZGPJXWRKSTGNXBUNGNWGXQXDTZLQDZH6`
- Test Accounts: Use funded testnet accounts

**Test Scenario:**
1. Deploy Batch Executor to testnet
2. Create funding transaction to Batch Executor
3. Execute single payment operation
4. Verify balances updated on Stellar ledger

**Estimated Time:** 2 hours (including network wait times)

---

## TASK GROUP 2: SOROSWAP INTEGRATION (Wed)

### Task 2.1: Add Soroswap Router Integration

**File:** `contracts/batch_executor/src/lib.rs`

**Implementation:**
```rust
fn execute_swap(
    env: &Env,
    operation: &Operation,
    signer: &Address,
) -> Result<i128, Error> {
    // Decode swap operation parameters
    let swap_params = decode_swap_operation(&operation.params)?;
    
    // Validate deadline hasn't passed
    let current_ledger_seq = env.ledger().sequence();
    if current_ledger_seq > swap_params.deadline {
        return Err(Error::from_contract_error(2001)); // DeadlineExpired
    }
    
    // Validate path (token_in -> token_out)
    if swap_params.path.is_empty() || swap_params.path.len() > 5 {
        return Err(Error::from_contract_error(2002)); // InvalidPath
    }
    
    // Get Soroswap router contract
    let router_id = Address::from_contract_id(
        env,
        &soroban_sdk::Bytes::from_slice(env, SOROSWAP_ROUTER_ID.as_bytes()),
    );
    
    // Execute swap via router
    let amount_out: i128 = env.invoke_contract(
        &router_id,
        &Symbol::new(env, "swap_exact_tokens_for_tokens"),
        (
            &operation.amount,                          // amount_in
            &swap_params.min_amount_out,               // min_out
            &swap_params.path,                         // token path
            &signer,                                   // recipient
            &swap_params.deadline,
        ),
    );
    
    // Validate minimum output requirement
    if amount_out < swap_params.min_amount_out {
        return Err(Error::from_contract_error(2003)); // SlippageExceeded
    }
    
    Ok(amount_out)
}

// Helper: Decode swap parameters from operation.params bytes
fn decode_swap_operation(params: &Bytes) -> Result<SwapParams, Error> {
    // params format: [min_amount_out: i128, path_len: u32, token_0, token_1, ..., deadline: u64]
    
    let mut offset = 0;
    
    // Read min_amount_out (16 bytes, big-endian i128)
    let min_amount_out = read_i128(params, offset)?;
    offset += 16;
    
    // Read path length
    let path_len = read_u32(params, offset)? as usize;
    offset += 4;
    
    // Read token addresses in path
    let mut path = Vec::new();
    for _ in 0..path_len {
        let token = read_address(params, offset)?;
        path.push(token);
        offset += 32; // Address is 32 bytes
    }
    
    // Read deadline
    let deadline = read_u64(params, offset)?;
    
    Ok(SwapParams {
        min_amount_out,
        path,
        deadline,
    })
}
```

**Acceptance Criteria:**
- [ ] Swap routing logic compiles
- [ ] Deadline validation works
- [ ] Path validation enforced
- [ ] Slippage protection active

**Estimated Time:** 2 hours

---

### Task 2.2: Soroswap Integration Tests

**Test Cases:**
```rust
#[test]
fn test_swap_valid_path() {
    // Swap USDC -> XLM via DEX
    // Assert: Correct amount out received
}

#[test]
fn test_swap_deadline_expired() {
    // Set deadline in past
    // Assert: Error returned
}

#[test]
fn test_swap_slippage_exceeded() {
    // Set min_out too high (impossible to meet)
    // Assert: Swap reverted
}

#[test]
fn test_swap_invalid_path() {
    // Use empty or too-long path
    // Assert: Validation error
}
```

**Integration Test:**
- Deploy to testnet
- Execute real swap against Soroswap pools
- Verify Horizon ledger shows token changes

**Estimated Time:** 2 hours

---

## TASK GROUP 3: LOANSPOOL INTEGRATION (Thu-Fri)

### Task 3.1: Implement `execute_supply()` and `execute_borrow()`

**File:** `contracts/batch_executor/src/lib.rs`

```rust
fn execute_supply(
    env: &Env,
    operation: &Operation,
    supplier: &Address,
) -> Result<i128, Error> {
    // Validate amount
    if operation.amount <= 0 {
        return Err(Error::from_contract_error(3001));
    }
    
    // Decode supply parameters: [collateral_token, pool_reserve]
    let supply_params = decode_supply_operation(&operation.params)?;
    
    // Get LoansPool contract
    let pool_id = Address::from_contract_id(env, &LOANSPOOL_CONTRACT_ID);
    
    // Optional: Check credit score from ZK verifier if required
    // let has_valid_score = check_zk_score(env, supplier)?;
    
    // Execute supply operation
    let amount_supplied: i128 = env.invoke_contract(
        &pool_id,
        &Symbol::new(env, "supply"),
        (
            &supplier,
            &supply_params.reserve_token,
            &operation.amount,
        ),
    );
    
    Ok(amount_supplied)
}

fn execute_borrow(
    env: &Env,
    operation: &Operation,
    borrower: &Address,
) -> Result<i128, Error> {
    // Validate amount
    if operation.amount <= 0 {
        return Err(Error::from_contract_error(3002));
    }
    
    let borrow_params = decode_borrow_operation(&operation.params)?;
    let pool_id = Address::from_contract_id(env, &LOANSPOOL_CONTRACT_ID);
    
    // CRITICAL: Check ZK credit score before borrow
    let score = check_zk_credit_score(env, borrower)?;
    if score < 600 {
        return Err(Error::from_contract_error(3003)); // CreditScoreTooLow
    }
    
    // Execute borrow
    let amount_borrowed: i128 = env.invoke_contract(
        &pool_id,
        &Symbol::new(env, "borrow"),
        (
            &borrower,
            &borrow_params.reserve_token,
            &operation.amount,
            &borrow_params.interest_rate_mode,
        ),
    );
    
    Ok(amount_borrowed)
}

fn check_zk_credit_score(env: &Env, user: &Address) -> Result<i32, Error> {
    let zk_verifier_id = Address::from_contract_id(env, &ZK_VERIFIER_CONTRACT_ID);
    
    // Call ZK verifier to get latest score
    let score: i32 = env.invoke_contract(
        &zk_verifier_id,
        &Symbol::new(env, "get_user_score"),
        (&user,),
    );
    
    if score == 0 {
        return Err(Error::from_contract_error(3004)); // NoScoreFound
    }
    
    Ok(score)
}
```

**Acceptance Criteria:**
- [ ] Supply logic integrates with LoansPool
- [ ] Borrow checks credit score before allowing
- [ ] ZK verification integration working
- [ ] Error codes comprehensive

**Estimated Time:** 3 hours

---

### Task 3.2: Complete Batch Execution Orchestration

**File:** `contracts/batch_executor/src/lib.rs`

```rust
#[contract]
pub struct BatchExecutor;

#[contractimpl]
impl BatchExecutor {
    /// Execute a batch of operations atomically
    /// If any operation fails, entire batch is reverted
    pub fn execute_batch(
        env: Env,
        operations: Vec<Operation>,
    ) -> Result<Vec<i128>, Error> {
        // Validate batch not empty
        if operations.is_empty() {
            return Err(Error::from_contract_error(100)); // EmptyBatch
        }
        
        let mut results = Vec::new();
        let signer = env.invoker();
        
        // Process each operation in sequence (atomic context)
        for operation in operations.iter() {
            let result = match operation.operation_type {
                1 => execute_payment(&env, operation, &signer, &operation.to, &operation.from)?,
                2 => execute_swap(&env, operation, &signer)?,
                3 => execute_supply(&env, operation, &signer)?,
                4 => execute_borrow(&env, operation, &signer)?,
                _ => return Err(Error::from_contract_error(101)), // UnknownOpType
            };
            
            results.push(result);
        }
        
        // Emit success event
        env.events().publish(
            ("batch", "executed"),
            (operations.len(), results.clone()),
        );
        
        Ok(results)
    }
}
```

**Acceptance Criteria:**
- [ ] All 4 operation types routed correctly
- [ ] Atomicity preserved (all or nothing)
- [ ] Events emitted for auditing
- [ ] Batch size limits enforced

**Estimated Time:** 1.5 hours

---

### Task 3.3: Security Audit & Code Review

**File:** `contracts/batch_executor/src/lib.rs` (full review)

**Review Checklist:**
- [ ] No re-entrancy vulnerabilities
- [ ] All external calls have signer validation
- [ ] All error paths properly handled
- [ ] No state modifications outside atomic context
- [ ] Gas optimization (minimize operations per batch)
- [ ] Contract size <256KB (check with `soroban contract optimize`)

**Estimated Time:** 2 hours

---

### Task 3.4: Deploy to Testnet & Validation

**Deployment Steps:**
1. Build contract locally: `cargo build --target wasm32-unknown-unknown --release`
2. Optimize: `soroban contract optimize --wasm ./target/wasm32-unknown-unknown/release/batch_executor.wasm`
3. Deploy: `soroban contract deploy --network testnet`
4. Verify deployment on Stellar Expert: https://stellar.expert/explorer/testnet

**Post-Deployment Validation:**
- [ ] Contract deployed successfully
- [ ] Contract ID recorded in .env-testnet
- [ ] All dependencies resolve on testnet
- [ ] E2E test with all 4 operation types passes

**Estimated Time:** 2 hours (including network confirmation times)

---

## DELIVERABLES (FRIDAY EOD)

**Code:**
- `contracts/batch_executor/src/lib.rs` - Full implementation with 4 operation types
- `contracts/batch_executor/tests/unit_tests.rs` - 15+ unit tests passing
- `contracts/batch_executor/tests/integration_test.rs` - Integration tests on testnet
- `contracts/batch_executor/Cargo.toml` - All dependencies updated

**Deployment:**
- Batch Executor v1.0 deployed to Stellar Testnet
- Contract ID in configuration files
- Environment variables updated

**Documentation:**
- Implementation notes in code
- Operation type reference document
- Error codes enumeration
- Testing report

---

## SUCCESS METRICS

| Metric | Target | How to Measure |
|--------|--------|----------------|
| Code Coverage | >90% | `cargo tarpaulin` |
| Unit Tests Passing | 100% | `cargo test --lib` |
| Integration Tests | 100% | `cargo test --test integration_test` |
| Gas Usage | <5M per batch | `soroban contract invoke --help` |
| Contract Size | <256KB | `wc -c *.wasm` |
| Testnet Deployment | Successful | Check Stellar Expert |

---

**Status:**  READY TO IMPLEMENT  
**Start Date:** Monday, May 6, 2026  
**Target Completion:** Friday, May 10, 2026, 6:00 PM
