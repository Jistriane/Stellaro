# markdownlint-disable-file MD025 MD032 MD012

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


### BlendPositionsController

File:
- apps/backend/src/defi/blend/positions.controller.ts

Endpoints:
- GET /defi/blend/positions/status
- GET /defi/blend/positions/:address

Behavior:
- Exposes a lightweight Blend readiness overview for DEX operations.
- Delegates live position lookups to `BlendPositionsService` with Stellar address validation and cached account enrichment.


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


### HealthController

File:
- apps/backend/src/health/health.controller.ts

Endpoints:
- GET /health
- GET /health/integrations/financial

Behavior:
- Returns baseline service liveness on `/health`.
- Returns payment-rail readiness on `/health/integrations/financial` with explicit checks for PIX, x402, and Etherfuse modes/credentials.
- Supports strict validation mode through `FINANCIAL_INTEGRATIONS_REQUIRE_LIVE=true` to fail readiness when any rail is not in `live` mode.


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


### X402Controller

Files:
- apps/backend/src/payments/x402.controller.ts
- apps/backend/src/payments/x402.service.ts

Endpoints:
- GET /payments/x402/status
- POST /payments/x402/quote

Behavior:
- Exposes x402 integration posture (`disabled`, `stub`, `live`) and runtime metadata.
- Creates facilitator-oriented quote payloads with deterministic settlement envelope fields.
- Falls back to `stub` mode when `live` is requested but facilitator configuration is incomplete.

Env keys used by this integration:
- X402_MODE
- X402_FACILITATOR_URL
- FACILITATOR_PROVIDER_CONTRACT_ID
- FACILITATOR_API_KEY
- X402_NETWORK
- X402_ACCEPTED_ASSET
- X402_RESOURCE
- X402_RECIPIENT
- X402_FEE_BPS
- X402_TTL_SECONDS


### EtherfuseController

Files:
- apps/backend/src/payments/etherfuse.controller.ts
- apps/backend/src/payments/etherfuse.service.ts

Endpoints:
- GET /payments/etherfuse/status
- POST /payments/etherfuse/quote
- POST /payments/etherfuse/order

Behavior:
- Exposes Etherfuse integration posture (`disabled`, `stub`, `live`) and runtime metadata.
- Creates conversion quotes (onramp/offramp/swap envelope) with deterministic stub fallback.
- Creates order payloads from `quoteId` in stub mode and through Etherfuse API in live mode.
- Enforces live-mode requirements (`apiKey`, `customerId`, and bank account context for orders).

Env keys used by this integration:
- ETHERFUSE_MODE
- ETHERFUSE_API_BASE_URL
- ETHERFUSE_API_KEY
- ETHERFUSE_CUSTOMER_ID
- ETHERFUSE_BANK_ACCOUNT_ID
- ETHERFUSE_WALLET_ADDRESS
- ETHERFUSE_BLOCKCHAIN
- ETHERFUSE_DEFAULT_QUOTE_TYPE
- ETHERFUSE_SOURCE_ASSET
- ETHERFUSE_TARGET_ASSET
- ETHERFUSE_STUB_EXCHANGE_RATE
- ETHERFUSE_STUB_FEE_BPS


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
