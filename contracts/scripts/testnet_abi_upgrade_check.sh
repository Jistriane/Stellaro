#!/usr/bin/env bash
set -euo pipefail

# ABI capability check for currently deployed testnet contracts.
# Use STRICT=1 to fail when required upgraded commands are missing.

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
  STRICT \
  STABLECOIN_CONTRACT_ID \
  BATCH_EXECUTOR_CONTRACT_ID \
  MEV_GUARD_CONTRACT_ID

NETWORK="${STELLAR_NETWORK:-testnet}"
SOURCE_ACCOUNT="${SOROBAN_SOURCE_ACCOUNT:-}"
SOURCE_ADDRESS="${SOURCE_ADDRESS:-}"
STRICT="${STRICT:-0}"

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

resolve_source_address() {
  if [[ -n "${SOURCE_ADDRESS}" ]]; then
    return 0
  fi

  if [[ -n "${SOURCE_ACCOUNT}" ]]; then
    if SOURCE_ADDRESS="$(soroban keys address "${SOURCE_ACCOUNT}" 2>/dev/null)"; then
      return 0
    fi
  fi

  echo "ERROR: set SOURCE_ADDRESS (G...) or provide valid SOROBAN_SOURCE_ACCOUNT alias"
  exit 1
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

check_cmd() {
  local contract_name="$1"
  local contract_id="$2"
  local cmd="$3"
  local required="$4"

  if has_command "${contract_id}" "${cmd}"; then
    echo "[ok]   ${contract_name}.${cmd}"
    return 0
  fi

  if [[ "${required}" == "required" ]]; then
    echo "[miss] ${contract_name}.${cmd} (required for upgraded flow)"
    return 1
  fi

  echo "[skip] ${contract_name}.${cmd} (optional)"
  return 0
}

require_cmd soroban

require_var STABLECOIN_CONTRACT_ID
require_var BATCH_EXECUTOR_CONTRACT_ID
require_var MEV_GUARD_CONTRACT_ID
resolve_source_address

echo "== Stellaro Testnet ABI Upgrade Check =="
echo "Network: ${NETWORK}"
echo "Source: ${SOURCE_ADDRESS}"
echo "Env file: ${ENV_FILE}"
echo "STRICT=${STRICT}"

echo
MISSING_REQUIRED=0

echo "[1/3] Stablecoin ABI baseline"
check_cmd "stablecoin" "${STABLECOIN_CONTRACT_ID}" "init" "required" || MISSING_REQUIRED=1
check_cmd "stablecoin" "${STABLECOIN_CONTRACT_ID}" "balance_of" "required" || MISSING_REQUIRED=1
check_cmd "stablecoin" "${STABLECOIN_CONTRACT_ID}" "mint_guarded" "required" || MISSING_REQUIRED=1

echo
echo "[2/3] Batch Executor ABI"
check_cmd "batch_executor" "${BATCH_EXECUTOR_CONTRACT_ID}" "init" "required" || MISSING_REQUIRED=1
check_cmd "batch_executor" "${BATCH_EXECUTOR_CONTRACT_ID}" "execute_batch" "required" || MISSING_REQUIRED=1
check_cmd "batch_executor" "${BATCH_EXECUTOR_CONTRACT_ID}" "get_admin" "required" || MISSING_REQUIRED=1
check_cmd "batch_executor" "${BATCH_EXECUTOR_CONTRACT_ID}" "set_stablecoin_contract" "required" || MISSING_REQUIRED=1
check_cmd "batch_executor" "${BATCH_EXECUTOR_CONTRACT_ID}" "get_stablecoin_contract" "required" || MISSING_REQUIRED=1
check_cmd "batch_executor" "${BATCH_EXECUTOR_CONTRACT_ID}" "set_dex_router" "required" || MISSING_REQUIRED=1
check_cmd "batch_executor" "${BATCH_EXECUTOR_CONTRACT_ID}" "get_dex_router" "required" || MISSING_REQUIRED=1

echo
echo "[3/3] MEV Guard ABI"
check_cmd "mev_guard" "${MEV_GUARD_CONTRACT_ID}" "init" "required" || MISSING_REQUIRED=1
check_cmd "mev_guard" "${MEV_GUARD_CONTRACT_ID}" "create_protected_order" "required" || MISSING_REQUIRED=1
check_cmd "mev_guard" "${MEV_GUARD_CONTRACT_ID}" "execute_protected_swap" "required" || MISSING_REQUIRED=1
check_cmd "mev_guard" "${MEV_GUARD_CONTRACT_ID}" "set_dex_router" "required" || MISSING_REQUIRED=1
check_cmd "mev_guard" "${MEV_GUARD_CONTRACT_ID}" "get_dex_router" "required" || MISSING_REQUIRED=1

echo
if [[ "${MISSING_REQUIRED}" -eq 0 ]]; then
  echo "Result: ABI is compatible with upgraded integration flows."
  exit 0
fi

if [[ "${STRICT}" == "1" ]]; then
  echo "Result: REQUIRED upgraded ABI commands are missing (STRICT mode)."
  exit 2
fi

echo "Result: Required upgraded ABI commands are missing; redeploy/upgrade needed before full mutation validation."
exit 0
