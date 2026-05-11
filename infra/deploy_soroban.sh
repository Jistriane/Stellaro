#!/usr/bin/env bash
set -euo pipefail

# Deploy automatizado dos contratos Soroban (testnet)
# Pré-requisitos:
#  - soroban-cli >= 23 instalado
#  - rustup target add wasm32v1-none
#  - chave importada no CLI com alias (ex.: "deploy"):
#       soroban keys add deploy --secret-key   # (vai pedir para colar a chave secreta começando com S...)
#
# Uso:
#   ./infra/deploy_soroban.sh <ALIAS_DA_CONTA> [ADMIN_PUBKEY] [RISK_BPS] [LTV_BPS] [INTEREST_BPS] [MAX_SLIPPAGE_BPS] [MIN_BLOCK_DELAY]
# Ex.:
#   ./infra/deploy_soroban.sh deploy GB... 7000 6000 1500
#   ./infra/deploy_soroban.sh deploy       # (usa endereço do alias como admin e defaults 7000/6000/1500)
#
# Observação: o script é idempotente na fase de init. Ele verifica o estado dos contratos
# (ou simula o init com --send no) e só inicializa quando necessário.

ALIAS=${1:-deploy}
RPC=${RPC:-"https://soroban-testnet.stellar.org"}
PASSPHRASE=${PASSPHRASE:-"Test SDF Network ; September 2015"}

if ! command -v soroban >/dev/null 2>&1; then
  echo "Erro: soroban CLI não encontrado no PATH"
  echo "Instale com: cargo install --locked soroban-cli"
  exit 1
fi

# Descobrir a public key (admin) se não foi informada
if [[ ${2:-} == "" ]]; then
  ADMIN=$(soroban keys public-key "$ALIAS")
else
  ADMIN=$2
fi

RISK_BPS=${3:-7000}
LTV_BPS=${4:-6000}
INTEREST_BPS=${5:-1500}
MAX_SLIPPAGE_BPS=${6:-500}
MIN_BLOCK_DELAY=${7:-10}

ROOT_DIR=$(cd "$(dirname "$0")/.." && pwd)
CONTRACTS_DIR="$ROOT_DIR/contracts"

echo "==> Build dos contratos (soroban contract build)"
soroban contract build --manifest-path "$CONTRACTS_DIR/Cargo.toml" --profile release

STABLECOIN_WASM="$CONTRACTS_DIR/target/wasm32v1-none/release/stablecoin.wasm"
RISKLOCK_WASM="$CONTRACTS_DIR/target/wasm32v1-none/release/risklock.wasm"
LOANS_WASM="$CONTRACTS_DIR/target/wasm32v1-none/release/loans_pool.wasm"
PORTFOLIO_WASM="$CONTRACTS_DIR/target/wasm32v1-none/release/portfolio.wasm"
GOV_WASM="$CONTRACTS_DIR/target/wasm32v1-none/release/governance.wasm"
ZK_VERIFIER_WASM="$CONTRACTS_DIR/target/wasm32v1-none/release/zk_verifier.wasm"
VC_REGISTRY_WASM="$CONTRACTS_DIR/target/wasm32v1-none/release/vc_registry.wasm"
BATCH_EXECUTOR_WASM="$CONTRACTS_DIR/target/wasm32v1-none/release/batch_executor.wasm"
MEV_GUARD_WASM="$CONTRACTS_DIR/target/wasm32v1-none/release/mev_guard.wasm"

validate_contract_id() {
  local id="$1"
  [[ "$id" =~ ^C[A-Z0-9]{55}$|^[0-9a-fA-F]{64}$ ]]
}

ensure_wasm_exists() {
  local wasm="$1"
  local name="$2"
  if [[ ! -f "$wasm" ]]; then
    echo "Erro: WASM não encontrado para $name"
    echo "Caminho esperado: $wasm"
    exit 1
  fi
}

