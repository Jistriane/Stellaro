# Coverage Roadmap Q2 2026

**Status Date**: May 1, 2026  
**Current Coverage**: 60.07% statements | 573 tests | 86 suites  
**Target Q2**: 70% statements | 800+ tests | 95+ suites  
**Cycle Time**: 18.15s with `--coverage`

---

## Executive Summary

Over the past 2 weeks, test coverage increased by **~24% from 36%** through strategic expansion of 3 priority services:

| Service | Impact | Status |
|---------|--------|--------|
| `Eliza Service` | ↓ 42.9% uncovered lines (77→44) | 🎯 Major Win |
| `Soroban Service` | ↓ 11.6% uncovered lines (121→107) | ✅ Improved |
| `Ingestor Service` | **Exited top-10** | ✅ Significant |

---

## Current State (May 1, 2026)

### Coverage Metrics
```
Statements: 60.07% (+24.96% from Dec 2025)
Branches:   ~55%   (+20.67% from Dec 2025)
Functions:  ~58%   (+25.21% from Dec 2025)
Lines:      ~60%   (+24.38% from Dec 2025)
```

### Test Execution
- **Total Tests**: 573 (passed) + 1 (skipped) = 574
- **Test Suites**: 86 (all passing)
- **Runtime**: 18.15 seconds with `--coverage`
- **Environment**: Jest, node, mocked external services

### Top-10 Uncovered Files (by uncovered line count)

| # | File | Uncovered | Change | Tests | Priority |
|---|------|-----------|--------|-------|----------|
| 1 | `src/chain/soroban.service.ts` | 107 | ↓ 14 | 17 | ✅ |
| 2 | `src/passkey/passkey.service.ts` | 77 | — | 11 | 🔄 |
| 3 | `src/passkey/passkey-session.service.ts` | 72 | — | 8 | 🔄 |
| 4 | `src/cache/cache.service.ts` | 68 | — | 5 | 🔄 |
| 5 | `src/oracles/reflector-oracle.service.ts` | 61 | — | 4 | 🔄 |
| 6 | `src/chain/chain.service.ts` | 56 | ↓ 10 | 3 | ✅ |
| 7 | `src/governance/governance.service.ts` | 50 | — | 9 | 🔄 |
| 8 | `src/eliza/eliza.service.ts` | 44 | ↓ 33 | 20 | ✅ |
| 9 | `src/oracles/oracles.service.ts` | 40 | — | 10 | 🔄 |
| 10 | `src/app.module` | 39 | — | 0 | 🔄 |

---

## Completed Expansions (Phase 1)

### 1. Soroban Service (`src/chain/soroban.service.spec.ts`)
**Status**: ✅ Complete (17 tests, +7 new)

**Focus Areas**:
- ✅ RPC degradation fallback
- ✅ Loans pool params with env var fallback
- ✅ Path-finding via Horizon API
- ✅ Stablecoin supply decoding (scvI128→numeric)
- ✅ Minting control enforcement
- ✅ Batch contract actions

**Result**: 121 → 107 uncovered lines (-14, -11.6%)

---

### 2. Ingestor Service (`src/analytics/ingestor.service.spec.ts`)
**Status**: ✅ Complete (9+ tests, +7 new)

**Focus Areas**:
- ✅ Initialization from DB watermark
- ✅ Boolean/numeric normalization (e.g., 'true'→true, '5000'→5000)
- ✅ Event cascade (governance→stablecoin mirror updates)
- ✅ Mirror upsert validation
- ✅ Contract matching logic

**Result**: 71 uncovered → **Exited top-10** ✅

---

### 3. Eliza Service (`src/eliza/eliza.service.spec.ts`)
**Status**: ✅ Complete (20 tests, +13 new)

**Focus Areas**:
- ✅ Timer management with `.unref()` cleanup
- ✅ HTTP POST orchestration with dev mode fallback
- ✅ Workflow mock implementations
- ✅ Dev/prod error handling modes
- ✅ Agent action triggering

**Result**: 77 → 44 uncovered lines (-33, **-42.9%**) 🎯

---

## Next Phase (Q2 2026 - Weeks 3-4)

### Priority Files for Expansion

#### High Impact (>60 uncovered lines)

