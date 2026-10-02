"""End-to-end API tests for ISLA Proof backend against public URL."""
import os
import time
import pytest
import requests

BASE = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE:
    # fall back to reading frontend/.env
    try:
        with open("/app/frontend/.env") as f:
            for line in f:
                if line.startswith("REACT_APP_BACKEND_URL="):
                    BASE = line.split("=", 1)[1].strip().rstrip("/")
    except Exception:
        pass

API = f"{BASE}/api"

ADMIN = {"email": "admin@isla.gov.ph", "password": "Admin@123"}
REVIEWER = {"email": "reviewer@isla.gov.ph", "password": "Review@123"}
AUDITOR = {"email": "auditor@isla.gov.ph", "password": "Audit@123"}


@pytest.fixture(scope="session")
def s():
    return requests.Session()


def _login(s, creds):
    r = s.post(f"{API}/auth/login", json=creds, timeout=20)
    assert r.status_code == 200, r.text
    data = r.json()
    assert "token" in data and "user" in data
    return data


@pytest.fixture(scope="session")
def admin_token(s):
    return _login(s, ADMIN)["token"]


@pytest.fixture(scope="session")
def reviewer_token(s):
    return _login(s, REVIEWER)["token"]


@pytest.fixture(scope="session")
def auditor_token(s):
    return _login(s, AUDITOR)["token"]


def H(token):
    return {"Authorization": f"Bearer {token}"}


# ---------------- Dashboard / public ----------------
def test_dashboard_stats_public(s):
    r = s.get(f"{API}/dashboard/stats", timeout=20)
    assert r.status_code == 200
    d = r.json()
    for k in ["total_value", "in_progress", "completed", "verified_proofs",
              "requiring_review", "lgu_count", "recent_activity"]:
        assert k in d, f"missing {k}"
    assert isinstance(d["recent_activity"], list)
    assert d["lgu_count"] >= 1


def test_projects_list_public(s):
    r = s.get(f"{API}/projects", timeout=20)
    assert r.status_code == 200
    arr = r.json()
    assert isinstance(arr, list) and len(arr) > 0


def test_projects_search_q(s):
    r = s.get(f"{API}/projects", params={"q": "San"}, timeout=20)
    assert r.status_code == 200
    assert isinstance(r.json(), list)


def test_projects_filter_status(s):
    r = s.get(f"{API}/projects", params={"status": "Completed"}, timeout=20)
    assert r.status_code == 200
    for p in r.json():
        assert p.get("status") == "Completed"


def test_project_detail_hides_sensitive(s):
    pid = s.get(f"{API}/projects", timeout=20).json()[0]["id"]
    r = s.get(f"{API}/projects/{pid}", timeout=20)
    assert r.status_code == 200
    d = r.json()
    for key in ["project", "milestones", "evidence", "packages"]:
        assert key in d
    for ev in d["evidence"]:
        assert "_original_name" not in ev


# ---------------- Verify (public) ----------------
def _find_pkg_project(s, code):
    for p in s.get(f"{API}/projects", timeout=20).json():
        d = s.get(f"{API}/projects/{p['id']}", timeout=20).json()
        for pkg in d.get("packages", []):
            if pkg.get("package_code") == code:
                return p["id"], pkg["id"]
    return None, None


@pytest.mark.parametrize("code", ["PKG-2026-001", "PKG-2026-002", "PKG-2026-003"])
def test_verify_verified(s, code):
    pid, pkid = _find_pkg_project(s, code)
    assert pid and pkid, f"{code} not found"
    r = s.get(f"{API}/verify/{pid}/{pkid}", timeout=30)
    assert r.status_code == 200
    d = r.json()
    assert d.get("result") == "VERIFIED", d


def test_verify_tampered(s):
    pid, pkid = _find_pkg_project(s, "PKG-2026-004")
    assert pid and pkid
    r = s.get(f"{API}/verify/{pid}/{pkid}", timeout=30)
    assert r.status_code == 200
    assert r.json().get("result") == "TAMPERED"


@pytest.mark.parametrize("code", ["PKG-2026-005", "PKG-2026-006"])
def test_verify_not_attested(s, code):
    pid, pkid = _find_pkg_project(s, code)
    assert pid and pkid
    r = s.get(f"{API}/verify/{pid}/{pkid}", timeout=30)
    assert r.status_code == 200
    assert r.json().get("result") == "NOT_ATTESTED"


# ---------------- Auth ----------------
def test_login_wrong_password(s):
    r = s.post(f"{API}/auth/login", json={"email": ADMIN["email"], "password": "bad"}, timeout=20)
    assert r.status_code == 401


