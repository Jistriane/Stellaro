#!/bin/bash

# 🚀 Stellaro Mainnet Deployment Script (v6.9)
# Este script automatiza o deploy de todos os contratos otimizados para a Mainnet Stellar.

set -e

echo "--------------------------------------------------"
echo "🚀 Iniciando Deploy Stellaro v6.9 na MAINNET"
echo "--------------------------------------------------"

# Carregar variáveis de ambiente
if [ -f .env.mainnet ]; then
  export $(grep -v '^#' .env.mainnet | xargs)
else
  echo "❌ Erro: Arquivo .env.mainnet não encontrado."
  exit 1
fi

# Build e Otimização
echo "📦 Compilando e otimizando contratos..."
stellar contract build
stellar contract optimize --wasm target/wasm32-unknown-unknown/release/*.wasm

# Listagem de contratos para deploy
CONTRACTS=(
  "zk_verifier"
  "dao_governance"
  "lending_pool"
  "rwa_tokenizer"
  "vc_registry"
  "subscription_manager"
  "rwa_marketplace"
  "multisig_adapter"
  "rwa_auction_market"
  "batch_executor"
)

# Loop de Deploy
for CONTRACT in "${CONTRACTS[@]}"; do
  echo "📤 Fazendo deploy de: $CONTRACT..."
  
  CONTRACT_ID=$(stellar contract deploy \
    --wasm target/optimized/$CONTRACT.wasm \
    --source $DEPLOYER_SECRET \
    --network mainnet)
    
  echo "✅ $CONTRACT Deployado! ID: $CONTRACT_ID"
  
  # Salvar IDs em um manifesto de produção
  echo "$CONTRACT=$CONTRACT_ID" >> mainnet_manifest_$(date +%F).env
  
  # Inicialização (se necessário)
  # stellar contract invoke --id $CONTRACT_ID --fn initialize ...
done

echo "--------------------------------------------------"
echo "🎉 DEPLOY CONCLUÍDO COM SUCESSO!"
echo "📄 IDs salvos em mainnet_manifest_$(date +%F).env"
echo "--------------------------------------------------"
