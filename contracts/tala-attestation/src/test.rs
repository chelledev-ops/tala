extern crate std;

use super::*;
use soroban_sdk::testutils::{Address as _, Events as _, Ledger as _};
use soroban_sdk::{vec, IntoVal};

struct Setup {
    env: Env,
    client: TalaAttestationClient<'static>,
    admin: Address,
}

fn setup() -> Setup {
    let env = Env::default();
    env.mock_all_auths();
    env.ledger().with_mut(|l| {
        l.sequence_number = 1_000;
        l.timestamp = 1_760_000_000;
    });
    let admin = Address::generate(&env);
    let id = env.register(TalaAttestation, (admin.clone(),));
    let client = TalaAttestationClient::new(&env, &id);
    Setup { env, client, admin }
}

fn s(env: &Env, v: &str) -> String {
    String::from_str(env, v)
}

fn digest(env: &Env, b: u8) -> BytesN<32> {
    BytesN::from_array(env, &[b; 32])
}

#[test]
fn admin_is_the_first_attester() {
    let t = setup();
    assert_eq!(t.client.admin(), t.admin);
    assert!(t.client.is_attester(&t.admin));
}

#[test]
fn records_a_commitment_once_and_reads_it_back() {
    let t = setup();
    let pkg = s(&t.env, "6f1c2a9e-0000-4000-8000-000000000001");
    let a = t.client.attest(&t.admin, &pkg, &s(&t.env, "proj-1"), &digest(&t.env, 7));
    assert_eq!(a.commitment, digest(&t.env, 7));
    assert_eq!(a.ledger, 1_000);
    assert_eq!(a.timestamp, 1_760_000_000);

    assert_eq!(t.client.get(&pkg), Some(a));
    assert!(t.client.verify(&pkg, &digest(&t.env, 7)));
    assert!(!t.client.verify(&pkg, &digest(&t.env, 8)));
}

#[test]
fn a_commitment_can_never_be_overwritten() {
    let t = setup();
    let pkg = s(&t.env, "pkg-1");
    t.client.attest(&t.admin, &pkg, &s(&t.env, "proj-1"), &digest(&t.env, 1));
    let again = t.client.try_attest(&t.admin, &pkg, &s(&t.env, "proj-1"), &digest(&t.env, 2));
    assert_eq!(again, Err(Ok(Error::AlreadyAttested)));
    assert_eq!(t.client.get(&pkg).unwrap().commitment, digest(&t.env, 1));
}

#[test]
fn unknown_packages_are_not_verified() {
    let t = setup();
    assert_eq!(t.client.get(&s(&t.env, "missing")), None);
    assert!(!t.client.verify(&s(&t.env, "missing"), &digest(&t.env, 1)));
}

#[test]
fn only_attesters_can_record() {
    let t = setup();
    let stranger = Address::generate(&t.env);
    let r = t.client.try_attest(&stranger, &s(&t.env, "pkg-1"), &s(&t.env, "proj-1"), &digest(&t.env, 1));
    assert_eq!(r, Err(Ok(Error::NotAttester)));

    t.client.add_attester(&stranger);
    assert!(t.client.is_attester(&stranger));
    t.client.attest(&stranger, &s(&t.env, "pkg-1"), &s(&t.env, "proj-1"), &digest(&t.env, 1));

    t.client.remove_attester(&stranger);
    let r = t.client.try_attest(&stranger, &s(&t.env, "pkg-2"), &s(&t.env, "proj-1"), &digest(&t.env, 2));
    assert_eq!(r, Err(Ok(Error::NotAttester)));
    // A removed attester's earlier record stays.
    assert!(t.client.verify(&s(&t.env, "pkg-1"), &digest(&t.env, 1)));
}

#[test]
fn rejects_empty_and_oversized_ids() {
    let t = setup();
    let too_long = s(&t.env, &"x".repeat(65));
    for (pkg, proj) in [
        (s(&t.env, ""), s(&t.env, "proj")),
        (s(&t.env, "pkg"), s(&t.env, "")),
        (too_long.clone(), s(&t.env, "proj")),
    ] {
        let r = t.client.try_attest(&t.admin, &pkg, &proj, &digest(&t.env, 1));
        assert_eq!(r, Err(Ok(Error::InvalidId)));
    }
}

#[test]
fn attest_requires_the_attesters_signature() {
    let env = Env::default();
    let admin = Address::generate(&env);
    let id = env.register(TalaAttestation, (admin.clone(),));
    let client = TalaAttestationClient::new(&env, &id);
    // No auth mocked: the call must fail on require_auth.
    let r = client.try_attest(&admin, &String::from_str(&env, "pkg"), &String::from_str(&env, "proj"), &BytesN::from_array(&env, &[1; 32]));
    assert!(r.is_err());
}

#[test]
fn managing_attesters_requires_the_admin() {
    let t = setup();
    let other = Address::generate(&t.env);
    t.client.add_attester(&other);
    assert_eq!(
        t.env.auths()[0].0,
        t.admin,
        "add_attester must be authorised by the admin"
    );
}

#[test]
fn emits_an_event_per_attestation() {
    let t = setup();
    let pkg = s(&t.env, "pkg-ev");
    t.client.attest(&t.admin, &pkg, &s(&t.env, "proj-1"), &digest(&t.env, 9));
    let events = t.env.events().all();
    let last = events.last().unwrap();
    assert_eq!(last.1, vec![&t.env, symbol_short!("attested").into_val(&t.env), pkg.into_val(&t.env)]);
    let data: BytesN<32> = last.2.into_val(&t.env);
    assert_eq!(data, digest(&t.env, 9));
}
