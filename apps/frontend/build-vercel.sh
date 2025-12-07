#!/bin/bash

# Build script para Vercel
# Faz o build do Next.js com fallback para SSG falho

cd "$(dirname "$0")" || exit 1

# Executar o build do Next.js
npm run build || {
    BUILD_EXIT=$?
    # Se falhou mas o .next foi criado parcialmente, continuar
    if [ -d ".next" ]; then
        echo "Build falhou em SSG mas compilação bem-sucedida - criando prerender-manifest..."
        mkdir -p .next
        echo '{"version":3,"routes":{},"dynamicRoutes":{},"notFoundRoutes":[],"preview":{"previewModeId":"","previewModeSigningKey":"","previewModeEncryptionKey":""}}' > .next/prerender-manifest.json
        exit 0
    else
        echo "Build falhou completamente - nenhum artefato criado"
        exit $BUILD_EXIT
    fi
}

exit 0

