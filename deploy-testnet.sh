#!/usr/bin/env bash
set -euo pipefail

# ============================================================================
# Deploy Automático - Stellaro Testnet
# ============================================================================
# Este script faz o deploy completo de todos os contratos Soroban na testnet
# de forma idempotente e automática.
#
# Pré-requisitos:
#  - soroban-cli >= 23 instalado
#  - rustup target add wasm32v1-none
#  - chave "stellaro-testnet-deploy" configurada no soroban CLI
#
# Uso:
#   ./deploy-testnet.sh
# ============================================================================

echo "🚀 Iniciando deploy automático na Stellar Testnet..."
echo ""

if ! command -v soroban >/dev/null 2>&1; then
  echo "❌ Erro: soroban CLI não encontrado no PATH"
  echo "   Instale com: cargo install --locked soroban-cli"
  exit 1
fi

# Configurações
ALIAS="stellaro-testnet-deploy"
RPC="https://soroban-testnet.stellar.org"
PASSPHRASE="Test SDF Network ; September 2015"
ROOT_DIR=$(cd "$(dirname "$0")" && pwd)
CONTRACTS_DIR="$ROOT_DIR/contracts"

# Parâmetros dos contratos
RISK_BPS=7000      # 70% risk threshold
LTV_BPS=6000       # 60% Loan-to-Value
INTEREST_BPS=1500  # 15% APY
MAX_SLIPPAGE_BPS=500 # 5% max slippage para MEV Guard
MIN_BLOCK_DELAY=10   # delay mínimo (em blocos) para criação de ordens protegidas

# Verificar se a chave existe
echo "🔑 Verificando chave de deploy..."
if ! soroban keys show "$ALIAS" >/dev/null 2>&1; then
  echo "❌ Erro: Chave '$ALIAS' não encontrada!"
  echo "   Execute: soroban keys generate $ALIAS --network testnet"
  exit 1
fi

# Obter endereço público da chave
ADMIN=$(soroban keys address "$ALIAS")
echo "✓ Admin: $ADMIN"
echo ""

# Build dos contratos
echo "🔨 Compilando contratos Soroban..."
cd "$CONTRACTS_DIR"
soroban contract build --profile release
cd "$ROOT_DIR"
echo "✓ Contratos compilados"
echo ""

# Definir caminhos dos WASMs
STABLECOIN_WASM="$CONTRACTS_DIR/target/wasm32v1-none/release/stablecoin.wasm"
RISKLOCK_WASM="$CONTRACTS_DIR/target/wasm32v1-none/release/risklock.wasm"
LOANS_WASM="$CONTRACTS_DIR/target/wasm32v1-none/release/loans_pool.wasm"
PORTFOLIO_WASM="$CONTRACTS_DIR/target/wasm32v1-none/release/portfolio.wasm"
GOV_WASM="$CONTRACTS_DIR/target/wasm32v1-none/release/governance.wasm"
ZK_VERIFIER_WASM="$CONTRACTS_DIR/target/wasm32v1-none/release/zk_verifier.wasm"
BATCH_EXECUTOR_WASM="$CONTRACTS_DIR/target/wasm32v1-none/release/batch_executor.wasm"
MEV_GUARD_WASM="$CONTRACTS_DIR/target/wasm32v1-none/release/mev_guard.wasm"

validate_contract_id() {
  local id="$1"
  [[ "$id" =~ ^C[A-Z0-9]{55}$ ]]
}

ensure_wasm_exists() {
  local wasm="$1"
  local name="$2"
  if [[ ! -f "$wasm" ]]; then
    echo "❌ Erro: WASM não encontrado para $name"
    echo "   Caminho esperado: $wasm"
    exit 1
  fi
}

