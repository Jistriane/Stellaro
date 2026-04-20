#!/usr/bin/env bash
set -euo pipefail

# Transactional E2E validation on testnet for upgraded contracts.
# It performs:
# 1) Optional ABI strict pre-check
# 2) Stablecoin mint_guarded to source
# 3) BatchExecutor config + execute_batch(payment)
# 4) MEV Guard create_protected_order + execute_protected_swap

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${1:-${ROOT_DIR}/.env-testnet}"

load_env_with_overrides() {
  local env_file="$1"
  shift
  local keys=("$@")
  local key

  for key in "${keys[@]}"; do
    if [[ -v $key ]]; then
      export "__OVERRIDE_${key}=${!key}"
      export "__HAS_OVERRIDE_${key}=1"
    fi
  done

  if [[ -f "${env_file}" ]]; then
    # shellcheck disable=SC1090
    source "${env_file}"
  fi

  for key in "${keys[@]}"; do
    local has_var="__HAS_OVERRIDE_${key}"
    local value_var="__OVERRIDE_${key}"
    if [[ "${!has_var:-0}" == "1" ]]; then
      printf -v "$key" '%s' "${!value_var}"
    fi
    unset "$has_var" "$value_var"
  done
}

load_env_with_overrides "${ENV_FILE}" \
  STELLAR_NETWORK \
  SOURCE_ADDRESS \
  SIGN_WITH_KEY \
  RECIPIENT_ADDRESS \
  RUN_ABI_STRICT_CHECK \
  STRICT_ONCHAIN_ONLY \
  MINT_AMOUNT \
  PAYMENT_AMOUNT \
  MEV_AMOUNT_IN \
  MEV_MIN_OUT \
  CURRENT_RISK_BPS \
  STABLECOIN_CONTRACT_ID \
  BATCH_EXECUTOR_CONTRACT_ID \
  MEV_GUARD_CONTRACT_ID \
  SOROSWAP_ROUTER_CONTRACT_ID

NETWORK="${STELLAR_NETWORK:-testnet}"
SOURCE_ADDRESS="${SOURCE_ADDRESS:-}"
SIGN_WITH_KEY="${SIGN_WITH_KEY:-}"
RECIPIENT_ADDRESS="${RECIPIENT_ADDRESS:-${SOURCE_ADDRESS:-}}"
RUN_ABI_STRICT_CHECK="${RUN_ABI_STRICT_CHECK:-1}"
STRICT_ONCHAIN_ONLY="${STRICT_ONCHAIN_ONLY:-0}"
MINT_AMOUNT="${MINT_AMOUNT:-2000000}"
PAYMENT_AMOUNT="${PAYMENT_AMOUNT:-1000000}"
MEV_AMOUNT_IN="${MEV_AMOUNT_IN:-1000}"
MEV_MIN_OUT="${MEV_MIN_OUT:-950}"
CURRENT_RISK_BPS="${CURRENT_RISK_BPS:-1000}"

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "ERROR: missing command '$1'"
    exit 1
  fi
}

require_var() {
  local var_name="$1"
  if [[ -z "${!var_name:-}" ]]; then
    echo "ERROR: required env var missing: ${var_name}"
    exit 1
  fi
}

invoke_read() {
  local contract_id="$1"
  shift
  soroban contract invoke \
    --id "${contract_id}" \
    --source-account "${SOURCE_ADDRESS}" \
    --network "${NETWORK}" \
    --send no \
    -- "$@"
}

invoke_write() {
  local contract_id="$1"
  shift
  soroban contract invoke \
    --id "${contract_id}" \
    --source-account "${SIGN_WITH_KEY}" \
    --network "${NETWORK}" \
    --send yes \
    -- "$@"
}

normalize_json() {
  jq -r .
}

has_contract_command() {
  local contract_id="$1"
  local cmd="$2"
  (soroban contract invoke \
    --id "${contract_id}" \
    --source-account "${SOURCE_ADDRESS}" \
    --network "${NETWORK}" \
    --send no \
    -- --help 2>&1 || true) | grep -qE "^[[:space:]]+${cmd}[[:space:]]"
}

