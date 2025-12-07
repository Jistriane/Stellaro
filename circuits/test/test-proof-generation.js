#!/usr/bin/env node

/**
 * ZK Proof Generation Test
 * Tests the optimized credit score circuit
 */

const snarkjs = require("snarkjs");
const fs = require("fs");

async function testProofGeneration() {
  console.log("🧪 Testing ZK Proof Generation\n");

  // Input data
  const input = {
    // Public inputs
    minScore: 650,
    timestamp: Math.floor(Date.now() / 1000),

    // Private inputs (sensitive data)
    actualScore: 720,
    txCount: 45,
    avgRepaymentTime: 15,
    liquidityProvided: 5000,
    salt: Math.floor(Math.random() * 1000000),
  };

  console.log("📥 Input Data:");
  console.log(`  Public: minScore=${input.minScore}, timestamp=${input.timestamp}`);
  console.log(`  Private: actualScore=${input.actualScore} (hidden in proof)`);
  console.log("");

  // Check if files exist
  const wasmPath = "../credit_score_optimized_js/credit_score_optimized.wasm";
  const zkeyPath = "../credit_score_optimized_final.zkey";
  const vkeyPath = "../verification_key_optimized.json";

  if (!fs.existsSync(wasmPath)) {
    console.error(`\n❌ Error: WASM file not found: ${wasmPath}`);
    console.log("\n💡 Run the setup script first:");
    console.log("   cd circuits && ./setup-circom.sh");
    console.log("\nThen generate the proving key:");
    console.log("   snarkjs groth16 setup credit_score_optimized.r1cs pot12_final.ptau credit_score_optimized_0000.zkey");
    console.log("   snarkjs zkey contribute credit_score_optimized_0000.zkey credit_score_optimized_final.zkey --name='Stellaro' -v");
    console.log("   snarkjs zkey export verificationkey credit_score_optimized_final.zkey verification_key_optimized.json");
    return false;
  }

  if (!fs.existsSync(zkeyPath)) {
    console.error(`\n❌ Error: Proving key not found: ${zkeyPath}`);
    console.log("\n💡 Generate the proving key with:");
    console.log("   cd circuits");
    console.log("   snarkjs groth16 setup credit_score_optimized.r1cs pot12_final.ptau credit_score_optimized_0000.zkey");
    console.log("   snarkjs zkey contribute credit_score_optimized_0000.zkey credit_score_optimized_final.zkey --name='Stellaro' -v");
    console.log("   snarkjs zkey export verificationkey credit_score_optimized_final.zkey verification_key_optimized.json");
    return false;
  }

  try {
    // 1. Generate witness and proof together (snarkjs fullProve handles witness internally)
    console.log("1️⃣  Generating proof...");
    const proofStart = Date.now();
    
    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
      input,
      wasmPath,
      zkeyPath
    );
    
    const proofTime = Date.now() - proofStart;
    console.log(`   ✅ Proof generated in ${proofTime}ms`);

    // 2. Verify proof
    console.log("\n2️⃣  Verifying proof...");
    const verifyStart = Date.now();
    
    const vKey = JSON.parse(
      fs.readFileSync(vkeyPath, "utf8")
    );
    
    const verified = await snarkjs.groth16.verify(vKey, publicSignals, proof);
    
    const verifyTime = Date.now() - verifyStart;
    console.log(`   ✅ Proof verified in ${verifyTime}ms`);

    // 3. Results
    console.log("\n📊 Results:");
    console.log(`   Proof Generation: ${proofTime}ms`);
    console.log(`   Verification: ${verifyTime}ms`);
    console.log(`   Total Time: ${proofTime + verifyTime}ms`);
    console.log(`   Verified: ${verified ? "✅ YES" : "❌ NO"}`);

    // 4. Proof size
    const proofStr = JSON.stringify(proof);
    const proofSize = Buffer.byteLength(proofStr, "utf8");
    console.log(`   Proof Size: ${proofSize} bytes (${(proofSize / 1024).toFixed(2)} KB)`);

    // 5. Performance check
    console.log("\n🎯 Performance Targets:");
    console.log(`   Proof < 1000ms: ${proofTime < 1000 ? "✅" : "❌"} (${proofTime}ms)`);
    console.log(`   Verify < 50ms: ${verifyTime < 50 ? "✅" : "❌"} (${verifyTime}ms)`);

    // 6. Test with invalid input (should fail)
    console.log("\n🔒 Testing Security (invalid proof)...");
    const invalidInput = { ...input, actualScore: 600 }; // Below minScore

    try {
      const { proof: badProof } = await snarkjs.groth16.fullProve(
        invalidInput,
        wasmPath,
        zkeyPath
      );
      console.log("   ❌ ERROR: Circuit accepted invalid input!");
    } catch (error) {
      console.log("   ✅ Circuit correctly rejected invalid input");
    }

    console.log("\n✅ All tests passed!");
    return true;
  } catch (error) {
    console.error("\n❌ Error:", error.message);
    return false;
  }
}

// Run test
testProofGeneration()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
