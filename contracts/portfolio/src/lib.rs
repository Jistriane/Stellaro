#![no_std]

use soroban_sdk::{contract, contractimpl, contracttype, Address, BytesN, Env, Symbol};

#[derive(Clone)]
#[contracttype]
enum DataKey {
    Admin,
    Allocation(BytesN<32>),
    Limit(BytesN<32>),
}

#[contract]
pub struct PortfolioContract;

#[contractimpl]
impl PortfolioContract {
    pub fn init(env: Env, admin: Address) {
        if env.storage().persistent().has(&DataKey::Admin) {
            panic!("already initialized");
        }
        // Exigir prova de posse do endereço admin
        admin.require_auth();
        env.storage().persistent().set(&DataKey::Admin, &admin);
        let evt = Symbol::new(&env, "init");
        env.events().publish((evt,), ());
    }

    pub fn set_allocation(env: Env, asset: BytesN<32>, bps: u32) {
        // bps de 0..=10000
        assert!(bps <= 10_000, "bps inválido");
        // Somente admin pode alterar
        let admin: Address = env
            .storage()
            .persistent()
            .get(&DataKey::Admin)
            .expect("admin not set");
        admin.require_auth();
        let key = DataKey::Allocation(asset);
        env.storage().persistent().set(&key, &bps);
        let evt = Symbol::new(&env, "set_allocation");
        env.events().publish((evt,), ());
    }

    pub fn get_allocation(env: Env, asset: BytesN<32>) -> u32 {
        let key = DataKey::Allocation(asset);
        env.storage()
            .persistent()
            .get::<DataKey, u32>(&key)
            .unwrap_or(0)
    }

    pub fn set_limit(env: Env, asset: BytesN<32>, bps: u32) {
        assert!(bps <= 10_000, "bps inválido");
        let admin: Address = env
            .storage()
            .persistent()
            .get(&DataKey::Admin)
            .expect("admin not set");
        admin.require_auth();
        let key = DataKey::Limit(asset);
        env.storage().persistent().set(&key, &bps);
        let evt = Symbol::new(&env, "set_limit");
        env.events().publish((evt,), ());
    }

    pub fn get_limit(env: Env, asset: BytesN<32>) -> u32 {
        let key = DataKey::Limit(asset);
        env.storage()
            .persistent()
            .get::<DataKey, u32>(&key)
            .unwrap_or(0)
    }
}

// Optional: version
#[contractimpl]
impl PortfolioContract {
    pub fn version(_env: Env) -> u32 {
        1
    }
}
