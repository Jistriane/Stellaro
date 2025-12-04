# Testes e Ambiente — Stellaro Backend

Este guia explica como executar os testes (unitários e com cobertura) e como preparar um ambiente mínimo para testes de integração controlados.

## Comandos rápidos

```bash
cd apps/backend
# Rodar testes
npm test
# Rodar com cobertura
npm run test:cov
```

## Cobertura atual (2025-12-03)
- Suites: 7 passadas, 0 falhas
- Testes: 129 passados, 1 ignorado, 130 total
- Coverage: Statements 18.84% • Branches 18.32% • Functions 14.06% • Lines 19.26%

## Teste ignorado (PoR on-chain)
- Um teste de Proof of Reserves on-chain permanece ignorado (skipped) para evitar fragilidade em unit tests, pois depende de `TransactionBuilder` e de uma conta/chave válidas em rede.
- Recomendação: reabilitar este teste apenas em ambiente de integração (testnet) com variáveis de ambiente reais configuradas.

## Ambiente de integração (opcional)
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

## Dicas
- Use contas e contratos da testnet para evitar custos e riscos.
- Mantenha o teste de PoR on-chain ignorado em CI. Execute-o apenas em pipelines/ambientes dedicados de integração.
- Caso use provider PIX real, defina `PIX_PROVIDER_BASE_URL`, `PIX_PROVIDER_TOKEN` e `PIX_WEBHOOK_SECRET`. Sem provider, mantenha modo stub ou caminhos de teste que não façam chamadas externas.

## Problemas comuns
- "Invalid contract ID": verifique `*_CONTRACT_ID` e a rede selecionada.
- "Invalid pubkey" / "invalid encoded string": checar formato de chaves e variáveis de ambiente.
- Falhas de rede: confirme URLs, firewall e disponibilidade dos serviços (Horizon/Soroban/DB/Redis).
