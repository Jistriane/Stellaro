# Stellaro Testnet Evidence Report

- Generated at: 2026-04-20T03:22:21Z
- Started at: 2026-04-20T03:22:13Z
- Network: testnet
- Source address: GC5LQLM7IOEC7IDE27CXOS2SH4ZXXNN7NJS3BJOZKAFSPAC2PZ34J4XX
- Git commit: 80e64c55
- Env file: /home/jistriane/Stellaro/Stellaro/contracts/.env-testnet

## Run Flags

- ABI_STRICT=0
- RUN_MUTATIONS=0
- RUN_TRANSACTIONAL=0
- STRICT_ONCHAIN_ONLY=0
- STRICT_REQUIRED=0

## Contract IDs

- STABLECOIN_CONTRACT_ID: CAB2HQ7XQ2CS4ROO4E3PZVJASXUNEKWTDFGRRGIPVUFHGQC24HKZHJIZ
- BATCH_EXECUTOR_CONTRACT_ID: CB4JL3UCIUGGZNPFEO3AJF6YEPB7YXA5RL7ESLQSCRDCH2VIPML7NT6K
- MEV_GUARD_CONTRACT_ID: CAST73A5BQGH2EWIV2OUZ4553OEBQRMSFIKB4VFZLFCXKX5HT3Y62ZXS
- SOROSWAP_ROUTER_CONTRACT_ID: <not set>

## Step Results

| Step | Status | Exit Code | Log |
|------|--------|-----------|-----|
| ABI Check | pass | 0 | /home/jistriane/Stellaro/Stellaro/contracts/reports/20260420_override_check/abi_check.log |
| Smoke Read-only | fail | 1 | /home/jistriane/Stellaro/Stellaro/contracts/reports/20260420_override_check/smoke_read_only.log |
| Smoke Mutation | skipped | 0 | <skipped> |
| Transactional E2E | skipped | 0 | <skipped> |

## Overall

This report is for operational evidence collection. A non-pass result indicates pending work, missing ABI, missing credentials, or expected skip based on run flags.
