# Testing and Environment — Stellaro Backend

This guide explains how to run tests (unit and with coverage) and how to prepare a minimal environment for controlled integration tests.

## Quick Commands

```bash
cd apps/backend
# Run tests
npm test
# Run with coverage
npm run test:cov
```

## Current Coverage (2026-05-01)
- Suites: 86 passed, 0 failed
- Tests: 573 passed, 1 skipped, 574 total
- Coverage: **Statements 60.07%** • Branches ~55% • Functions ~58% • Lines ~60%
- Runtime: 18.15 seconds with `--coverage` flag
- New Tests: +26 added (May 1, 2026) expanding priority services

## Skipped Test (PoR on-chain)
- One Proof of Reserves on-chain test remains skipped to avoid fragility in unit tests, as it depends on `TransactionBuilder` and valid account/key on network.
- Recommendation: re-enable this test only in integration environment (testnet) with real environment variables configured.

## Integration Environment (optional)
1. Copie o arquivo de exemplo:
   ```bash
   cd apps/backend
   cp .env.test.example .env.test
   ```
2. Preencha variáveis obrigatórias no `.env.test`:
   - `STELLAR_NETWORK`, `SOROBAN_RPC_URL`, `STELLAR_HORIZON`
   - `STABLECOIN_CONTRACT_ID`, `LOANS_POOL_CONTRACT_ID`, `ZK_VERIFIER_CONTRACT_ID`
   - `RESERVE_ACCOUNT`, `STELLAR_SECRET_KEY` (NÃO COMMITAR CHAVES REAIS)
3. Execute os testes apontando para o ambiente de integração (se aplicável ao seu runner):
   ```bash
   npm test -- --runInBand
   ```

## Tips
- Use testnet accounts and contracts to avoid costs and risks.
- Keep the on-chain PoR test skipped in CI. Execute it only in dedicated integration pipelines/environments.
- If using real PIX provider, define `PIX_PROVIDER_BASE_URL`, `PIX_PROVIDER_TOKEN` and `PIX_WEBHOOK_SECRET`. Without provider, maintain stub mode or test paths that don't make external calls.

## Common Issues
- "Invalid contract ID": verify `*_CONTRACT_ID` and selected network.
- "Invalid pubkey" / "invalid encoded string": check key format and environment variables.
- Network failures: confirm URLs, firewall and service availability (Horizon/Soroban/DB/Redis).
