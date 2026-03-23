use soroban_sdk::{contract, contractimpl, symbol_short, vec, Address, Env, Symbol, Vec};

mod token_contract {
    soroban_sdk::contractimport!(file = "../../target/wasm32-unknown-unknown/release/orbittoken.wasm");
}


#[contract]
pub struct PollContract;

#[contractimpl]
impl PollContract {
    /// Initialize the poll with options.
    pub fn initialize(env: Env, options: Vec<Symbol>) {
        if env.storage().instance().has(&symbol_short!("opts")) {
            panic!("Already initialized");
        }
        env.storage().instance().set(&symbol_short!("opts"), &options);

        for i in 0..options.len() {
            let opt = options.get(i).unwrap();
            env.storage().instance().set(&opt, &0u32);
        }
    }

    /// Register the OBT token contract for inter-contract calls.
    pub fn set_token(env: Env, token_id: Address) {
        env.storage().instance().set(&symbol_short!("token"), &token_id);
    }


    /// Cast a vote for a specific option.
    pub fn vote(env: Env, voter: Address, option: Symbol) {
        voter.require_auth();

        // --- Inter-contract Call: Check OBT Balance ---
        if let Some(token_id) = env.storage().instance().get::<_, Address>(&symbol_short!("token")) {
            let client = token_contract::Client::new(&env, &token_id);
            let balance = client.balance(&voter);
            if balance < 10_000_000 { // Must have at least 1 OBT (stroops)
                 panic!("Insufficient OBT balance to vote. Hold >1 OBT.");
            }
        }

        let options: Vec<Symbol> = env.storage().instance().get(&symbol_short!("opts")).unwrap();
        // ... rest of vote logic
        let mut found = false;
        for i in 0..options.len() {
            let opt = options.get(i).unwrap();
            if opt == option {
                found = true;
                break;
            }
        }

        if !found {
            panic!("Invalid option");
        }

        let current_votes: u32 = env.storage().instance().get(&option).unwrap_or(0);
        let new_votes = current_votes + 1;
        env.storage().instance().set(&option, &new_votes);

        // Emit event for real-time synchronization
        env.events().publish((symbol_short!("vote"), option), new_votes);
    }


    /// Get current results.
    pub fn get_votes(env: Env, option: Symbol) -> u32 {
        env.storage().instance().get(&option).unwrap_or(0)
    }

    /// Get all options.
    pub fn get_options(env: Env) -> Vec<Symbol> {
        env.storage().instance().get(&symbol_short!("opts")).unwrap_or(vec![&env])
    }
}

#[cfg(test)]
mod test;