ensure_wasm_exists "$STABLECOIN_WASM" "stablecoin"
ensure_wasm_exists "$RISKLOCK_WASM" "risklock"
ensure_wasm_exists "$LOANS_WASM" "loans_pool"
ensure_wasm_exists "$PORTFOLIO_WASM" "portfolio"
ensure_wasm_exists "$GOV_WASM" "governance"
ensure_wasm_exists "$ZK_VERIFIER_WASM" "zk_verifier"
ensure_wasm_exists "$VC_REGISTRY_WASM" "vc_registry"
ensure_wasm_exists "$BATCH_EXECUTOR_WASM" "batch_executor"
ensure_wasm_exists "$MEV_GUARD_WASM" "mev_guard"

deploy_one() {
  local wasm="$1"
  soroban contract deploy \
    --rpc-url "$RPC" \
    --network-passphrase "$PASSPHRASE" \
    --source-account "$ALIAS" \
    --wasm "$wasm"
}

invoke_init() {
  local id="$1"; shift
  soroban contract invoke --id "$id" \
    --rpc-url "$RPC" --network-passphrase "$PASSPHRASE" \
    --source-account "$ALIAS" -- \
    "$@"
}

# Helpers idempotentes para checar se já foi inicializado
is_stablecoin_initialized() {
  local id="$1"
  # Se conseguir ler risk_threshold com send=no, consideramos inicializado
  if soroban contract invoke --id "$id" \
      --rpc-url "$RPC" --network-passphrase "$PASSPHRASE" \
      --source-account "$ALIAS" --send no -- risk_threshold >/dev/null 2>&1; then
    return 0
  fi
  return 1
}

is_loanspool_initialized() {
  local id="$1"
  if soroban contract invoke --id "$id" \
      --rpc-url "$RPC" --network-passphrase "$PASSPHRASE" \
      --source-account "$ALIAS" --send no -- params >/dev/null 2>&1; then
    return 0
  fi
  return 1
}

is_governance_initialized() {
  local id="$1"
  if soroban contract invoke --id "$id" \
      --rpc-url "$RPC" --network-passphrase "$PASSPHRASE" \
      --source-account "$ALIAS" --send no -- get_admin >/dev/null 2>&1; then
    return 0
  fi
  return 1
}

# Para portfolio/risklock não há view explícita de admin; simulamos o init.
# Se a simulação trap (InvalidAction) assumimos "already initialized".
would_init_succeed() {
  local id="$1"; shift
  # Simula a chamada; se retornar 0, o init ainda não foi feito.
  if soroban contract invoke --id "$id" \
      --rpc-url "$RPC" --network-passphrase "$PASSPHRASE" \
      --source-account "$ALIAS" --send no -- "$@" >/dev/null 2>&1; then
    return 0
  fi
  return 1
}

echo "==> Deploying stablecoin"
STABLECOIN_ID=$(deploy_one "$STABLECOIN_WASM" | grep -Eo 'C[A-Z0-9]{55}|[0-9a-fA-F]{64}' | tail -n1)
if ! validate_contract_id "$STABLECOIN_ID"; then echo "Erro: Contract ID inválido para stablecoin"; exit 1; fi
echo "STABLECOIN_ID=$STABLECOIN_ID"

echo "==> Deploying risklock"
RISKLOCK_ID=$(deploy_one "$RISKLOCK_WASM" | grep -Eo 'C[A-Z0-9]{55}|[0-9a-fA-F]{64}' | tail -n1)
if ! validate_contract_id "$RISKLOCK_ID"; then echo "Erro: Contract ID inválido para risklock"; exit 1; fi
echo "RISKLOCK_ID=$RISKLOCK_ID"

echo "==> Deploying loans_pool"
LOANSPOOL_ID=$(deploy_one "$LOANS_WASM" | grep -Eo 'C[A-Z0-9]{55}|[0-9a-fA-F]{64}' | tail -n1)
if ! validate_contract_id "$LOANSPOOL_ID"; then echo "Erro: Contract ID inválido para loans_pool"; exit 1; fi
echo "LOANSPOOL_ID=$LOANSPOOL_ID"

echo "==> Deploying portfolio"
PORTFOLIO_ID=$(deploy_one "$PORTFOLIO_WASM" | grep -Eo 'C[A-Z0-9]{55}|[0-9a-fA-F]{64}' | tail -n1)
if ! validate_contract_id "$PORTFOLIO_ID"; then echo "Erro: Contract ID inválido para portfolio"; exit 1; fi
echo "PORTFOLIO_ID=$PORTFOLIO_ID"

