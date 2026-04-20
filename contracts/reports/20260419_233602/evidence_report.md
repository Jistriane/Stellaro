# Stellaro Testnet Evidence Report

- Generated at: 2026-04-20T02:36:12Z
- Started at: 2026-04-20T02:36:02Z
- Network: testnet
- Source address: GC5LQLM7IOEC7IDE27CXOS2SH4ZXXNN7NJS3BJOZKAFSPAC2PZ34J4XX
- Git commit: 80e64c55
- Env file: /home/jistriane/Stellaro/Stellaro/contracts/.env-testnet

## Contract IDs

- STABLECOIN_CONTRACT_ID: CCX2C7SN3RXKAVTFTNBQ5MCWLY2WEGXWGRKVFKJ427HN745CHXNRRBVG
- BATCH_EXECUTOR_CONTRACT_ID: CAHWOMBTMVUWGMRWSJY2TPCBMPO3A3LODCBE6MFXMA6XR4ALZZCGTN7I
- MEV_GUARD_CONTRACT_ID: CDHQZQ5YMNVAPKXJ6LVBDSJC4QVZL4UD2TIKSTDYGATMBTWEV7ZSOG3M
- SOROSWAP_ROUTER_CONTRACT_ID: <not set>

## Step Results

| Step | Status | Exit Code | Log |
|------|--------|-----------|-----|
| ABI Check | == Stellaro Testnet ABI Upgrade Check ==
Network: testnet
Source: GC5LQLM7IOEC7IDE27CXOS2SH4ZXXNN7NJS3BJOZKAFSPAC2PZ34J4XX
Env file: /home/jistriane/Stellaro/Stellaro/contracts/.env-testnet
STRICT=0

[1/3] Stablecoin ABI baseline
[ok]   stablecoin.init
[ok]   stablecoin.balance_of
[ok]   stablecoin.mint_guarded

[2/3] Batch Executor ABI
[ok]   batch_executor.init
[ok]   batch_executor.execute_batch
[ok]   batch_executor.get_admin
[miss] batch_executor.set_stablecoin_contract (required for upgraded flow)
[miss] batch_executor.get_stablecoin_contract (required for upgraded flow)
[miss] batch_executor.set_dex_router (required for upgraded flow)
[miss] batch_executor.get_dex_router (required for upgraded flow)

[3/3] MEV Guard ABI
[ok]   mev_guard.init
[ok]   mev_guard.create_protected_order
[ok]   mev_guard.execute_protected_swap
[miss] mev_guard.set_dex_router (required for upgraded flow)
[miss] mev_guard.get_dex_router (required for upgraded flow)

Result: Required upgraded ABI commands are missing; redeploy/upgrade needed before full mutation validation.
pass | == Stellaro Testnet ABI Upgrade Check ==
Network: testnet
Source: GC5LQLM7IOEC7IDE27CXOS2SH4ZXXNN7NJS3BJOZKAFSPAC2PZ34J4XX
Env file: /home/jistriane/Stellaro/Stellaro/contracts/.env-testnet
STRICT=0

[1/3] Stablecoin ABI baseline
[ok]   stablecoin.init
[ok]   stablecoin.balance_of
[ok]   stablecoin.mint_guarded

[2/3] Batch Executor ABI
[ok]   batch_executor.init
[ok]   batch_executor.execute_batch
[ok]   batch_executor.get_admin
[miss] batch_executor.set_stablecoin_contract (required for upgraded flow)
[miss] batch_executor.get_stablecoin_contract (required for upgraded flow)
[miss] batch_executor.set_dex_router (required for upgraded flow)
[miss] batch_executor.get_dex_router (required for upgraded flow)

[3/3] MEV Guard ABI
[ok]   mev_guard.init
[ok]   mev_guard.create_protected_order
[ok]   mev_guard.execute_protected_swap
[miss] mev_guard.set_dex_router (required for upgraded flow)
[miss] mev_guard.get_dex_router (required for upgraded flow)

Result: Required upgraded ABI commands are missing; redeploy/upgrade needed before full mutation validation.
0 | == Stellaro Testnet ABI Upgrade Check ==
Network: testnet
Source: GC5LQLM7IOEC7IDE27CXOS2SH4ZXXNN7NJS3BJOZKAFSPAC2PZ34J4XX
Env file: /home/jistriane/Stellaro/Stellaro/contracts/.env-testnet
STRICT=0

[1/3] Stablecoin ABI baseline
[ok]   stablecoin.init
[ok]   stablecoin.balance_of
[ok]   stablecoin.mint_guarded

