# Testing Quick Start - Stellaro Backend

**Last Updated**: May 1, 2026  
**Coverage**: 60.07% statements | 573 tests | 86 suites  
**Cycle Time**: 18.15s

---

## Quick Commands

```bash
cd Stellaro/apps/backend

# Run all tests
npm test

# Run tests with coverage report
npm run test -- --coverage

# Run specific test file
npm test -- src/path/to/service.spec.ts

# Run in watch mode
npm test -- --watch

# Run specific test suite
npm test -- --testNamePattern="should handle"

# Generate coverage HTML report
npm run test -- --coverage --coverageReporters=html
# Then open: coverage/lcov-report/index.html
```

---

## Current Status (May 1, 2026)

| Metric | Value | Target |
|--------|-------|--------|
| Statements | 60.07% | 70% |
| Branches | ~55% | 60% |
| Functions | ~58% | 65% |
| Lines | ~60% | 70% |
| Tests Passing | 573 | — |
| Test Suites | 86 | — |
| Runtime | 18.15s | <20s |

---

## Test Organization

### Test Files Location
```
apps/backend/src/
├── chain/
│   ├── chain.service.ts
│   ├── chain.service.spec.ts ✅
│   ├── soroban.service.ts
│   └── soroban.service.spec.ts ✅ (expanded May 1)
├── analytics/
│   ├── ingestor.service.ts
│   └── ingestor.service.spec.ts ✅ (expanded May 1)
├── eliza/
│   ├── eliza.service.ts
│   └── eliza.service.spec.ts ✅ (expanded May 1)
└── ... (other services)
```

✅ = Recently expanded or high coverage

### Test Infrastructure
```
apps/backend/test/
├── setup-e2e.ts         # Global Jest setup
├── test-utils.ts        # Mock/stub utilities
└── e2e-specs/           # Integration test examples
    ├── auth.e2e-spec.ts
    ├── pix.e2e-spec.ts
    └── ...
```

---

## Creating New Tests

### 1. Service Unit Test Template

```typescript
// src/my-module/my-service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { MyService } from './my-service';
import { PrismaService } from '../../prisma/prisma.service';
import * as fs from 'fs';

describe('MyService', () => {
  let service: MyService;
  let prismaMock: any;

  beforeEach(() => {
    // Create mock Prisma
    prismaMock = {
      myEntity: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      $connect: jest.fn(),
      $disconnect: jest.fn(),
    };

    // Instantiate service directly (bypass NestJS DI)
    service = new MyService(prismaMock);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  describe('findById', () => {
    it('should return entity when found', async () => {
      const id = 'test-123';
      const entity = { id, name: 'Test' };

      prismaMock.myEntity.findUnique.mockResolvedValue(entity);

      const result = await service.findById(id);

      expect(result).toEqual(entity);
      expect(prismaMock.myEntity.findUnique).toHaveBeenCalledWith({
        where: { id },
      });
    });

    it('should return null when not found', async () => {
      prismaMock.myEntity.findUnique.mockResolvedValue(null);

      const result = await service.findById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create and return entity', async () => {
      const data = { name: 'New Entity' };
      const created = { id: 'new-123', ...data };

      prismaMock.myEntity.create.mockResolvedValue(created);

      const result = await service.create(data);

      expect(result).toEqual(created);
      expect(prismaMock.myEntity.create).toHaveBeenCalledWith({
        data,
      });
    });
  });
});
```

### 2. Controller Test Template

```typescript
describe('MyController', () => {
  let controller: MyController;
  let service: MyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MyController],
      providers: [
        {
          provide: MyService,
          useValue: {
            findById: jest.fn(),
            create: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<MyController>(MyController);
    service = module.get<MyService>(MyService);
  });

  it('should call service.findById', async () => {
    const id = '123';
    const expected = { id, name: 'Test' };

    jest.spyOn(service, 'findById').mockResolvedValue(expected);

    const result = await controller.findById(id);

    expect(result).toEqual(expected);
    expect(service.findById).toHaveBeenCalledWith(id);
  });
});
```

---

## Coverage Analysis

### Top Priority Services (by uncovered lines)

