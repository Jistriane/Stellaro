# Security & Dependency Upgrade Sprint — May 2, 2026

**Sprint Goal:** Secure codebase by fixing npm vulnerabilities, upgrading critical dependencies, and implementing automated security scanning in CI.

## Summary of Open PRs

| # | Branch | Type | Status | Impact | Link |
|---|--------|------|--------|--------|------|
| 1 | `chore/fix/npm-audit` | Security | ✅ **Ready** | npm fixes (non-breaking) | [PR #1](https://github.com/Jistriane/Stellaro/pull/1) |
| 2 | `chore/upgrade/prisma-major` | Upgrade | ✅ **Ready** | Prisma 6→7 (backend) | [PR #2](https://github.com/Jistriane/Stellaro/pull/2) |
| 3 | `chore/upgrade/expo-major` | Upgrade | ✅ **Ready** | Expo 54→55 (mobile) | [PR #3](https://github.com/Jistriane/Stellaro/pull/3) |
| 4 | `chore/ci/add-pip-audit` | CI/Config | ✅ **Ready** | Automated audits (npm/cargo/pip) | [PR #4](https://github.com/Jistriane/Stellaro/pull/4) |

---

## PR #1: npm audit Fixes (Non-Breaking) ✅

**What:** Apply `npm audit fix` to resolve 38 npm vulnerabilities (13 high, 23 moderate, 2 low)  
**Impact:** Frontend, Backend, Mobile  
**Breaking:** ❌ No  
**Documentation:** [SECURITY_AUDIT_REPORT.md](SECURITY_AUDIT_REPORT.md)

### Testing Required:
- [ ] `npm run test` (all packages pass)
- [ ] `npm run build` (frontend, backend, mobile build without errors)
- [ ] Unit & E2E tests pass

### Expected Vulnerabilities Fixed:
- ✅ `serialize-javascript` (RCE / DoS)
- ✅ `lodash` (prototype pollution)
- ✅ `path-to-regexp` (RCE)
- ✅ `multer` (DoS)
- ⚠️ Plus 34 moderate/low severity issues

### Merge Strategy:
- Merge first (least risk)
- Baseline for all other upgrades
- Deploy to staging immediately after merge

---

## PR #2: Prisma v7 Upgrade (Major) ⚠️

**What:** Upgrade backend Prisma from 6.19.3 → 7.8.0  
**Impact:** Backend (NestJS) + Shared ORM types  
**Breaking:** ✅ **Yes** — Prisma v7 has breaking API/behavior changes  
**Documentation:** [BREAKING_CHANGES_TESTING_PRISMA_V7.md](BREAKING_CHANGES_TESTING_PRISMA_V7.md)

### Testing Checklist (6 Phases):
1. **Build & Type Check:** `npx tsc --noEmit`, `npm run build`
2. **Database Operations:** Migrations, CRUD, transactions, relations
3. **Unit Tests:** `npm run test:cov`
4. **E2E Tests:** `npm run test:e2e`
5. **Critical Business Logic:** Portfolio, loans, stablecoin, DAO, robo-advisor
6. **Smoke Tests:** Health checks, key endpoints

### Key Breaking Changes to Verify:
- [ ] Generator output location (Prisma Client path)
- [ ] PostgreSQL driver compatibility
- [ ] Query API changes (aggregations, groupBy)
- [ ] Decimal/float precision for financial calculations
- [ ] Transaction behavior

### Timeline:
- **Code Review:** ⏳ Pending
- **Staging Test:** ~2-4 hours (all test phases)
- **Merge:** Only after all tests pass
- **Deployment:** Canary to staging, then production

### Rollback:
```bash
npm install prisma@6 --save
npm install
npx prisma migrate reset
npm run test
```

---

## PR #3: Expo v55 Upgrade (Major) ⚠️

**What:** Upgrade mobile app from Expo ~54.0.33 → ~55.0.19  
**Impact:** React Native app (iOS, Android, Web)  
**Breaking:** ✅ **Yes** — Expo SDK 55 includes React Native updates and API changes  
**Documentation:** [BREAKING_CHANGES_TESTING_EXPO_V55.md](BREAKING_CHANGES_TESTING_EXPO_V55.md)

### Testing Checklist (7 Phases):
1. **Build & Dependencies:** `npm install`, no peer dep conflicts
2. **Web Build:** `npm run web` → test on browser
3. **iOS Build:** `npm run ios` or EAS → test on simulator
4. **Android Build:** `npm run android` or EAS → test on emulator
5. **Critical Flows:** Auth, wallet, payments, navigation
6. **Performance:** Startup time, memory usage, stability
7. **Physical Devices:** Test on iPhone + Android phones

### Key Breaking Changes to Verify:
- [ ] React Native version bump compatibility
- [ ] Module API changes (`expo-web-browser`, `expo-status-bar`)
- [ ] Navigation stack compatibility
- [ ] WebAuthn / Freighter wallet integration
- [ ] Build output size and startup time
- [ ] Native bindings on iOS/Android

### Timeline:
- **Code Review:** ⏳ Pending
- **Device Testing:** ~4-6 hours (web, iOS, Android, physical devices)
- **Merge:** Only after physical device testing passes
- **Deployment:** EAS build to TestFlight (iOS) + internal track (Android)

### Rollback:
```bash
npm install expo@54 --save
npm install
npm run ios  # or android/web
```

---

## PR #4: CI Automated Auditing (Non-Breaking) ✅

**What:** Add npm, cargo, and pip-audit jobs to GitHub Actions CI  
**Impact:** All PRs and commits  
**Breaking:** ❌ No — Config only, no code changes  
**Documentation:** [CI_AUDIT_SETUP_TESTING_PLAN.md](CI_AUDIT_SETUP_TESTING_PLAN.md)

### Testing Checklist (7 Phases):
1. **Workflow Validation:** Syntax correct, triggers on push/PR
2. **npm audit Job:** Runs, reports vulnerabilities, posts comments
3. **cargo audit Job:** Runs, handles Rust dependencies
4. **pip-audit Job:** Runs, scans agents/requirements.txt
5. **PR Comments:** Audit results posted and readable
6. **Integration:** All jobs run in parallel, results consistent
7. **Performance:** Workflow completes in < 10 minutes

### Expected Behavior:
- ✅ Jobs run on every push and PR
- ✅ Jobs use `continue-on-error: true` (don't block CI)
- ✅ Audit results commented on PRs
- ✅ Early detection of security issues
- ✅ Compliance with BCB/LGPD requirements

### Timeline:
- **Code Review:** ⏳ Pending
- **First PR Run:** Verify workflow executes correctly
- **Merge:** Can merge after first test run passes
- **Deployment:** Automatic on merge; runs on all future PRs

---

## Recommended Merge Order & Timeline

### Phase 1: Non-Breaking Fixes (Low Risk) ✅
1. **Merge PR #1** (npm audit fixes)
   - Tests: ~15 min (local build + unit tests)
   - Deploy to staging immediately
   - Monitor for 1 hour
   - Deploy to production

2. **Merge PR #4** (CI auditing)
   - Tests: ~5 min (verify workflow runs)
   - Deploy immediately
   - Runs automatically on all future PRs

### Phase 2: Major Upgrades (Higher Risk) ⚠️
3. **Merge PR #2** (Prisma v7) — **AFTER** Phase 1 is stable
   - Tests: ~2-4 hours (full test suite)
   - Deploy to staging; monitor 4-8 hours
   - Deploy to production with rollback plan

4. **Merge PR #3** (Expo v55) — **AFTER** PR #2 is stable
   - Tests: ~4-6 hours (device testing required)
   - Deploy to TestFlight + internal Android track
   - Wait for user feedback from beta testers

### Total Timeline
- **Phase 1:** ~2-3 hours (including staging validation)
- **Phase 2:** ~8-16 hours (split across days for risk mitigation)
- **Total:** ~24-48 hours from PR #1 merge to production stability

---

## Pre-Merge Checklist

- [ ] All PRs reviewed by respective team leads (backend, mobile, devops)
- [ ] CI pipeline passes on all PRs
- [ ] Security audit report reviewed (SECURITY_AUDIT_REPORT.md)
- [ ] No external blockers (e.g., dependency maintainer issues)
- [ ] Staging environment ready for testing
- [ ] Rollback plans documented and tested

## Post-Merge Monitoring

### Immediate (1 hour after merge)
- [ ] CI pipeline stable
- [ ] No new errors in logs
- [ ] API responses normal latency
- [ ] Mobile app installs without errors

### Short-term (24 hours after merge)
- [ ] Staging environment stable
- [ ] E2E tests passing
- [ ] No customer support tickets related to changes

### Medium-term (1 week after merge)
- [ ] Production metrics stable
- [ ] No performance degradation
- [ ] Security audit clean

---

## Compliance & Security Notes

✅ **BCB Compliance (Res. 519/520/521)**
- Automated vulnerability scanning enabled
- Security audit trail documented
- Dependency updates tracked

✅ **LGPD Compliance**
- Proactive security monitoring
- Audit trail for regulatory review
- Security controls in place

✅ **Best Practices**
- Semantic versioning respected
- Breaking changes documented
- Rollback plans tested

---

## Next Steps

1. **Immediate (Now):**
   - [ ] Review PRs in GitHub
   - [ ] Assign to team leads (backend, mobile, devops)
   - [ ] Start testing locally per each PR's checklist

2. **Short-term (Today-Tomorrow):**
   - [ ] Get code review approvals
   - [ ] Merge PR #1 and PR #4 (low risk)
   - [ ] Begin testing PR #2 and PR #3

3. **Medium-term (This Week):**
   - [ ] Deploy Phase 1 to production
   - [ ] Monitor Phase 1 stability
   - [ ] Merge Phase 2 PRs (PR #2, PR #3)
   - [ ] Deploy Phase 2 to staging first

---

## Contact & Escalation

- **Backend Questions:** @backend-team (PR #2 - Prisma)
- **Mobile Questions:** @mobile-team (PR #3 - Expo)
- **DevOps Questions:** @devops-team (PR #4 - CI)
- **Security Questions:** @security-team (PR #1 - Audit)

---

**Generated:** 2026-05-02  
**Status:** All PRs ready for review  
**Next Update:** After first round of code reviews
