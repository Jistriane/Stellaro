# ACTION GUIDE - NEXT STEPS FOR STELLARO (7-Day Deployment Roadmap)

**Date**: December 9, 2025  
**Target Completion**: December 16, 2025  
**Status**: Ready for Execution  

---

## OVERVIEW

This document provides a **7-day roadmap** to deploy Stellaro from testnet to mainnet and launch the production service. All technical work is complete; this guide covers **operational and launch activities**.

---

## DAILY ACTION PLAN

### DAY 1: Monday, December 9 - Final Preparations

#### Morning (1-2 hours)

**Task 1.1: Verify Testnet Status** 
```bash
# Check all contracts are deployed
./scripts/verify-testnet.sh

# Expected output:
# Stablecoin: CA755Z32G3AXTIXC66AOZV3BG6TDCOFB67RSB2ICA
# Loans Pool: CCKRHSO5Z6WHGCHQAAFYEVPGREZHLFHGVHCXDHG5
# RiskLock: CABBKKD56PZWR4B2DL7DLG6IZ3WQ6FDVT7IFQCQMJ
# Portfolio: CAHM33TVHATN6I7LKHAWTNJDF7WHJR64T746W7PTB
# Governance: CCSUSUH2M65LQGYUJ7IY2HBYYXEMO3CKD7AEJDKB6
# ZK Verifier: CBJTI3QKUJGT4ERWAOMHSTSIQSIXXJKZAHHJDHESB
# All 6+ contracts operational
```

**Task 1.2: Check Configuration Files** 
```bash
# Review and prepare environment files
cat .env-testnet
cat .env-mainnet (verify empty/placeholders)

# Checklist:
# STELLAR_TESTNET_SECRET_KEY present
# PostgreSQL connection string correct
# Redis connection configured
# API keys for integrations ready
# Database migrations applied
```

**Task 1.3: Final Code Verification** 
```bash
# Run comprehensive test suite
npm run test:full

# Expected results:
# 270+ unit tests passing
# 46 E2E tests passing
# 57.62% coverage
# Zero TypeScript errors
# Zero ESLint violations
```

#### Afternoon (2-3 hours)

**Task 1.4: Production Build Verification** 
```bash
# Build production images
docker-compose -f docker-compose.yml build

# Expected output:
# Backend: Compiled successfully (~150MB)
# Frontend: Built successfully (~200MB gzipped)
# Zero build warnings
```

**Task 1.5: Testnet End-to-End Testing** 
```bash
# Run critical flow tests
npm run test:e2e -- --testNamePattern="auth|trading|governance"

# Verify all flows:
# User authentication
# Stablecoin minting
# Lending/borrowing
# Governance voting
# ZK proof verification
```

**Task 1.6: Documentation Finalization** 
- [ ] Review MAINNET_CHECKLIST.md
- [ ] Review QUICK_DEPLOY.md
- [ ] Update deployment contact list
- [ ] Prepare incident response plan

#### Evening (1 hour)

**Task 1.7: Team Briefing**
- [ ] Inform team of deployment timeline
- [ ] Assign roles and responsibilities
- [ ] Review rollback procedures
- [ ] Schedule standby support rotation

---

### DAY 2: Tuesday, December 10 - XLM Acquisition & Funding

#### Morning (1-2 hours)

**Task 2.1: Acquire XLM for Mainnet Deployment** 
```
Required amount: 15 XLM (~$1.80 USD)

Steps:
1. Purchase XLM from exchange (Coinbase, Kraken, etc.)
   └─ Amount: 15 XLM
   └─ Recipient: deployment account
   └─ Network: Stellar Mainnet

2. Create deployment account (if new)
   └─ Generate keypair
   └─ Save secret key to secure location
   └─ Fund with 15 XLM from exchange

3. Verify funding
   └─ Check balance on https://stellar.expert
   └─ Should show ~15 XLM available
```

**Task 2.2: Prepare Deployment Account** 
```bash
# Generate new keypair (if needed)
npm run scripts -- generate-keypair

# Save to secure location:
# .env-mainnet: STELLAR_MAINNET_SECRET_KEY="SB..."

# Verify account on Stellar:
# https://stellar.expert/explorer/mainnet/account/{PUBLIC_KEY}

# Checklist:
# Public key recorded
# Secret key stored securely (1Password, AWS Secrets Manager)
# 15 XLM transferred
# Account active on mainnet
```

