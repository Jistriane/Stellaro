#!/bin/bash
# Local Status Check for Stellaro Development
# Usage: ./tools/status_local_dev.sh [public-testnet|local-chain]

set -euo pipefail

MODE="${1:-public-testnet}"

if [[ "$MODE" != "public-testnet" && "$MODE" != "local-chain" ]]; then
  echo "Modo inválido: $MODE"
  echo "Use: ./tools/status_local_dev.sh [public-testnet|local-chain]"
  exit 1
fi

print_header() {
  echo
  echo "=== $1 ==="
}

describe_listener() {
  local port="$1"
  local details
  details="$(ss -ltnp "( sport = :$port )" 2>/dev/null | tail -n +2 || true)"
  if [[ -z "$details" ]]; then
    echo "porta $port: livre"
  else
    echo "$details"
  fi
}

check_http() {
  local label="$1"
  local url="$2"
  local method="${3:-GET}"
  local payload="${4:-}"
  local response

  if [[ "$method" == "POST" ]]; then
    response="$(curl -s -o /tmp/stellaro_status_body.txt -w '%{http_code}' \
      -X POST "$url" \
      -H 'Content-Type: application/json' \
      -d "$payload" || true)"
  else
    response="$(curl -s -o /tmp/stellaro_status_body.txt -w '%{http_code}' "$url" || true)"
  fi

  if [[ -z "$response" || "$response" == "000" ]]; then
    echo "$label: indisponível ($url)"
    return
  fi

  local preview
  preview="$(head -c 140 /tmp/stellaro_status_body.txt | tr '\n' ' ' || true)"
  echo "$label: HTTP $response - $url"
  if [[ -n "$preview" ]]; then
    echo "  body: $preview"
  fi
}

print_header "Modo"
echo "$MODE"

print_header "Docker Compose"
docker compose ps || true
if [[ "$MODE" == "local-chain" ]]; then
  echo
  echo "--- profile local-chain ---"
  docker compose --profile local-chain ps || true
fi

print_header "Portas Locais"
describe_listener 3000
describe_listener 3001
describe_listener 8083
describe_listener 3003
describe_listener 9090
if [[ "$MODE" == "local-chain" ]]; then
  describe_listener 8000
fi

print_header "Endpoints"
check_http "frontend" "http://localhost:3000"
check_http "backend-health" "http://localhost:3001/health"
check_http "backend-swagger" "http://localhost:3001/docs"
check_http "mobile-web" "http://localhost:8083"
check_http "grafana" "http://localhost:3003"
check_http "prometheus-health" "http://localhost:9090/-/healthy"

if [[ "$MODE" == "local-chain" ]]; then
  check_http "quickstart-health" "http://localhost:8000/health"
  check_http "soroban-rpc-health" "http://localhost:8000/rpc" "POST" '{"jsonrpc":"2.0","id":1,"method":"getHealth"}'
fi

rm -f /tmp/stellaro_status_body.txt
