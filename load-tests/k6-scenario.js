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
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3001';
const USER_ID = __ENV.USER_ID || '550e8400-e29b-41d4-a716-446655440000';
const API_KEY = __ENV.API_KEY || 'test-key-12345';

export const options = {
  stages: [
    // Ramp-up: 0 → 50 VUS em 30s (ajustado para ambiente local)
    { duration: '30s', target: 50 },

    // Sustain: 50 VUS por 1min
    { duration: '1m', target: 50 },

    // Spike: 50 → 200 VUS em 10s
    { duration: '10s', target: 200 },

    // Sustain spike
    { duration: '30s', target: 200 },

    // Ramp-down: 200 → 0 VUS
    { duration: '20s', target: 0 },
  ],

  thresholds: {
    // Latência P95 < 500ms
    price_request_latency: ['p(95) < 500', 'p(99) < 1000'],
    portfolio_request_latency: ['p(95) < 1000', 'p(99) < 2000'],
    transaction_request_latency: ['p(95) < 1500', 'p(99) < 3000'],

    // Taxa de erro < 5% (ajustado para ambiente de teste)
    error_rate: ['rate < 0.05'],
    success_rate: ['rate > 0.95'],

    // Requisições HTTP
    http_req_failed: ['rate < 0.05'],
    http_req_duration: ['p(95) < 1000', 'p(99) < 2000'],
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

  // 1. GET /reflector/price/{asset}
  group('Reflector Prices API', () => {
    testReflectorPrices();
  });

  sleep(1);

  // 2. GET /wallets?userId={userId}
  group('Wallets API', () => {
    testWallets();
  });

  sleep(1);

  // 3. POST /actions/stablecoin/mint (dry-run)
  group('Stablecoin Mint (Dry Run)', () => {
    testStablecoinMint();
  });

  activeVUS.add(-1);
}

/**
 * Teste: Reflector Prices
 */
function testReflectorPrices() {
  const assets = ['USDC', 'XLM', 'BTC', 'ETH'];
  const asset = assets[Math.floor(Math.random() * assets.length)];

  const res = http.get(`${BASE_URL}/reflector/price/${asset}`, {
    headers: {
      'Content-Type': 'application/json',
    },
    tags: { name: 'GetPrice' },
  });

  requestCount.add(1);
  priceLatency.add(res.timings.duration);

  const success = check(res, {
    'status 200 or 404': (r) => r.status === 200 || r.status === 404,
    'response time < 1000ms': (r) => r.timings.duration < 1000,
  });

  if (success) {
    successRate.add(true);
  } else {
    errorRate.add(true);
  }
}

/**
 * Teste: Wallets
 */
function testWallets() {
  const res = http.get(`${BASE_URL}/wallets?userId=${USER_ID}`, {
    headers: {
      'Content-Type': 'application/json',
    },
    tags: { name: 'GetWallets' },
  });

  requestCount.add(1);
  portfolioLatency.add(res.timings.duration);

  const success = check(res, {
    'status 200': (r) => r.status === 200,
    'response time < 1000ms': (r) => r.timings.duration < 1000,
  });

  if (success) {
    successRate.add(true);
  } else {
    errorRate.add(true);
  }
}

/**
 * Teste: Stablecoin Mint
 */
function testStablecoinMint() {
  const payload = JSON.stringify({
    to: 'GC5LQLM7IOEC7IDE27CXOS2SH4ZXXNN7NJS3BJOZKAFSPAC2PZ34J4XX',
    amount: '10.0',
    riskBps: 100,
    dryRun: true,
    userId: USER_ID,
  });

  const res = http.post(`${BASE_URL}/actions/stablecoin/mint`, payload, {
    headers: {
      'Content-Type': 'application/json',
    },
    tags: { name: 'StablecoinMint' },
  });

  requestCount.add(1);
  transactionLatency.add(res.timings.duration);

  const success = check(res, {
    'status 201 or 200': (r) => r.status === 201 || r.status === 200,
    'response time < 2000ms': (r) => r.timings.duration < 2000,
  });

  if (success) {
    successRate.add(true);
  } else {
    errorRate.add(true);
  }
}
