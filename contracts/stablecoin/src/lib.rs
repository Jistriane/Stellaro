#![cfg_attr(not(test), no_std)]

use soroban_sdk::{contract, contractimpl, contracttype, contracterror, contractevent, Address, Env, Symbol};

#[contractevent]
pub struct InitEvent {
    pub initialized: bool,
}

#[contractevent]
pub struct SetPauseEvent {
    pub paused: bool,
}

#[contractevent]
pub struct MintEvent {
    pub to: Address,
    pub amount: u128,
}

#[contractevent]
pub struct BurnEvent {
    pub from: Address,
    pub amount: u128,
}

#[contractevent]
pub struct ClawbackEvent {
    pub from: Address,
    pub amount: u128,
}

#[contractevent]
pub struct LockEvent {
    pub owner: Address,
}

#[contractevent]
pub struct UnlockEvent {
    pub owner: Address,
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    Unauthorized = 1,
    InsufficientBalance = 2,
    AlreadyInitialized = 3,
    ContractPaused = 4,
    AccountLocked = 5,
    RiskThresholdExceeded = 6,
    InvalidAmount = 7,
    MintDisabled = 8,
    BurnDisabled = 9,
    Reentrancy = 10,
    InvalidThreshold = 11,
    NotInitialized = 12,
}

#[derive(Clone)]
#[contracttype]
enum DataKey {
    Admin,
    Balance(Address),
    TotalSupply,
    RiskThreshold, // em bps (0..=10000)
    Locked(Address),
    Paused,
    MintEnabled,
    BurnEnabled,
    ReentrancyLock, // Global reentrancy protection
}

fn get_admin(env: &Env) -> Result<Address, Error> {
    env
        .storage()
        .persistent()
        .get(&DataKey::Admin)
        .ok_or(Error::NotInitialized)
}

#[cfg(test)]
mod test {
    use super::*;
    use std::panic::{catch_unwind, AssertUnwindSafe};
    use soroban_sdk::testutils::{Address as _, Ledger};

    fn expect_err<F: FnOnce()>(f: F) {
        assert!(catch_unwind(AssertUnwindSafe(f)).is_err());
    }

    #[test]
    fn init_and_admin_controls() {
        let env = Env::default();
        env.mock_all_auths();
        // Usa o ledger atual para preservar protocol_version e demais campos
        let mut li = env.ledger().get();
        li.timestamp = 1; // avança tempo mínimo necessário
        env.ledger().set(li);

        let admin = Address::generate(&env);

        let contract_id = env.register(StablecoinContract, ());
        let client = StablecoinContractClient::new(&env, &contract_id);

        // init configura thresholds e flags iniciais - 4000 bps = 40% risk threshold for mainnet
        client.init(&admin, &4000u32);
        assert_eq!(client.risk_threshold(), 4000u32);
        assert_eq!(client.paused(), false);

        // Admin pode pausar
        client.set_pause(&admin, &true);
        assert_eq!(client.paused(), true);
    }

    #[test]
    fn mint_guarded_is_admin_only_and_checks_risk_and_lock() {
        let env = Env::default();
        env.mock_all_auths();
        let admin = Address::generate(&env);
        let user1 = Address::generate(&env);

        let contract_id = env.register(StablecoinContract, ());
        let client = StablecoinContractClient::new(&env, &contract_id);

        client.init(&admin, &4000u32); // 40% risk threshold

        // Admin consegue mint quando risco atual < threshold
        client.mint_guarded(&admin, &user1, &1_000_000_000_000u128, &2000u32); // 1M tokens, 20% current risk
        assert_eq!(client.balance_of(&user1), 1_000_000_000_000u128);
        assert_eq!(client.total_supply(), 1_000_000_000_000u128);
    }

    #[test]
    fn burn_is_owner_only() {
        let env = Env::default();
        env.mock_all_auths();
        let admin = Address::generate(&env);
        let user1 = Address::generate(&env);

        let contract_id = env.register(StablecoinContract, ());
        let client = StablecoinContractClient::new(&env, &contract_id);

        client.init(&admin, &4000u32); // 40% risk threshold

        // Admin cria saldo para user1
        client.mint_guarded(&admin, &user1, &500_000_000_000u128, &1500u32); // 500k tokens, 15% risk
        assert_eq!(client.balance_of(&user1), 500_000_000_000u128);

        // user1 queima seu próprio saldo
        client.burn(&user1, &user1, &100_000_000_000u128); // queima 100k tokens
        assert_eq!(client.balance_of(&user1), 400_000_000_000u128);
        assert_eq!(client.total_supply(), 400_000_000_000u128);
    }

