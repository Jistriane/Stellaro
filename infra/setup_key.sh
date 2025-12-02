#!/usr/bin/env bash
set -euo pipefail

# Script auxiliar para configuração de chave Soroban
# Uso: ./infra/setup_key.sh

echo "====================================="
echo "  Configuração de Chave Soroban"
echo "====================================="
echo ""
echo "Para configurar a chave de deploy, execute:"
echo ""
echo "  soroban keys add deploy --secret-key"
echo ""
echo "Quando solicitado, cole sua chave secreta (começa com 'S...')"
echo ""
echo "Para verificar após configurar:"
echo "  soroban keys list"
echo "  soroban keys public-key deploy"
echo ""
echo "====================================="
echo ""
echo "Alternativa: Gerar nova chave aleatória para testnet"
read -p "Deseja gerar uma nova chave agora? (s/N): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Ss]$ ]]; then
    echo "Gerando nova chave..."
    soroban keys generate deploy --network testnet
    echo ""
    echo "✅ Chave 'deploy' criada!"
    echo ""
    echo "Chave pública:"
    soroban keys public-key deploy
    echo ""
    echo "⚠️  IMPORTANTE: Guarde a chave secreta em local seguro!"
    echo "Para exportar a chave secreta:"
    echo "  soroban keys show deploy"
    echo ""
else
    echo "Configuração manual necessária:"
    echo "  soroban keys add deploy --secret-key"
    echo ""
fi
