"""Tests for new features: pilot signup, evidence upload, evidence download."""
import os
import io
import hashlib
import pytest
import requests

BASE = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE:
    with open("/app/frontend/.env") as f:
        for line in f:
            if line.startswith("REACT_APP_BACKEND_URL="):
                BASE = line.split("=", 1)[1].strip().rstrip("/")
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
    return r.json()["token"]


@pytest.fixture(scope="session")
def admin_token(s): return _login(s, ADMIN)
@pytest.fixture(scope="session")
def reviewer_token(s): return _login(s, REVIEWER)
@pytest.fixture(scope="session")
def auditor_token(s): return _login(s, AUDITOR)


def H(t): return {"Authorization": f"Bearer {t}"}


# ---------------- Pilot signup ----------------
def test_pilot_submit_public(s):
    payload = {
        "full_name": "TEST Pilot User",
        "organization": "TEST LGU",
        "email": "test_pilot@example.com",
        "interest": "Transparency",
        "message": "Please add our LGU",
    }
    r = s.post(f"{API}/pilot", json=payload, timeout=20)
    assert r.status_code in (200, 201), r.text
    d = r.json()
    assert d.get("ok") is True
    assert isinstance(d.get("id"), str) and len(d["id"]) > 0


def test_pilot_missing_required(s):
    r = s.post(f"{API}/pilot", json={"full_name": "x"}, timeout=20)
    assert r.status_code in (400, 422)


# ---------------- Evidence upload ----------------
def _first_milestone(s):
    pid = s.get(f"{API}/projects", timeout=20).json()[0]["id"]
    d = s.get(f"{API}/projects/{pid}", timeout=20).json()
    return pid, d["milestones"][0]["id"]


def _upload_payload():
    content = b"TEST evidence content for upload %s" % os.urandom(8)
    return content, hashlib.sha256(content).hexdigest()


def test_upload_evidence_requires_auth(s):
    pid, mid = _first_milestone(s)
    content, _ = _upload_payload()
    files = {"file": ("test.txt", io.BytesIO(content), "text/plain")}
    data = {"name": "TEST Doc", "document_type": "Report"}
    r = s.post(f"{API}/milestones/{mid}/evidence", data=data, files=files, timeout=30)
    assert r.status_code in (401, 403)


def test_upload_evidence_reviewer_forbidden(s, reviewer_token):
    pid, mid = _first_milestone(s)
    content, _ = _upload_payload()
    files = {"file": ("test.txt", io.BytesIO(content), "text/plain")}
    data = {"name": "TEST Doc", "document_type": "Report"}
    r = s.post(f"{API}/milestones/{mid}/evidence", data=data, files=files,
               headers=H(reviewer_token), timeout=30)
    assert r.status_code == 403


def test_upload_evidence_auditor_forbidden(s, auditor_token):
    pid, mid = _first_milestone(s)
    content, _ = _upload_payload()
    files = {"file": ("test.txt", io.BytesIO(content), "text/plain")}
    data = {"name": "TEST Doc", "document_type": "Report"}
    r = s.post(f"{API}/milestones/{mid}/evidence", data=data, files=files,
               headers=H(auditor_token), timeout=30)
    assert r.status_code == 403


@pytest.fixture(scope="module")
def uploaded_evidence(s, admin_token):
    pid, mid = _first_milestone(s)
    content, sha = _upload_payload()
    files = {"file": ("test_upload.txt", io.BytesIO(content), "text/plain")}
    data = {"name": "TEST Upload Doc", "document_type": "Report"}
    r = s.post(f"{API}/milestones/{mid}/evidence", data=data, files=files,
               headers=H(admin_token), timeout=60)
    assert r.status_code in (200, 201), r.text
    ev = r.json()
    return {"pid": pid, "mid": mid, "evidence": ev, "sha": sha, "content": content}


def test_upload_evidence_admin_ok(uploaded_evidence):
    ev = uploaded_evidence["evidence"]
    assert len(ev["sha256"]) == 64
    assert ev["sha256"] == uploaded_evidence["sha"]
    assert ev["status"] == "Submitted"
    assert "storage_path" not in ev  # private
    assert "id" in ev


def test_project_view_hides_storage_path(s, uploaded_evidence):
    pid = uploaded_evidence["pid"]
    ev_id = uploaded_evidence["evidence"]["id"]
    r = s.get(f"{API}/projects/{pid}", timeout=20)
    assert r.status_code == 200
    d = r.json()
    found = [e for e in d["evidence"] if e["id"] == ev_id]
    assert found, "uploaded evidence missing from project view"
    for ev in d["evidence"]:
        assert "storage_path" not in ev
        assert "_original_name" not in ev


# ---------------- Evidence download ----------------
def test_evidence_download_requires_auth(s, uploaded_evidence):
    eid = uploaded_evidence["evidence"]["id"]
    r = s.get(f"{API}/evidence/{eid}/download", timeout=20)
    assert r.status_code == 401


def test_evidence_download_with_auth(s, uploaded_evidence, admin_token):
    eid = uploaded_evidence["evidence"]["id"]
    r = s.get(f"{API}/evidence/{eid}/download", headers=H(admin_token), timeout=30)
    assert r.status_code == 200
    assert r.content == uploaded_evidence["content"]


def test_evidence_download_auditor_ok(s, uploaded_evidence, auditor_token):
    eid = uploaded_evidence["evidence"]["id"]
    r = s.get(f"{API}/evidence/{eid}/download", headers=H(auditor_token), timeout=30)
    # Any authenticated staff can download
    assert r.status_code == 200
