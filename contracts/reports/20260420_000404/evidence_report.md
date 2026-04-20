# Stellaro Testnet Evidence Report

- Generated at: 2026-04-20T03:04:54Z
- Started at: 2026-04-20T03:04:04Z
- Network: testnet
- Source address: GC5LQLM7IOEC7IDE27CXOS2SH4ZXXNN7NJS3BJOZKAFSPAC2PZ34J4XX
- Git commit: 80e64c55
- Env file: /home/jistriane/Stellaro/Stellaro/contracts/.env-testnet

## Run Flags

- ABI_STRICT=0
- RUN_MUTATIONS=1
- RUN_TRANSACTIONAL=1
- STRICT_ONCHAIN_ONLY=1
- STRICT_REQUIRED=1

## Contract IDs

- STABLECOIN_CONTRACT_ID: CCX2C7SN3RXKAVTFTNBQ5MCWLY2WEGXWGRKVFKJ427HN745CHXNRRBVG
- BATCH_EXECUTOR_CONTRACT_ID: CCITGXTJLO6OR4MMOQAHSOSC4W42VEKABRK5TS6UNLK47GHOHQTI4KM7
- MEV_GUARD_CONTRACT_ID: CCZKKGPLJAXBYK2RJOYQLUYEXKZI443D6BJW5CTKORSYHMF6T25FF3QT
- SOROSWAP_ROUTER_CONTRACT_ID: <not set>

## Step Results

| Step | Status | Exit Code | Log |
|------|--------|-----------|-----|
| ABI Check | pass | 0 | /home/jistriane/Stellaro/Stellaro/contracts/reports/20260420_000404/abi_check.log |
| Smoke Read-only | pass | 0 | /home/jistriane/Stellaro/Stellaro/contracts/reports/20260420_000404/smoke_read_only.log |
| Smoke Mutation | pass | 0 | /home/jistriane/Stellaro/Stellaro/contracts/reports/20260420_000404/smoke_mutation.log |
| Transactional E2E | fail | 2 | /home/jistriane/Stellaro/Stellaro/contracts/reports/20260420_000404/transactional_e2e.log |

## Overall

This report is for operational evidence collection. A non-pass result indicates pending work, missing ABI, missing credentials, or expected skip based on run flags.
