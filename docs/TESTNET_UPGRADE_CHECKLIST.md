# Testnet Upgrade Checklist (Batch Executor + MEV Guard)

Objetivo: atualizar os contratos deployados para a ABI nova e validar set/get de stablecoin/router em testnet.

## Snapshot validado (2026-04-20)

Execucao estrita final validada com sucesso (gate on-chain + required):

- `STRICT_ONCHAIN_ONLY=1`
- `STRICT_REQUIRED=1`
- `RUN_MUTATIONS=1`
- `RUN_TRANSACTIONAL=1`

Artefatos de referencia:

- `contracts/reports/20260420_rc_strict/evidence_report.md`
- `contracts/reports/20260420_rc_strict/evidence_report.json`
- `contracts/reports/20260420_rc_strict/transactional_e2e.log`

Snapshot anterior tambem valido:

- `contracts/reports/20260420_001117/evidence_report.md`
- `contracts/reports/20260420_001117/evidence_report.json`
- `contracts/reports/20260420_001117/transactional_e2e.log`

IDs validados nesse snapshot:

- `STABLECOIN_CONTRACT_ID=CAB2HQ7XQ2CS4ROO4E3PZVJASXUNEKWTDFGRRGIPVUFHGQC24HKZHJIZ`
- `BATCH_EXECUTOR_CONTRACT_ID=CDZZQYUKOSTHDOUCU273NHRVYJ67A37JC5SL3JAOJ77FUT4KGQXSJBUI`
- `MEV_GUARD_CONTRACT_ID=CAHZYMMJVZN4JESEXMCVVOVTOE3A5AISNK3IWTZRDBXW3ZK2ZKBFSFHD`

## 1. Pre-check (sem mutação)

```bash
cd contracts

SOURCE_ADDRESS=<PUBLIC_KEY_G...> \
STABLECOIN_CONTRACT_ID=<CURRENT_STABLECOIN_ID> \
BATCH_EXECUTOR_CONTRACT_ID=<CURRENT_BATCH_ID> \
MEV_GUARD_CONTRACT_ID=<CURRENT_MEV_ID> \
./scripts/testnet_abi_upgrade_check.sh
```

Resultado esperado antes do upgrade: faltas em `set_stablecoin_contract` / `set_dex_router`.

## 2. Redeploy mínimo dos contratos pendentes

```bash
cd contracts

STABLECOIN_CONTRACT_ID=<CURRENT_STABLECOIN_ID> \
./scripts/redeploy_upgrade_batch_mev_testnet.sh <ACCOUNT_ALIAS>
```

Exemplo:

```bash
STABLECOIN_CONTRACT_ID=CCX2C7SN3RXKAVTFTNBQ5MCWLY2WEGXWGRKVFKJ427HN745CHXNRRBVG \
./scripts/redeploy_upgrade_batch_mev_testnet.sh deploy
```

## 3. Validação pós-upgrade (estrita + mutações)

Se o passo 2 foi executado com `RUN_POST_VALIDATE=1`, isso já roda automaticamente.

Execução manual, se necessário:

```bash
cd contracts

SOURCE_ADDRESS=<PUBLIC_KEY_G...> \
SIGN_WITH_KEY=<ACCOUNT_ALIAS_OR_SECRET> \
./scripts/testnet_post_upgrade_validate.sh
```

## 4. Critérios de aceite

- `testnet_abi_upgrade_check.sh` em `STRICT=1` sem faltas.
- `testnet_integration_smoke.sh` com `RUN_MUTATIONS=1` passando para:
  - `batch_executor.set_stablecoin_contract/get_stablecoin_contract`
  - `batch_executor.set_dex_router/get_dex_router` (quando router configurado)
  - `mev_guard.set_dex_router/get_dex_router` (quando router configurado)

## 5. Pós-validação

- Confirmar IDs novos em:
  - `contracts/.env-testnet`
  - `.env-dev`
- Atualizar documentação operacional principal com os novos IDs de `batch_executor` e `mev_guard`.
- Reexecutar smoke read-only para registrar baseline pós-upgrade.

## 6. Teste transacional E2E (on-chain)

```bash
cd contracts

SOURCE_ADDRESS=<PUBLIC_KEY_G...> \
SIGN_WITH_KEY=<ACCOUNT_ALIAS_OR_SECRET> \
STABLECOIN_CONTRACT_ID=<STABLECOIN_ID> \
BATCH_EXECUTOR_CONTRACT_ID=<BATCH_EXECUTOR_NEW_ID> \
MEV_GUARD_CONTRACT_ID=<MEV_GUARD_NEW_ID> \
./scripts/testnet_transactional_e2e.sh
```

Aceite desse passo:

- Batch `execute_batch` com `Payment` retorna sucesso.
- Saldo do destinatário aumenta após batch payment.
- `create_protected_order` retorna nonce válido.
- `execute_protected_swap` retorna `SwapResult` sem erro.

Gate opcional (produção, sem fallback):

```bash
cd contracts

SOURCE_ADDRESS=<PUBLIC_KEY_G...> \
SIGN_WITH_KEY=<ACCOUNT_ALIAS_OR_SECRET> \
STABLECOIN_CONTRACT_ID=<STABLECOIN_ID> \
BATCH_EXECUTOR_CONTRACT_ID=<BATCH_EXECUTOR_NEW_ID> \
MEV_GUARD_CONTRACT_ID=<MEV_GUARD_NEW_ID> \
STRICT_ONCHAIN_ONLY=1 \
./scripts/testnet_transactional_e2e.sh
```

Critério: deve passar sem acionar caminhos de fallback (batch swap fallback ou mev simulation fallback).

## 7. Pacote de evidências para auditoria

```bash
cd contracts

SOURCE_ADDRESS=<PUBLIC_KEY_G...> \
SIGN_WITH_KEY=<ACCOUNT_ALIAS_OR_SECRET> \
STABLECOIN_CONTRACT_ID=<STABLECOIN_ID> \
BATCH_EXECUTOR_CONTRACT_ID=<BATCH_EXECUTOR_NEW_ID> \
MEV_GUARD_CONTRACT_ID=<MEV_GUARD_NEW_ID> \
RUN_MUTATIONS=1 \
RUN_TRANSACTIONAL=1 \
STRICT_ONCHAIN_ONLY=1 \
STRICT_REQUIRED=1 \
./scripts/testnet_generate_evidence_report.sh
```

Artefatos esperados em `contracts/reports/<timestamp>/`:

- `evidence_report.md`
- `evidence_report.json`
- logs por etapa (ABI, smoke, mutações, transacional)
