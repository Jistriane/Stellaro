#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, Env, Symbol, Vec, Map, IntoVal};

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Transaction {
    pub target: Address,
    pub function: Symbol,
    pub args: Vec<soroban_sdk::Val>,
    pub confirmations: u32,
    pub executed: bool,
}

#[contracttype]
pub enum DataKey {
    Owners,
    Threshold,
    Transaction(u32),
    TxCount,
    IsOwner(Address),
    HasConfirmed(u32, Address),
}

#[contract]
pub struct MultisigAdapter;

#[contractimpl]
impl MultisigAdapter {
    pub fn initialize(env: Env, owners: Vec<Address>, threshold: u32) {
        if env.storage().instance().has(&DataKey::Owners) {
            panic!("already initialized");
        }
        if threshold == 0 || threshold > owners.len() {
            panic!("invalid threshold");
        }

        env.storage().instance().set(&DataKey::Owners, &owners);
        env.storage().instance().set(&DataKey::Threshold, &threshold);
        env.storage().instance().set(&DataKey::TxCount, &0u32);

        for owner in owners.iter() {
            env.storage().instance().set(&DataKey::IsOwner(owner), &true);
        }
    }

    pub fn submit_transaction(env: Env, sender: Address, target: Address, function: Symbol, args: Vec<soroban_sdk::Val>) -> u32 {
        sender.require_auth();
        if !env.storage().instance().has(&DataKey::IsOwner(sender.clone())) {
            panic!("not owner");
        }

        let mut count: u32 = env.storage().instance().get(&DataKey::TxCount).unwrap_or(0);
        count += 1;

        let tx = Transaction {
            target,
            function,
            args,
            confirmations: 0,
            executed: false,
        };

        env.storage().instance().set(&DataKey::Transaction(count), &tx);
        env.storage().instance().set(&DataKey::TxCount, &count);
        
        count
    }

    pub fn confirm_transaction(env: Env, sender: Address, tx_id: u32) {
        sender.require_auth();
        if !env.storage().instance().has(&DataKey::IsOwner(sender.clone())) {
            panic!("not owner");
        }

        if env.storage().instance().has(&DataKey::HasConfirmed(tx_id, sender.clone())) {
            panic!("already confirmed");
        }

        let mut tx: Transaction = env.storage().instance().get(&DataKey::Transaction(tx_id)).expect("not found");
        if tx.executed {
            panic!("already executed");
        }

        tx.confirmations += 1;
        env.storage().instance().set(&DataKey::Transaction(tx_id), &tx);
        env.storage().instance().set(&DataKey::HasConfirmed(tx_id, sender), &true);

        let threshold: u32 = env.storage().instance().get(&DataKey::Threshold).unwrap();
        if tx.confirmations >= threshold {
            Self::execute_transaction(env, tx_id);
        }
    }

    fn execute_transaction(env: Env, tx_id: u32) {
        let mut tx: Transaction = env.storage().instance().get(&DataKey::Transaction(tx_id)).expect("not found");
        if tx.executed {
            panic!("already executed");
        }

        // Execute the call
        env.invoke_contract::<()>(&tx.target, &tx.function, tx.args.clone());

        tx.executed = true;
        env.storage().instance().set(&DataKey::Transaction(tx_id), &tx);
    }

    /// Permite propor a transferência de propriedade de um contrato externo gerenciado por este multisig
    pub fn propose_ownership_transfer(env: Env, sender: Address, target_contract: Address, new_owner: Address) -> u32 {
        sender.require_auth();
        if !env.storage().instance().has(&DataKey::IsOwner(sender.clone())) {
            panic!("not owner");
        }

        let mut count: u32 = env.storage().instance().get(&DataKey::TxCount).unwrap_or(0);
        count += 1;

        let args = soroban_sdk::vec![&env, new_owner.into_val(&env)];
        let tx = Transaction {
            target: target_contract,
            function: soroban_sdk::Symbol::new(&env, "transfer_ownership"),
            args,
            confirmations: 0,
            executed: false,
        };

        env.storage().instance().set(&DataKey::Transaction(count), &tx);
        env.storage().instance().set(&DataKey::TxCount, &count);
        
        count
    }
}
