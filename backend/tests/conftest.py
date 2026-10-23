"""Shared settings for the end-to-end API tests.

test_api.py and test_new_features.py call a running TALA backend. Point them at
it with TALA_API_URL (or REACT_APP_BACKEND_URL), and give them the same
ADMIN_/REVIEWER_/AUDITOR_ EMAIL and PASSWORD variables the backend seeds its
accounts from. Without them those tests are skipped; test_core.py always runs.
"""
import os

import pytest

BASE = (os.environ.get("TALA_API_URL") or os.environ.get("REACT_APP_BACKEND_URL") or "").rstrip("/")
API = f"{BASE}/api"


def _account(role: str) -> dict:
    return {
        "email": os.environ.get(f"{role}_EMAIL", ""),
        "password": os.environ.get(f"{role}_PASSWORD", ""),
    }


ADMIN = _account("ADMIN")
REVIEWER = _account("REVIEWER")
AUDITOR = _account("AUDITOR")

LIVE_READY = bool(BASE) and all(a["email"] and a["password"] for a in (ADMIN, REVIEWER, AUDITOR))

requires_live_backend = pytest.mark.skipif(
    not LIVE_READY,
    reason="set TALA_API_URL and the ADMIN_/REVIEWER_/AUDITOR_ EMAIL and PASSWORD variables",
)