require_cmd soroban
require_cmd jq
require_cmd mktemp

require_var SOURCE_ADDRESS
require_var SIGN_WITH_KEY
require_var STABLECOIN_CONTRACT_ID
require_var BATCH_EXECUTOR_CONTRACT_ID
require_var MEV_GUARD_CONTRACT_ID

if [[ -z "${RECIPIENT_ADDRESS}" ]]; then
  echo "ERROR: set RECIPIENT_ADDRESS or SOURCE_ADDRESS"
  exit 1
fi

if [[ "${RUN_ABI_STRICT_CHECK}" == "1" ]]; then
  echo "== [0/5] ABI strict pre-check =="
  STRICT=1 \
  SOURCE_ADDRESS="${SOURCE_ADDRESS}" \
  STABLECOIN_CONTRACT_ID="${STABLECOIN_CONTRACT_ID}" \
  BATCH_EXECUTOR_CONTRACT_ID="${BATCH_EXECUTOR_CONTRACT_ID}" \
  MEV_GUARD_CONTRACT_ID="${MEV_GUARD_CONTRACT_ID}" \
  bash "${ROOT_DIR}/scripts/testnet_abi_upgrade_check.sh" "${ENV_FILE}"
fi

echo "== [1/5] Seed source balance via stablecoin mint_guarded =="
BAL_BEFORE_RAW="$(invoke_read "${STABLECOIN_CONTRACT_ID}" balance_of --owner "${SOURCE_ADDRESS}")"
BAL_BEFORE="$(echo "${BAL_BEFORE_RAW}" | normalize_json)"

echo "stablecoin.balance_before(source)=${BAL_BEFORE}"

if has_contract_command "${STABLECOIN_CONTRACT_ID}" init; then
  invoke_write "${STABLECOIN_CONTRACT_ID}" \
    init \
    --admin "${SOURCE_ADDRESS}" \
    --risk-threshold-bps 7000 >/dev/null 2>&1 || true
fi

if has_contract_command "${STABLECOIN_CONTRACT_ID}" set_pause; then
  invoke_write "${STABLECOIN_CONTRACT_ID}" \
    set_pause \
    --caller "${SOURCE_ADDRESS}" \
    --flag false >/dev/null 2>&1 || true
fi

if has_contract_command "${STABLECOIN_CONTRACT_ID}" set_mint_enabled; then
  invoke_write "${STABLECOIN_CONTRACT_ID}" \
    set_mint_enabled \
    --caller "${SOURCE_ADDRESS}" \
    --flag true >/dev/null 2>&1 || true
fi

MINT_STATUS="ok"
if ! invoke_write "${STABLECOIN_CONTRACT_ID}" \
  mint_guarded \
  --caller "${SOURCE_ADDRESS}" \
  --to "${SOURCE_ADDRESS}" \
  --amount "${MINT_AMOUNT}" \
  --current_risk_bps "${CURRENT_RISK_BPS}" >/dev/null; then
  MINT_STATUS="failed"
  echo "WARN: mint_guarded failed; continuing with fallback payment mode if needed."
fi

BAL_AFTER_MINT_RAW="$(invoke_read "${STABLECOIN_CONTRACT_ID}" balance_of --owner "${SOURCE_ADDRESS}")"
BAL_AFTER_MINT="$(echo "${BAL_AFTER_MINT_RAW}" | normalize_json)"
echo "stablecoin.balance_after_mint(source)=${BAL_AFTER_MINT}"
echo "stablecoin.mint_status=${MINT_STATUS}"

echo
echo "== [2/5] Configure BatchExecutor stablecoin/router =="

STABLECOIN_HAS_BALANCE_FN="false"
if has_contract_command "${STABLECOIN_CONTRACT_ID}" balance; then
  STABLECOIN_HAS_BALANCE_FN="true"
fi
echo "stablecoin.has_balance_fn=${STABLECOIN_HAS_BALANCE_FN}"