echo "==> Deploying governance"
GOVERNANCE_ID=$(deploy_one "$GOV_WASM" | grep -Eo 'C[A-Z0-9]{55}|[0-9a-fA-F]{64}' | tail -n1)
if ! validate_contract_id "$GOVERNANCE_ID"; then echo "Erro: Contract ID inválido para governance"; exit 1; fi
echo "GOVERNANCE_ID=$GOVERNANCE_ID"

echo "==> Deploying ZK Verifier"
ZK_VERIFIER_ID=$(deploy_one "$ZK_VERIFIER_WASM" | grep -Eo 'C[A-Z0-9]{55}|[0-9a-fA-F]{64}' | tail -n1)
if ! validate_contract_id "$ZK_VERIFIER_ID"; then echo "Erro: Contract ID inválido para zk_verifier"; exit 1; fi
echo "ZK_VERIFIER_ID=$ZK_VERIFIER_ID"

echo "==> Deploying vc_registry"
VC_REGISTRY_ID=$(deploy_one "$VC_REGISTRY_WASM" | grep -Eo 'C[A-Z0-9]{55}|[0-9a-fA-F]{64}' | tail -n1)
if ! validate_contract_id "$VC_REGISTRY_ID"; then echo "Erro: Contract ID inválido para vc_registry"; exit 1; fi
echo "VC_REGISTRY_ID=$VC_REGISTRY_ID"

echo "==> Deploying batch_executor"
BATCH_EXECUTOR_ID=$(deploy_one "$BATCH_EXECUTOR_WASM" | grep -Eo 'C[A-Z0-9]{55}|[0-9a-fA-F]{64}' | tail -n1)
if ! validate_contract_id "$BATCH_EXECUTOR_ID"; then echo "Erro: Contract ID inválido para batch_executor"; exit 1; fi
echo "BATCH_EXECUTOR_ID=$BATCH_EXECUTOR_ID"

echo "==> Deploying mev_guard"
MEV_GUARD_ID=$(deploy_one "$MEV_GUARD_WASM" | grep -Eo 'C[A-Z0-9]{55}|[0-9a-fA-F]{64}' | tail -n1)
if ! validate_contract_id "$MEV_GUARD_ID"; then echo "Erro: Contract ID inválido para mev_guard"; exit 1; fi
echo "MEV_GUARD_ID=$MEV_GUARD_ID"

# Inicializações (idempotentes)

echo "==> Init stablecoin (idempotente)"
if is_stablecoin_initialized "$STABLECOIN_ID"; then
  echo "stablecoin já inicializado; pulando."
else
  invoke_init "$STABLECOIN_ID" init --admin "$ADMIN" --risk-threshold-bps "$RISK_BPS"
fi

echo "==> Init risklock (idempotente)"
if would_init_succeed "$RISKLOCK_ID" init --admin "$ADMIN"; then
  invoke_init "$RISKLOCK_ID" init --admin "$ADMIN"
else
  echo "risklock já inicializado; pulando."
fi

echo "==> Init loans_pool (idempotente)"
if is_loanspool_initialized "$LOANSPOOL_ID"; then
  echo "loans_pool já inicializado; pulando."
else
  invoke_init "$LOANSPOOL_ID" init --admin "$ADMIN" --ltv-bps "$LTV_BPS" --interest-bps "$INTEREST_BPS" --zk-verifier "$ZK_VERIFIER_ID" --vc-registry "$VC_REGISTRY_ID"
fi

echo "==> Init portfolio (idempotente)"
if would_init_succeed "$PORTFOLIO_ID" init --admin "$ADMIN"; then
  invoke_init "$PORTFOLIO_ID" init --admin "$ADMIN"
else
  echo "portfolio já inicializado; pulando."
fi

echo "==> Init governance (idempotente)"
if is_governance_initialized "$GOVERNANCE_ID"; then
  echo "governance já inicializado; pulando."
else
  invoke_init "$GOVERNANCE_ID" init --admin "$ADMIN"
fi

echo "==> Init vc_registry (idempotente)"
if soroban contract invoke --id "$VC_REGISTRY_ID" \
    --rpc-url "$RPC" --network-passphrase "$PASSPHRASE" \
    --source-account "$ALIAS" --send no -- is_issuer --issuer "$ADMIN" >/dev/null 2>&1; then
  echo "vc_registry já inicializado; pulando."
