#!/usr/bin/env bash
set -euo pipefail

# Dispatches the Week 2 financial readiness workflow and prints the latest run entry.
# Usage:
#   scripts/financial-readiness-dispatch.sh https://staging.example.com true

STAGING_BASE_URL="${1:-}"
REQUIRE_LIVE="${2:-true}"
WORKFLOW_FILE="financial-readiness-gate.yml"

if [[ -z "${STAGING_BASE_URL}" ]]; then
  echo "ERROR: staging base URL is required" >&2
  exit 2
fi

if ! command -v gh >/dev/null 2>&1; then
  echo "ERROR: gh CLI is required" >&2
  exit 2
fi

if ! command -v jq >/dev/null 2>&1; then
  echo "ERROR: jq is required" >&2
  exit 2
fi

if [[ "${REQUIRE_LIVE}" != "true" && "${REQUIRE_LIVE}" != "false" ]]; then
  echo "ERROR: require_live must be true or false" >&2
  exit 2
fi

echo "Dispatching workflow ${WORKFLOW_FILE}"
echo "- staging base URL: ${STAGING_BASE_URL}"
echo "- require live: ${REQUIRE_LIVE}"

gh workflow run "${WORKFLOW_FILE}" \
  -f staging_base_url="${STAGING_BASE_URL}" \
  -f require_live="${REQUIRE_LIVE}"

echo "Latest workflow runs:"
gh run list --workflow "${WORKFLOW_FILE}" --limit 5

echo ""
echo "Next step: use the newest run ID from the list above to download the financial-readiness artifact."
echo "Example: gh run download <run-id> -n financial-readiness"
