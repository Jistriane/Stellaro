# WEEK 2 IMPLEMENTATION TASKS - MEV GUARD v1.0

**Week of May 13-17, 2026**  
**Goal:** Complete MEV Guard contract with integration to Batch Executor  
**Completion Target:** Friday May 17, 2026 (EOD)

---

## PREREQUISITES (From Week 1)

 Batch Executor fully functional and deployed to testnet  
 All 4 operation types (payment, swap, supply, borrow) working  
 Integration tests passing

---

## TASK GROUP 1: MEV GUARD CORE DEVELOPMENT (Mon-Tue)

### Task 1.1: Project Setup & Architecture

**Create New Contract:**
```bash
# At: contracts/mev_guard/

# Create structure
mkdir -p contracts/mev_guard/src
mkdir -p contracts/mev_guard/tests

# Copy template Cargo.toml
cp contracts/batch_executor/Cargo.toml contracts/mev_guard/Cargo.toml
```

**Cargo.toml for MEV Guard:**
```toml
[package]
name = "mev_guard"
version = "1.0.0"
edition = "2021"
publish = false

[lib]
crate-type = ["cdylib"]

[dependencies]
soroban-sdk = { version = "21.4", features = ["contract"] }
soroban-token-sdk = "21.4"

[dev-dependencies]
soroban-sdk = { version = "21.4", features = ["testutils"] }
```

**File Structure:**
```
contracts/mev_guard/
├── src/
│   ├── lib.rs              # Main contract
│   ├── validation.rs       # Validation logic
│   ├── detection.rs        # MEV pattern detection
│   ├── storage.rs          # State management
│   └── events.rs           # Event definitions
├── tests/
│   ├── unit_tests.rs       # Unit tests
│   └── integration_test.rs # Integration tests
├── Cargo.toml
└── Cargo.lock
```

**Acceptance Criteria:**
- [ ] Project structure created
- [ ] Cargo.toml configured correctly
- [ ] Project compiles cleanly

**Estimated Time:** 30 min

---

### Task 1.2: Define Data Structures & Storage

**File:** `contracts/mev_guard/src/lib.rs`

```rust
use soroban_sdk::{
    contract, contractimpl, contracttype, Address, Env, Symbol, Vec, Bytes, Error,
};

/// Core MEV protection parameters for a swap
#[derive(Contracttype, Clone, Debug)]
pub struct MEVGuardConfig {
    pub min_output_amount: i128,       // Minimum acceptable output
    pub max_slippage_bps: u32,         // Max slippage in basis points (e.g., 50 = 0.5%)
    pub deadline: u64,                 // Block timestamp deadline
    pub expected_price: i128,          // Expected price per unit
    pub mev_alert_threshold_bps: u32,  // Threshold for MEV detection (e.g., 500 = 5%)
}

/// Result of swap validation
#[derive(Contracttype, Clone, Debug)]
pub struct SwapValidationResult {
    pub is_valid: bool,                 // Swap passed all checks
    pub actual_output: i128,            // Actual amount received
    pub slippage_detected: bool,
    pub slippage_bps: u32,              // Actual slippage in bps
    pub mev_risk_detected: bool,        // Potential MEV extraction detected
    pub mev_severity: u32,              // 0: none, 1: low, 2: medium, 3: high
    pub price_impact: i128,             // Price impact percentage
}

/// Transaction details for audit trail
#[derive(Contracttype, Clone, Debug)]
pub struct TransactionLog {
    pub timestamp: u64,
    pub signer: Address,
    pub token_in: Address,
    pub token_out: Address,
    pub amount_in: i128,
    pub amount_out: i128,
    pub had_mev_risk: bool,
}

#[contract]
pub struct MEVGuard;

#[contractimpl]
impl MEVGuard {
    // Constructor - initialize contract
    pub fn init(_env: Env) -> Result<(), Error> {
        Ok(())
    }
}
```

**Acceptance Criteria:**
- [ ] Structs compile without errors
- [ ] Data types match expected usage
- [ ] Storage patterns clear and efficient

**Estimated Time:** 1 hour

---

### Task 1.3: Implement Validation Core Logic

**File:** `contracts/mev_guard/src/validation.rs`

