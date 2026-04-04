"""
Tests for all extension-backend endpoints.
Gemini calls are mocked via AsyncMock.
Auth is bypassed by overriding the get_current_user dependency.
DynamoDB calls in auth.py are mocked via unittest.mock.patch.
"""

import hashlib
import pytest
from fastapi.testclient import TestClient
from fastapi import HTTPException
from unittest.mock import patch, AsyncMock, MagicMock
from main import app, adapt_cache, sessions, telemetry_log
from auth import get_current_user

# ─── Auth bypass ─────────────────────────────────────────────────────────────
MOCK_USER = {"sub": "user-123", "email": "test@example.com", "username": "testuser"}
app.dependency_overrides[get_current_user] = lambda: MOCK_USER

client = TestClient(app)


@pytest.fixture(autouse=True)
def clear_stores():
    adapt_cache.clear()
    sessions.clear()
    telemetry_log.clear()


# ─── GET / ────────────────────────────────────────────────────────────────────

def test_root_returns_ok():
    res = client.get("/")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ok"
    assert data["model"] == "gemini-2.0-flash"
    assert "/api/adapt" in data["endpoints"]


# ─── POST /api/auth/register ──────────────────────────────────────────────────

REGISTER_PAYLOAD = {"username": "alice", "email": "alice@example.com", "password": "secret123"}


@patch("auth._get_user_by_email", return_value=None)
@patch("auth._get_user_by_username", return_value=None)
@patch("auth._table")
def test_register_success(mock_table, _u, _e):
    mock_table.put_item = MagicMock()
    res = client.post("/api/auth/register", json=REGISTER_PAYLOAD)
    assert res.status_code == 201
    data = res.json()
    assert "access_token" in data
    assert data["email"] == "alice@example.com"
    assert data["username"] == "alice"
    assert "user_id" in data


@patch("auth._get_user_by_email", return_value={"email": "alice@example.com"})
def test_register_duplicate_email(_mock):
    res = client.post("/api/auth/register", json=REGISTER_PAYLOAD)
    assert res.status_code == 400
    assert "Email already registered" in res.json()["detail"]


@patch("auth._get_user_by_email", return_value=None)
@patch("auth._get_user_by_username", return_value={"username": "alice"})
def test_register_duplicate_username(_u, _e):
    res = client.post("/api/auth/register", json=REGISTER_PAYLOAD)
    assert res.status_code == 400
    assert "Username already taken" in res.json()["detail"]


def test_register_missing_fields():
    res = client.post("/api/auth/register", json={"email": "x@x.com"})
    assert res.status_code == 422


# ─── POST /api/auth/login ─────────────────────────────────────────────────────

def _make_db_user(password_plain="secret123"):
    import bcrypt
    hashed = bcrypt.hashpw(password_plain.encode(), bcrypt.gensalt()).decode()
    return {
        "user_id": "user-123",
        "username": "alice",
        "email": "alice@example.com",
        "password": hashed,
    }


@patch("auth._get_user_by_email", return_value=None)
def test_login_user_not_found(_mock):
    res = client.post("/api/auth/login", json={"email": "no@one.com", "password": "x"})
    assert res.status_code == 401


@patch("auth._get_user_by_email")
def test_login_wrong_password(mock_get):
    mock_get.return_value = _make_db_user("correct")
    res = client.post("/api/auth/login", json={"email": "alice@example.com", "password": "wrong"})
    assert res.status_code == 401


@patch("auth._get_user_by_email")
def test_login_success(mock_get):
    mock_get.return_value = _make_db_user("secret123")
    res = client.post("/api/auth/login", json={"email": "alice@example.com", "password": "secret123"})
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["user_id"] == "user-123"


# ─── GET /api/auth/me ─────────────────────────────────────────────────────────

@patch("auth._get_user_by_email")
def test_me_returns_profile(mock_get):
    mock_get.return_value = {
        "user_id": "user-123",
        "username": "testuser",
        "email": "test@example.com",
        "reading_level": None,
        "preferred_lang": None,
        "fatigue_score": 0,
        "created_at": "2024-01-01T00:00:00+00:00",
    }
    res = client.get("/api/auth/me")
    assert res.status_code == 200
    assert res.json()["user_id"] == "user-123"
    assert res.json()["email"] == "test@example.com"


@patch("auth._get_user_by_email", return_value=None)
def test_me_user_not_found(_mock):
    res = client.get("/api/auth/me")
    assert res.status_code == 404


# ─── Auth guard on protected endpoints ───────────────────────────────────────

def test_adapt_requires_auth():
    # Remove override temporarily
    app.dependency_overrides.pop(get_current_user)
    res = client.post("/api/adapt", json={"paragraph": "test"})
    assert res.status_code == 403
    app.dependency_overrides[get_current_user] = lambda: MOCK_USER


# ─── POST /api/adapt ──────────────────────────────────────────────────────────

