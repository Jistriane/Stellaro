#!/usr/bin/env bash
set -euo pipefail

# Dispatches the financial readiness workflow, waits for completion, and downloads the artifact.
# Usage:
#   scripts/financial-readiness-evidence.sh https://staging.example.com true

STAGING_BASE_URL="${1:-}"
REQUIRE_LIVE="${2:-true}"
WORKFLOW_FILE="financial-readiness-gate.yml"
ARTIFACT_NAME="financial-readiness"
TIMEOUT_SECONDS="${TIMEOUT_SECONDS:-900}"
POLL_SECONDS="${POLL_SECONDS:-10}"

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

end_time=$((SECONDS + TIMEOUT_SECONDS))
run_id=""
conclusion=""

echo "Waiting for workflow completion..."
while [[ "$SECONDS" -lt "$end_time" ]]; do
  latest_run_json="$(gh run list --workflow "${WORKFLOW_FILE}" --limit 1 --json databaseId,status,conclusion,displayTitle)"
  run_id="$(printf '%s' "${latest_run_json}" | jq -r '.[0].databaseId // empty')"
  conclusion="$(printf '%s' "${latest_run_json}" | jq -r '.[0].conclusion // empty')"
  status="$(printf '%s' "${latest_run_json}" | jq -r '.[0].status // empty')"
  display_title="$(printf '%s' "${latest_run_json}" | jq -r '.[0].displayTitle // empty')"

  if [[ -z "${run_id}" ]]; then
    echo "Waiting for workflow run registration..."
  elif [[ "${status}" == "completed" ]]; then
    break
  else
    echo "Waiting for run ${run_id} to complete (status=${status}, conclusion=${conclusion:-pending})..."
  fi

  sleep "${POLL_SECONDS}"
done

if [[ -z "${run_id}" ]]; then
  echo "ERROR: no workflow run found for ${WORKFLOW_FILE}" >&2
  exit 1
fi

if [[ "${conclusion}" != "success" ]]; then
  echo "ERROR: workflow run ${run_id} did not succeed (conclusion=${conclusion:-unknown})" >&2
  gh run view "${run_id}" --json conclusion,status,workflowName,headBranch,createdAt,updatedAt,displayTitle || true
  exit 1
fi

echo "Workflow completed successfully: ${display_title:-${WORKFLOW_FILE}}"
echo "Downloading artifact ${ARTIFACT_NAME} from run ${run_id}"
gh run download "${run_id}" -n "${ARTIFACT_NAME}"

if [[ -f financial-readiness.json ]]; then
  echo "Artifact contents:"
  jq . financial-readiness.json
else
  echo "ERROR: financial-readiness.json was not downloaded" >&2
  exit 1
fi

echo "PASS: readiness evidence collected for run ${run_id}"
