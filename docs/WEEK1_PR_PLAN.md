# Week 1 PR Plan - Security Hardening

Date baseline: 2026-05-30
Scope: close all high severity dependency risks with controlled delivery and rollback safety.

## Branching Strategy

- Base branch: master
- Working pattern: one PR per risk cluster
- Naming convention: chore/security-week1-<topic>

## PR-01 - npm High Severity Remediation Core

Owner: Security Lead
Reviewers: Backend Lead, Frontend Lead

Scope:
- Upgrade direct dependencies that resolve current high severity advisories.
- Upgrade lockfiles in controlled way.
- No feature changes.

Expected files:
- package.json (root and affected workspaces)
- package-lock.json (root and affected workspaces)
- docs/SECURITY_AUDIT_REPORT.md

Acceptance criteria:
- High severity advisories reduced with evidence.
- Build and smoke checks passing.
- Rollback command documented in PR description.

## PR-02 - Transitive Dependency and Toolchain Risk Cleanup

Owner: Security Lead
Reviewers: DevOps Lead

Scope:
- Resolve remaining transitive vulnerabilities (moderate target reduction).
- Align lint/test tooling versions if required.

Expected files:
- package-lock.json
- optional tool configs (only if required for compatibility)

Acceptance criteria:
- No new high severity introduced.
- CI mandatory checks green.

## PR-03 - CI Security Gates and Policy Enforcement

Owner: DevOps Lead
Reviewers: Security Lead

Scope:
- Add/adjust CI jobs for npm audit and pip audit reporting.
- Enforce severity gate for release branch.

Expected files:
- .github/workflows/*
- docs/SECURITY_AUDIT_REPORT.md
- docs/CI_MANDATORY_CHECKS.md

Acceptance criteria:
- Security gate blocks merges when high severity is detected.
- CI artifacts include scan summaries.

## PR-04 - Regression Stabilization After Upgrades

Owner: Backend Lead + Frontend Lead
Reviewers: QA Lead

Scope:
- Fix regressions from security upgrades.
- Keep changes minimal and localized.

Expected files:
- Affected app files only
- test/spec files for adjusted behavior

Acceptance criteria:
- Unit and E2E critical flows pass.
- No unresolved blocker in release candidate path.

## PR-05 - Week 1 Closure Report

Owner: Program Lead
Reviewers: All leads

Scope:
- Consolidate final vulnerability status and evidence links.
- Record Week 1 gate decision.

Expected files:
- docs/SECURITY_AUDIT_REPORT.md
- docs/DAILY_RISK_MATRIX.md
- docs/EXECUTION_PLAN.md (optional status update)

Acceptance criteria:
- Week 1 exit gate marked as pass/fail with rationale.
- Open risks include owner and mitigation date.

## PR Execution Order

1. PR-01
2. PR-02
3. PR-03
4. PR-04
5. PR-05

## Initial Remediation Targets (from 2026-05-30 baseline)

- Frontend first-wave targets: `next`, `axios`, `picomatch`, `minimatch`
- Backend first-wave targets: `serialize-javascript`, `lodash`, `path-to-regexp`, `multer`, `axios`
- Cross-workspace targets to coordinate: `@nestjs/*`, `prisma`, `typeorm`

Rationale:
- Frontend has smaller set and can validate fast wins.
- Backend carries most of the high-severity footprint and needs controlled rollout.

## Fast Rollback Protocol

- Keep each PR independent and small.
- If any PR causes release-blocking regression, revert that PR immediately.
- Re-open a fix PR with reduced scope.

## Evidence Required Per PR

- CI run link
- Security scan summary
- Test summary
- Rollback note

## Execution Snapshot (2026-05-30)

- Baseline start: root 22 high, backend 21 high, frontend 4 high.
- After remediation wave: root 1 high, backend 1 high, frontend 1 high.
- Residual blocker: transitive `picomatch` advisory shared by tooling dependencies.
- Latest totals: root 15 total (1 high, 13 moderate, 1 low).
- Validation: backend build and frontend build completed successfully; frontend tests passed (11/11).
- Backend regression checks after dependency hardening: auth unit (12/12), auth e2e (11/11), positions e2e (4/4) all passing.
- Stability hardening applied: `RiskGuardianService` now clears monitoring interval on module destroy to avoid hanging e2e processes.
- Full backend test gate now validated: 80 unit suites passed and 9 e2e suites passed.
- Production audit refresh (`--omit=dev`): root 13 total (1 high), backend 1 total (1 high), frontend 3 total (1 high).
- Post-fix production audit (`--omit=dev`): root 12 total (0 high), backend 0 total (0 high), frontend 2 total (0 high).
- Full-scope audit (with dev): root 14 total (0 high), backend 1 total (0 high), frontend 2 total (0 high).
- Week 1 high-severity objective reached (high=0); remaining findings are moderate/low and tracked for controlled remediation.
- Rollback rehearsal executed in isolated worktree and validated via restore + `npm ci` (rollback reproducible without touching active branch state).
- Rust security remediation applied: `time` updated to `0.3.47` in contracts lockfile, removing `RUSTSEC-2026-0009` from `cargo-audit`.
- CI workflow hardening added: `cargo audit` (warnings tolerated) plus new `security-agents` job with `pip-audit` artifact upload.
- Agent security artifact generated locally via containerized `pip-audit` with no known vulnerabilities (`docs/pip-audit-report.json`).
- CI security gate confirmed on default branch via dedicated workflow `Security Gate`.
- Evidence run: GitHub Actions run `26676718227` (master) with all jobs green:
	- `NPM Audit High-Severity Gate`: success
	- `Cargo Audit Vulnerability Gate`: success
	- `Pip Audit Agents Gate`: success
