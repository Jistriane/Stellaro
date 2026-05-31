#!/bin/bash
# Pre-flight Check for Stellaro Mainnet Deployment
# Usage: ./preflight_mainnet.sh

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

echo "🔍 Starting Stellaro Pre-flight Check for MAINNET..."

# 1. Check for .env-prod
if [ ! -f ".env-prod" ]; then
    echo -e "${RED}❌ Error: .env-prod file missing!${NC}"
    exit 1
fi
echo -e "${GREEN}✅ .env-prod file exists.${NC}"

# 2. Check for Mainnet Network Passphrase
PASSPHRASE=$(grep STELLAR_NETWORK_PASSPHRASE .env-prod | cut -d'=' -f2 | tr -d '"')
if [ "$PASSPHRASE" != "Public Global Stellar Network ; September 2015" ]; then
    echo -e "${RED}❌ Error: Incorrect STELLAR_NETWORK_PASSPHRASE for Mainnet!${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Mainnet Network Passphrase verified.${NC}"

# 3. Check for Smart Contract Artifacts
WASM_COUNT=$(ls contracts/target/wasm32v1-none/release/*.wasm 2>/dev/null | wc -l)
if [ "$WASM_COUNT" -lt 5 ]; then
    echo -e "${RED}❌ Error: WASM artifacts missing in contracts/target/wasm32v1-none/release/. Run stellar contract build --manifest-path contracts/Cargo.toml --profile release.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ $WASM_COUNT WASM artifacts found.${NC}"

# 4. Check for ZK Proof Artifacts
if [ ! -f "apps/frontend/public/circuits/credit_score.wasm" ] || [ ! -f "apps/frontend/public/circuits/credit_score_final.zkey" ]; then
    echo -e "${RED}❌ Warning: ZK Proof artifacts missing in frontend public folder! Solvency proof will fail.${NC}"
else
    echo -e "${GREEN}✅ ZK Proof artifacts found in frontend.${NC}"
fi

# 5. Check for Prisma Persistence
if ! grep -q "model WebhookSubscription" apps/backend/prisma/schema.prisma; then
    echo -e "${RED}❌ Error: Webhook persistence missing in Prisma schema!${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Prisma persistence schema verified.${NC}"

echo "--------------------------------------------------"
echo -e "${GREEN}🚀 PRE-FLIGHT COMPLETE. Ready for Mainnet Deployment.${NC}"