```rust
use soroban_sdk::{Env, Error};
use super::*;

/// Validate transaction deadline
pub fn validate_deadline(env: &Env, deadline: u64) -> Result<(), Error> {
    let current_timestamp = env.ledger().timestamp();
    
    if current_timestamp > deadline {
        return Err(Error::from_contract_error(1001)); // DeadlineExpired
    }
    
    Ok(())
}

/// Calculate slippage percentage in basis points
pub fn calculate_slippage_bps(expected: i128, actual: i128) -> u32 {
    if expected == 0 {
        return 0;
    }
    
    let slippage = if expected > actual {
        ((expected - actual) as u128 * 10000) / (expected as u128)
    } else {
        0 // No slippage if we got more than expected
    };
    
    slippage as u32
}

/// Validate slippage is within acceptable bounds
pub fn validate_slippage(
    expected: i128,
    actual: i128,
    max_slippage_bps: u32,
) -> Result<u32, Error> {
    let slippage_bps = calculate_slippage_bps(expected, actual);
    
    if slippage_bps > max_slippage_bps {
        return Err(Error::from_contract_error(1002)); // SlippageExceeded
    }
    
    Ok(slippage_bps)
}

/// Validate minimum output requirement
pub fn validate_min_output(actual: i128, min_required: i128) -> Result<(), Error> {
    if actual < min_required {
        return Err(Error::from_contract_error(1003)); // MinimumOutputNotMet
    }
    
    Ok(())
}

/// Validate config parameters
pub fn validate_config(config: &MEVGuardConfig) -> Result<(), Error> {
    if config.min_output_amount < 0 {
        return Err(Error::from_contract_error(1004)); // InvalidMinOutput
    }
    
    if config.max_slippage_bps > 10000 {
        return Err(Error::from_contract_error(1005)); // InvalidSlippageBps
    }
    
    if config.mev_alert_threshold_bps > 10000 {
        return Err(Error::from_contract_error(1006)); // InvalidMevThreshold
    }
    
    Ok(())
}
```

**Acceptance Criteria:**
- [ ] All validation functions compile
- [ ] Edge cases handled (zero values, overflow)
- [ ] Error codes unique and descriptive

**Estimated Time:** 1.5 hours

---

### Task 1.4: Implement MEV Pattern Detection

**File:** `contracts/mev_guard/src/detection.rs`

```rust
use soroban_sdk::Env;
use super::*;

/// Detect potential MEV extraction based on price variance
pub fn detect_mev_pattern(
    expected_price: i128,
    actual_price: i128,
    threshold_bps: u32,
) -> (bool, u32) {
    if expected_price == 0 {
        return (false, 0);
    }
    
    let variance_bps = if expected_price > actual_price {
        ((expected_price - actual_price) as u128 * 10000) / (expected_price as u128)
    } else {
        ((actual_price - expected_price) as u128 * 10000) / (expected_price as u128)
    };
    
    let variance_bps = variance_bps as u32;
    let detected = variance_bps > threshold_bps;
    
    (detected, variance_bps)
}

/// Classify MEV severity (0-3)
pub fn classify_mev_severity(variance_bps: u32) -> u32 {
    match variance_bps {
        0..=100 => 0,        // No MEV (0-1% variance)
        101..=300 => 1,      // Low risk (1-3%)
        301..=700 => 2,      // Medium risk (3-7%)
        _ => 3,              // High risk (>7%)
    }
}

/// Calculate price impact (change in asset price after transaction)
pub fn calculate_price_impact(amount_in: i128, amount_out: i128) -> i128 {
    if amount_in == 0 {
        return 0;
    }
    
    // Simple calculation: (1 - (amount_out / amount_in)) * 100
    let ratio = (amount_out as u128 * 100) / (amount_in as u128);
    (100 - ratio as i128).max(0)
}

/// Detect sandwich attack pattern (pending transactions front-ran)
pub fn detect_sandwich_pattern(
    current_price: i128,
    previous_price: i128,
) -> bool {
    if previous_price == 0 {
        return false;
    }
    
    // If price moved >5% between blocks, likely sandwich
    let variance_bps = ((current_price.abs_diff(previous_price)) as u128 * 10000)
        / (previous_price as u128);
    
    variance_bps > 500 // >5%
}
```

