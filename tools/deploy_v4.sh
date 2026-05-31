#!/bin/bash
set -euo pipefail

# Carregar chaves reais
# Preferência: arquivo fora do repo via STELLARO_KEYS_FILE (recomendado)
# Fallback: MAINNET_KEYS_REQUIRED.env (apenas template; evite manter chaves reais no repo)
if [ "${STELLARO_KEYS_FILE:-}" != "" ] && [ -f "$STELLARO_KEYS_FILE" ]; then
    set -a
    source "$STELLARO_KEYS_FILE"
    set +a
    NETWORK="public"
    echo "🌐 Modo: MAINNET detectado (STELLARO_KEYS_FILE)."
elif [ -f "MAINNET_KEYS_REQUIRED.env" ]; then
    set -a
    source MAINNET_KEYS_REQUIRED.env
    set +a
    NETWORK="public"
    echo "🌐 Modo: MAINNET detectado (MAINNET_KEYS_REQUIRED.env)."
else
    NETWORK="testnet"
    echo "🧪 Modo: TESTNET (arquivo de chaves não encontrado)."
fi

if [ "${STELLAR_NETWORK_PASSPHRASE:-}" = "" ]; then
    if [ "$NETWORK" = "public" ]; then
        STELLAR_NETWORK_PASSPHRASE="Public Global Stellar Network ; September 2015"
    else
        STELLAR_NETWORK_PASSPHRASE="Test SDF Network ; September 2015"
    fi
fi

PASSPHRASE="$STELLAR_NETWORK_PASSPHRASE"

SOURCE_KEY=${MASTER_SECRET_KEY:-"S..."} # Fallback para dev
REGISTRY_FILE="mainnet_deployment_registry.json"
EXPERT_URL="https://stellar.expert/explorer/public/contract"
MAX_RETRIES=${DEPLOY_MAX_RETRIES:-5}
RETRY_SLEEP_SECONDS=${DEPLOY_RETRY_SLEEP_SECONDS:-4}

if [ "${SOROBAN_RPC_URL:-}" = "" ]; then
    if [ "$NETWORK" = "public" ]; then
        SOROBAN_RPC_URL="https://soroban-rpc.mainnet.stellar.gateway.fm"
    else
        SOROBAN_RPC_URL="https://soroban-rpc.testnet.stellar.org"
    fi
fi

SOROBAN_RPC_URL="$(printf "%s" "$SOROBAN_RPC_URL" | tr -d '\`' | tr -d '"' | tr -d ' ')"
HORIZON_URL="${HORIZON_URL:-}"
HORIZON_URL="$(printf "%s" "$HORIZON_URL" | tr -d '\`' | tr -d '"' | tr -d ' ')"
PASSPHRASE="$(printf "%s" "$PASSPHRASE" | tr -d '\`' | tr -d '"')"

RPC_CANDIDATES=("$SOROBAN_RPC_URL")
if [ "$NETWORK" = "public" ]; then
    RPC_CANDIDATES+=(
        "https://soroban-rpc.mainnet.stellar.gateway.fm"
        "https://rpc.ankr.com/stellar_soroban"
        "https://stellar-soroban-public.nodies.app"
        "https://mainnet.sorobanrpc.com"
        "https://stellar.api.onfinality.io/public"
        "https://rpc.lightsail.network/"
    )
else
    RPC_CANDIDATES+=("https://soroban-testnet.stellar.org")
fi

ACTIVE_RPC=""
if command -v curl >/dev/null 2>&1; then
    for candidate in "${RPC_CANDIDATES[@]}"; do
        set +e
        curl -sS -m 12 -X POST -H "Content-Type: application/json" \
            -d '{"jsonrpc":"2.0","id":1,"method":"getHealth","params":{}}' \
            "$candidate" >/dev/null 2>&1
        curl_exit=$?
        set -e
        if [ $curl_exit -eq 0 ]; then
            ACTIVE_RPC="$candidate"
            break
        fi
    done
else
    ACTIVE_RPC="${RPC_CANDIDATES[0]}"
fi

if [ "$ACTIVE_RPC" = "" ]; then
    echo "❌ Nenhum RPC respondeu ao health check."
    echo "   DNS/Firewall pode estar bloqueando. Tente hotspot 4G/5G."
    exit 1
fi

echo "RPC: $ACTIVE_RPC"
echo "Network passphrase: $PASSPHRASE"

echo "🚀 Iniciando Deploy Stellaro v4.0..."
echo "{\"network\": \"$NETWORK\", \"timestamp\": \"$(date)\", \"contracts\": {}}" > $REGISTRY_FILE

