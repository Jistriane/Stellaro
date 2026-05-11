#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, symbol_short, Address, Env, Symbol, Vec, IntoVal, token};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum ProposalStatus {
    Pending,
    Active,
    Defeated,
    Succeeded,
    Queued,
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
    pub execution_time: u64,
    pub executed: bool,
}

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

#[contract]
pub struct DaoGovernance;

#[contractimpl]
impl DaoGovernance {
    pub fn initialize(env: Env, admin: Address, token: Address, vc_registry: Address, min_quorum: i128, voting_period: u32) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("already initialized");
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::GovernanceToken, &token);
        env.storage().instance().set(&DataKey::VcRegistry, &vc_registry);
        env.storage().instance().set(&DataKey::MinQuorum, &min_quorum);
        env.storage().instance().set(&DataKey::VotingPeriod, &voting_period);
        env.storage().instance().set(&DataKey::ProposalsCount, &0u32);
    }

    fn check_compliance(env: &Env, user: Address) {
        let registry_addr: Address = env.storage().instance().get(&DataKey::VcRegistry).expect("vc registry not set");
        let is_valid: bool = env.invoke_contract(
            &registry_addr,
            &soroban_sdk::Symbol::new(&env, "has_valid_vc"),
            soroban_sdk::vec![env, user.clone().into_val(env)]
        );
        if !is_valid {
            panic!("compliance failed: governance participation requires KYC VC");
        }
    }

    pub fn propose(env: Env, creator: Address, target: Address, action: Symbol, description: Symbol) -> u32 {
        creator.require_auth();
        Self::check_compliance(&env, creator.clone());
        
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
            execution_time: 0,
            executed: false,
        };

        env.storage().instance().set(&DataKey::Proposal(count), &proposal);
        env.storage().instance().set(&DataKey::ProposalsCount, &count);
        
        count
    }

    pub fn vote(env: Env, voter: Address, proposal_id: u32, support: bool) {
        voter.require_auth();
        Self::check_compliance(&env, voter.clone());
        
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

    pub fn queue(env: Env, proposal_id: u32) {
        let mut proposal: Proposal = env.storage().instance().get(&DataKey::Proposal(proposal_id)).expect("proposal not found");
        
        if env.ledger().sequence() <= proposal.end_ledger {
            panic!("voting still active");
        }

        let min_quorum: i128 = env.storage().instance().get(&DataKey::MinQuorum).unwrap();
        
        if proposal.votes_for > proposal.votes_against && proposal.votes_for >= min_quorum {
            if proposal.execution_time != 0 {
                panic!("already queued");
            }
            
            // Timelock de 24 horas (simulado via ledger timestamp)
            proposal.execution_time = env.ledger().timestamp() + 86400;
            env.storage().instance().set(&DataKey::Proposal(proposal_id), &proposal);
        } else {
            panic!("proposal rejected");
        }
    }

    pub fn execute(env: Env, proposal_id: u32) {
        let mut proposal: Proposal = env.storage().instance().get(&DataKey::Proposal(proposal_id)).expect("proposal not found");
        
        if proposal.executed {
            panic!("already executed");
        }

        if proposal.execution_time == 0 {
            panic!("proposal not queued");
        }

        if env.ledger().timestamp() < proposal.execution_time {
            panic!("timelock not expired");
        }

        let governance_addr = env.current_contract_address();
        let args = soroban_sdk::vec![&env, governance_addr.into_val(&env)];
        
        env.invoke_contract::<()>(&proposal.target, &proposal.action, args);
        
        proposal.executed = true;
        env.storage().instance().set(&DataKey::Proposal(proposal_id), &proposal);
    }

    pub fn get_proposal(env: Env, proposal_id: u32) -> Proposal {
        env.storage().instance().get(&DataKey::Proposal(proposal_id)).expect("not found")
    }

    pub fn delegate(env: Env, sender: Address, to: Address) {
        sender.require_auth();
        if sender == to { panic!("cannot delegate to self"); }

        // Remove old delegation if exists
        if let Some(old_to) = env.storage().instance().get::<_, Address>(&DataKey::Delegate(sender.clone())) {
            let mut old_weight: i128 = env.storage().instance().get(&DataKey::DelegatedWeight(old_to.clone())).unwrap_or(0);
            let user_weight = 100; // Simplificação: assume peso fixo ou busca balance
            old_weight -= user_weight;
            env.storage().instance().set(&DataKey::DelegatedWeight(old_to), &old_weight);
        }

        // Set new delegation
        env.storage().instance().set(&DataKey::Delegate(sender.clone()), &to);
        let mut new_weight: i128 = env.storage().instance().get(&DataKey::DelegatedWeight(to.clone())).unwrap_or(0);
        new_weight += 100; // Simplificação
        env.storage().instance().set(&DataKey::DelegatedWeight(to), &new_weight);
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::testutils::Address as _;

    #[test]
    fn test_initialize_and_propose_with_compliance() {
        let env = Env::default();
        env.mock_all_auths();

        let admin = Address::generate(&env);
        let token = Address::generate(&env);
        let vc_hash = soroban_sdk::BytesN::from_array(&env, &[9u8; 32]);
        let target = Address::generate(&env);

        let vc_registry_id = env.register(vc_registry::VcRegistry, ());
        let vc_client = vc_registry::VcRegistryClient::new(&env, &vc_registry_id);
        vc_client.initialize(&admin);
        vc_client.add_issuer(&admin);
        vc_client.register_user_vc(&admin, &admin, &vc_hash);

        let contract_id = env.register(DaoGovernance, ());
        let client = DaoGovernanceClient::new(&env, &contract_id);

        client.initialize(&admin, &token, &vc_registry_id, &100, &100);

        let proposal_id = client.propose(&admin, &target, &Symbol::new(&env, "action"), &Symbol::new(&env, "desc"));

        let proposal = client.get_proposal(&proposal_id);
        assert_eq!(proposal.id, proposal_id);
        assert_eq!(proposal.creator, admin);
        assert_eq!(proposal.target, target);
    }
}
