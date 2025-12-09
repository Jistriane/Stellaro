#![no_std]

//! ZK Credit Score Verifier - Groth16 Proof Verification
//! 
//! This contract verifies zero-knowledge proofs for credit scores using the Groth16 
//! proving system. It allows users to prove their creditworthiness without revealing 
//! their transaction history or personal financial data.
//! 
//! **IMPORTANT**: This is a STUB implementation for Week 2. The actual Groth16 verification
//! will be implemented in Week 3-4 with ElizaOS integration.
//! 
//! ## Architecture
//! 
//! 1. **Off-chain**: ElizaOS Stellaro (risk) generates ZK proofs using user's Stellar history
//! 2. **On-chain**: This contract verifies proofs and stores verified scores
//! 3. **Privacy**: Only the score (0-1000) is revealed, not underlying data
//! 
//! ## Security Model
//! 
//! - Proofs are time-limited (24h expiry)
//! - Each proof is single-use (nonce-based)
//! - Admin can revoke compromised verification keys
//! - Scores are stored with timestamp for decay calculation

use soroban_sdk::{contract, contractimpl, contracttype, contractevent, Address, BytesN, Env};

/// Verification key for Groth16 proofs (placeholder 32 bytes)
/// In production, this will be the actual Groth16 vkey serialized
pub type VerificationKey = BytesN<32>;

#[contractevent]
pub struct ProofVerifiedEvent {
    pub event: bool,
}

#[contractevent]
pub struct VkeyUpdatedEvent {
    pub event: bool,
}

#[contractevent]
pub struct PauseEvent {
    pub paused: bool,
}

/// ZK Proof data (placeholder 256 bytes)
/// In production, this will contain the actual Groth16 proof (alpha, beta, gamma, delta)
pub type Proof = BytesN<256>;

/// Public inputs for the ZK circuit
/// Format: [score, timestamp, user_id_hash, min_tx_count, ...]
pub type PublicInputs = BytesN<128>;

/// Unique nonce to prevent proof replay attacks
pub type ProofNonce = BytesN<16>;

#[derive(Clone)]
#[contracttype]
pub struct CreditScore {
    pub score: u32,           // 0-1000 score
    pub verified_at: u64,     // Timestamp of verification
    pub expires_at: u64,      // Expiry timestamp (24h)
    pub proof_nonce: ProofNonce, // Prevents replay
}

#[derive(Clone)]
#[contracttype]
enum DataKey {
    Admin,
    VerificationKey,
    Score(Address),          // User -> CreditScore
    UsedNonces(ProofNonce),  // Track used nonces
    MinScore,                // Minimum acceptable score (default 600)
    ProofExpiry,             // Proof validity period in seconds (default 86400)
    Paused,                  // Emergency pause
}

fn read_bool(env: &Env, key: &DataKey) -> bool {
    env.storage()
        .persistent()
        .get::<DataKey, bool>(key)
        .unwrap_or(false)
}

fn write_bool(env: &Env, key: &DataKey, val: bool) {
    env.storage().persistent().set(key, &val);
}

fn read_u32(env: &Env, key: &DataKey) -> u32 {
    env.storage()
        .persistent()
        .get::<DataKey, u32>(key)
        .unwrap_or(0)
}

fn write_u32(env: &Env, key: &DataKey, val: u32) {
    env.storage().persistent().set(key, &val);
}

fn read_u64(env: &Env, key: &DataKey) -> u64 {
    env.storage()
        .persistent()
        .get::<DataKey, u64>(key)
        .unwrap_or(0)
}

fn write_u64(env: &Env, key: &DataKey, val: u64) {
    env.storage().persistent().set(key, &val);
}

#[contract]
pub struct ZkVerifierContract;

#[contractimpl]
impl ZkVerifierContract {
    /// Initialize the ZK verifier with admin and verification key
    /// 
    /// # Arguments
    /// * `admin` - Admin address for emergency controls
    /// * `verification_key` - Groth16 verification key (public parameters)
    /// * `min_score` - Minimum acceptable credit score (0-1000)
    pub fn init(env: Env, admin: Address, verification_key: VerificationKey, min_score: u32) {
        if env.storage().persistent().has(&DataKey::Admin) {
            panic!("already initialized");
        }
        
        admin.require_auth();
        assert!(min_score <= 1000, "invalid min_score");
        
        env.storage().persistent().set(&DataKey::Admin, &admin);
        env.storage().persistent().set(&DataKey::VerificationKey, &verification_key);
        write_u32(&env, &DataKey::MinScore, min_score);
        write_u64(&env, &DataKey::ProofExpiry, 86400); // 24h default
        write_bool(&env, &DataKey::Paused, false);
    }

