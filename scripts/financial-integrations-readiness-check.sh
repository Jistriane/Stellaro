#!/usr/bin/env bash
set -euo pipefail

# Validates financial integration readiness endpoint and fails when status is not acceptable.
# Usage:
#   scripts/financial-integrations-readiness-check.sh https://staging.example.com true
#   scripts/financial-integrations-readiness-check.sh http://localhost:3001 false

BASE_URL="${1:-http://localhost:3001}"
REQUIRE_LIVE="${2:-true}"
ENDPOINT="${BASE_URL%/}/health/integrations/financial"

if ! command -v curl >/dev/null 2>&1; then
  echo "ERROR: curl is required" >&2
  exit 2
fi

if ! command -v jq >/dev/null 2>&1; then
  echo "ERROR: jq is required" >&2
  exit 2
fi

echo "Running financial readiness check"
echo "- endpoint: ${ENDPOINT}"
echo "- strict live required: ${REQUIRE_LIVE}"

RESPONSE="$(FINANCIAL_INTEGRATIONS_REQUIRE_LIVE="${REQUIRE_LIVE}" curl -fsS "${ENDPOINT}")"
STATUS="$(echo "${RESPONSE}" | jq -r '.status // "unknown"')"

if [[ "${STATUS}" == "ok" ]]; then
  echo "PASS: status=ok"
  echo "${RESPONSE}" | jq .
  exit 0
fi

if [[ "${REQUIRE_LIVE}" == "true" ]]; then
  echo "FAIL: strict live readiness did not pass (status=${STATUS})" >&2
  echo "${RESPONSE}" | jq . >&2
  exit 1
fi

if [[ "${STATUS}" == "degraded" ]]; then
  echo "WARN: status=degraded (non-live rails expected when strict mode is false)"
  echo "${RESPONSE}" | jq .
  exit 0
fi

echo "FAIL: unexpected readiness status (${STATUS})" >&2
echo "${RESPONSE}" | jq . >&2
exit 1
