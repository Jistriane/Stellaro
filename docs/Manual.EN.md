# Stellaro Project Manual (EN)

This document provides a comprehensive guide to the Stellaro monorepo, covering its architecture, setup, development, and key features. It is intended for developers, system administrators, and anyone involved in the project's lifecycle.

## 1. Architecture Overview

Stellaro is a Turborepo monorepo designed for financial services, integrating traditional and blockchain technologies.

- **`apps/frontend`**: A Next.js 14 application using the App Router, i18n (PT-BR default, EN), shadcn/ui, Zustand, and React Query.
- **`apps/backend`**: A NestJS (Node 20) application with Prisma (Postgres), Redis/BullMQ for caching and queues, OpenAPI for API documentation, and OpenTelemetry/Sentry for observability.
- **`contracts/`**: A Rust workspace for Soroban smart contracts, including `stablecoin`, `risklock`, `loans_pool`, `portfolio`, and `governance`.
- **`packages/ui`**: Shared React components for a consistent UI (`Stellato` theme).
- **`packages/config`**: Shared configurations for ESLint, TypeScript, and Prettier.
- **`infra/`**: Infrastructure as Code, including Docker Compose for local development, deployment scripts, and CI/CD manifests.

### Environments and DNS

- **Production**: `app.stelato.com.br` (frontend) and `api.stelato.com.br` (backend)
- **Staging**: `staging.stelato.com.br`
- **Development**: `dev.stelato.com.br`

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

1.  **Clone the repository**:
    ```bash
    git clone <your-repository-url>
    cd Stellaro
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Configure environment variables**:
    Copy the example file and customize it for your local environment.
    ```bash
    cp .env-example .env-dev
    ```
    Edit `.env-dev` with the necessary values. See the **Environment Variables** section for details.

4.  **Start local infrastructure**:
    This command starts the Postgres and Redis containers in the background.
    ```bash
    docker compose -f infra/docker-compose.dev.yml up -d
    ```

5.  **Run database migrations**:
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
- **Frontend**: Accessible at `http://localhost:3000`
- **Backend**: Accessible at `http://localhost:3333` (port can be changed via `PORT` in `.env-dev`)

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

1.  **Import your deployer key** into the Soroban CLI:
    ```bash
    soroban keys add deploy --secret-key # Paste your secret key
    ```

2.  **Run the deployment script**:
    The script compiles, deploys, and initializes all contracts. It's idempotent and safe to re-run.
    ```bash
    ./infra/deploy_soroban.sh deploy
    ```
    After execution, it will update `.env-dev` with the new contract IDs (`STABLECOIN_CONTRACT_ID`, `RISKLOCK_CONTRACT_ID`, etc.).

### 4.2. Stablecoins (STLT-BRL, STLT-USD)

- **Decimals**: 7 decimals on-chain, displayed with 2 decimals in the UI.
- **Fees**: Mint (0%), Burn (0%), Transfer (0.1%). Fees are adjustable via governance.

## 5. Backend API & Security

The backend exposes a RESTful API with a strong focus on security.

### 5.1. Key Endpoints

Base URL: `http://localhost:3333`

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

## 7. Troubleshooting

- **Redis Connection Failure**: The backend will log a warning and fall back to an in-memory session store (not suitable for production). Ensure `REDIS_URL` is correctly set.
- **MFA Failure**: Check for `nonce` expiration or issues with the Stellar signature.
- **403 Forbidden on Admin/Webhook**: Verify that the `x-admin-token` or `x-eliza-secret` headers are correct.

## 8. Glossary

- **Passkey/WebAuthn**: A standard for passwordless authentication using public-key cryptography.
- **MFA Recency**: A short time window after a successful MFA check during which a user can perform critical actions without re-authenticating.
- **ElizaOS**: An external agent that monitors user activity and emits risk alerts.
- **HSM**: Hardware Security Module, a physical device for securely managing digital keys.
