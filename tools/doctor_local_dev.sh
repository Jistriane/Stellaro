#!/bin/bash
# Consolidated Doctor for Stellaro Local Development
# Usage: ./tools/doctor_local_dev.sh [public-testnet|local-chain]

set -euo pipefail

MODE="${1:-public-testnet}"

if [[ "$MODE" != "public-testnet" && "$MODE" != "local-chain" ]]; then
  echo "Modo invalido: $MODE"
  echo "Use: ./tools/doctor_local_dev.sh [public-testnet|local-chain]"
  exit 1
fi

print_header() {
  echo
  echo "=== $1 ==="
}

print_header "Doctor Mode"
echo "$MODE"

print_header "Preflight"
set +e
bash tools/preflight_local_dev.sh "$MODE"
PRECHECK_EXIT_CODE=$?
set -e

print_header "Status"
bash tools/status_local_dev.sh "$MODE"

if [[ "$PRECHECK_EXIT_CODE" -ne 0 ]]; then
  print_header "Port Help"
  bash tools/port_help_local_dev.sh "$MODE"
  echo
  echo "Doctor result: attention required before automated stack boot."
  exit "$PRECHECK_EXIT_CODE"
fi

echo
echo "Doctor result: environment ready for automated stack boot."
