# Contratos Soroban (Stelato)

Este workspace contém os contratos:

- portfolio
- stablecoin
- risklock
- loans_pool

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
# Current Testnet Deployment (Dec 9, 2025)
STABLECOIN_CONTRACT_ID=CBC4KEL4BTI2XBNMJEZFFGJDUNFHEFDSJDEMZAGHWCVXRPYTHRMXQI2L
RISKLOCK_CONTRACT_ID=CAF4ZPHLAZGT4DXQLGX6F7PPE63AP2WWFWEKVPI3LN6UPOKPWSZZAZJS
LOANSPOOL_CONTRACT_ID=CCWS62FYOXIVA2YMORZHYDSU2NHJHUNQW4E7ONERHLMLD6RRHPFUQXZD
PORTFOLIO_CONTRACT_ID=CDSGXZQF4676KX2YCPIPIPRV7L7SE7DFBVKVXHICMJ26ZCO3GIENWXW5
GOVERNANCE_CONTRACT_ID=CCFMF4ZZEU3UMOQVDZNB5CHLZOAXRFPFCZOEVBI6JXZHYWFQLVHOLEJ3
ZK_VERIFIER_CONTRACT_ID=CCWZPTZEZZFOELDGVHP7IAO5GNVX6MSITN2G7H3ZBGG57OXPVZYYPAFO
```

E variáveis da rede:

```bash
STELLAR_NETWORK=testnet
SOROBAN_RPC_URL=https://soroban-testnet.stellar.org
HORIZON_URL=https://horizon-testnet.stellar.org
SOROBAN_NETWORK_PASSPHRASE="Test SDF Network ; September 2015"
WALLET_SECRET_DEV=<chave secreta dev>
```
