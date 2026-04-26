# Stellaro Project Manual (EN)

This document provides a comprehensive guide to the Stellaro monorepo, covering its architecture, setup, development, and key features. It is intended for developers, system administrators, and anyone involved in the project's lifecycle.

## 1. Architecture Overview

Stellaro is a Turborepo monorepo designed for financial services, integrating traditional and blockchain technologies.

- **`apps/frontend`**: A Next.js 15 application using the App Router, i18n (PT-BR default, EN), shadcn/ui, Zustand, and React Query.
- **`apps/mobile`**: A React Native (Expo) application for iOS/Android, featuring biometric auth and integrated Stellar wallet.
- **`apps/backend`**: A NestJS (Node 20) application with Prisma (Postgres), Redis/BullMQ for caching and queues, OpenAPI for API documentation, and OpenTelemetry/Sentry for observability.
- **`contracts/`**: A Rust workspace for Soroban smart contracts (15+ contracts in v5.6).
- **`packages/ui`**: Shared React components for a consistent UI (`Stellaro` theme).
- **`packages/config`**: Shared configurations for ESLint, TypeScript, and Prettier.
- **`infra/`**: Infrastructure as Code, including Docker Compose for local development, deployment scripts, and CI/CD manifests (including Mainnet config in `infra/mainnet`).

### Environments and DNS

- **Production**: `app.stellaro.com.br` (frontend) and `api.stellaro.com.br` (backend)
- **Staging**: `staging.stellaro.com.br`
- **Development**: `dev.stellaro.com.br`

These domains also serve as RP IDs for Passkey authentication in their respective environments.

## 2. Getting Started

### 2.1. Prerequisites

- **Node.js**: Version 20 or higher.
- **npm**: Version 10 or higher.
- **Docker & Docker Compose**: For running local infrastructure (Postgres, Redis).
- **Git**: For version control.
- **Rust Toolchain**: Required for smart contract development (`rustup target add wasm32-unknown-unknown`).
- **Soroban CLI**: For deploying and interacting with smart contracts.

Optional for specific integrations:

- **Bun**: For running the ElizaOS agent.
- **ElizaOS CLI**: For interacting with the risk analysis agent.

### 2.2. Initial Setup

1. **Clone the repository**:

    ```bash
    git clone https://github.com/Jistriane/Stellaro.git
    cd Stellaro
    ```

2. **Install dependencies**:

    ```bash
    npm install
    ```

3. **Configure environment variables**:

    Copy the example file and customize it for your local environment.

    ```bash
    cp .env-example .env-dev
    ```

    Edit `.env-dev` with the necessary values. See the **Environment Variables** section for details.

4. **Start local infrastructure**:

    This command starts the Postgres and Redis containers in the background.

    ```bash
    docker compose -f infra/docker-compose.dev.yml up -d
    ```

5. **Run database migrations**:

    This generates the Prisma client and applies any pending database migrations.

    ```bash
    npm run prisma:generate -w apps/backend
    npm run prisma:migrate -w apps/backend
    ```

### 2.3. Running the Application

Start all applications in development mode:

```bash
npm run dev
```

- **Frontend**: Accessible at `http://localhost:3000` (or 3002 if port 3000 is busy)
- **Backend**: Accessible at `http://localhost:3001` (port can be changed via `PORT` in `.env-dev`)

## 3. Environment Variables

Key variables to configure in `.env-dev`:

- **API**: `PORT`, `NODE_ENV`, `CORS_ORIGINS`, `JWT_SECRET`, `SESSION_TTL`
- **Database & Cache**: `DATABASE_URL`, `REDIS_URL`
- **Stellar/Soroban**: `STELLAR_NETWORK`, `SOROBAN_RPC_URL`, `HORIZON_URL`
- **Third-Party Services**:
  - `CELCOIN_CLIENT_ID`, `CELCOIN_CLIENT_SECRET`
  - `DOCK_API_KEY`, `DOCK_WEBHOOK_SECRET`
  - `SUMSUB_APP_TOKEN`, `SUMSUB_SECRET_KEY`
- **Observability**: `OTEL_EXPORTER_OTLP_ENDPOINT`, `SENTRY_DSN`
- **Security**: `ADMIN_TOKEN`, `ELIZA_WEBHOOK_SECRET`, `WEBHOOK_HMAC_SECRET`

## 4. Soroban Smart Contracts

The `contracts/` directory contains all Soroban smart contracts. The `infra/deploy_soroban.sh` script automates the build, deployment, and initialization process.

### 4.1. Deployment

