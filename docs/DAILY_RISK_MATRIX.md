# Daily Risk Matrix - Production Readiness

Date baseline: 2026-05-30
Purpose: track active risks with ownership, severity, mitigation, and deadline.

## Severity Model

- Critical: blocks release or creates unacceptable production risk.
- High: major risk requiring immediate mitigation in active sprint.
- Medium: important but can be scheduled with control plan.
- Low: monitor and address as part of normal backlog.

## Active Risk Register

| ID | Risk | Severity | Owner | Mitigation Plan | Due Date | Status | Evidence |
| :-- | :-- | :-- | :-- | :-- | :-- | :-- | :-- |
| R-001 | High severity npm vulnerabilities | High | Security Lead | High vulnerabilities closed after remediation; keep moderate/low backlog tracked and CI security gate active | 2026-06-03 | Mitigated | docs/SECURITY_AUDIT_REPORT.md |
| R-001A | Backend e2e process hang from long-running guardian timer | High | Backend Lead | Added timer lifecycle control in RiskGuardianService (`onModuleDestroy` + clearInterval + unref) and revalidated affected specs | 2026-05-30 | Mitigated | apps/backend/src/v5/risk-guardian.service.ts |
| R-002 | Financial flows still operating in stub mode | Critical | Backend Lead | Fallback observability implemented (explicit mode + structured fallback logs) and readiness gate added (`/health/integrations/financial`) for strict live credential validation. Pending: staged E2E settlement evidence for PIX/x402/Etherfuse | 2026-06-07 | In Progress | apps/backend/src/health/health.controller.ts |
| R-003 | DEX integration pending | High | Smart Contract Lead | Blend readiness endpoint added (`/defi/blend/positions/status`) and focused controller coverage validated; remaining work is runtime integration and ABI compatibility | 2026-06-10 | In Progress | apps/backend/src/defi/blend/positions.controller.ts |
| R-004 | Frontend automated tests insufficient for critical flows | High | Frontend Lead | Add auth/payments/governance/wallet tests and run in CI; wallet detection, governance vote, login validation, passkey session, dashboard, stablecoin, profile auth, wallet fallback, loans, portfolio, governance page, trading, chat, Pix, notifications, docs, home, help, learn, recurring payments page, settings, DAO, insurance, bridge, RWA, SSI, cards, v4, risk, transactions history, risk analysis, dashboard analytics, and admin analytics coverage added as first Week 4 frontend slices | 2026-06-14 | In Progress | apps/frontend/src/__tests__/admin-analytics-page.test.tsx |
| R-005 | Backend low-coverage modules in guards/controllers | High | Backend Lead | Expand specs and enforce coverage trend monitoring; Soroban VC issuance status coverage added as a first Week 4 slice | 2026-06-14 | In Progress | apps/backend/src/chain/soroban.service.spec.ts |
| R-006 | Agent stack lacks automated validation and pip audit in CI | High | QA Lead | Add agent tests and pip audit CI step | 2026-06-17 | Open | agents/requirements.txt |
| R-008 | Rust audit warnings remain in contracts dependency chain (unmaintained/unsound/yanked transitives) | Medium | Smart Contract Lead | Keep dependency watchlist, evaluate upstream upgrades, and treat warnings as tracked debt while blocking only confirmed vulnerabilities | 2026-06-10 | In Progress | contracts/Cargo.lock |
| R-007 | Mainnet checklist not fully evidenced | Critical | Program Lead | Attach real evidence links and run rehearsal | 2026-06-20 | Open | docs/MAINNET_CHECKLIST_COMPLETE.md |

## Daily Update Routine

1. Update status for each open risk.
2. Add evidence path for any status change.
3. Escalate any Critical risk with no movement for 24h.
4. Escalate any High risk with no movement for 48h.

## Status Values

- Open
- In Progress
- Mitigated
- Accepted (requires Program Lead approval)
- Closed

## Escalation Rule

- If a risk due date is missed, it is escalated in the same day release review.
- If a Critical risk remains Open after due date, release progression is paused.