# Build Soroban WASMs using the correct target (wasm32v1-none).
WASM_DIR="contracts/target/wasm32v1-none/release"
if [ ! -d "$WASM_DIR" ] || [ "$(ls -1 "$WASM_DIR"/*.wasm 2>/dev/null | wc -l | tr -d ' ')" = "0" ]; then
    echo "==> Build dos contratos (target wasm32v1-none)"
    if command -v stellar >/dev/null 2>&1 && stellar contract build --help >/dev/null 2>&1; then
        stellar contract build --manifest-path contracts/Cargo.toml --profile release
    elif command -v soroban >/dev/null 2>&1; then
        soroban contract build --manifest-path contracts/Cargo.toml --profile release
    else
        echo "❌ Erro: nem 'stellar contract build' nem 'soroban' CLI estão disponíveis para build."
        echo "   Instale o soroban-cli ou atualize o stellar-cli e tente novamente."
        exit 1
    fi
fi

# Lista completa de contratos para deploy conforme workspace
CONTRACTS=(
    "portfolio"
    "stablecoin"
    "risklock"
    "loans_pool"
    "governance"
    "zk_verifier"
    "batch_executor"
    "mev_guard"
    "vc_registry"
    "rwa_tokenizer"
    "dao_governance"
    "recurring_payments"
    "insurance_pool"
    "bridge_adapter"
    "rwa_marketplace"
    "institutional_vault"
    "liquid_staking"
    "multisig_adapter"
    "referral_system"
)

for CONTRACT in "${CONTRACTS[@]}"; do
    echo "📦 Deploying $CONTRACT..."
    
    WASM_PATH="$WASM_DIR/$CONTRACT.wasm"
    
    if [ ! -f "$WASM_PATH" ]; then
        echo "❌ Erro: WASM não encontrado para $CONTRACT em $WASM_DIR."
        echo "   Execute o build via 'stellar contract build' ou 'soroban contract build' e tente novamente."
        exit 1
    fi

    # COMANDO REAL DE DEPLOY
    echo "📡 Enviando transação para a Mainnet..."
    CONTRACT_ID=""
    attempt=1
    while [ $attempt -le $MAX_RETRIES ]; do
        rpc_index=$(( (attempt - 1) % ${#RPC_CANDIDATES[@]} ))
        current_rpc="${RPC_CANDIDATES[$rpc_index]}"
        if [ "$current_rpc" = "" ]; then
            current_rpc="$ACTIVE_RPC"
        fi

        set +e
        CONTRACT_ID=$(stellar contract deploy \
            --wasm "$WASM_PATH" \
            --source-account "$SOURCE_KEY" \
            --rpc-url "$current_rpc" \
            --network-passphrase "$PASSPHRASE" 2>/tmp/stellaro_deploy_err.txt)
        exit_code=$?
        set -e

        if [ $exit_code -eq 0 ] && [ "${CONTRACT_ID:-}" != "" ]; then
            break
        fi

        echo "❌ Falha ao deployar $CONTRACT (tentativa $attempt/$MAX_RETRIES)."
        echo "RPC usado: $current_rpc"
        tail -n 5 /tmp/stellaro_deploy_err.txt || true

        if [ $attempt -lt $MAX_RETRIES ]; then
            sleep_seconds=$((RETRY_SLEEP_SECONDS * attempt))
            echo "⏳ Aguardando ${sleep_seconds}s e tentando novamente..."
            sleep $sleep_seconds
        fi

        attempt=$((attempt + 1))
    done

    if [ "${CONTRACT_ID:-}" = "" ]; then
        echo "❌ Deploy abortado. Não foi possível obter CONTRACT_ID para $CONTRACT."
        exit 1
    fi
    
    # Gerar link do StellarExpert baseado no ID real
    STELLAR_EXPERT_LINK="$EXPERT_URL/$CONTRACT_ID"
    
    echo "✅ $CONTRACT deployado: $CONTRACT_ID"
    echo "🔗 Stellar Expert: $STELLAR_EXPERT_LINK"

    # Salvar no registro JSON
    cat <<< $(jq --arg c "$CONTRACT" --arg id "$CONTRACT_ID" --arg link "$STELLAR_EXPERT_LINK" \
        '.contracts += {($c): {"id": $id, "link": $link}}' $REGISTRY_FILE) > $REGISTRY_FILE
done

echo "--------------------------------------------------"
echo "🎉 Deploy concluído com sucesso!"
echo "📂 Registro salvo em: $REGISTRY_FILE"
echo "⚠️  IMPORTANTE: Copie os IDs acima para o seu .env-prod"
