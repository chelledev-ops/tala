"""One-time synthetic/demo data seeder for ISLA Proof.

Creates 5 fictional LGUs, 15 projects, milestones, evidence, and evidence
packages. Performs REAL Stellar Testnet attestation for demo packages and sets
up one intentionally tampered package. Run as a standalone script.

All data is SYNTHETIC / DEMO.
"""
import hashlib
import os
import uuid
from datetime import datetime, timezone

from dotenv import load_dotenv
from pathlib import Path
from pymongo import MongoClient

ROOT = Path(__file__).parent
load_dotenv(ROOT / ".env")

import evidence as ev
import stellar_service as ss

client = MongoClient(os.environ["MONGO_URL"])
db = client[os.environ["DB_NAME"]]


def now_iso():
    return datetime.now(timezone.utc).isoformat()


def nid():
    return str(uuid.uuid4())


def doc_hash(content: str) -> str:
    return hashlib.sha256(content.encode("utf-8")).hexdigest()


def audit(action, role, actor, project_id=None, milestone_id=None, package_id=None,
          prev="-", result="-", ts=None):
    db.audit_trail.insert_one({
        "id": nid(),
        "actor": actor,
        "role": role,
        "action": action,
        "project_id": project_id,
        "milestone_id": milestone_id,
        "package_id": package_id,
        "previous_state": prev,
        "resulting_state": result,
        "timestamp": ts or now_iso(),
    })


MILESTONE_TEMPLATE = [
    ("Budget", "Budget Approved", "Sangguniang Bayan / Appropriations", "Appropriation Ordinance"),
    ("Procurement", "Procurement Started", "Bids and Awards Committee", "Invitation to Bid"),
    ("Award", "Contract Awarded", "Bids and Awards Committee", "Notice of Award"),
    ("Contract", "Contract Signed", "Office of the Mayor", "Contract Agreement"),
    ("Disbursement", "First Disbursement", "Municipal Treasurer", "Disbursement Voucher"),
    ("Implementation", "Construction Started", "Municipal Engineering Office", "Notice to Proceed"),
    ("Inspection", "Inspection", "Municipal Engineering Office", "Inspection Report"),
    ("Implementation", "Progress Update", "Municipal Engineering Office", "Accomplishment Report"),
    ("Completion", "Completion", "Municipal Engineering Office", "Certificate of Completion"),
]


def peso(n):
    return n


LGUS = [
    {"name": "Municipality of San Isidro", "province": "Nueva Ecija", "region": "Region III"},
    {"name": "Pasig City", "province": "Metro Manila", "region": "NCR"},
    {"name": "Naga City", "province": "Camarines Sur", "region": "Region V"},
    {"name": "Iloilo City", "province": "Iloilo", "region": "Region VI"},
    {"name": "Davao City", "province": "Davao del Sur", "region": "Region XI"},
]

