# Testing Strategy and Templates

Version: 2026-04-15
Status: Repository-aligned

This guide defines practical testing flows that match the current Stellaro repository.

## 1) Test layers in this repo

1. Rust contract tests
- Location: contracts/*/src/lib.rs unit tests
- Runner: cargo test

2. Backend unit/integration tests (NestJS + Jest)
- Location: apps/backend/src/**/*.spec.ts
- Runner: npm test in apps/backend or root turbo test

3. Backend e2e tests
- Runner: npm run test:e2e in apps/backend

4. Workspace orchestration tests
- Runner: npm test at repository root (turbo test)


## 2) Canonical commands

From repository root:
- npm test
- npm run build

Backend focused:
- cd apps/backend
- npm test
- npm run test:cov
- npm run test:e2e

Contracts focused:
- cd contracts
- cargo test -p batch_executor --target x86_64-unknown-linux-gnu
- cargo test -p mev_guard --target x86_64-unknown-linux-gnu

Why native target for contract unit tests:
- workspace defaults may target wasm32 via .cargo config
- host target avoids test harness conflicts for local unit tests


## 3) Current priority suites

### A) Batch Executor contract

Core scenarios:
1. init and admin setup
2. execute_batch success path
3. execute_batch rejects empty operations
4. execute_batch rejects invalid amount
5. execute_batch rejects non-initialized usage
6. payment real token path through mock token contract

Execution:
- cd contracts
- cargo test -p batch_executor --target x86_64-unknown-linux-gnu

Expected today:
- all tests passing


### B) MEV Guard contract

Core scenarios:
1. init
2. protected order creation
3. protected swap execution
4. short deadline rejection
5. expired order rejection

Execution:
- cd contracts
- cargo test -p mev_guard --target x86_64-unknown-linux-gnu

Expected today:
- all tests passing


### C) Backend chain + actions + zk

Useful suites:
- apps/backend/src/chain/*.spec.ts
- apps/backend/src/actions/actions.service.spec.ts
- apps/backend/src/zk/zk.service.spec.ts

Execution:
- cd apps/backend
- npm test -- src/chain
- npm test -- src/actions/actions.service.spec.ts
- npm test -- src/zk/zk.service.spec.ts


## 4) Smoke templates

### Contract smoke template

1. Build and run target contract tests.
2. Confirm no regressions in paired critical contract.
3. Record pass counts.

Suggested sequence:
- cargo test -p batch_executor --target x86_64-unknown-linux-gnu
- cargo test -p mev_guard --target x86_64-unknown-linux-gnu


### Backend smoke template

1. Validate chain health endpoint behavior.
2. Validate action endpoints body validation.
3. Validate ZK service handles missing contract config safely.

Suggested checks:
- GET /chain/health
- POST /actions/stablecoin/mint with invalid body returns 400
- ZK verifier flow without contract id returns controlled error


## 5) Coverage strategy

Backend:
- run npm run test:cov inside apps/backend
- focus coverage improvements on services that touch on-chain paths:
  - chain.service.ts
  - soroban.service.ts
  - actions.service.ts
  - zk.service.ts
  - reserve-manager.service.ts

Contracts:
- keep deterministic unit tests in src/lib.rs
- add targeted negative tests for auth, bounds, and state transitions


## 6) Failure triage flow

1. Is failure from wasm target mismatch?
- rerun with --target x86_64-unknown-linux-gnu

2. Is failure from environment missing values?
- inspect STELLAR_NETWORK, SOROBAN_RPC_URL, contract IDs

3. Is failure from ABI mismatch?
- compare backend call method names and argument types with contract source

4. Is failure from simulated placeholder path?
- check whether feature is scaffold-only in ActionsService


## 7) Gate for merge (recommended)

Minimum green checks before merge:
1. cargo test -p batch_executor --target x86_64-unknown-linux-gnu
2. cargo test -p mev_guard --target x86_64-unknown-linux-gnu
3. cd apps/backend && npm test
4. no new high-severity lint/type errors

Optional but recommended:
- apps/backend test coverage run
- targeted endpoint smoke checks


## 8) Quick CI suggestion

If adding CI step for contracts, force native target explicitly for unit tests:
- cargo test -p batch_executor --target x86_64-unknown-linux-gnu
- cargo test -p mev_guard --target x86_64-unknown-linux-gnu

This avoids accidental wasm harness failures in local-like test phases.
