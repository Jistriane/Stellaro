#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, symbol_short};

#[contracttype]
pub enum DataKey {
    Referrer(Address), // referee -> referrer
    ReferralCount(Address), // referrer -> count
    ReferralVolume(Address), // referrer -> volume
}

#[contract]
pub struct ReferralSystem;

#[contractimpl]
impl ReferralSystem {
    pub fn initialize(_env: Env) {
        // Initialization logic if needed
    }

    pub fn register_referral(env: Env, referrer: Address, referee: Address) {
        referee.require_auth();
        
        if env.storage().persistent().has(&DataKey::Referrer(referee.clone())) {
            panic!("already referred");
        }

        if referrer == referee {
            panic!("cannot refer self");
        }

        env.storage().persistent().set(&DataKey::Referrer(referee.clone()), &referrer);
        
        let mut count: u32 = env.storage().persistent().get(&DataKey::ReferralCount(referrer.clone())).unwrap_or(0);
        count += 1;
        env.storage().persistent().set(&DataKey::ReferralCount(referrer.clone()), &count);

        env.events().publish((symbol_short!("REF_REG"), referee), referrer);
    }

    pub fn get_referrer(env: Env, referee: Address) -> Option<Address> {
        env.storage().persistent().get(&DataKey::Referrer(referee))
    }

    pub fn record_volume(env: Env, user: Address, amount: i128) {
        // Esta função seria chamada pelos contratos de RWA ou Lending
        if let Some(referrer) = env.storage().persistent().get::<_, Address>(&DataKey::Referrer(user)) {
            let mut vol: i128 = env.storage().persistent().get(&DataKey::ReferralVolume(referrer.clone())).unwrap_or(0);
            vol += amount;
            env.storage().persistent().set(&DataKey::ReferralVolume(referrer), &vol);
        }
    }

    pub fn get_fee_discount(env: Env, user: Address) -> u32 {
        // Retorna desconto em pontos base (ex: 50 = 0.5%)
        if env.storage().persistent().has(&DataKey::Referrer(user)) {
            return 50; // Desconto para quem foi indicado
        }
        0
    }
}
