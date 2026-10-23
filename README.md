# TALA — Verifiable Public Projects

[![CI](https://github.com/chelledev-ops/tala/actions/workflows/ci.yml/badge.svg)](https://github.com/chelledev-ops/tala/actions/workflows/ci.yml)

**Live site: [talaapp.ph](https://talaapp.ph)**

TALA is a civic-tech platform for recording public project milestones and organizing related evidence. It creates a deterministic SHA-256 commitment for an evidence package and records that commitment on Stellar Testnet so the package can be checked for changes.

TALA is a transparency and verification tool. It does not replace government project, procurement, accounting, or records-management systems.

## How it works

```text
Public project
  → Milestones and evidence
  → Evidence-package metadata and document digests
  → Deterministic SHA-256 commitment
  → TALA attestation contract on Stellar Testnet (Soroban)
  → Public verification page
```

A Soroban smart contract records the cryptographic commitment under the package's ID, write-once. Evidence documents remain off-chain.

## Features

- Project and milestone tracking
- Evidence-package creation
- Deterministic SHA-256 commitments
- Stellar Testnet attestation through a Soroban smart contract (write-once, publicly readable)
- Public verification pages and QR links
- Tamper and mismatch detection
- Role-based staff access
- Audit history for relevant workflow actions

## What TALA does not do

- Replace an LGU’s existing enterprise, procurement, or accounting systems
- Store full evidence documents or sensitive records on Stellar
- Require the public to own cryptocurrency or use a wallet to view a verification page
- Determine whether a document is true, legally sufficient, or proof of regulatory compliance

> A matching hash demonstrates that the checked package produces the same cryptographic commitment recorded for it. It does not establish the truth or legal sufficiency of the underlying information.

## Stellar and data handling

TALA uses Stellar Testnet as a public integrity anchor. The application builds a deterministic representation from selected project, milestone, and evidence metadata, including document digests, and calculates its SHA-256 hash. The full evidence documents never go on-chain.

The hash is recorded in one of two ways:

- **Soroban attestation contract** (when `TALA_CONTRACT_ID` is set): the backend calls `attest` on the TALA attestation contract in [`contracts/`](contracts/README.md). The contract stores the commitment under the package ID together with the project ID, the attester and the ledger time. A package can be attested only once, and only by accounts the contract admin has approved. Anyone can read a commitment back with the contract's `get` or `verify` functions.
- **Transaction memo** (fallback, when no contract is configured): a Stellar transaction with the hash as its memo and a `manage_data` entry.

The current implementation signs and submits Stellar transactions from the backend using server-side configuration. Signing credentials must not be exposed in the frontend or committed to the repository.

## Verification and its limits

A public page is available at `/verify/:projectId/:packageId`. It does not require a login or a Stellar wallet. The page asks TALA’s backend to recompute the current package hash and compare it with the associated Stellar commitment. For contract attestations, the backend reads the commitment from the contract each time; the page links to the contract on Stellar Expert.

This is a public verification flow, but it is not currently a standalone verifier: the page relies on TALA’s backend and stored package records to reconstruct the package. A third party can read the recorded commitment directly from the contract, but cannot recompute the package hash without access to the package data and reconstruction details.

The page reports one of these results:

- **VERIFIED** — the recomputed package hash matches the commitment used for the Stellar attestation.
- **TAMPERED / MISMATCH** — the recomputed package hash does not match that commitment.
- **NOT ATTESTED** — no Stellar transaction is associated with the package.

If the backend cannot retrieve the Stellar transaction during verification, the current implementation may use the commitment stored in TALA’s database. The result should therefore be read with the backend dependency in mind.

## Demo data

The application includes synthetic demonstration data. Demo records are not claims about actual government projects or transactions.

The demonstration scenario follows a project through milestone recording, evidence-package creation, Testnet attestation, verification, and a controlled metadata-change example that produces a mismatch.

## Architecture

- **Frontend:** React application with public project and verification pages, QR links, and staff dashboards.
- **Backend:** FastAPI service providing the application API, role-based access, evidence-package generation, SHA-256 calculation, Stellar Testnet submission, and verification.
- **Database:** MongoDB stores application records and workflow history.
- **Evidence storage:** Evidence files are stored off-chain in a configured S3-compatible bucket.
- **Soroban contract (`contracts/tala-attestation`):** Rust smart contract on Stellar Testnet that records each package's hash commitment, write-once.
- **Stellar Testnet:** Hosts the contract (or, without one, the memo transaction).

## S3-compatible evidence storage

Configure the backend with:

- `S3_BUCKET` (required)
- `AWS_REGION` (optional; defaults to `us-east-1`)
- `S3_ENDPOINT_URL` (optional; set for S3-compatible providers other than AWS)
- `S3_ADDRESSING_STYLE` (optional; defaults to `auto`; set to `path` if required by the provider)

The backend uses the standard AWS credential provider chain. Use a deployment role with access limited to the evidence bucket where available, or provide credentials through the deployment environment or a local AWS profile. Never commit storage credentials.

Before enabling this storage configuration for existing data, migrate the existing evidence objects to the configured bucket and update their stored paths. Changing the storage backend does not move existing files.

## Security boundaries

- Sensitive evidence files remain off-chain.
- Stellar receives the evidence-package hash commitment, not the complete evidence package.
- Stellar signing credentials are configured server-side and must not be committed to the repository or exposed to the frontend.
- The application is configured for Stellar Testnet. This README does not describe a production deployment or a compliance certification.
- Control, evidence, hashing, attestation, and verification workflows use deterministic application logic and do not use AI or LLM services.

## Development

```text
backend/     FastAPI service (Python 3.11+), MongoDB, S3-compatible storage
frontend/    React app (Create React App + CRACO, Tailwind, Radix UI)
contracts/   Soroban attestation contract (Rust)
api/         Vercel entry point for the backend
```

Keep credentials in local or deployment environment configuration. Never commit secrets or `.env` files; `.env.example` in each folder lists every setting.

### Backend

```bash
cd backend
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env                                # then fill it in
uvicorn server:app --reload --port 8001
```

The staff accounts are created on first start from `ADMIN_*`, `REVIEWER_*` and `AUDITOR_*` in `.env`.

### Frontend

```bash
cd frontend
cp .env.example .env          # REACT_APP_BACKEND_URL points at the backend
yarn install
yarn start                    # http://localhost:3000
yarn build                    # production build in frontend/build
```

### Smart contract

See [`contracts/README.md`](contracts/README.md) to build, test and deploy the contract. Put the deployed contract ID in `TALA_CONTRACT_ID`; the backend's Stellar account must be an attester on the contract.

```bash
cd contracts
cargo test
```

### Tests

```bash
cd backend
pytest
```

`tests/test_core.py` checks canonicalization, hashing and verification and always runs. `tests/test_api.py` and `tests/test_new_features.py` exercise a running backend; they run when `TALA_API_URL` and the `ADMIN_`/`REVIEWER_`/`AUDITOR_` `EMAIL` and `PASSWORD` variables are set, and are skipped otherwise.

### Deploy on Vercel

The repo deploys to Vercel as one project: the React build is served as static files and the FastAPI backend runs as a Python function at `/api/*` (`vercel.json`, `api/index.py`). The website calls the API on the same domain, so `REACT_APP_BACKEND_URL` can stay empty.

1. Import `chelledev-ops/tala` in Vercel (Framework preset: **Other**; `vercel.json` sets the build).
2. Add the backend settings from `backend/.env.example` under **Settings → Environment Variables**: `MONGO_URL` (MongoDB Atlas or another hosted MongoDB), `DB_NAME`, `JWT_SECRET`, `CORS_ORIGINS`, the `ADMIN_`/`REVIEWER_`/`AUDITOR_` accounts, the `STELLAR_*` keys, `TALA_CONTRACT_ID`, `S3_*`, and `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` for the evidence bucket.
3. Deploy. The staff accounts are seeded on the first request.
4. **Custom domain:** add `talaapp.ph` under **Settings → Domains**, then set the DNS records Vercel shows in Cloudflare (DNS only, not proxied).

Limits to know: a request body can be at most 4.5 MB, so larger evidence uploads fail on Vercel, and a function runs for at most 60 seconds (a contract attestation normally confirms well within that).

### Continuous integration

GitHub Actions (`.github/workflows/ci.yml`) runs on every pull request and push to `main`:

- **Backend:** installs `requirements.txt`, checks every module compiles, runs `pytest`
- **Frontend:** `yarn install --frozen-lockfile` and `yarn build`
- **Contract:** `cargo test`, then `stellar contract build`; the `.wasm` is uploaded as the `tala-attestation-wasm` artifact for deployment

---

Powered by ISLA Camp Center, Inc.
