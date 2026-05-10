# Prisma v7 Upgrade — Breaking Changes & Testing Plan

**Date:** 2026-05-02  
**Upgraded from:** Prisma 6.19.3  
**Upgraded to:** Prisma 7.8.0  
**Impact:** Backend (NestJS) + Shared ORM types

## Critical Breaking Changes in Prisma v7

### 1. **Generator Changes**
- **Issue:** `prisma generate` may output to different locations or with different CLI behavior.
- **Action Required:** Verify generated Prisma Client is correct in `node_modules/.prisma/client`.
- **Test:** Run `npx prisma generate` and confirm build succeeds.

### 2. **Database Driver Changes**
- **Issue:** Some database adapters may have breaking API changes.
- **Action Required:** Verify PostgreSQL adapter compatibility; Stellar may use custom connection pooling.
- **Test:** Database connection tests (see below).

### 3. **Query API Deprecations**
- **Issue:** Some Prisma query methods may have breaking signatures or removed features.
- **Action Required:** Search codebase for deprecated patterns (e.g., `.fields()`, old `.raw()` syntax).
- **Test:** Type-check full backend (`npx tsc --noEmit`).

### 4. **Aggregate / GroupBy Changes**
- **Issue:** `aggregations` and `groupBy` have breaking behavior changes in v7.
- **Action Required:** Review `apps/backend/src/**/*service.ts` for use of `aggregate()`, `groupBy()`.
- **Test:** Unit tests for aggregation queries.

### 5. **Floating-Point Precision**
- **Issue:** Prisma v7 may handle decimal/float types differently.
- **Action Required:** Verify financial calculations in portfolio, loans, stablecoin modules.
- **Test:** Numeric precision tests (critical for payment/trading logic).

## Testing Checklist

### Phase 1: Local Build & Type Check ✅
- [ ] `npx prisma generate` completes without errors
- [ ] `npx tsc --noEmit -p apps/backend/tsconfig.json` passes (0 errors)
- [ ] `npm run build --workspace=backend` succeeds

### Phase 2: Database Operations 🗄️
- **Setup:**
  ```bash
  cd apps/backend
  npm run test:db  # or similar if defined
  ```
- [ ] Prisma migrations apply without errors (`npx prisma migrate status`)
- [ ] Database seed runs without errors (if seed script exists)
- [ ] Basic CRUD operations work (create, read, update, delete)
- [ ] Transactions execute correctly
- [ ] Relations (hasMany, belongsTo, etc.) work as expected

### Phase 3: Unit Tests 🧪
- **Command:**
  ```bash
  cd apps/backend
  npm run test:cov
  ```
- [ ] All unit tests pass
- [ ] Code coverage maintained or improved
- [ ] No new warnings in test output

### Phase 4: E2E Tests 🔄
- **Command:**
  ```bash
  cd apps/backend
  npm run test:e2e
  ```
- [ ] All E2E tests pass
- [ ] Payment flows work correctly (portfolio, loans, stablecoin)
- [ ] DAO governance operations work
- [ ] Robo-advisor operations work

### Phase 5: Critical Business Logic 💰
- [ ] Portfolio value calculations accurate
- [ ] Loan interest calculations accurate
- [ ] Stablecoin supply/burn operations correct
- [ ] Recurring payment logic works
- [ ] DAO voting/governance operations work

### Phase 6: Integration & Smoke Tests 🚀
- **Command:**
  ```bash
  npm run test:smoke  # or defined smoke tests
  ```
- [ ] Backend API starts without errors
- [ ] Health check endpoint responds
- [ ] Critical endpoints return expected data
- [ ] Database connection pool behaves correctly

## Rollback Plan

If tests fail:
1. Revert Prisma to 6.19.3 in `apps/backend/package.json`
2. Run `npm install` to restore lockfile
3. Drop database and re-migrate with v6
4. Re-run full test suite

**Command:**
```bash
cd apps/backend
npm install prisma@6 --save
npm install
npx prisma migrate reset  # if safe; otherwise manual drop/restore
npm run test
```

## Recommended Merge Strategy

1. **Staging Validation:** Run all Phase 1-6 tests locally before pushing
2. **CI Validation:** Allow CI pipeline to run (should include all tests)
3. **Code Review:** Get approval from backend team lead
4. **Canary Deploy (if applicable):** Deploy to staging environment first
5. **Merge:** Merge after canary passes and no issues found

## Prisma v7 Resources

- [Prisma v7 Upgrade Guide](https://www.prisma.io/docs/orm/more/upgrade-guides/upgrading-to-prisma-5)
- [Prisma v7 Release Notes](https://github.com/prisma/prisma/releases)
- [Prisma Docs](https://www.prisma.io/docs)

## Notes

- Prisma v7 may include performance improvements; monitor before/after query logs if available
- Consider running Prisma Studio (`npx prisma studio`) to visually verify schema and data
- Keep Prisma, TypeScript, and Node.js versions synced with team standards

---

**Owner:** Backend Team  
**Priority:** High (breaking change)  
**Status:** Ready for review and testing