**Task 2.3: Update Environment Files** 
```bash
# Create mainnet configuration
cat > .env-mainnet << 'EOF'
# Stellar Mainnet Configuration
STELLAR_NETWORK="public"
STELLAR_RPC_URL="https://soroban-mainnet.stellar.org"
STELLAR_HORIZON_URL="https://horizon.stellar.org"
STELLAR_MAINNET_SECRET_KEY="SB..." # From Task 2.2

# Database Configuration
DATABASE_URL="postgresql://user:pass@prod-db:5432/stellaro"
REDIS_URL="redis://prod-redis:6379/0"

# API Keys
JWT_SECRET="$(openssl rand -hex 32)"
SESSION_SECRET="$(openssl rand -hex 32)"

# Service URLs
BACKEND_URL="https://api.stellaro.io"
FRONTEND_URL="https://stellaro.io"
EOF

# Verify secrets are strong
openssl rand -hex 32
```

#### Afternoon (2-3 hours)

**Task 2.4: Prepare Mainnet Smart Contracts** 
```bash
# List testnet contract IDs for reference
echo "Testnet Contract IDs (for reference):"
cat << 'EOF'
STABLECOIN: CA755Z32G3AXTIXC66AOZV3BG6TDCOFB67RSB2ICA
LOANS_POOL: CCKRHSO5Z6WHGCHQAAFYEVPGREZHLFHGVHCXDHG5
RISKLOCK: CABBKKD56PZWR4B2DL7DLG6IZ3WQ6FDVT7IFQCQMJ
PORTFOLIO: CAHM33TVHATN6I7LKHAWTNJDF7WHJR64T746W7PTB
GOVERNANCE: CCSUSUH2M65LQGYUJ7IY2HBYYXEMO3CKD7AEJDKB6
ZK_VERIFIER: CBJTI3QKUJGT4ERWAOMHSTSIQSIXXJKZAHHJDHESB
EOF

# Mainnet deployment will generate new IDs
# Store them in .env-mainnet after deployment
```

**Task 2.5: Prepare Infrastructure** 
```bash
# Option A: AWS EKS Cluster (Recommended)
aws eks create-cluster --name stellaro-prod \
  --version 1.28 \
  --role-arn arn:aws:iam::ACCOUNT:role/eks-service-role \
  --resources-vpc-config subnetIds=subnet-xxx,subnet-yyy

# Option B: Docker Compose (Simple)
docker-compose -f docker-compose.yml up -d

# Option C: Kubernetes Manifest
kubectl apply -f infra/k8s/namespace.yaml
kubectl apply -f infra/k8s/deployment.yaml
kubectl apply -f infra/k8s/service.yaml
```

#### Evening (1 hour)

**Task 2.6: Final Verification before Deployment** 
- [ ] XLM transferred and confirmed
- [ ] Environment files prepared
- [ ] Infrastructure accessible
- [ ] Team briefed and ready
- [ ] Incident response procedures reviewed

---

### DAY 3: Wednesday, December 11 - Smart Contract Deployment

#### Morning (2-3 hours)

**Task 3.1: Deploy Smart Contracts to Mainnet** 
```bash
# Set mainnet environment
export STELLAR_NETWORK="public"
export STELLAR_SECRET_KEY=$(cat .env-mainnet | grep STELLAR_MAINNET_SECRET_KEY)

# Execute deployment script
./deploy-testnet.sh --network mainnet

# Expected output:
# Deploying to: https://soroban-mainnet.stellar.org
# # 1/6 Deploying Stablecoin...
# Deployed: CA... (Cost: ~2 XLM)
# 2/6 Deploying Loans Pool...
# Deployed: CC... (Cost: ~2 XLM)
# 3/6 Deploying RiskLock...
# Deployed: CA... (Cost: ~1 XLM)
# 4/6 Deploying Portfolio Manager...
# Deployed: CA... (Cost: ~1 XLM)
# 5/6 Deploying Governance...
# Deployed: CC... (Cost: ~2 XLM)
# 6/6 Deploying ZK Verifier...
# Deployed: CB... (Cost: ~1 XLM)
#
# Total cost: ~9 XLM
# Remaining balance: ~6 XLM (reserves + buffer)
```