    /// Verify a ZK proof and store the credit score
    /// 
    /// # Arguments
    /// * `user` - User address claiming the credit score
    /// * `proof` - Groth16 proof (alpha, beta, gamma, delta)
    /// * `public_inputs` - Public inputs [score, timestamp, user_hash, ...]
    /// * `nonce` - Unique nonce to prevent replay attacks
    /// 
    /// # Returns
    /// * `bool` - True if proof is valid and score stored
    /// 
    /// # Panics
    /// * If contract is paused
    /// * If nonce already used
    /// * If proof verification fails
    /// * If score below minimum threshold
    pub fn verify_proof(
        env: Env,
        user: Address,
        proof: Proof,
        public_inputs: PublicInputs,
        nonce: ProofNonce,
    ) -> bool {
        user.require_auth();
        
        // Check if paused
        if read_bool(&env, &DataKey::Paused) {
            panic!("contract paused");
        }
        
        // Check nonce not used (prevent replay)
        if env.storage().persistent().has(&DataKey::UsedNonces(nonce.clone())) {
            panic!("nonce already used");
        }
        
        // Get verification key
        let vkey: VerificationKey = env
            .storage()
            .persistent()
            .get(&DataKey::VerificationKey)
            .expect("verification key not set");
        
        // STUB: Actual Groth16 verification will be implemented in Week 3-4
        // For now, we simulate verification by checking proof length and nonce uniqueness
        let is_valid = Self::verify_groth16(&env, &vkey, &proof, &public_inputs);
        
        if !is_valid {
            panic!("invalid proof");
        }
        
        // Extract score from public inputs (first 4 bytes as u32)
        let score = Self::extract_score(&env, &public_inputs);
        let min_score = read_u32(&env, &DataKey::MinScore);
        
        if score < min_score {
            panic!("score below minimum");
        }
        
        // Calculate expiry
        let now = env.ledger().timestamp();
        let expiry_duration = read_u64(&env, &DataKey::ProofExpiry);
        let expires_at = now + expiry_duration;
        
        // Store credit score
        let credit_score = CreditScore {
            score,
            verified_at: now,
            expires_at,
            proof_nonce: nonce.clone(),
        };
        
        env.storage().persistent().set(&DataKey::Score(user.clone()), &credit_score);
        
        // Mark nonce as used
        write_bool(&env, &DataKey::UsedNonces(nonce), true);
        
        // Emit event
        env.events().publish_event(&ProofVerifiedEvent { event: true });
        
        true
    }

    /// Get credit score for a user (if not expired)
    /// 
    /// # Returns
    /// * `Option<CreditScore>` - Score if exists and not expired, None otherwise
    pub fn get_score(env: Env, user: Address) -> Option<CreditScore> {
        let score_opt: Option<CreditScore> = env
            .storage()
            .persistent()
            .get(&DataKey::Score(user));
        
        match score_opt {
            Some(score) => {
                let now = env.ledger().timestamp();
                if now <= score.expires_at {
                    Some(score)
                } else {
                    None // Expired
                }
            }
            None => None,
        }
    }

    /// Check if user has valid credit score above minimum
    pub fn is_creditworthy(env: Env, user: Address) -> bool {
        match Self::get_score(env.clone(), user) {
            Some(score) => {
                let min_score = read_u32(&env, &DataKey::MinScore);
                score.score >= min_score
            }
            None => false,
        }
    }

    /// Admin: Update verification key (e.g., if compromised)
    pub fn update_verification_key(env: Env, caller: Address, new_key: VerificationKey) {
        let admin: Address = env
            .storage()
            .persistent()
            .get(&DataKey::Admin)
            .expect("admin not set");
        
        caller.require_auth();
        if caller != admin {
            panic!("not admin");
        }
        
        env.storage().persistent().set(&DataKey::VerificationKey, &new_key);
        
        env.events().publish_event(&VkeyUpdatedEvent { event: true });
    }

