# Contract Deployment Guide

Version: 2026-05-11
Status: Repository-aligned

This guide documents the actual deployment flow currently implemented in this repository.

Canonical registry reference:
- `docs/SMART_CONTRACT_DEPLOYMENT_REGISTRY.md`

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
- vc_registry
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
3. Deploys all 9 contracts listed above.
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
- VC_REGISTRY_ID
- BATCH_EXECUTOR_CONTRACT_ID
- MEV_GUARD_CONTRACT_ID

Network written:
- STELLAR_NETWORK=testnet
- SOROBAN_RPC_URL=https://soroban-testnet.stellar.org
- HORIZON_URL=https://horizon-testnet.stellar.org


## 3.1) Current testnet deployment snapshot (2026-05-11)

Admin public key:
- GC76AIX26RHU6YI4S3VRMO4DAFVC4H2QPA3ULHCCAL4BU3UKX2N56DJO

Deployment command used:
- ./infra/deploy_soroban.sh axon-admin

Contracts and explorer links:
- STABLECOIN_CONTRACT_ID=CCOOH5HD7QPRLE2M7ENDUS3HFMBFEH6QNUCBTY6W3XV7TKQ2VVOP6DPU
  - https://stellar.expert/explorer/testnet/contract/CCOOH5HD7QPRLE2M7ENDUS3HFMBFEH6QNUCBTY6W3XV7TKQ2VVOP6DPU
- RISKLOCK_CONTRACT_ID=CAWWAXLYRDVJLNT4KINIK5BOYZSMQZGOJIUYBU2B7CBLQXUM7PG5ZDBX
  - https://stellar.expert/explorer/testnet/contract/CAWWAXLYRDVJLNT4KINIK5BOYZSMQZGOJIUYBU2B7CBLQXUM7PG5ZDBX
- LOANSPOOL_CONTRACT_ID=CBDNBEKIXEKCJPDBSAEBNJ62ZENE4ZJG2EVOTGBYOHJ7SXQ5K6OPUO25
  - https://stellar.expert/explorer/testnet/contract/CBDNBEKIXEKCJPDBSAEBNJ62ZENE4ZJG2EVOTGBYOHJ7SXQ5K6OPUO25
- PORTFOLIO_CONTRACT_ID=CB34KFLFRDTG36NUCW2VBAIGKMM4FVIWK7FL76H6RTSEZZT7PQ2XZPYL
  - https://stellar.expert/explorer/testnet/contract/CB34KFLFRDTG36NUCW2VBAIGKMM4FVIWK7FL76H6RTSEZZT7PQ2XZPYL
- GOVERNANCE_CONTRACT_ID=CCA6ZOLV2S5AR43VS47KJZSPSV4NGHCPAFQG3DK7UJBOUXIVGGIXQMRO
  - https://stellar.expert/explorer/testnet/contract/CCA6ZOLV2S5AR43VS47KJZSPSV4NGHCPAFQG3DK7UJBOUXIVGGIXQMRO
- ZK_VERIFIER_CONTRACT_ID=CBDBZ4V2A4LBWJ2SGCKLIFTINMTEG626S2NH2DPLHZDDCCHRACID5E7L
  - https://stellar.expert/explorer/testnet/contract/CBDBZ4V2A4LBWJ2SGCKLIFTINMTEG626S2NH2DPLHZDDCCHRACID5E7L
- VC_REGISTRY_ID=CD3IEVYYTYUYPLM7WT335SM4AO7FX4VMWR5DWXEL3D7CFTDT5NPNRV3Z
  - https://stellar.expert/explorer/testnet/contract/CD3IEVYYTYUYPLM7WT335SM4AO7FX4VMWR5DWXEL3D7CFTDT5NPNRV3Z
- BATCH_EXECUTOR_CONTRACT_ID=CATVMEW7IXDGXZ333K3YWOXAHX3FXZ3CTWNRYZQUJTPK2SISTOFXFGP2
  - https://stellar.expert/explorer/testnet/contract/CATVMEW7IXDGXZ333K3YWOXAHX3FXZ3CTWNRYZQUJTPK2SISTOFXFGP2
- MEV_GUARD_CONTRACT_ID=CCNXG3ZSXVI6X7MTCNYMYCNDP3TH43PQNZUKZHCFAQ72RXSEQNWK6L4J
  - https://stellar.expert/explorer/testnet/contract/CCNXG3ZSXVI6X7MTCNYMYCNDP3TH43PQNZUKZHCFAQ72RXSEQNWK6L4J


## 4) Alternative script

From repository root:
- ./infra/deploy_soroban.sh <ALIAS_DA_CONTA> [ADMIN_PUBKEY] [RISK_BPS] [LTV_BPS] [INTEREST_BPS] [MAX_SLIPPAGE_BPS] [MIN_BLOCK_DELAY]

Example:
- ./infra/deploy_soroban.sh deploy

Behavior:
- builds contracts
- deploys the same 9-contract set
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

## 11) ABI compatibility note

Current `loans_pool.init` requires:
- admin
- ltv_bps
- interest_bps
- zk_verifier
- vc_registry

Both deploy scripts pass all required arguments.
