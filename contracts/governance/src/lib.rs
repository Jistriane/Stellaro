#![no_std]
use soroban_sdk::{contract, contractimpl, symbol_short, Address, Env, Symbol, IntoVal};

const ADMIN_KEY: Symbol = symbol_short!("ADMIN");

#[contract]
pub struct Governance;

pub struct Events;
impl Events {
    fn proposal_executed(env: &Env, target: &Address, method: &Symbol, ok: bool) {
        let evt = Symbol::new(env, "proposal_executed");
        let topics = (evt, target.clone(), method.clone());
        env.events().publish(topics, ok);
    }
}

#[contractimpl]
impl Governance {
    pub fn init(env: Env, admin: Address) {
        if env.storage().instance().has(&ADMIN_KEY) {
            panic!("already_init");
        }
        admin.require_auth();
        env.storage().instance().set(&ADMIN_KEY, &admin);
    }

    pub fn get_admin(env: Env) -> Address {
        env.storage()
            .instance()
            .get::<_, Address>(&ADMIN_KEY)
            .expect("not_init")
    }

    pub fn set_admin(env: Env, new_admin: Address) {
        let admin: Address = Self::get_admin(env.clone());
        admin.require_auth();
        env.storage().instance().set(&ADMIN_KEY, &new_admin);
        let evt = Symbol::new(&env, "set_admin");
        env.events().publish((evt,), ());
    }

    /// Chamada genérica para métodos (caller: Address, flag: bool) em outro contrato
    pub fn call_with_flag(env: Env, target: Address, method: Symbol, flag: bool) -> bool {
        let admin: Address = Self::get_admin(env.clone());
        admin.require_auth();

        // Invoca método com assinatura (caller: Address, flag: bool)
        let args = soroban_sdk::vec![&env, admin.into_val(&env), flag.into_val(&env)];
        let res: bool = env.invoke_contract(&target, &method, args);

        Events::proposal_executed(&env, &target, &method, res);
        res
    }

    /// Conveniências com nomes comuns; ajuste conforme interface do stablecoin
    pub fn set_paused(env: Env, stablecoin: Address, paused: bool) -> bool {
        let method = Symbol::new(&env, "set_pause");
        Self::call_with_flag(env, stablecoin, method, paused)
    }

    pub fn set_mint_enabled(env: Env, stablecoin: Address, enabled: bool) -> bool {
        let method = Symbol::new(&env, "set_mint_enabled");
        Self::call_with_flag(env, stablecoin, method, enabled)
    }

    pub fn set_burn_enabled(env: Env, stablecoin: Address, enabled: bool) -> bool {
        let method = Symbol::new(&env, "set_burn_enabled");
        Self::call_with_flag(env, stablecoin, method, enabled)
    }

    /// Chamada genérica para métodos (caller: Address, value: u32)
    pub fn call_with_u32(env: Env, target: Address, method: Symbol, value: u32) -> bool {
        let admin: Address = Self::get_admin(env.clone());
        admin.require_auth();
        let args = soroban_sdk::vec![&env, admin.into_val(&env), value.into_val(&env)];
        let res: bool = env.invoke_contract(&target, &method, args);
        Events::proposal_executed(&env, &target, &method, res);
        res
    }

    pub fn set_risk_threshold(env: Env, stablecoin: Address, new_bps: u32) -> bool {
        let method = Symbol::new(&env, "set_risk_threshold");
        Self::call_with_u32(env, stablecoin, method, new_bps)
    }
}
