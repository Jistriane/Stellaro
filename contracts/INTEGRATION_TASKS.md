# Contract Integration Tasks

## Status Snapshot

- Last update: April 2026
- Deployed contracts: 6/8
- Remaining integration work: final stablecoin/router/MEV testnet mutation validation

## Operational Validation

Read-only smoke script executed successfully on testnet:
- `contracts/scripts/testnet_integration_smoke.sh`

Important note:
Some currently deployed testnet contracts do not expose all required configuration methods
(e.g., `set_stablecoin_contract`, `set_dex_router`). Full mutation validation requires redeploy/upgrade.

## Upgrade and Validation Automation

Available scripts:
- `contracts/scripts/testnet_abi_upgrade_check.sh`
- `contracts/scripts/testnet_post_upgrade_validate.sh`
- `contracts/scripts/redeploy_upgrade_batch_mev_testnet.sh`
- `contracts/scripts/testnet_transactional_e2e.sh`
- `contracts/scripts/testnet_generate_evidence_report.sh`

Operational checklist:
- `docs/TESTNET_UPGRADE_CHECKLIST.md`

## Missing Methods on Current Deployment

- `batch_executor.set_stablecoin_contract`
- `batch_executor.get_stablecoin_contract`
- `batch_executor.set_dex_router`
- `batch_executor.get_dex_router`
- `mev_guard.set_dex_router`
- `mev_guard.get_dex_router`

## Batch Executor Integration Work

### 1) `execute_payment()` token integration

Current state:
- Implemented with configurable stablecoin default and per-operation asset override
- Includes balance validation and transfer execution path

Next actions:
- Validate full flow against real stablecoin deployment on testnet
- Keep script-based evidence attached to each run

### 2) `execute_swap()` router integration

Current state:
- Runtime decoding and min-out validation implemented
- Router invocation path implemented with fallback simulation path when configuration is missing

Next actions:
- Confirm Soroswap router contract ID in environment
- Execute full testnet swap validation with configured router

### 3) `execute_supply()` pool integration

Current state:
- Real call path for pool deposit implemented
- Input validation and test coverage present

Next actions:
- Complete testnet validation against active LoansPool deployment

### 4) `execute_borrow()` pool integration

Current state:
- Borrow call path implemented
- Collateral parameter decoding and validation implemented

Next actions:
- Execute complete testnet borrow validation and evidence capture

### 5) `execute_repay()` and `execute_withdraw()`

Current state:
- Implemented in batch executor
- `withdraw` path available with lender position handling in loans pool

Next actions:
- Run end-to-end repay/withdraw scenario in testnet

## Testnet Contract References

- Stablecoin: `CDWWZ7XPQVRVYQK7UGRVRCSZGPJXWRKSTGNXBUNGNWGXQXDTZLQDZH6`
- LoansPool: `CBHMJFPJDMQHAQKWJDWGRGVFB7RPPZUEMH5UDG56PG5SW3XDW6IY2Y`
- Router (Soroswap): pending confirmation in environment/config

## Definition of Done

Integration is complete when all conditions are met:
- Required ABI methods are present in deployed contracts
- Mutation scripts succeed without manual intervention
- Transactional E2E script passes (mint + batch payment + protected swap)
- Evidence report generated and archived
- Runbook/checklist updated with final operational notes
