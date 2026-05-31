#![no_std]
use soroban_sdk::{
    contract, contractevent, contractimpl, contracttype, Address, Env, IntoVal, Symbol, Vec,
};

#[contracttype]
pub enum DataKey {
    Admin,
    GovernanceToken,
    VcRegistry,
    Proposal(u32),
    ProposalsCount,
    UserVoted(u32, Address),
    MinQuorum,
    VotingPeriod,
    Delegate(Address),
    DelegatedWeight(Address),
}

#[contracttype]
#[derive(Clone, Debug)]
pub struct Proposal {
    pub id: u32,
    pub creator: Address,
    pub description: Symbol,
    pub yes_votes: u32,
    pub no_votes: u32,
    pub created_at: u64,
}

#[contractevent]
pub struct UpgradeEvent {
    pub new_wasm_hash: soroban_sdk::BytesN<32>,
}

#[contractevent]
pub struct ProposeEvent {
    pub proposal_id: u32,
    pub creator: Address,
}

#[contractevent]
pub struct VoteEvent {
    pub proposal_id: u32,
    pub voter: Address,
    pub support: bool,
}

#[contract]
pub struct DaoGovernance;

#[contractimpl]
impl DaoGovernance {
    pub fn initialize(env: Env, admin: Address, token: Address, vc_registry: Address) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("already initialized");
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::GovernanceToken, &token);
        env.storage().instance().set(&DataKey::VcRegistry, &vc_registry);
        env.storage().instance().set(&DataKey::ProposalsCount, &0u32);
        env.storage().instance().set(&DataKey::MinQuorum, &1000i128); // 1000 tokens
        env.storage().instance().set(&DataKey::VotingPeriod, &604800u64); // 7 dias
    }

    fn check_compliance(env: &Env, user: Address) {
        let registry_addr: Address = env.storage().instance().get(&DataKey::VcRegistry).expect("vc registry not set");
        let is_valid: bool = env.invoke_contract(
            &registry_addr,
            &soroban_sdk::Symbol::new(env, "has_valid_vc"),
            soroban_sdk::vec![env, user.clone().into_val(env)]
        );
        if !is_valid {
            panic!("compliance failed: user needs KYC VC for DAO");
        }
    }

    pub fn propose(env: Env, creator: Address, description: Symbol) -> u32 {
        creator.require_auth();
        Self::check_compliance(&env, creator.clone());

        let mut count: u32 = env.storage().instance().get(&DataKey::ProposalsCount).unwrap_or(0);
        count += 1;
        
        let proposal = Proposal {
            id: count,
            creator: creator.clone(),
            description,
            yes_votes: 0,
            no_votes: 0,
            created_at: env.ledger().timestamp(),
        };
        env.storage()
            .persistent()
            .set(&DataKey::Proposal(count), &proposal);

        env.storage().instance().set(&DataKey::ProposalsCount, &count);
        
        env.events().publish_event(&ProposeEvent { proposal_id: count, creator });
        count
    }

    pub fn vote(env: Env, voter: Address, proposal_id: u32, support: bool) {
        voter.require_auth();
        Self::check_compliance(&env, voter.clone());

        if env.storage().persistent().has(&DataKey::UserVoted(proposal_id, voter.clone())) {
            panic!("already voted");
        }

        // Registrar voto
        env.storage().persistent().set(&DataKey::UserVoted(proposal_id, voter.clone()), &true);

        let mut proposal: Proposal = env
            .storage()
            .persistent()
            .get(&DataKey::Proposal(proposal_id))
            .expect("proposal not found");
        if support {
            proposal.yes_votes = proposal.yes_votes.saturating_add(1);
        } else {
            proposal.no_votes = proposal.no_votes.saturating_add(1);
        }
        env.storage()
            .persistent()
            .set(&DataKey::Proposal(proposal_id), &proposal);
        
        env.events().publish_event(&VoteEvent { proposal_id, voter, support });
    }

    pub fn proposals_count(env: Env) -> u32 {
        env.storage()
            .instance()
            .get(&DataKey::ProposalsCount)
            .unwrap_or(0)
    }

    pub fn get_proposal(env: Env, proposal_id: u32) -> Proposal {
        env.storage()
            .persistent()
            .get(&DataKey::Proposal(proposal_id))
            .expect("proposal not found")
    }

    pub fn list_proposals(env: Env, start: u32, limit: u32) -> Vec<Proposal> {
        let total: u32 = env
            .storage()
            .instance()
            .get(&DataKey::ProposalsCount)
            .unwrap_or(0);

        let mut out: Vec<Proposal> = Vec::new(&env);
        let mut i = start;
        let end = start.saturating_add(limit);
        while i > 0 && i <= total && i < end {
            if let Some(p) = env.storage().persistent().get(&DataKey::Proposal(i)) {
                out.push_back(p);
            }
            i += 1;
        }
        out
    }

    pub fn delegate(env: Env, from: Address, to: Address) {
        from.require_auth();
        Self::check_compliance(&env, from.clone());
        Self::check_compliance(&env, to.clone());

        env.storage().instance().set(&DataKey::Delegate(from), &to);
        
        let mut new_weight: i128 = env.storage().instance().get(&DataKey::DelegatedWeight(to.clone())).unwrap_or(0);
        new_weight += 100; // Simplificação
        env.storage().instance().set(&DataKey::DelegatedWeight(to), &new_weight);
    }

    pub fn upgrade(env: Env, caller: Address, new_wasm_hash: soroban_sdk::BytesN<32>) {
        let admin: Address = env.storage().instance().get(&DataKey::Admin).expect("not initialized");
        caller.require_auth();
        assert!(caller == admin, "unauthorized");
        
        env.deployer().update_current_contract_wasm(new_wasm_hash.clone());
        env.events().publish_event(&UpgradeEvent { new_wasm_hash });
    }
}
