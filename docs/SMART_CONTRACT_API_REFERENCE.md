# Smart Contract API Reference

Version: 2026-04-15
Status: Current code-aligned reference

This document reflects the real public interface currently implemented in the Soroban contracts.

Scope:
- Batch Executor
- MEV Guard
- Stablecoin

Notes:
- Signatures and behavior are based on current Rust code under contracts.
- Any future interface changes should update this file in the same PR.

## 1) Batch Executor

File:
- contracts/batch_executor/src/lib.rs

Contract name:
- BatchExecutor

### Data Types

OperationType:
- Payment
- Swap
- Supply
- Borrow
- Repay
- Withdraw

Operation:
- op_type: OperationType
- target: Address
- amount: i128
- params: BytesN<128>
- asset: Option<Address>

OperationResult:
- success: bool
- return_value: i128
- gas_used: u64

Error codes (BatchExecutor::Error):
- 1 AlreadyInitialized
- 2 NotInitialized
- 3 Unauthorized
- 4 ReentrancyDetected
- 5 EmptyBatch
- 6 InvalidOperation
- 7 ExecutionFailed
- 8 InsufficientBalance
- 9 AmountMustBePositive

### Public Methods

init(env: Env, admin: Address) -> Result<(), Error>
- Initializes admin and counters.
- Fails with AlreadyInitialized if already set.
- Requires admin authorization.

execute_batch(env: Env, operations: Vec<Operation>, signer: Address) -> Result<Vec<OperationResult>, Error>
- Requires contract initialized.
- Reentrancy-protected.
- Requires signer authorization.
- Batch must have 1..=50 operations.
- Atomic behavior at contract level: if one operation fails, method returns error and current call reverts.

get_admin(env: Env) -> Result<Address, Error>
get_execution_count(env: Env) -> u64
get_total_gas_saved(env: Env) -> u64

### Operation Handling Status

Payment:
- If asset is Some(token_contract):
  - Calls token contract balance(signer)
  - Validates signer balance >= amount
  - Calls token contract transfer(signer, target, amount)
- If asset is None:
  - Returns amount without external token transfer (compatibility fallback)

Important compatibility note:
- The current Stablecoin contract does not expose balance and transfer methods with this ABI.
- Therefore, Payment real transfer currently requires a token contract implementing:
  - balance(owner: Address) -> i128
  - transfer(from: Address, to: Address, amount: i128) -> ()

Swap:
- Currently simulated with 0.3% fee model: amount_out = amount * 997 / 1000.
- Includes signer != target validation.

Supply:
- Currently simulated as 1:1 shares.

Borrow:
- Currently simulated as 80% of amount.

Repay:
- Currently simulated passthrough.

Withdraw:
- Currently simulated with 0.2% buffer: amount_out = amount * 998 / 1000.

### Tests Present

- init and admin checks
- batch happy path (payments)
- empty batch failure
- invalid amount failure
- not initialized failure
- real token transfer path using mock token contract and asset Some(...)


## 2) MEV Guard

File:
- contracts/mev_guard/src/lib.rs

Contract name:
- MEVGuard

### Data Types

SwapPath:
- Vec<Address>

ProtectedOrder:
- trader: Address
- path: SwapPath
- amount_in: i128
- min_amount_out: i128
- deadline: u64
- nonce: BytesN<32>
- created_at: u64
- filled: bool

SwapResult:
- amount_out: i128
- effective_price: i128
- slippage_bps: u32

Error codes (MEVGuard::Error):
- 1 AlreadyInitialized
- 2 NotInitialized
- 3 Unauthorized
- 4 DeadlineExpired
- 5 SlippageExceeded
- 6 InvalidPath
- 7 InsufficientOutput
- 8 ReentrancyDetected
- 9 OrderAlreadyFilled
- 10 InvalidAmount
- 11 DeadlineTooSoon

### Public Methods

