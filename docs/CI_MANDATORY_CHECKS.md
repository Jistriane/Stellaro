# CI Mandatory Checks - Release Gating

Date baseline: 2026-05-30
Purpose: define merge and release gates required for production readiness.

## Merge Gate (All PRs)

Required checks:
- [ ] Install and dependency lock validation
- [ ] Lint and type checks
- [ ] Backend unit tests
- [ ] Backend E2E smoke tests
- [ ] Frontend test suite
- [ ] Build validation (frontend/backend)

Failure policy:
- Any failing required check blocks merge.
- Manual override allowed only by Program Lead plus Security Lead approval.

## Security Gate (Week 1 and Ongoing)

Required checks:
- [x] npm audit summary generated
- [x] High severity count must be 0 for release branch
- [x] pip audit report generated for agents stack
- [x] Cargo audit report generated for contracts stack

Current evidence snapshot (2026-05-30):
- `npm audit` (full scope): root high=0, backend high=0, frontend high=0.
- `cargo audit` (contracts): 0 vulnerabilities, warnings tracked as technical debt.
- `pip-audit` (agents): no known vulnerabilities; local artifact generated at `docs/pip-audit-report.json` via containerized Python.

Failure policy:
- Any high severity in release branch blocks merge and release.
- Any missing security artifact blocks release tagging.

## Coverage Gate

Required checks:
- [ ] Backend coverage trend generated
- [ ] Frontend coverage trend generated
- [ ] Critical-flow E2E suite green

Failure policy:
- Coverage below release threshold triggers warning state.
- Release blocked if critical-flow E2E fails.

## Deployment Readiness Gate

Required checks:
- [ ] Contract deployment smoke evidence attached
- [ ] Mainnet checklist evidence links present
- [x] Rollback rehearsal report attached
- [ ] Observability alerts validated

Rollback rehearsal evidence (2026-05-30):
- Executed in detached worktree `/tmp/stellaro-rollback-rehearsal`.
- Simulated dependency remediation + rollback using:
	- `npm audit fix --omit=dev` (change simulation)
	- `git restore package-lock.json package.json apps/backend/package.json apps/frontend/package.json` (rollback)
	- `npm ci` (state restore validation)
- Baseline and post-rollback audit counts matched exactly (`48|19|25|4|0`).

Failure policy:
- Missing deployment evidence blocks go/no-go approval.

## Artifact Retention Rules

- Keep CI artifacts for at least 30 days.
- Keep release-candidate artifacts for at least 180 days.
- Security reports must be timestamped and immutable once attached to a release decision.

## Daily Operational Use

- QA Lead verifies test and coverage checks.
- Security Lead verifies security checks.
- DevOps Lead verifies deployment/readiness checks.
- Program Lead confirms gate decision in release log.