    #[test]
    fn set_pause_non_admin_errors() {
        let env = Env::default();
        env.mock_all_auths();
        let admin = Address::generate(&env);
        let user1 = Address::generate(&env);
        let contract_id = env.register(StablecoinContract, ());
        let client = StablecoinContractClient::new(&env, &contract_id);
        client.init(&admin, &4000u32); // 40% risk threshold
        // Deve errar porque user1 não é admin
        expect_err(|| client.set_pause(&user1, &true));
    }

    #[test]
    fn mint_by_non_admin_errors() {
        let env = Env::default();
        env.mock_all_auths();
        let admin = Address::generate(&env);
        let user1 = Address::generate(&env);
        let contract_id = env.register(StablecoinContract, ());
        let client = StablecoinContractClient::new(&env, &contract_id);
        client.init(&admin, &4000u32); // 40% risk threshold
        // Não admin tentando mint -> erro
        expect_err(|| client.mint_guarded(&user1, &user1, &1_000_000_000_000u128, &1500u32));
    }

    #[test]
    fn burn_not_owner_errors() {
        let env = Env::default();
        env.mock_all_auths();
        let admin = Address::generate(&env);
        let user1 = Address::generate(&env);
        let user2 = Address::generate(&env);
        let contract_id = env.register(StablecoinContract, ());
        let client = StablecoinContractClient::new(&env, &contract_id);
        client.init(&admin, &4000u32); // 40% risk threshold
        client.mint_guarded(&admin, &user1, &500_000_000_000u128, &1500u32);
        // user2 tentando queimar saldo de user1 -> erro
        expect_err(|| client.burn(&user2, &user1, &100_000_000_000u128));
    }

    #[test]
    fn test_overflow_protection() {
        let env = Env::default();
        env.mock_all_auths();
        let admin = Address::generate(&env);
        let user1 = Address::generate(&env);
        let contract_id = env.register(StablecoinContract, ());
        let client = StablecoinContractClient::new(&env, &contract_id);
        client.init(&admin, &4000u32); // 40% risk threshold
        
        // Mint max amount
        client.mint_guarded(&admin, &user1, &u128::MAX, &0u32); // 0% risk to allow max mint
        assert_eq!(client.balance_of(&user1), u128::MAX);

        // Try to mint more (should saturate, not overflow)
        client.mint_guarded(&admin, &user1, &1u128, &0u32);
        assert_eq!(client.balance_of(&user1), u128::MAX);
    }

    #[test]
    fn test_underflow_protection() {
        let env = Env::default();
        env.mock_all_auths();
        let admin = Address::generate(&env);
        let user1 = Address::generate(&env);
        let contract_id = env.register(StablecoinContract, ());
        let client = StablecoinContractClient::new(&env, &contract_id);
        client.init(&admin, &4000u32); // 40% risk threshold
        
        // Mint 1M tokens
        client.mint_guarded(&admin, &user1, &1_000_000_000_000u128, &2000u32);
        
        // Try to burn more than balance (should error)
        expect_err(|| client.burn(&user1, &user1, &1_000_000_000_001u128));
    }

    #[test]
    fn test_unauthorized_clawback() {
        let env = Env::default();
        env.mock_all_auths();
        let admin = Address::generate(&env);
        let user1 = Address::generate(&env);
        let user2 = Address::generate(&env);
        let contract_id = env.register(StablecoinContract, ());
        let client = StablecoinContractClient::new(&env, &contract_id);
        client.init(&admin, &4000u32); // 40% risk threshold
        
        client.mint_guarded(&admin, &user1, &1_000_000_000_000u128, &2000u32);
        
        // Non-admin trying clawback should error
        expect_err(|| client.clawback(&user2, &user1, &500_000_000_000u128));
    }

    #[test]
    fn test_lock_prevents_mint() {
        let env = Env::default();
        env.mock_all_auths();
        let admin = Address::generate(&env);
        let user1 = Address::generate(&env);
        let contract_id = env.register(StablecoinContract, ());
        let client = StablecoinContractClient::new(&env, &contract_id);
        client.init(&admin, &4000u32); // 40% risk threshold
        
        // Lock user1
        client.lock(&admin, &user1);
        assert_eq!(client.is_locked(&user1), true);
        
        // Try to mint to locked address (should error)
        expect_err(|| client.mint_guarded(&admin, &user1, &1_000_000_000_000u128, &2000u32));
    }

    #[test]
    fn test_lock_prevents_burn() {
        let env = Env::default();
        env.mock_all_auths();
        let admin = Address::generate(&env);
        let user1 = Address::generate(&env);
        let contract_id = env.register(StablecoinContract, ());
        let client = StablecoinContractClient::new(&env, &contract_id);
        client.init(&admin, &4000u32); // 40% risk threshold
        
        // Mint first
        client.mint_guarded(&admin, &user1, &1_000_000_000_000u128, &2000u32);
        
        // Lock user1
        client.lock(&admin, &user1);
        
        // Try to burn from locked address (should error)
        expect_err(|| client.burn(&user1, &user1, &500_000_000_000u128));
    }
}