GEMINI_ADAPT_RESPONSE = (
    "<p>This is a simple paragraph.</p>"
    " ---JSON--- "
    '[{"original": "complex", "simplified": "simple", "esl_equiv": "simple", "char_offset": 10}]'
    " ---END---"
)


@patch("main.call_gemini", new_callable=AsyncMock)
def test_adapt_basic(mock_gemini):
    mock_gemini.return_value = GEMINI_ADAPT_RESPONSE
    res = client.post("/api/adapt", json={"paragraph": "This is a complex paragraph."})
    assert res.status_code == 200
    data = res.json()
    assert data["cache_hit"] is False
    assert data["replacements"][0]["original"] == "complex"


@patch("main.call_gemini", new_callable=AsyncMock)
def test_adapt_cache_miss_then_hit(mock_gemini):
    mock_gemini.return_value = GEMINI_ADAPT_RESPONSE
    payload = {"paragraph": "Unique paragraph for caching."}
    assert client.post("/api/adapt", json=payload).json()["cache_hit"] is False
    assert client.post("/api/adapt", json=payload).json()["cache_hit"] is True
    mock_gemini.assert_called_once()


def test_adapt_cache_hit_preloaded():
    key = hashlib.sha256("preloaded paragraph".encode()).hexdigest()
    adapt_cache[key] = {"adapted_html": "<p>cached</p>", "replacements": []}
    res = client.post("/api/adapt", json={"paragraph": "preloaded paragraph"})
    assert res.json()["cache_hit"] is True


@patch("main.call_gemini", new_callable=AsyncMock)
def test_adapt_language_affects_cache_key(mock_gemini):
    mock_gemini.return_value = GEMINI_ADAPT_RESPONSE
    client.post("/api/adapt", json={"paragraph": "Same text.", "language": "french"})
    client.post("/api/adapt", json={"paragraph": "Same text.", "language": "hindi"})
    assert mock_gemini.call_count == 2


@patch("main.call_gemini", new_callable=AsyncMock)
def test_adapt_no_json_block(mock_gemini):
    mock_gemini.return_value = "<p>Just HTML.</p>"
    res = client.post("/api/adapt", json={"paragraph": "Some paragraph."})
    assert res.json()["adapted_html"] == "<p>Just HTML.</p>"
    assert res.json()["replacements"] == []


@patch("main.call_gemini", new_callable=AsyncMock)
def test_adapt_malformed_json_block(mock_gemini):
    mock_gemini.return_value = "<p>Text</p> ---JSON--- not valid json ---END---"
    res = client.post("/api/adapt", json={"paragraph": "Some paragraph."})
    assert res.json()["replacements"] == []


@patch("main.call_gemini", new_callable=AsyncMock)
def test_adapt_strips_markdown_fences(mock_gemini):
    mock_gemini.return_value = "```html\n<p>Clean</p>\n``` ---JSON--- [] ---END---"
    res = client.post("/api/adapt", json={"paragraph": "Some paragraph."})
    assert "```" not in res.json()["adapted_html"]


@patch("main.call_gemini", new_callable=AsyncMock)
def test_adapt_gemini_502(mock_gemini):
    mock_gemini.side_effect = HTTPException(status_code=502, detail="Gemini error: boom")
    res = client.post("/api/adapt", json={"paragraph": "Some paragraph."})
    assert res.status_code == 502


@patch("main.call_gemini", new_callable=AsyncMock)
def test_adapt_gemini_503(mock_gemini):
    mock_gemini.side_effect = HTTPException(status_code=503, detail="Gemini unavailable after 3 retries")
    res = client.post("/api/adapt", json={"paragraph": "Some paragraph."})
    assert res.status_code == 503


def test_adapt_missing_paragraph_returns_422():
    res = client.post("/api/adapt", json={})
    assert res.status_code == 422


# ─── POST /api/session/save ───────────────────────────────────────────────────

SESSION_PAYLOAD = {
    "session_id": "sess-001",
    "url": "https://example.com/article",
    "scroll_pct": 0.45,
    "adapted_indices": [1, 3],
    "struggled_indices": [1, 3],
    "dwell_map": {"1": 8000, "3": 12000},
    "rescroll_map": {"3": 2},
    "session_elapsed_min": 7.5,
    "language": "spanish",
}


def test_session_save_returns_saved():
    assert client.post("/api/session/save", json=SESSION_PAYLOAD).json()["saved"] is True


def test_session_save_persists_data():
    client.post("/api/session/save", json=SESSION_PAYLOAD)
    assert sessions["sess-001"]["scroll_pct"] == 0.45


def test_session_save_updated_at_is_utc_aware():
    client.post("/api/session/save", json=SESSION_PAYLOAD)
    ts = sessions["sess-001"]["updated_at"]
    assert "+" in ts or ts.endswith("Z")


def test_session_save_overwrites_existing():
    client.post("/api/session/save", json=SESSION_PAYLOAD)
    client.post("/api/session/save", json={**SESSION_PAYLOAD, "scroll_pct": 0.9})
    assert sessions["sess-001"]["scroll_pct"] == 0.9


