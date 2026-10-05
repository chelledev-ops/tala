# TALA — Verifiable Public Projects

## Overview

TALA is a civic-tech platform that helps Philippine Local Government Units (LGUs) record public project milestones and evidence, create deterministic cryptographic commitments, anchor evidence-package integrity to Stellar, and allow citizens and auditors to independently verify the resulting record.

TALA is a transparency and verification layer — not a replacement for existing government systems.

## Core Flow

```
LGU Project
  → Evidence
    → SHA-256
      → Stellar
        → Public Verification
```

## What TALA Does

- Project lifecycle tracking
- Milestone records
- Evidence packages
- Deterministic SHA-256 integrity commitments
- Stellar Testnet anchoring
- Public verification
- QR-based verification
- Tamper detection
- Append-only audit trail

## What TALA Does NOT Do

- Does not replace an LGU ERP
- Does not replace procurement or accounting systems
- Does not store sensitive government documents on-chain
- Does not require citizens to own cryptocurrency
- Does not require citizens to use a crypto wallet
- Does not determine whether government information is legally compliant or truthful

> Blockchain verification proves the integrity of the attested evidence package — **not** the truth or legal sufficiency of the underlying documents.

## Stellar

TALA uses Stellar as a **public integrity layer**. Sensitive documents always remain **off-chain**.

For each evidence package, TALA canonicalizes the non-sensitive metadata and document digests deterministically, computes a **SHA-256 commitment**, and anchors only that commitment to **Stellar Testnet** (never sensitive content or personally identifiable information). The backend signs and submits the transaction; no private key is ever exposed to the frontend. Public verification later recomputes the current package hash and compares it against the commitment recorded on-chain.

## Verification

A public verification page (`/verify/:projectId/:packageId`, no login required) reports one of three states:

- **VERIFIED** — the current evidence-package hash matches the commitment recorded on Stellar Testnet.
- **TAMPERED / MISMATCH** — the current evidence package does not match the Stellar commitment.
- **NOT ATTESTED** — no Stellar attestation has been recorded for this evidence package.

## Demo

All data currently in the application is **synthetic / demo data** and is labeled as such throughout the UI.

The primary demo scenario is the **San Isidro Barangay Road Rehabilitation Program** (₱50,000,000, In Progress), which demonstrates the full lifecycle: record milestones → attach evidence → generate an evidence package → anchor its SHA-256 to Stellar Testnet → verify successfully → modify evidence to show a mismatch → restore to verify again.

## Architecture

- **Frontend** — React single-page app (Create React App + CRACO, Tailwind CSS, shadcn/ui). Public portal, project pages, verification page, QR generation, and staff dashboards.
- **Backend** — FastAPI (Python). REST API under the `/api` prefix; JWT authentication with role-based access (LGU Administrator, LGU Reviewer, Auditor); deterministic canonicalization + SHA-256 engine; append-only audit trail.
- **Database** — MongoDB.
- **Object storage** — Uploaded evidence documents are stored off-chain via the configured object-storage integration; only non-sensitive metadata and the SHA-256 digest are exposed publicly.
- **Stellar Testnet** — Backend-signed transactions anchor the evidence-package SHA-256 commitment.
- **Public verification** — Anyone can independently verify a commitment without an account or wallet.

## Development

### Prerequisites

- Python 3.11+
- Node.js 18+ and Yarn
- MongoDB (local or hosted)

### Backend

```bash
cd backend
pip install -r requirements.txt
# configure environment variables (see below), then start with your process manager / uvicorn
uvicorn server:app --host 0.0.0.0 --port 8001
```

Seed synthetic demo data (optional, one-time):

```bash
cd backend
python seed_data.py
```

Run backend tests:

```bash
cd backend
pytest
```

### Frontend

```bash
cd frontend
yarn install
yarn start          # development
yarn build          # production build
```

### Environment variables

Secrets and configuration are supplied via environment variables (never hardcoded). Create `backend/.env` and `frontend/.env` locally (these are git-ignored).

**Backend (`backend/.env`)** — names only:

- `MONGO_URL`
- `DB_NAME`
- `CORS_ORIGINS`
- `JWT_SECRET`
- `ADMIN_EMAIL`, `ADMIN_PASSWORD`
- `REVIEWER_EMAIL`, `REVIEWER_PASSWORD`
- `AUDITOR_EMAIL`, `AUDITOR_PASSWORD`
- `STELLAR_HORIZON_URL`
- `STELLAR_NETWORK_PASSPHRASE`
- `STELLAR_PUBLIC_KEY`
- `STELLAR_SECRET_KEY`
- `EMERGENT_LLM_KEY` (object-storage integration key)
- `INTEGRATION_PROXY_URL` (object-storage endpoint)

**Frontend (`frontend/.env`)** — names only:

- `REACT_APP_BACKEND_URL`

## Security

- All secrets **must** be supplied through environment variables or the deployment platform's secret management.
- No real credentials, API keys, Stellar secret keys, JWT secrets, or database credentials are committed to this repository.
- `.env` files are git-ignored and must never be committed.
- TALA operates on **Stellar Testnet** only; sensitive documents and personally identifiable information remain off-chain.

---

Powered by ISLA Camp Center, Inc.