**A. Passkey Services** (77 + 72 uncovered = **149 total**)
- Files: `src/passkey/passkey.service.ts` + `src/passkey/passkey-session.service.ts`
- Est. Tests: +25-30 new tests
- Focus: WebAuthn flow, session management, credential persistence
- Est. Coverage Gain: -50 lines (↓ ~30%)

**B. Cache Service** (68 uncovered)
- File: `src/cache/cache.service.ts`
- Est. Tests: +12-15 new tests
- Focus: Redis operations, TTL handling, cache invalidation
- Est. Coverage Gain: -35 lines (↓ ~50%)

#### Medium Impact (50-60 uncovered lines)

**C. Reflector Oracle** (61 uncovered)
- File: `src/oracles/reflector-oracle.service.ts`
- Est. Tests: +10-15 new tests
- Focus: Price feed aggregation, fallback mechanisms
- Est. Coverage Gain: -30 lines (↓ ~50%)

**D. Chain Service** (56 uncovered, already partial improvements)
- File: `src/chain/chain.service.ts`
- Est. Tests: +8-12 new tests (build on existing 3)
- Focus: Argument encoding, contract simulation
- Est. Coverage Gain: -25 lines (↓ ~45%)

---

## Q2 Coverage Targets

### Week 3-4 Goals (May 8-22)
- [ ] **Passkey expansion**: +25 tests → 60% passkey coverage
- [ ] **Cache expansion**: +12 tests → 50% cache coverage
- [ ] **Reflector Oracle expansion**: +10 tests → 40% reflector coverage
- [ ] **Statements target**: 65% (+5%)
- [ ] **Branches target**: 58% (+3%)
- [ ] **New baseline**: 630+ tests in 90+ suites

### Month Goals (May 30)
- [ ] **All top-5 files**: <50 uncovered lines
- [ ] **Statements target**: 70% (+10% from May 1)
- [ ] **Branches target**: 62% (+7%)
- [ ] **New baseline**: 750+ tests in 95+ suites

---

## Test Infrastructure

### Mocking Strategy
- **Prisma**: In-memory storage (users, wallets, passkeys, PIX events)
- **Redis**: In-memory cache with TTL and metrics
- **Reserve Manager**: Compliance stub
- **Ingestor**: Polling stub (prevents background loops)
- **Soroban SDK**: Dynamic require with graceful fallback

### Quality Standards
- ✅ **Determinism**: 100% reproducible, no flakiness
- ✅ **Isolation**: Zero external dependencies (no DB, Redis, RPC)
- ✅ **Speed**: 18.15s for full coverage run
- ✅ **Reliability**: All 573 tests passing consistently

---

## Tools & Commands

### Run Tests with Coverage
```bash
cd apps/backend
npm run test -- --coverage
```

### Generate LCOV Report (top-10)
```bash
python3 ../../scripts/parse_lcov_top10.py coverage/lcov.info
```

### Run Single Spec
```bash
npm test -- src/path/to/service.spec.ts
```

### Watch Mode
```bash
npm test -- --watch
```

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Timer leaks in long-running tests | Medium | Use `.unref()` and explicit cleanup in afterEach |
| Mock brittleness | Medium | Centralize stubs in test-utils.ts |
| False positives in assertions | Low | Verify with actual service calls in dev |
| LCOV parser edge cases | Low | Maintain Python parser with unit tests |

---

## Success Criteria

### By End of Q2 (May 30)
- ✅ **Statements**: 70% (from 60.07%)
- ✅ **Branches**: 62% (from ~55%)
- ✅ **Functions**: 68% (from ~58%)
- ✅ **Lines**: 70% (from ~60%)
- ✅ **Top-5 files**: All <50 uncovered lines
- ✅ **Test count**: 750+ in 95+ suites

### By End of Q3 (August 31)
- ✅ **Statements**: 80%+
- ✅ **Branches**: 75%+
- ✅ **Functions**: 80%+
- ✅ **Lines**: 80%+
- ✅ **All files**: <30 uncovered lines (except excluded)

---

## References

- [TESTING_SUMMARY.md](TESTING_SUMMARY.md) — Current status and metrics
- [TESTING.md](TESTING.md) — Quick start guide
- [E2E_TESTING.md](E2E_TESTING.md) — Infrastructure details
- `Stellaro/scripts/parse_lcov_top10.py` — LCOV parser tool
- `Stellaro/apps/backend/test/test-utils.ts` — Mock utilities
