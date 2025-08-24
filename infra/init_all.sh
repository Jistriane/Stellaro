#!/usr/bin/env bash
# Orquestrador de inicialização completa do Stelato (dev)
# - Assume Postgres e Redis locais já em execução (sem Docker)
# - Instala dependências (workspaces)
# - Executa Prisma (generate + migrate dev)
# - Opcionalmente inicia os dev servers (Turbo)

set -euo pipefail

# Paths
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &>/dev/null && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
:

# Defaults
START_SERVERS="no"

usage() {
  cat <<EOF
Uso: infra/init_all.sh [opções]

Opções:
  --start-servers            Inicia os dev servers após setup (turbo dev)
  -h, --help                 Mostra esta ajuda

Exemplos:
  $ ./infra/init_all.sh --start-servers
EOF
}

# Parse args
while [[ $# -gt 0 ]]; do
  case "$1" in
    --start-servers) START_SERVERS="yes"; shift ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Opção desconhecida: $1"; usage; exit 1 ;;
  esac
done

step() { echo -e "\n==> $*"; }

require_cmd() {
  if ! command -v "$1" &>/dev/null; then
    echo "Erro: comando '$1' não encontrado. Instale e tente novamente." >&2
    exit 1
  fi
}

# Checagens básicas
require_cmd npm

# 1) Aviso sobre dependências locais
step "Usando serviços locais (Postgres/Redis). Certifique-se de que estão em execução e que DATABASE_URL está configurado."

# 2) Instalar dependências (workspaces)
step "Instalando dependências (workspaces)"
( cd "$ROOT_DIR" && npm install )

# 3) Prisma (apps/backend)
step "Prisma generate + migrate dev"
( cd "$ROOT_DIR/apps/backend" && npx prisma generate && npx prisma migrate dev --name init )

# 4) Opcional: iniciar dev servers
if [[ "$START_SERVERS" == "yes" ]]; then
  step "Iniciando dev servers (Turbo) — pressione Ctrl+C para parar"
  ( cd "$ROOT_DIR" && npm run dev )
else
  step "Setup concluído. Você pode iniciar os servidores com: npm run dev (na raiz)"
fi

# Resumo
cat <<SUMMARY

Resumo:
 - Serviços locais: Postgres/Redis (sem Docker)
 - npm install (workspaces)
 - Prisma: generate + migrate dev
 - Dev servers: $( [[ "$START_SERVERS" == "yes" ]] && echo "iniciados" || echo "não iniciados" )

Observação: verifique sua `DATABASE_URL` no backend para apontar para seu Postgres local.
SUMMARY
