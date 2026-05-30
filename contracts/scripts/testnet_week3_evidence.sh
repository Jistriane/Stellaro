#!/usr/bin/env bash
set -euo pipefail

# One-shot Week 3 evidence bundle for testnet contract readiness.
# Runs ABI strict checks, mutation smoke, transactional E2E, and emits the evidence bundle.
# Usage:
#   contracts/scripts/testnet_week3_evidence.sh [env-file]

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${1:-${ROOT_DIR}/.env-testnet}"

if ! command -v bash >/dev/null 2>&1; then
  echo "ERROR: bash is required" >&2
  exit 2
fi

if ! command -v jq >/dev/null 2>&1; then
  echo "ERROR: jq is required" >&2
  exit 2
fi

echo "== Stellaro Week 3 Evidence Bundle =="
echo "Env file: ${ENV_FILE}"

env \
  ABI_STRICT=1 \
  RUN_MUTATIONS=1 \
  RUN_TRANSACTIONAL=1 \
  STRICT_REQUIRED=1 \
  STRICT_ONCHAIN_ONLY=1 \
  REPORT_TAG="week3_$(date +%Y%m%d_%H%M%S)" \
  bash "${ROOT_DIR}/scripts/testnet_generate_evidence_report.sh" "${ENV_FILE}"

echo
echo "Week 3 evidence bundle completed successfully."
