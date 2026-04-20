# Contract Deployment Guide

Version: 2026-04-15
Status: Repository-aligned

This guide documents the actual deployment flow currently implemented in this repository.

## 1) What exists today

Primary script:
- deploy-testnet.sh

Secondary script:
- infra/deploy_soroban.sh

Current automated deploy scope in both scripts:
- stablecoin
- risklock
- loans_pool
- portfolio
- governance
- zk_verifier
- batch_executor
- mev_guard

Important:
- scripts now include preflight validations for soroban CLI presence and required WASM files.
- both scripts now persist BATCH_EXECUTOR_CONTRACT_ID and MEV_GUARD_CONTRACT_ID in env files.


## 2) Prerequisites

1. Soroban CLI installed.
2. Rust target installed:
- rustup target add wasm32v1-none
3. Deploy key configured in Soroban CLI.
4. Testnet account funded.

Useful check commands:
- soroban --version
- soroban keys list
- soroban keys show stellaro-testnet-deploy


## 3) Recommended testnet deploy

From repository root:
- ./deploy-testnet.sh

What this script does:
1. Validates key alias stellaro-testnet-deploy.
2. Builds contracts with soroban contract build --profile release.
3. Deploys all 8 contracts listed above.
4. Runs init calls (idempotent behavior where supported).
5. Writes/upserts IDs into:
- .env-testnet
- apps/backend/.env-testnet (if backend folder exists)

Main variables written:
- STABLECOIN_CONTRACT_ID
- RISKLOCK_CONTRACT_ID
- LOANSPOOL_CONTRACT_ID
- PORTFOLIO_CONTRACT_ID
- GOVERNANCE_CONTRACT_ID
- ZK_VERIFIER_CONTRACT_ID
- BATCH_EXECUTOR_CONTRACT_ID
- MEV_GUARD_CONTRACT_ID

Network written:
- STELLAR_NETWORK=testnet
- SOROBAN_RPC_URL=https://soroban-testnet.stellar.org
- HORIZON_URL=https://horizon-testnet.stellar.org


## 3.1) Current testnet deployment snapshot (2026-04-15)

Admin public key:
- GC5LQLM7IOEC7IDE27CXOS2SH4ZXXNN7NJS3BJOZKAFSPAC2PZ34J4XX

Contracts and explorer links:
- STABLECOIN_CONTRACT_ID=CCX2C7SN3RXKAVTFTNBQ5MCWLY2WEGXWGRKVFKJ427HN745CHXNRRBVG
  - https://stellar.expert/explorer/testnet/contract/CCX2C7SN3RXKAVTFTNBQ5MCWLY2WEGXWGRKVFKJ427HN745CHXNRRBVG
- RISKLOCK_CONTRACT_ID=CAMEHWI55A4CJ5UE7YN5V7NPP4ZPVMOE6ZSIF5JQKQXVJHLENMB464VO
  - https://stellar.expert/explorer/testnet/contract/CAMEHWI55A4CJ5UE7YN5V7NPP4ZPVMOE6ZSIF5JQKQXVJHLENMB464VO
- LOANSPOOL_CONTRACT_ID=CAXAKWLYXOHZBUEKHGSOILJR3CU5ICEREZTA3LYYFIJPK3ZQQLCZEYW7
  - https://stellar.expert/explorer/testnet/contract/CAXAKWLYXOHZBUEKHGSOILJR3CU5ICEREZTA3LYYFIJPK3ZQQLCZEYW7
- PORTFOLIO_CONTRACT_ID=CC6NTQNQ6CM42F2DB44CYZE24O7IJ7VNMSEHVKPX57NVCV46MEIGKUNB
  - https://stellar.expert/explorer/testnet/contract/CC6NTQNQ6CM42F2DB44CYZE24O7IJ7VNMSEHVKPX57NVCV46MEIGKUNB
- GOVERNANCE_CONTRACT_ID=CCUHIZXPRMZQJ2E2YY6BBRP3YSXBGX4HDHZDVVMF2XM3WZIDOYGM47MP
  - https://stellar.expert/explorer/testnet/contract/CCUHIZXPRMZQJ2E2YY6BBRP3YSXBGX4HDHZDVVMF2XM3WZIDOYGM47MP
