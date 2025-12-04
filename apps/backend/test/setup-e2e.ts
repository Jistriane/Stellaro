import 'reflect-metadata';
import 'dotenv/config';
import axios from 'axios';

// Increase default Jest timeout for slower Nest boot in CI
jest.setTimeout(20000);

beforeAll(async () => {
  process.env.NODE_ENV = process.env.NODE_ENV || 'test';
  process.env.AGENT_SERVICE_URL = process.env.AGENT_SERVICE_URL || 'http://localhost:8000';
  // Força modo STUB para PIX nos testes
  process.env.PIX_MODE = 'stub';
  // Desabilita ZK verificador on-chain para evitar chamadas RPC
  if (process.env.ZK_VERIFIER_CONTRACT_ID) delete process.env.ZK_VERIFIER_CONTRACT_ID;
  // Ensure Redis fallback (no external connection attempts during tests)
  if (typeof process.env.REDIS_URL !== 'undefined') delete process.env.REDIS_URL;
});

afterAll(async () => {
  // no-op: place for teardown hooks if needed
});
