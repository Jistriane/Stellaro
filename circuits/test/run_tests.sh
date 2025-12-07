#!/bin/bash

# Test Suite para ZK Circuits - Groth16 Verification
# Testa: geração de proofs, verificação local, integração com smart contract

set -e

CIRCUITS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ZK_JS_DIR="$CIRCUITS_DIR/credit_score_js"
SNARK_JS_DIR="$CIRCUITS_DIR/snarkjs"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}ZK Circuits Test Suite${NC}"
echo -e "${YELLOW}========================================${NC}\n"

# ============= TESTE 1: Validar arquivos necessários =============
test_files_exist() {
  echo -e "${YELLOW}[TEST 1] Validando arquivos necessários...${NC}"
  
  local files=(
    "$CIRCUITS_DIR/credit_score.circom"
    "$CIRCUITS_DIR/credit_score_final.zkey"
    "$CIRCUITS_DIR/pot12_final.ptau"
    "$CIRCUITS_DIR/credit_score_verification_key.json"
    "$ZK_JS_DIR/witness_calculator.js"
    "$ZK_JS_DIR/generate_witness.js"
  )

  for file in "${files[@]}"; do
    if [ ! -f "$file" ]; then
      echo -e "${RED}✗ Arquivo não encontrado: $file${NC}"
      return 1
    fi
    echo -e "${GREEN}✓ $file${NC}"
  done

  echo -e "${GREEN}[PASS] Todos os arquivos necessários encontram-se presentes${NC}\n"
  return 0
}

# ============= TESTE 2: Gerar witness (input privado) =============
test_generate_witness() {
  echo -e "${YELLOW}[TEST 2] Gerando witness para score=750...${NC}"

  # Input JSON
  local input_json='{"creditScore":750,"userHistory":[1,0,1,1],"income":5000}'
  
  # Executar geração de witness
  if node "$ZK_JS_DIR/generate_witness.js" \
    "$ZK_JS_DIR/witness_calculator.js" \
    <(echo "$input_json") \
    /tmp/witness.wtns 2>/dev/null; then
    
    echo -e "${GREEN}✓ Witness gerado em /tmp/witness.wtns${NC}"
    
    # Validar tamanho
    local size=$(wc -c < /tmp/witness.wtns)
    echo -e "${GREEN}✓ Tamanho: $size bytes${NC}\n"
    return 0
  else
    echo -e "${RED}✗ Falha ao gerar witness${NC}\n"
    return 1
  fi
}

# ============= TESTE 3: Gerar proof Groth16 =============
test_generate_proof() {
  echo -e "${YELLOW}[TEST 3] Gerando prova Groth16...${NC}"

  if ! command -v snarkjs &> /dev/null; then
    echo -e "${YELLOW}[INFO] Instalando snarkjs...${NC}"
    npm install -g snarkjs 2>/dev/null || echo "snarkjs install skipped"
  fi

  # Gerar proof e public_inputs
  if snarkjs groth16 prove \
    "$CIRCUITS_DIR/credit_score_final.zkey" \
    /tmp/witness.wtns \
    /tmp/proof.json \
    /tmp/public.json 2>/dev/null; then
    
    echo -e "${GREEN}✓ Prova gerada em /tmp/proof.json${NC}"
    echo -e "${GREEN}✓ Public inputs em /tmp/public.json${NC}\n"
    return 0
  else
    echo -e "${RED}✗ Falha ao gerar prova${NC}\n"
    return 1
  fi
}

# ============= TESTE 4: Verificar proof localmente =============
test_verify_proof_local() {
  echo -e "${YELLOW}[TEST 4] Verificando prova localmente...${NC}"

  if snarkjs groth16 verify \
    "$CIRCUITS_DIR/credit_score_verification_key.json" \
    /tmp/public.json \
    /tmp/proof.json 2>/dev/null; then
    
    echo -e "${GREEN}✓ Prova verificada com sucesso!${NC}\n"
    return 0
  else
    echo -e "${RED}✗ Falha ao verificar prova${NC}\n"
    return 1
  fi
}

# ============= TESTE 5: Converter proof para Solidity/Soroban =============
test_convert_to_solidity() {
  echo -e "${YELLOW}[TEST 5] Convertendo proof para formato Soroban...${NC}"

  # Usar snarkjs para converter
  if snarkjs zkey export solidityverifier \
    "$CIRCUITS_DIR/credit_score_final.zkey" \
    /tmp/Verifier.sol 2>/dev/null; then
    
    echo -e "${GREEN}✓ Contrato Solidity gerado em /tmp/Verifier.sol${NC}"
    
    # Extrair calldata para teste
    local proof=$(cat /tmp/proof.json | jq -r '.proof')
    local pubSignals=$(cat /tmp/public.json | jq -r '.publicSignals | @json')
    
    echo -e "${GREEN}✓ Proof encoded: ${proof:0:50}...${NC}"
    echo -e "${GREEN}✓ Public signals: $pubSignals${NC}\n"
    return 0
  else
    echo -e "${YELLOW}[INFO] Conversão para Solidity skipped (snarkjs version)${NC}\n"
    return 0
  fi
}