PROJECT_SPECS = [
    # (lgu_index, name, value, status, progress, contractor, funding, location, start, target)
    (1, "Pasig Riverside Drainage Improvement", 85_000_000, "In Progress", 54, "MetroBuild Construction Inc.", "General Fund", "Barangay Kapitolyo, Pasig City", "2026-02-01", "2026-11-30"),
    (1, "Pasig Public Market Modernization", 120_000_000, "Procurement", 10, "TBD", "Supplemental Budget", "Pasig City Proper", "2026-03-15", "2027-03-15"),
    (2, "Naga City Flood Control Phase 2", 95_500_000, "In Progress", 68, "Bicol Infrastructure Corp.", "DPWH Grant", "Naga River Basin", "2026-01-20", "2026-12-20"),
    (2, "Naga Evacuation Center Construction", 42_000_000, "Completed", 100, " Libmanan Builders Co.", "Calamity Fund", "Barangay Concepcion Pequeña", "2025-06-01", "2025-12-15"),
    (2, "Naga City Street Lighting Upgrade", 18_750_000, "In Progress", 35, "Luzon Power Systems Inc.", "General Fund", "Downtown Naga", "2026-04-01", "2026-10-01"),
    (3, "Iloilo Coastal Road Rehabilitation", 150_000_000, "In Progress", 47, "Western Visayas Builders", "DPWH Grant", "Iloilo Coastal Zone", "2026-02-10", "2027-02-10"),
    (3, "Iloilo City Health Center Expansion", 36_500_000, "Review Required", 22, "Panay Medical Builders", "General Fund", "Barangay Molo, Iloilo City", "2026-03-01", "2026-12-01"),
    (3, "Iloilo Esplanade Extension", 64_000_000, "Completed", 100, "Jaro Development Corp.", "Tourism Fund", "Iloilo River Esplanade", "2025-05-01", "2025-11-20"),
    (4, "Davao City Bridge Retrofitting", 210_000_000, "In Progress", 60, "Mindanao Steel & Concrete", "DPWH Grant", "Davao River Crossing", "2026-01-05", "2027-01-05"),
    (4, "Davao Public School Rehabilitation", 55_250_000, "Procurement", 8, "TBD", "Education Fund", "Davao City District 2", "2026-04-20", "2026-12-20"),
    (4, "Davao Waterworks Pipe Replacement", 78_000_000, "In Progress", 41, "Southern Waterworks Inc.", "Water District Fund", "Davao City Central", "2026-02-15", "2026-11-15"),
    (0, "San Isidro Public Market Repair", 12_500_000, "Completed", 100, "Nueva Ecija Builders Co.", "General Fund", "San Isidro Poblacion", "2025-07-01", "2025-12-10"),
    (0, "San Isidro Health Station Upgrade", 9_800_000, "Review Required", 18, "Central Luzon Contractors", "General Fund", "Barangay Malapit", "2026-03-10", "2026-09-10"),
    (2, "Naga Barangay Hall Construction", 15_200_000, "Not Started", 0, "TBD", "General Fund", "Barangay Triangulo", "2026-06-01", "2026-12-01"),
]


def make_project(lgu, spec_name, value, status, progress, contractor, funding, location, start, target, code):
    return {
        "id": nid(),
        "project_code": code,
        "name": spec_name,
        "lgu_id": lgu["id"],
        "lgu_name": lgu["name"],
        "value": value,
        "funding_source": funding,
        "contractor": contractor,
        "location": location,
        "start_date": start,
        "target_completion": target,
        "status": status,
        "progress": progress,
        "description": f"{spec_name} — a public infrastructure undertaking of {lgu['name']}. SYNTHETIC / DEMO project record created for TALA verification demonstration.",
        "is_demo": True,
        "created_at": now_iso(),
    }


def milestones_for(project, count, completed_through):
    """Create `count` milestones; first `completed_through` are completed."""
    out = []
    base_value = project["value"]
    amounts = {
        "Budget Approved": base_value,
        "First Disbursement": round(base_value * 0.15),
        "Progress Update": round(base_value * project["progress"] / 100),
        "Completion": base_value,
    }
    # synthetic monthly-ish dates
    dates = ["2026-01-15", "2026-02-05", "2026-02-28", "2026-03-10", "2026-03-25",
             "2026-04-15", "2026-06-20", "2026-08-30", "2026-12-15"]
    for i in range(count):
        cat, event, office, _dtype = MILESTONE_TEMPLATE[i]
        if i < completed_through:
            mstatus = "Completed"
            vstatus = "Approved"
        elif i == completed_through:
            mstatus = "In Progress"
            vstatus = "Pending Review"
        else:
            mstatus = "Pending"
            vstatus = "Not Submitted"
        out.append({
            "id": nid(),
            "project_id": project["id"],
            "order": i + 1,
            "category": cat,
            "event": event,
            "title": event,
            "date": dates[i],
            "responsible_office": office,
            "amount": amounts.get(event),
            "status": mstatus,
            "verification_status": vstatus,
            "created_at": now_iso(),
        })
    return out


