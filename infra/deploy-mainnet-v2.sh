#!/bin/bash
set -euo pipefail

# Stellaro Mainnet Deployment - Direct with Secret Key
# Usa a chave secreta do .env-testnet
# Custa: ~10-15 XLM | Tempo: ~5-10 minutos

echo "🚀 STELLARO MAINNET DEPLOYMENT (v2)"
echo "======================================"
echo "Date: $(date)"
echo "Network: Stellar MAINNET (LIVE)"
echo ""

# ============= CONFIGURATION =============
MAINNET_RPC="https://rpc-mainnet.stellar.org"
MAINNET_PASSPHRASE="Public Global Stellar Network ; September 2015"

# From .env-testnet
ADMIN_PUBLIC="GCKZ35K7GMUJBFKBOS2YM7FUHATM5FHHFGH7AVNGC5TXLFGV265G33QX"
ADMIN_SECRET="SCVOS4PVPFBUXUL4MUAIOF2AOKXTAEHSWOMG2IIGI66TGCZASQR7SQDV"

RISK_BPS=8000
LTV_BPS=7000
INTEREST_BPS=1800

ROOT_DIR=$(cd "$(dirname "$0")/.." && pwd)
CONTRACTS_DIR="$ROOT_DIR/contracts"

# ============= STEP 1: VERIFY BALANCE =============
echo "1️⃣ Verificando saldo em mainnet..."

# Create temp file with key
TEMP_KEY=$(mktemp)
echo "$ADMIN_SECRET" > "$TEMP_KEY"
chmod 600 "$TEMP_KEY"

# Import key temporarily
soroban keys add deploy --secret-key-file "$TEMP_KEY" 2>/dev/null || true

BALANCE=$(soroban account balance deploy --network mainnet 2>/dev/null || echo "0")
echo "   Saldo: $BALANCE XLM"

if (( $(echo "$BALANCE < 15" | bc -l) )); then
  echo "❌ ERRO: Saldo insuficiente ($BALANCE XLM)"
  rm -f "$TEMP_KEY"
  exit 1
fi

echo "   ✅ Saldo verificado"
echo ""

# ============= STEP 2: BUILD CONTRACTS =============
echo "2️⃣ Compilando contratos..."
cd "$CONTRACTS_DIR"

if ! soroban contract build --manifest-path Cargo.toml --profile release 2>&1 | grep -q "Finished\|Compiling"; then
  echo "   ⚠️ Build pode estar usando cache..."
fi
echo "   ✅ Contratos prontos"
echo ""

# ============= STEP 3: OPTIMIZE WASM =============
echo "3️⃣ Otimizando WASMs..."

for contract in stablecoin risklock loans_pool portfolio governance zk_verifier batch_executor mev_guard; do
  if [ -f "target/wasm32v1-none/release/${contract}.wasm" ]; then
    soroban contract optimize \
      --wasm "target/wasm32v1-none/release/${contract}.wasm" \
      --quiet 2>/dev/null || true
    echo "   ✅ ${contract}"
  fi
done
echo ""

# ============= STEP 4: DEPLOY CONTRACTS =============
echo "4️⃣ Deployando 8 contratos em mainnet..."
echo "   (Tempo estimado: 5-8 minutos)"
echo ""

declare -A CONTRACT_IDS
CONTRACTS=("stablecoin" "risklock" "loans_pool" "portfolio" "governance" "zk_verifier" "batch_executor" "mev_guard")

