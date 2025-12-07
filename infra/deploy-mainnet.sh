#!/bin/bash
set -euo pipefail

# Stellaro Mainnet Deployment Script
# Custa: ~10-15 XLM
# Tempo: ~5-10 minutos
# Resultado: 6 contratos em Stellar mainnet

echo "🚀 STELLARO MAINNET DEPLOYMENT"
echo "======================================"
echo "Date: $(date)"
echo "Network: Stellar MAINNET"
echo ""

# Configuration
MAINNET_RPC="https://rpc-mainnet.stellar.org"
MAINNET_PASSPHRASE="Public Global Stellar Network ; September 2015"
ALIAS="deploy"
ADMIN="GCKZ35K7GMUJBFKBOS2YM7FUHATM5FHHFGH7AVNGC5TXLFGV265G33QX"
RISK_BPS=8000
LTV_BPS=7000
INTEREST_BPS=1800

ROOT_DIR=$(cd "$(dirname "$0")/.." && pwd)
CONTRACTS_DIR="$ROOT_DIR/contracts"

# Step 1: Verify balance
echo "1️⃣ Verificando saldo em mainnet..."
BALANCE=$(soroban account balance "$ALIAS" --network mainnet --rpc-url "$MAINNET_RPC" 2>/dev/null || echo "0")
echo "   Saldo atual: $BALANCE XLM"

if (( $(echo "$BALANCE < 15" | bc -l) )); then
  echo "❌ ERRO: Saldo insuficiente!"
  echo "   Necessário: 15 XLM"
  echo "   Você tem: $BALANCE XLM"
  echo ""
  echo "👉 Adquira XLM em:"
  echo "   - Binance (min 10 XLM)"
  echo "   - Kraken (min 20 XLM)"  
  echo "   - Coinbase (min 1 XLM)"
  echo "   - Stellar Community Fund (https://communityfund.stellar.org)"
  exit 1
fi

echo "   ✅ Saldo verificado"
echo ""

# Step 2: Build contracts
echo "2️⃣ Compilando contratos..."
cd "$CONTRACTS_DIR"
soroban contract build --manifest-path Cargo.toml --profile release
echo "   ✅ Build completo"
echo ""

# Step 3: Optimize WASMs
echo "3️⃣ Otimizando WASMs para mainnet..."
for contract in stablecoin risklock loans_pool portfolio governance zk_verifier; do
  if [ -f "target/wasm32v1-none/release/${contract}.wasm" ]; then
    echo "   → Otimizando ${contract}..."
    soroban contract optimize \
      --wasm "target/wasm32v1-none/release/${contract}.wasm" \
      --quiet
  fi
done
echo "   ✅ Otimização completa"
echo ""

# Step 4: Deploy contracts
echo "4️⃣ Deployando 6 contratos em mainnet..."
echo "   (Este processo leva ~2-3 minutos)"
echo ""

declare -A CONTRACT_IDS

CONTRACTS=("stablecoin" "risklock" "loans_pool" "portfolio" "governance" "zk_verifier")

for contract in "${CONTRACTS[@]}"; do
  echo "   📦 Deployando ${contract}..."
  
  CONTRACT_ID=$(soroban contract deploy \
    --wasm "target/wasm32v1-none/release/${contract}.wasm" \
    --source-account "$ALIAS" \
    --network mainnet \
    --rpc-url "$MAINNET_RPC" \
    --network-passphrase "$MAINNET_PASSPHRASE" 2>&1 | grep -oE "^[C][A-Z0-9]{55}$" | head -1)
  
  if [ -z "$CONTRACT_ID" ]; then
    echo "❌ Erro ao deployer ${contract}"
    exit 1
  fi
  
  CONTRACT_IDS[$contract]=$CONTRACT_ID
  echo "      ✅ ${contract}: ${CONTRACT_ID:0:20}..."
  sleep 1
done

echo ""
echo "5️⃣ Inicializando contratos..."

# Initialize stablecoin
echo "   → Inicializando stablecoin..."
soroban contract invoke \
  --id "${CONTRACT_IDS[stablecoin]}" \
  --source-account "$ALIAS" \
  --network mainnet \
  --rpc-url "$MAINNET_RPC" \
  --network-passphrase "$MAINNET_PASSPHRASE" \
  -- init \
  --admin "$ADMIN" \
  --risk-threshold-bps "$RISK_BPS"