**Task 3.2: Verify Mainnet Deployments** 
```bash
# Check each contract on mainnet
for contract in CA755... CC... CA... CA... CC... CB...; do
  echo "Checking $contract..."
  npm run scripts -- verify-contract $contract --network mainnet
done

# Expected:
# All 6 contracts verified on mainnet
# All contract methods callable
# All events emitted correctly
```

**Task 3.3: Record Mainnet Contract IDs** 
```bash
# Update .env-mainnet with actual deployment IDs
cat >> .env-mainnet << 'EOF'
# Mainnet Contract IDs
MAINNET_STABLECOIN_ADDRESS="CA..."
MAINNET_LOANS_POOL_ADDRESS="CC..."
MAINNET_RISKLOCK_ADDRESS="CA..."
MAINNET_PORTFOLIO_ADDRESS="CA..."
MAINNET_GOVERNANCE_ADDRESS="CC..."
MAINNET_ZK_VERIFIER_ADDRESS="CB..."
EOF

# Store in secure location:
# - AWS Secrets Manager
# - 1Password vault
# - Encrypted backup
```

#### Afternoon (1-2 hours)

**Task 3.4: Update Frontend Configuration** 
```bash
# Update contract addresses in frontend
# apps/frontend/src/config/contracts.ts

export const CONTRACTS = {
  MAINNET: {
    stablecoin: process.env.NEXT_PUBLIC_STABLECOIN_MAINNET,
    loansPool: process.env.NEXT_PUBLIC_LOANS_POOL_MAINNET,
    riskLock: process.env.NEXT_PUBLIC_RISKLOCK_MAINNET,
    portfolio: process.env.NEXT_PUBLIC_PORTFOLIO_MAINNET,
    governance: process.env.NEXT_PUBLIC_GOVERNANCE_MAINNET,
    zkVerifier: process.env.NEXT_PUBLIC_ZK_VERIFIER_MAINNET,
  },
  TESTNET: {
    // Testnet addresses...
  }
}

# Update environment variables
export NEXT_PUBLIC_STABLECOIN_MAINNET="CA..."
export NEXT_PUBLIC_LOANS_POOL_MAINNET="CC..."
# ... etc
```

**Task 3.5: Build Production Frontend** 
```bash
# Build with mainnet config
cd apps/frontend
npm run build

# Verify build
npm run build:analyze

# Expected:
# Next.js build complete
# All pages optimized
# Bundle size <200KB
# No warnings or errors
```

#### Evening (1 hour)

**Task 3.6: Smart Contract Testing Summary** 
- [ ] All 6 contracts deployed on mainnet
- [ ] All contract IDs recorded securely
- [ ] All methods verified callable
- [ ] Frontend configuration updated
- [ ] Production build verified

---

### DAY 4: Thursday, December 12 - Backend Deployment

#### Morning (2-3 hours)

**Task 4.1: Prepare Backend for Mainnet** 
```bash
# Set backend environment
export NODE_ENV="production"
export DATABASE_URL=$(cat .env-mainnet | grep DATABASE_URL)
export REDIS_URL=$(cat .env-mainnet | grep REDIS_URL)

# Build production image
docker build -f apps/backend/Dockerfile \
  -t stellaro-backend:latest \
  -t stellaro-backend:v1.0.0 \
  ./apps/backend

# Run migrations
npm run migrate:prod

# Expected:
# Database migrations applied
# Schema created
# Initial data loaded
```

**Task 4.2: Deploy Backend Service** 
```bash
# Option A: Docker Compose
docker-compose up -d backend

# Option B: Kubernetes
kubectl apply -f infra/k8s/backend-deployment.yaml
kubectl rollout status deployment/stellaro-backend

# Verify service is running:
curl http://localhost:3001/health

# Expected response:
# {
# "status": "healthy",
# "timestamp": "2025-12-12T10:00:00Z",
# "version": "1.0.0"
# }
```

