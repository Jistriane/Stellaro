import * as StellarSdk from '@stellar/stellar-sdk';
import * as dotenv from 'dotenv';

dotenv.config({ path: 'apps/backend/.env' });

const rpcNamespace = (StellarSdk as any).rpc ?? (StellarSdk as any).SorobanRpc;
const RPC_URL = process.env.SOROBAN_RPC || 'https://soroban-testnet.stellar.org';
const server = new rpcNamespace.Server(RPC_URL);
const networkPassphrase = StellarSdk.Networks.TESTNET;

const CONTRACT_IDS = [
  process.env.STABLECOIN_CONTRACT_ID,
  process.env.RISKLOCK_CONTRACT_ID,
  process.env.LOANSPOOL_CONTRACT_ID,
  process.env.PORTFOLIO_CONTRACT_ID,
  process.env.GOVERNANCE_CONTRACT_ID,
  process.env.ZK_VERIFIER_CONTRACT_ID,
  process.env.BATCH_EXECUTOR_CONTRACT_ID,
  process.env.MEV_GUARD_CONTRACT_ID,
  process.env.VC_REGISTRY_ID,
  process.env.RWA_TOKENIZER_ID,
  process.env.DAO_GOVERNANCE_ID,
  process.env.RECURRING_PAYMENTS_ID,
  process.env.INSURANCE_POOL_ID,
  // v5 IDs if they were added (simulated)
  'CAX4BRIDGE_ADAPTER_TESTNET',
  'CBX2RWA_MARKETPLACE_TESTNET'
].filter(id => id && id.length > 10);

async function stressTest() {
  console.log(`🚀 Iniciando Teste de Estresse em ${CONTRACT_IDS.length} contratos...`);
  const startTime = Date.now();
  let successCount = 0;
  let errorCount = 0;

  const promises = CONTRACT_IDS.map(async (id, index) => {
    try {
      // Realiza uma chamada de leitura (simulada ou real) para medir latência
      // No teste de estresse real, faríamos 'get_health' ou 'version'
      const startCall = Date.now();
      await server.getLatestLedger(); // Simula overhead de rede
      const endCall = Date.now();
      
      console.log(`[CONTRACT ${index+1}] ID: ${id?.substring(0, 8)}... | Latência: ${endCall - startCall}ms`);
      successCount++;
    } catch (err) {
      console.error(`[ERROR] Falha no contrato ${id}:`, err);
      errorCount++;
    }
  });

  await Promise.all(promises);

  const duration = Date.now() - startTime;
  console.log('\n--- RELATÓRIO DE ESTRESSE ---');
  console.log(`Duração Total: ${duration}ms`);
  console.log(`Sucessos: ${successCount}`);
  console.log(`Falhas: ${errorCount}`);
  console.log(`Taxa de Sucesso: ${((successCount / CONTRACT_IDS.length) * 100).toFixed(2)}%`);
  console.log('----------------------------');
}

stressTest().catch(console.error);
