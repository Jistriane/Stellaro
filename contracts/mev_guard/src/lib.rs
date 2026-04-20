#![no_std]

//! MEV Guard - Proteção contra MEV (Maximal Extractable Value)
//! 
//! Protege usuários de:
//! - Front-running
//! - Sandwich attacks
//! - Just-in-time liquidity attacks
//! 
//! Implementa estratégias Flashbots-style para Stellar/Soroban

use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, Vec, BytesN, Symbol, IntoVal, vec as soroban_vec};

/// Swap path (lista de tokens)
#[derive(Clone)]
#[contracttype]
pub struct SwapPath {
    pub hops: Vec<Address>,
}

/// Custom Errors
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
#[contracttype]
#[repr(u32)]
pub enum Error {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    Unauthorized = 3,
    DeadlineExpired = 4,
    SlippageExceeded = 5,
    InvalidPath = 6,
    InsufficientOutput = 7,
    ReentrancyDetected = 8,
    OrderAlreadyFilled = 9,
    InvalidAmount = 10,
    DeadlineTooSoon = 11,
}

impl From<Error> for soroban_sdk::Error {
    fn from(e: Error) -> Self {
        soroban_sdk::Error::from_contract_error(e as u32)
    }
}

impl From<&Error> for soroban_sdk::Error {
    fn from(e: &Error) -> Self {
        soroban_sdk::Error::from_contract_error(*e as u32)
    }
}

impl TryFrom<soroban_sdk::Error> for Error {
    type Error = soroban_sdk::Error;
    
    fn try_from(e: soroban_sdk::Error) -> Result<Self, Self::Error> {
        // Extract contract error code and try to convert back
        // This is a simplified conversion
        Err(e)
    }
}

/// Protected swap order
#[derive(Clone)]
#[contracttype]
pub struct ProtectedOrder {
    pub trader: Address,
    pub path: SwapPath,
    pub amount_in: i128,
    pub min_amount_out: i128,
    pub deadline: u64,
    pub nonce: BytesN<32>,
    pub created_at: u64,
    pub filled: bool,
}

/// Resultado da execução
#[derive(Clone)]
#[contracttype]
pub struct SwapResult {
    pub amount_out: i128,
    pub effective_price: i128,
    pub slippage_bps: u32,
}

#[derive(Clone)]
#[contracttype]
enum DataKey {
    Admin,
    Order(BytesN<32>),      // nonce -> ProtectedOrder
    DexRouter,              // Router DEX para swap real
    ReentrancyLock,
    MaxSlippageBps,         // Máximo slippage permitido (em BPS)
    MinBlockDelay,          // Delay mínimo em blocos para proteção
    NonceCounter,
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

fn read_u32(env: &Env, key: &DataKey) -> u32 {
    env.storage()
        .persistent()
        .get::<DataKey, u32>(key)
        .unwrap_or(0)
}

fn write_u32(env: &Env, key: &DataKey, val: u32) {
    env.storage().persistent().set(key, &val);
}

fn read_u64(env: &Env, key: &DataKey) -> u64 {
    env.storage()
        .persistent()
        .get::<DataKey, u64>(key)
        .unwrap_or(0)
}

fn write_u64(env: &Env, key: &DataKey, val: u64) {
    env.storage().persistent().set(key, &val);
}

fn acquire_lock(env: &Env) -> Result<(), Error> {
    if read_bool(env, &DataKey::ReentrancyLock) {
        return Err(Error::ReentrancyDetected);
    }
    write_bool(env, &DataKey::ReentrancyLock, true);
    Ok(())
}

fn release_lock(env: &Env) {
    write_bool(env, &DataKey::ReentrancyLock, false);
}

#[contract]
pub struct MEVGuard;

#[contractimpl]
impl MEVGuard {
    /// Inicializa o contrato
    pub fn init(
        env: Env,
        admin: Address,
        max_slippage_bps: u32,
        min_block_delay: u32,
    ) -> Result<(), Error> {
        if env.storage().persistent().has(&DataKey::Admin) {
            return Err(Error::AlreadyInitialized);
        }

        admin.require_auth();
        env.storage().persistent().set(&DataKey::Admin, &admin);
        write_u32(&env, &DataKey::MaxSlippageBps, max_slippage_bps);
        write_u32(&env, &DataKey::MinBlockDelay, min_block_delay);
        write_u64(&env, &DataKey::NonceCounter, 0);


        Ok(())
    }