**Task 4.3: Verify API Endpoints** 
```bash
# Test critical endpoints
npm run test:api --network mainnet

# Expected tests passing:
# POST /auth/login
# POST /auth/register
# GET /positions
# POST /positions/open
# POST /positions/close
# GET /governance/proposals
# POST /governance/vote
# GET /health
# ... 30+ more
```

**Task 4.4: Configure Monitoring** 
```bash
# Start Prometheus scraping
docker-compose up -d prometheus

# Start Grafana dashboards
docker-compose up -d grafana

# Access dashboards:
# Prometheus: http://localhost:9090
# Grafana: http://localhost:3000

# Alerts to verify:
# High memory usage
# High CPU usage
# API error rate >1%
# Database connection pool exhausted
# Redis connection lost
```

#### Afternoon (1-2 hours)

**Task 4.5: Load Testing** 
```bash
# Run k6 load test (100 users, 5 minutes)
k6 run load-tests/spike-test.js \
  --vus 100 \
  --duration 5m \
  --ramp-up 1m

# Expected results:
# P95 latency <500ms
# Error rate <0.1%
# Throughput >100 RPS
# Memory stable
# CPU <80%
```

**Task 4.6: Security Scan** 
```bash
# Run Snyk security scan
snyk test --severity-threshold=high

# Expected:
# Zero high severity issues
# Zero critical issues
# Low/medium issues acceptable with mitigation plan
```

#### Evening (1 hour)

**Task 4.7: Backend Deployment Summary** 
- [ ] Backend service running on mainnet
- [ ] All API endpoints responding correctly
- [ ] Database connected and migrated
- [ ] Monitoring dashboards active
- [ ] Load tests passing
- [ ] Security scan clean

---

### DAY 5: Friday, December 13 - Frontend Deployment & Launch

#### Morning (2 hours)

**Task 5.1: Deploy Frontend Service** 
```bash
# Build frontend production build
cd apps/frontend
npm run build

# Option A: Vercel Deployment (Recommended)
vercel deploy --prod

# Option B: AWS S3 + CloudFront
aws s3 sync out/ s3://stellaro-prod/ --delete
aws cloudfront create-invalidation --distribution-id E... --paths "/*"

# Option C: Docker + Kubernetes
docker build -f apps/frontend/Dockerfile \
  -t stellaro-frontend:latest \
  ./apps/frontend
  
docker push stellaro-frontend:latest

kubectl apply -f infra/k8s/frontend-deployment.yaml
kubectl rollout status deployment/stellaro-frontend
```

**Task 5.2: Verify Frontend Deployment** 
```bash
# Check site is accessible
curl https://stellaro.io/

# Run Lighthouse audit
npx lighthouse https://stellaro.io/ \
  --chromeFlags="--headless" \
  --output=json \
  > lighthouse-report.json

# Expected:
# Site loads <3 seconds
# Lighthouse score >85
# All pages accessible
# Contracts correctly configured for mainnet
```

**Task 5.3: Setup SSL/TLS Certificate** 
```bash
# Let's Encrypt automatic renewal
certbot certonly --standalone \
  -d stellaro.io \
  -d api.stellaro.io

# Add to nginx/reverse proxy:
# SSL certificate: /etc/letsencrypt/live/stellaro.io/fullchain.pem
# SSL key: /etc/letsencrypt/live/stellaro.io/privkey.pem
```

#### Afternoon (2-3 hours)

**Task 5.4: Launch Production Environment** 
```bash
# Set maintenance mode OFF
export MAINTENANCE_MODE=false

# Start all services
docker-compose up -d

# Verify all services healthy
docker-compose ps

# Expected status:
# Backend: running
# Frontend: running
# PostgreSQL: running
# Redis: running
# Prometheus: running
# Grafana: running
```

**Task 5.5: Test Complete User Flow** 
```bash
# Automated end-to-end testing
npm run test:e2e -- --testNamePattern="mainnet"

# Manual testing checklist:
# Visit https://stellaro.io
# Register new account
# Complete KYC/AML
# Connect Freighter wallet
# Mint stablecoin (small amount: 10 STLT-BRL)
# Join lending pool
# Create governance proposal
# Vote on proposal
# Verify ZK proof generation
# Check portfolio overview
# Review transaction history
```

