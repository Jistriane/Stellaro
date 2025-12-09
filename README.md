# Stellaro DeFi Credit Infrastructure on Stellar

![Stellaro Logo](Logo.png)

## DeFi Credit Infrastructure on Stellar

Welcome to the Stellaro project! This monorepo contains the complete architecture for a DeFi credit infrastructure platform built on Stellar, featuring a Next.js 15 frontend, NestJS backend, AI-powered risk management (ElizaOS), and enterprise-grade integrations for Stellar/Soroban, PIX, Cards, KYC, and Passkeys.

## 🎨 Interface Screenshots

Login / Authentication:

![Login](./Login%20Stellaro.png)

Home / Dashboard:

![Home](./Home%20Stellaro.png)

## 🎯 Architecture v3.0 Highlights

- **🤖 AI Risk Guardian** - ElizaOS-powered risk assessment with ZK-proof credit scoring
- **⚡ Sub-second Oracles** - Reflector Network integration (<500ms latency)
- **🔐 Passkey Sessions** - Biometric authentication with session keys for batch operations
- **💰 120% Collateralization** - Automated reserve monitoring with emergency freeze
- **🏗️ Production-Ready Infrastructure** - AWS EKS, PostgreSQL Multi-AZ, Redis cluster
- **📊 Progressive Decentralization** - Multisig 3/5 → DAO governance roadmap

## Features

### Core Features

- 🏬 **DeFi Credit Infrastructure** - Complete lending and borrowing platform with AI-powered risk assessment
- 💳 **Stablecoin STLT-BRL** - Brazilian Real-pegged stablecoin with 120%+ collateralization
- 🏛️ **Governance System** - Progressive decentralization (Multisig → DAO)
- 🔐 **Wallet Integration** - Freighter, Ledger, Albedo support
- 📱 **PIX Integration** - Instant BRL mint/burn via Stellar Anchors
- 🎯 **KYC/AML Compliance** - Multi-tier (0/1/2) via Onfido + Chainalysis
- 🔒 **Security Features** - Passkey authentication, session keys, reserve monitoring
- 🤖 **AI Risk Agent** - ElizaOS Stellaro (risk) with ZK credit scoring (Groth16)
- ⚡ **Sub-500ms Oracles** - Reflector Network + Stellar DEX fallback

### Observability & Operations

- 📈 **Prometheus**: Backend metrics scraping (`/metrics`), Horizon and Soroban RPC
- 📊 **Grafana**: Automatically provisioned dashboards (Overview and DeFi)
- 🚨 **Alerts**: Rules for availability, 5xx errors, p95 latency, DB/Redis pool, contracts and ZK proofs

Quick setup (docker):

```bash
# Prometheus (uses config from infra/prometheus/prometheus.yml)
docker run -d --name stellaro-prometheus \
  -p 9090:9090 \
  -v $(pwd)/infra/prometheus/prometheus.yml:/etc/prometheus/prometheus.yml \
  prom/prometheus:v2.53.0

# Grafana (provisions datasources and dashboards from repository)
docker run -d --name stellaro-grafana \
  -p 3000:3000 \
  -v $(pwd)/infra/grafana/datasources:/etc/grafana/provisioning/datasources \
  -v $(pwd)/infra/grafana/dashboards:/etc/grafana/provisioning/dashboards \
  grafana/grafana:10.4.0
```

Provisioned dashboards:

- `Stellaro - System Overview`: HTTP traffic, p95 latency, 5xx errors, health, contract executions, ZK verifications
- `Stellaro - DeFi Metrics`: TVL, active loans, utilization, default rate, APY, credit score distribution

### On-Chain Backend Endpoints

- `GET /oracles/price?asset=<code>&issuer=<account>`: Real-time aggregated price (Reflector + DEX fallback)
- `GET /defi/blend/positions/:address`: DeFi positions enriched with Horizon balance + oracle price, including:
  - `poolId`: from `LOANS_POOL_CONTRACT_ID`
  - `apy`: dynamically read via LoansPool `params()` (env fallback: `LOANSPOOL_INTEREST_BPS` in bps → %)
  - Redis cache: 15s (avoids overload)
  - Params cache: 5min in-memory
- `GET /memory/history/:address?cursor=<id>`: Address operation history via Horizon with cursor pagination

### Compliance & Reserve Management

- `GET /compliance/reserves/check`: Check current collateralization (120% minimum)
- `POST /compliance/reserves/proof`: Generate on-chain Proof of Reserves
- `GET /compliance/reserves/snapshot`: Detailed reserves snapshot
- Full Soroban integration:
  - Reading `total_supply` from Stablecoin contract
  - Automatic minting freeze via `set_mint_enabled(false)` in case of undercollateralization
