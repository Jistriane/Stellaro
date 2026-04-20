#![no_std]

use soroban_sdk::{contract, contractimpl, contracttype, contractevent, Address, Env};

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
    pub fn init(env: Env, admin: Address, ltv_bps: u32, interest_bps: u32) {
        if env.storage().persistent().has(&DataKey::Admin) {
            panic!("already initialized");
        }
        assert!(ltv_bps <= 10_000, "ltv");
        assert!(interest_bps <= 10_000, "interest");
        env.storage().persistent().set(&DataKey::Admin, &admin);
        write_u32(&env, &DataKey::LtvBps, ltv_bps);
        write_u32(&env, &DataKey::InterestBps, interest_bps);
        write_u128(&env, &DataKey::TotalLiquidity, 0);
    }

    pub fn deposit(env: Env, from: Address, amount: u128) {
        // Reentrancy guard
        acquire_lock(&env);
        
        // Exige autorização do depositante; integração com token deve ser feita externamente
        from.require_auth();
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
        assert!(amount > 0, "amount");
        let ltv = read_u32(&env, &DataKey::LtvBps) as u128;
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

    #[test]
    fn init_and_basic_params() {
        let env = Env::default();
        env.mock_all_auths();
        let admin = Address::generate(&env);
        let contract_id = env.register(LoansPoolContract, ());
        let client = LoansPoolContractClient::new(&env, &contract_id);

        client.init(&admin, &6000u32, &1200u32); // LTV 60%, Interest 12% annualized (mainnet realistic)
        let (ltv, interest) = client.params();
        assert_eq!(ltv, 6000u32);
        assert_eq!(interest, 1200u32);
        assert_eq!(client.total_liquidity(), 0u128);
    }

    #[test]
    fn deposit_increases_liquidity() {
        let env = Env::default();
        env.mock_all_auths();
        let admin = Address::generate(&env);
        let depositor = Address::generate(&env);
        let contract_id = env.register(LoansPoolContract, ());
        let client = LoansPoolContractClient::new(&env, &contract_id);

        client.init(&admin, &6000u32, &1200u32); // LTV 60%, 12% interest
        client.deposit(&depositor, &1000000000u128); // 1B tokens
        assert_eq!(client.total_liquidity(), 1000000000u128);

        client.deposit(&depositor, &500000000u128); // +500M
        assert_eq!(client.total_liquidity(), 1500000000u128);
        assert_eq!(client.lender_position(&depositor), 1500000000u128);
    }

    #[test]
    fn borrow_respects_ltv() {
        let env = Env::default();
        env.mock_all_auths();
        let admin = Address::generate(&env);
        let depositor = Address::generate(&env);
        let borrower = Address::generate(&env);
        let contract_id = env.register(LoansPoolContract, ());
        let client = LoansPoolContractClient::new(&env, &contract_id);

        client.init(&admin, &6000u32, &1200u32); // LTV 60%
        client.deposit(&depositor, &10000000000u128); // 10B liquidity

        // Collateral 1B -> max borrow = 1B * 0.60 = 600M
        client.borrow(&borrower, &600000000u128, &1000000000u128);
        assert_eq!(client.position(&borrower), 600000000u128);
        assert_eq!(client.total_liquidity(), 9400000000u128); // 10B - 600M
    }

    #[test]
    #[should_panic(expected = "exceeds ltv")]
    fn borrow_exceeds_ltv_panics() {
        let env = Env::default();
        env.mock_all_auths();
        let admin = Address::generate(&env);
        let depositor = Address::generate(&env);
        let borrower = Address::generate(&env);
        let contract_id = env.register(LoansPoolContract, ());
        let client = LoansPoolContractClient::new(&env, &contract_id);

        client.init(&admin, &6000u32, &1200u32);
        client.deposit(&depositor, &10000000000u128);

        // Tentar pegar 700M com collateral 1B (max seria 600M = 60% of 1B)
        client.borrow(&borrower, &700000000u128, &1000000000u128);
    }

    #[test]
    #[should_panic(expected = "insufficient liquidity")]
    fn borrow_exceeds_pool_liquidity_panics() {
        let env = Env::default();
        env.mock_all_auths();
        let admin = Address::generate(&env);
        let depositor = Address::generate(&env);
        let borrower = Address::generate(&env);
        let contract_id = env.register(LoansPoolContract, ());
        let client = LoansPoolContractClient::new(&env, &contract_id);

        client.init(&admin, &6000u32, &1200u32);
        client.deposit(&depositor, &100000000u128); // Pouca liquidez - 100M (small for mainnet)

        // LTV OK but pool não tem fundos para emprestar 500M
        client.borrow(&borrower, &500000000u128, &1000000000u128);
    }

    #[test]
    fn repay_reduces_position_and_restores_liquidity() {
        let env = Env::default();
        env.mock_all_auths();
        let admin = Address::generate(&env);
        let depositor = Address::generate(&env);
        let borrower = Address::generate(&env);
        let contract_id = env.register(LoansPoolContract, ());
        let client = LoansPoolContractClient::new(&env, &contract_id);

        client.init(&admin, &6000u32, &1200u32);
        client.deposit(&depositor, &10000000000u128);

        client.borrow(&borrower, &600000000u128, &1000000000u128);
        assert_eq!(client.position(&borrower), 600000000u128);
        assert_eq!(client.total_liquidity(), 9400000000u128);

        client.repay(&borrower, &300000000u128); // repay 300M
        assert_eq!(client.position(&borrower), 300000000u128);
        assert_eq!(client.total_liquidity(), 9700000000u128); // 9.4B + 300M
    }

    #[test]
    #[should_panic(expected = "overpay")]
    fn repay_more_than_borrowed_panics() {
        let env = Env::default();
        env.mock_all_auths();
        let admin = Address::generate(&env);
        let depositor = Address::generate(&env);
        let borrower = Address::generate(&env);
        let contract_id = env.register(LoansPoolContract, ());
        let client = LoansPoolContractClient::new(&env, &contract_id);

        client.init(&admin, &6000u32, &1200u32);
        client.deposit(&depositor, &10000000000u128);
        client.borrow(&borrower, &500000000u128, &1000000000u128);

        // Tentar pagar mais que deve
        client.repay(&borrower, &600000000u128);
    }

    #[test]
    fn test_overflow_protection_deposit() {
        let env = Env::default();
        env.mock_all_auths();
        let admin = Address::generate(&env);
        let depositor = Address::generate(&env);
        let contract_id = env.register(LoansPoolContract, ());
        let client = LoansPoolContractClient::new(&env, &contract_id);

        client.init(&admin, &6000u32, &1200u32);
        
        // Deposit max amount
        client.deposit(&depositor, &u128::MAX);
        assert_eq!(client.total_liquidity(), u128::MAX);
        
        // Try to deposit more (should saturate)
        client.deposit(&depositor, &1u128);
        assert_eq!(client.total_liquidity(), u128::MAX);
    }

    #[test]
    fn test_multiple_borrowers() {
        let env = Env::default();
        env.mock_all_auths();
        let admin = Address::generate(&env);
        let depositor1 = Address::generate(&env);
        let depositor2 = Address::generate(&env);
        let borrower1 = Address::generate(&env);
        let borrower2 = Address::generate(&env);
        let contract_id = env.register(LoansPoolContract, ());
        let client = LoansPoolContractClient::new(&env, &contract_id);

        client.init(&admin, &6000u32, &1200u32); // LTV 60%
        client.deposit(&depositor1, &5000000000u128); // 5B
        client.deposit(&depositor2, &5000000000u128); // +5B = 10B total

        // Borrower1: 3B with 5B collateral (max = 3B = 60% of 5B)
        client.borrow(&borrower1, &3000000000u128, &5000000000u128);
        assert_eq!(client.position(&borrower1), 3000000000u128);

        // Borrower2: 4B with 7B collateral (max = 4.2B, borrow 4B = 57% of 7B)
        client.borrow(&borrower2, &4000000000u128, &7000000000u128);
        assert_eq!(client.position(&borrower2), 4000000000u128);

        // Total liquidity: 10B - 3B - 4B = 3B
        assert_eq!(client.total_liquidity(), 3000000000u128);
        
        // Repay 2B from borrower1
        client.repay(&borrower1, &2000000000u128);
        assert_eq!(client.position(&borrower1), 1000000000u128);
        assert_eq!(client.total_liquidity(), 5000000000u128); // 3B + 2B
    }

    #[test]
    fn withdraw_reduces_lender_position_and_liquidity() {
        let env = Env::default();
        env.mock_all_auths();
        let admin = Address::generate(&env);
        let depositor = Address::generate(&env);
        let contract_id = env.register(LoansPoolContract, ());
        let client = LoansPoolContractClient::new(&env, &contract_id);

        client.init(&admin, &6000u32, &1200u32);
        client.deposit(&depositor, &1000000000u128);

        client.withdraw(&depositor, &400000000u128);

        assert_eq!(client.lender_position(&depositor), 600000000u128);
        assert_eq!(client.total_liquidity(), 600000000u128);
    }

    #[test]
    #[should_panic(expected = "insufficient lender balance")]
    fn withdraw_more_than_lender_balance_panics() {
        let env = Env::default();
        env.mock_all_auths();
        let admin = Address::generate(&env);
        let depositor = Address::generate(&env);
        let contract_id = env.register(LoansPoolContract, ());
        let client = LoansPoolContractClient::new(&env, &contract_id);

        client.init(&admin, &6000u32, &1200u32);
        client.deposit(&depositor, &100000000u128);

        client.withdraw(&depositor, &200000000u128);
    }
}