**Task 5.6: Go/No-Go Decision** 
```
Go/No-Go Checklist:
 All smart contracts deployed on mainnet
 Backend service stable (uptime >99.9%)
 Frontend accessible and responsive
 SSL/TLS certificates active
 Database replicated and backed up
 Monitoring dashboards showing green
 Load tests passing
 Security scan clean
 All E2E tests passing
 Team briefed and ready

DECISION:  GO FOR PRODUCTION LAUNCH
```

#### Evening (1 hour)

**Task 5.7: Launch Communication** 
```bash
# Announce launch
- Email to team
- Social media posts (Twitter, Discord)
- Blog post: "Stellaro Launches on Stellar Mainnet"
- Email to beta testers
- Telegram/Discord announcement

# Template:
" Stellaro is now LIVE on Stellar Mainnet!

Check out our DeFi platform featuring:
 STLT-BRL stablecoin
 Decentralized lending
 Advanced risk management
 AI-powered trading
 Full compliance framework

Get started: https://stellaro.io"
```

---

### DAY 6: Saturday, December 14 - Monitoring & Stability

#### All Day

**Task 6.1: Production Monitoring** 
```
Monitoring tasks (every hour):
 Check Grafana dashboards
 Review error logs in backend
 Verify transaction throughput
 Check database performance
 Monitor Redis cache hit rate
 Review API latencies
 Check user signups

Expected metrics:
- Uptime: 100%
- P95 latency: <500ms
- Error rate: <0.1%
- Throughput: 10+ TPS
- Active users: 10+
- TVL: >$1k initial
```

**Task 6.2: Issue Tracking** 
```
If any issues found:
1. Log immediately in GitHub Issues
2. Tag with "production" label
3. Assign to team member
4. Create hotfix if critical
5. Deploy using blue-green deployment
6. Verify fix in production
7. Document root cause
8. Add monitoring alert for prevention
```

**Task 6.3: Incident Response** 
```
If major incident occurs:
1. Declare incident (Slack notification)
2. Activate incident commander
3. Assess severity (P1-P4)
4. Execute remediation plan
5. Keep stakeholders informed every 30min
6. Post-incident review within 24 hours
```

**Task 6.4: Performance Baseline** 
```
Collect baseline metrics:
- Daily active users
- Total transactions
- Total volume (BRL)
- Avg transaction size
- User retention rate
- Error rate
- Response times

Store in docs/PRODUCTION_METRICS_DAY1.md
```

#### Evening (1-2 hours)

**Task 6.5: Weekend Standby Plan** 
```
Assign on-call rotation:
- Saturday 6PM - Sunday 6PM: Engineer A
- Sunday 6PM - Monday 6AM: Engineer B
- Monday 6AM - Monday 6PM: Engineer C

On-call responsibilities:
 Monitor production every 30 minutes
 Respond to critical issues <15min
 Escalate to team if needed
 Keep incident log updated
```

---

### DAY 7: Sunday, December 15 - Post-Launch Review & Planning

#### Morning (2 hours)

**Task 7.1: Launch Retrospective** 
```
Team meeting agenda:
1. Launch recap (30 min)
   - What went well?
   - What could improve?
   - Any unexpected issues?

2. Metrics review (30 min)
   - User signups vs target
   - TVL growth vs target
   - Error rates and performance
   - Infrastructure stability

3. Lessons learned (30 min)
   - Document learnings
   - Update procedures
   - Plan improvements

4. Next week priorities (30 min)
   - Real service integrations
   - Marketing strategy
   - Feature enhancements
```

**Task 7.2: First Week Metrics Summary** 
```
Create summary document:
docs/PRODUCTION_METRICS_WEEK1.md

Include:
- Total users: __
- Total transactions: __
- Total volume (BRL): __
- TVL: __
- Uptime: __
- Avg response time: __
- Error rate: __
- Most used features: __
- User feedback: __
- Issues found: __
- Issues resolved: __
```

#### Afternoon (2 hours)

