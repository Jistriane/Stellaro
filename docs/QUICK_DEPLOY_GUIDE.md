# QUICK DEPLOY GUIDE - STELLARO (Production Deployment)

**Last Updated**: December 9, 2025  
**Purpose**: Fast mainnet deployment with minimal steps  
**Estimated Time**: 30-45 minutes  
**Target**: Production launch on Stellar mainnet  

---

## EXPRESS DEPLOYMENT (5 STEPS)

### Step 1: Prepare Environment (5 minutes)

```bash
# Clone/update repository
cd /home/jistriane/Documentos/Stellaro
git pull origin master

# Set mainnet environment
export STELLAR_NETWORK="public"
export NODE_ENV="production"

# Verify XLM funding (must have 15+ XLM)
export STELLAR_SECRET_KEY="SB..." # Your mainnet account secret key
npm run scripts -- check-balance

# Expected output: Balance: 15.0000000 XLM ✓
```

### Step 2: Deploy Smart Contracts (10 minutes)

```bash
# Build contracts
cd contracts
cargo build --release

# Deploy all contracts to mainnet
./deploy-contracts.sh --network mainnet

# Expected output:
# Deploying to Stellar Mainnet...
# Stablecoin deployed: CA...
# Loans Pool deployed: CC...
# RiskLock deployed: CA...
# Portfolio deployed: CA...
# Governance deployed: CC...
# ZK Verifier deployed: CB...
# Total cost: ~9 XLM
```

### Step 3: Deploy Backend (10 minutes)

```bash
# Build and push Docker image
docker build -f apps/backend/Dockerfile -t stellaro-backend:latest .
docker push stellaro-backend:latest  # if using registry

# Deploy backend
export DATABASE_URL="postgresql://user:pass@db-host:5432/stellaro"
export REDIS_URL="redis://redis-host:6379"
npm run migrate:prod  # Apply database migrations

# Start backend service
docker-compose up -d backend

# Verify health
curl http://localhost:3001/health

# Expected: {"status":"healthy","timestamp":"..."}
```

### Step 4: Deploy Frontend (5 minutes)

```bash
# Update contract addresses in .env.production
export NEXT_PUBLIC_STABLECOIN_MAINNET="CA..."
export NEXT_PUBLIC_LOANS_POOL_MAINNET="CC..."
# ... other contract IDs

# Build and deploy frontend
cd apps/frontend
npm run build
npm run deploy:prod  # or vercel deploy --prod

# Verify site is accessible
curl https://stellaro.io/

# Expected: HTML page loads successfully
```

### Step 5: Verify & Launch (5 minutes)

```bash
# Run E2E tests on mainnet
npm run test:e2e -- --testNamePattern="mainnet"

# Expected: 46/46 tests passing ✓

# Check monitoring
# Visit Grafana: http://localhost:3000
# Check all dashboards showing green ✓

# Launch complete!
echo " Stellaro Live on Mainnet!"
```

---

## DEPLOYMENT CHECKLIST

Before running any command, verify:

- [ ] 15 XLM available in deployment account
- [ ] Git repository is up to date
- [ ] Environment variables configured (.env-mainnet)
- [ ] Database ready and migrations applied
- [ ] Redis cluster accessible
- [ ] All tests passing locally
- [ ] Monitoring dashboards prepared
- [ ] Team notified and ready
- [ ] Incident response team on standby

---

## DETAILED COMMAND REFERENCE

### Contract Deployment

```bash
# Deploy single contract
npm run deploy:contract -- --name stablecoin --network mainnet

# Deploy all contracts
npm run deploy:all -- --network mainnet

# Verify deployment
npm run verify:contracts -- --network mainnet

# Get contract details
npm run info:contract -- --id CA755Z32G3AXTIXC66AOZV3BG6TDCOFB67RSB2ICA
```

### Backend Deployment

```bash
# Build production image
docker build -f apps/backend/Dockerfile \
  --build-arg NODE_ENV=production \
  -t stellaro-backend:v1.0.0 \
  apps/backend

# Start with Docker Compose
docker-compose -f docker-compose.prod.yml up -d

# Start with Kubernetes
kubectl apply -f infra/k8s/backend-deployment.yaml

# Check logs
docker logs stellaro-backend -f
kubectl logs deployment/stellaro-backend -f

# Scale service
kubectl scale deployment stellaro-backend --replicas=3
```

