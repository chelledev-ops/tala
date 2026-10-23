//! TALA attestation registry: a public, write-once record of evidence-package
//! commitments on Stellar.
//!
//! When an LGU administrator attests an evidence package, the TALA backend
//! computes the package's deterministic SHA-256 commitment and records it here
//! under the package's ID. Anyone can then read the commitment back from the
//! contract and compare it with the package they are checking, without
//! trusting TALA's database.
//!
//! - Only attesters added by the admin can record commitments.
//! - A package's commitment is written once and can never be changed, so a
//!   later edit to the evidence shows up as a mismatch instead of being
//!   silently re-attested.
//! - The contract stores digests only. Evidence documents stay off-chain.
#![no_std]
use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, symbol_short, Address, BytesN, Env,
    String,
};

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    /// The caller isn't one of the admin's attesters.
    NotAttester = 1,
    /// This package already has a recorded commitment.
    AlreadyAttested = 2,
    /// Package and project IDs must be 1 to 64 characters.
    InvalidId = 3,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Attestation {
    /// SHA-256 commitment of the evidence package.
    pub commitment: BytesN<32>,
    /// The project the package belongs to.
    pub project_id: String,
    /// The attester that recorded it.
    pub attester: Address,
    /// Ledger sequence and timestamp when it was recorded.
    pub ledger: u32,
    pub timestamp: u64,
}

#[contracttype]
enum DataKey {
    Admin,
    Attester(Address),
    Attestation(String),
}

/// Persistent entries are bumped to roughly 180 days whenever they are written
/// or read, and topped up again once fewer than 30 days remain.
const LEDGERS_PER_DAY: u32 = 17_280;
const BUMP_TO: u32 = 180 * LEDGERS_PER_DAY;
const BUMP_WHEN_BELOW: u32 = 30 * LEDGERS_PER_DAY;
const MAX_ID_LEN: u32 = 64;

#[contract]
pub struct TalaAttestation;

#[contractimpl]
impl TalaAttestation {
    /// Sets the admin and makes it the first attester.
    pub fn __constructor(env: Env, admin: Address) {
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().persistent().set(&DataKey::Attester(admin.clone()), &true);
    }

    pub fn admin(env: Env) -> Address {
        env.storage().instance().get(&DataKey::Admin).unwrap()
    }

    /// Lets `attester` record commitments. Admin only.
    pub fn add_attester(env: Env, attester: Address) {
        Self::admin(env.clone()).require_auth();
        let key = DataKey::Attester(attester.clone());
        env.storage().persistent().set(&key, &true);
        env.storage().persistent().extend_ttl(&key, BUMP_WHEN_BELOW, BUMP_TO);
        env.events().publish((symbol_short!("att_add"),), attester);
    }

    /// Stops `attester` from recording new commitments. Existing records stay. Admin only.
    pub fn remove_attester(env: Env, attester: Address) {
        Self::admin(env.clone()).require_auth();
        env.storage().persistent().remove(&DataKey::Attester(attester.clone()));
        env.events().publish((symbol_short!("att_rm"),), attester);
    }

    pub fn is_attester(env: Env, attester: Address) -> bool {
        env.storage().persistent().has(&DataKey::Attester(attester))
    }

    /// Records the commitment for an evidence package. Write-once.
    pub fn attest(
        env: Env,
        attester: Address,
        package_id: String,
        project_id: String,
        commitment: BytesN<32>,
    ) -> Result<Attestation, Error> {
        attester.require_auth();
        if !Self::is_attester(env.clone(), attester.clone()) {
            return Err(Error::NotAttester);
        }
        for id in [&package_id, &project_id] {
            if id.len() == 0 || id.len() > MAX_ID_LEN {
                return Err(Error::InvalidId);
            }
        }
        let key = DataKey::Attestation(package_id.clone());
        if env.storage().persistent().has(&key) {
            return Err(Error::AlreadyAttested);
        }
        let attestation = Attestation {
            commitment: commitment.clone(),
            project_id,
            attester,
            ledger: env.ledger().sequence(),
            timestamp: env.ledger().timestamp(),
        };
        env.storage().persistent().set(&key, &attestation);
        env.storage().persistent().extend_ttl(&key, BUMP_WHEN_BELOW, BUMP_TO);
        env.events().publish((symbol_short!("attested"), package_id), commitment);
        Ok(attestation)
    }

    /// The recorded attestation for a package, if any.
    pub fn get(env: Env, package_id: String) -> Option<Attestation> {
        let key = DataKey::Attestation(package_id);
        let found: Option<Attestation> = env.storage().persistent().get(&key);
        if found.is_some() {
            env.storage().persistent().extend_ttl(&key, BUMP_WHEN_BELOW, BUMP_TO);
        }
        found
    }

    /// True when the package has a recorded commitment equal to `commitment`.
    pub fn verify(env: Env, package_id: String, commitment: BytesN<32>) -> bool {
        match Self::get(env, package_id) {
            Some(a) => a.commitment == commitment,
            None => false,
        }
    }
}

#[cfg(test)]
mod test;