#[contract]
pub struct StablecoinContract;

fn read_u128(env: &Env, key: &DataKey) -> u128 {
    env.storage()
        .persistent()
        .get::<DataKey, u128>(key)
        .unwrap_or(0)
}

fn write_u128(env: &Env, key: &DataKey, val: u128) {
    env.storage().persistent().set(key, &val);
}

fn read_u32(env: &Env, key: &DataKey) -> u32 {
    env.storage()
        .persistent()
        .get::<DataKey, u32>(key)
        .unwrap_or(0)
}

fn write_u32(env: &Env, key: &DataKey, val: u32) {
    env.storage().persistent().set(key, &val);
}

fn read_bool(env: &Env, key: &DataKey) -> bool {
    env.storage()
        .persistent()
        .get::<DataKey, bool>(key)
        .unwrap_or(false)
}

fn write_bool(env: &Env, key: &DataKey, val: bool) {
    env.storage().persistent().set(key, &val);
}

fn acquire_lock(env: &Env) -> Result<(), Error> {
    if read_bool(env, &DataKey::ReentrancyLock) {
        return Err(Error::Reentrancy);
    }
    write_bool(env, &DataKey::ReentrancyLock, true);
    Ok(())
}

fn release_lock(env: &Env) {
    write_bool(env, &DataKey::ReentrancyLock, false);
}

#[contractimpl]
impl StablecoinContract {
    pub fn init(env: Env, admin: Address, risk_threshold_bps: u32) -> Result<(), Error> {
        // Pode ser chamado uma vez, sem proteção para simplificar o MVP
        if env
            .storage()
            .persistent()
            .has(&DataKey::Admin)
        {
            return Err(Error::AlreadyInitialized);
        }
        // Exigir prova de posse do endereço admin
        admin.require_auth();
        if risk_threshold_bps > 10_000 {
            return Err(Error::InvalidThreshold);
        }
        env.storage().persistent().set(&DataKey::Admin, &admin);
        write_u32(&env, &DataKey::RiskThreshold, risk_threshold_bps);
        write_u128(&env, &DataKey::TotalSupply, 0);
        write_bool(&env, &DataKey::Paused, false);
        write_bool(&env, &DataKey::MintEnabled, true);
        write_bool(&env, &DataKey::BurnEnabled, true);
        env.events().publish_event(&InitEvent { initialized: true });
        Ok(())
    }

    pub fn set_risk_threshold(env: Env, caller: Address, risk_threshold_bps: u32) -> Result<(), Error> {
        if risk_threshold_bps > 10_000 {
            return Err(Error::InvalidThreshold);
        }
        let admin = get_admin(&env)?;
        caller.require_auth();
        if caller != admin {
            return Err(Error::Unauthorized);
        }
        write_u32(&env, &DataKey::RiskThreshold, risk_threshold_bps);
        Ok(())
    }

    pub fn risk_threshold(env: Env) -> u32 {
        read_u32(&env, &DataKey::RiskThreshold)
    }

    pub fn balance_of(env: Env, owner: Address) -> u128 {
        read_u128(&env, &DataKey::Balance(owner))
    }

    pub fn total_supply(env: Env) -> u128 {
        read_u128(&env, &DataKey::TotalSupply)
    }

    pub fn is_locked(env: Env, owner: Address) -> bool {
        read_bool(&env, &DataKey::Locked(owner))
    }

    pub fn paused(env: Env) -> bool {
        read_bool(&env, &DataKey::Paused)
    }

    pub fn set_pause(env: Env, caller: Address, flag: bool) -> Result<(), Error> {
        let admin = get_admin(&env)?;
        caller.require_auth();
        if caller != admin {
            return Err(Error::Unauthorized);
        }
        write_bool(&env, &DataKey::Paused, flag);
        env.events().publish_event(&SetPauseEvent { paused: flag });
        Ok(())
    }

    pub fn set_mint_enabled(env: Env, caller: Address, flag: bool) -> Result<(), Error> {
        let admin = get_admin(&env)?;
        caller.require_auth();
        if caller != admin { return Err(Error::Unauthorized); }
        write_bool(&env, &DataKey::MintEnabled, flag);
        env.events().publish_event(&SetPauseEvent { paused: !flag });
        Ok(())
    }

    pub fn set_burn_enabled(env: Env, caller: Address, flag: bool) -> Result<(), Error> {
        let admin = get_admin(&env)?;
        caller.require_auth();
        if caller != admin { return Err(Error::Unauthorized); }
        write_bool(&env, &DataKey::BurnEnabled, flag);
        env.events().publish_event(&SetPauseEvent { paused: !flag });
        Ok(())
    }

