# Troubleshooting Guide

Version: 2026-04-15
Status: Repository-aligned

This guide focuses on issues actually observed or likely in the current Stellaro codebase.

## 1) Contract tests failing due wasm target

Symptom:
- cargo test fails with panic_impl or harness errors when using default workspace target.

Cause:
- contracts/.cargo config may force wasm target.

Fix:
1. Run unit tests on host target.
2. Use:
- cd contracts
- cargo test -p batch_executor --target x86_64-unknown-linux-gnu
- cargo test -p mev_guard --target x86_64-unknown-linux-gnu


## 2) Batch payment real path with Stablecoin

Symptom:
- Payment call fails even with Stablecoin configured as asset.

Cause:
- Integration/config issue (wrong contract ID, paused contract, locked accounts, or insufficient balance).
- ABI mismatch is no longer the default cause because Stablecoin now supports:
  - balance(owner) -> i128
  - transfer(from, to, amount) -> Result<(), Error>

Fix options:
1. Confirm `STABLECOIN_CONTRACT_ID` and `BATCH_EXECUTOR_CONTRACT_ID` in env.
2. Verify contract is not paused and accounts are not locked.
3. Check payer balance using `balance`/`balance_of` before batch execution.


## 3) Soroban RPC unavailable in backend

Symptom:
- chain integrations return null or degraded responses.
- logs show Soroban running in degraded mode.

Cause:
- SOROBAN_RPC_URL missing or unreachable.

Fix:
1. Set SOROBAN_RPC_URL in backend env.
2. Verify URL reachability.
3. Restart backend.


## 4) Mainnet/testnet passphrase mismatch

Symptom:
- simulation or submission errors despite reachable RPC.

Cause:
- wrong network passphrase used in transaction builder.

Context:
- Some call paths currently assume testnet passphrase explicitly.

Fix:
1. Ensure STELLAR_NETWORK and passphrase vars are correct.
2. Make passphrase selection dynamic for all builders.


## 5) ZK verifier calls failing

Symptom:
- verify returns missing-contract-id or simulation-failed.

Common causes:
1. ZK_VERIFIER_CONTRACT_ID not configured.
2. proof/public_inputs/nonce lengths invalid.

Current expected lengths in service:
- proof: 256 bytes (hex-decoded)
- publicInputs: 128 bytes (hex-decoded)
- nonce: 16 bytes (hex-decoded)

Fix:
1. Set ZK_VERIFIER_CONTRACT_ID.
2. Validate payload byte lengths before call.
3. Re-run with known-good vectors.


## 6) Reserve monitoring cannot freeze minting

Symptom:
- undercollateralization handling logs errors when toggling mint state.

Cause:
- missing STELLAR_SECRET_KEY or RPC unavailable.

Fix:
1. Set STELLAR_SECRET_KEY in runtime env.
2. Confirm STABLECOIN_CONTRACT_ID is present.
3. Ensure Soroban RPC is reachable.


## 7) Deployment script confusion

Symptom:
- expected batch_executor/mev_guard IDs are not produced by automated deploy.

Cause:
- deploy-testnet.sh and infra/deploy_soroban.sh currently deploy only 6 contracts.

Fix:
1. Deploy batch_executor and mev_guard manually.
2. Add them to scripts if full automation is needed.


## 8) Backend action endpoint returns placeholder-style success

Symptom:
- swap/liquidation/hedge appear successful but no real on-chain execution happened.

Cause:
- some ActionsService flows are scaffolds/fallbacks.

Fix:
1. Confirm each flow path in apps/backend/src/actions/actions.service.ts.
2. Implement submitTxReal path for intended methods.
3. Add integration tests asserting txHash presence for write flows.


## 9) Fast diagnostic checklist

1. Contracts:
- cargo test -p batch_executor --target x86_64-unknown-linux-gnu
- cargo test -p mev_guard --target x86_64-unknown-linux-gnu

2. Backend env:
- STELLAR_NETWORK
- SOROBAN_RPC_URL
- HORIZON_URL
- contract IDs
- WALLET_SECRET_DEV / STELLAR_SECRET_KEY as required

3. Backend tests:
- cd apps/backend
- npm test

4. Runtime probe:
- GET /chain/health


## 10) Escalation targets

When blocked:
1. ABI mismatch issues: contract layer owners
2. Simulation/transaction builder issues: chain service owners
3. Deployment script scope gaps: infra owners
4. Business flow placeholders: actions service owners

Keeping these boundaries clear reduces debugging time significantly.
