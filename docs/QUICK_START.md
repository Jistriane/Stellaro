# Stellaro - Quick Start Guide

## 🚀 Week 1 Implementation - Infrastructure & Core Services

Este guia cobre a implementação das melhorias críticas identificadas na análise de gaps.

---

## 📋 Pré-requisitos

### Development Environment

```bash
# Node.js 20+
node --version  # v20.x.x

# Rust + Stellar CLI
rustup --version
cargo install --locked stellar-cli --features opt
stellar --version  # 23.0.0+

# Docker & Docker Compose
docker --version
docker-compose --version

# PostgreSQL 15+ (local development)
psql --version  # 15.x
```

### Accounts & API Keys

1. **Stellar Account**
   - Testnet: <https://laboratory.stellar.org/#account-creator>
   - Mainnet: Use hardware wallet ou multisig

2. **Reflector Network**
   - Sign up: <https://reflector.network>
   - Get API key (free tier available)

3. **Onfido (KYC)**
   - Sign up: <https://onfido.com>
   - Sandbox API key

4. **AWS Account** (for production)
   - sa-east-1 region enabled
   - EKS cluster access

---

## 🔧 Setup Local Development

### 1. Clone & Install

```bash
git clone https://github.com/Jistriane/Stellaro.git
cd Stellaro

# Install dependencies
npm install

# Backend setup
cd apps/backend
npm install
cp .env.example .env
```

### 2. Configure Environment

Edit `apps/backend/.env`:

```bash
# Database (use Docker PostgreSQL)
DATABASE_URL=postgresql://stellar:dev@localhost:5432/stellaro_dev

# Stellar Testnet
STELLAR_NETWORK=testnet
STELLAR_HORIZON=https://horizon-testnet.stellar.org
STELLAR_PUBLIC_KEY=<your-testnet-public-key>
STELLAR_SECRET_KEY=<your-testnet-secret-key>

# Reflector Oracle
REFLECTOR_URL=https://api.reflector.network
REFLECTOR_API_KEY=<your-api-key>

# Feature flags (enable all for testing)
ENABLE_PASSKEY=true
ENABLE_ZK_CREDIT=true
ENABLE_PIX=false
```

### 3. Start Database

```bash
# PostgreSQL via Docker
docker run --name stellaro-postgres \
  -e POSTGRES_USER=stellar \
  -e POSTGRES_PASSWORD=dev \
  -e POSTGRES_DB=stellaro_dev \
  -p 5432:5432 \
  -d postgres:15-alpine

# Redis Cache
docker run --name stellaro-redis \
  -p 6379:6379 \
  -d redis:7-alpine
```

### 4. Run Migrations

```bash
cd apps/backend
npx prisma migrate dev --name init
npx prisma generate
```

### 5. Build & Deploy Contracts

```bash
# Build Soroban contracts
cd contracts
stellar contract build

# Deploy to testnet
cd ..
      # Build WASM (wasm32v1-none)
      soroban contract build --profile release

      # Fund testnet account
      curl "https://friendbot.stellar.org/?addr=$STELLAR_PUBLIC_KEY"

      # Deploy all contracts (alias 'deploy')
      ./infra/deploy_soroban.sh deploy

      # Initialize ZK Verifier via SDK (recommended - CLI has BytesN issues)
      # Get your deploy secret key first:
      stellar keys show deploy
      
      # Run initialization script:
      npx tsx tools/zk/init_contract_sdk.ts <SECRET_KEY>
      
      # Alternative: CLI method (may fail with BytesN types)
      # stellar contract invoke \
      #    --id $ZK_VERIFIER_CONTRACT_ID \
      #    --source deploy --network testnet \
      #    -- init GCKZ35K7GMUJBFKBOS2YM7FUHATM5FHHFGH7AVNGC5TXLFGV265G33QX \
      #    0x0101010101010101010101010101010101010101010101010101010101010101 700

# This will generate .env-dev with contract IDs
# ZK Verifier status: ⚠️ Requires manual initialization (run: ./tools/zk/export_vk.sh)
```

### 6. Start Backend

```bash
cd apps/backend
npm run dev

# Server running at http://localhost:3001
```

### 7. Test Oracle Service

```bash
# Get XLM price
curl http://localhost:3001/oracles/price/XLM?quote=USD

# Expected response:
# {
#   "asset": "XLM",
#   "price": 0.12,
#   "quote": "USD",
#   "timestamp": 1234567890,
#   "source": "reflector",
#   "confidence": 95,
#   "cached": false
# }
```

---

## 🧪 Testing

### Unit Tests

```bash
# Backend tests
cd apps/backend
npm run test

# Contract tests
cd contracts
cargo test --all-features
```

### E2E Tests

