# Daily Acceptance Criteria - Priority Closure

Date baseline: 2026-05-30
Purpose: Define objective acceptance checks for daily execution tracking.

## Rule Set

- Every completed item must link to evidence (test output, report, commit, or log).
- Every critical item must include rollback verification.
- No item is accepted when only local success exists without CI confirmation.

## Priority 1 - Security Hardening

Daily acceptance:
- [ ] Dependency updates are committed with explicit package diff.
- [ ] Security scan results are attached and reviewed.
- [ ] No new high severity issue introduced.
- [ ] Smoke tests pass after each dependency batch.

Definition of done:
- [ ] High severity count is zero on default branch.
- [ ] Security report updated with timestamp and scan command.

## Priority 2 - Live Financial Integrations

Daily acceptance:
- [ ] Integration mode is explicitly tracked (disabled/stub/live) in status endpoints.
- [ ] Live credential validation is tested in staging.
- [ ] Failure path emits structured logs and alerts.
- [ ] At least one end-to-end flow is revalidated after changes.

Definition of done:
- [ ] PIX, x402, and Etherfuse live paths validated in staging.
- [ ] No critical path silently falls back without alert.

## Priority 3 - DEX and Smart Contract Runtime

Daily acceptance:
- [ ] ABI compatibility checks run for changed contracts.
- [ ] Read and mutation smoke tests executed for touched modules.
- [ ] Contract registry updated for every new deployed ID.
- [ ] Script outputs archived in evidence report.

Definition of done:
- [ ] DEX flow is operational in test environment.
- [ ] Required contract methods are callable and verified.

## Priority 4 - Test Coverage and Stability

Daily acceptance:
- [ ] New critical-flow tests added with deterministic assertions.
- [ ] Flaky tests are fixed or quarantined with issue reference.
- [ ] Coverage trend is posted for backend and frontend.
- [ ] CI pass rate is within agreed target.

Definition of done:
- [ ] Coverage goals met for release threshold.
- [ ] Critical user journeys protected by automated tests.

## Priority 5 - Agents and Operational Readiness

Daily acceptance:
- [ ] Agent test suite runs in CI and reports pass/fail by scenario.
- [ ] pip audit status updated in pipeline report.
- [ ] Load test execution and SLO deltas published.
- [ ] Alerting, runbooks, and escalation paths validated.

Definition of done:
- [ ] Agent automation has reliable test and audit coverage.
- [ ] Operations readiness evidence is complete for release review.

## Priority 6 - Mainnet Go/No-Go

Daily acceptance:
- [ ] Mainnet checklist entries are marked only with supporting evidence.
- [ ] Release candidate rehearsal logs are attached.
- [ ] Open risks include owner and mitigation deadline.

Definition of done:
- [ ] Checklist is fully completed and signed by leads.
- [ ] Go/no-go outcome is documented with decision rationale.

## Daily Standup Template

- Yesterday completed:
- Today planned:
- Blockers:
- Evidence links:
- Risk change (up/down/no-change):
