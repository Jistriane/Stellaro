#!/bin/bash
# Pre-flight Check for Stellaro Local Development
# Usage: ./tools/preflight_local_dev.sh [public-testnet|local-chain]

set -euo pipefail

MODE="${1:-public-testnet}"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

if [[ "$MODE" != "public-testnet" && "$MODE" != "local-chain" ]]; then
  echo -e "${RED}❌ Modo inválido: $MODE${NC}"
  echo "Use: ./tools/preflight_local_dev.sh [public-testnet|local-chain]"
  exit 1
fi

echo "🔍 Starting Stellaro local dev preflight for mode: $MODE"

declare -a REQUIRED_PORTS=("3000:frontend" "3001:backend" "3003:grafana" "5433:postgres" "6379:redis" "9090:prometheus")

if [[ "$MODE" == "local-chain" ]]; then
  REQUIRED_PORTS+=("8000:quickstart")
fi

get_compose_owner_by_port() {
  local port="$1"
  docker ps --format '{{.Names}}\t{{.Ports}}' 2>/dev/null | awk -F'\t' -v port="$port" '
    $1 ~ /^stellaro-/ && $2 ~ ("0\\.0\\.0\\.0:" port "->|\\[::\\]:" port "->") {
      print $1
      exit
    }'
}

get_listener_details() {
  local port="$1"
  ss -ltnp "( sport = :$port )" 2>/dev/null | tail -n +2 || true
}

FAILURES=0

for entry in "${REQUIRED_PORTS[@]}"; do
  port="${entry%%:*}"
  service="${entry##*:}"

  listener_details="$(get_listener_details "$port")"
  if [[ -z "$listener_details" ]]; then
    echo -e "${GREEN}✅ Porta $port livre para $service.${NC}"
    continue
  fi

  compose_owner="$(get_compose_owner_by_port "$port")"
  if [[ -n "$compose_owner" ]]; then
    echo -e "${GREEN}✅ Porta $port já gerenciada por $compose_owner.${NC}"
    continue
  fi

  echo -e "${RED}❌ Porta $port ocupada por processo fora do stack Docker esperado para $service.${NC}"
  echo "$listener_details"
  echo -e "${YELLOW}Sugestão:${NC} pare o processo local nessa porta ou reutilize-o manualmente em vez de subir o serviço correspondente pelo compose."
  FAILURES=$((FAILURES + 1))
done

if [[ "$FAILURES" -gt 0 ]]; then
  echo "--------------------------------------------------"
  echo -e "${RED}🚫 PRE-FLIGHT FAILED. Resolva os conflitos de porta antes de subir o stack automatizado.${NC}"
  exit 1
fi

echo "--------------------------------------------------"
echo -e "${GREEN}🚀 PRE-FLIGHT COMPLETE. Ready for local development boot.${NC}"