init(env: Env, admin: Address, max_slippage_bps: u32, min_block_delay: u32) -> Result<(), Error>
- Single initialization.
- Stores admin and guard params.

create_protected_order(env: Env, trader: Address, path: SwapPath, amount_in: i128, min_amount_out: i128, deadline: u64) -> Result<BytesN<32>, Error>
- Requires trader auth.
- path length must be >= 2.
- amount_in and min_amount_out must be > 0.
- min_amount_out must be <= amount_in.
- deadline must be greater than current timestamp + min_block_delay.
- Persists order under nonce.

execute_protected_swap(env: Env, nonce: BytesN<32>) -> Result<SwapResult, Error>
- Reentrancy-protected.
- Loads order by nonce.
- Requires trader auth.
- Rejects filled/expired orders.
- Executes internal atomic swap simulation.
- Enforces min_amount_out and max_slippage_bps.
- Marks order as filled.

cancel_order(env: Env, nonce: BytesN<32>) -> Result<(), Error>
- Requires order trader auth.
- Removes non-filled order.

get_order(env: Env, nonce: BytesN<32>) -> Result<ProtectedOrder, Error>
get_max_slippage_bps(env: Env) -> u32
get_admin(env: Env) -> Result<Address, Error>

### Execution Status

- execute_atomic_swap is currently simulated hop-by-hop with 0.3% fee per hop.
- Real DEX integration is still pending.

### Tests Present

- init
- protected order creation
- protected swap execution
- short deadline rejection
- expired order rejection


## 3) Stablecoin

File:
- contracts/stablecoin/src/lib.rs

Contract name:
- StablecoinContract

### Public Methods

init(env: Env, admin: Address, risk_threshold_bps: u32) -> Result<(), Error>
set_risk_threshold(env: Env, caller: Address, risk_threshold_bps: u32) -> Result<(), Error>
risk_threshold(env: Env) -> u32
balance_of(env: Env, owner: Address) -> u128
balance(env: Env, owner: Address) -> i128
total_supply(env: Env) -> u128
is_locked(env: Env, owner: Address) -> bool
paused(env: Env) -> bool
set_pause(env: Env, caller: Address, flag: bool) -> Result<(), Error>
set_mint_enabled(env: Env, caller: Address, flag: bool) -> Result<(), Error>
set_burn_enabled(env: Env, caller: Address, flag: bool) -> Result<(), Error>
lock(env: Env, caller: Address, owner: Address) -> Result<(), Error>
unlock(env: Env, caller: Address, owner: Address) -> Result<(), Error>
mint_guarded(env: Env, caller: Address, to: Address, amount: u128, current_risk_bps: u32) -> Result<(), Error>
burn(env: Env, caller: Address, from: Address, amount: u128) -> Result<(), Error>
transfer(env: Env, from: Address, to: Address, amount: i128) -> Result<(), Error>
clawback(env: Env, caller: Address, from: Address, amount: u128) -> Result<(), Error>
symbol(env: Env) -> Symbol

### Important Note

- Stablecoin now exposes `balance(owner) -> i128` and `transfer(from, to, amount) -> Result<(), Error>` for compatibility with Batch Executor payment flows.


## 4) Integration Checklist

Before backend or contract-to-contract integration:

1. Confirm exact method names and argument types from source files.
2. Confirm numeric widths and signedness:
- Batch/MEV mostly i128
- Stablecoin balance/mint/burn uses u128
3. Confirm required authorization paths (require_auth usage).
4. Confirm test coverage for the specific call path.
5. For Payment integrations, prefer `balance`/`transfer` when interoperating with Batch Executor.


## 5) Known Gaps

- Batch Executor Swap/Supply/Borrow/Repay/Withdraw are still simulation/provisional logic.
- MEV Guard swap execution is still simulation.
- Real payment path is now ABI-compatible between Stablecoin and Batch Executor (`balance` + `transfer`).

These should be resolved before production-grade inter-contract flow.