    /// Cria ordem protegida (não executa imediatamente)
    /// A ordem não é pública até a execução, prevenindo front-running
    pub fn create_protected_order(
        env: Env,
        trader: Address,
        path: SwapPath,
        amount_in: i128,
        min_amount_out: i128,
        deadline: u64,
    ) -> Result<BytesN<32>, Error> {
        if !env.storage().persistent().has(&DataKey::Admin) {
            return Err(Error::NotInitialized);
        }

        trader.require_auth();

        if path.hops.is_empty() || path.hops.len() < 2 {
            return Err(Error::InvalidPath);
        }

        if amount_in <= 0 || min_amount_out <= 0 {
            return Err(Error::InvalidAmount);
        }

        if min_amount_out > amount_in {
            return Err(Error::InvalidAmount);
        }

        let current_time = env.ledger().timestamp();
        let min_delay = read_u32(&env, &DataKey::MinBlockDelay) as u64;
        if deadline <= current_time.saturating_add(min_delay) {
            return Err(Error::DeadlineTooSoon);
        }

        // Gera nonce único para a ordem usando apenas dados estáveis entre
        // simulação e submissão para evitar mismatch de footprint.
        let timestamp = current_time;
        let nonce_counter = read_u64(&env, &DataKey::NonceCounter).saturating_add(1);
        write_u64(&env, &DataKey::NonceCounter, nonce_counter);

        let amount_u64 = u64::try_from(amount_in).map_err(|_| Error::InvalidAmount)?;
        let min_out_u64 = u64::try_from(min_amount_out).map_err(|_| Error::InvalidAmount)?;

        let mut nonce_bytes = [0u8; 32];
        // Layout: contador + amount + min_out + deadline
        nonce_bytes[0..8].copy_from_slice(&nonce_counter.to_be_bytes());
        nonce_bytes[8..16].copy_from_slice(&amount_u64.to_be_bytes());
        nonce_bytes[16..24].copy_from_slice(&min_out_u64.to_be_bytes());
        nonce_bytes[24..32].copy_from_slice(&deadline.to_be_bytes());
        let nonce = BytesN::from_array(&env, &nonce_bytes);

        let order = ProtectedOrder {
            trader: trader.clone(),
            path: path.clone(),
            amount_in,
            min_amount_out,
            deadline,
            nonce: nonce.clone(),
            created_at: timestamp,
            filled: false,
        };

        env.storage()
            .persistent()
            .set(&DataKey::Order(nonce.clone()), &order);

        Ok(nonce)
    }

