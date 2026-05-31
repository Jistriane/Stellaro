#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, contractevent, Address, Env, Symbol, IntoVal, token};

#[contractevent]
pub struct MintEvent {
    pub to: Address,
    pub amount: i128,
}

#[contractevent]
pub struct BurnEvent {
    pub from: Address,
    pub amount: i128,
}

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    VcRegistry,
    TotalSupply,
    Balance(Address),
}

#[contract]
pub struct RwaTokenizer;

#[contractimpl]
impl RwaTokenizer {
    pub fn initialize(env: Env, admin: Address, vc_registry: Address) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("already initialized");
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::VcRegistry, &vc_registry);
    }

    fn check_compliance(env: &Env, user: Address) {
        let registry_addr: Address = env.storage().instance().get(&DataKey::VcRegistry).expect("vc registry not set");
        let is_valid: bool = env.invoke_contract(
            &registry_addr,
            &soroban_sdk::Symbol::new(env, "has_valid_vc"),
            soroban_sdk::vec![env, user.clone().into_val(env)]
        );
        if !is_valid {
            panic!("compliance failed: user needs KYC VC for RWA");
        }
    }

    pub fn mint(env: Env, caller: Address, to: Address, amount: i128) {
        let admin: Address = env.storage().instance().get(&DataKey::Admin).expect("not initialized");
        caller.require_auth();
        if caller != admin {
            panic!("unauthorized");
        }

        Self::check_compliance(&env, to.clone());

        let mut balance: i128 = env.storage().persistent().get(&DataKey::Balance(to.clone())).unwrap_or(0);
        balance += amount;
        env.storage().persistent().set(&DataKey::Balance(to.clone()), &balance);

        let mut total_supply: i128 = env.storage().instance().get(&DataKey::TotalSupply).unwrap_or(0);
        total_supply += amount;
        env.storage().instance().set(&DataKey::TotalSupply, &total_supply);

        env.events().publish_event(&MintEvent { to, amount });
    }

    pub fn burn(env: Env, from: Address, amount: i128) {
        from.require_auth();

        let mut balance: i128 = env.storage().persistent().get(&DataKey::Balance(from.clone())).unwrap_or(0);
        if balance < amount {
            panic!("insufficient balance");
        }
        balance -= amount;
        env.storage().persistent().set(&DataKey::Balance(from.clone()), &balance);

        let mut total_supply: i128 = env.storage().instance().get(&DataKey::TotalSupply).unwrap_or(0);
        total_supply -= amount;
        env.storage().instance().set(&DataKey::TotalSupply, &total_supply);

        env.events().publish_event(&BurnEvent { from, amount });
    }

    pub fn balance_of(env: Env, owner: Address) -> i128 {
        env.storage().persistent().get(&DataKey::Balance(owner)).unwrap_or(0)
    }

    pub fn total_supply(env: Env) -> i128 {
        env.storage().instance().get(&DataKey::TotalSupply).unwrap_or(0)
    }
}

#[cfg(test)]
mod test;
