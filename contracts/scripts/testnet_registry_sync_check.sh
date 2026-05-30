#!/usr/bin/env bash
set -euo pipefail

# Verifies that the canonical testnet contract IDs stay synchronized across env files and the registry doc.
# Usage:
#   contracts/scripts/testnet_registry_sync_check.sh [root-env] [backend-env] [registry-md]

CONTRACTS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REPO_ROOT="$(cd "${CONTRACTS_DIR}/.." && pwd)"
ROOT_ENV_FILE="${1:-${REPO_ROOT}/.env-dev}"
BACKEND_ENV_FILE="${2:-${REPO_ROOT}/apps/backend/.env-dev}"
REGISTRY_MD_FILE="${3:-${REPO_ROOT}/docs/SMART_CONTRACT_DEPLOYMENT_REGISTRY.md}"

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "ERROR: command '$1' not found" >&2
    exit 2
  fi
}

require_file() {
  local file_path="$1"
  if [[ ! -f "${file_path}" ]]; then
    echo "ERROR: file not found: ${file_path}" >&2
    exit 2
  fi
}

load_env_value() {
  local file_path="$1"
  local key="$2"
  grep -E "^${key}=" "${file_path}" | tail -n 1 | cut -d= -f2-
}

require_cmd grep
require_cmd cut
require_cmd tail

require_file "${ROOT_ENV_FILE}"
require_file "${BACKEND_ENV_FILE}"
require_file "${REGISTRY_MD_FILE}"

declare -a contract_keys=(
  STABLECOIN_CONTRACT_ID
  BATCH_EXECUTOR_CONTRACT_ID
  MEV_GUARD_CONTRACT_ID
  VC_REGISTRY_ID
)

echo "== Stellaro Testnet Registry Sync Check =="
echo "Root env: ${ROOT_ENV_FILE}"
echo "Backend env: ${BACKEND_ENV_FILE}"
echo "Registry: ${REGISTRY_MD_FILE}"
echo

failures=0
for key in "${contract_keys[@]}"; do
  root_value="$(load_env_value "${ROOT_ENV_FILE}" "${key}")"
  backend_value="$(load_env_value "${BACKEND_ENV_FILE}" "${key}")"

  if [[ -z "${root_value}" ]]; then
    echo "[miss] ${key} not present in root env"
    failures=$((failures + 1))
    continue
  fi

  if [[ -z "${backend_value}" ]]; then
    echo "[miss] ${key} not present in backend env"
    failures=$((failures + 1))
    continue
  fi

  if [[ "${root_value}" != "${backend_value}" ]]; then
    echo "[diff] ${key} differs between env files"
    echo "       root:    ${root_value}"
    echo "       backend: ${backend_value}"
    failures=$((failures + 1))
  else
    echo "[ok]   ${key} matches across env files"
  fi

  if grep -Fq "${root_value}" "${REGISTRY_MD_FILE}"; then
    echo "[ok]   ${key} present in canonical registry"
  else
    echo "[miss] ${key} missing from canonical registry"
    failures=$((failures + 1))
  fi

done

echo
if [[ "${failures}" -eq 0 ]]; then
  echo "Result: registry is synchronized across env files and canonical docs."
  exit 0
fi

echo "Result: registry synchronization check failed with ${failures} issue(s)." >&2
exit 1
