"""
Live integration test against real DynamoDB.
Runs a full register → login → me → cleanup cycle for a sample user.

Run with:
    python -m pytest test/test_live_auth.py -v -s

Requires valid AWS credentials and DYNAMO_TABLE in .env.
"""

import uuid
import pytest
import boto3
from fastapi.testclient import TestClient
from dotenv import load_dotenv
import os

load_dotenv()

from main import app

client = TestClient(app)

# Unique per run so parallel runs don't collide
SUFFIX = uuid.uuid4().hex[:6]
SAMPLE_USER = {
    "username": f"testuser_{SUFFIX}",
    "email": f"testuser_{SUFFIX}@example.com",
    "password": "TestPass123!",
}


@pytest.fixture(scope="module")
def dynamo_table():
    """Direct DynamoDB handle for cleanup."""
    resource = boto3.resource(
        "dynamodb",
        region_name=os.getenv("AWS_REGION", "eu-north-1"),
        aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
        aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
    )
    return resource.Table(os.getenv("DYNAMO_TABLE", "ar_users"))


@pytest.fixture(scope="module")
def registered(dynamo_table):
    """Register the sample user once; delete from DynamoDB after all tests."""
    res = client.post("/api/auth/register", json=SAMPLE_USER)
    assert res.status_code == 201, res.text
    data = res.json()
    yield data
    # Cleanup
    dynamo_table.delete_item(Key={"user_id": data["user_id"]})
    print(f"\n[cleanup] deleted user {data['user_id']}")


def test_register(registered):
    assert "access_token" in registered
    assert registered["email"] == SAMPLE_USER["email"]
    assert registered["username"] == SAMPLE_USER["username"]
    assert "user_id" in registered
    print(f"\n[register] user_id={registered['user_id']}")


def test_duplicate_register():
    res = client.post("/api/auth/register", json=SAMPLE_USER)
    assert res.status_code == 400
    assert "already" in res.json()["detail"].lower()


def test_login(registered):
    res = client.post("/api/auth/login", json={
        "email": SAMPLE_USER["email"],
        "password": SAMPLE_USER["password"],
    })
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["user_id"] == registered["user_id"]
    print(f"\n[login] token={data['access_token'][:20]}...")


def test_login_wrong_password():
    res = client.post("/api/auth/login", json={
        "email": SAMPLE_USER["email"],
        "password": "wrongpassword",
    })
    assert res.status_code == 401


def test_me(registered):
    token = registered["access_token"]
    res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    data = res.json()
    assert data["user_id"] == registered["user_id"]
    assert data["email"] == SAMPLE_USER["email"]
    assert data["username"] == SAMPLE_USER["username"]
    print(f"\n[me] {data}")


def test_me_invalid_token():
    res = client.get("/api/auth/me", headers={"Authorization": "Bearer invalidtoken"})
    assert res.status_code == 401