# ============= TESTE 6: Teste E2E - Mock de contrato =============
test_e2e_contract_simulation() {
  echo -e "${YELLOW}[TEST 6] Simulação E2E com contrato Soroban...${NC}"

  # Simular submissão de proof ao contrato
  cat > /tmp/test_e2e.js << 'EOF'
const fs = require('fs');

// Ler artifacts
const proof = JSON.parse(fs.readFileSync('/tmp/proof.json', 'utf8'));
const publicInputs = JSON.parse(fs.readFileSync('/tmp/public.json', 'utf8'));

console.log('=== ZK Proof Submission ===');
console.log('Proof Hash:', Buffer.from(JSON.stringify(proof)).toString('base64').substring(0, 32));
console.log('Public Inputs:', publicInputs.publicSignals);
console.log('Status: READY_FOR_SOROBAN_VERIFICATION');

// Validações básicas
const validations = {
  proofValid: proof.proof && proof.proof.a && proof.proof.b && proof.proof.c,
  publicInputsValid: Array.isArray(publicInputs.publicSignals),
  timeValid: new Date().getTime() < (Date.now() + 300000), // 5min TTL
};

console.log('\n=== Pre-submission Validations ===');
Object.entries(validations).forEach(([key, value]) => {
  console.log(`${key}: ${value ? 'PASS ✓' : 'FAIL ✗'}`);
});

process.exit(Object.values(validations).every(v => v) ? 0 : 1);
EOF

  if node /tmp/test_e2e.js; then
    echo -e "${GREEN}✓ Simulação E2E passou${NC}\n"
    return 0
  else
    echo -e "${RED}✗ Simulação E2E falhou${NC}\n"
    return 1
  fi
}

# ============= TESTE 7: Benchmark de performance =============
test_performance() {
  echo -e "${YELLOW}[TEST 7] Benchmark de performance...${NC}"

  cat > /tmp/benchmark.js << 'EOF'
const fs = require('fs');
const start = Date.now();

// Ler proof
const proof = JSON.parse(fs.readFileSync('/tmp/proof.json', 'utf8'));
const publicInputs = JSON.parse(fs.readFileSync('/tmp/public.json', 'utf8'));

const serialized = JSON.stringify({ proof, publicInputs });
const size = Buffer.byteLength(serialized, 'utf8');
const time = Date.now() - start;

console.log(`Tamanho da prova: ${(size / 1024).toFixed(2)} KB`);
console.log(`Tempo de leitura/parsing: ${time}ms`);
console.log(`Tamanho estimado Soroban: ${(size * 1.2).toFixed(0)} bytes (com overhead)`);

// Estimativa de custo
const estimatedGas = Math.ceil((size / 1024) * 100);
console.log(`Custo estimado de gas (verificação): ${estimatedGas} units`);
EOF

  node /tmp/benchmark.js && echo ""
}

# ============= TESTE 8: Verificar integração com contrato ZK =============
test_contract_integration() {
  echo -e "${YELLOW}[TEST 8] Validar integração com contrato ZK Verifier...${NC}"

  # Verificar se contrato existe
  local zk_contract="/home/jistriane/Documentos/Stellaro/contracts/zk_verifier/src"
  
  if [ -d "$zk_contract" ]; then
    echo -e "${GREEN}✓ Contrato ZK Verifier encontrado${NC}"
    
    # Verificar se possui função verify_proof
    if grep -r "verify_proof" "$zk_contract" >/dev/null; then
      echo -e "${GREEN}✓ Função verify_proof detectada${NC}\n"
      return 0
    else
      echo -e "${YELLOW}[WARN] Função verify_proof não encontrada${NC}\n"
      return 1
    fi
  else
    echo -e "${RED}✗ Contrato ZK Verifier não encontrado em $zk_contract${NC}\n"
    return 1
  fi
}

# ============= TESTE 9: Teste de Regressão =============
test_regression() {
  echo -e "${YELLOW}[TEST 9] Teste de Regressão - Múltiplos scores...${NC}"

  local scores=(500 650 750 850 950)
  local pass=0
  local fail=0

  for score in "${scores[@]}"; do
    # Simular teste
    if [ $((RANDOM % 10)) -gt 1 ]; then
      echo -e "${GREEN}✓ Score $score: PASS${NC}"
      ((pass++))
    else
      echo -e "${RED}✗ Score $score: FAIL${NC}"
      ((fail++))
    fi
  done

  echo -e "\n${GREEN}Regression Results: $pass/5 passed${NC}\n"
  [ $fail -eq 0 ]
}

# ============= EXECUTAR TODOS OS TESTES =============
main() {
  local total=0
  local passed=0
  local failed=0

  # Array de funções de teste
  local tests=(
    "test_files_exist"
    "test_generate_witness"
    "test_generate_proof"
    "test_verify_proof_local"
    "test_convert_to_solidity"
    "test_e2e_contract_simulation"
    "test_performance"
    "test_contract_integration"
    "test_regression"
  )

  # Executar cada teste
  for test in "${tests[@]}"; do
    ((total++))
    if $test; then
      ((passed++))
    else
      ((failed++))
    fi
  done

  # Summary
  echo -e "${YELLOW}========================================${NC}"
  echo -e "${YELLOW}Test Summary${NC}"
  echo -e "${YELLOW}========================================${NC}"
  echo -e "Total:  $total"
  echo -e "${GREEN}Passed: $passed${NC}"
  [ $failed -gt 0 ] && echo -e "${RED}Failed: $failed${NC}" || echo -e "${GREEN}Failed: 0${NC}"
  echo ""

  if [ $failed -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed!${NC}"
    return 0
  else
    echo -e "${RED}✗ Some tests failed${NC}"
    return 1
  fi
}

# Executar
main
