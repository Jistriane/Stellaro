#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, symbol_short, Address, Env, Symbol, BytesN, IntoVal, token};


#[contract]
pub struct RwaTokenizer;

#[contracttype]
#[derive(Clone)]
enum DataKey {
    Admin,
    VcRegistry,
    Balance(Address),
    TotalSupply,
    Metadata(Symbol),
}

#[contractimpl]
impl RwaTokenizer {
    pub fn initialize(env: Env, admin: Address, vc_registry: Address, name: Symbol) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("already initialized");
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::VcRegistry, &vc_registry);
        env.storage().instance().set(&DataKey::Metadata(symbol_short!("name")), &name);
    }

    fn get_admin(env: &Env) -> Address {
        env.storage().instance().get(&DataKey::Admin).expect("not initialized")
    }

    fn get_vc_registry(env: &Env) -> Address {
        env.storage().instance().get(&DataKey::VcRegistry).expect("not initialized")
    }

    fn check_compliance(env: &Env, user: Address) {
        let registry_addr = Self::get_vc_registry(env);
        let is_valid: bool = env.invoke_contract(
            &registry_addr,
            &Symbol::new(env, "has_valid_vc"),
            soroban_sdk::vec![env, user.into_val(env)]
        );
        
        if !is_valid {
            panic!("user does not meet compliance (invalid or missing VC)");
        }
    }

    pub fn mint(env: Env, to: Address, amount: i128) {
        let admin = Self::get_admin(&env);
        admin.require_auth();
        
        Self::check_compliance(&env, to.clone());

        let mut balance = env.storage().persistent().get(&DataKey::Balance(to.clone())).unwrap_or(0);
        balance += amount;
        env.storage().persistent().set(&DataKey::Balance(to), &balance);

        let mut total_supply = env.storage().instance().get(&DataKey::TotalSupply).unwrap_or(0);
        total_supply += amount;
        env.storage().instance().set(&DataKey::TotalSupply, &total_supply);
    }

    pub fn transfer(env: Env, from: Address, to: Address, amount: i128) {
        from.require_auth();
        
        Self::check_compliance(&env, from.clone());
        Self::check_compliance(&env, to.clone());

        let mut from_balance = env.storage().persistent().get(&DataKey::Balance(from.clone())).unwrap_or(0);
        if from_balance < amount {
            panic!("insufficient balance");
        }

        from_balance -= amount;
        env.storage().persistent().set(&DataKey::Balance(from), &from_balance);

        let mut to_balance = env.storage().persistent().get(&DataKey::Balance(to.clone())).unwrap_or(0);
        to_balance += amount;
        env.storage().persistent().set(&DataKey::Balance(to), &to_balance);
    }

    /// Distribui dividendos para um holder específico (Simplificado para o MVP)
    /// Em produção, isso seria uma iteração ou snapshot
    pub fn distribute_dividend(env: Env, holder: Address, token_addr: Address, amount: i128) {
        let admin = Self::get_admin(&env);
        admin.require_auth();

        let client = token::Client::new(&env, &token_addr);
        client.transfer(&env.current_contract_address(), &holder, &amount);
    }

    pub fn balance_of(env: Env, user: Address) -> i128 {
        env.storage().persistent().get(&DataKey::Balance(user)).unwrap_or(0)
    }

    pub fn total_supply(env: Env) -> i128 {
        env.storage().instance().get(&DataKey::TotalSupply).unwrap_or(0)
    }
}
