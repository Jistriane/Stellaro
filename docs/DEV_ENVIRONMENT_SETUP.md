# COMPLETE DEV ENVIRONMENT SETUP - STELLARO

**Date:** April 15, 2026  
**For:** Rust/Soroban Developers  
**Time to Complete:** 1-2 hours  
**Status:** Production-Ready Setup Guide  

---

## PREREQUISITES CHECKLIST

Before you start, verify you have:

- [ ] macOS/Linux/Windows WSL2 (NOT native Windows)
- [ ] Git installed (`git --version`)
- [ ] 20GB free disk space
- [ ] Internet connection (required for downloads)
- [ ] Docker installed (for local Stellar testnet)
- [ ] Stellar Testnet account with XLM funding

---

## PART 1: INSTALL RUST & SOROBAN

### 1.1 Install Rust Toolchain

```bash
# Download and install Rust (this will take ~5 minutes)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Follow prompts (press 1 for default installation)
# Verify installation
rustc --version
cargo --version

# Expected output:
# rustc 1.75.0 (or newer)
# cargo 1.75.0 (or newer)
```

 **Checkpoint:** `rustc --version` shows version 1.75.0+

### 1.2 Add Wasm32 Target

```bash
# Add WebAssembly target for Soroban contracts
rustup target add wasm32-unknown-unknown

# Verify
rustup target list | grep wasm32-unknown-unknown

# Expected output:
# wasm32-unknown-unknown (installed)
```

 **Checkpoint:** Wasm32 target installed

### 1.3 Install Soroban CLI

```bash
# Install official Soroban CLI
cargo install --locked soroban-cli

# Verify installation
soroban --version

# Expected output:
# soroban 21.5.0 (or newer)
```

 **Checkpoint:** `soroban --version` shows 21.5.0+

---

## PART 2: CONFIGURE STELLAR NETWORKS

### 2.1 Add Testnet Configuration

```bash
# Add Stellar Testnet network
soroban network add testnet \
  --rpc-url https://soroban-testnet.stellar.org:443 \
  --network-passphrase "Test SDF Network ; September 2015"

# Verify
soroban network list

# Expected output:
# testnet       https://soroban-testnet.stellar.org testnet
```

 **Checkpoint:** Testnet network configured

### 2.2 Create or Import Test Account

```bash
# Option A: Generate new keypair
soroban keys generate test-account

# Option B: Import existing key from .env
# Create ~/.soroban/test-account and paste your secret key

# Verify account exists
soroban keys list

# Expected output:
# test-account
```

 **Checkpoint:** Test account available

### 2.3 Fund Your Account (Get XLM)

```bash
# Get your public key
PUBKEY=$(soroban keys show test-account)
echo $PUBKEY

# Fund via Stellar Friendbot
# Open in browser: https://laboratory.stellar.org/#account-creator
# OR from command line:
curl "https://friendbot.stellar.org/?addr=$PUBKEY"

# Check balance
soroban rpc getaccount --account $PUBKEY --rpc-url https://soroban-testnet.stellar.org:443

# Expected output:
# Shows balance > 0 XLM
```

 **Checkpoint:** Account funded with testnet XLM

---

## PART 3: CLONE & SETUP STELLARO PROJECT

### 3.1 Clone Repository

```bash
# Clone Stellaro monorepo
git clone https://github.com/Jistriane/Stellaro.git
cd Stellaro

# Verify structure
ls -la | head -20

# Expected output:
# apps/
# contracts/
# packages/
# README.md
# turbo.json
```

 **Checkpoint:** Repository cloned

### 3.2 Install Node Dependencies

```bash
# Install npm dependencies (monorepo root)
npm install

# This installs Turbo and workspace dependencies
# Time: ~3-5 minutes

# Verify Turbo
npx turbo --version

# Expected output:
# turbo x.x.x
```

 **Checkpoint:** Node dependencies installed

### 3.3 Navigate to Contracts Folder

