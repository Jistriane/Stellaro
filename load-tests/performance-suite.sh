#!/bin/bash

# Performance Testing Suite
# Runs comprehensive performance and security tests

set -e

echo "🚀 Stellaro Performance Testing Suite"
echo "======================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
BACKEND_URL="${BACKEND_URL:-http://localhost:3000}"
FRONTEND_URL="${FRONTEND_URL:-http://localhost:3001}"

# Check if backend is running
echo "1️⃣  Checking backend status..."
if curl -s "$BACKEND_URL/api/health" > /dev/null; then
    echo -e "${GREEN}✅ Backend is running${NC}"
else
    echo -e "${RED}❌ Backend is not running. Start it first: cd apps/backend && npm run start:dev${NC}"
    exit 1
fi

# Check if frontend is running
echo "2️⃣  Checking frontend status..."
if curl -s "$FRONTEND_URL" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Frontend is running${NC}"
else
    echo -e "${YELLOW}⚠️  Frontend is not running. Some tests will be skipped.${NC}"
fi

# Test 1: Load Testing with k6
echo ""
echo "3️⃣  Running Load Tests (k6)..."
if command -v k6 &> /dev/null; then
    k6 run --vus 100 --duration 2m load-tests/k6-scenario.js
    echo -e "${GREEN}✅ Load tests completed${NC}"
else
    echo -e "${YELLOW}⚠️  k6 not installed. Run: load-tests/install-k6.sh${NC}"
fi

# Test 2: Security Audit with npm audit
echo ""
echo "4️⃣  Running Security Audit (npm)..."
cd ../apps/backend
if npm audit --production; then
    echo -e "${GREEN}✅ No security vulnerabilities found${NC}"
else
    echo -e "${YELLOW}⚠️  Security vulnerabilities detected. Review npm audit output.${NC}"
fi
cd ../../load-tests

# Test 3: Security Scan with Snyk (if available)
echo ""
echo "5️⃣  Running Security Scan (Snyk)..."
if command -v snyk &> /dev/null; then
    cd ../apps/backend
    snyk test || echo -e "${YELLOW}⚠️  Snyk found issues. Review output.${NC}"
    cd ../../load-tests
else
    echo -e "${YELLOW}⚠️  Snyk not installed. Install: npm install -g snyk${NC}"
fi

# Test 4: Lighthouse Performance (Frontend)
echo ""
echo "6️⃣  Running Lighthouse Performance Test..."
if command -v lighthouse &> /dev/null && curl -s "$FRONTEND_URL" > /dev/null 2>&1; then
    lighthouse "$FRONTEND_URL" \
        --output html \
        --output-path ./lighthouse-report.html \
        --chrome-flags="--headless" \
        --only-categories=performance,accessibility,best-practices,seo
    echo -e "${GREEN}✅ Lighthouse report generated: load-tests/lighthouse-report.html${NC}"
else
    echo -e "${YELLOW}⚠️  Lighthouse not available or frontend not running${NC}"
fi

# Test 5: API Response Time Benchmark
echo ""
echo "7️⃣  Running API Response Time Benchmark..."
echo "Endpoint | Avg Response Time"
echo "---------|------------------"

# Health endpoint
health_time=$(curl -o /dev/null -s -w '%{time_total}\n' "$BACKEND_URL/api/health")
echo "Health   | ${health_time}s"

# Prices endpoint
prices_time=$(curl -o /dev/null -s -w '%{time_total}\n' "$BACKEND_URL/api/reflector/prices/USDC" || echo "N/A")
echo "Prices   | ${prices_time}s"

# Summary
echo ""
echo "======================================"
echo -e "${GREEN}🎉 Performance Testing Complete!${NC}"
echo ""
echo "📊 Results Summary:"
echo "  - Load Test: Check k6 output above"
echo "  - Security: npm audit + snyk"
echo "  - Frontend: lighthouse-report.html"
echo "  - API Benchmark: See response times above"
echo ""
echo "📝 Next Steps:"
echo "  1. Review lighthouse-report.html for frontend optimization"
echo "  2. Check k6 metrics for API performance bottlenecks"
echo "  3. Address any security vulnerabilities"
echo "  4. Optimize slow endpoints (target: <500ms P95)"
