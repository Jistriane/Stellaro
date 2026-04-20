#!/usr/bin/env bash
set -euo pipefail

# Generates an operational evidence bundle (logs + markdown + json)
# from testnet validation scripts.

CONTRACTS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WORKSPACE_ROOT="$(cd "${CONTRACTS_DIR}/.." && pwd)"
ENV_FILE="${1:-${CONTRACTS_DIR}/.env-testnet}"

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
  RUN_MUTATIONS \
  RUN_TRANSACTIONAL \
  ABI_STRICT \
  STRICT_ONCHAIN_ONLY \
  STRICT_REQUIRED \
  REPORT_TAG \
  OUTPUT_DIR \
  STABLECOIN_CONTRACT_ID \
  BATCH_EXECUTOR_CONTRACT_ID \
  MEV_GUARD_CONTRACT_ID \
  SOROSWAP_ROUTER_CONTRACT_ID

NETWORK="${STELLAR_NETWORK:-testnet}"
SOURCE_ADDRESS="${SOURCE_ADDRESS:-}"
SIGN_WITH_KEY="${SIGN_WITH_KEY:-}"
RUN_MUTATIONS="${RUN_MUTATIONS:-0}"
RUN_TRANSACTIONAL="${RUN_TRANSACTIONAL:-0}"
ABI_STRICT="${ABI_STRICT:-0}"
STRICT_ONCHAIN_ONLY="${STRICT_ONCHAIN_ONLY:-0}"
STRICT_REQUIRED="${STRICT_REQUIRED:-0}"
REPORT_TAG="${REPORT_TAG:-$(date +%Y%m%d_%H%M%S)}"
OUTPUT_DIR="${OUTPUT_DIR:-${CONTRACTS_DIR}/reports/${REPORT_TAG}}"

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "ERROR: missing command '$1'"
    exit 1
  fi
}

require_var() {
  local name="$1"
  if [[ -z "${!name:-}" ]]; then
    echo "ERROR: required env var missing: ${name}"
    exit 1
  fi
}

run_step() {
  local name="$1"
  shift

  local log_file="${OUTPUT_DIR}/${name}.log"
  local exit_code=0

  set +e
  "$@" >"${log_file}" 2>&1
  exit_code=$?
  set -e

  if [[ ${exit_code} -eq 0 ]]; then
    echo "pass|${exit_code}|${log_file}"
  else
    echo "fail|${exit_code}|${log_file}"
  fi
}

require_cmd bash
require_cmd jq
require_cmd git
require_cmd date

require_var SOURCE_ADDRESS
require_var STABLECOIN_CONTRACT_ID
require_var BATCH_EXECUTOR_CONTRACT_ID
require_var MEV_GUARD_CONTRACT_ID

mkdir -p "${OUTPUT_DIR}"

START_TS="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
GIT_COMMIT="$(git -C "${WORKSPACE_ROOT}" rev-parse --short HEAD 2>/dev/null || echo "unknown")"

echo "== Stellaro Testnet Evidence Report =="
echo "Output dir: ${OUTPUT_DIR}"
echo "Network: ${NETWORK}"
echo "Source: ${SOURCE_ADDRESS}"
echo "Commit: ${GIT_COMMIT}"

echo
echo "[1/4] ABI check"
ABI_RESULT="$(run_step abi_check env \
  STRICT="${ABI_STRICT}" \
  SOURCE_ADDRESS="${SOURCE_ADDRESS}" \
  STABLECOIN_CONTRACT_ID="${STABLECOIN_CONTRACT_ID}" \
  BATCH_EXECUTOR_CONTRACT_ID="${BATCH_EXECUTOR_CONTRACT_ID}" \
  MEV_GUARD_CONTRACT_ID="${MEV_GUARD_CONTRACT_ID}" \
  bash "${CONTRACTS_DIR}/scripts/testnet_abi_upgrade_check.sh" "${ENV_FILE}")"
ABI_STATUS="$(echo "${ABI_RESULT}" | cut -d'|' -f1)"
ABI_EXIT="$(echo "${ABI_RESULT}" | cut -d'|' -f2)"
ABI_LOG="$(echo "${ABI_RESULT}" | cut -d'|' -f3-)"

echo
echo "[2/4] Smoke read-only"
SMOKE_RO_RESULT="$(run_step smoke_read_only env \
  SOURCE_ADDRESS="${SOURCE_ADDRESS}" \
  STABLECOIN_CONTRACT_ID="${STABLECOIN_CONTRACT_ID}" \
  BATCH_EXECUTOR_CONTRACT_ID="${BATCH_EXECUTOR_CONTRACT_ID}" \
  MEV_GUARD_CONTRACT_ID="${MEV_GUARD_CONTRACT_ID}" \
  RUN_MUTATIONS=0 \
  bash "${CONTRACTS_DIR}/scripts/testnet_integration_smoke.sh" "${ENV_FILE}")"
