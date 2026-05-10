#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, Address, Env, symbol_short};

#[test]
fn test_initialization() {
    let env = Env::default();
    let admin = Address::generate(&env);

    let contract_id = env.register_contract(None, RecurringPayments);
    let client = RecurringPaymentsClient::new(&env, &contract_id);

    client.initialize(&admin);
}

#[test]
#[should_panic(expected = "already initialized")]
fn test_double_initialization() {
    let env = Env::default();
    let admin = Address::generate(&env);

    let contract_id = env.register_contract(None, RecurringPayments);
    let client = RecurringPaymentsClient::new(&env, &contract_id);

    client.initialize(&admin);
    client.initialize(&admin);
}
