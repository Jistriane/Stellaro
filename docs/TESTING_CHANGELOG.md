# Test Coverage Changelog

**Last Updated**: May 1, 2026

---

## [60.07%] - May 1, 2026

### Summary
Major coverage expansion focused on 3 priority services. Eliza service achieved **-42.9% uncovered lines**, making it our best improvement yet. Ingestor service exited the top-10 uncovered list. Overall coverage increased from 36.4% (Dec 3) to 60.07%, a **+23.67% jump** in Q1 2026.

### Added
- ✅ **26 new tests** across priority services (573 total, up from 547)
- ✅ `src/chain/soroban.service.spec.ts`: 17 tests with RPC degradation, path-finding, supply decoding coverage
- ✅ `src/analytics/ingestor.service.spec.ts`: 9+ tests covering initialization, event cascade, mirror validation
- ✅ `src/eliza/eliza.service.spec.ts`: 20 tests including timer management, HTTP orchestration, workflow mocks
- ✅ LCOV top-10 parser tool: `scripts/parse_lcov_top10.py` for coverage analysis
- ✅ Coverage roadmap document: `docs/COVERAGE_ROADMAP_Q2_2026.md` with priorities and timeline
- ✅ Testing quick start: `docs/TESTING_QUICK_START.md` with templates and debugging tips

### Changed
- 📈 **Statements**: 36.40% → 60.07% (+23.67%)
- 📈 **Branches**: ~33% → ~55% (+22%)
- 📈 **Functions**: ~34% → ~58% (+24%)
- 📈 **Lines**: 37.18% → ~60% (+23%)
- 🔄 **Test suites**: 86 (all passing, +25 since Dec 3)
- 🔄 **Execution time**: 18.15s with `--coverage` flag
- 🔄 `docs/TESTING_SUMMARY.md`: Updated with new metrics and top-10 table
- 🔄 `docs/TESTING.md`: Updated coverage baseline (60.07% statements)
- 🔄 `docs/DOCUMENTATION_INDEX.md`: Added testing section with 5 new guides
- 🔄 `README.md`: Updated test infrastructure summary and coverage goals

### Fixed
- ✅ Resolved timer cleanup issues in Eliza service tests (using `.unref()`)
- ✅ Improved mock isolation for Soroban RPC operations
- ✅ Fixed boolean/numeric normalization in Ingestor mirror updates
- ✅ Validated event cascade logic for governance→stablecoin updates

### Improved
- 🎯 **Eliza Service**: 77 → 44 uncovered lines (-33, **-42.9%**)
- 📊 **Soroban Service**: 121 → 107 uncovered lines (-14, -11.6%)
- 📊 **Chain Service**: 66 → 56 uncovered lines (-10, -15.2%)
- 📊 **Ingestor Service**: 71 uncovered → **Exited top-10**

### Next Targets
- [ ] **Passkey Services** (149 uncovered total): +25-30 tests for WebAuthn workflows
- [ ] **Cache Service** (68 uncovered): +12-15 tests for Redis operations
- [ ] **Reflector Oracle** (61 uncovered): +10-15 tests for price aggregation
- [ ] **Governance Service** (50 uncovered): +8-12 tests for proposal logic

---

## [37.18%] - December 3, 2025

### Summary
Baseline expansion from December 2 established the testing framework with initial unit and E2E suites. Coverage grew by 5.33% (statements) through targeted service expansion.

### Added
- 23 test suites with 160 tests
- Core service coverage for Auth, Webhooks, Security, Wallets, Governance
- E2E infrastructure with mock utilities

### Changed
- 📈 **Statements**: 31.07% → 36.40%
- 📈 **Branches**: 29.33% → 33.33%
- 📈 **Functions**: 28.79% → 33.70%
- 📈 **Lines**: 31.72% → 37.18%

---

## [31.07%] - December 2, 2025

### Summary
Initial baseline established with core unit tests and mock infrastructure.

### Added
- 19 test suites with 98 tests
- Mock utilities: Prisma, Redis, Reserve Manager stubs
- Global setup (`test/setup-e2e.ts`)

---

## Coverage Evolution Chart