ensure_wasm_exists "$STABLECOIN_WASM" "Stablecoin"
ensure_wasm_exists "$RISKLOCK_WASM" "RiskLock"
ensure_wasm_exists "$LOANS_WASM" "Loans Pool"
ensure_wasm_exists "$PORTFOLIO_WASM" "Portfolio"
ensure_wasm_exists "$GOV_WASM" "Governance"
ensure_wasm_exists "$ZK_VERIFIER_WASM" "ZK Verifier"
ensure_wasm_exists "$BATCH_EXECUTOR_WASM" "Batch Executor"
ensure_wasm_exists "$MEV_GUARD_WASM" "MEV Guard"

# Função de deploy
deploy_contract() {
  local wasm="$1"
  local name="$2"
  
  echo "📦 Deploying $name..."
  local id
  id=$(soroban contract deploy \
    --rpc-url "$RPC" \
    --network-passphrase "$PASSPHRASE" \
    --source-account "$ALIAS" \
    --wasm "$wasm" 2>&1 | grep -Eo 'C[A-Z0-9]{55}' | head -n1)
  
  if [[ -z "$id" ]] || ! validate_contract_id "$id"; then
    echo "❌ Erro ao fazer deploy de $name"
    exit 1
  fi
  
  echo "✓ $name: $id"
  echo "$id"
}

# Função de inicialização
init_contract() {
  local id="$1"
  local name="$2"
  shift 2
  
  echo "⚙️  Inicializando $name..."
  if soroban contract invoke --id "$id" \
      --rpc-url "$RPC" \
      --network-passphrase "$PASSPHRASE" \
      --source-account "$ALIAS" \
      -- "$@" >/dev/null 2>&1; then
    echo "✓ $name inicializado"
  else
    echo "⚠️  $name já estava inicializado ou erro na inicialização"
  fi
}

# Verificar se já está inicializado
is_initialized() {
  local id="$1"
  local method="$2"
  
  soroban contract invoke --id "$id" \
    --rpc-url "$RPC" \
    --network-passphrase "$PASSPHRASE" \
    --source-account "$ALIAS" \
    --send no \
    -- "$method" >/dev/null 2>&1
}

# ============================================================================
# DEPLOY DOS CONTRATOS
# ============================================================================

echo "📝 Iniciando deploy dos contratos..."
echo ""

# 1. Stablecoin
STABLECOIN_ID=$(deploy_contract "$STABLECOIN_WASM" "Stablecoin (STLT-BRL)")
sleep 2

# 2. RiskLock
RISKLOCK_ID=$(deploy_contract "$RISKLOCK_WASM" "RiskLock")
sleep 2

# 3. Loans Pool
LOANSPOOL_ID=$(deploy_contract "$LOANS_WASM" "Loans Pool")
sleep 2

# 4. Portfolio
PORTFOLIO_ID=$(deploy_contract "$PORTFOLIO_WASM" "Portfolio")
sleep 2

# 5. Governance
GOVERNANCE_ID=$(deploy_contract "$GOV_WASM" "Governance")
sleep 2

# 6. ZK Verifier
ZK_VERIFIER_ID=$(deploy_contract "$ZK_VERIFIER_WASM" "ZK Verifier")
sleep 2

# 7. Batch Executor
BATCH_EXECUTOR_ID=$(deploy_contract "$BATCH_EXECUTOR_WASM" "Batch Executor")
sleep 2

# 8. MEV Guard
MEV_GUARD_ID=$(deploy_contract "$MEV_GUARD_WASM" "MEV Guard")
sleep 2

echo ""
echo "✅ Todos os contratos foram deployados!"
echo ""

# ============================================================================
# INICIALIZAÇÃO DOS CONTRATOS
# ============================================================================

echo "⚙️  Iniciando inicialização dos contratos..."
echo ""

# 1. Stablecoin
if is_initialized "$STABLECOIN_ID" "risk_threshold"; then
  echo "⚠️  Stablecoin já inicializado"
else
  init_contract "$STABLECOIN_ID" "Stablecoin" \
    init --admin "$ADMIN" --risk-threshold-bps "$RISK_BPS"
fi
sleep 1

# 2. RiskLock
init_contract "$RISKLOCK_ID" "RiskLock" \
  init --admin "$ADMIN"