SMOKE_RO_STATUS="$(echo "${SMOKE_RO_RESULT}" | cut -d'|' -f1)"
SMOKE_RO_EXIT="$(echo "${SMOKE_RO_RESULT}" | cut -d'|' -f2)"
SMOKE_RO_LOG="$(echo "${SMOKE_RO_RESULT}" | cut -d'|' -f3-)"

SMOKE_MUT_STATUS="skipped"
SMOKE_MUT_EXIT="0"
SMOKE_MUT_LOG=""

if [[ "${RUN_MUTATIONS}" == "1" ]]; then
  require_var SIGN_WITH_KEY
  echo
  echo "[3/4] Smoke mutation"
  SMOKE_MUT_RESULT="$(run_step smoke_mutation env \
    SOURCE_ADDRESS="${SOURCE_ADDRESS}" \
    SIGN_WITH_KEY="${SIGN_WITH_KEY}" \
    STABLECOIN_CONTRACT_ID="${STABLECOIN_CONTRACT_ID}" \
    BATCH_EXECUTOR_CONTRACT_ID="${BATCH_EXECUTOR_CONTRACT_ID}" \
    MEV_GUARD_CONTRACT_ID="${MEV_GUARD_CONTRACT_ID}" \
    SOROSWAP_ROUTER_CONTRACT_ID="${SOROSWAP_ROUTER_CONTRACT_ID:-}" \
    RUN_MUTATIONS=1 \
    bash "${CONTRACTS_DIR}/scripts/testnet_integration_smoke.sh" "${ENV_FILE}")"
  SMOKE_MUT_STATUS="$(echo "${SMOKE_MUT_RESULT}" | cut -d'|' -f1)"
  SMOKE_MUT_EXIT="$(echo "${SMOKE_MUT_RESULT}" | cut -d'|' -f2)"
  SMOKE_MUT_LOG="$(echo "${SMOKE_MUT_RESULT}" | cut -d'|' -f3-)"
else
  echo
  echo "[3/4] Smoke mutation skipped (RUN_MUTATIONS=0)"
fi

TX_E2E_STATUS="skipped"
TX_E2E_EXIT="0"
TX_E2E_LOG=""

if [[ "${RUN_TRANSACTIONAL}" == "1" ]]; then
  require_var SIGN_WITH_KEY
  echo
  echo "[4/4] Transactional E2E"
  TX_E2E_RESULT="$(run_step transactional_e2e env \
    SOURCE_ADDRESS="${SOURCE_ADDRESS}" \
    SIGN_WITH_KEY="${SIGN_WITH_KEY}" \
    STABLECOIN_CONTRACT_ID="${STABLECOIN_CONTRACT_ID}" \
    BATCH_EXECUTOR_CONTRACT_ID="${BATCH_EXECUTOR_CONTRACT_ID}" \
    MEV_GUARD_CONTRACT_ID="${MEV_GUARD_CONTRACT_ID}" \
    SOROSWAP_ROUTER_CONTRACT_ID="${SOROSWAP_ROUTER_CONTRACT_ID:-}" \
    STRICT_ONCHAIN_ONLY="${STRICT_ONCHAIN_ONLY}" \
    RUN_ABI_STRICT_CHECK=0 \
    bash "${CONTRACTS_DIR}/scripts/testnet_transactional_e2e.sh" "${ENV_FILE}")"
  TX_E2E_STATUS="$(echo "${TX_E2E_RESULT}" | cut -d'|' -f1)"
  TX_E2E_EXIT="$(echo "${TX_E2E_RESULT}" | cut -d'|' -f2)"
  TX_E2E_LOG="$(echo "${TX_E2E_RESULT}" | cut -d'|' -f3-)"
else
  echo
  echo "[4/4] Transactional E2E skipped (RUN_TRANSACTIONAL=0)"
fi

END_TS="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

REPORT_MD="${OUTPUT_DIR}/evidence_report.md"
REPORT_JSON="${OUTPUT_DIR}/evidence_report.json"

cat > "${REPORT_MD}" <<MD
# Stellaro Testnet Evidence Report

- Generated at: ${END_TS}
- Started at: ${START_TS}
- Network: ${NETWORK}
- Source address: ${SOURCE_ADDRESS}
- Git commit: ${GIT_COMMIT}
- Env file: ${ENV_FILE}

## Run Flags

- ABI_STRICT=${ABI_STRICT}
- RUN_MUTATIONS=${RUN_MUTATIONS}
- RUN_TRANSACTIONAL=${RUN_TRANSACTIONAL}
- STRICT_ONCHAIN_ONLY=${STRICT_ONCHAIN_ONLY}
- STRICT_REQUIRED=${STRICT_REQUIRED}

## Contract IDs

- STABLECOIN_CONTRACT_ID: ${STABLECOIN_CONTRACT_ID}
- BATCH_EXECUTOR_CONTRACT_ID: ${BATCH_EXECUTOR_CONTRACT_ID}
- MEV_GUARD_CONTRACT_ID: ${MEV_GUARD_CONTRACT_ID}
- SOROSWAP_ROUTER_CONTRACT_ID: ${SOROSWAP_ROUTER_CONTRACT_ID:-<not set>}