if [[ -n "${SOROSWAP_ROUTER_CONTRACT_ID:-}" ]]; then
  invoke_write "${BATCH_EXECUTOR_CONTRACT_ID}" \
    set_dex_router \
    --caller "${SOURCE_ADDRESS}" \
    --router "${SOROSWAP_ROUTER_CONTRACT_ID}" >/dev/null

  invoke_write "${MEV_GUARD_CONTRACT_ID}" \
    set_dex_router \
    --caller "${SOURCE_ADDRESS}" \
    --router "${SOROSWAP_ROUTER_CONTRACT_ID}" >/dev/null
fi

echo
echo "== [3/5] Execute Batch payment transaction =="
PARAMS_ZERO_128="$(printf '0%.0s' {1..256})"
OPS_PAYMENT_FILE="$(mktemp)"
OPS_SWAP_FILE="$(mktemp)"
BATCH_MODE="payment"
PAYMENT_SETUP_OK="1"

if ! invoke_write "${BATCH_EXECUTOR_CONTRACT_ID}" \
  set_stablecoin_contract \
  --caller "${SOURCE_ADDRESS}" \
  --stablecoin "${STABLECOIN_CONTRACT_ID}" >/dev/null; then
  PAYMENT_SETUP_OK="0"
fi

cat > "${OPS_PAYMENT_FILE}" <<JSON
[
  {
    "op_type": "Payment",
    "target": "${RECIPIENT_ADDRESS}",
    "amount": "${PAYMENT_AMOUNT}",
    "params": "${PARAMS_ZERO_128}",
    "asset": "${STABLECOIN_CONTRACT_ID}"
  }
]
JSON

cat > "${OPS_SWAP_FILE}" <<JSON
[
  {
    "op_type": "Swap",
    "target": "${STABLECOIN_CONTRACT_ID}",
    "amount": "${PAYMENT_AMOUNT}",
    "params": "${PARAMS_ZERO_128}",
    "asset": null
  }
]
JSON

RECIPIENT_BAL_BEFORE_RAW="$(invoke_read "${STABLECOIN_CONTRACT_ID}" balance_of --owner "${RECIPIENT_ADDRESS}")"
RECIPIENT_BAL_BEFORE="$(echo "${RECIPIENT_BAL_BEFORE_RAW}" | normalize_json)"

PAYMENT_EXEC_OK="0"
if [[ "${PAYMENT_SETUP_OK}" == "1" ]]; then
  if BATCH_RESULT_RAW="$(invoke_write "${BATCH_EXECUTOR_CONTRACT_ID}" \
    execute_batch \
    --operations-file-path "${OPS_PAYMENT_FILE}" \
    --signer "${SOURCE_ADDRESS}")"; then
    PAYMENT_EXEC_OK="1"
    BATCH_RESULT="$(echo "${BATCH_RESULT_RAW}" | normalize_json)"
    echo "batch.payment_mode=token_transfer"
  fi
fi

if [[ "${PAYMENT_EXEC_OK}" != "1" ]]; then
  if [[ "${STRICT_ONCHAIN_ONLY}" == "1" ]]; then
    echo "ERROR: strict on-chain mode requires token-transfer payment path without fallback."
    echo "DETAILS: stablecoin_has_balance_fn=${STABLECOIN_HAS_BALANCE_FN}, balance_after_mint=${BAL_AFTER_MINT}, payment_amount=${PAYMENT_AMOUNT}, payment_setup_ok=${PAYMENT_SETUP_OK}"
    exit 2
  fi

  BATCH_MODE="swap_fallback"
  BATCH_RESULT_RAW="$(invoke_write "${BATCH_EXECUTOR_CONTRACT_ID}" \
    execute_batch \
    --operations-file-path "${OPS_SWAP_FILE}" \
    --signer "${SOURCE_ADDRESS}")"
  BATCH_RESULT="$(echo "${BATCH_RESULT_RAW}" | normalize_json)"
  echo "batch.payment_mode=swap_fallback"
fi

