#!/usr/bin/env bash
set -euo pipefail

# Post-upgrade validation wrapper:
# 1) Enforces ABI compatibility (STRICT=1)
# 2) Runs integration smoke with mutation checks enabled

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
  SOURCE_ADDRESS \
  SIGN_WITH_KEY \
  STABLECOIN_CONTRACT_ID \
  BATCH_EXECUTOR_CONTRACT_ID \
  MEV_GUARD_CONTRACT_ID \
  SOROSWAP_ROUTER_CONTRACT_ID

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

require_cmd bash
require_cmd soroban
require_cmd jq

require_var SOURCE_ADDRESS
require_var SIGN_WITH_KEY
require_var STABLECOIN_CONTRACT_ID
require_var BATCH_EXECUTOR_CONTRACT_ID
require_var MEV_GUARD_CONTRACT_ID

echo "== Stellaro Post-Upgrade Validation =="
echo "Source: ${SOURCE_ADDRESS}"
echo "Env file: ${ENV_FILE}"

echo
echo "[1/2] ABI strict check"
STRICT=1 \
SOURCE_ADDRESS="${SOURCE_ADDRESS}" \
STABLECOIN_CONTRACT_ID="${STABLECOIN_CONTRACT_ID}" \
BATCH_EXECUTOR_CONTRACT_ID="${BATCH_EXECUTOR_CONTRACT_ID}" \
MEV_GUARD_CONTRACT_ID="${MEV_GUARD_CONTRACT_ID}" \
bash "${ROOT_DIR}/scripts/testnet_abi_upgrade_check.sh" "${ENV_FILE}"

echo
echo "[2/2] Mutation smoke"
RUN_MUTATIONS=1 \
SOURCE_ADDRESS="${SOURCE_ADDRESS}" \
SIGN_WITH_KEY="${SIGN_WITH_KEY}" \
STABLECOIN_CONTRACT_ID="${STABLECOIN_CONTRACT_ID}" \
BATCH_EXECUTOR_CONTRACT_ID="${BATCH_EXECUTOR_CONTRACT_ID}" \
MEV_GUARD_CONTRACT_ID="${MEV_GUARD_CONTRACT_ID}" \
SOROSWAP_ROUTER_CONTRACT_ID="${SOROSWAP_ROUTER_CONTRACT_ID:-}" \
bash "${ROOT_DIR}/scripts/testnet_integration_smoke.sh" "${ENV_FILE}"

echo
echo "Post-upgrade validation completed successfully."