### Frontend Deployment

```bash
# Build static site
cd apps/frontend
npm run build

# Deploy to Vercel
vercel deploy --prod

# Deploy to AWS S3 + CloudFront
aws s3 sync out/ s3://stellaro-prod/
aws cloudfront create-invalidation --distribution-id E... --paths "/*"

# Deploy with Docker
docker build -f apps/frontend/Dockerfile -t stellaro-frontend:latest .
kubectl apply -f infra/k8s/frontend-deployment.yaml
```

### Database Operations

```bash
# Apply migrations
npm run prisma migrate deploy

# Seed initial data
npm run prisma db seed

# Create backup
pg_dump stellaro_db > backup-$(date +%Y%m%d).sql

# Restore from backup
psql stellaro_db < backup-20251209.sql
```

### Monitoring & Health Checks

```bash
# API health
curl http://localhost:3001/health

# Database connection
npm run db:test

# Redis connection
redis-cli ping

# Blockchain connection
npm run stellar:test

# Full system health
npm run health:full
```

---

## ROLLBACK PROCEDURE (If Needed)

```bash
# Stop current deployment
docker-compose down
kubectl delete deployment stellaro-backend stellaro-frontend

# Restore previous version
docker pull stellaro-backend:v0.9.0
docker-compose up -d

# Restore database from backup
psql stellaro_db < backup-$(date -d "1 day ago" +%Y%m%d).sql

# Verify rollback
curl http://localhost:3001/health

# Expected: Service responding normally on previous version
```

---

## VERIFICATION STEPS

After deployment, verify:

```bash
# 1. API responding
curl -I http://api.stellaro.io/health
# Expected: HTTP 200

# 2. Frontend loading
curl -I https://stellaro.io/
# Expected: HTTP 200

# 3. Database connected
npm run db:test
# Expected: Connection successful ✓

# 4. Contracts functional
npm run test:contracts -- --network mainnet
# Expected: All tests passing ✓

# 5. Monitoring active
curl http://localhost:9090/-/healthy
# Expected: 200 OK

# 6. No errors in logs
docker logs stellaro-backend | grep ERROR
# Expected: No ERROR messages
```

---

## CONFIGURATION TEMPLATES

### .env-mainnet

```bash
# Network
STELLAR_NETWORK="public"
STELLAR_RPC_URL="https://soroban-mainnet.stellar.org"
STELLAR_HORIZON_URL="https://horizon.stellar.org"

# Account
STELLAR_MAINNET_SECRET_KEY="SB..." # Keep secure!
STELLAR_ADMIN_EMAIL="admin@stellaro.io"

# Database
DATABASE_URL="postgresql://user:pass@db.host:5432/stellaro"
DATABASE_SSL="require"

# Redis
REDIS_URL="redis://redis.host:6379/0"
REDIS_PASSWORD="secure_password"

# API Keys
JWT_SECRET="$(openssl rand -hex 32)"
SESSION_SECRET="$(openssl rand -hex 32)"

# Services
BACKEND_URL="https://api.stellaro.io"
FRONTEND_URL="https://stellaro.io"

# Features
MAINTENANCE_MODE="false"
ENABLE_REAL_PIX="false"  # Set to true when ready
ENABLE_REAL_KYC="false"  # Set to true when ready
```

### docker-compose.prod.yml

```yaml
version: '3.8'

services:
  backend:
    image: stellaro-backend:v1.0.0
    environment:
      NODE_ENV: production
      DATABASE_URL: ${DATABASE_URL}
      REDIS_URL: ${REDIS_URL}
    ports:
      - "3001:3001"
    depends_on:
      - postgres
      - redis
    restart: always

  frontend:
    image: stellaro-frontend:v1.0.0
    ports:
      - "3000:3000"
    restart: always

  postgres:
    image: postgres:15
    environment:
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: stellaro
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: always

  redis:
    image: redis:7
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    restart: always

  prometheus:
    image: prom/prometheus
    volumes:
      - ./infra/monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
    ports:
      - "9090:9090"
    restart: always

  grafana:
    image: grafana/grafana
    environment:
      GF_SECURITY_ADMIN_PASSWORD: admin
    ports:
      - "3000:3000"
    restart: always

volumes:
  postgres_data:
  redis_data:
```

