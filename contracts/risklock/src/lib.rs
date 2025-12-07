#![no_std]

use soroban_sdk::{contract, contractimpl, contracttype, contractevent, Address, Env};

#[contractevent]
pub struct LockEvent {
    pub event: bool,
}

#[contractevent]
pub struct UnlockEvent {
    pub event: bool,
}

#[derive(Clone)]
#[contracttype]
enum DataKey {
    Admin,
    Locked(Address),
}

#[contract]
pub struct RiskLockContract;

#[contractimpl]
impl RiskLockContract {
    pub fn init(env: Env, admin: Address) {
        if env.storage().persistent().has(&DataKey::Admin) {
            panic!("already initialized");
        }
        // Exigir prova de posse do endereço admin
        admin.require_auth();
        env.storage().persistent().set(&DataKey::Admin, &admin);
    }

    pub fn is_locked(env: Env, owner: Address) -> bool {
        env.storage()
            .persistent()
            .get::<DataKey, bool>(&DataKey::Locked(owner))
            .unwrap_or(false)
    }

    pub fn lock(env: Env, caller: Address, owner: Address) {
        let admin: Address = env
            .storage()
            .persistent()
            .get(&DataKey::Admin)
            .expect("admin not set");
        caller.require_auth();
        if caller != admin {
            panic!("not admin");
        }
        env.storage()
            .persistent()
            .set(&DataKey::Locked(owner), &true);
        env.events().publish_event(&LockEvent { event: true });
    }

    pub fn unlock(env: Env, caller: Address, owner: Address) {
        let admin: Address = env
            .storage()
            .persistent()
            .get(&DataKey::Admin)
            .expect("admin not set");
        caller.require_auth();
        if caller != admin {
            panic!("not admin");
        }
        env.storage()
            .persistent()
            .set(&DataKey::Locked(owner), &false);
        env.events().publish_event(&UnlockEvent { event: true });
    }
}