#### 1. Passkey Services (149 uncovered total)
- `src/passkey/passkey.service.ts` (77 uncovered)
- `src/passkey/passkey-session.service.ts` (72 uncovered)

**Next Target**: Add 25-30 tests for WebAuthn workflows

#### 2. Cache Service (68 uncovered)
- `src/cache/cache.service.ts`

**Next Target**: Add 12-15 tests for Redis operations

#### 3. Reflector Oracle (61 uncovered)
- `src/oracles/reflector-oracle.service.ts`

**Next Target**: Add 10-15 tests for price aggregation

### Recently Expanded (Great Examples!)

#### Soroban Service (17 tests, -14 uncovered lines)
Location: `src/chain/soroban.service.spec.ts`
- RPC degradation handling ✅
- Env var fallbacks ✅
- Horizon API integration ✅

#### Ingestor Service (9+ tests, exited top-10)
Location: `src/analytics/ingestor.service.spec.ts`
- DB watermark initialization ✅
- Event cascade logic ✅
- Mirror validation ✅

#### Eliza Service (20 tests, -33 uncovered lines / -42.9%!)
Location: `src/eliza/eliza.service.spec.ts`
- Timer management ✅
- HTTP orchestration ✅
- Dev/prod error modes ✅

---

## Debugging Tests

### Enable Test Logging
```bash
# Verbose output
npm test -- --verbose

# Show individual test times
npm test -- --verbose --testTimeout=10000
```

### Debug Single Test
```bash
# Use --testNamePattern to run specific test
npm test -- --testNamePattern="should handle RPC failure"

# Use --bail to stop on first failure
npm test -- --bail
```

### View Coverage for Specific File
```bash
# Run coverage, then find your file in: coverage/lcov-report/
# Example: coverage/lcov-report/src/chain/soroban.service.ts.html
npm run test -- --coverage
open coverage/lcov-report/index.html
```

---

## Common Issues

### Issue: "Cannot find module '@nestjs/...'"
**Solution**: Run from `apps/backend` directory
```bash
cd Stellaro/apps/backend
npm test
```

### Issue: "Jest timeout"
**Solution**: Increase Jest timeout for specific test
```typescript
jest.setTimeout(30000); // 30 seconds

it('long-running test', async () => {
  // ...
});
```

### Issue: Mock not working
**Solution**: Ensure jest.mock() is at module scope (before describe block)
```typescript
// WRONG - inside describe block
describe('Test', () => {
  jest.mock('module');
});

// CORRECT - at module scope
jest.mock('module');

describe('Test', () => {
  // ...
});
```

### Issue: "Cannot use import statement outside a module"
**Solution**: Use dynamic require in tests
```typescript
// Instead of: import { someModule } from 'module';
// Use:
const someModule = require('module');
```

---

## Performance Tips

### Run Fastest
```bash
# Skip coverage, run without coverage overhead
npm test

# Run only specific files
npm test -- soroban.service.spec.ts eliza.service.spec.ts
```

### Parallel Execution
```bash
# Jest runs tests in parallel by default
# For CPU-bound tests, you can limit workers:
npm test -- --maxWorkers=4
```

### Coverage Focus
```bash
# Only collect coverage for specific files
npm test -- --coverage --collectCoverageFrom="src/chain/**/*.ts"
```

---

## Resources

- **[COVERAGE_ROADMAP_Q2_2026.md](COVERAGE_ROADMAP_Q2_2026.md)** — Full roadmap with priorities
- **[TESTING_SUMMARY.md](TESTING_SUMMARY.md)** — Historical data and evolution
- **[E2E_TESTING.md](E2E_TESTING.md)** — Infrastructure details
- **Jest Docs**: https://jestjs.io/docs/getting-started
- **NestJS Testing**: https://docs.nestjs.com/fundamentals/testing

---

## Next Steps for Contributors

1. ✅ Pick a service from top-10 uncovered list
2. ✅ Create `.spec.ts` file using template above
3. ✅ Add 10-15 concrete test cases
4. ✅ Run `npm test -- --coverage` to verify
5. ✅ Commit and create PR
6. ✅ Monitor coverage delta in CI

**Goal**: +10% overall coverage by end of Q2 2026 🎯