**Acceptance Criteria:**
- [ ] MEV detection logic mathematically sound
- [ ] Severity classification calibrated
- [ ] Sandwich pattern detection working

**Estimated Time:** 2 hours

---

### Task 1.5: Implement Public Contract Interface

**File:** `contracts/mev_guard/src/lib.rs` (add to MEVGuard impl)

```rust
#[contractimpl]
impl MEVGuard {
    /// Validate a swap transaction for MEV and return detailed analysis
    pub fn validate_swap(
        env: Env,
        config: MEVGuardConfig,
        amount_in: i128,
        amount_out: i128,
    ) -> Result<SwapValidationResult, Error> {
        use super::validation::*;
        use super::detection::*;
        
        // 1. Validate configuration
        validate_config(&config)?;
        
        // 2. Check deadline
        validate_deadline(&env, config.deadline)?;
        
        // 3. Check minimum output
        validate_min_output(amount_out, config.min_output_amount)?;
        
        // 4. Calculate slippage
        let slippage_bps = validate_slippage(
            config.expected_price,
            amount_out,
            config.max_slippage_bps,
        )?;
        
        let slippage_detected = slippage_bps > 100; // >1% considered slippage
        
        // 5. Detect MEV patterns
        let (mev_detected, variance_bps) = detect_mev_pattern(
            config.expected_price,
            amount_out,
            config.mev_alert_threshold_bps,
        );
        
        let mev_severity = classify_mev_severity(variance_bps);
        let price_impact = calculate_price_impact(amount_in, amount_out);
        
        // 6. Emit audit event
        env.events().publish(
            ("mev_guard", "swap_validated"),
            (
                mev_detected,
                slippage_bps,
                mev_severity,
            ),
        );
        
        Ok(SwapValidationResult {
            is_valid: true,
            actual_output: amount_out,
            slippage_detected,
            slippage_bps,
            mev_risk_detected: mev_detected,
            mev_severity,
            price_impact,
        })
    }

    /// Emergency stop - halt all validations (multisig required)
    pub fn emergency_halt(env: Env) -> Result<(), Error> {
        // TODO: Check multisig approval
        env.events().publish(
            ("mev_guard", "emergency_halt"),
            (),
        );
        Ok(())
    }

    /// Get configuration for a specific token pair
    pub fn get_config(
        _env: Env,
        _token_in: Address,
        _token_out: Address,
    ) -> Result<MEVGuardConfig, Error> {
        // TODO: Read from storage
        Err(Error::from_contract_error(2001))
    }
}
```

**Acceptance Criteria:**
- [ ] All public methods exist and compile
- [ ] Error handling comprehensive
- [ ] Events emitted for audit trail
- [ ] Contract includes emergency halt

**Estimated Time:** 2 hours

---

## TASK GROUP 2: MEV GUARD TESTING (Wed)

### Task 2.1: Unit Tests

**File:** `contracts/mev_guard/tests/unit_tests.rs`

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_deadline_validation_passes() {
        // Current time + 1 hour
        // Expect: validation passes
    }

    #[test]
    fn test_deadline_validation_fails() {
        // Deadline in past
        // Expect: Error DeadlineExpired
    }

    #[test]
    fn test_slippage_within_bounds() {
        // Expected: 1000, Actual: 990, Max slippage: 200 bps (2%)
        // Expect: Pass, slippage = 100 bps (1%)
    }

    #[test]
    fn test_slippage_exceeds_bounds() {
        // Expected: 1000, Actual: 950, Max slippage: 200 bps (2%)
        // Expect: Error SlippageExceeded
    }

    #[test]
    fn test_mev_detection_high_variance() {
        // Expected price: 1000, Actual: 850 (15% drop)
        // Threshold: 500 bps (5%)
        // Expect: MEV detected, severity=3 (high)
    }

    #[test]
    fn test_mev_detection_no_variance() {
        // Expected: 1000, Actual: 999 (0.1% variance)
        // Threshold: 500 bps
        // Expect: No MEV detected
    }

    #[test]
    fn test_price_impact_calculation() {
        // Amount in: 1000, Amount out: 900
        // Expect: Price impact = 10
    }

    #[test]
    fn test_min_output_validation() {
        // Actual: 500, Required: 600
        // Expect: Error MinimumOutputNotMet
    }

    #[test]
    fn test_invalid_config() {
        // Slippage bps > 10000
        // Expect: Error InvalidSlippageBps
    }

    #[test]
    fn test_swap_validation_complete() {
        // Full happy path: deadline ok, slippage ok, no MEV
        // Expect: SwapValidationResult with is_valid=true
    }
}
```

**Estimated Time:** 2 hours

---

### Task 2.2: Integration Tests - Testnet

**File:** `contracts/mev_guard/tests/integration_test.rs`

```rust
#[test]
fn test_mev_guard_deployment() {
    // Deploy MEV Guard contract
    // Verify: Contract deployed successfully
}