def evidence_for(project, milestone, dtype):
    content = (
        f"ISLA-PROOF SYNTHETIC EVIDENCE\n"
        f"project={project['project_code']}\n"
        f"milestone={milestone['event']}\n"
        f"office={milestone['responsible_office']}\n"
        f"type={dtype}\n"
        f"date={milestone['date']}\n"
        f"NOTE: Demo document. Sensitive contents remain off-chain."
    )
    return {
        "id": nid(),
        "project_id": project["id"],
        "milestone_id": milestone["id"],
        "name": f"{dtype} — {project['project_code']}",
        "document_type": dtype,
        "uploaded_date": milestone["date"],
        "sha256": doc_hash(content),
        "status": "Approved" if milestone["status"] == "Completed" else "Submitted",
        "stellar_status": "Not Attested",
        "stellar_tx": None,
        "content_note": "Sensitive contents stored off-chain (demo).",
        "created_at": now_iso(),
    }


def build_and_insert():
    print("Wiping existing demo collections...")
    for c in ["lgus", "projects", "milestones", "evidence", "packages", "audit_trail"]:
        db[c].delete_many({})

    # LGUs
    for lgu in LGUS:
        lgu["id"] = nid()
        lgu["is_demo"] = True
        lgu["created_at"] = now_iso()
    db.lgus.insert_many(LGUS)

    all_projects = []
    all_milestones = []
    all_evidence = []

    # Main demo project
    main = make_project(
        LGUS[0], "San Isidro Barangay Road Rehabilitation Program",
        50_000_000, "In Progress", 72, "ABC Infrastructure Development Corp.",
        "General Fund + DPWH Grant", "Barangay Poblacion to Barangay Malapit, San Isidro",
        "2026-01-15", "2026-12-15", "PRJ-SI-2026-001",
    )
    all_projects.append(main)
    main_ms = milestones_for(main, 9, 7)  # 7 completed, 8th in progress, 9th pending
    all_milestones.extend(main_ms)
    for m in main_ms:
        if m["status"] != "Pending":
            dtype = MILESTONE_TEMPLATE[m["order"] - 1][3]
            all_evidence.append(evidence_for(main, m, dtype))

    # Other projects
    for idx, spec in enumerate(PROJECT_SPECS):
        lgu = LGUS[spec[0]]
        code = f"PRJ-2026-{idx + 2:03d}"
        p = make_project(lgu, spec[1], spec[2], spec[3], spec[4], spec[5], spec[6], spec[7], spec[8], spec[9], code)
        all_projects.append(p)
        # milestone count depends on progress
        if p["status"] == "Not Started":
            mcount, done = 1, 0
        elif p["status"] == "Completed":
            mcount, done = 9, 9
        elif p["status"] == "Procurement":
            mcount, done = 2, 1
        elif p["status"] == "Review Required":
            mcount, done = 4, 2
        else:
            mcount, done = min(8, max(4, int(p["progress"] / 15) + 2)), max(2, int(p["progress"] / 18))
        ms = milestones_for(p, mcount, done)
        all_milestones.extend(ms)
        for m in ms:
            if m["status"] != "Pending":
                dtype = MILESTONE_TEMPLATE[m["order"] - 1][3]
                all_evidence.append(evidence_for(p, m, dtype))

    db.projects.insert_many(all_projects)
    db.milestones.insert_many(all_milestones)
    db.evidence.insert_many(all_evidence)

    for p in all_projects:
        audit("PROJECT_CREATED", "LGU Administrator", "admin@isla.gov.ph",
              project_id=p["id"], prev="-", result=p["status"])

    print(f"Inserted {len(all_projects)} projects, {len(all_milestones)} milestones, {len(all_evidence)} evidence.")
    return all_projects, all_milestones, all_evidence


