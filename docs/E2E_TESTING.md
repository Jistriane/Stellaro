# E2E Testing Infrastructure - Stellaro Backend

## Overview

O backend Stellaro possui uma suíte completa de testes E2E isolados de dependências externas (PostgreSQL, Redis, Soroban RPC). Todos os 9 suites (46 testes) passam consistentemente sem open handles.

**Status**: ✅ 100% Passing (9/9 suites, 46/46 testes)

**Runtime**: ~7s em modo serial (`--runInBand`)

## Arquitetura de Isolamento

### Princípios

1. **Zero dependências externas**: Sem Postgres, Redis real ou Soroban RPC
2. **Mocks centralizados**: `test/test-utils.ts` fornece stubs reutilizáveis
3. **Provider overrides**: Cada suite injeta mocks via DI do NestJS
4. **Modo stub**: PIX opera em modo simulado; ZK sem contrato configurado
5. **Determinismo**: Testes reproduzíveis sem side-effects

### Componentes

#### 1. Setup Global (`test/setup-e2e.ts`)

Configuração aplicada antes de todos os testes:

```typescript
process.env.NODE_ENV = 'test';
process.env.PIX_MODE = 'stub';
delete process.env.REDIS_URL;
delete process.env.ZK_VERIFIER_CONTRACT_ID;
```

- Força ambiente de teste
- PIX em modo stub (sem API real)
- Redis desabilitado (fallback in-memory)
- ZK sem RPC (sem Soroban)
- Timeout Jest: 30s

#### 2. Mocks/Stubs (`test/test-utils.ts`)

##### Prisma Mock (`createPrismaMock`)

In-memory storage para entidades principais:

```typescript
const prismaMock = createPrismaMock();

// Storage em mapas:
// - users: Map<string, User>
// - wallets: Map<string, Wallet>
// - passkeys: Map<string, Passkey>
// - pixPayments: Map<string, PixPayment>
// - pixWithdrawals: Map<string, PixWithdrawal>
```

**Features**:
- `$connect`, `$disconnect`: no-ops
- CRUD completo: `findUnique`, `findMany`, `create`, `update`, `delete`
- `pixPayment.update` suporta `where.id` e `where.txId`
- Persiste `status`, `stellarMintTxId`, `createdAt` corretamente

**Uso em testes**:

```typescript
beforeEach(async () => {
  const module: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(PrismaService)
    .useValue(createPrismaMock())
    .compile();

  app = module.createNestApplication();
  await app.init();
});
```

##### Redis Stub (`createRedisStub`)

Cache in-memory com TTL e métricas:

```typescript
const redisStub = createRedisStub();

// Cache: Map<string, { value: string, expires?: number }>
// Counters ZK: rateLimited, zkVerifyOk/Err, zkScoreOk/Err
```

**Métodos**:
- `get(key)`, `set(key, value, ttl?)`, `del(key)`, `mDel([keys])`
- `getStats()`: retorna estatísticas de uso
- `incRateLimited()`, `incZkVerify(ok)`, `incZkScore(ok)`: métricas ZK

**Uso**:

```typescript
.overrideProvider(RedisService)
.useValue(createRedisStub())
```

##### Reserve Manager Stub (`createReserveManagerStub`)

Mock de compliance/reservas:

```typescript
const reserveStub = createReserveManagerStub();

// Métodos:
// - checkCollateralization(): { isHealthy: true, ratio: 150 }
// - getCurrentSnapshot(): { totalUSD, collateralUSD, ratio }
// - generateProofOfReserves(): { txHash, timestamp }
// - onModuleInit(): no-op
```

**Uso**:

```typescript
.overrideProvider(ReserveManagerService)
.useValue(createReserveManagerStub())
```

##### Ingestor Stub (`createIngestorStub`)

Mock sem side-effects:

```typescript
const ingestorStub = createIngestorStub();

// Métodos:
// - onModuleInit(): no-op (evita polling de Horizon)
```

**Uso**:

```typescript
.overrideProvider(IngestorService)
.useValue(createIngestorStub())
```

## Suites E2E

### 1. `auth.e2e-spec.ts` (5 testes)

**Escopo**: Autenticação básica (register, login, wallet auth)

**Endpoints testados**:
- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/wallet`

**Validações**:
- Registro de usuário com email/senha
- Login retorna JWT válido
- Autenticação via Stellar wallet

### 2. `auth-flow.e2e-spec.ts` (4 testes)

**Escopo**: Fluxo completo de autenticação

**Endpoints testados**:
- `POST /auth/register` → `POST /auth/login`
- `POST /auth/wallet` → `GET /auth/profile`

**Validações**:
- Sessão persistente após login
- Profile contém dados corretos

### 3. `actions-flow.e2e-spec.ts` (6 testes)

**Escopo**: Workflows de mint/burn

**Endpoints testados**:
- `POST /actions/mint`
- `POST /actions/burn`
- `GET /actions/status/:id`

**Validações**:
- Mint de STLT com validação de colateral
- Burn de STLT com liberação de colateral
- Status tracking de ações

### 4. `pix.e2e-spec.ts` (8 testes)

**Escopo**: Pagamentos PIX (stub mode)

**Endpoints testados**:
- `POST /payments/pix/charge`
- `POST /payments/pix/webhook`
- `POST /payments/pix/withdrawal`
- `GET /payments/pix/status/:txId`

**Validações**:
- Geração de cobrança PIX
- Webhook idempotente (double-mint prevention)
- Status transitions: `pending` → `completed`
- Mint/burn automático via ActionsService
- Cleanup de payments após testes

**Importante**: PIX opera em modo stub via `PIX_MODE=stub`

### 5. `positions.e2e-spec.ts` (3 testes)

**Escopo**: Posições DeFi

**Endpoints testados**:
- `GET /defi/blend/positions/:address`

**Validações**:
- Listagem de posições
- Cálculo de valor total em USD
- Enriquecimento com APY e poolId

### 6. `reserves.e2e-spec.ts` (5 testes)

**Escopo**: Compliance e reservas

**Endpoints testados**:
- `GET /compliance/reserves/check`
- `GET /compliance/reserves/snapshot`
- `POST /compliance/reserves/proof`

**Validações**:
- Verificação de colateralização (120% mínimo)
- Snapshot detalhado de reservas
- Proof of Reserves on-chain

### 7. `oracles.e2e-spec.ts` (4 testes)

**Escopo**: Preços e feeds

**Endpoints testados**:
- `GET /oracles/price?base=XLM&quote=USD`
- `GET /oracles/aggregated?assets=XLM,USDC`

**Validações**:
- Preço em tempo real (Reflector + DEX fallback)
- Agregação multi-fonte
- Feed correto (Reflector ou fallback)

**Nota**: Queries corrigidas para `base/quote` (antes: `asset`)

### 8. `zk.e2e-spec.ts` (7 testes)

**Escopo**: Verificação ZK e rate limiting

**Endpoints testados**:
- `POST /zk/verify`
- `GET /zk/score/:address`

**Validações**:
- Rate limiting (via Redis counters)
- Verificação de proofs (sem RPC)
- Score caching (5min TTL)
- Métricas: `incRateLimited`, `incZkVerify`, `incZkScore`

**Importante**: ZK_VERIFIER_CONTRACT_ID não configurado (esperado em logs)

### 9. `app.e2e-spec.ts` (4 testes)

**Escopo**: Health checks gerais

**Endpoints testados**:
- `GET /`
- `GET /chain/health`

**Validações**:
- API respondendo
- Integração Horizon/Soroban OK

## Padrão de Provider Overrides

Todas as suites seguem o mesmo padrão:

```typescript
import { createPrismaMock, createRedisStub, createReserveManagerStub, createIngestorStub } from './test-utils';