1. **Import your deployer key** into the Soroban CLI:

    ```bash
    soroban keys add stellaro-testnet-deploy --secret-key # Paste your secret key
    ```

2. **Run the deployment script**:

    The script compiles, deploys, and initializes all contracts. It's idempotent and safe to re-run.

    ```bash
    # Quick deployment to testnet
    ./deploy-testnet.sh
    
    # Or use the generic script
    ./infra/deploy_soroban.sh deploy
    ```

    After execution, it will update `.env-testnet` (or `.env-dev`) with the new contract IDs.

### Current Testnet Deployment (April 15, 2026)

| Contract | Contract ID |
|----------|-------------|
| **Stablecoin** | `CCX2C7SN3RXKAVTFTNBQ5MCWLY2WEGXWGRKVFKJ427HN745CHXNRRBVG` |
| **RiskLock** | `CAMEHWI55A4CJ5UE7YN5V7NPP4ZPVMOE6ZSIF5JQKQXVJHLENMB464VO` |
| **LoansPool** | `CAXAKWLYXOHZBUEKHGSOILJR3CU5ICEREZTA3LYYFIJPK3ZQQLCZEYW7` |
| **Portfolio** | `CC6NTQNQ6CM42F2DB44CYZE24O7IJ7VNMSEHVKPX57NVCV46MEIGKUNB` |
| **Governance** | `CCUHIZXPRMZQJ2E2YY6BBRP3YSXBGX4HDHZDVVMF2XM3WZIDOYGM47MP` |
| **ZK Verifier** | `CDOPZBPMQM24GYMKTGLC2EEY3QOQNNFO3BJ6JTBGW2T5UMJCKFQ5PSVY` |
| **Batch Executor** | `CAHWOMBTMVUWGMRWSJY2TPCBMPO3A3LODCBE6MFXMA6XR4ALZZCGTN7I` |
| **MEV Guard** | `CDHQZQ5YMNVAPKXJ6LVBDSJC4QVZL4UD2TIKSTDYGATMBTWEV7ZSOG3M` |

### 4.2. Stablecoins (STLT-BRL, STLT-USD)

- **Decimals**: 7 decimals on-chain, displayed with 2 decimals in the UI.
- **Fees**: Mint (0%), Burn (0%), Transfer (0.1%). Fees are adjustable via governance.
- **Real Integration**: The frontend now integrates with real Soroban contracts, replacing mock data with live blockchain interactions.
- **Wallet Connection**: Users can connect their Stellar wallets (Freighter, etc.) to interact directly with smart contracts.

## 5. Backend API & Security

The backend exposes a RESTful API with a strong focus on security.

### 5.1. Key Endpoints

Base URL: `http://localhost:3001`

- **Passkey (WebAuthn) Authentication**:
  - `POST /passkey/register/init` & `.../verify`
  - `POST /passkey/login/init` & `.../verify`
  - `POST /passkey/tx/init` & `.../verify` (for transaction signing)

- **MFA (Stellar Fallback)**:
  - `POST /passkey/mfa/init` & `.../verify`
  - `GET /passkey/mfa/status?userId=<id>`

- **Governance (MFA-Protected)**:
  - `POST /governance/execute`

- **Security Admin** (Requires `x-admin-token` header):
  - `POST /security/block-user`
  - `POST /security/unblock-user`
  - `POST /security/revoke-sessions`

- **Risk Webhook** (Requires `x-eliza-secret` header):
  - `POST /security/risk/alert`

### 5.2. Security Features

- **Authentication**: Passwordless login using FIDO2 Passkeys (WebAuthn).
- **Sessions**: Opaque session tokens stored in Redis with a TTL. Sessions can be revoked per user.
- **MFA**: A fallback Multi-Factor Authentication mechanism using a Stellar wallet signature. A successful MFA grants a short-lived (~15 min) recency window for critical operations.
- **Authorization**: Role-based access control with dedicated guards for admin endpoints (`AdminGuard`), critical operations (`MfaGuard`), and incoming webhooks (`ElizaGuard`).
- **HSM**: A stubbed `HsmService` is in place for future integration with a Hardware Security Module for signing critical operations.

## 6. Integrations

### 6.1. ElizaOS

ElizaOS is an AI agent used for real-time risk analysis.

- **Configuration**: `tools/eliza/config.json`.
- **Commands**:
  - `npm run eliza:agent:start`: Starts the agent.
  - `npm run eliza:agent:chat`: Opens a chat interface with the agent.
- The backend receives risk alerts from ElizaOS via the `/security/risk/alert` webhook to automate responses like blocking a user or revoking sessions.

### 6.2. Other Services

