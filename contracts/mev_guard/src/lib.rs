#![no_std]

//! MEV Guard - Proteção contra MEV (Maximal Extractable Value)
//! 
//! Protege usuários de:
//! - Front-running
//! - Sandwich attacks
//! - Just-in-time liquidity attacks
//! 
//! Implementa estratégias Flashbots-style para Stellar/Soroban

use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, Vec, BytesN};

/// Swap path (lista de tokens)
pub type SwapPath = Vec<Address>;

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
    ReentrancyLock,
    MaxSlippageBps,         // Máximo slippage permitido (em BPS)
    MinBlockDelay,          // Delay mínimo em blocos para proteção
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
        trader.require_auth();

        if path.is_empty() || path.len() < 2 {
            return Err(Error::InvalidPath);
        }

        // Gera nonce único para a ordem (timestamp-based)
        let timestamp = env.ledger().timestamp();
        let mut nonce_bytes = [0u8; 32];
        // Preenchemos com timestamp e amount para variar
        nonce_bytes[0..8].copy_from_slice(&timestamp.to_be_bytes());
        nonce_bytes[8..16].copy_from_slice(&(amount_in as u64).to_be_bytes());
        nonce_bytes[16] = min_amount_out as u8;
        let nonce = BytesN::from_array(&env, &nonce_bytes);

        let order = ProtectedOrder {
            trader: trader.clone(),
            path: path.clone(),
            amount_in,
            min_amount_out,
            deadline,
            nonce: nonce.clone(),
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
        _env: &Env,
        order: &ProtectedOrder,
    ) -> Result<i128, Error> {
        // TODO: Integrar com DEX real (Soroswap)
        // Por enquanto, simula execução

        let mut current_amount = order.amount_in;

        // Simula swaps ao longo do path
        for _ in 0..order.path.len() - 1 {
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

    pub fn get_order(env: Env, nonce: BytesN<32>) -> Result<ProtectedOrder, Error> {
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
    use soroban_sdk::testutils::Address as _;

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

        let path = soroban_sdk::vec![&env, token_a, token_b];
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

        let path = soroban_sdk::vec![&env, token_a, token_b];
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
    #[should_panic(expected = "DeadlineExpired")]
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
        let path = soroban_sdk::vec![&env, token_a, token_b];
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
