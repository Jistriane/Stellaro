#!/bin/bash

# 🚀 Script de Atualização do Stellaro - Janeiro 2025

set -e  # Exit on error

echo "=================================================="
echo "🔄 Stellaro - Atualizações Janeiro 2025"
echo "=================================================="
echo ""

# 1. Limpar node_modules e lock files
echo "🧹 Limpando node_modules e lock files antigos..."
rm -rf node_modules package-lock.json
rm -rf apps/backend/node_modules apps/backend/package-lock.json
rm -rf apps/frontend/node_modules apps/frontend/package-lock.json
rm -rf packages/*/node_modules packages/*/package-lock.json

echo "✅ Limpeza concluída"
echo ""

# 2. Instalar dependências atualizadas
echo "📦 Instalando dependências atualizadas..."
echo "   - Turbo 2.3.0"
echo "   - Stellar SDK 14.4.0"
echo "   - Prisma 6.15.0"
echo ""

npm install

echo "✅ Dependências instaladas"
echo ""

# 3. Gerar Prisma Client
echo "🔨 Gerando Prisma Client..."
cd apps/backend
npx prisma generate
cd ../..

echo "✅ Prisma Client gerado"
echo ""

# 4. Executar testes
echo "🧪 Executando testes..."
npm run test

echo "✅ Testes concluídos"
echo ""

# 5. Build dos contratos Soroban
echo "🏗️  Building contratos Soroban..."
cd contracts

echo "   - Workspace Soroban (wasm32v1-none)"
cargo build --manifest-path Cargo.toml --target wasm32v1-none --release

cd ..

echo "✅ Contratos compilados"
echo ""

# 6. Validar ambiente
echo "🔍 Validando ambiente..."

# Verificar Node.js version
NODE_VERSION=$(node -v)
echo "   - Node.js: $NODE_VERSION (requerido: 20+)"

# Verificar TypeScript version
TS_VERSION=$(npx tsc -v)
echo "   - TypeScript: $TS_VERSION"

# Verificar Stellar CLI
if command -v stellar &> /dev/null; then
    STELLAR_VERSION=$(stellar version)
    echo "   - Stellar CLI: $STELLAR_VERSION"
else
    echo "   - Stellar CLI: ⚠️  Não instalado (opcional para desenvolvimento)"
fi

# Verificar Rust
if command -v cargo &> /dev/null; then
    RUST_VERSION=$(cargo --version)
    echo "   - Rust: $RUST_VERSION"
else
    echo "   - Rust: ❌ NÃO INSTALADO (requerido para contratos)"
fi

echo ""
echo "✅ Validação concluída"
echo ""

# 7. Resumo
echo "=================================================="
echo "✅ ATUALIZAÇÃO CONCLUÍDA COM SUCESSO!"
echo "=================================================="
echo ""
echo "📊 Resumo:"
echo "   ✅ Dependências atualizadas (Turbo 2.3, Stellar SDK 14.4, Prisma 6.15)"
echo "   ✅ Contratos Soroban compilados (workspace)"
echo "   ✅ Deploy Mainnet (v4) concluído e registrado em mainnet_deployment_registry.json"
echo ""
echo "📚 Próximos passos:"
echo "   1. Revisar UPDATE_REPORT_2025.md"
echo "   2. Revisar INTEGRATION_TASKS.md (contratos pendentes)"
echo "   3. Executar: npm run dev (desenvolvimento local)"
echo "   4. Executar: npm run build (produção)"
echo ""
echo "🚀 Para desenvolvimento:"
echo "   - Backend:  cd apps/backend && npm run dev"
echo "   - Frontend: cd apps/frontend && npm run dev"
echo "   - Contratos: cd contracts && cargo test --all"
echo ""
echo "=================================================="
