#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::{Address as _, Ledger}, Address, Env, Symbol, symbol_short};

#[test]
fn test_initialization() {
    let env = Env::default();
    let admin = Address::generate(&env);
    let vc_registry = Address::generate(&env);
    let name = symbol_short!("RWA");

    let contract_id = env.register_contract(None, RwaTokenizer);
    let client = RwaTokenizerClient::new(&env, &contract_id);

    client.initialize(&admin, &vc_registry, &name);
}

#[test]
#[should_panic(expected = "already initialized")]
fn test_double_initialization() {
    let env = Env::default();
    let admin = Address::generate(&env);
    let vc_registry = Address::generate(&env);
    let name = symbol_short!("RWA");

    let contract_id = env.register_contract(None, RwaTokenizer);
    let client = RwaTokenizerClient::new(&env, &contract_id);

    client.initialize(&admin, &vc_registry, &name);
    client.initialize(&admin, &vc_registry, &name);
}