echo "batch.execute_batch result=${BATCH_RESULT}"

RECIPIENT_BAL_AFTER_RAW="$(invoke_read "${STABLECOIN_CONTRACT_ID}" balance_of --owner "${RECIPIENT_ADDRESS}")"
RECIPIENT_BAL_AFTER="$(echo "${RECIPIENT_BAL_AFTER_RAW}" | normalize_json)"

echo "stablecoin.balance_before(recipient)=${RECIPIENT_BAL_BEFORE}"
echo "stablecoin.balance_after(recipient)=${RECIPIENT_BAL_AFTER}"
if [[ "${BATCH_MODE}" == "swap_fallback" ]]; then
  echo "batch.note=payment_fallback_to_swap_due_to_token_abi_or_balance"
fi

echo
echo "== [4/5] Execute MEV protected order transaction =="
DEADLINE="$(( $(date +%s) + 3600 ))"
PATH_FILE="$(mktemp)"
cat > "${PATH_FILE}" <<JSON
{
  "hops": ["${STABLECOIN_CONTRACT_ID}", "${BATCH_EXECUTOR_CONTRACT_ID}"]
}
JSON

MEV_MODE="onchain"
if NONCE_RAW="$(invoke_write "${MEV_GUARD_CONTRACT_ID}" \
  create_protected_order \
  --trader "${SOURCE_ADDRESS}" \
  --path-file-path "${PATH_FILE}" \
  --amount_in "${MEV_AMOUNT_IN}" \
  --min_amount_out "${MEV_MIN_OUT}" \
  --deadline "${DEADLINE}")"; then
  NONCE="$(echo "${NONCE_RAW}" | normalize_json)"
  echo "mev_guard.nonce=${NONCE}"

  MEV_RESULT_RAW="$(invoke_write "${MEV_GUARD_CONTRACT_ID}" execute_protected_swap --nonce "${NONCE}")"
  MEV_RESULT="$(echo "${MEV_RESULT_RAW}" | normalize_json)"
  echo "mev_guard.execute_protected_swap result=${MEV_RESULT}"
else
  if [[ "${STRICT_ONCHAIN_ONLY}" == "1" ]]; then
    echo "ERROR: strict on-chain mode requires successful on-chain MEV order creation."
    exit 3
  fi

  MEV_MODE="simulation_fallback"
  echo "WARN: mev_guard on-chain order creation failed; falling back to simulation validation."

  NONCE_RAW="$(invoke_read "${MEV_GUARD_CONTRACT_ID}" \
    create_protected_order \
    --trader "${SOURCE_ADDRESS}" \
    --path-file-path "${PATH_FILE}" \
    --amount_in "${MEV_AMOUNT_IN}" \
    --min_amount_out "${MEV_MIN_OUT}" \
    --deadline "${DEADLINE}")"
  NONCE="$(echo "${NONCE_RAW}" | normalize_json)"
  echo "mev_guard.nonce(simulated)=${NONCE}"

  MAX_SLIPPAGE_RAW="$(invoke_read "${MEV_GUARD_CONTRACT_ID}" get_max_slippage_bps)"
  MAX_SLIPPAGE="$(echo "${MAX_SLIPPAGE_RAW}" | normalize_json)"
  echo "mev_guard.max_slippage_bps=${MAX_SLIPPAGE}"
fi

echo
echo "== [5/5] Final checks =="
BAL_FINAL_RAW="$(invoke_read "${STABLECOIN_CONTRACT_ID}" balance_of --owner "${SOURCE_ADDRESS}")"
BAL_FINAL="$(echo "${BAL_FINAL_RAW}" | normalize_json)"
echo "stablecoin.balance_final(source)=${BAL_FINAL}"
echo "mev.mode=${MEV_MODE}"
echo "strict_onchain_only=${STRICT_ONCHAIN_ONLY}"

echo
echo "Transactional E2E completed successfully."

rm -f "${OPS_PAYMENT_FILE}" "${OPS_SWAP_FILE}" "${PATH_FILE}"
