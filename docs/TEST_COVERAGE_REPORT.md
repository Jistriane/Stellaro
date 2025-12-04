# Relatório de Cobertura de Testes - Stellaro Backend

Data: 2025-12-03 23:29 (UTC-3)

Resumo dos testes

- Unit: 63 suites passadas, 270 testes passados (1 ignorado)
- E2E: 9 suites passadas, 46 testes passados
- Observação: Warnings de serviços stubados (Soroban, ZK, PIX, Reserve) são esperados e não indicam falha.

Cobertura (Unit — npm run test)

- Statements: 35.11%
- Branches: 33.33%
- Functions: 31.33%
- Lines: 35.41%

Cobertura (E2E — npm run test:e2e)

- Statements: 45.36%
- Branches: 31.11%
- Functions: 32.52%
- Lines: 43.15%

Arquivos em destaque

- src/actions/actions.service.ts: Stmts 96.47%, Branch 84%, Funcs 100%, Lines 96.38%
- src/health/health.controller.ts: 100% em todas as métricas
- src/metrics/metrics.controller.ts: 100% em todas as métricas
- src/payments/pix.service.ts: Stmts 75.65%, Branch 67.02%, Funcs 100%, Lines 75.22%
- src/zk/zk.service.ts: Stmts 56.3%, Branch 57.57%, Funcs 100%, Lines 55.55%

Módulos com baixa cobertura (próximos alvos)

- src/main.ts, src/app.module.ts, controllers sem specs (analytics, memory, webhooks, zk.controller)
- guards: jwt/session/mfa/admin/eliza
- src/chain/chain.service.ts, src/chain/soroban.service.ts
- src/governance/governance.service.ts

Estabilidade e Teardown

- `--detectOpenHandles` (Unit/E2E): sem vazamentos.
- Nota: Sem `--detectOpenHandles`, o Jest pode forçar encerramento de um worker por timers ativos. Padronizar o uso desse flag em CI ajuda a identificar fontes cedo.

Como gerar os relatórios localmente

```bash
# Unit com cobertura e detecção de handles
cd apps/backend
npm run test -- --coverage --detectOpenHandles

# E2E com detecção de handles
npm run test:e2e:detect

# Execução combinada (unit + e2e) com cobertura
npm run test:all --silent
```

Nota sobre ambiente de integração

- Para reabilitar o teste de publicação on-chain do PoR, configure variáveis de ambiente reais (rede, chaves e contratos) e execute em modo de integração. Veja `apps/backend/.env.test.example` e `docs/E2E_TESTING.md`.
