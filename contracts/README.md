# TALA attestation contract (Soroban)

A public, write-once registry of evidence-package commitments on Stellar.

When an LGU administrator attests an evidence package, the TALA backend computes the package's deterministic SHA-256 commitment and calls `attest` here. The commitment is stored under the package ID and can never be changed. Anyone can read it back with `get` or check it with `verify`, without trusting TALA's database.

The contract stores digests only. Evidence documents stay off-chain.

## Interface

| Function | Who can call | What it does |
|---|---|---|
| `__constructor(admin)` | deployer | Sets the admin, who is also the first attester |
| `add_attester(attester)` / `remove_attester(attester)` | admin | Manage who may record commitments. Existing records stay when an attester is removed |
| `is_attester(attester) -> bool` | anyone | |
| `attest(attester, package_id, project_id, commitment) -> Attestation` | an attester (signs) | Records the 32-byte commitment. Fails with `AlreadyAttested` if the package already has one, and `InvalidId` for empty IDs or IDs over 64 characters |
| `get(package_id) -> Option<Attestation>` | anyone | The commitment, project ID, attester, ledger and timestamp |
| `verify(package_id, commitment) -> bool` | anyone | True if the recorded commitment matches |

Each attestation emits an `attested` event with the package ID as a topic and the commitment as data. Records are kept alive for about 180 days after each write or read, and topped up when fewer than 30 days remain.

## Build and test

Requires Rust with the `wasm32v1-none` target and the [Stellar CLI](https://developers.stellar.org/docs/tools/cli).

```bash
cd contracts
cargo test                 # unit tests (native, no network)
stellar contract build     # target/wasm32v1-none/release/tala_attestation.wasm
```

## Deploy to Testnet

```bash
# 1. A funded Testnet identity to deploy and administer the contract
stellar keys generate tala-admin --network testnet --fund

# 2. Deploy, making that identity the admin (and first attester)
stellar contract deploy \
  --wasm target/wasm32v1-none/release/tala_attestation.wasm \
  --source tala-admin --network testnet \
  -- --admin "$(stellar keys address tala-admin)"

# 3. If the backend signs with a different key, make it an attester
stellar contract invoke --id <CONTRACT_ID> --source tala-admin --network testnet \
  -- add_attester --attester <BACKEND_STELLAR_PUBLIC_KEY>
```

Then set `TALA_CONTRACT_ID=<CONTRACT_ID>` in `backend/.env`. With it set, new attestations go through the contract. Packages attested before keep verifying through their transaction memo.

## Read an attestation

```bash
stellar contract invoke --id <CONTRACT_ID> --source tala-admin --network testnet \
  -- get --package_id <PACKAGE_ID>
```
