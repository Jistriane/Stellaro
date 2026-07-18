# Troubleshooting Guide

Version: 2026-04-15  
Status: Repository-aligned

This guide focuses on issues actually observed or likely in the current Stellaro codebase.

## 1. Contract tests failing due to wasm target

Symptom:

- `cargo test` fails with `panic_impl` or harness errors when using the default workspace target.

Cause:

- `contracts/.cargo/config` may force the wasm target.

Fix:

1. Run unit tests on the host target.
2. Use:

```bash
cd contracts
cargo test -p batch_executor --target x86_64-unknown-linux-gnu
cargo test -p mev_guard --target x86_64-unknown-linux-gnu
```

## 2. Batch payment real path with Stablecoin

Symptom:

- Payment call fails even with Stablecoin configured as the asset.

Cause:

- Integration or configuration issue, such as wrong contract ID, paused contract, locked accounts, or insufficient balance.
- ABI mismatch is no longer the default cause because Stablecoin now supports:
  - `balance(owner) -> i128`
  - `transfer(from, to, amount) -> Result<(), Error>`

Fix:

1. Confirm `STABLECOIN_CONTRACT_ID` and `BATCH_EXECUTOR_CONTRACT_ID` in the environment.
2. Verify the contract is not paused and accounts are not locked.
3. Check payer balance using `balance` or `balance_of` before batch execution.

## 3. Soroban RPC unavailable in backend

Symptom:

- Chain integrations return `null` or degraded responses.
- Logs show Soroban running in degraded mode.

Cause:

- `SOROBAN_RPC_URL` is missing or unreachable.

Fix:

1. Set `SOROBAN_RPC_URL` in backend environment variables.
2. Verify the URL is reachable.
3. Restart the backend.

## 4. Mainnet or testnet passphrase mismatch

Symptom:

- Simulation or submission errors occur despite a reachable RPC.

Cause:

- Wrong network passphrase is used in the transaction builder.

Context:

- Some call paths currently assume the testnet passphrase explicitly.

Fix:

1. Ensure `STELLAR_NETWORK` and passphrase variables are correct.
2. Make passphrase selection dynamic for all builders.

## 5. ZK verifier calls failing

Symptom:

- `verify` returns `missing-contract-id` or `simulation-failed`.

Common causes:

1. `ZK_VERIFIER_CONTRACT_ID` is not configured.
2. `proof`, `public_inputs`, or `nonce` lengths are invalid.

Current expected lengths in service:

- `proof`: 256 bytes, hex-decoded
- `publicInputs`: 128 bytes, hex-decoded
- `nonce`: 16 bytes, hex-decoded

Fix:

1. Set `ZK_VERIFIER_CONTRACT_ID`.
2. Validate payload byte lengths before the call.
3. Re-run with known-good vectors.

## 6. Reserve monitoring cannot freeze minting

Symptom:

- Undercollateralization handling logs errors when toggling mint state.

Cause:

- Missing `STELLAR_SECRET_KEY` or unavailable RPC.

Fix:

1. Set `STELLAR_SECRET_KEY` in runtime environment variables.
2. Confirm `STABLECOIN_CONTRACT_ID` is present.
3. Ensure Soroban RPC is reachable.

## 7. Deployment script confusion

Symptom:

- Expected `batch_executor` or `mev_guard` IDs are not produced by automated deployment.

Cause:

- `deploy-testnet.sh` and `infra/deploy_soroban.sh` currently deploy only six contracts.

Fix:

1. Deploy `batch_executor` and `mev_guard` manually.
2. Add them to scripts if full automation is needed.

## 8. Backend action endpoint returns placeholder-style success

Symptom:

- `swap`, `liquidation`, or `hedge` appear successful but no real on-chain execution happened.

Cause:

- Some `ActionsService` flows are scaffolds or fallbacks.

Fix:

1. Confirm each flow path in `apps/backend/src/actions/actions.service.ts`.
2. Implement the `submitTxReal` path for intended methods.
3. Add integration tests asserting `txHash` presence for write flows.

## 9. Fast diagnostic checklist

Contracts:

```bash
cd contracts
cargo test -p batch_executor --target x86_64-unknown-linux-gnu
cargo test -p mev_guard --target x86_64-unknown-linux-gnu
```

Backend environment:

- `STELLAR_NETWORK`
- `SOROBAN_RPC_URL`
- `HORIZON_URL`
- Contract IDs
- `WALLET_SECRET_DEV` or `STELLAR_SECRET_KEY`, as required

Backend tests:

```bash
cd apps/backend
npm test
```

Runtime probe:

- `GET /chain/health`

## 10. Local stack fails with port conflicts

Symptom:

- `npm run preflight:local-dev` or `npm run doctor:local-dev` fails before `docker compose up`.
- Ports `3000` and `3001` appear occupied by `node` or `next-server`.

Cause:

- Hybrid environment: frontend or backend is running outside Docker while Compose tries to own the same ports.

Fix:

1. Inspect conflicts with:
   - `npm run help:ports:local-dev`
   - `npm run help:ports:local-chain`
2. If the processes are local leftovers, stop them consciously.
3. Re-run:
   - `npm run preflight:local-dev`
   - `npm run dev:stack`

## 11. Backend not ready immediately after `docker compose up`

Symptom:

- `docker compose ps` shows the backend container as up, but `GET /health` still fails for a few seconds.

Cause:

- Application readiness lag during NestJS startup after Compose finishes container startup.

Fix:

1. Wait a few seconds.
2. Re-run:
   - `npm run status:local-dev`
   - `npm run doctor:local-dev`
3. If it still fails, inspect:
   - `docker compose logs backend --tail=200`

## 12. Escalation targets

When blocked:

1. ABI mismatch issues: contract layer owners
2. Simulation or transaction-builder issues: chain service owners
3. Deployment script scope gaps: infra owners
4. Business flow placeholders: actions service owners

Keeping these boundaries clear reduces debugging time significantly.
