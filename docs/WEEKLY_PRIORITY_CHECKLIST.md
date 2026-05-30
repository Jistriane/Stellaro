# Weekly Priority Checklist - Production Readiness

Date baseline: 2026-05-30
Scope: Close all current release blockers and reach mainnet go/no-go quality gate.

## Ownership Model

- Program Lead: tracks cross-team dependencies and go/no-go readiness.
- Security Lead: owns dependency and runtime security hardening.
- Backend Lead: owns financial integrations, API reliability, and backend test coverage.
- Frontend Lead: owns UI critical flows and frontend regression coverage.
- Smart Contract Lead: owns DEX integration, contract interface parity, and deployment evidence.
- QA Lead: owns E2E coverage and release evidence quality.
- DevOps Lead: owns CI reliability, observability, and rollback rehearsals.

## Week 1 - Security Blockers

Owner set: Security Lead, Backend Lead, DevOps Lead

- [x] Close all high severity npm vulnerabilities.
- [x] Re-run dependency scans in local baseline and publish updated report snapshot.
- [x] Validate no production-breaking package updates.
- [x] Run backend and frontend build smoke checks after upgrades.
- [ ] Publish approved dependency upgrade changelog.

Week 1 exit gate:
- [x] High severity vulnerabilities = 0.
- [ ] CI security jobs green on default branch.
- [x] Rollback procedure tested for dependency rollback.

## Week 2 - Live Integrations (Replace Stubs)

Owner set: Backend Lead, Security Lead, QA Lead

- [ ] Move PIX critical flow to live-ready integration path in staging.
- [ ] Move x402 flow to live mode in staging with validated credentials.
- [ ] Move Etherfuse flow to live mode in staging with validated credentials.
- [ ] Enforce explicit fallback behavior and telemetry for all integration states.
- [ ] Validate end-to-end settlement paths with signed evidence.

Week 2 exit gate:
- [ ] Three financial E2E flows completed in staging.
- [ ] Monitoring alerts exist for integration failure modes.
- [ ] No silent fallback from live to stub without alert.

## Week 3 - DEX and Contract Completion

Owner set: Smart Contract Lead, Backend Lead, QA Lead

- [ ] Complete real DEX integration path.
- [ ] Expose and validate missing admin/adapter methods required for operations.
- [ ] Validate ABI compatibility for all mutation scripts.
- [ ] Register all contract IDs in canonical deployment registry.
- [ ] Generate fresh deployment evidence bundle.

Week 3 exit gate:
- [ ] Contract registry updated and reviewed.
- [ ] Read and mutation smoke tests green.
- [ ] No pending DEX placeholder in canonical references.

## Week 4 - Test Coverage Expansion

Owner set: Frontend Lead, Backend Lead, QA Lead

- [ ] Add frontend tests for auth, wallet, payments, governance, and profile flows.
- [ ] Expand backend specs for guards/controllers listed as low coverage targets.
- [ ] Add CI quality gate for minimum frontend and backend coverage.
- [ ] Stabilize flaky tests and publish quarantine policy.

Week 4 exit gate:
- [ ] Coverage reaches agreed release threshold.
- [ ] Critical user journeys have deterministic E2E tests.
- [ ] Test pipeline runtime remains within team SLA.

## Week 5 - Agents and Operations Hardening

Owner set: Backend Lead, QA Lead, DevOps Lead

- [ ] Add automated tests for Python agents orchestration and failure handling.
- [ ] Run pip audit in CI and remediate blocking issues.
- [ ] Execute integrated load tests and capture SLO results.
- [ ] Validate observability dashboards and alert routes.

Week 5 exit gate:
- [ ] Agent test suite in CI with stable pass rate.
- [ ] Load test report approved by Program Lead.
- [ ] Incident playbooks validated by simulation.

## Week 6 - Mainnet Readiness and Go/No-Go

Owner set: Program Lead, DevOps Lead, all leads

- [ ] Fill mainnet checklist using real evidence links.
- [ ] Run full release candidate rehearsal (deploy and rollback).
- [ ] Verify legal/compliance evidence package completeness.
- [ ] Conduct final go/no-go review meeting and decision log.

Week 6 exit gate:
- [ ] Mainnet checklist completed and signed.
- [ ] Release candidate rehearsal successful.
- [ ] Go/no-go decision documented.

## Weekly Cadence

- Monday: plan lock and dependency review.
- Tuesday to Thursday: execution and test evidence collection.
- Friday: release review, risk register update, and next-week lock.

## Escalation Rules

- Any blocker older than 48h escalates to Program Lead.
- Any security regression re-opens Week 1 gate immediately.
- Any failed critical E2E blocks release progression.