```bash
cd contracts/

# Verify contract structure
ls -la

# Expected output:
# batch_executor/
# mev_guard/
# stablecoin/
# loans_pool/
# ... (other contracts)
```

 **Checkpoint:** Contract directory ready

---

## PART 4: BUILD & TEST FIRST CONTRACT

### 4.1 Test Batch Executor Build

```bash
# Navigate to contract
cd contracts/batch_executor/

# Build contract (this will take ~2-3 minutes first time)
cargo build --target wasm32-unknown-unknown --release

# Check build output
ls -la target/wasm32-unknown-unknown/release/

# Expected output:
# batch_executor.wasm (file should exist)
```

 **Checkpoint:** Contract compiles to WASM

### 4.2 Optimize WASM (Important!)

```bash
# Optimize contract size for deployment
soroban contract optimize --wasm target/wasm32-unknown-unknown/release/batch_executor.wasm

# Expected output:
# Output: target/wasm32-unknown-unknown/release/batch_executor.wasm
# (file is now optimized for deployment)

# Check size
wc -c target/wasm32-unknown-unknown/r...

# Expected: <256KB (Soroban limit)
```

 **Checkpoint:** Optimized WASM created

### 4.3 Run Unit Tests

```bash
# Run tests for contract
cargo test --lib

# Expected output:
# test result: ok. X passed; 0 failed; 0 ignored
```

 **Checkpoint:** Unit tests pass locally

---

## PART 5: DEPLOY TO TESTNET (First Time)

### 5.1 Create Deployment Account Secret

```bash
# Create SOROBAN_SECRET_KEY environment variable
export SOROBAN_SECRET_KEY=$(soroban keys show test-account --show-seed)

# Verify
echo $SOROBAN_SECRET_KEY

# Expected output:
# SBXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

 **SECURITY WARNING:** Never commit this to git. Only for testnet dev.

 **Checkpoint:** Secret key loaded in environment

### 5.2 Deploy Contract

```bash
# Navigate back to contract directory
cd contracts/batch_executor/

# Deploy to testnet
soroban contract deploy \
  --wasm target/wasm32-unknown-unknown/release/batch_executor.wasm \
  --source-account test-account \
  --network testnet

# Expected output:
# Successfully deployed contract
# Contract ID: CXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# Save this Contract ID!
export BATCH_EXECUTOR_CONTRACT_ID="CAxxxxxxxx..."
```

 **Checkpoint:** Contract deployed to testnet

### 5.3 Verify Deployment

```bash
# Check contract exists on testnet
soroban rpc getcontract \
  --contract-id $BATCH_EXECUTOR_CONTRACT_ID \
  --rpc-url https://soroban-testnet.stellar.org:443

# Also check on Stellar Expert
# https://stellar.expert/explorer/testnet/contract/$BATCH_EXECUTOR_CONTRACT_ID
```

 **Checkpoint:** Contract visible on testnet

---

## PART 6: SETUP ENVIRONMENT FILES

### 6.1 Create .env-testnet

```bash
# In project root (Stellaro/)
cat > .env-testnet << 'EOF'
# Soroban Network Config
SOROBAN_NETWORK=testnet
SOROBAN_RPC_URL=https://soroban-testnet.stellar.org:443
SOROBAN_NETWORK_PASSPHRASE="Test SDF Network ; September 2015"

# Test Account
SOROBAN_SECRET_KEY=$YOUR_SECRET_KEY_HERE
SOROBAN_ACCOUNT_KEY=test-account

# Deployed Contracts (update as you deploy)
STABLECOIN_CONTRACT_ID=CDWWZ7XPQVRVYQK7UGRVRCSZGPJXWRKSTGNXBUNGNWGXQXDTZLQDZH6
LOANSPOOL_CONTRACT_ID=CCKRHSO5Z6WHGCHQAAFYEVPGREZHLFHGVHCXDHG5
BATCH_EXECUTOR_CONTRACT_ID=CAxxxxxxxx...  # Update after deploy
MEV_GUARD_CONTRACT_ID=CAxxxxxxxx...       # Update after deploy

