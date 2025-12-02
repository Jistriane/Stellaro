#!/usr/bin/env tsx
/**
 * ZK Verifier Contract Initialization via Stellar SDK
 * 
 * This script initializes the ZK Verifier contract using @stellar/stellar-sdk
 * to bypass potential CLI type handling issues with BytesN<32>.
 * 
 * Usage:
 *   npm install --save-dev @stellar/stellar-sdk tsx
 *   chmod +x tools/zk/init_contract_sdk.ts
 *   npx tsx tools/zk/init_contract_sdk.ts <SECRET_KEY>
 * 
 * Environment Variables Required:
 *   - ZK_VERIFIER_CONTRACT_ID: Contract address (from .env-dev)
 * 
 * Arguments:
 *   - SECRET_KEY: Admin secret key (S... format)
 */

import * as StellarSdk from '@stellar/stellar-sdk';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables from .env-dev
const envPath = path.resolve(__dirname, '../../.env-dev');
console.log(`📂 Loading environment from: ${envPath}\n`);

if (!fs.existsSync(envPath)) {
  console.error(`❌ .env-dev file not found at: ${envPath}`);
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf-8');
const envVars: Record<string, string> = {};

envContent.split('\n').forEach(line => {
  const trimmed = line.trim();
  // Skip comments and empty lines
  if (trimmed.startsWith('#') || !trimmed) return;
  
  const match = trimmed.match(/^([A-Z_][A-Z0-9_]*)=(.+)$/);
  if (match) {
    const key = match[1];
    let value = match[2];
    // Remove quotes if present
    if ((value.startsWith('"') && value.endsWith('"')) || 
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    envVars[key] = value;
  }
});

const CONTRACT_ID = envVars['ZK_VERIFIER_CONTRACT_ID'];
const SECRET_KEY = process.argv[2]; // Get from command line argument
const RPC_URL = 'https://soroban-testnet.stellar.org';
const NETWORK_PASSPHRASE = StellarSdk.Networks.TESTNET;

console.log(`Loaded ${Object.keys(envVars).length} environment variables\n`);

if (!CONTRACT_ID) {
  console.error('❌ Missing ZK_VERIFIER_CONTRACT_ID in .env-dev');
  process.exit(1);
}

if (!SECRET_KEY) {
  console.error('❌ Missing SECRET_KEY argument');
  console.error('\nUsage: npx tsx tools/zk/init_contract_sdk.ts <SECRET_KEY>');
  console.error('\nYou can get the secret key from:');
  console.error('  stellar keys show deploy --network testnet');
  process.exit(1);
}

async function initContract() {
  try {
    console.log('🔧 Initializing ZK Verifier Contract via Stellar SDK...\n');
    
    // Setup
    const server = new StellarSdk.rpc.Server(RPC_URL);
    const sourceKeypair = StellarSdk.Keypair.fromSecret(SECRET_KEY);
    const adminAddress = sourceKeypair.publicKey();
    
    console.log(`📍 Contract: ${CONTRACT_ID}`);
    console.log(`👤 Admin: ${adminAddress}`);
    console.log(`🌐 Network: Testnet (${RPC_URL})\n`);
    
    // Prepare verification key (32 bytes of 0x01 for testing)
    const verificationKey = Buffer.alloc(32, 0x01);
    const minScore = 700;
    
    console.log(`🔑 Verification Key (hex): ${verificationKey.toString('hex')}`);
    console.log(`📊 Min Score: ${minScore}\n`);
    
    // Load source account
    const sourceAccount = await server.getAccount(adminAddress);
    console.log('✅ Source account loaded\n');
    
    // Build contract call
    const contract = new StellarSdk.Contract(CONTRACT_ID);
    
    // Create XDR values for parameters
    const adminScVal = new StellarSdk.Address(adminAddress).toScVal();
    const vkScVal = StellarSdk.xdr.ScVal.scvBytes(verificationKey);
    const minScoreScVal = StellarSdk.nativeToScVal(minScore, { type: 'u32' });
    
    // Build transaction
    let transaction = new StellarSdk.TransactionBuilder(sourceAccount, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(
        contract.call('init', adminScVal, vkScVal, minScoreScVal)
      )
      .setTimeout(30)
      .build();
    
    console.log('📦 Transaction built, simulating...');
    
    // Simulate transaction
    const simulationResponse = await server.simulateTransaction(transaction);
    
    if (StellarSdk.rpc.Api.isSimulationError(simulationResponse)) {
      console.error('❌ Simulation failed:');
      console.error(JSON.stringify(simulationResponse, null, 2));
      process.exit(1);
    }
    
    console.log('✅ Simulation successful\n');
    
    // Prepare transaction from simulation
    transaction = StellarSdk.rpc.assembleTransaction(
      transaction,
      simulationResponse
    ).build();
    
    // Sign transaction
    transaction.sign(sourceKeypair);
    console.log('✍️  Transaction signed\n');
    
    // Submit transaction
    console.log('📤 Submitting transaction...');
    const sendResponse = await server.sendTransaction(transaction);
    
    if (sendResponse.status !== 'PENDING') {
      console.error('❌ Transaction submission failed:');
      console.error(JSON.stringify(sendResponse, null, 2));
      process.exit(1);
    }
    
    console.log(`✅ Transaction submitted: ${sendResponse.hash}\n`);
    
    // Poll for result
    console.log('⏳ Waiting for confirmation...');
    let getResponse = await server.getTransaction(sendResponse.hash);
    
    while (getResponse.status === 'NOT_FOUND') {
      await new Promise(resolve => setTimeout(resolve, 1000));
      getResponse = await server.getTransaction(sendResponse.hash);
    }
    
    if (getResponse.status === 'SUCCESS') {
      console.log('\n✅ Contract initialized successfully!\n');
      console.log(`🔗 Transaction: ${sendResponse.hash}`);
      console.log(`🔍 Explorer: https://stellar.expert/explorer/testnet/tx/${sendResponse.hash}`);
      
      // Verify initialization by calling get_score
      console.log('\n🔍 Verifying initialization...');
      const getScoreContract = new StellarSdk.Contract(CONTRACT_ID);
      const getScoreTx = new StellarSdk.TransactionBuilder(sourceAccount, {
        fee: StellarSdk.BASE_FEE,
        networkPassphrase: NETWORK_PASSPHRASE,
      })
        .addOperation(getScoreContract.call('get_score', adminScVal))
        .setTimeout(30)
        .build();
      
      const getScoreSimulation = await server.simulateTransaction(getScoreTx);
      
      if (!StellarSdk.rpc.Api.isSimulationError(getScoreSimulation)) {
        console.log('✅ Contract is responsive post-initialization');
      } else {
        console.log('⚠️  get_score returned expected None (no score yet)');
      }
      
      console.log('\n🎉 Initialization complete!');
      process.exit(0);
    } else {
      console.error('\n❌ Transaction failed:');
      console.error(JSON.stringify(getResponse, null, 2));
      process.exit(1);
    }
    
  } catch (error) {
    console.error('\n❌ Error during initialization:');
    console.error(error);
    process.exit(1);
  }
}

// Run
initContract();
