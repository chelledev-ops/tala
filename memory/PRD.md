# ISLA Proof — PRD

## Original Problem Statement
ISLA Proof is a Stellar-native verification and transparency platform for Philippine LGUs. It acts as a verifiable evidence/public-transparency layer that records project lifecycle milestones, generates deterministic SHA-256 integrity commitments for evidence packages, and anchors those commitments to Stellar Testnet so citizens and auditors can independently verify records have not been altered. MVP scope: Public Infrastructure Project Transparency only. Synthetic/demo data only. Does not assert truthfulness of underlying statements, only integrity of the attested evidence package.

## Architecture
- Frontend: React 19 (CRA/CRACO) + Tailwind + shadcn/ui. Pages: PublicPortal, ProjectDetail, VerifyPage, Login, Dashboard, ManagePackages, AuditTrail.
- Backend: FastAPI (`/api` prefix), MongoDB (motor). Modules: `server.py` (routes), `evidence.py` (deterministic canonicalization + SHA-256), `stellar_service.py` (Testnet anchoring via stellar-sdk, manage_data + hash memo), `auth.py` (JWT Bearer + RBAC), `seed_data.py` (synthetic seeder).
- Stellar: Testnet only. Backend holds secret key in env (`STELLAR_SECRET_KEY`), never exposed to client. Plain transactions (no Soroban).
- Auth: JWT email/password, Bearer token in localStorage. Seeded demo accounts for 3 staff roles.

## User Personas / Roles
- LGU Administrator (admin@isla.gov.ph): create projects/packages, generate SHA-256, attest to Stellar, run demo tamper/restore.
- LGU Reviewer (reviewer@isla.gov.ph): review/approve/reject evidence.
- Auditor (auditor@isla.gov.ph): read-only, view audit trail + attestations.
- Public User: no login; browse/search/filter projects, view timelines, verify commitments.

## Core Requirements (static)
- Deterministic evidence-package canonicalization + reproducible SHA-256.
- Public verification at /verify/:projectId/:packageId with VERIFIED / TAMPERED / NOT_ATTESTED states.
- Valid → tamper → mismatch → restore → valid demo.
- Append-only audit trail. Philippine peso formatting. Sensitive data off-chain.

## Implemented (2026-06)
- [x] Data model: users, lgus, projects, milestones, evidence, packages, audit_trail, pilot_requests.
- [x] Project lifecycle (9-stage milestone timeline), evidence per milestone.
- [x] Deterministic canonicalization + SHA-256 engine (`evidence.py`) with automated tests.
- [x] Evidence package generation + verification logic (recompute vs on-chain).
- [x] Real Stellar Testnet attestation (manage_data + hash memo) with on-chain readback.
- [x] Public portal: dashboard stats, search/filter, project pages, verification page.
- [x] JWT auth + RBAC; seeded 3 staff roles.
- [x] Audit trail UI + append-only logging of all actions.
- [x] Demo tamper/restore endpoints + admin controls on verify page.
- [x] Seed: 5 LGUs, 15 projects, 79 milestones, 67 evidence, 6 packages (3 VERIFIED, 1 TAMPERED, 2 NOT_ATTESTED). All labeled DEMO/SYNTHETIC.
- [x] Automated tests: canonicalization, hashing, verification, API workflow (28 passing).

## Refinement — TALA rebrand (2026-06)
- [x] Rebranded public product to **TALA — Verifiable Public Projects**, powered by ISLA Camp Center, Inc. New geometric logo (T + star + record), favicon, metadata. Backend/DB identifiers unchanged.
- [x] New marketing homepage at `/`: Hero, How It Works (Record→Review→Anchor→Verify), Features (TALA Record/Proof/Anchor/Verify/Trace/Public), Built for LGUs, Why Stellar (+ integrity limitation disclaimer), Featured Demo Project, Join the LGU Pilot form, FAQ, Contact. Project browse moved to `/projects`.
- [x] Evidence uploads: LGU Administrators attach demo documents to milestones; files stored off-chain in Emergent object storage; backend computes SHA-256 of file bytes; public sees only metadata + hash (storage_path never exposed); authenticated-only download endpoint.
- [x] Verification QR: printable QR per attested package (on project detail, Manage Packages, and verify result) linking to the public `/verify/:projectId/:packageId` page.
- [x] LGU Pilot signups stored in `pilot_requests` (no third-party service).
- [x] Tests: 32 passing (10 new feature + 22 regression); all frontend flows green.

## Backlog (NOT built — future modules)
- P1: Freighter wallet-signing flow (user-signed XDR).
- P2: Additional LGU modules (Procurement, Budget, Disbursement, Disaster relief, Grants, Barangay projects, Citizen requests).
- P2: Evidence file uploads via object storage (currently metadata + hashes only).
- P2: Dark mode toggle.

## Demo Credentials
See /app/memory/test_credentials.md