**Task 7.3: Week 2-4 Planning** 
```
Plan next iterations:

Week 2 (Dec 16-22):
□ Enable real PIX integration
□ Enable real KYC/AML
□ Launch marketing campaign
□ Reach 100 users
□ Fix any critical issues

Week 3 (Dec 23-29):
□ Deploy v1.1 features
□ Add advanced analytics
□ Launch referral program
□ Holiday break monitoring

Week 4 (Dec 30-Jan 5):
□ Analyze Q4 metrics
□ Plan Q1 roadmap
□ Begin mobile app design
```

**Task 7.4: Continuous Improvement** 
```
Ongoing tasks:
- Daily monitoring of production metrics
- Weekly performance reviews
- Bi-weekly feature releases
- Monthly security audits
- Quarterly strategic planning
```

---

## SUCCESS CRITERIA

### Day 1: Readiness
- [ ] All tests passing
- [ ] All code reviewed
- [ ] Team briefed
- [ ] Rollback plan reviewed

### Day 2: Funding
- [ ] XLM acquired (15 XLM)
- [ ] Mainnet account funded
- [ ] Environment prepared
- [ ] Team standby confirmed

### Day 3: Deployment
- [ ] 6 contracts deployed on mainnet
- [ ] Contract IDs recorded
- [ ] All contracts verified callable
- [ ] Frontend updated

### Day 4: Backend Live
- [ ] Backend service running
- [ ] All endpoints responding
- [ ] Database migrated
- [ ] Monitoring active

### Day 5: Frontend Live
- [ ] Frontend deployed
- [ ] Site accessible and responsive
- [ ] SSL certificate active
- [ ] All services passing checks

### Day 6: Stability
- [ ] Uptime >99%
- [ ] No critical issues
- [ ] Metrics collected
- [ ] Team responsive

### Day 7: Success
- [ ] Launch successful
- [ ] Retrospective completed
- [ ] Week 2 planned
- [ ] Team celebrates! 

---

## TOOLS & RESOURCES

### Command Reference
```bash
# Health checks
curl https://stellaro.io/
curl https://api.stellaro.io/health

# Deployment
./deploy-testnet.sh --network mainnet
docker-compose -f docker-compose.yml up -d
kubectl apply -f infra/k8s/deployment.yaml

# Monitoring
# Prometheus: http://localhost:9090
# Grafana: http://localhost:3000
# Logs: docker logs stellaro-backend

# Testing
npm run test:full
npm run test:e2e
k6 run load-tests/spike-test.js

# Database
npm run migrate:prod
npm run db:seed
npm run db:backup
```

### Documentation References
- MAINNET_CHECKLIST.md - Deployment checklist
- QUICK_DEPLOY.md - Quick deployment guide
- MONITORING_GUIDE.md - Monitoring setup
- INCIDENT_RESPONSE.md - Incident procedures
- TROUBLESHOOTING.md - Common issues

---

## POST-DEPLOYMENT (After Day 7)

### Week 2-4 Tasks
1. Real service integrations
2. Marketing campaign launch
3. User onboarding program
4. Feature enhancements
5. Performance optimization

### Month 2 (January 2026)
1. Mobile app launch (iOS/Android)
2. International expansion (Latin America)
3. Advanced trading features
4. API partner integrations
5. DAO transition planning

### Month 3+ (Feb 2026+)
1. Mainnet DAO governance
2. Bridge to other blockchains
3. Enterprise partnerships
4. Advanced analytics
5. Scale to 10k+ users

---

## EMERGENCY CONTACTS

During deployment, keep these contacts available:

- **CTO/Tech Lead**: [Name] - [Phone] - [Email]
- **DevOps Engineer**: [Name] - [Phone] - [Email]
- **Security Lead**: [Name] - [Phone] - [Email]
- **Incident Commander**: [Name] - [Phone] - [Email]

---

## FINAL CHECKLIST

Before launching each day:
- [ ] Team briefed on day's objectives
- [ ] Backup/rollback procedure reviewed
- [ ] Monitoring dashboards open
- [ ] Emergency contacts listed
- [ ] Communication channels active
- [ ] Incident response ready
- [ ] Documentation updated

---

**Prepared by**: Stellaro Team  
**Date**: December 9, 2025  
**Status**: Ready to Execute  
**Next Steps**: Begin Day 1 preparations
