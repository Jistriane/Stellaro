#![cfg_attr(not(test), no_std)]

use soroban_sdk::{contract, contractimpl, contracttype, contracterror, Address, Env, Symbol};

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

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::testutils::{Address as _, Ledger, LedgerInfo};

    #[test]
    fn init_and_admin_controls() {
        let env = Env::default();
        env.mock_all_auths();
        // Usa o ledger atual para preservar protocol_version e demais campos
        let mut li = env.ledger().get();
        li.timestamp = 1; // avança tempo mínimo necessário
        env.ledger().set(li);

        let admin = Address::generate(&env);
        let user1 = Address::generate(&env);

        let contract_id = env.register_contract(None, StablecoinContract);
        let client = StablecoinContractClient::new(&env, &contract_id);

        // init configura thresholds e flags iniciais
        client.init(&admin, &500u32);
        assert_eq!(client.risk_threshold(), 500u32);
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

        let contract_id = env.register_contract(None, StablecoinContract);
        let client = StablecoinContractClient::new(&env, &contract_id);

        client.init(&admin, &800u32);

        // Admin consegue mint quando risco atual < threshold
        client.mint_guarded(&admin, &user1, &100u128, &500u32);
        assert_eq!(client.balance_of(&user1), 100u128);
        assert_eq!(client.total_supply(), 100u128);
    }

    #[test]
    fn burn_is_owner_only() {
        let env = Env::default();
        env.mock_all_auths();
        let admin = Address::generate(&env);
        let user1 = Address::generate(&env);
        let user2 = Address::generate(&env);

        let contract_id = env.register_contract(None, StablecoinContract);
        let client = StablecoinContractClient::new(&env, &contract_id);

        client.init(&admin, &700u32);

        // Admin cria saldo para user1
        client.mint_guarded(&admin, &user1, &200u128, &100u32);
        assert_eq!(client.balance_of(&user1), 200u128);

        // user1 queima seu próprio saldo
        client.burn(&user1, &user1, &50u128);
        assert_eq!(client.balance_of(&user1), 150u128);
        assert_eq!(client.total_supply(), 150u128);
    }

    #[test]
    #[should_panic]
    fn set_pause_non_admin_panics() {
        let env = Env::default();
        env.mock_all_auths();
        let admin = Address::generate(&env);
        let user1 = Address::generate(&env);
        let contract_id = env.register_contract(None, StablecoinContract);
        let client = StablecoinContractClient::new(&env, &contract_id);
        client.init(&admin, &500u32);
        // Deve panicar porque user1 não é admin
        client.set_pause(&user1, &true);
    }

    #[test]
    #[should_panic]
    fn mint_by_non_admin_panics() {
        let env = Env::default();
        env.mock_all_auths();
        let admin = Address::generate(&env);
        let user1 = Address::generate(&env);
        let contract_id = env.register_contract(None, StablecoinContract);
        let client = StablecoinContractClient::new(&env, &contract_id);
        client.init(&admin, &800u32);
        // Não admin tentando mint -> panica
        client.mint_guarded(&user1, &user1, &100u128, &100u32);
    }

    #[test]
    #[should_panic]
    fn burn_not_owner_panics() {
        let env = Env::default();
        env.mock_all_auths();
        let admin = Address::generate(&env);
        let user1 = Address::generate(&env);
        let user2 = Address::generate(&env);
        let contract_id = env.register_contract(None, StablecoinContract);
        let client = StablecoinContractClient::new(&env, &contract_id);
        client.init(&admin, &700u32);
        client.mint_guarded(&admin, &user1, &200u128, &100u32);
        // user2 tentando queimar saldo de user1 -> panica
        client.burn(&user2, &user1, &50u128);
    }

    #[test]
    fn test_overflow_protection() {
        let env = Env::default();
        env.mock_all_auths();
        let admin = Address::generate(&env);
        let user1 = Address::generate(&env);
        let contract_id = env.register_contract(None, StablecoinContract);
        let client = StablecoinContractClient::new(&env, &contract_id);
        client.init(&admin, &500u32);
        
        // Mint max amount
        client.mint_guarded(&admin, &user1, &u128::MAX, &100u32);
        assert_eq!(client.balance_of(&user1), u128::MAX);
        
        // Try to mint more (should saturate, not overflow)
        client.mint_guarded(&admin, &user1, &1u128, &100u32);
        assert_eq!(client.balance_of(&user1), u128::MAX);
    }

    #[test]
    #[should_panic(expected = "insufficient")]
    fn test_underflow_protection() {
        let env = Env::default();
        env.mock_all_auths();
        let admin = Address::generate(&env);
        let user1 = Address::generate(&env);
        let contract_id = env.register_contract(None, StablecoinContract);
        let client = StablecoinContractClient::new(&env, &contract_id);
        client.init(&admin, &500u32);
        
        // Mint 100 tokens
        client.mint_guarded(&admin, &user1, &100u128, &100u32);
        
        // Try to burn more than balance (should panic)
        client.burn(&user1, &user1, &101u128);
    }

    #[test]
    #[should_panic(expected = "not admin")]
    fn test_unauthorized_clawback() {
        let env = Env::default();
        env.mock_all_auths();
        let admin = Address::generate(&env);
        let user1 = Address::generate(&env);
        let user2 = Address::generate(&env);
        let contract_id = env.register_contract(None, StablecoinContract);
        let client = StablecoinContractClient::new(&env, &contract_id);
        client.init(&admin, &500u32);
        
        client.mint_guarded(&admin, &user1, &100u128, &100u32);
        
        // Non-admin trying clawback should panic
        client.clawback(&user2, &user1, &50u128);
    }

    #[test]
    #[should_panic(expected = "locked")]
    fn test_lock_prevents_mint() {
        let env = Env::default();
        env.mock_all_auths();
        let admin = Address::generate(&env);
        let user1 = Address::generate(&env);
        let contract_id = env.register_contract(None, StablecoinContract);
        let client = StablecoinContractClient::new(&env, &contract_id);
        client.init(&admin, &500u32);
        
        // Lock user1
        client.lock(&admin, &user1);
        assert_eq!(client.is_locked(&user1), true);
        
        // Try to mint to locked address (should panic)
        client.mint_guarded(&admin, &user1, &100u128, &100u32);
    }

    #[test]
    #[should_panic(expected = "locked")]
    fn test_lock_prevents_burn() {
        let env = Env::default();
        env.mock_all_auths();
        let admin = Address::generate(&env);
        let user1 = Address::generate(&env);
        let contract_id = env.register_contract(None, StablecoinContract);
        let client = StablecoinContractClient::new(&env, &contract_id);
        client.init(&admin, &500u32);
        
        // Mint first
        client.mint_guarded(&admin, &user1, &100u128, &100u32);
        
        // Lock user1
        client.lock(&admin, &user1);
        
        // Try to burn from locked address (should panic)
        client.burn(&user1, &user1, &50u128);
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

fn emit(env: &Env, topic: &str, data: &str) {
    // Eventos simples com dois tópicos: nome e dados stringificados
    let t = Symbol::new(env, topic);
    env.events().publish((t,), data);
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
        emit(&env, "init", "ok");
        Ok(())
    }

    pub fn set_risk_threshold(env: Env, caller: Address, risk_threshold_bps: u32) -> Result<(), Error> {
        if risk_threshold_bps > 10_000 {
            return Err(Error::InvalidThreshold);
        }
        let admin: Address = env
            .storage()
            .persistent()
            .get(&DataKey::Admin)
            .expect("admin not set");
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

    pub fn set_pause(env: Env, caller: Address, flag: bool) {
        let admin: Address = env
            .storage()
            .persistent()
            .get(&DataKey::Admin)
            .expect("admin not set");
        caller.require_auth();
        if caller != admin { panic!("not admin"); }
        write_bool(&env, &DataKey::Paused, flag);
        emit(&env, if flag { "paused" } else { "unpaused" }, "");
    }

    pub fn set_mint_enabled(env: Env, caller: Address, flag: bool) {
        let admin: Address = env
            .storage()
            .persistent()
            .get(&DataKey::Admin)
            .expect("admin not set");
        caller.require_auth();
        if caller != admin { panic!("not admin"); }
        write_bool(&env, &DataKey::MintEnabled, flag);
        emit(&env, "mint_enabled", if flag { "true" } else { "false" });
    }

    pub fn set_burn_enabled(env: Env, caller: Address, flag: bool) {
        let admin: Address = env
            .storage()
            .persistent()
            .get(&DataKey::Admin)
            .expect("admin not set");
        caller.require_auth();
        if caller != admin { panic!("not admin"); }
        write_bool(&env, &DataKey::BurnEnabled, flag);
        emit(&env, "burn_enabled", if flag { "true" } else { "false" });
    }

    pub fn lock(env: Env, caller: Address, owner: Address) {
        // simplificado: admin-only
        let admin: Address = env
            .storage()
            .persistent()
            .get(&DataKey::Admin)
            .expect("admin not set");
        caller.require_auth();
        if caller != admin { panic!("not admin"); }
        write_bool(&env, &DataKey::Locked(owner), true);
        emit(&env, "lock", "ok");
    }

    pub fn unlock(env: Env, caller: Address, owner: Address) {
        let admin: Address = env
            .storage()
            .persistent()
            .get(&DataKey::Admin)
            .expect("admin not set");
        caller.require_auth();
        if caller != admin { panic!("not admin"); }
        write_bool(&env, &DataKey::Locked(owner), false);
        emit(&env, "unlock", "ok");
    }

    pub fn mint_guarded(env: Env, caller: Address, to: Address, amount: u128, current_risk_bps: u32) {
        // Reentrancy guard
        acquire_lock(&env);
        
        // Política: admin-only e só mint se risco atual < threshold e destino não bloqueado
        caller.require_auth();
        let admin: Address = env
            .storage()
            .persistent()
            .get(&DataKey::Admin)
            .expect("admin not set");
        if caller != admin { 
            release_lock(&env);
            panic!("not admin"); 
        }
        assert!(amount > 0, "amount=0");
        if read_bool(&env, &DataKey::Paused) { 
            release_lock(&env);
            panic!("paused"); 
        }
        if !read_bool(&env, &DataKey::MintEnabled) { 
            release_lock(&env);
            panic!("mint disabled"); 
        }
        let thr = read_u32(&env, &DataKey::RiskThreshold);
        assert!(current_risk_bps < thr, "high risk");
        if Self::is_locked(env.clone(), to.clone()) { 
            release_lock(&env);
            panic!("locked"); 
        }

        let bal = read_u128(&env, &DataKey::Balance(to.clone()));
        write_u128(&env, &DataKey::Balance(to.clone()), bal.saturating_add(amount));
        let ts = read_u128(&env, &DataKey::TotalSupply);
        write_u128(&env, &DataKey::TotalSupply, ts.saturating_add(amount));
        emit(&env, "mint", "ok");
        
        release_lock(&env);
    }

    pub fn burn(env: Env, caller: Address, from: Address, amount: u128) {
        // Reentrancy guard
        acquire_lock(&env);
        
        // Somente o próprio "from" pode queimar o seu saldo (ou políticas futuras)
        caller.require_auth();
        if caller != from { 
            release_lock(&env);
            panic!("not owner"); 
        }
        assert!(amount > 0, "amount=0");
        if read_bool(&env, &DataKey::Paused) { 
            release_lock(&env);
            panic!("paused"); 
        }
        if !read_bool(&env, &DataKey::BurnEnabled) { 
            release_lock(&env);
            panic!("burn disabled"); 
        }
        if Self::is_locked(env.clone(), from.clone()) { 
            release_lock(&env);
            panic!("locked"); 
        }

        let bal = read_u128(&env, &DataKey::Balance(from.clone()));
        assert!(bal >= amount, "insufficient");
        write_u128(&env, &DataKey::Balance(from.clone()), bal - amount);
        let ts = read_u128(&env, &DataKey::TotalSupply);
        write_u128(&env, &DataKey::TotalSupply, ts - amount);
        emit(&env, "burn", "ok");
        
        release_lock(&env);
    }

    // Clawback admin-only: reduz saldo do endereço e totalSupply
    pub fn clawback(env: Env, caller: Address, from: Address, amount: u128) {
        // Reentrancy guard
        acquire_lock(&env);
        
        let admin: Address = env
            .storage()
            .persistent()
            .get(&DataKey::Admin)
            .expect("admin not set");
        caller.require_auth();
        if caller != admin { 
            release_lock(&env);
            panic!("not admin"); 
        }
        assert!(amount > 0, "amount=0");
        let bal = read_u128(&env, &DataKey::Balance(from.clone()));
        assert!(bal >= amount, "insufficient");
        write_u128(&env, &DataKey::Balance(from.clone()), bal - amount);
        let ts = read_u128(&env, &DataKey::TotalSupply);
        write_u128(&env, &DataKey::TotalSupply, ts - amount);
        emit(&env, "clawback", "ok");
        
        release_lock(&env);
    }

    pub fn symbol(env: Env) -> Symbol {
        Symbol::new(&env, "USTEL")
    }
}
