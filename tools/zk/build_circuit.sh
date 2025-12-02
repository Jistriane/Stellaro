#!/usr/bin/env bash
set -euo pipefail

# Compila circuito Circom, prepara Powers of Tau, gera zkey final e exporta VK
# Requer: circom, snarkjs, jq, node, base64

ROOT="/home/jistriane/Documentos/Projetos/Stellaro"
CIRCUIT_DIR="$ROOT/circuits"
CIRCUIT_NAME="credit_score"

if ! command -v circom >/dev/null 2>&1; then
  echo "circom não encontrado. Instale via: npm i -g circom" >&2
  exit 1
fi
if ! command -v snarkjs >/dev/null 2>&1; then
  echo "snarkjs não encontrado. Instale via: npm i -g snarkjs" >&2
  exit 1
fi

mkdir -p "$CIRCUIT_DIR"
cd "$CIRCUIT_DIR"

echo "Compilando circuito..."
circom "$CIRCUIT_NAME.circom" --r1cs --wasm --sym -o "$CIRCUIT_DIR"

echo "Preparando Powers of Tau..."
snarkjs powersoftau new bn128 12 pot12_0000.ptau -v
snarkjs powersoftau contribute pot12_0000.ptau pot12_0001.ptau --name="contrib1" -v <<< "random"
snarkjs powersoftau prepare phase2 pot12_0001.ptau pot12_final.ptau -v

echo "Gerando zkey..."
snarkjs groth16 setup "$CIRCUIT_NAME.r1cs" pot12_final.ptau "${CIRCUIT_NAME}_0000.zkey"
snarkjs zkey contribute "${CIRCUIT_NAME}_0000.zkey" "${CIRCUIT_NAME}_final.zkey" --name="contrib2" -v <<< "random2"

echo "Exportando VK..."
"$ROOT/tools/zk/export_vk.sh" "$CIRCUIT_DIR/${CIRCUIT_NAME}_final.zkey" "$CIRCUIT_NAME"

echo "Feito. VK atualizada no .env-dev."