# Backend Config
POSTGRES_URL=postgresql://localhost:5432/stellaro_db
REDIS_URL=redis://localhost:6379
JWT_SECRET=your_jwt_secret_here_dev_only

# Horizon API
HORIZON_URL=https://horizon-testnet.stellar.org
HORIZON_TESTNET_SECRET_KEY=$YOUR_SECRET_KEY_HERE
EOF

# Make .env-testnet readable but not editable
chmod 600 .env-testnet
```

 **Checkpoint:** .env-testnet configured

### 6.2 Create .env-mainnet (empty, for future)

```bash
cat > .env-mainnet << 'EOF'
# Mainnet configuration (DO NOT FILL IN YET)
# Will be used after testnet validation

SOROBAN_NETWORK=mainnet
SOROBAN_RPC_URL=https://soroban-mainnet.stellar.org:443
SOROBAN_NETWORK_PASSPHRASE="Public Global Stellar Network ; September 2015"
SOROBAN_SECRET_KEY=DO_NOT_ADD_REAL_KEY_YET
STABLECOIN_CONTRACT_ID=TODO_AFTER_TESTNET_SUCCESS
EOF

chmod 600 .env-mainnet
```

 **Checkpoint:** Environment files configured

---

## PART 7: DATABASE SETUP (For Backend)

### 7.1 Install PostgreSQL (if not present)

```bash
# macOS
brew install postgresql@15

# Linux (Ubuntu/Debian)
sudo apt-get install postgresql-15

# Verify
psql --version

# Expected output:
# psql (PostgreSQL) 15.x
```

### 7.2 Start PostgreSQL

```bash
# macOS (via Homebrew)
brew services start postgresql@15

# Linux (via systemctl)
sudo systemctl start postgresql

# Verify running
psql -U postgres -c "SELECT version();"

# Expected output:
# PostgreSQL 15.x on...
```

### 7.3 Create Development Database

```bash
# Create database for Stellaro
createdb -U postgres stellaro_db

# Create user (optional, for additional security)
psql -U postgres -c "CREATE USER stellaro WITH PASSWORD 'dev_password_only';"
psql -U postgres -c "ALTER USER stellaro CREATEDB;"

# Verify database exists
psql -U postgres -l | grep stellaro

# Expected output:
# stellaro_db | postgres | UTF8 | ...
```

 **Checkpoint:** PostgreSQL ready

### 7.4 Setup Backend Database

```bash
# Navigate to backend
cd apps/backend/

# Install Prisma (if not already)
npm install

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init

# Expected output:
# Prisma schema has been updated successfully
# Database connection successful
```

 **Checkpoint:** Backend DB ready

---

## PART 8: REDIS SETUP (For Caching)

### 8.1 Install Redis

```bash
# macOS
brew install redis

# Linux (Ubuntu/Debian)
sudo apt-get install redis-server

# Verify installation
redis-cli --version

# Expected output:
# redis-cli 7.x.x
```

### 8.2 Start Redis

```bash
# macOS
brew services start redis

# Linux
sudo systemctl start redis-server

# Verify running
redis-cli ping

# Expected output:
# PONG
```

 **Checkpoint:** Redis running

---

## FINAL VERIFICATION CHECKLIST

Run this to verify everything is ready:

```bash
#!/bin/bash

echo " Checking Rust/Soroban..."
rustc --version && echo " Rust" || echo " Rust"
soroban --version && echo " Soroban CLI" || echo " Soroban CLI"

echo ""
echo " Checking Stellar Network..."
soroban network list | grep testnet && echo " Testnet configured" || echo " Testnet not configured"

echo ""
echo " Checking Test Account..."
soroban keys list | grep test-account && echo " Test account" || echo " Test account missing"

echo ""
echo " Checking Node/Turbo..."
npm --version && echo " NPM" || echo " NPM"
npx turbo --version && echo " Turbo" || echo " Turbo"

