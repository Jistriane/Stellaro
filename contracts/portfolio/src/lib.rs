#![no_std]

use soroban_sdk::{contract, contractimpl, contracttype, contractevent, Address, BytesN, Env};

#[contractevent]
pub struct SetAllocationEvent {
    pub event: bool,
}

#[contractevent]
pub struct SetLimitEvent {
    pub event: bool,
}

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
        env.events().publish_event(&SetAllocationEvent { event: true });
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
        env.events().publish_event(&SetLimitEvent { event: true });
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
