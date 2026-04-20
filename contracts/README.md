# Contratos Soroban (Stelato)

Este workspace contém os contratos:

- portfolio
- stablecoin
- risklock
- loans_pool
- governance
- zk_verifier
- batch_executor
- mev_guard

## Build (WASM)

Requisitos:

- Rust toolchain
- Target wasm32

Comandos:

```bash
rustup target add wasm32-unknown-unknown
cargo build --release --target wasm32-unknown-unknown
```

Artefatos: `target/wasm32-unknown-unknown/release/*.wasm`

## Deploy (testnet)

Instalar Soroban CLI:

```bash
cargo install --locked soroban-cli
```

Configurar rede:

```bash
soroban config network add testnet \
  --rpc-url https://soroban-testnet.stellar.org \
  --network-passphrase "Test SDF Network ; September 2015"
```

Gerar chave dev e financiar:

```bash
soroban keys generate dev
ADDR=$(soroban keys address dev)
curl "https://friendbot.stellar.org?addr=$ADDR"
```

Deploy exemplos:

```bash
# Portfolio
soroban contract deploy --wasm target/wasm32-unknown-unknown/release/portfolio.wasm \
  --source dev --network testnet

# Stablecoin
soroban contract deploy --wasm target/wasm32-unknown-unknown/release/stablecoin.wasm \
  --source dev --network testnet
# Init
soroban contract invoke --id <STABLECOIN_CONTRACT_ID> --source dev --network testnet \
  -- init --admin $ADDR --risk-threshold-bps 7000

# RiskLock
soroban contract deploy --wasm target/wasm32-unknown-unknown/release/risklock.wasm \
  --source dev --network testnet
soroban contract invoke --id <RISKLOCK_CONTRACT_ID> --source dev --network testnet \
  -- init --admin $ADDR

# Loans Pool
soroban contract deploy --wasm target/wasm32-unknown-unknown/release/loans_pool.wasm \
  --source dev --network testnet
soroban contract invoke --id <LOANSPOOL_CONTRACT_ID> --source dev --network testnet \
  -- init --admin $ADDR --ltv-bps 6000 --interest-bps 1500
```

## Backend (.env-dev or .env-testnet)

Defina os IDs no backend (já configurado automaticamente após deploy):

```bash
# Current Testnet Deployment (Apr 15, 2026)
STABLECOIN_CONTRACT_ID=CCX2C7SN3RXKAVTFTNBQ5MCWLY2WEGXWGRKVFKJ427HN745CHXNRRBVG
RISKLOCK_CONTRACT_ID=CAMEHWI55A4CJ5UE7YN5V7NPP4ZPVMOE6ZSIF5JQKQXVJHLENMB464VO
LOANSPOOL_CONTRACT_ID=CAXAKWLYXOHZBUEKHGSOILJR3CU5ICEREZTA3LYYFIJPK3ZQQLCZEYW7
PORTFOLIO_CONTRACT_ID=CC6NTQNQ6CM42F2DB44CYZE24O7IJ7VNMSEHVKPX57NVCV46MEIGKUNB
GOVERNANCE_CONTRACT_ID=CCUHIZXPRMZQJ2E2YY6BBRP3YSXBGX4HDHZDVVMF2XM3WZIDOYGM47MP
ZK_VERIFIER_CONTRACT_ID=CDOPZBPMQM24GYMKTGLC2EEY3QOQNNFO3BJ6JTBGW2T5UMJCKFQ5PSVY
BATCH_EXECUTOR_CONTRACT_ID=CAHWOMBTMVUWGMRWSJY2TPCBMPO3A3LODCBE6MFXMA6XR4ALZZCGTN7I
MEV_GUARD_CONTRACT_ID=CDHQZQ5YMNVAPKXJ6LVBDSJC4QVZL4UD2TIKSTDYGATMBTWEV7ZSOG3M
```

E variáveis da rede:

```bash
STELLAR_NETWORK=testnet
SOROBAN_RPC_URL=https://soroban-testnet.stellar.org
HORIZON_URL=https://horizon-testnet.stellar.org
SOROBAN_NETWORK_PASSPHRASE="Test SDF Network ; September 2015"
WALLET_SECRET_DEV=<chave secreta dev>
```

## Smoke Test de Integração (Testnet)

Foi adicionado um script de validação rápida para checar configurações e integrações básicas dos contratos deployados:

```bash
cd contracts

# Modo seguro (somente leitura)
./scripts/testnet_integration_smoke.sh

# Modo somente leitura sem alias local (usa chave pública)
SOURCE_ADDRESS=GC5LQLM7IOEC7IDE27CXOS2SH4ZXXNN7NJS3BJOZKAFSPAC2PZ34J4XX \
./scripts/testnet_integration_smoke.sh

# Carregar env customizado
./scripts/testnet_integration_smoke.sh /caminho/para/.env-testnet

# Modo com mutações de admin (set/get de stablecoin/router)
RUN_MUTATIONS=1 ./scripts/testnet_integration_smoke.sh

# Modo com mutações e assinatura explícita
RUN_MUTATIONS=1 \
SOURCE_ADDRESS=GC5LQLM7IOEC7IDE27CXOS2SH4ZXXNN7NJS3BJOZKAFSPAC2PZ34J4XX \
SIGN_WITH_KEY=dev \
./scripts/testnet_integration_smoke.sh
```

Variáveis esperadas pelo script:

- `STABLECOIN_CONTRACT_ID`
- `BATCH_EXECUTOR_CONTRACT_ID`
- `MEV_GUARD_CONTRACT_ID`
- `SOURCE_ADDRESS` (recomendado para modo leitura)
- `SOROBAN_SOURCE_ACCOUNT` (opcional, default: `dev`)
- `SIGN_WITH_KEY` (obrigatório para `RUN_MUTATIONS=1` quando não houver alias local)
- `STELLAR_NETWORK` (opcional, default: `testnet`)
- `SOROSWAP_ROUTER_CONTRACT_ID` (opcional, necessário para checks de router)

Observação: por padrão o script não altera estado on-chain. As mutações só ocorrem com `RUN_MUTATIONS=1`.
Para mutações assinadas com alias local, garanta que ele exista (ex.: `soroban keys generate dev`).

## Verificação de ABI para Upgrade (Testnet)

Use este script para checar se os contratos deployados já expõem os métodos necessários para os fluxos novos (stablecoin/router configuráveis):

```bash
cd contracts

# Diagnóstico informativo (não falha pipeline)
SOURCE_ADDRESS=GC5LQLM7IOEC7IDE27CXOS2SH4ZXXNN7NJS3BJOZKAFSPAC2PZ34J4XX \
./scripts/testnet_abi_upgrade_check.sh

# Modo estrito (retorna exit 2 se faltar ABI obrigatória)
STRICT=1 \
SOURCE_ADDRESS=GC5LQLM7IOEC7IDE27CXOS2SH4ZXXNN7NJS3BJOZKAFSPAC2PZ34J4XX \
./scripts/testnet_abi_upgrade_check.sh
```

Saída esperada no estado atual: contratos core antigos continuam funcionais, mas faltam métodos de configuração de router/stablecoin em `batch_executor` e `mev_guard`, indicando necessidade de redeploy/upgrade para validação mutável completa.

### Validação Pós-Upgrade (Automática)

Após redeploy dos contratos com ABI nova, execute o validador único:

```bash
cd contracts

SOURCE_ADDRESS=GC5LQLM7IOEC7IDE27CXOS2SH4ZXXNN7NJS3BJOZKAFSPAC2PZ34J4XX \
SIGN_WITH_KEY=dev \
./scripts/testnet_post_upgrade_validate.sh
```

Esse fluxo roda, em sequência:

1. `testnet_abi_upgrade_check.sh` em `STRICT=1`
2. `testnet_integration_smoke.sh` com `RUN_MUTATIONS=1`

## Redeploy Mínimo (Batch + MEV)

Para atualizar apenas os contratos com ABI pendente (`batch_executor` e `mev_guard`) e já executar validação pós-upgrade:

```bash
cd contracts

# Exemplo usando alias local 'deploy'
STABLECOIN_CONTRACT_ID=CCX2C7SN3RXKAVTFTNBQ5MCWLY2WEGXWGRKVFKJ427HN745CHXNRRBVG \
./scripts/redeploy_upgrade_batch_mev_testnet.sh deploy
```

Esse script:

1. Builda os WASM
2. Faz deploy de novas instâncias de `batch_executor` e `mev_guard`
3. Inicializa os contratos
4. Atualiza IDs em `contracts/.env-testnet` e `.env-dev`
5. Roda `testnet_post_upgrade_validate.sh` automaticamente (padrão `RUN_POST_VALIDATE=1`)

Variáveis opcionais:

- `MAX_SLIPPAGE_BPS` (default: `500`)
- `MIN_BLOCK_DELAY` (default: `10`)
- `RUN_POST_VALIDATE` (default: `1`)
- `ENV_FILE_PRIMARY`, `ENV_FILE_SECONDARY`

## Teste Transacional E2E (On-Chain)

Após upgrade/redeploy concluído, execute o cenário transacional completo:

```bash
cd contracts

SOURCE_ADDRESS=GC5LQLM7IOEC7IDE27CXOS2SH4ZXXNN7NJS3BJOZKAFSPAC2PZ34J4XX \
SIGN_WITH_KEY=deploy \
STABLECOIN_CONTRACT_ID=<STABLECOIN_ID> \
BATCH_EXECUTOR_CONTRACT_ID=<BATCH_EXECUTOR_NEW_ID> \
MEV_GUARD_CONTRACT_ID=<MEV_GUARD_NEW_ID> \
./scripts/testnet_transactional_e2e.sh
```

Esse script valida:

1. `mint_guarded` no Stablecoin para seed de saldo
2. `set_stablecoin_contract` (e `set_dex_router` opcional) no Batch Executor
3. `execute_batch` com operação real de `Payment`
4. `create_protected_order` + `execute_protected_swap` no MEV Guard
5. Leitura de saldos antes/depois para evidência do fluxo

### Modo Strict On-Chain (sem fallback)

Para usar o teste transacional como gate de produção (falha se qualquer fallback for necessário):

```bash
cd contracts

SOURCE_ADDRESS=GC5LQLM7IOEC7IDE27CXOS2SH4ZXXNN7NJS3BJOZKAFSPAC2PZ34J4XX \
SIGN_WITH_KEY=deploy \
STABLECOIN_CONTRACT_ID=<STABLECOIN_ID> \
BATCH_EXECUTOR_CONTRACT_ID=<BATCH_EXECUTOR_NEW_ID> \
MEV_GUARD_CONTRACT_ID=<MEV_GUARD_NEW_ID> \
STRICT_ONCHAIN_ONLY=1 \
./scripts/testnet_transactional_e2e.sh
```

Com `STRICT_ONCHAIN_ONLY=1`, o script retorna erro se:

- o batch precisar cair no caminho de fallback (`Swap`) por indisponibilidade do caminho `Payment` estritamente on-chain;
- o `mev_guard` precisar cair no fallback de simulação por falha em `create_protected_order` on-chain.

## Relatório de Evidências (Markdown + JSON)

Para gerar pacote de evidências com logs e sumário estruturado:

```bash
cd contracts

SOURCE_ADDRESS=GC5LQLM7IOEC7IDE27CXOS2SH4ZXXNN7NJS3BJOZKAFSPAC2PZ34J4XX \
STABLECOIN_CONTRACT_ID=<STABLECOIN_ID> \
BATCH_EXECUTOR_CONTRACT_ID=<BATCH_EXECUTOR_ID> \
MEV_GUARD_CONTRACT_ID=<MEV_GUARD_ID> \
RUN_MUTATIONS=0 \
RUN_TRANSACTIONAL=0 \
./scripts/testnet_generate_evidence_report.sh
```

Com mutações e E2E transacional:

```bash
SOURCE_ADDRESS=GC5LQLM7IOEC7IDE27CXOS2SH4ZXXNN7NJS3BJOZKAFSPAC2PZ34J4XX \
SIGN_WITH_KEY=deploy \
STABLECOIN_CONTRACT_ID=<STABLECOIN_ID> \
BATCH_EXECUTOR_CONTRACT_ID=<BATCH_EXECUTOR_ID> \
MEV_GUARD_CONTRACT_ID=<MEV_GUARD_ID> \
RUN_MUTATIONS=1 \
RUN_TRANSACTIONAL=1 \
./scripts/testnet_generate_evidence_report.sh
```

Para exigir execução estritamente on-chain no passo transacional dentro do relatório:

```bash
SOURCE_ADDRESS=GC5LQLM7IOEC7IDE27CXOS2SH4ZXXNN7NJS3BJOZKAFSPAC2PZ34J4XX \
SIGN_WITH_KEY=deploy \
STABLECOIN_CONTRACT_ID=<STABLECOIN_ID> \
BATCH_EXECUTOR_CONTRACT_ID=<BATCH_EXECUTOR_ID> \
MEV_GUARD_CONTRACT_ID=<MEV_GUARD_ID> \
RUN_MUTATIONS=1 \
RUN_TRANSACTIONAL=1 \
STRICT_ONCHAIN_ONLY=1 \
STRICT_REQUIRED=1 \
./scripts/testnet_generate_evidence_report.sh
```

O relatório (`.md` e `.json`) passa a registrar os flags de execução para rastreabilidade operacional.

Com `STRICT_REQUIRED=1`, o script de evidências também retorna erro (exit code != 0) quando qualquer etapa obrigatória falhar:

- `ABI Check` e `Smoke Read-only` sempre obrigatórios;
- `Smoke Mutation` obrigatório quando `RUN_MUTATIONS=1`;
- `Transactional E2E` obrigatório quando `RUN_TRANSACTIONAL=1`.

Saídas em `contracts/reports/<timestamp>/`:

- `evidence_report.md`
- `evidence_report.json`
- logs por etapa (`abi_check.log`, `smoke_read_only.log`, etc.)