## Step Results

| Step | Status | Exit Code | Log |
|------|--------|-----------|-----|
| ABI Check | ${ABI_STATUS} | ${ABI_EXIT} | ${ABI_LOG} |
| Smoke Read-only | ${SMOKE_RO_STATUS} | ${SMOKE_RO_EXIT} | ${SMOKE_RO_LOG} |
| Smoke Mutation | ${SMOKE_MUT_STATUS} | ${SMOKE_MUT_EXIT} | ${SMOKE_MUT_LOG:-<skipped>} |
| Transactional E2E | ${TX_E2E_STATUS} | ${TX_E2E_EXIT} | ${TX_E2E_LOG:-<skipped>} |

## Overall

This report is for operational evidence collection. A non-pass result indicates pending work, missing ABI, missing credentials, or expected skip based on run flags.
MD

jq -n \
  --arg generatedAt "${END_TS}" \
  --arg startedAt "${START_TS}" \
  --arg network "${NETWORK}" \
  --arg sourceAddress "${SOURCE_ADDRESS}" \
  --arg gitCommit "${GIT_COMMIT}" \
  --arg envFile "${ENV_FILE}" \
  --arg abiStrict "${ABI_STRICT}" \
  --arg runMutations "${RUN_MUTATIONS}" \
  --arg runTransactional "${RUN_TRANSACTIONAL}" \
  --arg strictOnchainOnly "${STRICT_ONCHAIN_ONLY}" \
  --arg strictRequired "${STRICT_REQUIRED}" \
  --arg stablecoinId "${STABLECOIN_CONTRACT_ID}" \
  --arg batchId "${BATCH_EXECUTOR_CONTRACT_ID}" \
  --arg mevId "${MEV_GUARD_CONTRACT_ID}" \
  --arg routerId "${SOROSWAP_ROUTER_CONTRACT_ID:-}" \
  --arg abiStatus "${ABI_STATUS}" \
  --arg abiExit "${ABI_EXIT}" \
  --arg abiLog "${ABI_LOG}" \
  --arg smokeRoStatus "${SMOKE_RO_STATUS}" \
  --arg smokeRoExit "${SMOKE_RO_EXIT}" \
  --arg smokeRoLog "${SMOKE_RO_LOG}" \
  --arg smokeMutStatus "${SMOKE_MUT_STATUS}" \
  --arg smokeMutExit "${SMOKE_MUT_EXIT}" \
  --arg smokeMutLog "${SMOKE_MUT_LOG}" \
  --arg txStatus "${TX_E2E_STATUS}" \
  --arg txExit "${TX_E2E_EXIT}" \
  --arg txLog "${TX_E2E_LOG}" \
  '{
    generatedAt: $generatedAt,
    startedAt: $startedAt,
    network: $network,
    sourceAddress: $sourceAddress,
    gitCommit: $gitCommit,
    envFile: $envFile,
    runFlags: {
      abiStrict: ($abiStrict|tonumber),
      runMutations: ($runMutations|tonumber),
      runTransactional: ($runTransactional|tonumber),
      strictOnchainOnly: ($strictOnchainOnly|tonumber),
      strictRequired: ($strictRequired|tonumber)
    },
    contracts: {
      stablecoin: $stablecoinId,
      batchExecutor: $batchId,
      mevGuard: $mevId,
      soroswapRouter: $routerId
    },
    steps: [
      { name: "abi_check", status: $abiStatus, exitCode: ($abiExit|tonumber), log: $abiLog },
      { name: "smoke_read_only", status: $smokeRoStatus, exitCode: ($smokeRoExit|tonumber), log: $smokeRoLog },
      { name: "smoke_mutation", status: $smokeMutStatus, exitCode: ($smokeMutExit|tonumber), log: $smokeMutLog },
      { name: "transactional_e2e", status: $txStatus, exitCode: ($txExit|tonumber), log: $txLog }
    ]
  }' > "${REPORT_JSON}"

echo
echo "Evidence report generated:"
echo "- ${REPORT_MD}"
echo "- ${REPORT_JSON}"

if [[ "${STRICT_REQUIRED}" == "1" ]]; then
  REQUIRED_FAILED=0

  if [[ "${ABI_STATUS}" != "pass" ]]; then
    REQUIRED_FAILED=1
  fi

  if [[ "${SMOKE_RO_STATUS}" != "pass" ]]; then
    REQUIRED_FAILED=1
  fi

  if [[ "${RUN_MUTATIONS}" == "1" ]] && [[ "${SMOKE_MUT_STATUS}" != "pass" ]]; then
    REQUIRED_FAILED=1
  fi

  if [[ "${RUN_TRANSACTIONAL}" == "1" ]] && [[ "${TX_E2E_STATUS}" != "pass" ]]; then
    REQUIRED_FAILED=1
  fi

  if [[ "${REQUIRED_FAILED}" -ne 0 ]]; then
    echo ""
    echo "STRICT_REQUIRED=1: required steps did not all pass."
    exit 4
  fi
fi
