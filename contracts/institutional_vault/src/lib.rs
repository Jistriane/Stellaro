#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, Vec, symbol_short, token, IntoVal};

#[contracttype]
pub enum DataKey {
    Admin,
    VaultToken,
    VcRegistry,
    Whitelisted(Address),
    Owners(Vec<Address>),
    Threshold,
    Balance(Address),
}

#[contract]
pub struct InstitutionalVault;

#[contractimpl]
impl InstitutionalVault {
    pub fn initialize(env: Env, admin: Address, token: Address, vc_registry: Address, owners: Vec<Address>, threshold: u32) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("already initialized");
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::VaultToken, &token);
        env.storage().instance().set(&DataKey::VcRegistry, &vc_registry);
        env.storage().instance().set(&DataKey::Owners(owners.clone()), &owners);
        env.storage().instance().set(&DataKey::Threshold, &threshold);
    }

    fn check_compliance(env: &Env, institution: Address) {
        let registry_addr: Address = env.storage().instance().get(&DataKey::VcRegistry).expect("vc registry not set");
        let is_valid: bool = env.invoke_contract(
            &registry_addr,
            &soroban_sdk::Symbol::new(&env, "has_valid_vc"),
            soroban_sdk::vec![env, institution.clone().into_val(env)]
        );
        if !is_valid {
            panic!("compliance failed: institutional access requires specialized VC");
        }
    }

    pub fn whitelist_institution(env: Env, admin: Address, institution: Address) {
        admin.require_auth();
        // Além da whitelist manual, exigimos a VC ativa
        Self::check_compliance(&env, institution.clone());
        env.storage().instance().set(&DataKey::Whitelisted(institution), &true);
    }

    pub fn deposit(env: Env, institution: Address, amount: i128) {
        institution.require_auth();
        Self::check_compliance(&env, institution.clone());
        
        if !env.storage().instance().get::<_, bool>(&DataKey::Whitelisted(institution.clone())).unwrap_or(false) {
            panic!("not whitelisted");
        }

        let token_addr: Address = env.storage().instance().get(&DataKey::VaultToken).unwrap();
        let client = token::Client::new(&env, &token_addr);
        client.transfer(&institution, &env.current_contract_address(), &amount);

        let mut bal: i128 = env.storage().persistent().get(&DataKey::Balance(institution.clone())).unwrap_or(0);
        bal += amount;
        env.storage().persistent().set(&DataKey::Balance(institution), &bal);

        env.events().publish((symbol_short!("DEPOSIT"),), amount);
    }

    pub fn withdraw(env: Env, institution: Address, amount: i128) {
        // MPC/Multisig Logic: Em produção, exigiria assinaturas de múltiplos owners
        institution.require_auth();
        Self::check_compliance(&env, institution.clone());

        let mut bal: i128 = env.storage().persistent().get(&DataKey::Balance(institution.clone())).unwrap_or(0);
        if bal < amount {
            panic!("insufficient funds");
        }

        bal -= amount;
        env.storage().persistent().set(&DataKey::Balance(institution.clone()), &bal);

        let token_addr: Address = env.storage().instance().get(&DataKey::VaultToken).unwrap();
        let client = token::Client::new(&env, &token_addr);
        client.transfer(&env.current_contract_address(), &institution, &amount);

        env.events().publish((symbol_short!("WITHDRAW"),), amount);
    }
}