    /// Admin: Set minimum score threshold
    pub fn set_min_score(env: Env, caller: Address, min_score: u32) {
        let admin: Address = env
            .storage()
            .persistent()
            .get(&DataKey::Admin)
            .expect("admin not set");
        
        caller.require_auth();
        if caller != admin {
            panic!("not admin");
        }
        
        assert!(min_score <= 1000, "invalid min_score");
        write_u32(&env, &DataKey::MinScore, min_score);
    }

    /// Admin: Emergency pause
    pub fn set_pause(env: Env, caller: Address, paused: bool) {
        let admin: Address = env
            .storage()
            .persistent()
            .get(&DataKey::Admin)
            .expect("admin not set");
        
        caller.require_auth();
        if caller != admin {
            panic!("not admin");
        }
        
        write_bool(&env, &DataKey::Paused, paused);
        
        env.events().publish_event(&PauseEvent { paused });
    }

    // ========== PRIVATE HELPERS ==========

    /// STUB: Verify Groth16 proof
    /// 
    /// In Week 3-4, this will implement actual Groth16 verification:
    /// 1. Parse proof into (A, B, C) elliptic curve points
    /// 2. Parse public inputs into field elements
    /// 3. Verify pairing equation: e(A, B) = e(alpha, beta) * e(public_inputs, gamma) * e(C, delta)
    /// 
    /// For now, we just check that proof and inputs are non-zero
    fn verify_groth16(
        _env: &Env,
        _vkey: &VerificationKey,
        proof: &Proof,
        public_inputs: &PublicInputs,
    ) -> bool {
        // STUB: Placeholder verification
        // Real implementation will use arkworks or bellman library
        
        // Check proof is not all zeros
        let mut proof_is_zero = true;
        for byte in proof.to_array().iter() {
            if *byte != 0 {
                proof_is_zero = false;
                break;
            }
        }
        
        // Check public inputs are not all zeros
        let mut inputs_is_zero = true;
        for byte in public_inputs.to_array().iter() {
            if *byte != 0 {
                inputs_is_zero = false;
                break;
            }
        }
        
        // For stub, accept if both are non-zero
        !proof_is_zero && !inputs_is_zero
    }

    /// Extract credit score from public inputs
    /// Assumes first 4 bytes represent u32 score in big-endian
    fn extract_score(_env: &Env, public_inputs: &PublicInputs) -> u32 {
        let bytes = public_inputs.to_array();
        
        // Read first 4 bytes as big-endian u32
        u32::from_be_bytes([bytes[0], bytes[1], bytes[2], bytes[3]])
    }
}

#[cfg(test)]
mod test {
    use super::*;
    #[cfg(not(target_arch = "wasm32"))]
    use soroban_sdk::testutils::{Address as _, Ledger};

    #[test]
    fn test_init_and_verify_stub() {
        let env = Env::default();
        env.mock_all_auths();
        
        let admin = Address::generate(&env);
        let user = Address::generate(&env);
        
        // Create dummy verification key (32 bytes)
        let vkey = BytesN::from_array(&env, &[1u8; 32]);
        
        let contract_id = env.register(ZkVerifierContract, ());
        let client = ZkVerifierContractClient::new(&env, &contract_id);
        
        // Initialize with min_score=700 (realistic for mainnet creditworthiness)
        client.init(&admin, &vkey, &700);
        
        // Create dummy proof (256 bytes, not all zeros)
        let mut proof_bytes = [0u8; 256];
        proof_bytes[0] = 1; // Make it non-zero
        let proof = BytesN::from_array(&env, &proof_bytes);
        
        // Create public inputs with score 750 (first 4 bytes)
        let mut input_bytes = [0u8; 128];
        let score: u32 = 750;
        input_bytes[0..4].copy_from_slice(&score.to_be_bytes());
        input_bytes[4] = 1; // Make rest non-zero
        let public_inputs = BytesN::from_array(&env, &input_bytes);
        
        // Create nonce
        let nonce = BytesN::from_array(&env, &[1u8; 16]);
        
        // Verify proof (should succeed with stub)
        let result = client.verify_proof(&user, &proof, &public_inputs, &nonce);
        assert_eq!(result, true);
        
        // Check score stored
        let stored_score = client.get_score(&user);
        assert!(stored_score.is_some());
        assert_eq!(stored_score.unwrap().score, 750);
        
        // Check creditworthy
        assert_eq!(client.is_creditworthy(&user), true);
    }