else
  invoke_init "$VC_REGISTRY_ID" initialize --admin "$ADMIN"
fi

echo "==> Init batch_executor (idempotente)"
if soroban contract invoke --id "$BATCH_EXECUTOR_ID" \
    --rpc-url "$RPC" --network-passphrase "$PASSPHRASE" \
    --source-account "$ALIAS" --send no -- get_admin >/dev/null 2>&1; then
  echo "batch_executor já inicializado; pulando."
else
  invoke_init "$BATCH_EXECUTOR_ID" init --admin "$ADMIN"
fi

echo "==> Init mev_guard (idempotente)"
if soroban contract invoke --id "$MEV_GUARD_ID" \
    --rpc-url "$RPC" --network-passphrase "$PASSPHRASE" \
    --source-account "$ALIAS" --send no -- get_admin >/dev/null 2>&1; then
  echo "mev_guard já inicializado; pulando."
else
  invoke_init "$MEV_GUARD_ID" init \
    --admin "$ADMIN" \
    --max-slippage-bps "$MAX_SLIPPAGE_BPS" \
    --min-block-delay "$MIN_BLOCK_DELAY"
fi

# Persistência dos IDs em .env-dev

upsert_env_var() {
  local file="$1" key="$2" value="$3"
  mkdir -p "$(dirname "$file")"
  touch "$file"
  if grep -qE "^${key}=" "$file"; then
    sed -i "s|^${key}=.*|${key}=${value}|" "$file"
  else
    echo "${key}=${value}" >>"$file"
  fi
}

persist_envs() {
  local file="$1"
  upsert_env_var "$file" STABLECOIN_CONTRACT_ID "$STABLECOIN_ID"
  upsert_env_var "$file" RISKLOCK_CONTRACT_ID "$RISKLOCK_ID"
  upsert_env_var "$file" LOANSPOOL_CONTRACT_ID "$LOANSPOOL_ID"
  upsert_env_var "$file" PORTFOLIO_CONTRACT_ID "$PORTFOLIO_ID"
  upsert_env_var "$file" GOVERNANCE_CONTRACT_ID "$GOVERNANCE_ID"
  upsert_env_var "$file" ZK_VERIFIER_CONTRACT_ID "$ZK_VERIFIER_ID"
  upsert_env_var "$file" VC_REGISTRY_ID "$VC_REGISTRY_ID"
  upsert_env_var "$file" VC_REGISTRY_CONTRACT_ID "$VC_REGISTRY_ID"
  upsert_env_var "$file" BATCH_EXECUTOR_CONTRACT_ID "$BATCH_EXECUTOR_ID"
  upsert_env_var "$file" MEV_GUARD_CONTRACT_ID "$MEV_GUARD_ID"
  upsert_env_var "$file" STELLAR_PUBLIC_KEY "$ADMIN"
}

ROOT_ENV="$ROOT_DIR/.env-dev"
BACKEND_ENV="$ROOT_DIR/apps/backend/.env-dev"

echo "==> Persistindo IDs em ${ROOT_ENV}"
persist_envs "$ROOT_ENV"

if [[ -f "$BACKEND_ENV" ]]; then
  echo "==> Atualizando ${BACKEND_ENV}"
  persist_envs "$BACKEND_ENV"
else
  echo "==> (Opcional) Crie $BACKEND_ENV para consumir variáveis no backend."
fi

cat <<EOF

==== Deploy Concluído ====
STABLECOIN_ID=$STABLECOIN_ID
RISKLOCK_ID=$RISKLOCK_ID
LOANSPOOL_ID=$LOANSPOOL_ID
PORTFOLIO_ID=$PORTFOLIO_ID
GOVERNANCE_ID=$GOVERNANCE_ID
ZK_VERIFIER_ID=$ZK_VERIFIER_ID
VC_REGISTRY_ID=$VC_REGISTRY_ID
BATCH_EXECUTOR_ID=$BATCH_EXECUTOR_ID
MEV_GUARD_ID=$MEV_GUARD_ID
==========================

Dica: IDs gravados em $ROOT_ENV. Se existir, também atualizado: $BACKEND_ENV
EOF