# Initialize loans_pool
echo "   → Inicializando loans_pool..."
soroban contract invoke \
  --id "${CONTRACT_IDS[loans_pool]}" \
  --source-account "$ALIAS" \
  --network mainnet \
  --rpc-url "$MAINNET_RPC" \
  --network-passphrase "$MAINNET_PASSPHRASE" \
  -- init \
  --admin "$ADMIN" \
  --ltv-bps "$LTV_BPS" \
  --interest-bps "$INTEREST_BPS"

echo "   ✅ Inicialização completa"
echo ""

# Step 6: Save contract IDs
echo "6️⃣ Salvando Contract IDs..."

cat > "$ROOT_DIR/.env-mainnet" << EOF
# Stellaro DeFi - MAINNET Configuration
# Generated: $(date)
# Network: Stellar Mainnet (LIVE)

# Network Configuration
MAINNET_RPC="https://rpc-mainnet.stellar.org"
MAINNET_NETWORK_PASSPHRASE="Public Global Stellar Network ; September 2015"

# Deployment Account
MAINNET_ADMIN_PUBLIC_KEY="$ADMIN"
MAINNET_ADMIN_SECRET_KEY="(stored in secure vault)"

# Contract IDs - MAINNET
MAINNET_STABLECOIN_CONTRACT_ID="${CONTRACT_IDS[stablecoin]}"
MAINNET_RISKLOCK_CONTRACT_ID="${CONTRACT_IDS[risklock]}"
MAINNET_LOANS_POOL_CONTRACT_ID="${CONTRACT_IDS[loans_pool]}"
MAINNET_PORTFOLIO_CONTRACT_ID="${CONTRACT_IDS[portfolio]}"
MAINNET_GOVERNANCE_CONTRACT_ID="${CONTRACT_IDS[governance]}"
MAINNET_ZK_VERIFIER_CONTRACT_ID="${CONTRACT_IDS[zk_verifier]}"

# Deployment Parameters
RISK_BPS=$RISK_BPS
LTV_BPS=$LTV_BPS
INTEREST_BPS=$INTEREST_BPS

# Blockchain Explorer Links
# STABLECOIN: https://stellar.expert/explorer/mainnet/contract/${CONTRACT_IDS[stablecoin]}
# RISKLOCK: https://stellar.expert/explorer/mainnet/contract/${CONTRACT_IDS[risklock]}
# LOANS_POOL: https://stellar.expert/explorer/mainnet/contract/${CONTRACT_IDS[loans_pool]}
# PORTFOLIO: https://stellar.expert/explorer/mainnet/contract/${CONTRACT_IDS[portfolio]}
# GOVERNANCE: https://stellar.expert/explorer/mainnet/contract/${CONTRACT_IDS[governance]}
# ZK_VERIFIER: https://stellar.expert/explorer/mainnet/contract/${CONTRACT_IDS[zk_verifier]}

# Status
DEPLOYMENT_DATE="$(date)"
DEPLOYMENT_STATUS="SUCCESS"
DEPLOYMENT_COST="~10-15 XLM"
EOF

echo "   ✅ Configuração salva em .env-mainnet"
echo ""

# Step 7: Verify deployment
echo "7️⃣ Verificando deployment..."
FINAL_BALANCE=$(soroban account balance "$ALIAS" --network mainnet --rpc-url "$MAINNET_RPC" 2>/dev/null || echo "0")
COST=$(echo "$BALANCE - $FINAL_BALANCE" | bc)

echo "   Saldo inicial: $BALANCE XLM"
echo "   Saldo final: $FINAL_BALANCE XLM"
echo "   Custo total: $COST XLM"
echo ""

# Summary
echo "======================================"
echo "✅ DEPLOYMENT COMPLETO!"
echo "======================================"
echo ""
echo "📊 Resumo:"
echo "   6 contratos deployados ✅"
echo "   Custo: $COST XLM (~\$$(echo "$COST * 0.12" | bc) USD)"
echo "   Status: MAINNET LIVE 🚀"
echo ""
echo "📋 Próximos passos:"
echo "   1. Revisar .env-mainnet"
echo "   2. Atualizar backend com contract IDs"
echo "   3. Atualizar frontend com contract IDs"
echo "   4. Executar testes de integração"
echo "   5. Ativar registro de usuários"
echo ""
echo "🔗 Explore em:"
echo "   https://stellar.expert/explorer/mainnet/account/$ADMIN"
echo ""
echo "📚 Documentação:"
echo "   Ref: docs/MAINNET_CHECKLIST.md"
echo ""

exit 0
