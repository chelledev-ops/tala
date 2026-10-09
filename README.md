# TALA — Verifiable Public Projects

TALA is a civic-tech platform for recording public project milestones and organizing related evidence. It creates a deterministic SHA-256 commitment for an evidence package and records that commitment on Stellar Testnet so the package can be checked for changes.

TALA is a transparency and verification tool. It does not replace government project, procurement, accounting, or records-management systems.

## How it works

```text
Public project
  → Milestones and evidence
  → Evidence-package metadata and document digests
  → Deterministic SHA-256 commitment
  → Stellar Testnet transaction
  → Public verification page
```

The Stellar transaction records the cryptographic commitment. Evidence documents remain off-chain.

## Features

- Project and milestone tracking
- Evidence-package creation
- Deterministic SHA-256 commitments
- Stellar Testnet attestation
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

TALA uses Stellar Testnet as a public integrity anchor. The application builds a deterministic representation from selected project, milestone, and evidence metadata, including document digests, and calculates its SHA-256 hash. The application submits that hash to Stellar Testnet. The transaction does not contain the full evidence documents.

The current implementation signs and submits Stellar transactions from the backend using server-side configuration. Signing credentials must not be exposed in the frontend or committed to the repository.

## Verification and its limits

A public page is available at `/verify/:projectId/:packageId`. It does not require a login or a Stellar wallet. The page asks TALA’s backend to recompute the current package hash and compare it with the associated Stellar commitment.

This is a public verification flow, but it is not currently a standalone verifier: the page relies on TALA’s backend and stored package records to reconstruct the package. A third party cannot reproduce the result solely from the Stellar transaction without access to the package data and reconstruction details.

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
- **Evidence storage:** Evidence files are stored off-chain using the configured object-storage integration.
- **Stellar Testnet:** Records the package hash commitment associated with an attestation.

## Security boundaries

- Sensitive evidence files remain off-chain.
- Stellar receives the evidence-package hash commitment, not the complete evidence package.
- Stellar signing credentials are configured server-side and must not be committed to the repository or exposed to the frontend.
- The application is configured for Stellar Testnet. This README does not describe a production deployment or a compliance certification.

## Development

The application has separate frontend and backend components. See the project directories and their configuration files for current setup requirements and commands. Keep credentials in local or deployment environment configuration; do not commit secrets or `.env` files.

---

Powered by ISLA Camp Center, Inc.
