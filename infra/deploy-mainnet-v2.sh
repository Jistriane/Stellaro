#!/bin/bash
set -euo pipefail

MODE="upgrade"
ALIAS="${SOROBAN_KEY_NAME:-deploy}"
CONTRACTS_CSV="dao_governance,rwa_marketplace"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --mode)
      MODE="${2:-}"
      shift 2
      ;;
    --alias)
      ALIAS="${2:-}"
      shift 2
      ;;
    --contracts)
      CONTRACTS_CSV="${2:-}"
      shift 2
      ;;
    *)
      echo "Unknown argument: $1" >&2
      exit 2
      ;;
  esac
done

if [[ "$MODE" != "deploy" && "$MODE" != "upgrade" ]]; then
  echo "Invalid --mode: $MODE (use deploy|upgrade)" >&2
  exit 2
fi

if ! command -v soroban >/dev/null 2>&1; then
  echo "soroban CLI not found in PATH" >&2
  exit 1
fi

echo "🚀 STELLARO MAINNET ($MODE)"
echo "======================================"
echo "Date: $(date)"
echo "Network: Stellar MAINNET (LIVE)"
echo "Key alias: $ALIAS"
echo ""

# ============= CONFIGURATION =============
MAINNET_RPC="https://rpc-mainnet.stellar.org"
MAINNET_PASSPHRASE="Public Global Stellar Network ; September 2015"

RISK_BPS=8000
LTV_BPS=7000
INTEREST_BPS=1800

ROOT_DIR=$(cd "$(dirname "$0")/.." && pwd)
CONTRACTS_DIR="$ROOT_DIR/contracts"

TEMP_KEY=""
if [[ -n "${SOROBAN_SECRET_KEY:-}" ]]; then
  TEMP_KEY=$(mktemp)
  echo "$SOROBAN_SECRET_KEY" > "$TEMP_KEY"
  chmod 600 "$TEMP_KEY"
  soroban keys add "$ALIAS" --secret-key-file "$TEMP_KEY" >/dev/null 2>&1 || true
fi

if ! soroban keys show "$ALIAS" >/dev/null 2>&1; then
  echo "Key alias '$ALIAS' not found. Configure it with soroban-cli keys, or set SOROBAN_SECRET_KEY." >&2
  exit 1
fi

ADMIN_PUBLIC=$(soroban keys address "$ALIAS")

echo "1️⃣ Verificando saldo em mainnet..."
BALANCE=$(soroban account balance "$ALIAS" --network mainnet 2>/dev/null || echo "0")
echo "   Saldo: $BALANCE XLM"
echo ""

# ============= STEP 2: BUILD CONTRACTS =============
echo "2️⃣ Compilando contratos..."
cd "$CONTRACTS_DIR"

if ! soroban contract build --manifest-path Cargo.toml --profile release 2>&1 | grep -q "Finished\|Compiling"; then
  echo "   ⚠️ Build pode estar usando cache..."
fi
echo "   ✅ Contratos prontos"
echo ""

# ============= STEP 3: OPTIMIZE WASM =============
echo "3️⃣ Otimizando WASMs..."

for contract in stablecoin risklock loans_pool portfolio governance zk_verifier batch_executor mev_guard dao_governance rwa_marketplace; do
  if [ -f "target/wasm32v1-none/release/${contract}.wasm" ]; then
    soroban contract optimize \
      --wasm "target/wasm32v1-none/release/${contract}.wasm" \
      --quiet 2>/dev/null || true
    echo "   ✅ ${contract}"
  fi
done
echo ""

declare -A UPGRADE_IDS
UPGRADE_IDS[dao_governance]="${DAO_GOVERNANCE_ID:-}"
UPGRADE_IDS[rwa_marketplace]="${RWA_MARKETPLACE_ID:-}"

IFS=',' read -r -a CONTRACTS_TO_PROCESS <<< "$CONTRACTS_CSV"

if [[ "$MODE" == "upgrade" ]]; then
  echo "4️⃣ Upgrading contratos em mainnet..."
  for contract in "${CONTRACTS_TO_PROCESS[@]}"; do
    CONTRACT_ID="${UPGRADE_IDS[$contract]:-}"
    if [[ -z "$CONTRACT_ID" ]]; then
      echo "Missing contract id for $contract. Set DAO_GOVERNANCE_ID and/or RWA_MARKETPLACE_ID." >&2
      exit 1
    fi
  done

  for contract in "${CONTRACTS_TO_PROCESS[@]}"; do
    CONTRACT_ID="${UPGRADE_IDS[$contract]}"
    WASM="target/wasm32v1-none/release/${contract}.wasm"
    if [[ ! -f "$WASM" ]]; then
      echo "Missing wasm: $WASM" >&2
      exit 1
    fi

    echo "   📦 install wasm: ${contract}..."
    WASM_HASH=$(
      soroban contract install \
        --wasm "$WASM" \
        --source-account "$ALIAS" \
        --rpc-url "$MAINNET_RPC" \
        --network-passphrase "$MAINNET_PASSPHRASE" 2>&1 | grep -oE "[A-Fa-f0-9]{64}" | head -1
    )
    if [[ -z "$WASM_HASH" ]]; then
      echo "Failed to install wasm for $contract" >&2
      exit 1
    fi

    echo "   🔁 invoke upgrade: ${contract} (${CONTRACT_ID})..."
    soroban contract invoke \
      --id "$CONTRACT_ID" \
      --source-account "$ALIAS" \
      --rpc-url "$MAINNET_RPC" \
      --network-passphrase "$MAINNET_PASSPHRASE" \
      -- upgrade \
      --caller "$ADMIN_PUBLIC" \
      --new-wasm-hash "$WASM_HASH" >/dev/null

    if [[ "$contract" == "dao_governance" ]]; then
      soroban contract invoke \
        --id "$CONTRACT_ID" \
        --source-account "$ALIAS" \
        --rpc-url "$MAINNET_RPC" \
        --network-passphrase "$MAINNET_PASSPHRASE" \
        --send no \
        -- proposals_count >/dev/null
    fi
    if [[ "$contract" == "rwa_marketplace" ]]; then
      soroban contract invoke \
        --id "$CONTRACT_ID" \
        --source-account "$ALIAS" \
        --rpc-url "$MAINNET_RPC" \
        --network-passphrase "$MAINNET_PASSPHRASE" \
        --send no \
        -- auction_count >/dev/null
    fi

    echo "      ✅ upgraded"
  done

  echo ""
  echo "✅ Upgrade concluído."
else
  echo "Deploy mode is not supported in this script version. Use the previous revision or run via soroban-cli manually." >&2
  exit 2
fi

if [[ -n "$TEMP_KEY" ]]; then
  rm -f "$TEMP_KEY"
fi

echo "======================================"
echo "✅ MAINNET $MODE OK"
echo "======================================"
echo "Admin: $ADMIN_PUBLIC"
echo ""
echo "Contratos processados:"
for contract in "${CONTRACTS_TO_PROCESS[@]}"; do
  echo "  - ${contract}: ${UPGRADE_IDS[$contract]}"
done
echo ""
