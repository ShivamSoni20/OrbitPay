#![cfg(test)]
use super::*;
use soroban_sdk::{symbol_short, vec, Env};

#[test]
fn test_poll() {
    let env = Env::default();
    let contract_id = env.register_contract(None, PollContract);
    let client = PollContractClient::new(&env, &contract_id);

    let options = vec![&env, symbol_short!("Yes"), symbol_short!("No")];
    client.initialize(&options);

    assert_eq!(client.get_options(), options);
    assert_eq!(client.get_votes(&symbol_short!("Yes")), 0);

    client.vote(&symbol_short!("Yes"));
    assert_eq!(client.get_votes(&symbol_short!("Yes")), 1);

    client.vote(&symbol_short!("Yes"));
    assert_eq!(client.get_votes(&symbol_short!("Yes")), 2);

    client.vote(&symbol_short!("No"));
    assert_eq!(client.get_votes(&symbol_short!("No")), 1);
}

#[test]
#[should_panic(expected = "Already initialized")]
fn test_already_initialized() {
    let env = Env::default();
    let contract_id = env.register_contract(None, PollContract);
    let client = PollContractClient::new(&env, &contract_id);

    let options = vec![&env, symbol_short!("Yes")];
    client.initialize(&options);
    client.initialize(&options);
}

#[test]
#[should_panic(expected = "Invalid option")]
fn test_invalid_option() {
    let env = Env::default();
    let contract_id = env.register_contract(None, PollContract);
    let client = PollContractClient::new(&env, &contract_id);

    let options = vec![&env, symbol_short!("Yes")];
    client.initialize(&options);
    client.vote(&symbol_short!("Maybe"));
}
