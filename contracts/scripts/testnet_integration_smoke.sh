#!/usr/bin/env bash
set -euo pipefail

# Smoke validation for deployed contracts on Stellar testnet.
# Default mode is read-only. Enable RUN_MUTATIONS=1 to validate admin set/get flows.

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
  SOROBAN_SOURCE_ACCOUNT \
  SOURCE_ADDRESS \
  SIGN_WITH_KEY \
  RUN_MUTATIONS \
  STABLECOIN_CONTRACT_ID \
  BATCH_EXECUTOR_CONTRACT_ID \
  MEV_GUARD_CONTRACT_ID \
  SOROSWAP_ROUTER_CONTRACT_ID

NETWORK="${STELLAR_NETWORK:-testnet}"
SOURCE_ACCOUNT="${SOROBAN_SOURCE_ACCOUNT:-}"
SOURCE_ADDRESS="${SOURCE_ADDRESS:-}"
SIGN_WITH_KEY="${SIGN_WITH_KEY:-}"
RUN_MUTATIONS="${RUN_MUTATIONS:-0}"

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "ERROR: command '$1' not found"
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

invoke() {
  local contract_id="$1"
  shift
  soroban contract invoke \
    --id "${contract_id}" \
    --source-account "${SOURCE_ADDRESS}" \
    --network "${NETWORK}" \
    --send no \
    -- "$@"
}