describe('ModuleE2ETests', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(createPrismaMock())
      .overrideProvider(RedisService)
      .useValue(createRedisStub())
      .overrideProvider(ReserveManagerService)
      .useValue(createReserveManagerStub())
      .overrideProvider(IngestorService)
      .useValue(createIngestorStub())
      .compile();

    app = module.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  // testes...
});
```

## Comandos

### Executar E2E

```bash
cd apps/backend

# Roda todos os testes E2E
npm run test:e2e

# Com detecção de open handles
npm run test:e2e:detect

# Com cobertura
npm run test:e2e:cov

# Unit + E2E com coverage
npm run test:all
```

### Scripts package.json

```json
{
  "test:e2e": "jest --config ./test/jest-e2e.json --runInBand",
  "test:e2e:detect": "jest --config ./test/jest-e2e.json --runInBand --detectOpenHandles",
  "test:e2e:cov": "jest --config ./test/jest-e2e.json --runInBand --coverage",
  "test:all": "npm run test:cov && npm run test:e2e:cov"
}
```

## Logs Esperados

```
PASS  test/pix.e2e-spec.ts
PASS  test/positions.e2e-spec.ts
PASS  test/auth.e2e-spec.ts
PASS  test/app.e2e-spec.ts
PASS  test/actions-flow.e2e-spec.ts
PASS  test/auth-flow.e2e-spec.ts
PASS  test/oracles.e2e-spec.ts
[Nest] 39462  - 03/12/2025, 21:40:59   ERROR [ZkService] ZK_VERIFIER_CONTRACT_ID not configured
[Nest] 39462  - 03/12/2025, 21:40:59   ERROR [ZkService] ZK_VERIFIER_CONTRACT_ID not configured
PASS  test/zk.e2e-spec.ts
PASS  test/reserves.e2e-spec.ts

Test Suites: 9 passed, 9 total
Tests:       46 passed, 46 total
Snapshots:   0 total
Time:        7.083 s
```

**Nota**: Warnings de `ZK_VERIFIER_CONTRACT_ID not configured` são **esperados** e **intencionais** em testes.

## Troubleshooting

### Open Handles Warning

Se aparecer warning de open handles, rodar com `--detectOpenHandles`:

```bash
npm run test:e2e:detect
```

**Status atual**: ✅ Zero open handles detectados

### Testes Falhando

1. **Verificar setup**: `test/setup-e2e.ts` deve estar sendo carregado
2. **Verificar mocks**: Provider overrides aplicados em todas as suites?
3. **Logs de erro**: ZK warnings são esperados; outros erros investigar

### PIX Double-Mint

Se testes PIX falharem com double-mint:

1. Verificar `pixPayment.update` em `test-utils.ts`
2. Deve suportar `where.id` e `where.txId`
3. Deve persistir `status` e `stellarMintTxId`

## CI/CD

### GitHub Actions

```yaml
- name: Run E2E Tests
  run: |
    cd apps/backend
    npm run test:e2e:cov
  env:
    NODE_ENV: test
```

### Configuração

- Sem necessidade de PostgreSQL/Redis em CI
- Sem necessidade de Soroban RPC
- Tempo de execução: ~7-10s
- Coverage target: 60%+

## Roadmap

### Próximos Passos

- [ ] Aumentar coverage E2E para 70%+
- [ ] Adicionar suites para módulos faltantes (Passkey, Governance)
- [ ] Testes de carga (stress testing)
- [ ] Integração com Playwright para frontend E2E

### Melhorias Futuras

- [ ] Paralelização segura de testes
- [ ] Snapshots de resposta para regressão visual
- [ ] Mock de Horizon API para testes de ingestão
- [ ] Testes de migração de schema Prisma

## Referências

- [NestJS Testing](https://docs.nestjs.com/fundamentals/testing)
- [Jest E2E](https://jestjs.io/docs/configuration)
- [Supertest](https://github.com/visionmedia/supertest)
- [Prisma Testing](https://www.prisma.io/docs/guides/testing/unit-testing)

---

**Última Atualização**: 2025-12-03

**Status**: ✅ Produção-ready (9/9 suites passing, zero open handles)