```bash
# Backend E2E
cd apps/backend
npm run test:e2e

# Frontend E2E (Playwright)
cd apps/frontend
npx playwright install
npx playwright test
```

### Load Testing

```bash
# Install k6
brew install k6  # macOS
# or download from https://k6.io

# Run load test
k6 run tests/load/api-load-test.js
```

---

## 🔐 Security Setup

### 1. Passkey Testing

```bash
# Frontend dev server com HTTPS (required for WebAuthn)
cd apps/frontend
npm run dev

# Access https://localhost:3000
# Chrome DevTools > Application > WebAuthn > Enable virtual authenticator
```

### 2. Session Keys

```bash
# Create session after passkey auth
curl -X POST http://localhost:3001/passkey/session \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-123",
    "credentialId": "credential-abc",
    "config": {
      "duration": 3600,
      "maxAmount": "1000",
      "allowedOperations": ["payment", "swap"]
    }
  }'
```

### 3. Reserve Management

```bash
# Check collateralization
curl http://localhost:3001/compliance/reserves/check

# Expected:
# {
#   "healthy": true,
#   "ratio": 150.5,
#   "snapshot": { ... }
# }

# Generate Proof of Reserves
curl -X POST http://localhost:3001/compliance/reserves/proof
```

---

## 🚢 CI/CD Pipeline

### GitHub Actions Setup

1. Add secrets to repository:

   ```text
   Settings > Secrets and variables > Actions
   
   Required secrets:
   - TESTNET_SECRET_KEY
   - MAINNET_SECRET_KEY (production)
   - AWS_ACCESS_KEY_ID
   - AWS_SECRET_ACCESS_KEY
   - REFLECTOR_API_KEY
   ```

2. Push to trigger pipeline:

   ```bash
   git add .
   git commit -m "feat: implement oracle service"
   git push origin develop  # Deploys to testnet
   ```

3. Monitor workflow:

   ```text
   https://github.com/Jistriane/Stellaro/actions
   ```

---

## 📊 Monitoring

### Grafana Dashboard

```bash
# Start Grafana + Prometheus
docker-compose -f infra/monitoring/docker-compose.yml up -d

# Access dashboard
open http://localhost:3000
# Login: admin / admin
```

### Logs

```bash
# Backend logs (development)
npm run dev | pino-pretty

# Production logs (CloudWatch)
aws logs tail /aws/eks/stellaro-backend --follow
```

---

## 🐛 Troubleshooting

### Common Issues

#### 1. Database connection failed

```bash
# Check PostgreSQL is running
docker ps | grep postgres

# Verify connection
psql postgresql://stellar:dev@localhost:5432/stellaro_dev
```

#### 2. Soroban contract deploy fails

```bash
# Check Stellar CLI version
stellar version  # Should be 23.0.0+

# Verify network connection
curl https://soroban-testnet.stellar.org

# Check account has XLM balance
stellar keys address deploy
stellar account --id <address>
```

#### 3. Reflector Oracle timeout

```bash
# Test direct connection
curl https://api.reflector.network/api/prices/XLM/USD

# Check firewall/proxy settings
```

#### 4. Passkey registration fails

```bash
# Ensure HTTPS (required for WebAuthn)
# Use: https://localhost:3000 NOT http://

# Check browser support
# Chrome/Edge 67+, Firefox 60+, Safari 13+
```

---

## 📚 Next Steps

### Week 2 - Smart Contracts Security

1. Implement reentrancy guards
2. Add ZK credit score stub
3. Security audit (internal)
4. Deploy to testnet

### Week 3-4 - ElizaOS + ZK

1. Setup ElizaOS v0.1.22
2. Implement Stellaro (risk) character
3. Integrate Groth16 verifier
4. Train ML credit model

### Week 5-6 - PIX Integration

1. Sign PJBank/Asaas contract
2. Implement PixStellarBridge
3. Test atomic mint/burn
4. KYC compliance integration

---

## 🔗 Useful Links

- **Stellar Docs**: <https://developers.stellar.org>
- **Soroban Docs**: <https://soroban.stellar.org>
- **Reflector Network**: <https://docs.reflector.network>
- **ElizaOS**: <https://github.com/elizaos/eliza>
- **Passkey Kit**: <https://github.com/kalepail/passkey-kit>

---

## 💬 Support

- GitHub Issues: <https://github.com/Jistriane/Stellaro/issues>
- Discord: [Stellar Developers](<https://discord.gg/stellardev>)

---

## 📄 License

UNLICENSED - Proprietary

---

**Status**: ✅ Week 1 Implementation Ready

**Confiança Atual**: 68% (subiu de 55%)

- ✅ Infrastructure setup completo
- ✅ Oracle service implementado
- ✅ Passkey session keys
- ✅ Reserve management
- ✅ CI/CD pipeline
- ⏳ Aguardando deploy e testes práticos para 90%+