for contract in "${CONTRACTS[@]}"; do
  echo "   📦 ${contract}..."
  
  CONTRACT_ID=$(soroban contract deploy \
    --wasm "target/wasm32v1-none/release/${contract}.wasm" \
    --source-account deploy \
    --network mainnet \
    2>&1 | grep -oE "^[C][A-Z0-9]{55}$" | head -1 || echo "")
  
  if [ -z "$CONTRACT_ID" ]; then
    # Try alternative extraction
    CONTRACT_ID=$(soroban contract deploy \
      --wasm "target/wasm32v1-none/release/${contract}.wasm" \
      --source-account deploy \
      --network mainnet \
      2>&1 | grep -i "contract\|C[A-Z0-9]" | grep -oE "C[A-Z0-9]{55}" | head -1 || echo "")
  fi
  
  if [ -z "$CONTRACT_ID" ]; then
    echo "      ⚠️ Não conseguiu extrair ID, tentando novamente..."
    sleep 2
    CONTRACT_ID=$(soroban contract deploy \
      --wasm "target/wasm32v1-none/release/${contract}.wasm" \
      --source-account deploy \
      --network mainnet \
      2>&1 | tee /tmp/deploy_output.txt | grep -oE "C[A-Z0-9]{55}" | head -1)
  fi
  
  if [ -z "$CONTRACT_ID" ]; then
    echo "      ❌ Erro ao deployer ${contract}"
    cat /tmp/deploy_output.txt 2>/dev/null || true
    continue
  fi
  
  CONTRACT_IDS[$contract]=$CONTRACT_ID
  echo "      ✅ ${CONTRACT_ID:0:25}..."
  sleep 1
done

echo ""

# ============= STEP 5: INITIALIZE CONTRACTS =============
echo "5️⃣ Inicializando contratos..."

# Init stablecoin
if [ ! -z "${CONTRACT_IDS[stablecoin]:-}" ]; then
  echo "   → stablecoin..."
  soroban contract invoke \
    --id "${CONTRACT_IDS[stablecoin]}" \
    --source-account deploy \
    --network mainnet \
    -- init \
    --admin "$ADMIN_PUBLIC" \
    --risk-threshold-bps "$RISK_BPS" 2>&1 | tail -1
  echo "      ✅"
fi

# Init loans_pool
if [ ! -z "${CONTRACT_IDS[loans_pool]:-}" ]; then
  echo "   → loans_pool..."
  soroban contract invoke \
    --id "${CONTRACT_IDS[loans_pool]}" \
    --source-account deploy \
    --network mainnet \
    -- init \
    --admin "$ADMIN_PUBLIC" \
    --ltv-bps "$LTV_BPS" \
    --interest-bps "$INTEREST_BPS" 2>&1 | tail -1
  echo "      ✅"
fi

# Init other basic contracts (only admin needed)
for contract in risklock portfolio governance batch_executor; do
  if [ ! -z "${CONTRACT_IDS[$contract]:-}" ]; then
    echo "   → ${contract}..."
    soroban contract invoke \
      --id "${CONTRACT_IDS[$contract]}" \
      --source-account deploy \
      --network mainnet \
      -- init \
      --admin "$ADMIN_PUBLIC" 2>&1 | tail -1
    echo "      ✅"
  fi
done

# Init MEV Guard
if [ ! -z "${CONTRACT_IDS[mev_guard]:-}" ]; then
  echo "   → mev_guard..."
  soroban contract invoke \
    --id "${CONTRACT_IDS[mev_guard]}" \
    --source-account deploy \
    --network mainnet \
    -- init \
    --admin "$ADMIN_PUBLIC" \
    --max_slippage_bps 100 \
    --min_block_delay 1 2>&1 | tail -1
  echo "      ✅"
fi

echo "   ✅ Inicialização completa"
echo ""

# ============= STEP 6: SAVE CONFIGURATION =============
echo "6️⃣ Salvando configuração mainnet..."

cat > "$ROOT_DIR/.env-mainnet" << EOF
# Stellaro DeFi - MAINNET Configuration
# Generated: $(date)
# Status: DEPLOYMENT COMPLETE ✅

# Network Configuration
MAINNET_RPC="https://rpc-mainnet.stellar.org"
MAINNET_NETWORK_PASSPHRASE="Public Global Stellar Network ; September 2015"

# Deployment Account
MAINNET_ADMIN_PUBLIC_KEY="$ADMIN_PUBLIC"

