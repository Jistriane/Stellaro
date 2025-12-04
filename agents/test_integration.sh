#!/bin/bash

# Script para testar integração completa da API de Agents
# Execute com: ./test_integration.sh

echo "🧪 Stellaro Multi-Agent API - Integration Tests"
echo "================================================"
echo ""

# Cores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

BASE_URL="http://localhost:8000"
FAILED=0
PASSED=0

# Função para testar endpoint
test_endpoint() {
  local name=$1
  local method=$2
  local endpoint=$3
  local data=$4
  
  echo -n "Testing ${name}... "
  
  if [ "$method" = "GET" ]; then
    response=$(curl -s -w "\n%{http_code}" "$BASE_URL$endpoint")
  else
    response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL$endpoint" \
      -H "Content-Type: application/json" \
      -d "$data")
  fi
  
  http_code=$(echo "$response" | tail -n1)
  body=$(echo "$response" | head -n-1)
  
  if [ "$http_code" = "200" ]; then
    echo -e "${GREEN}✓ PASSED${NC} (HTTP $http_code)"
    ((PASSED++))
  else
    echo -e "${RED}✗ FAILED${NC} (HTTP $http_code)"
    echo "Response: $body"
    ((FAILED++))
  fi
}

# Test 1: Health Check
echo "1. Health Endpoint"
test_endpoint "GET /health" "GET" "/health"
echo ""

# Test 2: Stellaro Risk Analysis
echo "2. Stellaro Agent - Risk Analysis"
test_endpoint "POST /agent/action (stellaro)" "POST" "/agent/action" \
  '{"agent":"stellaro","action":"analyze_risk","payload":{"user_address":"GCTESTUSER123"}}'
echo ""

# Test 3: Treasury Manager Optimization
echo "3. Treasury Manager - Yield Optimization"
test_endpoint "POST /agent/action (treasury)" "POST" "/agent/action" \
  '{"agent":"treasury_manager","action":"optimize_yield","payload":{"treasury_address":"GCTREASURY123"}}'
echo ""

# Test 4: Compliance Bot Check
echo "4. Compliance Bot - Transaction Check"
test_endpoint "POST /agent/action (compliance)" "POST" "/agent/action" \
  '{"agent":"compliance_bot","action":"check_compliance","payload":{"user_address":"GCUSER123","amount_usd":5000,"asset":"USDC"}}'
echo ""

# Test 5: Safe Optimization Workflow
echo "5. Workflow - Safe Optimization"
test_endpoint "POST /orchestrate/workflow (safe_optimization)" "POST" "/orchestrate/workflow" \
  '{"workflow":"safe_optimization","payload":{"treasury_address":"GCTREASURY123"}}'
echo ""

# Test 6: Transaction Compliance Workflow
echo "6. Workflow - Transaction Compliance"
test_endpoint "POST /orchestrate/workflow (transaction_compliance)" "POST" "/orchestrate/workflow" \
  '{"workflow":"transaction_compliance","payload":{"user_address":"GCUSER123","amount_usd":10000,"asset":"USDC"}}'
echo ""

# Test 7: Monitor & Mitigate Workflow
echo "7. Workflow - Monitor & Mitigate"
test_endpoint "POST /orchestrate/workflow (monitor_mitigate)" "POST" "/orchestrate/workflow" \
  '{"workflow":"monitor_mitigate","payload":{"user_address":"GCUSER123"}}'
echo ""

# Test 8: Convenience Endpoint - Treasury Optimize
echo "8. Convenience - Treasury Optimize"
test_endpoint "POST /treasury/optimize" "POST" "/treasury/optimize?treasury_address=GCTREASURY123"
echo ""

# Test 9: Convenience Endpoint - Transaction Check
echo "9. Convenience - Transaction Check"
test_endpoint "POST /transaction/check" "POST" "/transaction/check?user_address=GCUSER123&amount_usd=1000&asset=USDC"
echo ""

# Test 10: Convenience Endpoint - Risk Monitor
echo "10. Convenience - Risk Monitor"
test_endpoint "POST /risk/monitor" "POST" "/risk/monitor?user_address=GCUSER123"
echo ""

# Summary
echo "================================================"
echo "Test Summary:"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}✓ All tests passed!${NC}"
  exit 0
else
  echo -e "${RED}✗ Some tests failed${NC}"
  exit 1
fi
