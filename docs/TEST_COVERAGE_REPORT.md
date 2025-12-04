# Relatório de Cobertura de Testes - Stellaro Backend

Data: 2025-12-03

Resumo dos testes
- Suites: 7 passadas, 0 falhas
- Testes: 129 passados, 1 ignorado, 130 total
- Observação: 1 teste de PoR on-chain está ignorado por depender de TransactionBuilder e de ambiente integrado.

Cobertura (Jest --coverage)
- Statements: 18.84%
- Branches: 18.32%
- Functions: 14.06%
- Lines: 19.26%

Arquivos em destaque
- src/actions/actions.service.ts: Stmts 96.47%, Branch 84%, Funcs 100%, Lines 96.38%
- src/payments/pix.service.ts: Stmts 75.65%, Branch 67.02%, Funcs 100%, Lines 75.22%
- src/auth/auth.service.ts: Stmts 90.37%, Branch 74.74%, Funcs 100%, Lines 92.43%
- src/chain/soroban.service.ts: Stmts 47.52%, Branch 33.96%, Funcs 75%, Lines 45.26%
- src/compliance/reserve-manager.service.ts: Stmts 78.46%, Branch 76.56%, Funcs 77.27%, Lines 78.12%

Módulos com baixa cobertura (próximos alvos)
- src/chain/chain.service.ts
- src/oracles/reflecor.service.ts (e serviços de oráculos)
- src/passkey/*
- src/notifications/*
- src/redis/*

Como gerar os relatórios localmente
```bash
cd apps/backend
npm test -- --coverage
```

Nota sobre ambiente de integração
- Para reabilitar o teste de publicação on-chain do PoR, configure variáveis de ambiente reais (rede, chaves e contratos) e execute em modo de integração. Veja `apps/backend/.env.test.example` e `docs/TESTING.md`.