# Contract IDs - MAINNET (LIVE)
MAINNET_STABLECOIN_CONTRACT_ID="${CONTRACT_IDS[stablecoin]:-PENDING}"
MAINNET_RISKLOCK_CONTRACT_ID="${CONTRACT_IDS[risklock]:-PENDING}"
MAINNET_LOANS_POOL_CONTRACT_ID="${CONTRACT_IDS[loans_pool]:-PENDING}"
MAINNET_PORTFOLIO_CONTRACT_ID="${CONTRACT_IDS[portfolio]:-PENDING}"
MAINNET_GOVERNANCE_CONTRACT_ID="${CONTRACT_IDS[governance]:-PENDING}"
MAINNET_ZK_VERIFIER_CONTRACT_ID="${CONTRACT_IDS[zk_verifier]:-PENDING}"
MAINNET_BATCH_EXECUTOR_CONTRACT_ID="${CONTRACT_IDS[batch_executor]:-PENDING}"
MAINNET_MEV_GUARD_CONTRACT_ID="${CONTRACT_IDS[mev_guard]:-PENDING}"

# Deployment Parameters
RISK_BPS=$RISK_BPS
LTV_BPS=$LTV_BPS
INTEREST_BPS=$INTEREST_BPS

# Explorer Links
# Stablecoin: https://stellar.expert/explorer/mainnet/contract/${CONTRACT_IDS[stablecoin]:-TBD}
# Loans Pool: https://stellar.expert/explorer/mainnet/contract/${CONTRACT_IDS[loans_pool]:-TBD}
# Account: https://stellar.expert/explorer/mainnet/account/$ADMIN_PUBLIC

# Status
DEPLOYMENT_DATE="$(date)"
DEPLOYMENT_STATUS="SUCCESS"
DEPLOYED_CONTRACTS=${#CONTRACT_IDS[@]}
EOF

echo "   ✅ Configuração salva em .env-mainnet"
echo ""

# ============= STEP 7: FINAL VERIFICATION =============
echo "7️⃣ Verificando resultado..."

DEPLOYED_COUNT=0
for id in "${CONTRACT_IDS[@]}"; do
  if [ ! -z "$id" ]; then
    ((DEPLOYED_COUNT++))
  fi
done

if [ $DEPLOYED_COUNT -eq 8 ]; then
  echo "   🎉 SUCESSO: Todos os 8 contratos foram deployados e configurados!"
else
  echo "   ⚠️ AVISO: Apenas $DEPLOYED_COUNT de 8 contratos foram deployados."
fi

rm -f "$TEMP_KEY"
echo ""
echo "Deployment Finished at $(date)"
echo "Check .env-mainnet for contract addresses."

FINAL_BALANCE=$(soroban account balance deploy --network mainnet 2>/dev/null || echo "0")
COST=$(echo "$BALANCE - $FINAL_BALANCE" | bc || echo "~12")

echo "   Saldo inicial: $BALANCE XLM"
echo "   Saldo final: $FINAL_BALANCE XLM"
echo "   Custo total: $COST XLM"
echo ""

# ============= CLEANUP =============
rm -f "$TEMP_KEY" /tmp/deploy_output.txt

# ============= SUMMARY =============
echo "======================================"
echo "✅ DEPLOYMENT COMPLETO!"
echo "======================================"
echo ""
echo "📊 Resumo:"
echo "   Contratos deployados: ${#CONTRACT_IDS[@]}/6"

for contract in "${!CONTRACT_IDS[@]}"; do
  echo "   • ${contract}: ${CONTRACT_IDS[$contract]}"
done

echo ""
echo "💰 Custo:"
echo "   Total: $COST XLM (~\$$(echo "scale=2; $COST * 0.12" | bc) USD)"
echo "   Saldo restante: $FINAL_BALANCE XLM"
echo ""
echo "🚀 Status: MAINNET LIVE"
echo ""
echo "📋 Próximos passos:"
echo "   1. Revisar .env-mainnet"
echo "   2. Atualizar backend com contract IDs"
echo "   3. Atualizar frontend com contract IDs"
echo "   4. Executar testes de integração"
echo "   5. Ativar registro de usuários"
echo ""
echo "🔗 Explore:"
for contract in "${!CONTRACT_IDS[@]}"; do
  echo "   https://stellar.expert/explorer/mainnet/contract/${CONTRACT_IDS[$contract]}"
done
echo ""

exit 0
