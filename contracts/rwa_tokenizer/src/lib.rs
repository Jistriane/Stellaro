#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, symbol_short, Address, Env, Symbol, BytesN, IntoVal, token};


#[contract]
pub struct RwaTokenizer;

#[contracttype]
#[derive(Clone)]
enum DataKey {
    Admin,
    VcRegistry,
    Balance(Address),
    TotalSupply,
    Metadata(Symbol),
    Snapshot(u32, Address), // (snapshot_id, user_address) -> balance
    SnapshotTotal(u32),     // snapshot_id -> total_supply
    SnapshotCount,
    Proposal(u32),          // proposal_id -> RwaProposal
}

#[contracttype]
#[derive(Clone, Debug)]
pub struct RwaProposal {
    pub id: u32,
    pub snapshot_id: u32,
    pub description: Symbol,
    pub votes_for: i128,
    pub votes_against: i128,
    pub end_time: u64,
    pub executed: bool,
}

#[contractimpl]
impl RwaTokenizer {
    pub fn initialize(env: Env, admin: Address, vc_registry: Address, name: Symbol) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("already initialized");
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::VcRegistry, &vc_registry);
        env.storage().instance().set(&DataKey::Metadata(symbol_short!("name")), &name);
    }

    fn get_admin(env: &Env) -> Address {
        env.storage().instance().get(&DataKey::Admin).expect("not initialized")
    }

    fn get_vc_registry(env: &Env) -> Address {
        env.storage().instance().get(&DataKey::VcRegistry).expect("not initialized")
    }

    fn check_compliance(env: &Env, user: Address) {
        let registry_addr = Self::get_vc_registry(env);
        
        // Alinhado com VcRegistry: chamando has_valid_vc
        let is_valid: bool = env.invoke_contract(
            &registry_addr,
            &soroban_sdk::Symbol::new(&env, "has_valid_vc"),
            soroban_sdk::vec![env, user.clone().into_val(env)]
        );
        
        if !is_valid {
            // Emits an event to alert the ElizaOS RiskGuardian
            env.events().publish(
                (symbol_short!("COMPLIAN"), symbol_short!("FAIL"), user),
                symbol_short!("REVOKED")
            );
            panic!("user does not meet compliance (invalid or missing VC)");
        }
    }

    /// Admin-only: Force transfer of tokens for compliance/regulatory reasons
    /// This is a critical safety feature for regulated RWA markets
    pub fn force_transfer(env: Env, from: Address, to: Address, amount: i128) {
        let admin = Self::get_admin(&env);
        admin.require_auth();

        let mut from_balance = env.storage().persistent().get(&DataKey::Balance(from.clone())).unwrap_or(0);
        if from_balance < amount {
            panic!("insufficient balance for force transfer");
        }

        from_balance -= amount;
        env.storage().persistent().set(&DataKey::Balance(from), &from_balance);

        let mut to_balance = env.storage().persistent().get(&DataKey::Balance(to.clone())).unwrap_or(0);
        to_balance += amount;
        env.storage().persistent().set(&DataKey::Balance(to), &to_balance);
        
        env.events().publish(
            (symbol_short!("FORCE"), symbol_short!("XFER")),
            amount
        );
    }

    pub fn mint(env: Env, to: Address, amount: i128) {
        let admin = Self::get_admin(&env);
        admin.require_auth();
        
        Self::check_compliance(&env, to.clone());

        let mut balance = env.storage().persistent().get(&DataKey::Balance(to.clone())).unwrap_or(0);
        balance += amount;
        env.storage().persistent().set(&DataKey::Balance(to), &balance);

        let mut total_supply = env.storage().instance().get(&DataKey::TotalSupply).unwrap_or(0);
        total_supply += amount;
        env.storage().instance().set(&DataKey::TotalSupply, &total_supply);
    }

    pub fn transfer(env: Env, from: Address, to: Address, amount: i128) {
        from.require_auth();
        
        Self::check_compliance(&env, from.clone());
        Self::check_compliance(&env, to.clone());

        let mut from_balance = env.storage().persistent().get(&DataKey::Balance(from.clone())).unwrap_or(0);
        if from_balance < amount {
            panic!("insufficient balance");
        }

        from_balance -= amount;
        env.storage().persistent().set(&DataKey::Balance(from), &from_balance);

        let mut to_balance = env.storage().persistent().get(&DataKey::Balance(to.clone())).unwrap_or(0);
        to_balance += amount;
        env.storage().persistent().set(&DataKey::Balance(to), &to_balance);
    }

    /// Distribui dividendos para um holder específico (Simplificado para o MVP)
    /// Em produção, isso seria uma iteração ou snapshot
    pub fn distribute_dividend(env: Env, holder: Address, token_addr: Address, amount: i128) {
        let admin = Self::get_admin(&env);
        admin.require_auth();

        let client = token::Client::new(&env, &token_addr);
        client.transfer(&env.current_contract_address(), &holder, &amount);
    }

    pub fn balance_of(env: Env, user: Address) -> i128 {
        env.storage().persistent().get(&DataKey::Balance(user)).unwrap_or(0)
    }

    pub fn total_supply(env: Env) -> i128 {
        env.storage().instance().get(&DataKey::TotalSupply).unwrap_or(0)
    }

    /// Cria um snapshot do estado atual de holders (usado para votação)
    pub fn create_snapshot(env: Env) -> u32 {
        let admin = Self::get_admin(&env);
        admin.require_auth();

        let mut count: u32 = env.storage().instance().get(&DataKey::SnapshotCount).unwrap_or(0);
        count += 1;
        
        let total = Self::total_supply(env.clone());
        env.storage().instance().set(&DataKey::SnapshotTotal(count), &total);
        env.storage().instance().set(&DataKey::SnapshotCount, &count);
        
        // Em produção, usaríamos um padrão de "checkpoint" eficiente em storage.
        // Aqui simulamos o ID do snapshot.
        count
    }

    pub fn propose_action(env: Env, creator: Address, snapshot_id: u32, description: Symbol) -> u32 {
        creator.require_auth();
        Self::check_compliance(&env, creator.clone());

        // Apenas holders no momento do snapshot podem propor? (Opcional)
        
        let mut count: u32 = env.storage().instance().get(&DataKey::SnapshotCount).unwrap_or(0); // Reusando contador para simplificar
        count += 1;

        let proposal = RwaProposal {
            id: count,
            snapshot_id,
            description,
            votes_for: 0,
            votes_against: 0,
            end_time: env.ledger().timestamp() + 604800, // 7 dias
            executed: false,
        };

        env.storage().instance().set(&DataKey::Proposal(count), &proposal);
        count
    }

    pub fn vote_action(env: Env, voter: Address, proposal_id: u32, support: bool) {
        voter.require_auth();
        let mut proposal: RwaProposal = env.storage().instance().get(&DataKey::Proposal(proposal_id)).expect("not found");
        
        if env.ledger().timestamp() > proposal.end_time {
            panic!("voting ended");
        }

        // Recupera o balanço do usuário NO MOMENTO do snapshot
        // Em produção: o contrato buscaria no histórico de checkpoints.
        // Aqui simulamos buscando o balance atual se for o snapshot mais recente.
        let weight = Self::balance_of(env.clone(), voter);
        
        if support {
            proposal.votes_for += weight;
        } else {
            proposal.votes_against += weight;
        }

        env.storage().instance().set(&DataKey::Proposal(proposal_id), &proposal);
    }
}

#[cfg(test)]
mod test;
