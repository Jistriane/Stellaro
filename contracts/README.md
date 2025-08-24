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

## Backend (.env-dev)
Defina os IDs no backend:
```
PORTFOLIO_CONTRACT_ID=
STABLECOIN_CONTRACT_ID=
RISKLOCK_CONTRACT_ID=
LOANSPOOL_CONTRACT_ID=
```

E variáveis da rede:
```
STELLAR_NETWORK=testnet
SOROBAN_RPC_URL=https://soroban-testnet.stellar.org
HORIZON_URL=https://horizon-testnet.stellar.org
SOROBAN_NETWORK_PASSPHRASE="Test SDF Network ; September 2015"
WALLET_SECRET_DEV=<chave secreta dev>
```