#[test]
fn test_validate_swap_on_testnet() {
    // Setup: Real Stellar testnet environment
    // Execute: Call validate_swap with real pool prices
    // Verify: Validation result matches expected
}

#[test]
fn test_mev_guard_with_batch_executor() {
    // Integration: Batch Executor + MEV Guard
    // Execute: Batch with protected swap operation
    // Verify: MEV Guard validates, Batch executes
}
```

**Estimated Time:** 2 hours

---

## TASK GROUP 3: INTEGRATION WITH BATCH EXECUTOR (Thu)

### Task 3.1: Update Batch Executor to Use MEV Guard

**File:** `contracts/batch_executor/src/lib.rs`

```rust
// Add MEV Guard contract integration
const MEV_GUARD_CONTRACT_ID: &str = "C..."; // Deployed MEV Guard address

// Update execute_swap to call MEV Guard first
fn execute_swap_with_mev_protection(
    env: &Env,
    operation: &Operation,
    signer: &Address,
) -> Result<i128, Error> {
    let swap_params = decode_swap_operation(&operation.params)?;
    
    // Create MEV protection config
    let mev_config = MEVGuardConfig {
        min_output_amount: swap_params.min_amount_out,
        max_slippage_bps: 200,  // 2% max slippage
        deadline: swap_params.deadline,
        expected_price: swap_params.expected_price,
        mev_alert_threshold_bps: 500, // 5% alert threshold
    };
    
    // Validate with MEV Guard BEFORE executing swap
    let mev_guard_id = Address::from_contract_id(env, &MEV_GUARD_CONTRACT_ID);
    
    let validation_result: SwapValidationResult = env.invoke_contract(
        &mev_guard_id,
        &Symbol::new(env, "validate_swap"),
        (mev_config, operation.amount, swap_params.expected_output),
    );
    
    // Check if MEV risk is too high
    if validation_result.mev_severity >= 3 {
        // High MEV risk - could revert or emit warning
        env.events().publish(
            ("batch", "mev_warning"),
            (validation_result.mev_severity,),
        );
        return Err(Error::from_contract_error(2001)); // MEVRiskTooHigh
    }
    
    // Execute swap (same as before)
    let router_id = Address::from_contract_id(env, &SOROSWAP_ROUTER_ID);
    let amount_out: i128 = env.invoke_contract(
        &router_id,
        &Symbol::new(env, "swap_exact_tokens_for_tokens"),
        (
            &operation.amount,
            &swap_params.min_amount_out,
            &swap_params.path,
            signer,
            &swap_params.deadline,
        ),
    );
    
    Ok(amount_out)
}
```

**Acceptance Criteria:**
- [ ] Batch Executor properly integrates MEV Guard
- [ ] MEV validation happens before execution
- [ ] High-severity risks trigger appropriate errors
- [ ] Integration tests passing

**Estimated Time:** 1.5 hours

---

### Task 3.2: Security Review & Audit

**Review Checklist:**
- [ ] Integer overflow checks in calculations
- [ ] No division-by-zero risks
- [ ] All error codes unique
- [ ] Gas optimization (no unnecessary computation)
- [ ] Pattern detection calibration reviewed
- [ ] Contract size <200KB

**Security Concerns to Address:**
- Can attacker manipulate `expected_price` to bypass detection?
- Are thresholds calibrated correctly?
- Can MEV patterns be spoofed?

**Estimated Time:** 2 hours

---

### Task 3.3: Deploy MEV Guard to Testnet

**Deployment:**
```bash
cd contracts/mev_guard
cargo build --target wasm32-unknown-unknown --release
soroban contract optimize --wasm ./target/wasm32-unknown-unknown/release/mev_guard.wasm
soroban contract deploy \
  --network testnet \
  --source-account <your-testnet-key>
