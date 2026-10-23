<div align="center">

# TALA

**Verifiable public projects**

Track public projects, milestones, and evidence with tamper-evident records.<br>
TALA anchors evidence-package integrity to Stellar and lets citizens and auditors verify records publicly, while sensitive documents stay off-chain.

[![CI](https://github.com/chelledev-ops/tala/actions/workflows/ci.yml/badge.svg)](https://github.com/chelledev-ops/tala/actions/workflows/ci.yml)
![Network: Stellar Testnet](https://img.shields.io/badge/network-Stellar%20Testnet-0B192C)
![Smart contract: Soroban](https://img.shields.io/badge/smart%20contract-Soroban-10b981)

**[talaapp.ph](https://talaapp.ph)**

</div>

---

## Why TALA

Public infrastructure projects generate milestones, approvals, and supporting documents across many offices. Once published, it is hard for the public to tell whether a record has been quietly changed.

TALA gives every evidence package a cryptographic fingerprint and records it on a public ledger. Anyone can later check that the package they are looking at is the same one that was attested. No account, wallet, or cryptocurrency is required.

## How it works

```text
 Public project ──► Milestones & evidence ──► Evidence package
                                                    │
                                                    ▼
                                     Deterministic SHA-256 commitment
                                                    │
                                                    ▼
                               TALA attestation contract on Stellar (Soroban)
                                                    │
                                                    ▼
                                     Public verification page & QR code
```

1. **Record.** LGU staff track a project's milestones and attach supporting evidence.
2. **Package.** Related evidence is grouped into a package, and TALA computes a deterministic SHA-256 commitment from its metadata and document digests.
3. **Attest.** The commitment is written to the TALA smart contract on Stellar. Each package can be attested once and the record can never be changed.
4. **Verify.** Anyone can open the package's public verification page or scan its QR code. TALA recomputes the commitment and compares it with the one recorded on-chain.

## Features

- **Project and milestone tracking:** a public timeline for each project
- **Evidence packages:** related documents grouped and fingerprinted together
- **On-chain attestation:** commitments recorded by a Soroban smart contract on Stellar
- **Public verification:** shareable verification pages and QR codes, no login or wallet needed
- **Tamper detection:** any change to a package's attested data is flagged as a mismatch
- **Role-based access:** separate administrator, reviewer, and auditor roles
- **Audit trail:** a history of every attestation, review, and verification

## Verification results

| Result | Meaning |
|---|---|
| ✅ **Verified** | The package matches the commitment recorded on Stellar. |
| ⚠️ **Tampered / mismatch** | The package has changed since it was attested. |
| ⏳ **Not attested** | No commitment has been recorded for this package yet. |

> A match shows that the package has not changed since it was attested. It does not establish that the underlying information is true, complete, or legally sufficient.

## On-chain attestation

Commitments are recorded by the **TALA attestation contract**, a Soroban smart contract in [`contracts/`](contracts/README.md):

- **Write-once:** a package's commitment can never be overwritten.
- **Permissioned writes, public reads:** only approved attesters can record commitments, and anyone can read or verify them directly on-chain.
- **Digests only:** the contract stores hashes, never documents or personal data.

## Privacy and data handling

- Evidence documents stay **off-chain** in private storage. Only a SHA-256 commitment is published.
- The public needs no cryptocurrency, wallet, or account to verify a record.
- Signing keys are held server-side and are never exposed to the browser.
- Hashing, attestation, and verification use deterministic logic. No AI or LLM services are involved.

## Scope

TALA is a transparency and verification layer. It does **not**:

- replace an LGU's existing project, procurement, accounting, or records-management systems
- store full evidence documents or sensitive records on a blockchain
- determine whether a document is true, legally sufficient, or proof of compliance

## Project status

TALA currently runs on **Stellar Testnet**. The application includes synthetic demonstration data; demo records are not claims about actual government projects or transactions.

## Repository

| Directory | Contents |
|---|---|
| [`frontend/`](frontend) | Web application: public project pages, verification, and staff dashboards |
| [`backend/`](backend) | API, evidence packaging, hashing, and Stellar integration |
| [`contracts/`](contracts/README.md) | Soroban attestation contract (Rust) |

---

<div align="center">

Powered by **ISLA Camp Center, Inc.**

</div>