def project_documents(project_id, milestone_id=None):
    q = {"project_id": project_id}
    if milestone_id:
        q["milestone_id"] = milestone_id
    return list(db.evidence.find(q, {"_id": 0}))


def create_package(project, code, milestone=None, attest=False):
    docs = project_documents(project["id"], milestone["id"] if milestone else None)
    canonical, pkg_hash = ev.compute_package_hash(project, milestone, docs)
    pkg = {
        "id": nid(),
        "package_code": code,
        "project_id": project["id"],
        "milestone_id": milestone["id"] if milestone else None,
        "scope": "milestone" if milestone else "project",
        "document_ids": [d["id"] for d in docs],
        "canonical_json": canonical,
        "sha256": pkg_hash,
        "status": "Draft",
        "stellar_commitment": None,
        "stellar_tx": None,
        "stellar_ledger": None,
        "explorer_url": None,
        "horizon_url": None,
        "attested_at": None,
        "is_demo": True,
        "created_at": now_iso(),
    }
    audit("PACKAGE_CREATED", "LGU Administrator", "admin@isla.gov.ph",
          project_id=project["id"], package_id=pkg["id"], result="Draft")
    audit("HASH_GENERATED", "LGU Administrator", "admin@isla.gov.ph",
          project_id=project["id"], package_id=pkg["id"], result=pkg_hash[:16] + "...")

    if attest:
        print(f"  Attesting {code} ({pkg_hash[:16]}...) to Stellar Testnet...")
        audit("STELLAR_ATTESTATION_PREPARED", "LGU Administrator", "admin@isla.gov.ph",
              project_id=project["id"], package_id=pkg["id"], result=pkg_hash)
        res = ss.anchor_commitment(pkg_hash)
        pkg.update({
            "status": "Attested",
            "stellar_commitment": pkg_hash,
            "stellar_tx": res["tx_hash"],
            "stellar_ledger": res["ledger"],
            "explorer_url": res["explorer_url"],
            "horizon_url": res["horizon_url"],
            "attested_at": now_iso(),
        })
        db.evidence.update_many(
            {"id": {"$in": pkg["document_ids"]}},
            {"$set": {"stellar_status": "Attested", "stellar_tx": res["tx_hash"]}},
        )
        audit("STELLAR_ATTESTATION_CONFIRMED", "LGU Administrator", "admin@isla.gov.ph",
              project_id=project["id"], package_id=pkg["id"], result=res["tx_hash"])
        print(f"    tx={res['tx_hash']}")

    db.packages.insert_one(pkg)
    return pkg


def main():
    projects, milestones, evid = build_and_insert()
    by_code = {p["project_code"]: p for p in projects}

    # Clean attested packages (VERIFIED)
    create_package(by_code["PRJ-SI-2026-001"], "PKG-2026-001", attest=True)
    create_package(by_code["PRJ-2026-002"], "PKG-2026-002", attest=True)
    create_package(by_code["PRJ-2026-004"], "PKG-2026-003", attest=True)

    # Tampered package: attest, then mutate one evidence metadata so recompute differs
    tampered = create_package(by_code["PRJ-2026-007"], "PKG-2026-004", attest=True)
    one_doc = tampered["document_ids"][0]
    db.evidence.update_one(
        {"id": one_doc},
        {"$set": {"name": "[TAMPERED] Modified Evidence Name — demo"}},
    )
    audit("EVIDENCE_REVIEWED", "LGU Administrator", "admin@isla.gov.ph",
          project_id=tampered["project_id"], package_id=tampered["id"],
          prev="original metadata", result="mutated metadata (tamper demo)")
    print("  PKG-2026-004 intentionally tampered for demo.")

    # Not-attested packages (NOT ATTESTED)
    create_package(by_code["PRJ-2026-003"], "PKG-2026-005", attest=False)
    create_package(by_code["PRJ-2026-010"], "PKG-2026-006", attest=False)

    print("Seed complete.")
    client.close()


if __name__ == "__main__":
    main()