- Multi-channel notification system (webhook, email, console)

### WebAuthn Authentication (Passkey)

- `POST /auth/passkey/register/init`: Initialize passkey registration
- `POST /auth/passkey/register/verify`: Verify attestation and complete registration
- `POST /auth/passkey/login/init`: Initialize passkey login
- `POST /auth/passkey/login/verify`: Verify assertion and issue tokens
- `POST /auth/webauthn/attestation`: Direct attestation verification
- `POST /auth/webauthn/assertion`: Direct assertion verification
- Production-ready PasskeyService integration (Redis-backed)
- MFA and transaction signing support

### PIX Payments

- `POST /payments/pix/charge`: Generate PIX charge for STLT mint (1 BRL = 1 STLT)
- `POST /payments/pix/webhook`: Payment confirmation webhook (HMAC-signed)
- `POST /payments/pix/withdrawal`: Initiate PIX withdrawal after STLT burn
- `GET /payments/pix/status/:txId`: Query payment status
- Provider integration (PJBank, Asaas, etc.) via webhook
- Automatic mint/burn via ActionsService after PIX confirmation
- Idempotent system to prevent double-mint

### ElizaOS Agents (AI)

- 3 agents: Risk Analyzer, Compliance Bot, Treasury Manager
- 4 actions: risk analysis, compliance check, yield optimization, auto-compound
- Telegram/Discord support via orchestrator runtime

Quick start (dev):

```bash
cd tools/eliza
# Initialize local project (if package.json doesn't exist)
npm init -y
npm install typescript ts-node dotenv @anthropic-ai/sdk

# Compile TS (optional)
npx tsc --init

# Run runtime
npx ts-node src/index.ts
```

Configuration: see `tools/eliza/README.md` and `.env.example`.

Quick tests:

```bash
curl "http://localhost:3001/oracles/price?asset=USDC&issuer=GD..."
curl "http://localhost:3001/defi/blend/positions/GD..."
curl "http://localhost:3001/memory/history/GD...?cursor=now"
curl "http://localhost:3001/compliance/reserves/check"
curl -X POST "http://localhost:3001/payments/pix/charge" \
  -H "Authorization: Bearer <JWT>" \
  -H "Content-Type: application/json" \
  -d '{"amountBRL":"100.00","stellarAddress":"GD...","cpf":"12345678900","name":"User Test"}'
```

### Tech Stack v3.0

- **Frontend**: Next.js 14, React 19, TypeScript, Tailwind CSS, Zustand, next-intl
- **Backend**: NestJS 11, Prisma (PostgreSQL), Redis Cluster, Swagger/OpenAPI
- **Blockchain**: Stellar, Soroban Smart Contracts (Rust)
- **AI/ML**: ElizaOS (Anthropic Claude), ZK-Proofs (Groth16)
- **Infrastructure**: AWS EKS (sa-east-1), PostgreSQL Multi-AZ, Redis cluster
- **CI/CD**: GitHub Actions, Turborepo, Docker, Kubernetes
- **Monitoring**: Grafana, Prometheus, Loki, CloudWatch
- **Security**: Passkey Kit, Onfido, Chainalysis, Wazuh SIEM
- **Testing**: Jest (65 test suites, 414+ tests, 57.62% coverage, 100% E2E passing)

## Live Deployments

### Frontend (Testnet)

- **URL**: https://stellaro-frontend-testnet.vercel.app
- **Platform**: Vercel
- **Status**: ✅ Active
- **Last Deployment**: December 9, 2025
- **Deployment URL**: https://stellaro-frontend-testnet-c9oxyqhwh.vercel.app

## Project Structure

- **`apps/frontend`**: Next.js 14 application with modern UI components and wallet integration.
- **`apps/backend`**: NestJS application with Prisma, Redis, and comprehensive API services.
  - Relevant endpoints: `/oracles/price`, `/defi/blend/positions/:address`, `/memory/history/:address`, `/chain/health`
- **`contracts/`**: Soroban smart contracts written in Rust for DeFi operations.
- **`packages/`**: Shared UI components and configurations across the monorepo.
- **`infra/`**: Docker files, deployment scripts, and CI/CD configurations.

## Deployed Smart Contracts

The Stellaro platform includes 6 core smart contracts deployed on Stellar Testnet:

| Contract | Contract ID | Purpose |
|-------------------|-------------|-------------------|
| **Stablecoin** | `CBC4KEL4BTI2XBNMJEZFFGJDUNFHEFDSJDEMZAGHWCVXRPYTHRMXQI2L` | STLT-BRL token management and transfers |
| **RiskLock** | `CAF4ZPHLAZGT4DXQLGX6F7PPE63AP2WWFWEKVPI3LN6UPOKPWSZZAZJS` | Risk management and account locking |
| **LoansPool** | `CCWS62FYOXIVA2YMORZHYDSU2NHJHUNQW4E7ONERHLMLD6RRHPFUQXZD` | Lending and borrowing operations |
| **Portfolio** | `CDSGXZQF4676KX2YCPIPIPRV7L7SE7DFBVKVXHICMJ26ZCO3GIENWXW5` | Asset portfolio management |
| **Governance** | `CCFMF4ZZEU3UMOQVDZNB5CHLZOAXRFPFCZOEVBI6JXZHYWFQLVHOLEJ3` | DAO governance and voting |
| **ZK Verifier** | `CCWZPTZEZZFOELDGVHP7IAO5GNVX6MSITN2G7H3ZBGG57OXPVZYYPAFO` | ZK-proof verification and credit scoring |

### Network Configuration

- **Network**: Stellar Testnet
- **RPC URL**: `https://soroban-testnet.stellar.org`
- **Horizon URL**: `https://horizon-testnet.stellar.org`
- **Admin (Public Key)**: `GCKZ35K7GMUJBFKBOS2YM7FUHATM5FHHFGH7AVNGC5TXLFGV265G33QX`
- **Deploy Date**: December 9, 2025

### Environment Variables (Backend)

- `HORIZON_URL`, `SOROBAN_RPC_URL`
- `BACKEND_URL` and/or `BACKEND_PUBLIC_URL`
- `LOANS_POOL_CONTRACT_ID` (used for `poolId` in positions)
- `LOANSPOOL_INTEREST_BPS` (used for `apy` in positions)
- `PORTFOLIO_CONTRACT_ID` (optional)

### Deploying Contracts

To deploy or update the smart contracts on testnet, use the automated deployment script:

```bash
# Quick deployment to testnet (recommended)
./deploy-testnet.sh

# Or use the generic script
./infra/deploy_soroban.sh deploy

# Deploy with custom parameters
./infra/deploy_soroban.sh deploy <ADMIN_PUBKEY> <RISK_BPS> <LTV_BPS> <INTEREST_BPS>
```

**Prerequisites:**

- `soroban-cli` installed and configured
- Rust target `wasm32v1-none` added
- Stellar account imported with alias
- `.env-dev` configured with CONTRACT_IDs (auto-populated by script)

> Deploy reference: see `TESTNET_DEPLOY.md` and `DEPLOY_SUCCESS.md` for details, IDs and explorer links.

## Documentation

**📚 Comprehensive documentation for v3.0 architecture:**

- **[Quick Start Guide](./docs/QUICK_START_GUIDE.md)** - Week 1 implementation guide
- **[Architecture Decision Records](./docs/ADRs.md)** - Technical decisions and rationale
- **[E2E Testing Infrastructure](./docs/E2E_TESTING.md)** - Complete E2E test guide (9/9 suites, 46 tests)
- **[Testing Summary](./docs/TESTING_SUMMARY.md)** - Executive testing status (63 suites, 270+ tests)
- **[Test Coverage Report](./docs/TEST_COVERAGE_REPORT.md)** - Detailed coverage metrics (35.11%)
- **[Project Completion Report](./docs/PROJECT_COMPLETION_REPORT.md)** - Implementation status and metrics
- **[Manual (EN)](./docs/Manual.md)** - Complete user and developer guide

### Key Features Documentation

| Feature | Status | Documentation |
|---------|--------|---------------|
| Reflector Oracle | ✅ Implemented | `src/oracles/reflector-oracle.service.ts` |
| Passkey Sessions | ✅ Implemented | `src/passkey/passkey-session.service.ts` |
| Reserve Manager | ✅ Implemented | `src/compliance/reserve-manager.service.ts` |
| CI/CD Pipeline | ✅ Implemented | `.github/workflows/ci.yml` |
| Kubernetes Setup | ✅ Implemented | `infra/k8s/` |
| E2E Tests | ✅ Implemented | `apps/backend/test/` (9/9 suites, 46 tests, 100% passing) |
| Unit Tests | ✅ Implemented | `apps/backend/src/**/*.spec.ts` (65 suites, 414+ tests) |
| Test Coverage | ✅ Target Exceeded | 57.62% overall (exceeds 50% target by +7.62%) |
| ZK Credit Score | 🔄 In Progress | Week 3-4 |
| PIX Integration | ✅ Implemented | `src/payments/pix.service.ts` |

## Getting Started

### Prerequisites

- Node.js 20+
- npm 10+
- Docker & Docker Compose
- Rust toolchain (stable)
- Stellar CLI 23.0.0+
- PostgreSQL 15+ (or use Docker)