```

**Post-Deployment:**
- [ ] Update `.env-testnet` with new contract ID
- [ ] Update Batch Executor `MEV_GUARD_CONTRACT_ID`
- [ ] Redeploy Batch Executor with MEV Guard integration
- [ ] Run integration tests

**Estimated Time:** 2 hours

---

## TASK GROUP 4: LOAD TESTING & OPTIMIZATION (Fri)

### Task 4.1: Performance Testing with k6

**File:** `load-tests/mev_guard_load_test.js`

```javascript
import http from 'k6/http';
import { check, sleep, group } from 'k6';

const BASE_URL = 'http://localhost:3001'; // Backend API

export const options = {
    stages: [
        { duration: '30s', target: 10 },
        { duration: '1m30s', target: 50 },
        { duration: '30s', target: 0 },
    ],
};

export default function () {
    group('MEV Guard Validation', () => {
        const payload = JSON.stringify({
            min_output_amount: 1000000000,
            max_slippage_bps: 200,
            deadline: 1720000000,
            expected_price: 1000000000,
            mev_alert_threshold_bps: 500,
            amount_in: 5000000000,
            amount_out: 4950000000,
        });

        const response = http.post(
            `${BASE_URL}/defi/mev-guard/validate`,
            payload,
            {
                headers: { 'Content-Type': 'application/json' },
            }
        );

        check(response, {
            'status is 200': (r) => r.status === 200,
            'validation completes <100ms': (r) => r.timings.duration < 100,
            'is_valid is true': (r) => JSON.parse(r.body).is_valid === true,
        });
    });

    sleep(1);
}
```

**Test Execution:**
```bash
k6 run load-tests/mev_guard_load_test.js
```

**Performance Targets:**
- <100ms for validation
- <5MB memory per operation
- Handle 100 concurrent validations

**Estimated Time:** 1.5 hours

---

### Task 4.2: Code Optimization

**Optimization Focus:**
1. **Reduce contract size:**
   - Remove debug symbols: `opt-level = "z"` in Cargo.toml
   - Minimize helper functions
   - Remove unused imports

2. **Optimize calculations:**
   - Precompute common values
   - Cache calculations where possible
   - Use integer math (avoid floats)

3. **Reduce gas per operation:**
   - Minimize external contract calls
   - Batch storage updates
   - Use efficient data structures

**Estimated Time:** 1.5 hours

---

## DELIVERABLES (FRIDAY EOD)

**Code:**
- `contracts/mev_guard/src/lib.rs` - Complete implementation
- `contracts/mev_guard/src/validation.rs` - Validation logic
- `contracts/mev_guard/src/detection.rs` - MEV detection
- `contracts/mev_guard/tests/` - Comprehensive test suite
- `contracts/batch_executor/src/lib.rs` - Updated with MEV Guard integration

**Deployment:**
- MEV Guard deployed to Stellar Testnet
- Batch Executor redeployed with MEV Guard integration
- All contracts linked and tested together

**Documentation:**
- MEV Guard operation reference
- Threat model and detection strategies
- Configuration tuning guide

**Performance:**
- Load testing results documented
- Gas optimization complete
- Contract size <200KB

---

## SUCCESS METRICS

| Metric | Target | How to Measure |
|--------|--------|----------------|
| Unit Test Coverage | >95% | `cargo tarpaulin` |
| Integration Tests | 100% pass | `cargo test --test integration_test` |
| Validation Latency | <50ms | k6 load test |
| MEV Detection Accuracy | >90% | Compare with known MEV events |
| Contract Size | <200KB | `wc -c mev_guard.wasm` |
| Testnet Deployment | Successful | Verify on Stellar Expert |

---

**Status:**  READY TO IMPLEMENT  
**Start Date:** Monday, May 13, 2026  
**Target Completion:** Friday, May 17, 2026, 6:00 PM  
**Dependency:** Week 1 (Batch Executor) must be complete