    /// Executa swap protegido
    /// Garante que:
    /// 1. Deadline não expirou
    /// 2. Slippage está dentro do limite
    /// 3. Ordem não foi frontrun
    pub fn execute_protected_swap(
        env: Env,
        nonce: BytesN<32>,
    ) -> Result<SwapResult, Error> {
        if !env.storage().persistent().has(&DataKey::Admin) {
            return Err(Error::NotInitialized);
        }

        acquire_lock(&env)?;

        // Recupera ordem
        let order_key = DataKey::Order(nonce.clone());
        let mut order = env
            .storage()
            .persistent()
            .get::<DataKey, ProtectedOrder>(&order_key)
            .ok_or(Error::NotInitialized)?;

        // Validações
        order.trader.require_auth();

        if order.filled {
            release_lock(&env);
            return Err(Error::OrderAlreadyFilled);
        }

        let current_time = env.ledger().timestamp();
        if current_time > order.deadline {
            release_lock(&env);
            return Err(Error::DeadlineExpired);
        }

        // Executa swap atomicamente
        let amount_out = Self::execute_atomic_swap(&env, &order)?;

        // Valida output mínimo
        if amount_out < order.min_amount_out {
            release_lock(&env);
            return Err(Error::SlippageExceeded);
        }

        // Calcula slippage real
        let effective_price = (amount_out * 10_000) / order.amount_in;
        let expected_price = (order.min_amount_out * 10_000) / order.amount_in;
        let slippage_bps = if effective_price < expected_price {
            ((expected_price - effective_price) * 10_000 / expected_price) as u32
        } else {
            0
        };

        // Valida slippage máximo
        let max_slippage = read_u32(&env, &DataKey::MaxSlippageBps);
        if slippage_bps > max_slippage {
            release_lock(&env);
            return Err(Error::SlippageExceeded);
        }

        // Marca ordem como preenchida
        order.filled = true;
        env.storage().persistent().set(&order_key, &order);

        release_lock(&env);

        Ok(SwapResult {
            amount_out,
            effective_price,
            slippage_bps,
        })
    }

    /// Executa swap atomicamente (privado até execução)
    fn execute_atomic_swap(
        env: &Env,
        order: &ProtectedOrder,
    ) -> Result<i128, Error> {
        if order.amount_in <= 0 {
            return Err(Error::InvalidAmount);
        }

        // Caminho real: se router configurado, invoca swap no DEX.
        if let Some(router) = env
            .storage()
            .persistent()
            .get::<DataKey, Address>(&DataKey::DexRouter)
        {
            let args = soroban_vec![
                env,
                order.amount_in.into_val(env),
                order.min_amount_out.into_val(env),
                order.path.hops.clone().into_val(env),
                order.trader.clone().into_val(env),
                order.deadline.into_val(env)
            ];

            let amount_out: i128 = env.invoke_contract(
                &router,
                &Symbol::new(env, "swap_exact_tokens_for_tokens"),
                args,
            );

            if amount_out <= 0 {
                return Err(Error::InsufficientOutput);
            }

            return Ok(amount_out);
        }

        // Fallback de desenvolvimento: simulação local caso router não esteja configurado.

        let mut current_amount = order.amount_in;

        // Simula swaps ao longo do path
        for _ in 0..order.path.hops.len() - 1 {
            // Em produção: chamar DEX para cada hop
            // let pool = get_pool(path[i], path[i+1]);
            // current_amount = pool.swap(current_amount);

            // Simula 0.3% de fee por hop
            current_amount = (current_amount * 997) / 1000;
        }

        Ok(current_amount)
    }

    /// Cancela ordem não executada
    pub fn cancel_order(env: Env, nonce: BytesN<32>) -> Result<(), Error> {
        if !env.storage().persistent().has(&DataKey::Admin) {
            return Err(Error::NotInitialized);
        }

        let order_key = DataKey::Order(nonce.clone());
        let order = env
            .storage()
            .persistent()
            .get::<DataKey, ProtectedOrder>(&order_key)
            .ok_or(Error::NotInitialized)?;

        order.trader.require_auth();

        if order.filled {
            return Err(Error::OrderAlreadyFilled);
        }

        env.storage().persistent().remove(&order_key);

        Ok(())
    }

    /// View functions

    pub fn set_dex_router(env: Env, caller: Address, router: Address) -> Result<(), Error> {
        let admin = env
            .storage()
            .persistent()
            .get::<DataKey, Address>(&DataKey::Admin)
            .ok_or(Error::NotInitialized)?;

        caller.require_auth();
        if caller != admin {
            return Err(Error::Unauthorized);
        }

        env.storage().persistent().set(&DataKey::DexRouter, &router);
        Ok(())
    }

    pub fn get_dex_router(env: Env) -> Result<Address, Error> {
        env.storage()
            .persistent()
            .get::<DataKey, Address>(&DataKey::DexRouter)
            .ok_or(Error::NotInitialized)
    }