---

## COMMON DEPLOYMENT SCENARIOS

### Scenario 1: Fresh Mainnet Deployment

```bash
# Step 1: Prepare
export STELLAR_SECRET_KEY="SB..."
npm run scripts -- check-balance  # Verify 15+ XLM

# Step 2: Deploy contracts
./contracts/deploy-contracts.sh --network mainnet

# Step 3: Deploy services
docker-compose -f docker-compose.prod.yml up -d

# Step 4: Run migrations
npm run prisma migrate deploy

# Step 5: Verify
npm run health:full
```

### Scenario 2: Update Existing Deployment

```bash
# Build new version
npm run build:prod

# Stop current services
docker-compose stop

# Start updated services
docker-compose up -d

# Run migrations if needed
npm run prisma migrate deploy

# Verify update
npm run health:full
```

### Scenario 3: Emergency Hotfix

```bash
# Create hotfix branch
git checkout -b hotfix/issue-name

# Make necessary changes
# Test locally
npm run test:full

# Build and deploy
docker build -t stellaro-backend:hotfix-1 .
docker-compose up -d

# Verify fix
npm run health:full

# Merge back to master
git merge hotfix/issue-name
```

---

## SUPPORT & TROUBLESHOOTING

### Service Won't Start

```bash
# Check logs
docker logs stellaro-backend

# Check ports in use
lsof -i :3001
lsof -i :3000

# Kill conflicting process
kill -9 <PID>

# Restart service
docker-compose restart backend
```

### Database Connection Error

```bash
# Test connection
psql -h db.host -U user -d stellaro -c "SELECT 1"

# Check credentials
cat .env-mainnet | grep DATABASE_URL

# Verify firewall
telnet db.host 5432

# Restart database
docker-compose restart postgres
```

### API Returning Errors

```bash
# Check application logs
docker logs stellaro-backend | tail -100

# Check database health
npm run db:test

# Check Redis connection
redis-cli -h redis.host ping

# Restart API
docker-compose restart backend
```

### Contract Calls Failing

```bash
# Check contract IDs
echo $NEXT_PUBLIC_STABLECOIN_MAINNET

# Verify contract on mainnet
npm run info:contract -- --id CA...

# Test contract call
npm run test:contract -- --id CA... --method mint

# Check RPC connection
curl https://soroban-mainnet.stellar.org -X POST -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"getNetwork","params":[]}'
```

---

## SECURITY CHECKLIST

Before going live:

- [ ] Secret keys stored in secure vault (AWS Secrets Manager, 1Password)
- [ ] Environment variables not in version control
- [ ] SSL/TLS certificates active
- [ ] CORS policies configured
- [ ] Rate limiting enabled
- [ ] Database backups automated
- [ ] Monitoring alerts configured
- [ ] Incident response team briefed
- [ ] Rollback procedure tested

---

## POST-DEPLOYMENT MONITORING

```bash
# Monitor logs in real-time
docker logs -f stellaro-backend

# Check resource usage
docker stats

# View metrics
curl http://localhost:9090/api/v1/query?query=up

# Access Grafana dashboards
# Visit: http://localhost:3000
# Default login: admin/admin

# Set up alerts (in Grafana)
# Alert: CPU > 80%
# Alert: Memory > 85%
# Alert: Error rate > 1%
# Alert: API latency > 500ms
```

---

## DEPLOYMENT COMPLETE!

Once all steps are complete:

1.  Monitor for first 24 hours
2.  Gather user feedback
3.  Review metrics and logs
4.  Enable real integrations if all good
5.  Begin marketing campaign

**Contact**: Refer to ACTION_GUIDE_NEXT_STEPS.md for detailed post-deployment plan.

---

**Guide Created**: December 9, 2025  
**Version**: 1.0.0  
**Language**: English  
**Status**: Ready for Production
