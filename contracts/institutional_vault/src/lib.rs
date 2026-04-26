#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, Vec, symbol_short, token};

#[contracttype]
pub enum DataKey {
    Admin,
    VaultToken,
    Whitelisted(Address),
    Owners(Vec<Address>),
    Threshold,
    Balance(Address),
}

#[contract]
pub struct InstitutionalVault;

#[contractimpl]
impl InstitutionalVault {
    pub fn initialize(env: Env, admin: Address, token: Address, owners: Vec<Address>, threshold: u32) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("already initialized");
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::VaultToken, &token);
        env.storage().instance().set(&DataKey::Owners(owners.clone()), &owners);
        env.storage().instance().set(&DataKey::Threshold, &threshold);
    }

    pub fn whitelist_institution(env: Env, admin: Address, institution: Address) {
        admin.require_auth();
        // Check if admin
        env.storage().instance().set(&DataKey::Whitelisted(institution), &true);
    }

    pub fn deposit(env: Env, institution: Address, amount: i128) {
        institution.require_auth();
        
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
        // Aqui simulamos a autorização da instituição
        institution.require_auth();

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