```
Statements ──────────────────────────────────→
31.07% (Dec 2) → 36.40% (Dec 3) → 60.07% (May 1)
         +5.33%            +23.67%

Branches ────────────────────────────────────→
29.33% (Dec 2) → 33.33% (Dec 3) → ~55% (May 1)
         +4.00%            +21.67%

Lines ───────────────────────────────────────→
31.72% (Dec 2) → 37.18% (Dec 3) → ~60% (May 1)
         +5.46%            +22.82%

Tests ───────────────────────────────────────→
98 (Dec 2) → 160 (Dec 3) → 573 (May 1)
      +62               +413
```

---

## Statistics

### May 1, 2026 Snapshot
- **Total Tests**: 573 passing, 1 skipped
- **Total Suites**: 86 (all passing)
- **Runtime**: 18.15 seconds
- **Coverage Improvement**: +28.99% (statements) since Dec 2
- **Top Achievement**: Eliza service -42.9% uncovered lines

### Files Improved
- ✅ **Eliza Service**: Major improvement (-42.9%)
- ✅ **Soroban Service**: Solid improvement (-11.6%)
- ✅ **Chain Service**: Incremental progress (-15.2%)
- ✅ **Ingestor Service**: Exited top-10 (significant)

### Infrastructure Stats
- Mocks: 5 types (Prisma, Redis, Reserve Manager, Ingestor, Soroban SDK)
- Test utilities: Centralized in `test/test-utils.ts`
- Global setup: `test/setup-e2e.ts` (ENV variables, timeouts)
- Coverage tool: Python LCOV parser (`scripts/parse_lcov_top10.py`)

---

## Key Metrics Comparisons

| Metric | Dec 2 | Dec 3 | May 1 | Q2 Target | Improvement |
|--------|-------|-------|-------|-----------|-------------|
| Statements | 31.07% | 36.40% | 60.07% | 70% | +28.99% |
| Branches | 29.33% | 33.33% | ~55% | 60% | +25.67% |
| Functions | 28.79% | 33.70% | ~58% | 65% | +29.21% |
| Lines | 31.72% | 37.18% | ~60% | 70% | +28.28% |
| Tests | 98 | 160 | 573 | 750+ | +475 |
| Suites | 19 | 23 | 86 | 95+ | +67 |

---

## Known Issues & Workarounds

### Timer Management
- **Issue**: Long-running timers in tests can block Jest teardown
- **Solution**: Use `.unref()` on intervals + explicit `clearInterval()` in afterEach
- **Example**: Eliza service spec (handles timer cleanup properly)

### Mock Brittleness
- **Issue**: Mocks can become outdated when service signatures change
- **Solution**: Keep mocks centralized in `test/test-utils.ts` for easy updates

### LCOV Parser Edge Cases
- **Issue**: Coverage data format variations (line ranges, function info)
- **Solution**: Robust Python parser with state tracking and error handling

---

## Future Priorities

### Q2 2026 (May-July)
- [ ] Expand Passkey services (+25-30 tests)
- [ ] Expand Cache service (+12-15 tests)
- [ ] Expand Reflector Oracle (+10-15 tests)
- [ ] Target: 70% statements, 750+ tests

### Q3 2026 (Aug-Oct)
- [ ] Expand remaining top-10 files
- [ ] Integration tests on testnet
- [ ] Target: 80% statements, 900+ tests

### Q4 2026+ (Nov+)
- [ ] Performance tests (load, stress, latency)
- [ ] Chaos engineering tests
- [ ] Target: 85%+ statements, 1000+ tests

---

## References

- [COVERAGE_ROADMAP_Q2_2026.md](../docs/COVERAGE_ROADMAP_Q2_2026.md) — Detailed roadmap with timelines
- [TESTING_SUMMARY.md](../docs/TESTING_SUMMARY.md) — Historical data and top-10 analysis
- [TESTING_QUICK_START.md](../docs/TESTING_QUICK_START.md) — Developer guide with templates
- [E2E_TESTING.md](../docs/E2E_TESTING.md) — Infrastructure and mock details
- `scripts/parse_lcov_top10.py` — LCOV analysis tool
