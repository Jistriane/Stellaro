#!/usr/bin/env bash
set -euo pipefail

# Formats a financial readiness JSON artifact into a paste-ready markdown evidence block.
# Usage:
#   scripts/financial-evidence-format.sh [json-file] [staging-url] [run-id] [timestamp-utc]

JSON_FILE="${1:-financial-readiness.json}"
STAGING_URL="${2:-<staging-backend>}"
RUN_ID="${3:-unknown}"
TIMESTAMP_UTC="${4:-$(date -u +%Y-%m-%dT%H:%M:%SZ)}"

if ! command -v jq >/dev/null 2>&1; then
  echo "ERROR: jq is required" >&2
  exit 2
fi

if [[ ! -f "${JSON_FILE}" ]]; then
  echo "ERROR: JSON file not found: ${JSON_FILE}" >&2
  exit 1
fi

status="$(jq -r '.status // "unknown"' "${JSON_FILE}")"
strict_live_required="$(jq -r '.strictLiveRequired // false' "${JSON_FILE}")"
live_rails="$(jq -r '.summary.liveRails // 0' "${JSON_FILE}")"
total_rails="$(jq -r '.summary.totalRails // 3' "${JSON_FILE}")"
checks_count="$(jq -r '.checks | length' "${JSON_FILE}")"

cat <<EOF
# Week 2 Financial Readiness Evidence

- Staging URL: ${STAGING_URL}
- Run timestamp (UTC): ${TIMESTAMP_UTC}
- Workflow run ID: ${RUN_ID}
- Status: ${status}
- Strict live required: ${strict_live_required}
- Live rails: ${live_rails}/${total_rails}
- Check count: ${checks_count}

## Payload

actions:
Raw financial readiness JSON is attached below for traceability.
EOF

echo ""
echo "```json"
jq . "${JSON_FILE}"
echo "```"
