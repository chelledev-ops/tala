"""Deterministic evidence-package canonicalization and SHA-256 integrity engine.

The canonical representation must be stable: the same logical package contents
always produce the same bytes (and therefore the same SHA-256). Any change to
the package contents must change the hash.
"""
import hashlib
import json


def canonicalize(payload: dict) -> str:
    """Return a deterministic canonical JSON string for a package payload.

    Uses sorted keys, no insignificant whitespace, and UTF-8 text so the output
    is reproducible regardless of dict insertion order.
    """
    return json.dumps(
        payload,
        sort_keys=True,
        separators=(",", ":"),
        ensure_ascii=False,
    )


def sha256_hex(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def build_package_payload(project: dict, milestone: dict | None, documents: list[dict]) -> dict:
    """Assemble the deterministic metadata that forms an evidence package.

    Only non-sensitive metadata is included. Sensitive document contents are
    never part of the payload — only their stable identifiers and SHA-256
    digests are committed.
    """
    docs = sorted(
        (
            {
                "document_id": d["id"],
                "name": d["name"],
                "document_type": d["document_type"],
                "sha256": d["sha256"],
                "uploaded_date": d["uploaded_date"],
                "status": d["status"],
            }
            for d in documents
        ),
        key=lambda x: x["document_id"],
    )

    payload = {
        "schema": "isla-proof.evidence-package.v1",
        "network": "stellar-testnet",
        "project": {
            "project_id": project["id"],
            "project_code": project["project_code"],
            "name": project["name"],
            "lgu": project["lgu_name"],
        },
        "milestone": None,
        "documents": docs,
        "document_count": len(docs),
    }

    if milestone is not None:
        payload["milestone"] = {
            "milestone_id": milestone["id"],
            "event": milestone["event"],
            "title": milestone["title"],
            "date": milestone["date"],
            "responsible_office": milestone["responsible_office"],
            "amount": milestone.get("amount"),
            "status": milestone["status"],
            "approval_status": milestone.get("verification_status"),
        }

    return payload


def compute_package_hash(project: dict, milestone: dict | None, documents: list[dict]) -> tuple[str, str]:
    """Return (canonical_json, sha256_hex) for the given package scope."""
    payload = build_package_payload(project, milestone, documents)
    canonical = canonicalize(payload)
    return canonical, sha256_hex(canonical)