### Quick Setup

1. **Clone the repository**:

    ```bash
    git clone https://github.com/Jistriane/Stellaro.git
    cd Stellaro
    ```

2. **Install dependencies**:

    ```bash
    npm install
    ```

3. **Start infrastructure**:

    ```bash
    # PostgreSQL + Redis via Docker
    docker run -d --name stellaro-postgres \
      -e POSTGRES_USER=stellar -e POSTGRES_PASSWORD=dev \
      -e POSTGRES_DB=stellaro_dev -p 5432:5432 postgres:15-alpine

    docker run -d --name stellaro-redis -p 6379:6379 redis:7-alpine
    ```

    Observability (optional):

    ```bash
    # Prometheus + Grafana (uses repository provisioning)
    docker run -d --name stellaro-prometheus \
      -p 9090:9090 \
      -v $(pwd)/infra/prometheus/prometheus.yml:/etc/prometheus/prometheus.yml \
      prom/prometheus:v2.53.0

    docker run -d --name stellaro-grafana \
      -p 3000:3000 \
      -v $(pwd)/infra/grafana/datasources:/etc/grafana/provisioning/datasources \
      -v $(pwd)/infra/grafana/dashboards:/etc/grafana/provisioning/dashboards \
      grafana/grafana:10.4.0
    ```

4. **Configure environment**:

    ```bash
    cd apps/backend
    cp .env.example .env
    # Edit .env with your credentials
    ```

    Important fields to adjust:

    - `HORIZON_URL`, `SOROBAN_RPC_URL`
    - `LOANS_POOL_CONTRACT_ID`, `LOANSPOOL_INTEREST_BPS`

5. **Run migrations**:

    ```bash
    npx prisma migrate dev
    npx prisma generate
    ```

6. **Deploy contracts**:

    ```bash
    ./infra/deploy_soroban.sh testnet
    ```

7. **Start development**:

    ```bash
    npm run dev
    ```

#### Endpoint Health Check

```bash
  curl "http://localhost:3001/chain/health"
  curl "http://localhost:3001/oracles/price?asset=STLT&issuer=CD..."
  curl "http://localhost:3001/defi/blend/positions/GD..."
  # Prometheus metrics exposed by backend
  curl "http://localhost:3001/metrics"
  ```

### Access

- **Frontend**: <http://localhost:3000>0>
- **Backend API**: <http://localhost:3001>
- **API Docs**: <http://localhost:3001/api>
- **Grafana** (if running): <http://localhost:3000>

### Project Status

- Detailed progress: [PROJECT_COMPLETION_REPORT.md](./docs/PROJECT_COMPLETION_REPORT.md)
- Task list: [ACTION_GUIDE_NEXT_STEPS.md](./docs/ACTION_GUIDE_NEXT_STEPS.md)

**📖 For detailed setup, see [QUICK_START_GUIDE.md](./docs/QUICK_START_GUIDE.md)**

## Testing

### Test Infrastructure

Stellaro has comprehensive test coverage across all layers:

- **65 test suites** with **414+ tests**
- **57.62% overall code coverage** (exceeds 50% target)
- **100% E2E passing** (9 suites, 46 tests)
- **Zero open handles** (memory leak free)

### Running Tests

```bash
# Run all unit tests
npm run test

# Run unit tests with coverage
npm run test:cov

# Run E2E tests
npm run test:e2e

# Run E2E with open handle detection
npm run test:e2e:detect

# Run E2E with coverage
npm run test:e2e:cov

# Run all tests (unit + E2E)
npm run test:all
```

### Test Documentation

- **[E2E Testing Infrastructure](./docs/E2E_TESTING.md)** - Complete E2E test guide, infrastructure details
- **[Testing Summary](./docs/TESTING_SUMMARY.md)** - Executive summary of testing status
- **[Test Coverage Report](./docs/TEST_COVERAGE_REPORT.md)** - Detailed coverage metrics and analysis

### Test Features

- ✅ **Isolated test environment** with in-memory Prisma, Redis stubs
- ✅ **Mocked external dependencies** (Soroban RPC, ZK proofs, PIX providers)
- ✅ **Global teardown** for clean resource cleanup
- ✅ **Serial execution** for E2E tests to prevent race conditions
- ✅ **Comprehensive guards/services/controllers** test structure

We welcome contributions to the Stellaro project! Please see our contributing guidelines and code of conduct.

### Development

- Fork the repository
- Create a feature branch
- Make your changes
- Submit a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support and questions, please open an issue on GitHub or contact the development team.

---

## Built with ❤️ using Stellar and Soroban
