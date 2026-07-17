#!/bin/bash
# Port Conflict Helper for Stellaro Local Development
# Usage: ./tools/port_help_local_dev.sh [public-testnet|local-chain] [port]

set -euo pipefail

MODE="${1:-public-testnet}"
PORT_FILTER="${2:-}"

if [[ "$MODE" != "public-testnet" && "$MODE" != "local-chain" ]]; then
  echo "Modo invalido: $MODE"
  echo "Use: ./tools/port_help_local_dev.sh [public-testnet|local-chain] [port]"
  exit 1
fi

declare -a REQUIRED_PORTS=(
  "3000:frontend"
  "3001:backend"
  "3003:grafana"
  "5433:postgres"
  "6379:redis"
  "9090:prometheus"
)

if [[ "$MODE" == "local-chain" ]]; then
  REQUIRED_PORTS+=("8000:quickstart")
fi

if [[ -n "$PORT_FILTER" && ! "$PORT_FILTER" =~ ^[0-9]+$ ]]; then
  echo "Porta invalida: $PORT_FILTER"
  echo "Use uma porta numerica, por exemplo: ./tools/port_help_local_dev.sh local-chain 3001"
  exit 1
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

extract_pid() {
  local details="$1"
  sed -n 's/.*pid=\([0-9][0-9]*\).*/\1/p' <<<"$details" | head -n 1
}

extract_process_name() {
  local details="$1"
  sed -n 's/.*users:(("\([^"]*\)".*/\1/p' <<<"$details" | head -n 1
}

print_port_report() {
  local port="$1"
  local service="$2"
  local details compose_owner pid process_name

  details="$(get_listener_details "$port")"

  echo
  echo "=== Porta $port ($service) ==="

  if [[ -z "$details" ]]; then
    echo "Status: livre"
    echo "Acao recomendada: nenhuma. A porta esta disponivel para o stack."
    return
  fi

  compose_owner="$(get_compose_owner_by_port "$port")"
  if [[ -n "$compose_owner" ]]; then
    echo "Status: ocupada pelo stack esperado"
    echo "Owner Docker: $compose_owner"
    echo "Acao recomendada: reutilize o servico existente ou rode o status consolidado."
    echo "Comandos uteis:"
    echo "  docker compose ps"
    if [[ "$MODE" == "local-chain" ]]; then
      echo "  docker compose --profile local-chain ps"
    fi
    return
  fi

  pid="$(extract_pid "$details")"
  process_name="$(extract_process_name "$details")"

  echo "Status: conflito detectado"
  echo "Listener:"
  echo "$details"

  if [[ -n "$process_name" ]]; then
    echo "Processo detectado: $process_name"
  fi

  if [[ -n "$pid" ]]; then
    echo "PID detectado: $pid"
  fi

  echo "Acao recomendada: confirme se esse processo deve continuar ativo antes de subir o compose."
  echo "Comandos seguros de inspecao:"
  echo "  ss -ltnp '( sport = :$port )'"
  if [[ -n "$pid" ]]; then
    echo "  ps -p $pid -o pid=,ppid=,command="
  fi
  echo "  lsof -iTCP:$port -sTCP:LISTEN -n -P"

  echo "Se quiser liberar a porta manualmente:"
  if [[ -n "$pid" ]]; then
    echo "  kill $pid"
    echo "  kill -TERM $pid"
  else
    echo "  identifique o PID com os comandos acima e finalize o processo conscientemente"
  fi

  echo "Depois valide novamente:"
  if [[ "$MODE" == "local-chain" ]]; then
    echo "  npm run help:ports:local-chain${PORT_FILTER:+ -- $port}"
    echo "  npm run preflight:local-chain"
  else
    echo "  npm run help:ports:local-dev${PORT_FILTER:+ -- $port}"
    echo "  npm run preflight:local-dev"
  fi
}

MATCHED=0

for entry in "${REQUIRED_PORTS[@]}"; do
  port="${entry%%:*}"
  service="${entry##*:}"

  if [[ -n "$PORT_FILTER" && "$PORT_FILTER" != "$port" ]]; then
    continue
  fi

  MATCHED=1
  print_port_report "$port" "$service"
done

if [[ "$MATCHED" -eq 0 ]]; then
  echo "Nenhuma porta monitorada corresponde a: $PORT_FILTER"
  exit 1
fi
