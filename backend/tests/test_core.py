"""Automated tests: canonicalization, hashing, verification core logic."""
import copy

import evidence as ev

PROJECT = {
    "id": "p1", "project_code": "PRJ-SI-2026-001",
    "name": "San Isidro Barangay Road Rehabilitation Program",
    "lgu_name": "Municipality of San Isidro", "value": 50000000,
}
MILESTONE = {
    "id": "m1", "event": "Budget Approved", "title": "Budget Approved",
    "date": "2026-01-15", "responsible_office": "Sangguniang Bayan",
    "amount": 50000000, "status": "Completed", "verification_status": "Approved",
}
DOCS = [
    {"id": "d2", "name": "Doc B", "document_type": "Notice of Award",
     "sha256": "b" * 64, "uploaded_date": "2026-02-01", "status": "Approved"},
    {"id": "d1", "name": "Doc A", "document_type": "Appropriation Ordinance",
     "sha256": "a" * 64, "uploaded_date": "2026-01-15", "status": "Approved"},
]


def test_canonical_is_deterministic():
    c1, h1 = ev.compute_package_hash(PROJECT, MILESTONE, DOCS)
    # reversed doc order must produce identical canonical + hash
    c2, h2 = ev.compute_package_hash(PROJECT, MILESTONE, list(reversed(DOCS)))
    assert c1 == c2
    assert h1 == h2
    assert len(h1) == 64


def test_hash_changes_when_metadata_changes():
    _, h1 = ev.compute_package_hash(PROJECT, MILESTONE, DOCS)
    mutated = copy.deepcopy(DOCS)
    mutated[0]["name"] = "Doc B TAMPERED"
    _, h2 = ev.compute_package_hash(PROJECT, MILESTONE, mutated)
    assert h1 != h2


def test_project_vs_milestone_scope_differ():
    _, h_proj = ev.compute_package_hash(PROJECT, None, DOCS)
    _, h_ms = ev.compute_package_hash(PROJECT, MILESTONE, DOCS)
    assert h_proj != h_ms


def test_verification_logic():
    _, committed = ev.compute_package_hash(PROJECT, MILESTONE, DOCS)
    # unchanged -> matches (VERIFIED)
    _, current = ev.compute_package_hash(PROJECT, MILESTONE, DOCS)
    assert current == committed
    # changed -> mismatch (TAMPERED)
    mutated = copy.deepcopy(DOCS)
    mutated[0]["sha256"] = "c" * 64
    _, current2 = ev.compute_package_hash(PROJECT, MILESTONE, mutated)
    assert current2 != committed
