#![no_std]
use soroban_sdk::{contract, contractimpl, contractevent, symbol_short, Address, Env, Symbol, IntoVal};

const ADMIN_KEY: Symbol = symbol_short!("ADMIN");

#[contractevent]
pub struct ProposalExecutedEvent {
    pub target: Address,
    pub method: Symbol,
    pub ok: bool,
}

#[contractevent]
pub struct SetAdminEvent {
    pub event: bool,
}

#[contract]
pub struct Governance;

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
        env.events().publish_event(&SetAdminEvent { event: true });
    }

    /// Chamada genérica para métodos (caller: Address, flag: bool) em outro contrato
    pub fn call_with_flag(env: Env, target: Address, method: Symbol, flag: bool) -> bool {
        let admin: Address = Self::get_admin(env.clone());
        admin.require_auth();

        // Invoca método com assinatura (caller: Address, flag: bool)
        let args = soroban_sdk::vec![&env, admin.into_val(&env), flag.into_val(&env)];
        let res: bool = env.invoke_contract(&target, &method, args);

        env.events().publish_event(&ProposalExecutedEvent { target, method, ok: res });
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
        env.events().publish_event(&ProposalExecutedEvent { target, method, ok: res });
        res
    }

    pub fn set_risk_threshold(env: Env, stablecoin: Address, new_bps: u32) -> bool {
        let method = Symbol::new(&env, "set_risk_threshold");
        Self::call_with_u32(env, stablecoin, method, new_bps)
    }
}
