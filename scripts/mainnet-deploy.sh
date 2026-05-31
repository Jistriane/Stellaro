#!/bin/bash

# 🚀 Stellaro Mainnet Deployment Script (v4.0)
# Wrapper para o deploy canônico: tools/deploy_v4.sh

set -euo pipefail

ROOT_DIR=$(cd "$(dirname "$0")/.." && pwd)
cd "$ROOT_DIR"

echo "--------------------------------------------------"
echo "🚀 Iniciando Deploy Stellaro v4.0 na MAINNET"
echo "--------------------------------------------------"

export DEPLOY_MAX_RETRIES="${DEPLOY_MAX_RETRIES:-10}"
export DEPLOY_RETRY_SLEEP_SECONDS="${DEPLOY_RETRY_SLEEP_SECONDS:-6}"

bash tools/deploy_v4.sh
