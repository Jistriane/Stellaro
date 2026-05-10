#![no_std]

use soroban_sdk::{contract, contractimpl, contracttype, contractevent, Address, Env, IntoVal};

#[contractevent]
pub struct DepositEvent {
    pub event: bool,
}

#[contractevent]
pub struct BorrowEvent {
    pub event: bool,
}

#[contractevent]
pub struct RepayEvent {
    pub event: bool,
}

#[contractevent]
pub struct WithdrawEvent {
    pub event: bool,
}

#[derive(Clone)]
#[contracttype]
enum DataKey {
    Admin,
    TotalLiquidity,
    LtvBps, // 0..=10000
    InterestBps, // juros anualizados simplificado
    Position(Address), // saldo devedor por tomador
    LenderPosition(Address), // saldo de liquidez por provedor
    ReentrancyLock, // Global reentrancy protection
    ZkVerifier, // Address of the ZK Verifier contract
    VcRegistry, // Address of the VC Registry for KYC
}

fn read_u128(env: &Env, key: &DataKey) -> u128 {
    env.storage()
        .persistent()
        .get::<DataKey, u128>(key)
        .unwrap_or(0)
}

fn write_u128(env: &Env, key: &DataKey, val: u128) {
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

fn read_bool(env: &Env, key: &DataKey) -> bool {
    env.storage()
        .persistent()
        .get::<DataKey, bool>(key)
        .unwrap_or(false)
}

fn write_bool(env: &Env, key: &DataKey, val: bool) {
    env.storage().persistent().set(key, &val);
}

fn acquire_lock(env: &Env) {
    if read_bool(env, &DataKey::ReentrancyLock) {
        panic!("reentrancy detected");
    }
    write_bool(env, &DataKey::ReentrancyLock, true);
}

fn release_lock(env: &Env) {
    write_bool(env, &DataKey::ReentrancyLock, false);
}

#[contract]
pub struct LoansPoolContract;

#[contractimpl]
impl LoansPoolContract {
    pub fn init(env: Env, admin: Address, ltv_bps: u32, interest_bps: u32, zk_verifier: Address, vc_registry: Address) {
        if env.storage().persistent().has(&DataKey::Admin) {
            panic!("already initialized");
        }
        assert!(ltv_bps <= 10_000, "ltv");
        assert!(interest_bps <= 10_000, "interest");
        env.storage().persistent().set(&DataKey::Admin, &admin);
        write_u32(&env, &DataKey::LtvBps, ltv_bps);
        write_u32(&env, &DataKey::InterestBps, interest_bps);
        write_u128(&env, &DataKey::TotalLiquidity, 0);
        env.storage().persistent().set(&DataKey::ZkVerifier, &zk_verifier);
        env.storage().persistent().set(&DataKey::VcRegistry, &vc_registry);
    }

    fn check_compliance(env: &Env, user: Address) {
        let registry_addr: Address = env.storage().persistent().get(&DataKey::VcRegistry).expect("vc registry not set");
        let is_valid: bool = env.invoke_contract(
            &registry_addr,
            &soroban_sdk::Symbol::new(&env, "has_valid_vc"),
            soroban_sdk::vec![env, user.clone().into_val(env)]
        );
        if !is_valid {
            panic!("compliance failed: user needs KYC VC for lending");
        }
    }


    pub fn deposit(env: Env, from: Address, amount: u128) {
        // Reentrancy guard
        acquire_lock(&env);
        
        // Exige autorização do depositante; integração com token deve ser feita externamente
        from.require_auth();
        Self::check_compliance(&env, from.clone());
        assert!(amount > 0, "amount");
        let liq = read_u128(&env, &DataKey::TotalLiquidity);
        write_u128(&env, &DataKey::TotalLiquidity, liq.saturating_add(amount));
        let lender = read_u128(&env, &DataKey::LenderPosition(from.clone()));
        write_u128(
            &env,
            &DataKey::LenderPosition(from),
            lender.saturating_add(amount),
        );
        env.events().publish_event(&DepositEvent { event: true });
        
        release_lock(&env);
    }

    pub fn borrow(env: Env, borrower: Address, amount: u128, collateral_value: u128) {
        // Reentrancy guard
        acquire_lock(&env);
        
        borrower.require_auth();
        Self::check_compliance(&env, borrower.clone());
        assert!(amount > 0, "amount");
        
        let mut ltv = read_u32(&env, &DataKey::LtvBps) as u128;
        
        // ZK Credit Score Integration: Bonus for high scores
        let zk_verifier_addr: Address = env.storage().persistent().get(&DataKey::ZkVerifier).expect("zk verifier not set");
        // Cross-contract call to check creditworthiness
        let is_high_score: bool = env.invoke_contract(&zk_verifier_addr, &soroban_sdk::Symbol::new(&env, "is_creditworthy"), soroban_sdk::vec![&env, borrower.clone().into_val(&env)]);
        
        if is_high_score {
            ltv = ltv.saturating_add(1000); // +10% LTV bonus for verified users
            if ltv > 9500 { ltv = 9500; } // Cap at 95%
        }

        let max_borrow = collateral_value * ltv / 10_000u128;
        assert!(amount <= max_borrow, "exceeds ltv");
        // Verificar disponibilidade de liquidez do pool
        let liq = read_u128(&env, &DataKey::TotalLiquidity);
        assert!(liq >= amount, "insufficient liquidity");
        write_u128(&env, &DataKey::TotalLiquidity, liq - amount);
        let cur = read_u128(&env, &DataKey::Position(borrower.clone()));
        write_u128(&env, &DataKey::Position(borrower), cur.saturating_add(amount));
        env.events().publish_event(&BorrowEvent { event: true });
        
        release_lock(&env);
    }

    pub fn repay(env: Env, borrower: Address, amount: u128) {
        // Reentrancy guard
        acquire_lock(&env);
        
        borrower.require_auth();
        assert!(amount > 0, "amount");
        let cur = read_u128(&env, &DataKey::Position(borrower.clone()));
        assert!(cur >= amount, "overpay");
        write_u128(&env, &DataKey::Position(borrower), cur - amount);
        // Devolver liquidez ao pool
        let liq = read_u128(&env, &DataKey::TotalLiquidity);
        write_u128(&env, &DataKey::TotalLiquidity, liq.saturating_add(amount));
        env.events().publish_event(&RepayEvent { event: true });
        
        release_lock(&env);
    }

    pub fn withdraw(env: Env, lender: Address, amount: u128) {
        acquire_lock(&env);

        lender.require_auth();
        assert!(amount > 0, "amount");

        let lender_pos = read_u128(&env, &DataKey::LenderPosition(lender.clone()));
        assert!(lender_pos >= amount, "insufficient lender balance");

        let liq = read_u128(&env, &DataKey::TotalLiquidity);
        assert!(liq >= amount, "insufficient liquidity");

        write_u128(&env, &DataKey::LenderPosition(lender), lender_pos - amount);
        write_u128(&env, &DataKey::TotalLiquidity, liq - amount);

        env.events().publish_event(&WithdrawEvent { event: true });

        release_lock(&env);
    }

    pub fn params(env: Env) -> (u32, u32) {
        (read_u32(&env, &DataKey::LtvBps), read_u32(&env, &DataKey::InterestBps))
    }

    pub fn position(env: Env, borrower: Address) -> u128 {
        read_u128(&env, &DataKey::Position(borrower))
    }

    pub fn total_liquidity(env: Env) -> u128 {
        read_u128(&env, &DataKey::TotalLiquidity)
    }

    pub fn lender_position(env: Env, lender: Address) -> u128 {
        read_u128(&env, &DataKey::LenderPosition(lender))
    }
}

#[cfg(test)]
mod test {
    use super::*;
    #[cfg(not(target_arch = "wasm32"))]
    use soroban_sdk::testutils::Address as _;

    fn setup(env: &Env) -> (LoansPoolContractClient, Address, Address, Address) {
        env.mock_all_auths();
        let admin = Address::generate(env);
        let verifier_id = env.register(zk_verifier::ZkVerifierContract, ());
        let pool_id = env.register(LoansPoolContract, ());
        let pool_client = LoansPoolContractClient::new(env, &pool_id);
        
        let vkey = soroban_sdk::BytesN::from_array(env, &[1u8; 32]);
        let verifier_client = zk_verifier::ZkVerifierContractClient::new(env, &verifier_id);
        verifier_client.init(&admin, &vkey, &700);

        (pool_client, admin, verifier_id, Address::generate(env))
    }

    #[test]
    fn init_and_basic_params() {
        let env = Env::default();
        let (client, admin, verifier_id, _) = setup(&env);

        client.init(&admin, &6000u32, &1200u32, &verifier_id); 
        let (ltv, interest) = client.params();
        assert_eq!(ltv, 6000u32);
        assert_eq!(interest, 1200u32);
        assert_eq!(client.total_liquidity(), 0u128);
    }

    #[test]
    fn deposit_increases_liquidity() {
        let env = Env::default();
        let (client, admin, verifier_id, depositor) = setup(&env);

        client.init(&admin, &6000u32, &1200u32, &verifier_id);
        client.deposit(&depositor, &1000000000u128);
        assert_eq!(client.total_liquidity(), 1000000000u128);
    }

    #[test]
    fn borrow_respects_ltv() {
        let env = Env::default();
        let (client, admin, verifier_id, depositor) = setup(&env);
        let borrower = Address::generate(&env);

        client.init(&admin, &6000u32, &1200u32, &verifier_id);
        client.deposit(&depositor, &10000000000u128);

        client.borrow(&borrower, &600000000u128, &1000000000u128);
        assert_eq!(client.position(&borrower), 600000000u128);
    }

    #[test]
    #[should_panic(expected = "exceeds ltv")]
    fn borrow_exceeds_ltv_panics() {
        let env = Env::default();
        let (client, admin, verifier_id, depositor) = setup(&env);
        let borrower = Address::generate(&env);

        client.init(&admin, &6000u32, &1200u32, &verifier_id);
        client.deposit(&depositor, &10000000000u128);

        client.borrow(&borrower, &700000000u128, &1000000000u128);
    }

    #[test]
    fn borrow_with_zk_bonus() {
        let env = Env::default();
        let (pool_client, admin, verifier_id, depositor) = setup(&env);
        let borrower = Address::generate(&env);
        let verifier_client = zk_verifier::ZkVerifierContractClient::new(&env, &verifier_id);

        // Give borrower a high score
        let mut proof_bytes = [0u8; 256]; proof_bytes[0] = 1;
        let proof = soroban_sdk::BytesN::from_array(&env, &proof_bytes);
        let mut input_bytes = [0u8; 128];
        let score: u32 = 850; 
        input_bytes[0..4].copy_from_slice(&score.to_be_bytes());
        input_bytes[4] = 1;
        let public_inputs = soroban_sdk::BytesN::from_array(&env, &input_bytes);
        let nonce = soroban_sdk::BytesN::from_array(&env, &[2u8; 16]);
        verifier_client.verify_proof(&borrower, &proof, &public_inputs, &nonce);

        pool_client.init(&admin, &6000u32, &1200u32, &verifier_id);
        pool_client.deposit(&depositor, &10000000000u128);

        // LTV 60% + 10% bonus = 70%
        pool_client.borrow(&borrower, &700000000u128, &1000000000u128);
        assert_eq!(pool_client.position(&borrower), 700000000u128);
    }

    #[test]
    #[should_panic(expected = "insufficient liquidity")]
    fn borrow_exceeds_pool_liquidity_panics() {
        let env = Env::default();
        let (client, admin, verifier_id, depositor) = setup(&env);
        let borrower = Address::generate(&env);

        client.init(&admin, &6000u32, &1200u32, &verifier_id);
        client.deposit(&depositor, &100000000u128);

        client.borrow(&borrower, &500000000u128, &1000000000u128);
    }

    #[test]
    fn repay_reduces_position_and_restores_liquidity() {
        let env = Env::default();
        let (client, admin, verifier_id, depositor) = setup(&env);
        let borrower = Address::generate(&env);

        client.init(&admin, &6000u32, &1200u32, &verifier_id);
        client.deposit(&depositor, &10000000000u128);

        client.borrow(&borrower, &600000000u128, &1000000000u128);
        client.repay(&borrower, &300000000u128);
        assert_eq!(client.position(&borrower), 300000000u128);
    }

    #[test]
    #[should_panic(expected = "overpay")]
    fn repay_more_than_borrowed_panics() {
        let env = Env::default();
        let (client, admin, verifier_id, depositor) = setup(&env);
        let borrower = Address::generate(&env);

        client.init(&admin, &6000u32, &1200u32, &verifier_id);
        client.deposit(&depositor, &10000000000u128);
        client.borrow(&borrower, &500000000u128, &1000000000u128);
        client.repay(&borrower, &600000000u128);
    }

    #[test]
    fn withdraw_reduces_lender_position() {
        let env = Env::default();
        let (client, admin, verifier_id, depositor) = setup(&env);

        client.init(&admin, &6000u32, &1200u32, &verifier_id);
        client.deposit(&depositor, &1000000000u128);
        client.withdraw(&depositor, &400000000u128);
        assert_eq!(client.lender_position(&depositor), 600000000u128);
    }

    #[test]
    #[should_panic(expected = "insufficient lender balance")]
    fn withdraw_more_than_lender_balance_panics() {
        let env = Env::default();
        let (client, admin, verifier_id, depositor) = setup(&env);

        client.init(&admin, &6000u32, &1200u32, &verifier_id);
        client.deposit(&depositor, &100000000u128);
        client.withdraw(&depositor, &200000000u128);
    }
}
