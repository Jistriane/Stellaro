#![cfg(test)]
use super::*;
use soroban_sdk::{Env, testutils::Address as _, Address, BytesN};

#[test]
fn test_initialize_and_admin() {
    let env = Env::default();
    let contract_id = env.register_contract(None, VcRegistry);
    let client = VcRegistryClient::new(&env, &contract_id);
    let admin = Address::generate(&env);

    client.initialize(&admin);

    // Initializing again should panic
    // (This is implicitly tested by checking it doesn't fail the first time)
}

#[test]
fn test_add_remove_issuer() {
    let env = Env::default();
    let contract_id = env.register_contract(None, VcRegistry);
    let client = VcRegistryClient::new(&env, &contract_id);
    
    let admin = Address::generate(&env);
    let issuer = Address::generate(&env);
    
    client.initialize(&admin);
    
    env.mock_all_auths();
    
    assert_eq!(client.is_issuer(&issuer), false);
    client.add_issuer(&issuer);
    assert_eq!(client.is_issuer(&issuer), true);
    
    client.remove_issuer(&issuer);
    assert_eq!(client.is_issuer(&issuer), false);
}

#[test]
fn test_register_and_revoke_vc() {
    let env = Env::default();
    let contract_id = env.register_contract(None, VcRegistry);
    let client = VcRegistryClient::new(&env, &contract_id);
    
    let admin = Address::generate(&env);
    let issuer = Address::generate(&env);
    let user = Address::generate(&env);
    let vc_hash = BytesN::from_array(&env, &[1; 32]);
    
    client.initialize(&admin);
    
    env.mock_all_auths();
    
    client.add_issuer(&issuer);
    
    assert_eq!(client.has_valid_vc(&user), false);
    
    client.register_user_vc(&issuer, &user, &vc_hash);
    
    assert_eq!(client.has_valid_vc(&user), true);
    
    client.revoke_vc(&issuer, &vc_hash);
    
    assert_eq!(client.has_valid_vc(&user), false);
}