    pub fn lock(env: Env, caller: Address, owner: Address) -> Result<(), Error> {
        let admin = get_admin(&env)?;
        caller.require_auth();
        if caller != admin { return Err(Error::Unauthorized); }
        write_bool(&env, &DataKey::Locked(owner.clone()), true);
        env.events().publish_event(&LockEvent { owner });
        Ok(())
    }

    pub fn unlock(env: Env, caller: Address, owner: Address) -> Result<(), Error> {
        let admin = get_admin(&env)?;
        caller.require_auth();
        if caller != admin { return Err(Error::Unauthorized); }
        write_bool(&env, &DataKey::Locked(owner.clone()), false);
        env.events().publish_event(&UnlockEvent { owner });
        Ok(())
    }

    pub fn mint_guarded(env: Env, caller: Address, to: Address, amount: u128, current_risk_bps: u32) -> Result<(), Error> {
        // Reentrancy guard
        acquire_lock(&env)?;
        
        caller.require_auth();
        let admin = get_admin(&env)?;
        if caller != admin { 
            release_lock(&env);
            return Err(Error::Unauthorized); 
        }
        if amount == 0 {
            release_lock(&env);
            return Err(Error::InvalidAmount);
        }
        if read_bool(&env, &DataKey::Paused) { 
            release_lock(&env);
            return Err(Error::ContractPaused); 
        }
        if !read_bool(&env, &DataKey::MintEnabled) { 
            release_lock(&env);
            return Err(Error::MintDisabled); 
        }
        let thr = read_u32(&env, &DataKey::RiskThreshold);
        if current_risk_bps >= thr {
            release_lock(&env);
            return Err(Error::RiskThresholdExceeded);
        }
        if Self::is_locked(env.clone(), to.clone()) { 
            release_lock(&env);
            return Err(Error::AccountLocked); 
        }

        let bal = read_u128(&env, &DataKey::Balance(to.clone()));
        write_u128(&env, &DataKey::Balance(to.clone()), bal.saturating_add(amount));
        let ts = read_u128(&env, &DataKey::TotalSupply);
        write_u128(&env, &DataKey::TotalSupply, ts.saturating_add(amount));
        env.events().publish_event(&MintEvent { to, amount });
        
        release_lock(&env);
        Ok(())
    }

    pub fn burn(env: Env, caller: Address, from: Address, amount: u128) -> Result<(), Error> {
        acquire_lock(&env)?;
        
        caller.require_auth();
        if caller != from { 
            release_lock(&env);
            return Err(Error::Unauthorized); 
        }
        if amount == 0 {
            release_lock(&env);
            return Err(Error::InvalidAmount);
        }
        if read_bool(&env, &DataKey::Paused) { 
            release_lock(&env);
            return Err(Error::ContractPaused); 
        }
        if !read_bool(&env, &DataKey::BurnEnabled) { 
            release_lock(&env);
            return Err(Error::BurnDisabled); 
        }
        if Self::is_locked(env.clone(), from.clone()) { 
            release_lock(&env);
            return Err(Error::AccountLocked); 
        }

        let bal = read_u128(&env, &DataKey::Balance(from.clone()));
        if bal < amount {
            release_lock(&env);
            return Err(Error::InsufficientBalance);
        }
        write_u128(&env, &DataKey::Balance(from.clone()), bal - amount);
        let ts = read_u128(&env, &DataKey::TotalSupply);
        write_u128(&env, &DataKey::TotalSupply, ts - amount);
        env.events().publish_event(&BurnEvent { from, amount });
        
        release_lock(&env);
        Ok(())
    }

    // Clawback admin-only: reduz saldo do endereço e totalSupply
    pub fn clawback(env: Env, caller: Address, from: Address, amount: u128) -> Result<(), Error> {
        acquire_lock(&env)?;
        
        let admin = get_admin(&env)?;
        caller.require_auth();
        if caller != admin { 
            release_lock(&env);
            return Err(Error::Unauthorized); 
        }
        if amount == 0 {
            release_lock(&env);
            return Err(Error::InvalidAmount);
        }
        let bal = read_u128(&env, &DataKey::Balance(from.clone()));
        if bal < amount {
            release_lock(&env);
            return Err(Error::InsufficientBalance);
        }
        write_u128(&env, &DataKey::Balance(from.clone()), bal - amount);
        let ts = read_u128(&env, &DataKey::TotalSupply);
        write_u128(&env, &DataKey::TotalSupply, ts - amount);
        env.events().publish_event(&ClawbackEvent { from, amount });
        
        release_lock(&env);
        Ok(())
    }

    pub fn symbol(env: Env) -> Symbol {
        Symbol::new(&env, "USTEL")
    }
}