The platform integrates with:

- **Celcoin**: For PIX and other payment services.
- **Dock**: For card issuing and processing.
- **Sumsub**: For KYC (Know Your Customer) processes.

Secure communication with these services is ensured via HMAC webhook verification.

## 7. Recent Updates and Improvements

### 7.1. Frontend Enhancements

- **Real Soroban Integration**: Replaced mock data with live blockchain interactions
- **Wallet Integration**: Full support for Stellar wallet connections (Freighter, etc.)
- **Dynamic Contract Calls**: Real-time data fetching from deployed smart contracts
- **Improved UI/UX**: Updated branding and logo integration

### 7.2. Smart Contract Integration

- **Contract IDs**: Environment variables for all deployed contract addresses
- **Real-time Data**: Live balance and transaction data from the blockchain
- **Transaction Signing**: Direct wallet integration for contract interactions

### 7.3. Development Experience

- **Build Optimization**: Fixed Tailwind CSS configuration and PostCSS setup
- **Type Safety**: Improved TypeScript definitions and error handling
- **Environment Configuration**: Updated example files and development setup

## 8. Troubleshooting

- **Redis Connection Failure**: The backend will log a warning and fall back to an in-memory session store (not suitable for production). Ensure `REDIS_URL` is correctly set.
- **MFA Failure**: Check for `nonce` expiration or issues with the Stellar signature.
- **403 Forbidden on Admin/Webhook**: Verify that the `x-admin-token` or `x-eliza-secret` headers are correct.
- **Contract Integration Issues**: Ensure all contract IDs are properly set in environment variables.
- **Wallet Connection Problems**: Verify that the Freighter extension is installed and accessible.

## 9. Glossary

- **Passkey/WebAuthn**: A standard for passwordless authentication using public-key cryptography.
- **MFA Recency**: A short time window after a successful MFA check during which a user can perform critical actions without re-authenticating.
- **ElizaOS**: An external agent that monitors user activity and emits risk alerts.
- **HSM**: Hardware Security Module, a physical device for securely managing digital keys.

## 10. On-Chain Endpoints & Env

### Endpoints

- `GET /oracles/price?asset=<code>&issuer=<account>` — aggregated price (Reflector + DEX fallback)
- `GET /defi/blend/positions/:address` — positions enriched by Horizon balances and oracle price; includes:
  - `poolId` from `LOANS_POOL_CONTRACT_ID`
  - `apy` from `LOANSPOOL_INTEREST_BPS` (bps to %)
  - Redis cache: 15s
- `GET /memory/history/:address?cursor=<id>` — Horizon operations history with cursor pagination

### Environment Variables (backend)

- `HORIZON_URL`, `SOROBAN_RPC_URL`
- `BACKEND_URL` and/or `BACKEND_PUBLIC_URL`
- `LOANS_POOL_CONTRACT_ID` (used to set `poolId`)
- `LOANSPOOL_INTEREST_BPS` (used to compute `apy`)
- `PORTFOLIO_CONTRACT_ID` (optional)

### Quick Checks

```bash
curl "http://localhost:3001/chain/health"
curl "http://localhost:3001/oracles/price?asset=USDC&issuer=GD..."
curl "http://localhost:3001/defi/blend/positions/GD..."
curl "http://localhost:3001/memory/history/GD...?cursor=now"
```

## 7. Mobile App Development

The Stellaro mobile app is built with **React Native (Expo)** and is located in `apps/mobile`.

### 7.1. Setup
```bash
cd apps/mobile
npm install
npx expo start
```

### 7.2. Key Features
- **Stellar Wallet**: Integrated `stellar-sdk` for account management.
- **Biometric Auth**: Native support for FaceID/TouchID via WebAuthn/Passkey integration.
- **Modern UI**: Dark-themed premium dashboard for RWA and DeFi tracking.

## 8. Mainnet Deployment (Production)

Stellaro is prepared for Mainnet deployment using the configurations in `infra/mainnet/`.

### 8.1. Prerequisites
- Real Stellar accounts (Admin, Issuer, Bridge, etc.).
- External Managed Database (PostgreSQL) and Redis.
- SSL Certificates (Let's Encrypt / AWS ACM).

### 8.2. Deployment
1. Update `apps/backend/.env.mainnet` with real Contract IDs and Secrets.
2. Deploy the infrastructure:
   ```bash
   cd infra/mainnet
   docker-compose -f docker-compose.prod.yml up -d
   ```
3. Monitor performance using the `tools/stress_test_production.ts` script.

---
*Manual updated for v5.6 — Mainnet Ready (April 2026).*