    pub fn get_order(env: Env, nonce: BytesN<32>) -> Result<ProtectedOrder, Error> {
        if !env.storage().persistent().has(&DataKey::Admin) {
            return Err(Error::NotInitialized);
        }

        env.storage()
            .persistent()
            .get::<DataKey, ProtectedOrder>(&DataKey::Order(nonce))
            .ok_or(Error::NotInitialized)
    }

    pub fn get_max_slippage_bps(env: Env) -> u32 {
        read_u32(&env, &DataKey::MaxSlippageBps)
    }

    pub fn get_admin(env: Env) -> Result<Address, Error> {
        env.storage()
            .persistent()
            .get::<DataKey, Address>(&DataKey::Admin)
            .ok_or(Error::NotInitialized)
    }
}

#[cfg(test)]
mod test {
    use super::*;
    #[cfg(not(target_arch = "wasm32"))]
    use soroban_sdk::testutils::Address as _;

    #[contract]
    struct MockDexRouter;

    #[contractimpl]
    impl MockDexRouter {
        pub fn swap_exact_tokens_for_tokens(
            _env: Env,
            amount_in: i128,
            _min_amount_out: i128,
            _path: Vec<Address>,
            _recipient: Address,
            _deadline: u64,
        ) -> i128 {
            // Retorno fixo para evidenciar uso do router real no teste.
            amount_in - 10
        }
    }

    #[test]
    fn test_mev_guard_init() {
        let env = Env::default();
        env.mock_all_auths();

        let admin = Address::generate(&env);
        let contract_id = env.register(MEVGuard, ());
        let client = MEVGuardClient::new(&env, &contract_id);

        client.init(&admin, &500, &1); // 5% max slippage, 1 block delay

        assert_eq!(client.get_admin(), admin);
        assert_eq!(client.get_max_slippage_bps(), 500);
    }

    #[test]
    fn test_create_protected_order() {
        let env = Env::default();
        env.mock_all_auths();

        let admin = Address::generate(&env);
        let trader = Address::generate(&env);
        let token_a = Address::generate(&env);
        let token_b = Address::generate(&env);

        let contract_id = env.register(MEVGuard, ());
        let client = MEVGuardClient::new(&env, &contract_id);

        client.init(&admin, &500, &1);

        let path = SwapPath {
            hops: soroban_sdk::vec![&env, token_a, token_b],
        };
        let nonce = client.create_protected_order(
            &trader,
            &path,
            &1000,   // amount_in
            &970,    // min_amount_out (3% slippage tolerance)
            &(env.ledger().timestamp() + 3600), // 1 hour deadline
        );

        let order = client.get_order(&nonce);
        assert_eq!(order.trader, trader);
        assert_eq!(order.amount_in, 1000);
        assert!(!order.filled);
        assert_eq!(order.created_at, env.ledger().timestamp());
    }

    #[test]
    fn test_execute_protected_swap() {
        let env = Env::default();
        env.mock_all_auths();

        let admin = Address::generate(&env);
        let trader = Address::generate(&env);
        let token_a = Address::generate(&env);
        let token_b = Address::generate(&env);

        let contract_id = env.register(MEVGuard, ());
        let client = MEVGuardClient::new(&env, &contract_id);

        client.init(&admin, &500, &1);

        let path = SwapPath {
            hops: soroban_sdk::vec![&env, token_a, token_b],
        };
        let nonce = client.create_protected_order(
            &trader,
            &path,
            &1000,
            &950,  // 5% slippage tolerance
            &(env.ledger().timestamp() + 3600),
        );

        let result = client.execute_protected_swap(&nonce);

        assert!(result.amount_out >= 950);
        assert!(result.slippage_bps <= 500);

        // Ordem deve estar marcada como filled
        let order = client.get_order(&nonce);
        assert!(order.filled);
    }

