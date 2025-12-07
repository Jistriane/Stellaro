# Performance Testing Guide

## Overview

This guide covers comprehensive performance and load testing for the Stellaro platform.

## Prerequisites

### Install k6 (Load Testing)

```bash
cd load-tests
./install-k6.sh
```

### Install Lighthouse (Frontend Performance)

```bash
npm install -g lighthouse
```

### Install Snyk (Security Scanning)

```bash
npm install -g snyk
snyk auth  # Authenticate with your account
```

## Test Suite Components

### 1. Load Testing (k6)

**File:** `k6-scenario.js`

Tests API performance under load with realistic user scenarios.

**Scenarios:**
- Ramp-up: 0 → 100 VUs in 30s
- Sustained load: 100 VUs for 2 minutes
- Spike test: 100 → 500 VUs in 10s
- Spike sustained: 500 VUs for 1 minute
- Ramp-down: 500 → 0 VUs

**Endpoints Tested:**
1. GET `/api/reflector/prices/{asset}` - Price data
2. GET `/api/portfolio?userId={id}` - Portfolio data
3. GET `/api/transactions` - Transaction history
4. POST `/api/transactions` - Create transaction

**Thresholds:**
- P95 latency < 500ms (prices)
- P95 latency < 1000ms (portfolio)
- P95 latency < 1500ms (transactions)
- Error rate < 1%
- Success rate > 99%

**Run:**
```bash
# Default scenario (100 VUs)
k6 run load-tests/k6-scenario.js

# Custom configuration
k6 run --vus 200 --duration 5m load-tests/k6-scenario.js

# With custom backend URL
BASE_URL=https://api.stellaro.io k6 run load-tests/k6-scenario.js
```

**Output:**
```
✓ status 200
✓ has price
✓ price > 0
✓ response time < 500ms

checks.........................: 99.95% ✓ 4000 ✗ 2
data_received..................: 1.2 MB 20 kB/s
data_sent......................: 800 KB 13 kB/s
http_req_duration..............: avg=245ms min=100ms med=220ms max=980ms p(95)=450ms p(99)=750ms
http_req_failed................: 0.05%  ✓ 2 ✗ 3998
iterations.....................: 1000   16.67/s
price_request_latency..........: avg=250ms min=110ms med=225ms max=900ms p(95)=480ms
```

### 2. Security Audit

#### npm audit

Tests for known vulnerabilities in dependencies.

```bash
cd apps/backend
npm audit --production
```

#### Snyk

Advanced security scanning with remediation suggestions.

```bash
cd apps/backend
snyk test
snyk monitor  # Continuous monitoring
```

**Example Output:**
```
✓ Tested 350 dependencies for known issues, no vulnerable paths found.

Organization: stellaro
Package manager: npm
```

### 3. Frontend Performance (Lighthouse)

Tests frontend performance, accessibility, SEO, and best practices.

```bash
lighthouse http://localhost:3001 \
  --output html \
  --output-path ./lighthouse-report.html \
  --chrome-flags="--headless"
```

**Metrics:**
- Performance: >90 (target)
- Accessibility: >95 (target)
- Best Practices: >90 (target)
- SEO: >90 (target)

**Key Performance Metrics:**
- First Contentful Paint (FCP): <1.8s
- Largest Contentful Paint (LCP): <2.5s
- Total Blocking Time (TBT): <300ms
- Cumulative Layout Shift (CLS): <0.1
- Speed Index: <3.4s

### 4. API Response Time Benchmark

Simple curl-based benchmarks for quick API health checks.

```bash
# Health endpoint
curl -o /dev/null -s -w '%{time_total}\n' http://localhost:3000/api/health

# Prices endpoint
curl -o /dev/null -s -w '%{time_total}\n' http://localhost:3000/api/reflector/prices/USDC

# Portfolio endpoint
curl -o /dev/null -s -w '%{time_total}\n' "http://localhost:3000/api/portfolio?userId=550e8400-e29b-41d4-a716-446655440000"
```

## Complete Test Suite

Run all tests with a single script:

```bash
cd load-tests
./performance-suite.sh
```