[2/3] Batch Executor ABI
[ok]   batch_executor.init
[ok]   batch_executor.execute_batch
[ok]   batch_executor.get_admin
[miss] batch_executor.set_stablecoin_contract (required for upgraded flow)
[miss] batch_executor.get_stablecoin_contract (required for upgraded flow)
[miss] batch_executor.set_dex_router (required for upgraded flow)
[miss] batch_executor.get_dex_router (required for upgraded flow)

[3/3] MEV Guard ABI
[ok]   mev_guard.init
[ok]   mev_guard.create_protected_order
[ok]   mev_guard.execute_protected_swap
[miss] mev_guard.set_dex_router (required for upgraded flow)
[miss] mev_guard.get_dex_router (required for upgraded flow)

Result: Required upgraded ABI commands are missing; redeploy/upgrade needed before full mutation validation.
/home/jistriane/Stellaro/Stellaro/contracts/reports/20260419_233602/abi_check.log |
| Smoke Read-only | == Stellaro Testnet Integration Smoke ==
Network: testnet
Source account alias: <none>
Source address: GC5LQLM7IOEC7IDE27CXOS2SH4ZXXNN7NJS3BJOZKAFSPAC2PZ34J4XX
Env file: /home/jistriane/Stellaro/Stellaro/contracts/.env-testnet
RUN_MUTATIONS=0

[1/4] Read-only checks: Stablecoin
stablecoin.balance(source) = 0

[2/4] Read-only checks: Batch Executor
batch_executor.admin = GC5LQLM7IOEC7IDE27CXOS2SH4ZXXNN7NJS3BJOZKAFSPAC2PZ34J4XX
batch_executor.execution_count = 0
batch_executor.total_gas_saved = 0

[3/4] Read-only checks: MEV Guard
mev_guard.admin = GC5LQLM7IOEC7IDE27CXOS2SH4ZXXNN7NJS3BJOZKAFSPAC2PZ34J4XX
mev_guard.max_slippage_bps = 500

[4/4] Optional mutation checks
Skipping mutation checks (set RUN_MUTATIONS=1 to enable).

Smoke finished (read-only mode).
pass | == Stellaro Testnet Integration Smoke ==
Network: testnet
Source account alias: <none>
Source address: GC5LQLM7IOEC7IDE27CXOS2SH4ZXXNN7NJS3BJOZKAFSPAC2PZ34J4XX
Env file: /home/jistriane/Stellaro/Stellaro/contracts/.env-testnet
RUN_MUTATIONS=0

[1/4] Read-only checks: Stablecoin
stablecoin.balance(source) = 0

[2/4] Read-only checks: Batch Executor
batch_executor.admin = GC5LQLM7IOEC7IDE27CXOS2SH4ZXXNN7NJS3BJOZKAFSPAC2PZ34J4XX
batch_executor.execution_count = 0
batch_executor.total_gas_saved = 0

[3/4] Read-only checks: MEV Guard
mev_guard.admin = GC5LQLM7IOEC7IDE27CXOS2SH4ZXXNN7NJS3BJOZKAFSPAC2PZ34J4XX
mev_guard.max_slippage_bps = 500

[4/4] Optional mutation checks
Skipping mutation checks (set RUN_MUTATIONS=1 to enable).

Smoke finished (read-only mode).
0 | == Stellaro Testnet Integration Smoke ==
Network: testnet
Source account alias: <none>
Source address: GC5LQLM7IOEC7IDE27CXOS2SH4ZXXNN7NJS3BJOZKAFSPAC2PZ34J4XX
Env file: /home/jistriane/Stellaro/Stellaro/contracts/.env-testnet
RUN_MUTATIONS=0

[1/4] Read-only checks: Stablecoin
stablecoin.balance(source) = 0

[2/4] Read-only checks: Batch Executor
batch_executor.admin = GC5LQLM7IOEC7IDE27CXOS2SH4ZXXNN7NJS3BJOZKAFSPAC2PZ34J4XX
batch_executor.execution_count = 0
batch_executor.total_gas_saved = 0

[3/4] Read-only checks: MEV Guard
mev_guard.admin = GC5LQLM7IOEC7IDE27CXOS2SH4ZXXNN7NJS3BJOZKAFSPAC2PZ34J4XX
mev_guard.max_slippage_bps = 500

[4/4] Optional mutation checks
Skipping mutation checks (set RUN_MUTATIONS=1 to enable).

Smoke finished (read-only mode).
/home/jistriane/Stellaro/Stellaro/contracts/reports/20260419_233602/smoke_read_only.log |
| Smoke Mutation | skipped | 0 | <skipped> |
| Transactional E2E | skipped | 0 | <skipped> |

## Overall

This report is for operational evidence collection. A non-pass result indicates pending work, missing ABI, missing credentials, or expected skip based on run flags.