sleep 1

# 3. Loans Pool
if is_initialized "$LOANSPOOL_ID" "params"; then
  echo "⚠️  Loans Pool já inicializado"
else
  init_contract "$LOANSPOOL_ID" "Loans Pool" \
    init --admin "$ADMIN" --ltv-bps "$LTV_BPS" --interest-bps "$INTEREST_BPS"
fi
sleep 1

# 4. Portfolio
init_contract "$PORTFOLIO_ID" "Portfolio" \
  init --admin "$ADMIN"
sleep 1

# 5. Governance
if is_initialized "$GOVERNANCE_ID" "get_admin"; then
  echo "⚠️  Governance já inicializado"
else
  init_contract "$GOVERNANCE_ID" "Governance" \
    init --admin "$ADMIN"
fi
sleep 1

# 6. ZK Verifier
echo "⚠️  ZK Verifier requer inicialização manual com verification key"
echo "   Use: tools/zk/export_vk.sh"

# 7. Batch Executor
if is_initialized "$BATCH_EXECUTOR_ID" "get_admin"; then
  echo "⚠️  Batch Executor já inicializado"
else
  init_contract "$BATCH_EXECUTOR_ID" "Batch Executor" \
    init --admin "$ADMIN"
fi
sleep 1

# 8. MEV Guard
if is_initialized "$MEV_GUARD_ID" "get_admin"; then
  echo "⚠️  MEV Guard já inicializado"
else
  init_contract "$MEV_GUARD_ID" "MEV Guard" \
    init --admin "$ADMIN" --max-slippage-bps "$MAX_SLIPPAGE_BPS" --min-block-delay "$MIN_BLOCK_DELAY"
fi

echo ""
echo "✅ Inicialização concluída!"
echo ""

# ============================================================================
# PERSISTIR VARIÁVEIS DE AMBIENTE
# ============================================================================

upsert_env_var() {
  local file="$1" key="$2" value="$3"
  mkdir -p "$(dirname "$file")"
  touch "$file"
  if grep -qE "^${key}=" "$file" 2>/dev/null; then
    sed -i "s|^${key}=.*|${key}=${value}|" "$file"
  else
    echo "${key}=${value}" >>"$file"
  fi
}

ROOT_ENV="$ROOT_DIR/.env-testnet"
BACKEND_ENV="$ROOT_DIR/apps/backend/.env-testnet"

echo "💾 Salvando configurações em arquivos .env..."

# Criar/atualizar .env-testnet na raiz
upsert_env_var "$ROOT_ENV" "STELLAR_NETWORK" "testnet"
upsert_env_var "$ROOT_ENV" "SOROBAN_RPC_URL" "$RPC"
upsert_env_var "$ROOT_ENV" "HORIZON_URL" "https://horizon-testnet.stellar.org"
upsert_env_var "$ROOT_ENV" "STELLAR_PUBLIC_KEY" "$ADMIN"
upsert_env_var "$ROOT_ENV" "STABLECOIN_CONTRACT_ID" "$STABLECOIN_ID"
upsert_env_var "$ROOT_ENV" "RISKLOCK_CONTRACT_ID" "$RISKLOCK_ID"
upsert_env_var "$ROOT_ENV" "LOANSPOOL_CONTRACT_ID" "$LOANSPOOL_ID"
upsert_env_var "$ROOT_ENV" "PORTFOLIO_CONTRACT_ID" "$PORTFOLIO_ID"
upsert_env_var "$ROOT_ENV" "GOVERNANCE_CONTRACT_ID" "$GOVERNANCE_ID"
upsert_env_var "$ROOT_ENV" "ZK_VERIFIER_CONTRACT_ID" "$ZK_VERIFIER_ID"
upsert_env_var "$ROOT_ENV" "BATCH_EXECUTOR_CONTRACT_ID" "$BATCH_EXECUTOR_ID"
upsert_env_var "$ROOT_ENV" "MEV_GUARD_CONTRACT_ID" "$MEV_GUARD_ID"

