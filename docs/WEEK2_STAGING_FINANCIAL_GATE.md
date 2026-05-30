<!-- markdownlint-disable-file MD025 MD032 MD007 MD010 MD033 -->

# Week 2 Staging Financial Gate Runbook

Date baseline: 2026-05-30
Purpose: execute and evidence Week 2 live-integration gate for PIX, x402, and Etherfuse.

## Scope

This runbook validates:
- Explicit integration mode status per rail.
- Strict live-mode credential readiness.
- Evidence collection for release documentation.

## Prerequisites

- Staging backend URL is available and reachable.
- Staging environment variables are configured for rails expected in live mode.
- GitHub CLI is authenticated if you want workflow-dispatch evidence.

## Step 1 - Fast status snapshot

Command:

curl -sS https://<staging-backend>/payments/pix/status | jq .
curl -sS https://<staging-backend>/payments/x402/status | jq .
curl -sS https://<staging-backend>/payments/etherfuse/status | jq .

Expected:
- Each endpoint returns mode metadata.
- Any non-live mode has explicit fallback reason.

## Step 2 - Strict readiness gate

Command (local shell):

scripts/financial-integrations-readiness-check.sh https://<staging-backend> true

Expected:
- Exit code 0.
- Response status is ok.
- summary.liveRails equals 3.

Failure handling:
- If status is failed, inspect checks[] codes and fix missing credentials/mode drift.

## Step 3 - CI evidence artifact (optional but recommended)

Run workflow dispatch:

scripts/financial-readiness-evidence.sh https://<staging-backend> true

Expected:
- Workflow job succeeds.
- Artifact financial-readiness.json exists and shows status ok.
- Use `scripts/financial-evidence-format.sh financial-readiness.json <staging-backend> <run-id> <timestamp-utc>` to generate paste-ready evidence text.

## Step 4 - Documentation evidence update

Update these documents with real run IDs/timestamps:
- docs/DAILY_ACCEPTANCE_CRITERIA.md
- docs/WEEKLY_PRIORITY_CHECKLIST.md
- docs/DAILY_RISK_MATRIX.md

Required entries:
- Staging URL used (masked if needed).
- Run timestamp (UTC).
- readiness status and summary.liveRails.
- Workflow run ID (if CI path was executed).

## Exit Criteria

Week 2 gate is considered closed when:
- Strict readiness check passes in staging.
- Artifact evidence is attached (manual output or workflow artifact).
- Remaining Week 2 checklist items are updated with links/evidence.
