#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, symbol_short, Address, Env, Symbol, token};

#[contracttype]
#[derive(Clone, Debug)]
pub struct Policy {
    pub id: u32,
    pub holder: Address,
    pub premium: i128,
    pub coverage_amount: i128,
    pub expiry: u32,
    pub active: bool,
}

#[contracttype]
pub enum DataKey {
    Admin,
    Token,
    TotalShares,
    UserShares(Address),
    Policy(u32),
    PoliciesCount,
}

#[contract]
pub struct InsurancePool;

#[contractimpl]
impl InsurancePool {
    pub fn initialize(env: Env, admin: Address, token: Address) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("already initialized");
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::Token, &token);
        env.storage().instance().set(&DataKey::TotalShares, &0i128);
        env.storage().instance().set(&DataKey::PoliciesCount, &0u32);
    }

    pub fn deposit(env: Env, user: Address, amount: i128) {
        user.require_auth();
        
        let token_addr: Address = env.storage().instance().get(&DataKey::Token).unwrap();
        let client = token::Client::new(&env, &token_addr);
        client.transfer(&user, &env.current_contract_address(), &amount);

        let mut total_shares: i128 = env.storage().instance().get(&DataKey::TotalShares).unwrap_or(0);
        let mut user_shares: i128 = env.storage().persistent().get(&DataKey::UserShares(user.clone())).unwrap_or(0);
        
        user_shares += amount;
        total_shares += amount;

        env.storage().persistent().set(&DataKey::UserShares(user), &user_shares);
        env.storage().instance().set(&DataKey::TotalShares, &total_shares);
    }

    pub fn register_policy(env: Env, holder: Address, premium: i128, coverage: i128, duration_ledgers: u32) -> u32 {
        holder.require_auth();

        let token_addr: Address = env.storage().instance().get(&DataKey::Token).unwrap();
        let client = token::Client::new(&env, &token_addr);
        
        // Pagar prêmio ao pool
        client.transfer(&holder, &env.current_contract_address(), &premium);

        let mut count: u32 = env.storage().instance().get(&DataKey::PoliciesCount).unwrap_or(0);
        count += 1;

        let policy = Policy {
            id: count,
            holder,
            premium,
            coverage_amount: coverage,
            expiry: env.ledger().sequence() + duration_ledgers,
            active: true,
        };

        env.storage().instance().set(&DataKey::Policy(count), &policy);
        env.storage().instance().set(&DataKey::PoliciesCount, &count);

        count
    }

    pub fn payout(env: Env, policy_id: u32) {
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        admin.require_auth();

        let mut policy: Policy = env.storage().instance().get(&DataKey::Policy(policy_id)).expect("policy not found");
        if !policy.active {
            panic!("policy not active");
        }

        let token_addr: Address = env.storage().instance().get(&DataKey::Token).unwrap();
        let client = token::Client::new(&env, &token_addr);
        
        client.transfer(&env.current_contract_address(), &policy.holder, &policy.coverage_amount);
        
        policy.active = false;
        env.storage().instance().set(&DataKey::Policy(policy_id), &policy);
    }

    pub fn get_balance(env: Env, user: Address) -> i128 {
        env.storage().persistent().get(&DataKey::UserShares(user)).unwrap_or(0)
    }
}
