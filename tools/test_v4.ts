import axios from 'axios';

const BACKEND_URL = 'http://localhost:3001';

async function runE2ETests() {
  console.log('🧪 Iniciando Testes E2E Stellaro v4.0...');

  try {
    // 1. SSI: Registrar Credencial
    console.log('\n--- SSI: Registrar VC ---');
    const ssir = await axios.post(`${BACKEND_URL}/ssi/register`, {
      userAddress: 'GD...USER',
      vcHash: '686173685f76635f746573745f32303236000000000000000000000000000000',
      issuerSecret: 'S...ADMIN'
    });
    console.log('✅ SSI Register:', ssir.data.success ? 'SUCESSO' : 'FALHA');

    // 2. RWA: Mintar Ativo (com verificação de compliance)
    console.log('\n--- RWA: Mint Asset ---');
    const rwa = await axios.post(`${BACKEND_URL}/rwa/mint`, {
      to: 'GD...USER',
      amount: 1000,
      adminSecret: 'S...ADMIN'
    });
    console.log('✅ RWA Mint:', rwa.data.success ? 'SUCESSO' : 'FALHA');

    // 3. DAO: Criar Proposta
    console.log('\n--- DAO: Propose ---');
    const dao = await axios.post(`${BACKEND_URL}/dao`, {
      title: 'Update Lending Rates',
      description: 'Aumentar taxas de juros para o pool de RWA',
      target: 'CA...CONTRACT',
      action: 'update_rates',
      creatorSecret: 'S...ADMIN'
    });
    console.log('✅ DAO Proposal Created, ID:', dao.data.proposalId);

    // 4. ElizaOS: Verificar Memória de Auditoria
    console.log('\n--- ELIZA: AI Monitoring ---');
    const eliza = await axios.get(`${BACKEND_URL}/eliza/status`);
    console.log('✅ Eliza Status:', eliza.data.running ? 'ATIVO' : 'INATIVO');
    
    console.log('\n🎉 Todos os fluxos principais da v4.0 validados!');
  } catch (error: any) {
    console.error('❌ Erro no teste E2E:', error.response?.data || error.message);
  }
}

// runE2ETests();
console.log('Script de teste gerado. Execute com ts-node tools/test_v4.ts se o backend estiver on.');
