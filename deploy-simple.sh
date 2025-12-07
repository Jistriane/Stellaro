#!/bin/bash
# Deployment Simples Stellaro Mainnet

ROOT="/home/jistriane/Documentos/Stellaro"
CONTRACTS_DIR="$ROOT/contracts"
NETWORK="mainnet"
ACCOUNT="stellaro-mainnet-deploy"

echo "🚀 Deployando contratos em mainnet..."
echo ""

# 1. Stablecoin
echo "1️⃣ Stablecoin"
soroban contract deploy \
  --wasm "$CONTRACTS_DIR/target/wasm32v1-none/release/stablecoin.wasm" \
  --network $NETWORK \
  --source-account $ACCOUNT
echo ""
sleep 3

# 2. RiskLock
echo "2️⃣ RiskLock"
soroban contract deploy \
  --wasm "$CONTRACTS_DIR/target/wasm32v1-none/release/risklock.wasm" \
  --network $NETWORK \
  --source-account $ACCOUNT
echo ""
sleep 3

# 3. Loans Pool
echo "3️⃣ Loans Pool"
soroban contract deploy \
  --wasm "$CONTRACTS_DIR/target/wasm32v1-none/release/loans_pool.wasm" \
  --network $NETWORK \
  --source-account $ACCOUNT
echo ""
sleep 3

# 4. Portfolio
echo "4️⃣ Portfolio"
soroban contract deploy \
  --wasm "$CONTRACTS_DIR/target/wasm32v1-none/release/portfolio.wasm" \
  --network $NETWORK \
  --source-account $ACCOUNT
echo ""
sleep 3

# 5. Governance
echo "5️⃣ Governance"
soroban contract deploy \
  --wasm "$CONTRACTS_DIR/target/wasm32v1-none/release/governance.wasm" \
  --network $NETWORK \
  --source-account $ACCOUNT
echo ""
sleep 3

# 6. ZK Verifier
echo "6️⃣ ZK Verifier"
soroban contract deploy \
  --wasm "$CONTRACTS_DIR/target/wasm32v1-none/release/zk_verifier.wasm" \
  --network $NETWORK \
  --source-account $ACCOUNT
echo ""

echo "✅ Deployment completo!"