def test_auth_me(s, admin_token):
    r = s.get(f"{API}/auth/me", headers=H(admin_token), timeout=20)
    assert r.status_code == 200
    assert r.json().get("role") == "LGU Administrator"


def test_auth_me_no_token(s):
    r = s.get(f"{API}/auth/me", timeout=20)
    assert r.status_code in (401, 403)


# ---------------- Package creation RBAC ----------------
def _any_project_id(s):
    return s.get(f"{API}/projects", timeout=20).json()[0]["id"]


def test_create_package_no_auth(s):
    r = s.post(f"{API}/packages", json={"project_id": _any_project_id(s)}, timeout=20)
    assert r.status_code in (401, 403)


def test_create_package_reviewer_forbidden(s, reviewer_token):
    r = s.post(f"{API}/packages", json={"project_id": _any_project_id(s)},
               headers=H(reviewer_token), timeout=20)
    assert r.status_code == 403


def test_create_package_auditor_forbidden(s, auditor_token):
    r = s.post(f"{API}/packages", json={"project_id": _any_project_id(s)},
               headers=H(auditor_token), timeout=20)
    assert r.status_code == 403


def test_create_package_admin_ok(s, admin_token):
    pid = _any_project_id(s)
    r = s.post(f"{API}/packages", json={"project_id": pid},
               headers=H(admin_token), timeout=30)
    assert r.status_code in (200, 201), r.text
    pkg = r.json()
    assert len(pkg.get("sha256", "")) == 64
    assert pkg.get("status") in ("Draft", "draft")
    pytest.created_pkg_id = pkg["id"]


# ---------------- Audit ----------------
def test_audit_requires_auth(s):
    r = s.get(f"{API}/audit", timeout=20)
    assert r.status_code in (401, 403)


def test_audit_admin(s, admin_token):
    r = s.get(f"{API}/audit", headers=H(admin_token), timeout=20)
    assert r.status_code == 200
    assert isinstance(r.json(), list)


# ---------------- Tamper / restore demo cycle on existing VERIFIED package ----------------
def test_tamper_restore_cycle(s, admin_token):
    pid, pkid = _find_pkg_project(s, "PKG-2026-001")
    assert pid and pkid
    r = s.get(f"{API}/verify/{pid}/{pkid}", timeout=30)
    assert r.json()["result"] == "VERIFIED"
    r = s.post(f"{API}/demo/tamper/{pkid}", headers=H(admin_token), timeout=20)
    assert r.status_code in (200, 201), r.text
    r = s.get(f"{API}/verify/{pid}/{pkid}", timeout=30)
    assert r.json()["result"] == "TAMPERED"
    r = s.post(f"{API}/demo/restore/{pkid}", headers=H(admin_token), timeout=20)
    assert r.status_code in (200, 201)
    r = s.get(f"{API}/verify/{pid}/{pkid}", timeout=30)
    assert r.json()["result"] == "VERIFIED"


# ---------------- Attest a Draft to Stellar Testnet (one time) ----------------
def test_attest_draft_package(s, admin_token):
    pkid = getattr(pytest, "created_pkg_id", None)
    if not pkid:
        pytest.skip("no draft package created")
    r = s.post(f"{API}/packages/{pkid}/attest", headers=H(admin_token), timeout=60)
    assert r.status_code in (200, 201), r.text
    data = r.json()
    assert data.get("stellar_tx") or data.get("stellar_tx_hash"), data


# ---------------- Reviewer review evidence ----------------
def test_reviewer_review_evidence(s, reviewer_token, admin_token, auditor_token):
    pid = _any_project_id(s)
    d = s.get(f"{API}/projects/{pid}", timeout=20).json()
    ev_list = d.get("evidence", [])
    if not ev_list:
        pytest.skip("no evidence")
    eid = ev_list[0]["id"]
    r = s.post(f"{API}/evidence/{eid}/review", json={"decision": "Approved"},
               headers=H(reviewer_token), timeout=20)
    assert r.status_code in (200, 201), r.text
    # admin forbidden
    r2 = s.post(f"{API}/evidence/{eid}/review", json={"decision": "Approved"},
                headers=H(admin_token), timeout=20)
    assert r2.status_code == 403
    # auditor forbidden
    r3 = s.post(f"{API}/evidence/{eid}/review", json={"decision": "Approved"},
                headers=H(auditor_token), timeout=20)
    assert r3.status_code == 403


# ---------------- Auditor cannot attest ----------------
def test_auditor_cannot_attest(s, auditor_token):
    # try attest on any package
    pid, pkid = _find_pkg_project(s, "PKG-2026-005")
    if not pkid:
        pytest.skip("no package")
    r = s.post(f"{API}/packages/{pkid}/attest", headers=H(auditor_token), timeout=20)
    assert r.status_code == 403
