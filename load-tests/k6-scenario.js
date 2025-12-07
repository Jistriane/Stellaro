#!/usr/bin/env node

/**
 * Load Testing Script - k6
 * Testa performance da API Stellaro com 10k usuarios
 * 
 * Executar:
 *   k6 run load-tests/k6-scenario.js
 *   k6 run --vus 1000 --duration 5m load-tests/k6-scenario.js
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Trend, Rate, Gauge, Counter } from 'k6/metrics';

// Métricas customizadas
const priceLatency = new Trend('price_request_latency');
const portfolioLatency = new Trend('portfolio_request_latency');
const transactionLatency = new Trend('transaction_request_latency');

const errorRate = new Rate('error_rate');
const successRate = new Rate('success_rate');

const activeVUS = new Gauge('active_vus');
const requestCount = new Counter('total_requests');

// Configuração
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const USER_ID = __ENV.USER_ID || '550e8400-e29b-41d4-a716-446655440000';
const API_KEY = __ENV.API_KEY || 'test-key-12345';

export const options = {
  stages: [
    // Ramp-up: 0 → 100 VUS em 30s
    { duration: '30s', target: 100 },
    
    // Sustain: 100 VUS por 2min
    { duration: '2m', target: 100 },
    
    // Spike: 100 → 500 VUS em 10s
    { duration: '10s', target: 500 },
    
    // Sustain spike
    { duration: '1m', target: 500 },
    
    // Ramp-down: 500 → 0 VUS
    { duration: '30s', target: 0 },
  ],
  
  thresholds: {
    // Latência P95 < 500ms
    'price_request_latency': ['p(95) < 500', 'p(99) < 1000'],
    'portfolio_request_latency': ['p(95) < 1000', 'p(99) < 2000'],
    'transaction_request_latency': ['p(95) < 1500', 'p(99) < 3000'],
    
    // Taxa de erro < 1%
    'error_rate': ['rate < 0.01'],
    'success_rate': ['rate > 0.99'],
    
    // Requisições HTTP
    'http_req_failed': ['rate < 0.01'],
    'http_req_duration': ['p(95) < 1000', 'p(99) < 2000'],
  },
};

/**
 * Setup: Executado 1x antes dos testes
 */
export function setup() {
  console.log('🚀 Iniciando testes de carga...');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`User ID: ${USER_ID}`);
  
  return { 
    startTime: Date.now(),
  };
}

/**
 * VU: Executado por cada usuário virtual (pode ser paralelo)
 */
export default function (data) {
  activeVUS.add(1);

  // 1. GET /api/prices/{asset}
  group('Reflector Prices API', () => {
    testReflectorPrices();
  });

  sleep(1);

  // 2. GET /api/portfolio
  group('Portfolio API', () => {
    testPortfolio();
  });

  sleep(1);

  // 3. GET /api/transactions
  group('Transactions API', () => {
    testTransactions();
  });

  sleep(2);

  // 4. POST /api/transactions (transação)
  group('Create Transaction', () => {
    testCreateTransaction();
  });

  activeVUS.add(-1);
}

/**
 * Teste: Reflector Prices
 */
function testReflectorPrices() {
  const assets = ['USDC', 'XLM', 'BTC', 'ETH'];
  const asset = assets[Math.floor(Math.random() * assets.length)];

  const res = http.get(
    `${BASE_URL}/api/reflector/prices/${asset}`,
    {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      tags: { name: 'GetPrice' },
    }
  );

  requestCount.add(1);
  priceLatency.add(res.timings.duration);

  const success = check(res, {
    'status 200': (r) => r.status === 200,
    'has price': (r) => r.json('price') !== undefined,
    'price > 0': (r) => parseFloat(r.json('price')) > 0,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });

  if (success) {
    successRate.add(true);
  } else {
    errorRate.add(true);
  }
}

/**
 * Teste: Portfolio
 */
function testPortfolio() {
  const res = http.get(
    `${BASE_URL}/api/portfolio?userId=${USER_ID}`,
    {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      tags: { name: 'GetPortfolio' },
    }
  );

  requestCount.add(1);
  portfolioLatency.add(res.timings.duration);

  const success = check(res, {
    'status 200': (r) => r.status === 200,
    'has assets': (r) => r.json('assets.length') > 0,
    'total value exists': (r) => r.json('totalValue') !== undefined,
    'response time < 1000ms': (r) => r.timings.duration < 1000,
  });

  if (success) {
    successRate.add(true);
  } else {
    errorRate.add(true);
  }
}

/**
 * Teste: Transactions
 */
function testTransactions() {
  const params = new URLSearchParams({
    userId: USER_ID,
    page: '1',
    limit: '10',
  });

  const res = http.get(
    `${BASE_URL}/api/transactions?${params}`,
    {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      tags: { name: 'GetTransactions' },
    }
  );

  requestCount.add(1);
  transactionLatency.add(res.timings.duration);

  const success = check(res, {
    'status 200': (r) => r.status === 200,
    'has transactions': (r) => Array.isArray(r.json('data')),
    'pagination info': (r) => r.json('pagination') !== undefined,
    'response time < 1500ms': (r) => r.timings.duration < 1500,
  });

  if (success) {
    successRate.add(true);
  } else {
    errorRate.add(true);
  }
}

/**
 * Teste: Create Transaction
 */
function testCreateTransaction() {
  const payload = JSON.stringify({
    userId: USER_ID,
    assetCode: 'USDC',
    amount: (Math.random() * 1000 + 10).toFixed(2),
    transactionType: 'BUY',
    description: `Load test transaction ${Date.now()}`,
  });

  const res = http.post(
    `${BASE_URL}/api/transactions`,
    payload,
    {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      tags: { name: 'CreateTransaction' },
    }
  );

  requestCount.add(1);
  transactionLatency.add(res.timings.duration);

  const success = check(res, {
    'status 201': (r) => r.status === 201 || r.status === 200,
    'has transaction id': (r) => r.json('id') !== undefined,
    'response time < 2000ms': (r) => r.timings.duration < 2000,
  });

  if (success) {
    successRate.add(true);
  } else {
    errorRate.add(true);
  }
}

/**
 * Teardown: Executado 1x após todos os testes
 */
export function teardown(data) {
  console.log('✅ Testes completos!');
  console.log(`Total de requisições: ${requestCount.value}`);
}
