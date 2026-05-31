#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, token, IntoVal};

#[contracttype]
#[derive(Clone, Debug)]
pub struct Subscription {
    pub user: Address,
    pub merchant: Address,
    pub token: Address,
    pub amount: i128,
    pub frequency_ledgers: u32,
    pub last_payment_ledger: u32,
    pub active: bool,
}

#[contracttype]
pub enum DataKey {
    Admin,
    VcRegistry,
    Sub(Address, Address), // (user, merchant)
}

#[contract]
pub struct RecurringPayments;

#[contractimpl]
impl RecurringPayments {
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
            panic!("compliance failed: subscription user needs KYC VC");
        }
    }

    pub fn authorize(
        env: Env,
        user: Address,
        merchant: Address,
        token: Address,
        amount: i128,
        frequency_ledgers: u32,
    ) {
        user.require_auth();
        Self::check_compliance(&env, user.clone());

        let sub = Subscription {
            user: user.clone(),
            merchant: merchant.clone(),
            token,
            amount,
            frequency_ledgers,
            last_payment_ledger: 0,
            active: true,
        };

        env.storage().persistent().set(&DataKey::Sub(user, merchant), &sub);
    }

    pub fn withdraw(env: Env, user: Address, merchant: Address) {
        merchant.require_auth();
        // Merchant validado pelo admin no onboarding off-chain, 
        // mas o pagador deve manter KYC ativo para a cobrança ocorrer.
        Self::check_compliance(&env, user.clone());

        let mut sub: Subscription = env.storage().persistent().get(&DataKey::Sub(user.clone(), merchant.clone())).expect("no subscription found");
        
        if !sub.active {
            panic!("subscription is inactive");
        }

        let current_ledger = env.ledger().sequence();
        if sub.last_payment_ledger != 0 && current_ledger < sub.last_payment_ledger + sub.frequency_ledgers {
            panic!("too early for next payment");
        }

        let client = token::Client::new(&env, &sub.token);
        client.transfer(&user, &merchant, &sub.amount);

        sub.last_payment_ledger = current_ledger;
        env.storage().persistent().set(&DataKey::Sub(user, merchant), &sub);
    }

    pub fn set_active(env: Env, user: Address, merchant: Address, active: bool) {
        user.require_auth();
        
        let mut sub: Subscription = env.storage().persistent().get(&DataKey::Sub(user.clone(), merchant.clone())).expect("no subscription found");
        sub.active = active;
        env.storage().persistent().set(&DataKey::Sub(user, merchant), &sub);
    }

    pub fn cancel(env: Env, user: Address, merchant: Address) {
        Self::set_active(env, user, merchant, false);
    }

    pub fn get_subscription(env: Env, user: Address, merchant: Address) -> Subscription {
        env.storage().persistent().get(&DataKey::Sub(user, merchant)).expect("not found")
    }
}

#[cfg(test)]
mod test;
