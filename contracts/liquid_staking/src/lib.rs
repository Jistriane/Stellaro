#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, Symbol, symbol_short, token, IntoVal};

#[contracttype]
pub enum DataKey {
    Admin,
    SxlmToken,
    TotalStaked,
    UserStaked(Address),
}

#[contract]
pub struct LiquidStaking;

#[contractimpl]
impl LiquidStaking {
    pub fn initialize(env: Env, admin: Address, sxlm_token: Address) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("already initialized");
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::SxlmToken, &sxlm_token);
        env.storage().instance().set(&DataKey::TotalStaked, &0i128);
    }

    pub fn stake(env: Env, sender: Address, amount: i128) {
        sender.require_auth();

        // 1. Transfer XLM (Native Token) from user to this contract
        // In Soroban, native token address is usually known or passed
        let native_token = env.current_contract_address(); // Simplified for MVP logic
        let client = token::Client::new(&env, &native_token);
        // client.transfer(&sender, &env.current_contract_address(), &amount);

        // 2. Mint sXLM to user
        let sxlm_addr: Address = env.storage().instance().get(&DataKey::SxlmToken).unwrap();
        let sxlm_client = token::Client::new(&env, &sxlm_addr);
        // sxlm_client.mint(&sender, &amount);

        // 3. Update state
        let mut total: i128 = env.storage().instance().get(&DataKey::TotalStaked).unwrap_or(0);
        total += amount;
        env.storage().instance().set(&DataKey::TotalStaked, &total);

        let mut user_staked = env.storage().persistent().get(&DataKey::UserStaked(sender.clone())).unwrap_or(0);
        user_staked += amount;
        env.storage().persistent().set(&DataKey::UserStaked(sender), &user_staked);

        env.events().publish((symbol_short!("STAKE"),), amount);
    }

    pub fn unstake(env: Env, sender: Address, amount: i128) {
        sender.require_auth();

        let mut user_staked = env.storage().persistent().get(&DataKey::UserStaked(sender.clone())).unwrap_or(0);
        if user_staked < amount {
            panic!("insufficient staked balance");
        }

        // 1. Burn sXLM
        // 2. Transfer XLM back to user
        
        user_staked -= amount;
        env.storage().persistent().set(&DataKey::UserStaked(sender), &user_staked);

        let mut total: i128 = env.storage().instance().get(&DataKey::TotalStaked).unwrap_or(0);
        total -= amount;
        env.storage().instance().set(&DataKey::TotalStaked, &total);

        env.events().publish((symbol_short!("UNSTAKE"),), amount);
    }
}
