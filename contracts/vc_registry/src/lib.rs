#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, contractevent, Address, Env, BytesN};

#[contracttype]
#[derive(Clone)]
enum DataKey {
    Admin,
    Issuer(Address),
    Vc(BytesN<32>),       // Status da VC (true/false)
    UserVc(Address),      // Mapeamento Usuário -> Hash da VC
}

#[contractevent]
pub struct UpgradeEvent {
    pub new_wasm_hash: BytesN<32>,
}

#[contract]
pub struct VcRegistry;

#[contractimpl]
impl VcRegistry {
    pub fn initialize(env: Env, admin: Address) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("already initialized");
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
    }

    fn get_admin(env: &Env) -> Address {
        env.storage().instance().get(&DataKey::Admin).expect("not initialized")
    }

    pub fn add_issuer(env: Env, issuer: Address) {
        let admin = Self::get_admin(&env);
        admin.require_auth();
        env.storage().instance().set(&DataKey::Issuer(issuer), &true);
    }

    pub fn remove_issuer(env: Env, issuer: Address) {
        let admin = Self::get_admin(&env);
        admin.require_auth();
        env.storage().instance().remove(&DataKey::Issuer(issuer));
    }

    pub fn is_issuer(env: Env, issuer: Address) -> bool {
        env.storage().instance().has(&DataKey::Issuer(issuer))
    }

    /// Registra uma VC para um usuário específico
    pub fn register_user_vc(env: Env, issuer: Address, user: Address, vc_hash: BytesN<32>) {
        issuer.require_auth();
        if !Self::is_issuer(env.clone(), issuer) {
            panic!("not an authorized issuer");
        }
        
        env.storage().persistent().set(&DataKey::Vc(vc_hash.clone()), &true);
        env.storage().persistent().set(&DataKey::UserVc(user), &vc_hash);
    }

    pub fn revoke_vc(env: Env, caller: Address, vc_hash: BytesN<32>) {
        caller.require_auth();
        let is_admin = caller == Self::get_admin(&env);
        let is_issuer = Self::is_issuer(env.clone(), caller);

        if !is_admin && !is_issuer {
            panic!("unauthorized to revoke");
        }

        env.storage().persistent().set(&DataKey::Vc(vc_hash), &false);
    }

    /// Verifica se o usuário tem uma VC válida registrada
    pub fn has_valid_vc(env: Env, user: Address) -> bool {
        if let Some(vc_hash) = env.storage().persistent().get::<DataKey, BytesN<32>>(&DataKey::UserVc(user)) {
            return env.storage().persistent().get::<DataKey, bool>(&DataKey::Vc(vc_hash)).unwrap_or(false);
        }
        false
    }

    pub fn upgrade(env: Env, caller: Address, new_wasm_hash: BytesN<32>) {
        let admin = Self::get_admin(&env);
        caller.require_auth();
        assert!(caller == admin, "unauthorized");
        
        env.deployer().update_current_contract_wasm(new_wasm_hash.clone());
        env.events().publish_event(&UpgradeEvent { new_wasm_hash });
    }
}

mod test;