    #[test]
    #[should_panic(expected = "nonce already used")]
    fn test_replay_attack_prevention() {
        let env = Env::default();
        env.mock_all_auths();
        
        let admin = Address::generate(&env);
        let user = Address::generate(&env);
        let vkey = BytesN::from_array(&env, &[1u8; 32]);
        
        let contract_id = env.register(ZkVerifierContract, ());
        let client = ZkVerifierContractClient::new(&env, &contract_id);
        
        client.init(&admin, &vkey, &600);
        
        let mut proof_bytes = [0u8; 256];
        proof_bytes[0] = 1;
        let proof = BytesN::from_array(&env, &proof_bytes);
        
        let mut input_bytes = [0u8; 128];
        let score: u32 = 750;
        input_bytes[0..4].copy_from_slice(&score.to_be_bytes());
        input_bytes[4] = 1;
        let public_inputs = BytesN::from_array(&env, &input_bytes);
        
        let nonce = BytesN::from_array(&env, &[1u8; 16]);
        
        // First verification succeeds
        client.verify_proof(&user, &proof, &public_inputs, &nonce);
        
        // Second verification with same nonce should panic
        client.verify_proof(&user, &proof, &public_inputs, &nonce);
    }

    #[test]
    #[should_panic(expected = "score below minimum")]
    fn test_low_score_rejected() {
        let env = Env::default();
        env.mock_all_auths();
        
        let admin = Address::generate(&env);
        let user = Address::generate(&env);
        let vkey = BytesN::from_array(&env, &[1u8; 32]);
        
        let contract_id = env.register(ZkVerifierContract, ());
        let client = ZkVerifierContractClient::new(&env, &contract_id);
        
        client.init(&admin, &vkey, &600);
        
        let mut proof_bytes = [0u8; 256];
        proof_bytes[0] = 1;
        let proof = BytesN::from_array(&env, &proof_bytes);
        
        // Score 500 < min 600
        let mut input_bytes = [0u8; 128];
        let score: u32 = 500;
        input_bytes[0..4].copy_from_slice(&score.to_be_bytes());
        input_bytes[4] = 1;
        let public_inputs = BytesN::from_array(&env, &input_bytes);
        
        let nonce = BytesN::from_array(&env, &[1u8; 16]);
        
        // Should panic
        client.verify_proof(&user, &proof, &public_inputs, &nonce);
    }

    #[test]
    fn test_score_expiry() {
        let env = Env::default();
        env.mock_all_auths();
        env.ledger().with_mut(|li| li.timestamp = 1000);
        
        let admin = Address::generate(&env);
        let user = Address::generate(&env);
        let vkey = BytesN::from_array(&env, &[1u8; 32]);
        
        let contract_id = env.register(ZkVerifierContract, ());
        let client = ZkVerifierContractClient::new(&env, &contract_id);
        
        client.init(&admin, &vkey, &600);
        
        let mut proof_bytes = [0u8; 256];
        proof_bytes[0] = 1;
        let proof = BytesN::from_array(&env, &proof_bytes);
        
        let mut input_bytes = [0u8; 128];
        let score: u32 = 750;
        input_bytes[0..4].copy_from_slice(&score.to_be_bytes());
        input_bytes[4] = 1;
        let public_inputs = BytesN::from_array(&env, &input_bytes);
        
        let nonce = BytesN::from_array(&env, &[1u8; 16]);
        
        // Verify at t=1000
        client.verify_proof(&user, &proof, &public_inputs, &nonce);
        
        // Score valid at t=1000
        assert!(client.get_score(&user).is_some());
        
        // Advance time past expiry (86400 seconds = 24h) 
        env.ledger().with_mut(|li| li.timestamp = 1000 + 86401);
        
        // Score should be expired
        assert!(client.get_score(&user).is_none());
        assert_eq!(client.is_creditworthy(&user), false);
    }
}