This will:
1. ✅ Check backend status
2. ✅ Check frontend status
3. 🔥 Run k6 load tests (100 VUs, 2 minutes)
4. 🔒 Run npm audit (security)
5. 🔒 Run Snyk scan (if available)
6. 📊 Run Lighthouse (frontend performance)
7. ⚡ Run API response benchmarks

**Example Output:**
```
🚀 Stellaro Performance Testing Suite
======================================

1️⃣  Checking backend status...
✅ Backend is running

2️⃣  Checking frontend status...
✅ Frontend is running

3️⃣  Running Load Tests (k6)...
[... k6 output ...]
✅ Load tests completed

4️⃣  Running Security Audit (npm)...
✅ No security vulnerabilities found

5️⃣  Running Security Scan (Snyk)...
✅ No issues found

6️⃣  Running Lighthouse Performance Test...
✅ Lighthouse report generated: load-tests/lighthouse-report.html

7️⃣  Running API Response Time Benchmark...
Endpoint | Avg Response Time
---------|------------------
Health   | 0.012s
Prices   | 0.145s

======================================
🎉 Performance Testing Complete!

📊 Results Summary:
  - Load Test: ✅ All thresholds passed
  - Security: ✅ No vulnerabilities
  - Frontend: ✅ Performance score: 95
  - API Benchmark: ✅ All endpoints < 500ms
```

## Performance Targets

### Backend API

| Endpoint | P50 | P95 | P99 |
|----------|-----|-----|-----|
| /api/health | <50ms | <100ms | <200ms |
| /api/reflector/prices | <200ms | <500ms | <1000ms |
| /api/portfolio | <400ms | <1000ms | <2000ms |
| /api/transactions (GET) | <500ms | <1500ms | <3000ms |
| /api/transactions (POST) | <600ms | <2000ms | <4000ms |

### Frontend

| Metric | Target | Critical |
|--------|--------|----------|
| FCP | <1.8s | <3.0s |
| LCP | <2.5s | <4.0s |
| TBT | <300ms | <600ms |
| CLS | <0.1 | <0.25 |
| Performance Score | >90 | >70 |

### Infrastructure

| Metric | Target |
|--------|--------|
| Error Rate | <0.1% |
| Success Rate | >99.9% |
| Uptime | >99.5% |
| Max VUs | 500+ concurrent users |

## Troubleshooting

### High Latency (P95 > 500ms)

1. Check database query performance
2. Enable Redis caching for frequent queries
3. Review N+1 query patterns
4. Optimize Prisma queries with `include` instead of multiple queries

### High Error Rate (>1%)

1. Check logs: `docker logs stellaro-backend`
2. Review failed requests in k6 output
3. Check database connection pool size
4. Verify API rate limits

### Low Lighthouse Score (<90)

1. Enable compression (gzip/brotli)
2. Optimize images (WebP format, lazy loading)
3. Minimize JavaScript bundles
4. Enable browser caching
5. Use CDN for static assets

### Memory Leaks

1. Run extended load test: `k6 run --duration 30m`
2. Monitor memory: `docker stats stellaro-backend`
3. Check for unclosed connections/streams
4. Review event listener cleanup

## Continuous Monitoring

### Production Monitoring (Grafana)

```bash
# Access Grafana dashboard
http://localhost:3002

# Default credentials
Username: admin
Password: admin
```

**Key Dashboards:**
- API Response Times
- Error Rates
- Database Performance
- System Resources (CPU, Memory, Disk)

### Alerts

Set up alerts in Grafana for:
- ⚠️ P95 latency > 1000ms
- 🚨 Error rate > 1%
- 🚨 CPU usage > 80%
- 🚨 Memory usage > 90%
- 🚨 Disk usage > 85%

## Next Steps

1. ✅ Run initial baseline: `./performance-suite.sh`
2. ⏳ Identify bottlenecks from k6 output
3. ⏳ Optimize slow endpoints
4. ⏳ Re-run tests to verify improvements
5. ⏳ Set up continuous monitoring in production
6. ⏳ Configure alerts for critical metrics

## References

- [k6 Documentation](https://k6.io/docs/)
- [Lighthouse Documentation](https://developers.google.com/web/tools/lighthouse)
- [Snyk Documentation](https://docs.snyk.io/)
- [Web Vitals](https://web.dev/vitals/)
- [NestJS Performance](https://docs.nestjs.com/techniques/performance)
