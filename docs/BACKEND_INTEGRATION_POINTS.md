# Backend Integration Points

Version: 2026-04-15
Status: Code-aligned with current NestJS backend

This document maps the real backend-to-Soroban integration points currently implemented in apps/backend.

## 1) Core integration services

### ChainService

File:
- apps/backend/src/chain/chain.service.ts

Purpose:
- Central network config provider.
- Contract call simulation helpers.
- Signed transaction submission helper.

Key methods:
- getConfig()
- simulateContractCall(...): lightweight stub (always-ok dev helper)
- simulateContractCallReal(...): uses Soroban RPC prepareTransaction path
- submitTxReal(...): signs and sends tx using WALLET_SECRET_DEV

Env used:
- STELLAR_NETWORK
- SOROBAN_RPC_URL
- HORIZON_URL
- SOROBAN_NETWORK_PASSPHRASE
- WALLET_SECRET_DEV


### SorobanService

File:
- apps/backend/src/chain/soroban.service.ts

Purpose:
- JSON-RPC event reads.
- Generic contract view invocation.
- LoansPool params read with fallback.
- Stablecoin supply read.
- set_mint_enabled write flow.

Key methods:
- getEvents(contractId, startLedger?, endLedger?, paginationToken?)
- invokeContract(contractId, method, args?)
- getLoansPoolParams(contractId)
- getStablecoinSupply(contractId)
- setMintingEnabled(contractId, enabled, signerSecret)

Runtime behavior:
- If SOROBAN_RPC_URL is missing, service enters degraded mode and avoids RPC calls.

Important implementation note:
- invokeContract currently assumes testnet network passphrase in TransactionBuilder.
- If running mainnet, this must be made network-aware.


### ZkService

File:
- apps/backend/src/zk/zk.service.ts

Purpose:
- ZK proof verification simulation against ZK Verifier contract.
- Score query simulation.
- Simple nonce-based rate limit via Redis.

Key methods:
- verify(dto)
- getScore(userAddress)

Contract methods expected:
- verify_proof(user, proof, public_inputs, nonce)
- get_score(user)

Env used:
- SOROBAN_RPC_URL
- STELLAR_NETWORK
- ZK_VERIFIER_CONTRACT_ID


## 2) Business services using chain integration

### ActionsService

File:
- apps/backend/src/actions/actions.service.ts

Purpose:
- High-level business actions and adapters.

Current status by action:
- swap: mostly placeholder/fallback behavior, no final contract execution path
- partialLiquidation: validates config and returns placeholder success path
- autoHedge: computes and returns estimates
- stableMigration: scaffolded flow
- stablecoinMintGuarded/stablecoinBurn: implemented through ChainService simulation/submit helpers

Env dependencies used in this service:
- PORTFOLIO_CONTRACT_ID
- LOANS_POOL_CONTRACT_ID
- STABLECOIN_CONTRACT_ID

Controller endpoints:
- POST /actions/stablecoin/mint
- POST /actions/stablecoin/burn


### BlendPositionsService

File:
- apps/backend/src/defi/blend/positions.service.ts

Purpose:
- Composes account balances from Horizon + prices + LoansPool parameters.

Integration points:
- HorizonService for account balances
- SorobanService.getLoansPoolParams for APY/pool metadata enrichment
- Redis caching

Env dependencies:
- LOANS_POOL_CONTRACT_ID
- LOANSPOOL_INTEREST_BPS (fallback)
- BACKEND_PUBLIC_URL or BACKEND_URL for oracle endpoint


### ReserveManagerService

File:
- apps/backend/src/compliance/reserve-manager.service.ts

Purpose:
- Reserve/collateralization checks and emergency controls.

Integration points:
- SorobanService.getStablecoinSupply
- SorobanService.setMintingEnabled for freeze/unfreeze path
- Horizon reserves account reads
- Oracle-based valuation

Env dependencies:
- STABLECOIN_CONTRACT_ID
- STELLAR_HORIZON
- RESERVE_ACCOUNT
- STELLAR_SECRET_KEY
- RESERVES_PUBLISH_DISABLED


## 3) HTTP integration entry points

### ChainController

File:
- apps/backend/src/chain/chain.controller.ts

Endpoint:
- GET /chain/health

Behavior:
- Reports chain config and checks real simulation availability.


### ActionsController

File:
- apps/backend/src/actions/actions.controller.ts

Endpoints:
- POST /actions/stablecoin/mint
- POST /actions/stablecoin/burn
- POST /actions/stablecoin/transfer

Behavior:
- Validates request body.
- Delegates to ActionsService.


### PaymentsController

File:
- apps/backend/src/payments/payments.controller.ts

Endpoints:
- POST /payments/pix/send (stub)
- POST /payments/card/charge (stub)
- POST /payments/stablecoin/transfer

Behavior:
- Keeps PIX/Card providers as compliance-protected stubs.
- Delegates STLT settlement transfers to ActionsService.stablecoinTransfer.


## 4) Current contract/API alignment caveats

1. Batch Executor payment real path expects token ABI:
- balance(owner) -> i128
- transfer(from, to, amount) -> ()

2. Stablecoin now exposes compatible methods for payment path:
- balance(owner) -> i128
- transfer(from, to, amount) -> Result<(), Error>

Result:
- Direct backend path to Batch Executor payment can use Stablecoin ABI without adapter.

3. SorobanService.invokeContract decodes map-like responses with specific assumptions for params().
- If contract return type changes, this parser must be updated.

4. Some action flows are intentionally scaffolded and still return simulated/placeholder paths.


## 5) Environment contract keys used across backend

Common keys:
- STABLECOIN_CONTRACT_ID
- LOANS_POOL_CONTRACT_ID
- PORTFOLIO_CONTRACT_ID
- ZK_VERIFIER_CONTRACT_ID

Network keys:
- STELLAR_NETWORK
- SOROBAN_RPC_URL
- HORIZON_URL
- SOROBAN_NETWORK_PASSPHRASE

Signer keys:
- WALLET_SECRET_DEV
- STELLAR_SECRET_KEY


## 6) Integration hardening checklist

Before enabling non-simulated production flows:

1. Make network passphrase selection dynamic in all contract call builders.
2. Align Stablecoin and Batch Executor token ABI for payment path.
3. Replace placeholder action paths (swap/liquidation/migration) with actual contract calls.
4. Add structured error mapping from Soroban resultXdr to backend API errors.
5. Add per-endpoint observability for contract latency, failure codes, and retry counts.
6. Validate all required env vars at startup and fail fast for strict environments.


## 7) Minimal end-to-end integration path currently feasible

1. Configure contract IDs and RPC envs.
2. Use ChainService simulateContractCallReal for preflight.
3. Use submitTxReal for signed writes where methods are already compatible.
4. Use SorobanService view methods for read-side enrichment and safety controls.

This is the safest current baseline without introducing ABI-breaking assumptions.