invoke_mutation() {
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

has_command() {
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

require_var STABLECOIN_CONTRACT_ID
require_var BATCH_EXECUTOR_CONTRACT_ID
require_var MEV_GUARD_CONTRACT_ID

if [[ -z "${SOURCE_ADDRESS}" ]]; then
  if [[ -n "${SOURCE_ACCOUNT}" ]]; then
    if ! SOURCE_ADDRESS="$(soroban keys address "${SOURCE_ACCOUNT}" 2>/dev/null)"; then
      if [[ "${RUN_MUTATIONS}" == "1" ]]; then
        echo "ERROR: Soroban identity alias '${SOURCE_ACCOUNT}' not found for mutation mode."
        echo "Create/import it first, e.g.: soroban keys generate ${SOURCE_ACCOUNT}"
        exit 1
      fi
      echo "ERROR: SOURCE_ADDRESS not provided and alias '${SOURCE_ACCOUNT}' is unavailable."
      echo "Set SOURCE_ADDRESS to a public key (G...) for read-only mode."
      exit 1
    fi
  else
    echo "ERROR: set SOURCE_ADDRESS (public key) or SOROBAN_SOURCE_ACCOUNT."
    exit 1
  fi
fi

echo "== Stellaro Testnet Integration Smoke =="
echo "Network: ${NETWORK}"
echo "Source account alias: ${SOURCE_ACCOUNT:-<none>}"
echo "Source address: ${SOURCE_ADDRESS}"
echo "Env file: ${ENV_FILE}"
echo "RUN_MUTATIONS=${RUN_MUTATIONS}"

echo
echo "[1/4] Read-only checks: Stablecoin"
STABLE_BAL_RAW="$(invoke "${STABLECOIN_CONTRACT_ID}" balance_of --owner "${SOURCE_ADDRESS}")"
STABLE_BAL="$(echo "${STABLE_BAL_RAW}" | normalize_json)"
echo "stablecoin.balance(source) = ${STABLE_BAL}"

echo
echo "[2/4] Read-only checks: Batch Executor"
BATCH_ADMIN_RAW="$(invoke "${BATCH_EXECUTOR_CONTRACT_ID}" get_admin)"
BATCH_ADMIN="$(echo "${BATCH_ADMIN_RAW}" | normalize_json)"
BATCH_EXEC_COUNT_RAW="$(invoke "${BATCH_EXECUTOR_CONTRACT_ID}" get_execution_count)"
BATCH_EXEC_COUNT="$(echo "${BATCH_EXEC_COUNT_RAW}" | normalize_json)"
BATCH_GAS_SAVED_RAW="$(invoke "${BATCH_EXECUTOR_CONTRACT_ID}" get_total_gas_saved)"
BATCH_GAS_SAVED="$(echo "${BATCH_GAS_SAVED_RAW}" | normalize_json)"
echo "batch_executor.admin = ${BATCH_ADMIN}"
echo "batch_executor.execution_count = ${BATCH_EXEC_COUNT}"
echo "batch_executor.total_gas_saved = ${BATCH_GAS_SAVED}"

echo
echo "[3/4] Read-only checks: MEV Guard"
MEV_ADMIN_RAW="$(invoke "${MEV_GUARD_CONTRACT_ID}" get_admin)"
MEV_ADMIN="$(echo "${MEV_ADMIN_RAW}" | normalize_json)"
MEV_MAX_SLIPPAGE_RAW="$(invoke "${MEV_GUARD_CONTRACT_ID}" get_max_slippage_bps)"
MEV_MAX_SLIPPAGE="$(echo "${MEV_MAX_SLIPPAGE_RAW}" | normalize_json)"
echo "mev_guard.admin = ${MEV_ADMIN}"
echo "mev_guard.max_slippage_bps = ${MEV_MAX_SLIPPAGE}"

echo
echo "[4/4] Optional mutation checks"
if [[ "${RUN_MUTATIONS}" != "1" ]]; then
  echo "Skipping mutation checks (set RUN_MUTATIONS=1 to enable)."
  echo
echo "Smoke finished (read-only mode)."
  exit 0
fi

if [[ -z "${SIGN_WITH_KEY}" ]]; then
  if [[ -n "${SOURCE_ACCOUNT}" ]]; then
    SIGN_WITH_KEY="${SOURCE_ACCOUNT}"
  else
    echo "ERROR: RUN_MUTATIONS=1 requires SIGN_WITH_KEY (alias/seed/secret)."
    exit 1
  fi
fi

echo "Running admin set/get contract checks..."

# Validate stablecoin config path for Batch Executor when ABI supports it.
if has_command "${BATCH_EXECUTOR_CONTRACT_ID}" set_stablecoin_contract && has_command "${BATCH_EXECUTOR_CONTRACT_ID}" get_stablecoin_contract; then
  invoke_mutation "${BATCH_EXECUTOR_CONTRACT_ID}" \
    set_stablecoin_contract \
    --caller "${SOURCE_ADDRESS}" \
    --stablecoin "${STABLECOIN_CONTRACT_ID}" >/dev/null

  BATCH_STABLE_RAW="$(invoke "${BATCH_EXECUTOR_CONTRACT_ID}" get_stablecoin_contract)"
  BATCH_STABLE="$(echo "${BATCH_STABLE_RAW}" | normalize_json)"
  if [[ "${BATCH_STABLE}" != "${STABLECOIN_CONTRACT_ID}" ]]; then
    echo "ERROR: batch stablecoin mismatch: expected ${STABLECOIN_CONTRACT_ID}, got ${BATCH_STABLE}"
    exit 1
  fi
  echo "batch_executor.stablecoin_contract = ${BATCH_STABLE} (ok)"
else
  echo "Batch Executor deployed ABI does not expose stablecoin set/get yet: skipping stablecoin mutation checks."
fi

# DEX router checks are optional because router ID may not be provisioned yet.
if [[ -n "${SOROSWAP_ROUTER_CONTRACT_ID:-}" ]]; then
  if has_command "${BATCH_EXECUTOR_CONTRACT_ID}" set_dex_router && has_command "${BATCH_EXECUTOR_CONTRACT_ID}" get_dex_router; then
    invoke_mutation "${BATCH_EXECUTOR_CONTRACT_ID}" \
      set_dex_router \
      --caller "${SOURCE_ADDRESS}" \
      --router "${SOROSWAP_ROUTER_CONTRACT_ID}" >/dev/null

    BATCH_ROUTER_RAW="$(invoke "${BATCH_EXECUTOR_CONTRACT_ID}" get_dex_router)"
    BATCH_ROUTER="$(echo "${BATCH_ROUTER_RAW}" | normalize_json)"
    if [[ "${BATCH_ROUTER}" != "${SOROSWAP_ROUTER_CONTRACT_ID}" ]]; then
      echo "ERROR: batch router mismatch: expected ${SOROSWAP_ROUTER_CONTRACT_ID}, got ${BATCH_ROUTER}"
      exit 1
    fi
    echo "batch_executor.dex_router = ${BATCH_ROUTER} (ok)"
  else
    echo "Batch Executor deployed ABI does not expose router set/get yet: skipping batch router mutation checks."
  fi

  if has_command "${MEV_GUARD_CONTRACT_ID}" set_dex_router && has_command "${MEV_GUARD_CONTRACT_ID}" get_dex_router; then
    invoke_mutation "${MEV_GUARD_CONTRACT_ID}" \
      set_dex_router \
      --caller "${SOURCE_ADDRESS}" \
      --router "${SOROSWAP_ROUTER_CONTRACT_ID}" >/dev/null

    MEV_ROUTER_RAW="$(invoke "${MEV_GUARD_CONTRACT_ID}" get_dex_router)"
    MEV_ROUTER="$(echo "${MEV_ROUTER_RAW}" | normalize_json)"
    if [[ "${MEV_ROUTER}" != "${SOROSWAP_ROUTER_CONTRACT_ID}" ]]; then
      echo "ERROR: mev router mismatch: expected ${SOROSWAP_ROUTER_CONTRACT_ID}, got ${MEV_ROUTER}"
      exit 1
    fi
    echo "mev_guard.dex_router = ${MEV_ROUTER} (ok)"
  else
    echo "MEV Guard deployed ABI does not expose router set/get yet: skipping mev router mutation checks."
  fi
else
  echo "SOROSWAP_ROUTER_CONTRACT_ID not set: skipping router mutation checks."
fi

echo
echo "Smoke finished (mutation mode)."
