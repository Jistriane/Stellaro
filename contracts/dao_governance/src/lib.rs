#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, symbol_short, Address, Env, Symbol, Vec, IntoVal, token};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum ProposalStatus {
    Pending,
    Active,
    Defeated,
    Succeeded,
    Executed,
}

#[contracttype]
#[derive(Clone, Debug)]
pub struct Proposal {
    pub id: u32,
    pub creator: Address,
    pub target: Address,
    pub action: Symbol,
    pub description: Symbol,
    pub votes_for: i128,
    pub votes_against: i128,
    pub end_ledger: u32,
    pub executed: bool,
}

#[contracttype]
pub enum DataKey {
    Admin,
    GovernanceToken,
    Proposal(u32),
    ProposalsCount,
    UserVoted(u32, Address),
    MinQuorum,
    VotingPeriod,
}

#[contract]
pub struct DaoGovernance;

#[contractimpl]
impl DaoGovernance {
    pub fn initialize(env: Env, admin: Address, token: Address, min_quorum: i128, voting_period: u32) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("already initialized");
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::GovernanceToken, &token);
        env.storage().instance().set(&DataKey::MinQuorum, &min_quorum);
        env.storage().instance().set(&DataKey::VotingPeriod, &voting_period);
        env.storage().instance().set(&DataKey::ProposalsCount, &0u32);
    }

    pub fn propose(env: Env, creator: Address, target: Address, action: Symbol, description: Symbol) -> u32 {
        creator.require_auth();
        
        let mut count: u32 = env.storage().instance().get(&DataKey::ProposalsCount).unwrap_or(0);
        count += 1;
        
        let voting_period: u32 = env.storage().instance().get(&DataKey::VotingPeriod).unwrap();
        let end_ledger = env.ledger().sequence() + voting_period;

        let proposal = Proposal {
            id: count,
            creator,
            target,
            action,
            description,
            votes_for: 0,
            votes_against: 0,
            end_ledger,
            executed: false,
        };

        env.storage().instance().set(&DataKey::Proposal(count), &proposal);
        env.storage().instance().set(&DataKey::ProposalsCount, &count);
        
        count
    }

    pub fn vote(env: Env, voter: Address, proposal_id: u32, support: bool) {
        voter.require_auth();
        
        if env.storage().instance().has(&DataKey::UserVoted(proposal_id, voter.clone())) {
            panic!("already voted");
        }

        let mut proposal: Proposal = env.storage().instance().get(&DataKey::Proposal(proposal_id)).expect("proposal not found");
        
        if env.ledger().sequence() > proposal.end_ledger {
            panic!("voting ended");
        }

        // Votação ponderada pelo balance do token
        let token_addr: Address = env.storage().instance().get(&DataKey::GovernanceToken).unwrap();
        let client = token::Client::new(&env, &token_addr);
        let weight = client.balance(&voter);

        if weight == 0 {
            panic!("no voting power");
        }

        if support {
            proposal.votes_for += weight;
        } else {
            proposal.votes_against += weight;
        }

        env.storage().instance().set(&DataKey::Proposal(proposal_id), &proposal);
        env.storage().instance().set(&DataKey::UserVoted(proposal_id, voter), &true);
    }

    pub fn execute(env: Env, proposal_id: u32) {
        let mut proposal: Proposal = env.storage().instance().get(&DataKey::Proposal(proposal_id)).expect("proposal not found");
        
        if proposal.executed {
            panic!("already executed");
        }

        if env.ledger().sequence() <= proposal.end_ledger {
            panic!("voting still active");
        }

        let min_quorum: i128 = env.storage().instance().get(&DataKey::MinQuorum).unwrap();
        
        if proposal.votes_for > proposal.votes_against && proposal.votes_for >= min_quorum {
            let governance_addr = env.current_contract_address();
            let args = soroban_sdk::vec![&env, governance_addr.into_val(&env)];
            
            env.invoke_contract::<()>(&proposal.target, &proposal.action, args);
            
            proposal.executed = true;
            env.storage().instance().set(&DataKey::Proposal(proposal_id), &proposal);
        } else {
            panic!("proposal rejected or quorum not met");
        }
    }

    pub fn get_proposal(env: Env, proposal_id: u32) -> Proposal {
        env.storage().instance().get(&DataKey::Proposal(proposal_id)).expect("not found")
    }
}