- ZK_VERIFIER_CONTRACT_ID=CDOPZBPMQM24GYMKTGLC2EEY3QOQNNFO3BJ6JTBGW2T5UMJCKFQ5PSVY
  - https://stellar.expert/explorer/testnet/contract/CDOPZBPMQM24GYMKTGLC2EEY3QOQNNFO3BJ6JTBGW2T5UMJCKFQ5PSVY
- BATCH_EXECUTOR_CONTRACT_ID=CAHWOMBTMVUWGMRWSJY2TPCBMPO3A3LODCBE6MFXMA6XR4ALZZCGTN7I
  - https://stellar.expert/explorer/testnet/contract/CAHWOMBTMVUWGMRWSJY2TPCBMPO3A3LODCBE6MFXMA6XR4ALZZCGTN7I
- MEV_GUARD_CONTRACT_ID=CDHQZQ5YMNVAPKXJ6LVBDSJC4QVZL4UD2TIKSTDYGATMBTWEV7ZSOG3M
  - https://stellar.expert/explorer/testnet/contract/CDHQZQ5YMNVAPKXJ6LVBDSJC4QVZL4UD2TIKSTDYGATMBTWEV7ZSOG3M


## 4) Alternative script

From repository root:
- ./infra/deploy_soroban.sh <ALIAS_DA_CONTA> [ADMIN_PUBKEY] [RISK_BPS] [LTV_BPS] [INTEREST_BPS] [MAX_SLIPPAGE_BPS] [MIN_BLOCK_DELAY]

Example:
- ./infra/deploy_soroban.sh deploy

Behavior:
- builds contracts
- deploys the same 8-contract set
- performs idempotent init checks
- persists IDs in .env-dev and apps/backend/.env-dev


## 5) Manual deploy (optional / fallback)

Use this section only if you need isolated or partial deploys outside automated scripts.

Build all contracts:
- cd contracts
- soroban contract build --profile release

Deploy batch_executor:
- soroban contract deploy \
  --rpc-url https://soroban-testnet.stellar.org \
  --network-passphrase "Test SDF Network ; September 2015" \
  --source-account stellaro-testnet-deploy \
  --wasm contracts/target/wasm32v1-none/release/batch_executor.wasm

Deploy mev_guard:
- soroban contract deploy \
  --rpc-url https://soroban-testnet.stellar.org \
  --network-passphrase "Test SDF Network ; September 2015" \
  --source-account stellaro-testnet-deploy \
  --wasm contracts/target/wasm32v1-none/release/mev_guard.wasm

Then persist IDs manually in environment files:
- .env-testnet
- apps/backend/.env-testnet

Suggested keys:
- BATCH_EXECUTOR_CONTRACT_ID=<id>
- MEV_GUARD_CONTRACT_ID=<id>


## 6) Post-deploy verification checklist

1. Verify each contract is callable.
2. Verify init state where applicable:
- stablecoin risk_threshold
- loans_pool params
- governance get_admin
3. Run local contract tests on native target:
- cd contracts
- cargo test -p batch_executor --target x86_64-unknown-linux-gnu
- cargo test -p mev_guard --target x86_64-unknown-linux-gnu
4. Confirm backend env files contain updated IDs.


## 7) Known script gaps

1. ZK verifier may require additional manual key material setup depending on runtime flow.
2. Mainnet deployment procedure is not finalized in these scripts.


## 8) Safe extension plan for automation

Current extension already implemented in both scripts.

Future safe extension topics:
1. Add optional dry-run mode for command preview without on-chain writes.
2. Add explicit Soroban CLI version gate (minimum tested version).
3. Add structured JSON output for CI parsing of contract IDs.


## 9) Troubleshooting quick notes

Deploy key not found:
- soroban keys generate stellaro-testnet-deploy --network testnet

No funds:
- fund account on testnet and retry deploy

Wrong network:
- confirm RPC URL and passphrase match testnet

Missing wasm file:
- rerun build in contracts workspace and verify file path


## 10) Source of truth

Scripts used as source:
- deploy-testnet.sh
- infra/deploy_soroban.sh

Contract workspace:
- contracts/Cargo.toml
- contracts/*/src/lib.rs
