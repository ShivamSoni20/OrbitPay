#![no_std]

use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, symbol_short, Address, Env, String, Symbol,
};

const FAUCET_MINT_AMOUNT: i128 = 10_000_000_000;

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    AlreadyInitialized = 1,
    InsufficientBalance = 2,
    NegativeAmount = 3,
}

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Balance(Address),
    Admin,
    Name,
    Symbol,
    Decimals,
}

#[contract]
pub struct TokenContract;

#[contractimpl]
impl TokenContract {
    /// Initialize the token metadata and admin.
    pub fn initialize(env: Env, admin: Address, decimal: u32, name: String, symbol: String) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("Already initialized");
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::Decimals, &decimal);
        env.storage().instance().set(&DataKey::Name, &name);
        env.storage().instance().set(&DataKey::Symbol, &symbol);
    }

    pub fn balance(env: Env, id: Address) -> i128 {
        env.storage().instance().get(&DataKey::Balance(id)).unwrap_or(0)
    }

    pub fn transfer(env: Env, from: Address, to: Address, amount: i128) {
        from.require_auth();
        if amount <= 0 {
            panic!("Amount must be positive");
        }
        let balance_from = Self::balance(env.clone(), from.clone());
        if balance_from < amount {
            panic!("Insufficient balance");
        }

        let balance_to = Self::balance(env.clone(), to.clone());

        env.storage()
            .instance()
            .set(&DataKey::Balance(from.clone()), &(balance_from - amount));
        env.storage()
            .instance()
            .set(&DataKey::Balance(to.clone()), &(balance_to + amount));

        // SEP-41 Events
        env.events().publish(
            (symbol_short!("transfer"), from, to),
            amount,
        );
    }

    pub fn mint(env: Env, to: Address, amount: i128) {
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();

        if amount <= 0 {
            panic!("Amount must be positive");
        }

        if amount == FAUCET_MINT_AMOUNT {
            // Public faucet path: the recipient must authorize minting exactly 1,000 OBT to self.
            to.require_auth();
        } else {
            // Admin path: retain arbitrary minting for setup and operational tasks.
            admin.require_auth();
        }

        let balance = Self::balance(env.clone(), to.clone());
        env.storage()
            .instance()
            .set(&DataKey::Balance(to), &(balance + amount));
    }

    pub fn decimals(env: Env) -> u32 {
        env.storage().instance().get(&DataKey::Decimals).unwrap_or(7)
    }

    pub fn name(env: Env) -> String {
        env.storage().instance().get(&DataKey::Name).unwrap()
    }

    pub fn symbol(env: Env) -> String {
        env.storage().instance().get(&DataKey::Symbol).unwrap()
    }
}
