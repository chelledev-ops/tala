import asyncio
import logging
import os
import uuid
from datetime import datetime, timezone
from pathlib import Path

from dotenv import load_dotenv

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

from fastapi import APIRouter, Depends, FastAPI, HTTPException
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel
from starlette.middleware.cors import CORSMiddleware

import evidence as ev
import stellar_service as ss
from auth import (create_access_token, get_current_user, hash_password,
                  require_roles, verify_password)

mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

app = FastAPI(title="ISLA Proof API")
api = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("isla")

ROLE_ADMIN = "LGU Administrator"
ROLE_REVIEWER = "LGU Reviewer"
ROLE_AUDITOR = "Auditor"

NO_ID = {"_id": 0}


def now_iso():
    return datetime.now(timezone.utc).isoformat()


def nid():
    return str(uuid.uuid4())


async def write_audit(action, user, project_id=None, milestone_id=None,
                      package_id=None, prev="-", result="-"):
    await db.audit_trail.insert_one({
        "id": nid(),
        "actor": user.get("email") if user else "public",
        "role": user.get("role") if user else "Public User",
        "action": action,
        "project_id": project_id,
        "milestone_id": milestone_id,
        "package_id": package_id,
        "previous_state": prev,
        "resulting_state": result,
        "timestamp": now_iso(),
    })


# ---------- Auth ----------
class LoginReq(BaseModel):
    email: str
    password: str


