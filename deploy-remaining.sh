#!/bin/bash
# Deployment dos contratos restantes em mainnet

ROOT="/home/jistriane/Documentos/Stellaro"
CONTRACTS_DIR="$ROOT/contracts"
NETWORK="mainnet"
ACCOUNT="stellaro-mainnet-deploy"

echo "🚀 Deployando contratos restantes em mainnet..."
echo "Saldo atual: 8.23 XLM"
echo ""

# 1. Stablecoin (falhou antes)
echo "1️⃣ Stablecoin"
soroban contract deploy \
  --wasm "$CONTRACTS_DIR/target/wasm32v1-none/release/stablecoin.wasm" \
  --network $NETWORK \
  --source-account $ACCOUNT
echo ""
sleep 3

# 2. RiskLock (falhou antes)
echo "2️⃣ RiskLock"
soroban contract deploy \
  --wasm "$CONTRACTS_DIR/target/wasm32v1-none/release/risklock.wasm" \
  --network $NETWORK \
  --source-account $ACCOUNT
echo ""
sleep 3

# 3. Portfolio (falhou antes)
echo "3️⃣ Portfolio"
soroban contract deploy \
  --wasm "$CONTRACTS_DIR/target/wasm32v1-none/release/portfolio.wasm" \
  --network $NETWORK \
  --source-account $ACCOUNT
echo ""
sleep 3

# 4. Governance (falhou antes)
echo "4️⃣ Governance"
soroban contract deploy \
  --wasm "$CONTRACTS_DIR/target/wasm32v1-none/release/governance.wasm" \
  --network $NETWORK \
  --source-account $ACCOUNT
echo ""
sleep 3

# 5. ZK Verifier (falhou antes)
echo "5️⃣ ZK Verifier"
soroban contract deploy \
  --wasm "$CONTRACTS_DIR/target/wasm32v1-none/release/zk_verifier.wasm" \
  --network $NETWORK \
  --source-account $ACCOUNT
echo ""

echo "✅ Deployment dos contratos restantes concluído!"
