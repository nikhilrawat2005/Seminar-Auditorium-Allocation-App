import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.file_db import db

client = TestClient(app)

def test_api_root():
    res = client.get("/")
    assert res.status_code == 200
    assert res.json()["status"] == "online"

def test_login_admin():
    res = client.post("/api/v1/auth/login", json={
        "email": "admin1@college.edu",
        "password": "admin123"
    })
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data

def test_login_applicant():
    res = client.post("/api/v1/auth/login", json={
        "email": "techclub@college.edu",
        "password": "club123"
    })
    assert res.status_code == 200
    assert "access_token" in res.json()

def test_rbac_applicant_cannot_access_admin_users():
    # Login as applicant
    app_login = client.post("/api/v1/auth/login", json={
        "email": "techclub@college.edu",
        "password": "club123"
    }).json()
    token = app_login["access_token"]

    # Try listing all users (admin only)
    res = client.get("/api/v1/users", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 403

def test_venues_listing():
    res = client.get("/api/v1/venues")
    assert res.status_code == 200
    venues = res.json()
    assert len(venues) >= 4

def test_public_calendar_sanitized():
    res = client.get("/api/v1/calendar")
    assert res.status_code == 200
    items = res.json()
    assert len(items) >= 1
    # Verify no private fields are leaked
    for item in items:
        assert "event_name" in item
        assert "venue_name" in item
        assert "organization_name" in item
        assert "email" not in item
        assert "remarks" not in item
