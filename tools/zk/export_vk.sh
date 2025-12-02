#!/usr/bin/env bash
set -euo pipefail

# Exporta a Verification Key (VK) do Groth16 usando snarkjs e popula .env-dev
# Uso:
#   ./tools/zk/export_vk.sh <path_to_zkey> [output_prefix]
# Exemplo:
#   ./tools/zk/export_vk.sh circuits/circuit_final.zkey zk_credit

ZKEY_PATH=${1:-}
PREFIX=${2:-zk_verifier}

if [[ -z "${ZKEY_PATH}" ]]; then
  echo "Erro: informe o caminho do .zkey (ex.: circuits/circuit_final.zkey)" >&2
  exit 1
fi

if ! command -v snarkjs >/dev/null 2>&1; then
  echo "snarkjs não encontrado. Instale com: npm install -g snarkjs" >&2
  exit 1
fi

WORKDIR=$(dirname "${ZKEY_PATH}")
OUT_JSON="${WORKDIR}/${PREFIX}_verification_key.json"
OUT_COMPACT="${WORKDIR}/${PREFIX}_verification_key.compact.json"
OUT_BASE64="${WORKDIR}/${PREFIX}_verification_key.base64"

echo "Exportando VerificationKey JSON..."
snarkjs zkey export verificationkey "${ZKEY_PATH}" "${OUT_JSON}"

echo "Compactando JSON..."
jq -c . "${OUT_JSON}" > "${OUT_COMPACT}"

echo "Convertendo para base64..."
base64 -w 0 < "${OUT_COMPACT}" > "${OUT_BASE64}"

VK_BASE64=$(cat "${OUT_BASE64}")

ROOT_ENV="/home/jistriane/Documentos/Projetos/Stellaro/.env-dev"
BACK_ENV="/home/jistriane/Documentos/Projetos/Stellaro/apps/backend/.env-dev"

echo "Atualizando .env-dev (root e backend) com ZK_VERIFIER_VK..."
grep -q '^ZK_VERIFIER_VK=' "${ROOT_ENV}" && sed -i "s#^ZK_VERIFIER_VK=.*#ZK_VERIFIER_VK=${VK_BASE64}#" "${ROOT_ENV}" || echo "ZK_VERIFIER_VK=${VK_BASE64}" >> "${ROOT_ENV}"
grep -q '^ZK_VERIFIER_VK=' "${BACK_ENV}" && sed -i "s#^ZK_VERIFIER_VK=.*#ZK_VERIFIER_VK=${VK_BASE64}#" "${BACK_ENV}" || echo "ZK_VERIFIER_VK=${VK_BASE64}" >> "${BACK_ENV}"

echo "Feito. VK em base64 salva em: ${OUT_BASE64}"
echo "Verificando variáveis de ambiente para sugerir init..."

# Carrega variáveis se o arquivo existir, sem falhar se estiver incompleto
if [[ -f "${ROOT_ENV}" ]]; then
  set +u
  source "${ROOT_ENV}" || true
  set -u
fi

if [[ ${ZK_VERIFIER_CONTRACT_ID:-} != "" && ${STELLAR_PUBLIC_KEY:-} != "" ]]; then
  echo "Para inicializar o contrato, execute:"
  echo "  source ${ROOT_ENV} && soroban contract invoke --id $ZK_VERIFIER_CONTRACT_ID --source deploy --network testnet -- init --admin $STELLAR_PUBLIC_KEY --min-score 700 --vk $ZK_VERIFIER_VK"
else
  echo "Variáveis ausentes: defina 'ZK_VERIFIER_CONTRACT_ID' e 'STELLAR_PUBLIC_KEY' em ${ROOT_ENV} e então rode o comando de init."
fi