def test_session_save_missing_required_fields():
    assert client.post("/api/session/save", json={"session_id": "x"}).status_code == 422


# ─── POST /api/session/restore ────────────────────────────────────────────────

def test_session_restore_found():
    client.post("/api/session/save", json=SESSION_PAYLOAD)
    res = client.post("/api/session/restore", json={"url": "https://example.com/article"})
    data = res.json()
    assert data["found"] is True
    assert data["session_id"] == "sess-001"
    assert data["scroll_pct"] == 0.45


def test_session_restore_not_found():
    res = client.post("/api/session/restore", json={"url": "https://no-session.com"})
    assert res.json()["found"] is False


def test_session_restore_returns_most_recent():
    import time
    client.post("/api/session/save", json={**SESSION_PAYLOAD, "session_id": "old", "scroll_pct": 0.1})
    time.sleep(0.01)
    client.post("/api/session/save", json={**SESSION_PAYLOAD, "session_id": "new", "scroll_pct": 0.9})
    res = client.post("/api/session/restore", json={"url": "https://example.com/article"})
    assert res.json()["session_id"] == "new"


def test_session_restore_missing_url_returns_422():
    assert client.post("/api/session/restore", json={}).status_code == 422


# ─── POST /api/review ─────────────────────────────────────────────────────────

REVIEW_ITEMS = '[{"term": "mitosis", "definition": "cell division", "esl_equiv": "mitosis", "source_paragraph_index": 2}]'


@patch("main.call_gemini", new_callable=AsyncMock)
def test_review_basic(mock_gemini):
    mock_gemini.return_value = REVIEW_ITEMS
    res = client.post("/api/review", json={
        "session_id": "s",
        "paragraphs": [{"index": 2, "text": "Mitosis is complex.", "dwell_ms": 9000, "rescroll_count": 2}],
    })
    assert res.json()["items"][0]["term"] == "mitosis"


@patch("main.call_gemini", new_callable=AsyncMock)
def test_review_empty_paragraphs(mock_gemini):
    res = client.post("/api/review", json={"session_id": "s", "paragraphs": []})
    assert res.json()["items"] == []
    mock_gemini.assert_not_called()


@patch("main.call_gemini", new_callable=AsyncMock)
def test_review_sorts_by_struggle(mock_gemini):
    mock_gemini.return_value = "[]"
    client.post("/api/review", json={
        "session_id": "s",
        "paragraphs": [
            {"index": 0, "text": "Easy.", "dwell_ms": 1000, "rescroll_count": 0},
            {"index": 1, "text": "Hard.", "dwell_ms": 15000, "rescroll_count": 5},
        ],
    })
    prompt = mock_gemini.call_args[0][0]
    assert prompt.index("[1]") < prompt.index("[0]")


@patch("main.call_gemini", new_callable=AsyncMock)
def test_review_malformed_response(mock_gemini):
    mock_gemini.return_value = "not json"
    res = client.post("/api/review", json={"session_id": "s", "paragraphs": [{"index": 0, "text": "T.", "dwell_ms": 5000}]})
    assert res.json()["items"] == []


@patch("main.call_gemini", new_callable=AsyncMock)
def test_review_gemini_502(mock_gemini):
    mock_gemini.side_effect = HTTPException(status_code=502, detail="Gemini error: timeout")
    res = client.post("/api/review", json={"session_id": "s", "paragraphs": [{"index": 0, "text": "T.", "dwell_ms": 5000}]})
    assert res.status_code == 502


def test_review_missing_session_id_returns_422():
    assert client.post("/api/review", json={"paragraphs": []}).status_code == 422


# ─── POST /api/telemetry ──────────────────────────────────────────────────────

TELEMETRY_PAYLOAD = {
    "session_id": "sess-001",
    "url": "https://example.com/article",
    "event": "struggle_detected",
    "paragraph_index": 3,
    "dwell_ms": 12000,
    "rescroll_count": 2,
    "session_elapsed_min": 5.0,
}


def test_telemetry_returns_ok():
    assert client.post("/api/telemetry", json=TELEMETRY_PAYLOAD).json()["ok"] is True


def test_telemetry_appends_to_log():
    client.post("/api/telemetry", json=TELEMETRY_PAYLOAD)
    assert len(telemetry_log) == 1
    assert telemetry_log[0]["event"] == "struggle_detected"
    assert "ts" in telemetry_log[0]


def test_telemetry_ts_is_utc_aware():
    client.post("/api/telemetry", json=TELEMETRY_PAYLOAD)
    ts = telemetry_log[0]["ts"]
    assert "+" in ts or ts.endswith("Z")


def test_telemetry_multiple_events_accumulate():
    for event in ["struggle_detected", "adaptation_shown", "peek_entered", "session_ended"]:
        client.post("/api/telemetry", json={**TELEMETRY_PAYLOAD, "event": event})
    assert len(telemetry_log) == 4


def test_telemetry_missing_required_fields():
    assert client.post("/api/telemetry", json={"session_id": "s", "url": "https://x.com"}).status_code == 422
