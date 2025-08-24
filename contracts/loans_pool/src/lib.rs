#![no_std]

use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, Symbol};

#[derive(Clone)]
#[contracttype]
enum DataKey {
    Admin,
    TotalLiquidity,
    LtvBps, // 0..=10000
    InterestBps, // juros anualizados simplificado
    Position(Address), // saldo devedor por tomador
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
        // Exige autorização do depositante; integração com token deve ser feita externamente
        from.require_auth();
        assert!(amount > 0, "amount");
        let liq = read_u128(&env, &DataKey::TotalLiquidity);
        write_u128(&env, &DataKey::TotalLiquidity, liq.saturating_add(amount));
        let evt = Symbol::new(&env, "deposit");
        env.events().publish((evt,), ());
    }

    pub fn borrow(env: Env, borrower: Address, amount: u128, collateral_value: u128) {
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
        let evt = Symbol::new(&env, "borrow");
        env.events().publish((evt,), ());
    }

    pub fn repay(env: Env, borrower: Address, amount: u128) {
        borrower.require_auth();
        assert!(amount > 0, "amount");
        let cur = read_u128(&env, &DataKey::Position(borrower.clone()));
        assert!(cur >= amount, "overpay");
        write_u128(&env, &DataKey::Position(borrower), cur - amount);
        // Devolver liquidez ao pool
        let liq = read_u128(&env, &DataKey::TotalLiquidity);
        write_u128(&env, &DataKey::TotalLiquidity, liq.saturating_add(amount));
        let evt = Symbol::new(&env, "repay");
        env.events().publish((evt,), ());
    }

    pub fn params(env: Env) -> (u32, u32) {
        (read_u32(&env, &DataKey::LtvBps), read_u32(&env, &DataKey::InterestBps))
    }
}
