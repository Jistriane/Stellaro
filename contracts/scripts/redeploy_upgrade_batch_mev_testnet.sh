#!/usr/bin/env bash
set -euo pipefail

# Minimal upgrade redeploy for Batch Executor + MEV Guard on testnet.
# It deploys new contract instances, initializes them, updates env files,
# and runs post-upgrade validation when requested.
#
# Usage:
#   ./contracts/scripts/redeploy_upgrade_batch_mev_testnet.sh <ACCOUNT_ALIAS>
#
# Optional env vars:
#   RPC, PASSPHRASE
#   ENV_FILE_PRIMARY (default: contracts/.env-testnet)
#   ENV_FILE_SECONDARY (default: .env-dev)
#   MAX_SLIPPAGE_BPS (default: 500)
#   MIN_BLOCK_DELAY (default: 10)
#   RUN_POST_VALIDATE (default: 1)

ALIAS="${1:-deploy}"
RPC="${RPC:-https://soroban-testnet.stellar.org}"
PASSPHRASE="${PASSPHRASE:-Test SDF Network ; September 2015}"
MAX_SLIPPAGE_BPS="${MAX_SLIPPAGE_BPS:-500}"
MIN_BLOCK_DELAY="${MIN_BLOCK_DELAY:-10}"
RUN_POST_VALIDATE="${RUN_POST_VALIDATE:-1}"

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
CONTRACTS_DIR="${ROOT_DIR}/contracts"
ENV_FILE_PRIMARY="${ENV_FILE_PRIMARY:-${CONTRACTS_DIR}/.env-testnet}"
ENV_FILE_SECONDARY="${ENV_FILE_SECONDARY:-${ROOT_DIR}/.env-dev}"

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "ERROR: missing command '$1'"
    exit 1
  fi
}

validate_contract_id() {
  local id="$1"
  [[ "$id" =~ ^C[A-Z0-9]{55}$|^[0-9a-fA-F]{64}$ ]]
}

ensure_wasm_exists() {
  local wasm="$1"
  local name="$2"
  if [[ ! -f "$wasm" ]]; then
    echo "ERROR: WASM not found for ${name}: ${wasm}"
    exit 1
  fi
}

backup_if_exists() {
  local file="$1"
  if [[ -f "$file" ]]; then
    cp "$file" "${file}.bak.$(date +%Y%m%d%H%M%S)"
  fi
}

upsert_env_var() {
  local file="$1"
  local key="$2"
  local value="$3"
  mkdir -p "$(dirname "$file")"
  touch "$file"
  if grep -qE "^${key}=" "$file"; then
    sed -i "s|^${key}=.*|${key}=${value}|" "$file"
  else
    echo "${key}=${value}" >> "$file"
  fi
}

deploy_one() {
  local wasm="$1"
  soroban contract deploy \
    --rpc-url "$RPC" \
    --network-passphrase "$PASSPHRASE" \
    --source-account "$ALIAS" \
    --wasm "$wasm"
}

invoke_init() {
  local id="$1"
  shift
  soroban contract invoke \
    --id "$id" \
    --rpc-url "$RPC" \
    --network-passphrase "$PASSPHRASE" \
    --source-account "$ALIAS" \
    -- "$@"
}

require_cmd soroban
require_cmd grep
require_cmd sed

ADMIN="$(soroban keys public-key "$ALIAS")"

echo "== Stellaro Minimal Upgrade Redeploy (Batch + MEV) =="
echo "Alias: ${ALIAS}"
echo "Admin: ${ADMIN}"
echo "RPC: ${RPC}"
echo "Primary env: ${ENV_FILE_PRIMARY}"
echo "Secondary env: ${ENV_FILE_SECONDARY}"

echo
echo "[1/5] Build contracts"
soroban contract build --manifest-path "${CONTRACTS_DIR}/Cargo.toml" --profile release

BATCH_WASM="${CONTRACTS_DIR}/target/wasm32v1-none/release/batch_executor.wasm"
MEV_WASM="${CONTRACTS_DIR}/target/wasm32v1-none/release/mev_guard.wasm"

ensure_wasm_exists "$BATCH_WASM" "batch_executor"
ensure_wasm_exists "$MEV_WASM" "mev_guard"

echo
echo "[2/5] Deploy batch_executor"
BATCH_NEW_ID="$(deploy_one "$BATCH_WASM" | grep -Eo 'C[A-Z0-9]{55}|[0-9a-fA-F]{64}' | tail -n1)"
if ! validate_contract_id "$BATCH_NEW_ID"; then
  echo "ERROR: invalid contract id for batch_executor: ${BATCH_NEW_ID}"
  exit 1
fi
echo "BATCH_EXECUTOR_CONTRACT_ID=${BATCH_NEW_ID}"

echo
echo "[3/5] Deploy mev_guard"
MEV_NEW_ID="$(deploy_one "$MEV_WASM" | grep -Eo 'C[A-Z0-9]{55}|[0-9a-fA-F]{64}' | tail -n1)"
if ! validate_contract_id "$MEV_NEW_ID"; then
  echo "ERROR: invalid contract id for mev_guard: ${MEV_NEW_ID}"
  exit 1
fi
echo "MEV_GUARD_CONTRACT_ID=${MEV_NEW_ID}"

echo
echo "[4/5] Initialize new instances"
invoke_init "$BATCH_NEW_ID" init --admin "$ADMIN"
invoke_init "$MEV_NEW_ID" init --admin "$ADMIN" --max-slippage-bps "$MAX_SLIPPAGE_BPS" --min-block-delay "$MIN_BLOCK_DELAY"

echo
echo "[5/5] Persist IDs"
backup_if_exists "$ENV_FILE_PRIMARY"
upsert_env_var "$ENV_FILE_PRIMARY" BATCH_EXECUTOR_CONTRACT_ID "$BATCH_NEW_ID"
upsert_env_var "$ENV_FILE_PRIMARY" MEV_GUARD_CONTRACT_ID "$MEV_NEW_ID"
upsert_env_var "$ENV_FILE_PRIMARY" SOURCE_ADDRESS "$ADMIN"

backup_if_exists "$ENV_FILE_SECONDARY"
upsert_env_var "$ENV_FILE_SECONDARY" BATCH_EXECUTOR_CONTRACT_ID "$BATCH_NEW_ID"
upsert_env_var "$ENV_FILE_SECONDARY" MEV_GUARD_CONTRACT_ID "$MEV_NEW_ID"
upsert_env_var "$ENV_FILE_SECONDARY" STELLAR_PUBLIC_KEY "$ADMIN"

echo "Updated: ${ENV_FILE_PRIMARY}"
echo "Updated: ${ENV_FILE_SECONDARY}"

if [[ "$RUN_POST_VALIDATE" == "1" ]]; then
  echo
  echo "Running post-upgrade validator..."
  SOURCE_ADDRESS="$ADMIN" \
  SIGN_WITH_KEY="$ALIAS" \
  STABLECOIN_CONTRACT_ID="${STABLECOIN_CONTRACT_ID:-}" \
  BATCH_EXECUTOR_CONTRACT_ID="$BATCH_NEW_ID" \
  MEV_GUARD_CONTRACT_ID="$MEV_NEW_ID" \
  SOROSWAP_ROUTER_CONTRACT_ID="${SOROSWAP_ROUTER_CONTRACT_ID:-}" \
  bash "${CONTRACTS_DIR}/scripts/testnet_post_upgrade_validate.sh" "$ENV_FILE_PRIMARY"
fi

echo
echo "Redeploy completed."
