#![cfg(test)]

use super::*;
use soroban_sdk::{testutils::Address as _, Address, Env};

#[test]
fn test_initialization() {
    let env = Env::default();
    env.mock_all_auths();
    let admin = Address::generate(&env);
    let issuer = Address::generate(&env);

    let vc_registry_id = env.register(vc_registry::VcRegistry, ());
    let vc_registry = vc_registry::VcRegistryClient::new(&env, &vc_registry_id);
    vc_registry.initialize(&admin);
    vc_registry.add_issuer(&issuer);

    let contract_id = env.register_contract(None, RecurringPayments);
    let client = RecurringPaymentsClient::new(&env, &contract_id);

    client.initialize(&admin, &vc_registry_id);
}

#[test]
#[should_panic(expected = "already initialized")]
fn test_double_initialization() {
    let env = Env::default();
    env.mock_all_auths();
    let admin = Address::generate(&env);
    let issuer = Address::generate(&env);

    let vc_registry_id = env.register(vc_registry::VcRegistry, ());
    let vc_registry = vc_registry::VcRegistryClient::new(&env, &vc_registry_id);
    vc_registry.initialize(&admin);
    vc_registry.add_issuer(&issuer);

    let contract_id = env.register_contract(None, RecurringPayments);
    let client = RecurringPaymentsClient::new(&env, &contract_id);

    client.initialize(&admin, &vc_registry_id);
    client.initialize(&admin, &vc_registry_id);
}
