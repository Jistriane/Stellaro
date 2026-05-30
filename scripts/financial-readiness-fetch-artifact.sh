#!/usr/bin/env bash
set -euo pipefail

# Waits for the latest financial readiness workflow run to finish and downloads its artifact.
# Usage:
#   scripts/financial-readiness-fetch-artifact.sh

WORKFLOW_FILE="financial-readiness-gate.yml"
ARTIFACT_NAME="financial-readiness"
TIMEOUT_SECONDS="${TIMEOUT_SECONDS:-900}"
POLL_SECONDS="${POLL_SECONDS:-10}"

if ! command -v gh >/dev/null 2>&1; then
  echo "ERROR: gh CLI is required" >&2
  exit 2
fi

if ! command -v jq >/dev/null 2>&1; then
  echo "ERROR: jq is required" >&2
  exit 2
fi

end_time=$((SECONDS + TIMEOUT_SECONDS))
run_id=""
conclusion=""

while [[ "$SECONDS" -lt "$end_time" ]]; do
  latest_run_json="$(gh run list --workflow "${WORKFLOW_FILE}" --limit 1 --json databaseId,status,conclusion)"
  run_id="$(printf '%s' "${latest_run_json}" | jq -r '.[0].databaseId // empty')"
  conclusion="$(printf '%s' "${latest_run_json}" | jq -r '.[0].conclusion // empty')"
  status="$(printf '%s' "${latest_run_json}" | jq -r '.[0].status // empty')"

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
  echo "ERROR: latest workflow run ${run_id} did not succeed (conclusion=${conclusion:-unknown})" >&2
  gh run view "${run_id}" --json conclusion,status,workflowName,headBranch,createdAt,updatedAt || true
  exit 1
fi

echo "Downloading artifact ${ARTIFACT_NAME} from run ${run_id}"
gh run download "${run_id}" -n "${ARTIFACT_NAME}"

if [[ -f financial-readiness.json ]]; then
  echo "Artifact contents:"
  jq . financial-readiness.json
else
  echo "ERROR: financial-readiness.json was not downloaded" >&2
  exit 1
fi

echo "PASS: readiness artifact fetched for run ${run_id}"
