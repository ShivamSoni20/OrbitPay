#![no_std]

use soroban_sdk::{contract, contractclient, contracterror, contractimpl, contracttype, Address, Env, Symbol};

#[contractclient(name = "TokenClient")]
pub trait Token {
    fn transfer(env: Env, from: Address, to: Address, amount: i128);
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum StreamStatus {
    Active,
    Paused,
    Cancelled,
    Completed,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Stream {
    pub id: u64,
    pub admin: Address,
    pub recipient: Address,
    pub token_contract: Address,
    pub token_type: Symbol,
    pub total_amount: i128,
    pub claimed_amount: i128,
    pub start_time: u64,
    pub end_time: u64,
    pub paused_at: u64,
    pub total_paused: u64,
    pub status: StreamStatus,
}

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    Stream(u64),
    NextStreamId,
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum PayrollError {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    InvalidTimeRange = 3,
    InvalidAmount = 4,
    StreamNotFound = 5,
    NotStreamAdmin = 6,
    NotRecipient = 7,
    StreamNotActive = 8,
    NothingToClaim = 9,
}

#[contract]
pub struct PayrollContract;

#[contractimpl]
impl PayrollContract {
    pub fn initialize(env: Env, admin: Address) -> Result<(), PayrollError> {
        if env.storage().instance().has(&DataKey::Admin) {
            return Err(PayrollError::AlreadyInitialized);
        }
        admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::NextStreamId, &1u64);
        Ok(())
    }

    pub fn create_stream(
        env: Env,
        admin: Address,
        recipient: Address,
        token_contract: Address,
        token_type: Symbol,
        total_amount: i128,
        start_time: u64,
        end_time: u64,
    ) -> Result<u64, PayrollError> {
        admin.require_auth();
        Self::ensure_initialized(&env)?;
        if total_amount <= 0 {
            return Err(PayrollError::InvalidAmount);
        }
        if end_time <= start_time {
            return Err(PayrollError::InvalidTimeRange);
        }

        let id = Self::next_stream_id(&env);
        let stream = Stream {
            id,
            admin,
            recipient,
            token_contract,
            token_type,
            total_amount,
            claimed_amount: 0,
            start_time,
            end_time,
            paused_at: 0,
            total_paused: 0,
            status: StreamStatus::Active,
        };

        env.storage().persistent().set(&DataKey::Stream(id), &stream);
        env.storage().instance().set(&DataKey::NextStreamId, &(id + 1));
        env.events().publish((Symbol::new(&env, "StreamCreated"), id), stream);
        Ok(id)
    }

    pub fn claim(env: Env, stream_id: u64) -> Result<i128, PayrollError> {
        let mut stream = Self::get_stream(env.clone(), stream_id)?;
        stream.recipient.require_auth();

        if stream.status != StreamStatus::Active {
            return Err(PayrollError::StreamNotActive);
        }

        let claimable = Self::claimable_amount(env.clone(), stream_id)?;
        if claimable <= 0 {
            return Err(PayrollError::NothingToClaim);
        }

        stream.claimed_amount += claimable;
        if stream.claimed_amount >= stream.total_amount {
            stream.status = StreamStatus::Completed;
        }

        let client = TokenClient::new(&env, &stream.token_contract);
        client.transfer(&stream.admin, &stream.recipient, &claimable);

        env.storage().persistent().set(&DataKey::Stream(stream_id), &stream);
        env.events().publish((Symbol::new(&env, "PaymentClaimed"), stream_id, stream.recipient), claimable);
        Ok(claimable)
    }

    pub fn pause(env: Env, stream_id: u64) -> Result<(), PayrollError> {
        let mut stream = Self::get_stream(env.clone(), stream_id)?;
        stream.admin.require_auth();
        if stream.status != StreamStatus::Active {
            return Err(PayrollError::StreamNotActive);
        }
        stream.status = StreamStatus::Paused;
        stream.paused_at = env.ledger().timestamp();
        env.storage().persistent().set(&DataKey::Stream(stream_id), &stream);
        Ok(())
    }

    pub fn resume(env: Env, stream_id: u64) -> Result<(), PayrollError> {
        let mut stream = Self::get_stream(env.clone(), stream_id)?;
        stream.admin.require_auth();
        if stream.status != StreamStatus::Paused {
            return Err(PayrollError::StreamNotActive);
        }
        let now = env.ledger().timestamp();
        stream.total_paused += now.saturating_sub(stream.paused_at);
        stream.paused_at = 0;
        stream.status = StreamStatus::Active;
        env.storage().persistent().set(&DataKey::Stream(stream_id), &stream);
        Ok(())
    }

    pub fn cancel(env: Env, stream_id: u64) -> Result<(), PayrollError> {
        let mut stream = Self::get_stream(env.clone(), stream_id)?;
        stream.admin.require_auth();
        stream.status = StreamStatus::Cancelled;
        env.storage().persistent().set(&DataKey::Stream(stream_id), &stream);
        env.events().publish((Symbol::new(&env, "StreamCancelled"), stream_id), stream);
        Ok(())
    }

    pub fn claimable_amount(env: Env, stream_id: u64) -> Result<i128, PayrollError> {
        let stream = Self::get_stream(env.clone(), stream_id)?;
        if stream.status != StreamStatus::Active {
            return Ok(0);
        }

        let now = env.ledger().timestamp();
        let effective_now = now.saturating_sub(stream.total_paused);
        if effective_now <= stream.start_time {
            return Ok(0);
        }

        let elapsed = if effective_now >= stream.end_time {
            stream.end_time - stream.start_time
        } else {
            effective_now - stream.start_time
        };
        let duration = stream.end_time - stream.start_time;
        let vested = stream.total_amount * elapsed as i128 / duration as i128;
        Ok(vested - stream.claimed_amount)
    }

    pub fn get_stream(env: Env, stream_id: u64) -> Result<Stream, PayrollError> {
        env.storage()
            .persistent()
            .get(&DataKey::Stream(stream_id))
            .ok_or(PayrollError::StreamNotFound)
    }

    fn ensure_initialized(env: &Env) -> Result<Address, PayrollError> {
        env.storage()
            .instance()
            .get(&DataKey::Admin)
            .ok_or(PayrollError::NotInitialized)
    }

    fn next_stream_id(env: &Env) -> u64 {
        env.storage().instance().get(&DataKey::NextStreamId).unwrap_or(1)
    }
}