@api.post("/auth/login")
async def login(req: LoginReq):
    user = await db.users.find_one({"email": req.email.lower().strip()})
    if not user or not verify_password(req.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    safe = {"id": user["id"], "email": user["email"], "name": user["name"], "role": user["role"]}
    token = create_access_token(safe)
    return {"token": token, "user": safe}


@api.get("/auth/me")
async def me(user: dict = Depends(get_current_user)):
    return user


# ---------- LGUs ----------
@api.get("/lgus")
async def list_lgus():
    return await db.lgus.find({}, NO_ID).sort("name", 1).to_list(100)


# ---------- Dashboard ----------
@api.get("/dashboard/stats")
async def dashboard_stats():
    projects = await db.projects.find({}, NO_ID).to_list(1000)
    total_value = sum(p["value"] for p in projects)
    attested = await db.packages.count_documents({"status": "Attested"})
    recent = await db.audit_trail.find({}, NO_ID).sort("timestamp", -1).to_list(8)
    return {
        "total_projects": len(projects),
        "total_value": total_value,
        "in_progress": sum(1 for p in projects if p["status"] == "In Progress"),
        "completed": sum(1 for p in projects if p["status"] == "Completed"),
        "verified_proofs": attested,
        "requiring_review": sum(1 for p in projects if p["status"] == "Review Required"),
        "lgu_count": await db.lgus.count_documents({}),
        "recent_activity": recent,
    }


# ---------- Projects ----------
@api.get("/projects")
async def list_projects(lgu_id: str | None = None, status: str | None = None, q: str | None = None):
    query = {}
    if lgu_id:
        query["lgu_id"] = lgu_id
    if status:
        query["status"] = status
    if q:
        query["$or"] = [
            {"name": {"$regex": q, "$options": "i"}},
            {"project_code": {"$regex": q, "$options": "i"}},
            {"lgu_name": {"$regex": q, "$options": "i"}},
            {"contractor": {"$regex": q, "$options": "i"}},
        ]
    projects = await db.projects.find(query, NO_ID).sort("created_at", -1).to_list(200)
    # attach package counts
    for p in projects:
        p["package_count"] = await db.packages.count_documents({"project_id": p["id"]})
        p["attested_count"] = await db.packages.count_documents({"project_id": p["id"], "status": "Attested"})
    return projects


@api.get("/projects/{project_id}")
async def get_project(project_id: str):
    project = await db.projects.find_one({"id": project_id}, NO_ID)
    if not project:
        raise HTTPException(404, "Project not found")
    milestones = await db.milestones.find({"project_id": project_id}, NO_ID).sort("order", 1).to_list(50)
    evidence = await db.evidence.find({"project_id": project_id}, NO_ID).to_list(200)
    # strip private fields from public evidence view
    for e in evidence:
        e.pop("_original_name", None)
    packages = await db.packages.find({"project_id": project_id}, NO_ID).to_list(50)
    for pkg in packages:
        pkg.pop("canonical_json", None)
    return {"project": project, "milestones": milestones, "evidence": evidence, "packages": packages}


# ---------- Packages ----------
async def _gather_scope(package):
    project = await db.projects.find_one({"id": package["project_id"]}, NO_ID)
    milestone = None
    if package.get("milestone_id"):
        milestone = await db.milestones.find_one({"id": package["milestone_id"]}, NO_ID)
    docs = await db.evidence.find({"id": {"$in": package["document_ids"]}}, NO_ID).to_list(200)
    return project, milestone, docs


@api.get("/packages")
async def list_packages():
    packages = await db.packages.find({}, NO_ID).sort("created_at", -1).to_list(100)
    for pkg in packages:
        pkg.pop("canonical_json", None)
        proj = await db.projects.find_one({"id": pkg["project_id"]}, {"_id": 0, "name": 1, "lgu_name": 1})
        pkg["project_name"] = proj["name"] if proj else "Unknown"
        pkg["lgu_name"] = proj["lgu_name"] if proj else ""
    return packages


class CreatePackageReq(BaseModel):
    project_id: str
    milestone_id: str | None = None
    package_code: str | None = None


@api.post("/packages")
async def create_package(req: CreatePackageReq, user: dict = Depends(require_roles(ROLE_ADMIN))):
    project = await db.projects.find_one({"id": req.project_id}, NO_ID)
    if not project:
        raise HTTPException(404, "Project not found")
    milestone = None
    if req.milestone_id:
        milestone = await db.milestones.find_one({"id": req.milestone_id}, NO_ID)
    q = {"project_id": req.project_id}
    if req.milestone_id:
        q["milestone_id"] = req.milestone_id
    docs = await db.evidence.find(q, NO_ID).to_list(200)
    if not docs:
        raise HTTPException(400, "No evidence available for this scope")
    canonical, pkg_hash = ev.compute_package_hash(project, milestone, docs)
    count = await db.packages.count_documents({})
    code = req.package_code or f"PKG-2026-{count + 1:03d}"
    pkg = {
        "id": nid(), "package_code": code, "project_id": req.project_id,
        "milestone_id": req.milestone_id, "scope": "milestone" if milestone else "project",
        "document_ids": [d["id"] for d in docs], "canonical_json": canonical, "sha256": pkg_hash,
        "status": "Draft", "stellar_commitment": None, "stellar_tx": None, "stellar_ledger": None,
        "explorer_url": None, "horizon_url": None, "attested_at": None, "is_demo": True,
        "created_at": now_iso(),
    }
    await db.packages.insert_one(pkg)
    await write_audit("PACKAGE_CREATED", user, project_id=req.project_id, package_id=pkg["id"], result="Draft")
    await write_audit("HASH_GENERATED", user, project_id=req.project_id, package_id=pkg["id"], result=pkg_hash[:16] + "...")
    pkg.pop("_id", None)
    return pkg


@api.get("/packages/{package_id}")
async def get_package(package_id: str):
    pkg = await db.packages.find_one({"id": package_id}, NO_ID)
    if not pkg:
        raise HTTPException(404, "Package not found")
    project, milestone, docs = await _gather_scope(pkg)
    for d in docs:
        d.pop("_original_name", None)
    pkg["current_canonical"], pkg["current_sha256"] = ev.compute_package_hash(project, milestone, docs)
    pkg["documents"] = docs
    pkg["project_name"] = project["name"] if project else ""
    pkg["lgu_name"] = project["lgu_name"] if project else ""
    return pkg


@api.post("/packages/{package_id}/attest")
async def attest_package(package_id: str, user: dict = Depends(require_roles(ROLE_ADMIN))):
    pkg = await db.packages.find_one({"id": package_id}, NO_ID)
    if not pkg:
        raise HTTPException(404, "Package not found")
    if pkg.get("stellar_tx"):
        raise HTTPException(400, "Package already attested")
    project, milestone, docs = await _gather_scope(pkg)
    _, pkg_hash = ev.compute_package_hash(project, milestone, docs)
    await write_audit("STELLAR_ATTESTATION_PREPARED", user, project_id=pkg["project_id"], package_id=package_id, result=pkg_hash)
    try:
        res = await asyncio.to_thread(ss.anchor_commitment, pkg_hash)
    except Exception as exc:
        logger.exception("Stellar attestation failed")
        raise HTTPException(502, f"Stellar Testnet submission failed: {type(exc).__name__}")
    update = {
        "status": "Attested", "sha256": pkg_hash, "stellar_commitment": pkg_hash,
        "stellar_tx": res["tx_hash"], "stellar_ledger": res["ledger"],
        "explorer_url": res["explorer_url"], "horizon_url": res["horizon_url"],
        "attested_at": now_iso(),
    }
    await db.packages.update_one({"id": package_id}, {"$set": update})
    await db.evidence.update_many({"id": {"$in": pkg["document_ids"]}},
                                  {"$set": {"stellar_status": "Attested", "stellar_tx": res["tx_hash"]}})
    await write_audit("STELLAR_ATTESTATION_CONFIRMED", user, project_id=pkg["project_id"], package_id=package_id, result=res["tx_hash"])
    pkg.update(update)
    return pkg


# ---------- Verification (public) ----------
@api.get("/verify/{project_id}/{package_id}")
async def verify(project_id: str, package_id: str):
    pkg = await db.packages.find_one({"id": package_id, "project_id": project_id}, NO_ID)
    if not pkg:
        raise HTTPException(404, "Package not found for this project")
    project, milestone, docs = await _gather_scope(pkg)
    _, current_hash = ev.compute_package_hash(project, milestone, docs)

    onchain_hash = pkg.get("stellar_commitment")
    onchain = None
    if pkg.get("stellar_tx"):
        try:
            onchain = await asyncio.to_thread(ss.fetch_onchain_commitment, pkg["stellar_tx"])
            if onchain.get("onchain_sha256"):
                onchain_hash = onchain["onchain_sha256"]
        except Exception:
            logger.warning("Could not read on-chain record; using stored commitment")

    if not pkg.get("stellar_tx"):
        result = "NOT_ATTESTED"
    elif current_hash == onchain_hash:
        result = "VERIFIED"
    else:
        result = "TAMPERED"

    await write_audit("VERIFICATION_PERFORMED", None, project_id=project_id, package_id=package_id, result=result)
    return {
        "result": result,
        "project_id": project_id,
        "project_name": project["name"] if project else "",
        "lgu_name": project["lgu_name"] if project else "",
        "package_code": pkg["package_code"],
        "current_sha256": current_hash,
        "stellar_commitment": onchain_hash,
        "stellar_tx": pkg.get("stellar_tx"),
        "stellar_ledger": pkg.get("stellar_ledger"),
        "explorer_url": pkg.get("explorer_url"),
        "horizon_url": pkg.get("horizon_url"),
        "attested_at": pkg.get("attested_at"),
        "onchain": onchain,
        "document_count": len(docs),
    }


# ---------- Evidence review (reviewer) ----------
class ReviewReq(BaseModel):
    decision: str  # Approved | Rejected


@api.post("/evidence/{evidence_id}/review")
async def review_evidence(evidence_id: str, req: ReviewReq, user: dict = Depends(require_roles(ROLE_REVIEWER))):
    e = await db.evidence.find_one({"id": evidence_id}, NO_ID)
    if not e:
        raise HTTPException(404, "Evidence not found")
    prev = e["status"]
    await db.evidence.update_one({"id": evidence_id}, {"$set": {"status": req.decision}})
    await write_audit("EVIDENCE_REVIEWED", user, project_id=e["project_id"],
                      milestone_id=e["milestone_id"], prev=prev, result=req.decision)
    return {"ok": True, "evidence_id": evidence_id, "status": req.decision}


# ---------- Audit trail ----------
@api.get("/audit")
async def audit_trail(project_id: str | None = None,
                      user: dict = Depends(require_roles(ROLE_ADMIN, ROLE_REVIEWER, ROLE_AUDITOR))):
    query = {"project_id": project_id} if project_id else {}
    return await db.audit_trail.find(query, NO_ID).sort("timestamp", -1).to_list(500)


# ---------- Demo: tamper / restore ----------
@api.post("/demo/tamper/{package_id}")
async def demo_tamper(package_id: str, user: dict = Depends(require_roles(ROLE_ADMIN))):
    pkg = await db.packages.find_one({"id": package_id}, NO_ID)
    if not pkg or not pkg["document_ids"]:
        raise HTTPException(404, "Package or evidence not found")
    doc_id = pkg["document_ids"][0]
    e = await db.evidence.find_one({"id": doc_id})
    if "_original_name" not in e:
        await db.evidence.update_one({"id": doc_id}, {"$set": {"_original_name": e["name"]}})
    await db.evidence.update_one({"id": doc_id},
                                 {"$set": {"name": "[TAMPERED] " + e["name"]}})
    await write_audit("EVIDENCE_REVIEWED", user, project_id=pkg["project_id"], package_id=package_id,
                      prev="original metadata", result="mutated metadata (tamper demo)")
    return {"ok": True, "message": "Evidence metadata modified for demo."}


@api.post("/demo/restore/{package_id}")
async def demo_restore(package_id: str, user: dict = Depends(require_roles(ROLE_ADMIN))):
    pkg = await db.packages.find_one({"id": package_id}, NO_ID)
    if not pkg or not pkg["document_ids"]:
        raise HTTPException(404, "Package or evidence not found")
    doc_id = pkg["document_ids"][0]
    e = await db.evidence.find_one({"id": doc_id})
    if e.get("_original_name"):
        await db.evidence.update_one({"id": doc_id},
                                     {"$set": {"name": e["_original_name"]}, "$unset": {"_original_name": ""}})
    await write_audit("EVIDENCE_REVIEWED", user, project_id=pkg["project_id"], package_id=package_id,
                      prev="mutated metadata", result="restored original (demo)")
    return {"ok": True, "message": "Evidence metadata restored."}


@api.get("/")
async def root():
    return {"service": "ISLA Proof", "network": "stellar-testnet", "status": "ok"}


app.include_router(api)
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)


async def seed_users():
    await db.users.create_index("email", unique=True)
    accounts = [
        (os.environ["ADMIN_EMAIL"], os.environ["ADMIN_PASSWORD"], "Maria Santos", ROLE_ADMIN),
        (os.environ["REVIEWER_EMAIL"], os.environ["REVIEWER_PASSWORD"], "Jose Dela Cruz", ROLE_REVIEWER),
        (os.environ["AUDITOR_EMAIL"], os.environ["AUDITOR_PASSWORD"], "Ana Reyes", ROLE_AUDITOR),
    ]
    for email, pw, name, role in accounts:
        email = email.lower().strip()
        existing = await db.users.find_one({"email": email})
        if existing is None:
            await db.users.insert_one({
                "id": nid(), "email": email, "password_hash": hash_password(pw),
                "name": name, "role": role, "created_at": now_iso(),
            })
        elif not verify_password(pw, existing["password_hash"]):
            await db.users.update_one({"email": email}, {"$set": {"password_hash": hash_password(pw)}})


@app.on_event("startup")
async def on_startup():
    await seed_users()


@app.on_event("shutdown")
async def on_shutdown():
    client.close()
