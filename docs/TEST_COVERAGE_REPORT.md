# Test Coverage Report - Stellaro Backend

Date: 2025-12-03

Test Summary

- Unit: 63 suites passed, 270 tests passed (1 skipped)
- E2E: 9 suites passed, 46 tests passed
- Note: Warnings from stubbed services (Soroban, ZK, PIX, Reserve) are expected and do not indicate failure.

Coverage (Unit — npm run test)

- Statements: 35.11%
- Branches: 34.44%
- Functions: 32.60%
- Lines: 35.62%

Coverage (E2E — npm run test:e2e)

- Statements: 45.36%
- Branches: 31.11%
- Functions: 32.52%
- Lines: 43.15%

Highlighted Files

- src/actions/actions.service.ts: Stmts 96.47%, Branch 84%, Funcs 100%, Lines 96.38%
- src/health/health.controller.ts: 100% in all metrics
- src/metrics/metrics.controller.ts: 100% in all metrics
- src/payments/pix.service.ts: Stmts 75.65%, Branch 67.02%, Funcs 100%, Lines 75.22%
- src/zk/zk.service.ts: Stmts 56.3%, Branch 57.57%, Funcs 100%, Lines 55.55%

Modules with Low Coverage (next targets)

- src/main.ts, src/app.module.ts, controllers without specs (analytics, memory, webhooks, zk.controller)
- guards: jwt/session/mfa/admin/eliza
- src/chain/chain.service.ts, src/chain/soroban.service.ts
- src/governance/governance.service.ts

Stability and Teardown

- `--detectOpenHandles` (Unit/E2E): no leaks.
- Note: Without `--detectOpenHandles`, Jest may force-exit a worker due to active timers. Standardizing this flag in CI helps identify sources early.

How to Generate Reports Locally

```bash
# Unit tests with coverage and handle detection
cd apps/backend
npm run test -- --coverage --detectOpenHandles

# E2E with handle detection
npm run test:e2e:detect

# Combined execution (unit + e2e) with coverage
npm run test:all --silent
```

Note on Integration Environment

- To re-enable the on-chain PoR publication test, configure real environment variables (network, keys and contracts) and run in integration mode. See `apps/backend/.env.test.example` and `docs/E2E_TESTING.md`.