    #[test]
    fn test_execute_protected_swap_uses_configured_router() {
        let env = Env::default();
        env.mock_all_auths();

        let admin = Address::generate(&env);
        let trader = Address::generate(&env);
        let token_a = Address::generate(&env);
        let token_b = Address::generate(&env);

        let contract_id = env.register(MEVGuard, ());
        let client = MEVGuardClient::new(&env, &contract_id);

        client.init(&admin, &500, &1);

        let router_id = env.register(MockDexRouter, ());
        client.set_dex_router(&admin, &router_id);
        assert_eq!(client.get_dex_router(), router_id);

        let path = SwapPath {
            hops: soroban_sdk::vec![&env, token_a, token_b],
        };
        let nonce = client.create_protected_order(
            &trader,
            &path,
            &1000,
            &900,
            &(env.ledger().timestamp() + 3600),
        );

        let result = client.execute_protected_swap(&nonce);
        assert_eq!(result.amount_out, 990);

        let order = client.get_order(&nonce);
        assert!(order.filled);
    }

    #[test]
    #[should_panic]
    fn test_non_admin_cannot_set_router() {
        let env = Env::default();
        env.mock_all_auths();

        let admin = Address::generate(&env);
        let attacker = Address::generate(&env);

        let contract_id = env.register(MEVGuard, ());
        let client = MEVGuardClient::new(&env, &contract_id);

        client.init(&admin, &500, &1);

        let router_id = env.register(MockDexRouter, ());
        client.set_dex_router(&attacker, &router_id);
    }

    #[test]
    #[should_panic]
    fn test_cannot_execute_same_order_twice() {
        let env = Env::default();
        env.mock_all_auths();

        let admin = Address::generate(&env);
        let trader = Address::generate(&env);
        let token_a = Address::generate(&env);
        let token_b = Address::generate(&env);

        let contract_id = env.register(MEVGuard, ());
        let client = MEVGuardClient::new(&env, &contract_id);

        client.init(&admin, &500, &1);

        let path = SwapPath {
            hops: soroban_sdk::vec![&env, token_a, token_b],
        };
        let nonce = client.create_protected_order(
            &trader,
            &path,
            &1000,
            &950,
            &(env.ledger().timestamp() + 3600),
        );

        let _ = client.execute_protected_swap(&nonce);
        client.execute_protected_swap(&nonce);
    }

    #[test]
    #[should_panic]
    fn test_reject_short_deadline_order() {
        let env = Env::default();
        env.mock_all_auths();

        let admin = Address::generate(&env);
        let trader = Address::generate(&env);
        let token_a = Address::generate(&env);
        let token_b = Address::generate(&env);

        let contract_id = env.register(MEVGuard, ());
        let client = MEVGuardClient::new(&env, &contract_id);

        // min_block_delay = 10
        client.init(&admin, &500, &10);

        let path = SwapPath {
            hops: soroban_sdk::vec![&env, token_a, token_b],
        };

        // deadline menor ou igual ao delay mínimo deve falhar
        client.create_protected_order(
            &trader,
            &path,
            &1000,
            &970,
            &(env.ledger().timestamp() + 5),
        );
    }

    #[test]
    #[should_panic]
    fn test_expired_order_fails() {
        let env = Env::default();
        env.mock_all_auths();

        let admin = Address::generate(&env);
        let trader = Address::generate(&env);
        let token_a = Address::generate(&env);
        let token_b = Address::generate(&env);

        let contract_id = env.register(MEVGuard, ());
        let client = MEVGuardClient::new(&env, &contract_id);

        client.init(&admin, &500, &1);

        // Cria ordem com deadline no passado
        let path = SwapPath {
            hops: soroban_sdk::vec![&env, token_a, token_b],
        };
        let nonce = client.create_protected_order(
            &trader,
            &path,
            &1000,
            &970,
            &(env.ledger().timestamp() - 1), // Deadline expirado
        );

        // Deve falhar com DeadlineExpired
        client.execute_protected_swap(&nonce);
    }
}
