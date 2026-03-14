#![no_std]
use soroban_sdk::{contract, contractimpl, symbol_short, vec, Env, Symbol, Vec, log};

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
        
        for option in options.iter() {
            env.storage().instance().set(&option, &0u32);
        }
    }

    /// Cast a vote for a specific option.
    pub fn vote(env: Env, option: Symbol) {
        let options: Vec<Symbol> = env.storage().instance().get(&symbol_short!("opts")).unwrap();
        
        let mut found = false;
        for opt in options.iter() {
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
        
        log!(&env, "Vote cast for: {}", option);
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