echo ""
echo " Checking Databases..."
psql --version && echo " PostgreSQL" || echo " PostgreSQL"
redis-cli ping && echo " Redis" || echo " Redis"

echo ""
echo " Checking Environment Files..."
[ -f .env-testnet ] && echo " .env-testnet" || echo " .env-testnet"

echo ""
echo " All systems ready for development!"
```

---

## COMMON SETUP ISSUES & SOLUTIONS

### Issue: "soroban: command not found"
**Solution:** 
```bash
# Cargo might not be in PATH yet
source $HOME/.cargo/env
soroban --version
```

### Issue: "Connection refused" when deploying
**Solution:**
```bash
# Check if testnet is accessible
curl -s https://soroban-testnet.stellar.org/health | jq .
# If it fails, testnet might be down. Wait or try later.
```

### Issue: "Account not found"
**Solution:**
```bash
# Account not funded on testnet
curl "https://friendbot.stellar.org/?addr=$(soroban keys show test-account)"
# Wait ~5 seconds, then try again
```

### Issue: "WASM file too large (>256KB)"
**Solution:**
```bash
# Not running optimizer
soroban contract optimize --wasm target/wasm32-unknown-unknown/release/contract.wasm

# If still too large, remove debug symbols:
# Add to Cargo.toml:
# [profile.release]
# opt-level = "z"     # Optimize for size
# lto = true          # Link-time optimization
```

### Issue: "PostgreSQL port 5432 already in use"
**Solution:**
```bash
# Find process using port
lsof -i :5432

# Kill it or change POSTGRES_URL in .env-testnet
# POSTGRES_URL=postgresql://localhost:5433/stellaro_db  # Use port 5433
```

---

## HELPFUL COMMANDS (Bookmark These!)

```bash
# ===== SOROBAN & CONTRACTS =====

# List available networks
soroban network list

# Check account balance
soroban rpc getaccount --account test-account --network testnet

# Deploy a contract
soroban contract deploy --wasm contract.wasm --source-account test-account --network testnet

# Build without wasm
cargo build --lib

# Test locally
cargo test --lib

# ===== ACCOUNTS & KEYS =====

# List all keys
soroban keys list

# Show specific key
soroban keys show test-account

# Generate new key
soroban keys generate new-key-name

# ===== DATABASE =====

# Connect to PostgreSQL
psql -U postgres stellaro_db

# Reset database (WARNING: deletes data!)
npx prisma migrate reset

# Open Prisma Studio (visual DB editor)
npx prisma studio

# ===== REDIS =====

#Redis CLI
redis-cli

# Check all keys
redis-cli KEYS "*"

# Flush all cache (WARNING!)
redis-cli FLUSHALL

# ===== DEVELOPMENT =====

# Start backend development server
cd apps/backend && npm run dev

# Start frontend development server
cd apps/frontend && npm run dev

# Run all tests
npm run test

# Build all packages
npm run build
```

---

## NEXT STEPS AFTER SETUP

Once all checkpoints are complete ():

1. **Read:** [SMART_CONTRACT_API_REFERENCE.md](SMART_CONTRACT_API_REFERENCE.md)
2. **Follow:** [WEEK1_BATCH_EXECUTOR_TASKS.md](WEEK1_BATCH_EXECUTOR_TASKS.md)
3. **Print:** [IMPLEMENTATION_CHECKLIST.md](IMPLEMENTATION_CHECKLIST.md)
4. **Start coding:** Write first Batch Executor integration (Stablecoin)

---

## TROUBLESHOOTING LINKS

- Soroban Docs: https://developers.stellar.org/docs
- Rust Book: https://doc.rust-lang.org/book/
- Stellar Expert (block explorer): https://stellar.expert/
- Discord Support: https://discord.gg/stellar

---

**Status:**  PRODUCTION-READY SETUP GUIDE  
**Last Updated:** April 15, 2026  
**Estimated Time to Complete:** 1-2 hours  
**Difficulty:** Beginner-friendly with clear steps  

** Next: Run the verification checklist to confirm everything is ready!**