# Criar/atualizar .env-testnet no backend
if [[ -d "$ROOT_DIR/apps/backend" ]]; then
  upsert_env_var "$BACKEND_ENV" "STELLAR_NETWORK" "testnet"
  upsert_env_var "$BACKEND_ENV" "SOROBAN_RPC_URL" "$RPC"
  upsert_env_var "$BACKEND_ENV" "HORIZON_URL" "https://horizon-testnet.stellar.org"
  upsert_env_var "$BACKEND_ENV" "STELLAR_PUBLIC_KEY" "$ADMIN"
  upsert_env_var "$BACKEND_ENV" "STABLECOIN_CONTRACT_ID" "$STABLECOIN_ID"
  upsert_env_var "$BACKEND_ENV" "RISKLOCK_CONTRACT_ID" "$RISKLOCK_ID"
  upsert_env_var "$BACKEND_ENV" "LOANSPOOL_CONTRACT_ID" "$LOANSPOOL_ID"
  upsert_env_var "$BACKEND_ENV" "PORTFOLIO_CONTRACT_ID" "$PORTFOLIO_ID"
  upsert_env_var "$BACKEND_ENV" "GOVERNANCE_CONTRACT_ID" "$GOVERNANCE_ID"
  upsert_env_var "$BACKEND_ENV" "ZK_VERIFIER_CONTRACT_ID" "$ZK_VERIFIER_ID"
  upsert_env_var "$BACKEND_ENV" "BATCH_EXECUTOR_CONTRACT_ID" "$BATCH_EXECUTOR_ID"
  upsert_env_var "$BACKEND_ENV" "MEV_GUARD_CONTRACT_ID" "$MEV_GUARD_ID"
fi

echo "✓ Configurações salvas em: $ROOT_ENV"
if [[ -f "$BACKEND_ENV" ]]; then
  echo "✓ Configurações salvas em: $BACKEND_ENV"
fi
echo ""

# ============================================================================
# RESUMO FINAL
# ============================================================================

cat <<EOF
╔════════════════════════════════════════════════════════════════════════╗
║                    DEPLOY TESTNET CONCLUÍDO! 🎉                        ║
╚════════════════════════════════════════════════════════════════════════╝

🌐 Network:        Stellar Testnet
👤 Admin:          $ADMIN

📦 Contratos Deployados:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  1. Stablecoin:   $STABLECOIN_ID
  2. RiskLock:     $RISKLOCK_ID
  3. Loans Pool:   $LOANSPOOL_ID
  4. Portfolio:    $PORTFOLIO_ID
  5. Governance:   $GOVERNANCE_ID
  6. ZK Verifier:  $ZK_VERIFIER_ID
  7. Batch Exec.:  $BATCH_EXECUTOR_ID
  8. MEV Guard:    $MEV_GUARD_ID

⚙️  Parâmetros Configurados:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  • Risk Threshold:  ${RISK_BPS} bps (70%)
  • LTV Ratio:       ${LTV_BPS} bps (60%)
  • Interest Rate:   ${INTEREST_BPS} bps (15% APY)
  • Max Slippage:    ${MAX_SLIPPAGE_BPS} bps (5%)
  • Min Block Delay: ${MIN_BLOCK_DELAY}

📁 Arquivos Atualizados:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  • $ROOT_ENV
  • $BACKEND_ENV

🔍 Próximos Passos:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  1. Inicializar ZK Verifier com verification key:
     ./tools/zk/export_vk.sh

  2. Verificar contratos na Stellar Expert:
     https://stellar.expert/explorer/testnet

  3. Iniciar backend em modo testnet:
     cd apps/backend && npm run start:dev

  4. Executar testes de integração:
     npm run test:e2e

╔════════════════════════════════════════════════════════════════════════╗
║                      ✨ Deploy bem-sucedido! ✨                        ║
╚════════════════════════════════════════════════════════════════════════╝
EOF
