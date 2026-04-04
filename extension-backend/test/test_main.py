import hashlib
import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, AsyncMock
from main import app, adapt_cache, sessions, telemetry_log

client = TestClient(app)


@pytest.fixture(autouse=True)
def clear_stores():
    """Reset in-memory stores before each test."""
    adapt_cache.clear()
    sessions.clear()
    telemetry_log.clear()


# ─── GET / ────────────────────────────────────────────────────────────────────

def test_root_returns_ok():
    res = client.get("/")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ok"
    assert "/api/adapt" in data["endpoints"]
    assert "/api/session/save" in data["endpoints"]
    assert "/api/session/restore" in data["endpoints"]
    assert "/api/review" in data["endpoints"]
    assert "/api/telemetry" in data["endpoints"]


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
    assert "adapted_html" in data
    assert "replacements" in data
    assert data["cache_hit"] is False
    assert data["replacements"][0]["original"] == "complex"


@patch("main.call_gemini", new_callable=AsyncMock)
def test_adapt_with_language(mock_gemini):
    mock_gemini.return_value = GEMINI_ADAPT_RESPONSE
    res = client.post("/api/adapt", json={"paragraph": "Some text.", "language": "spanish"})
    assert res.status_code == 200
    # Confirm language was passed — Gemini prompt should have been called once
    mock_gemini.assert_called_once()
    prompt_arg = mock_gemini.call_args[0][0]
    assert "spanish" in prompt_arg.lower()


@patch("main.call_gemini", new_callable=AsyncMock)
def test_adapt_cache_miss_then_hit(mock_gemini):
    mock_gemini.return_value = GEMINI_ADAPT_RESPONSE

    payload = {"paragraph": "Unique paragraph for caching."}
    # First call — cache miss
    res1 = client.post("/api/adapt", json=payload)
    assert res1.json()["cache_hit"] is False

    # Second call — cache hit, Gemini should NOT be called again
    res2 = client.post("/api/adapt", json=payload)
    assert res2.json()["cache_hit"] is True
    mock_gemini.assert_called_once()


def test_adapt_cache_hit_preloaded():
    key = hashlib.sha256("preloaded paragraph".encode()).hexdigest()
    adapt_cache[key] = {"adapted_html": "<p>cached</p>", "replacements": []}

    res = client.post("/api/adapt", json={"paragraph": "preloaded paragraph"})
    assert res.status_code == 200
    assert res.json()["cache_hit"] is True
    assert res.json()["adapted_html"] == "<p>cached</p>"


@patch("main.call_gemini", new_callable=AsyncMock)
def test_adapt_language_affects_cache_key(mock_gemini):
    """Same paragraph with different languages should be cached separately."""
    mock_gemini.return_value = GEMINI_ADAPT_RESPONSE

    client.post("/api/adapt", json={"paragraph": "Same text.", "language": "french"})
    client.post("/api/adapt", json={"paragraph": "Same text.", "language": "hindi"})
    # Both should be cache misses → Gemini called twice
    assert mock_gemini.call_count == 2


@patch("main.call_gemini", new_callable=AsyncMock)
def test_adapt_no_json_block(mock_gemini):
    """Gemini response without ---JSON--- block should still return adapted_html."""
    mock_gemini.return_value = "<p>Just HTML, no JSON block.</p>"
    res = client.post("/api/adapt", json={"paragraph": "Some paragraph."})
    assert res.status_code == 200
    data = res.json()
    assert data["adapted_html"] == "<p>Just HTML, no JSON block.</p>"
    assert data["replacements"] == []


@patch("main.call_gemini", new_callable=AsyncMock)
def test_adapt_malformed_json_block(mock_gemini):
    """Malformed JSON in the block should result in empty replacements, not a crash."""
    mock_gemini.return_value = "<p>Text</p> ---JSON--- not valid json ---END---"
    res = client.post("/api/adapt", json={"paragraph": "Some paragraph."})
    assert res.status_code == 200
    assert res.json()["replacements"] == []


@patch("main.call_gemini", new_callable=AsyncMock)
def test_adapt_strips_markdown_fences(mock_gemini):
    mock_gemini.return_value = "```html\n<p>Clean</p>\n``` ---JSON--- [] ---END---"
    res = client.post("/api/adapt", json={"paragraph": "Some paragraph."})
    assert res.status_code == 200
    assert "```" not in res.json()["adapted_html"]


@patch("main.call_gemini", new_callable=AsyncMock)
def test_adapt_gemini_error_returns_502(mock_gemini):
    mock_gemini.side_effect = Exception("Gemini is down")
    res = client.post("/api/adapt", json={"paragraph": "Some paragraph."})
    assert res.status_code == 502
    assert "Gemini error" in res.json()["detail"]


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
    res = client.post("/api/session/save", json=SESSION_PAYLOAD)
    assert res.status_code == 200
    assert res.json()["saved"] is True


def test_session_save_persists_data():
    client.post("/api/session/save", json=SESSION_PAYLOAD)
    assert "sess-001" in sessions
    assert sessions["sess-001"]["url"] == "https://example.com/article"
    assert sessions["sess-001"]["scroll_pct"] == 0.45


def test_session_save_overwrites_existing():
    client.post("/api/session/save", json=SESSION_PAYLOAD)
    updated = {**SESSION_PAYLOAD, "scroll_pct": 0.9}
    client.post("/api/session/save", json=updated)
    assert sessions["sess-001"]["scroll_pct"] == 0.9


def test_session_save_minimal_payload():
    """Only required fields — optional fields should default."""
    res = client.post("/api/session/save", json={"session_id": "min-sess", "url": "https://x.com"})
    assert res.status_code == 200
    assert res.json()["saved"] is True


def test_session_save_missing_required_fields():
    res = client.post("/api/session/save", json={"session_id": "no-url"})
    assert res.status_code == 422


# ─── POST /api/session/restore ────────────────────────────────────────────────

def test_session_restore_found():
    client.post("/api/session/save", json=SESSION_PAYLOAD)
    res = client.post("/api/session/restore", json={"url": "https://example.com/article"})
    assert res.status_code == 200
    data = res.json()
    assert data["found"] is True
    assert data["session_id"] == "sess-001"
    assert data["scroll_pct"] == 0.45
    assert "dwell_map" in data
    assert "rescroll_map" in data
    assert "session_elapsed_min" in data


def test_session_restore_not_found():
    res = client.post("/api/session/restore", json={"url": "https://no-session.com"})
    assert res.status_code == 200
    assert res.json()["found"] is False


def test_session_restore_returns_most_recent():
    """When multiple sessions exist for the same URL, the latest should be returned."""
    import time

    old = {**SESSION_PAYLOAD, "session_id": "old-sess", "scroll_pct": 0.1}
    new = {**SESSION_PAYLOAD, "session_id": "new-sess", "scroll_pct": 0.9}
    client.post("/api/session/save", json=old)
    time.sleep(0.01)  # ensure different updated_at timestamps
    client.post("/api/session/save", json=new)

    res = client.post("/api/session/restore", json={"url": "https://example.com/article"})
    assert res.json()["session_id"] == "new-sess"
    assert res.json()["scroll_pct"] == 0.9


def test_session_restore_adapted_paragraphs_is_dict():
    client.post("/api/session/save", json=SESSION_PAYLOAD)
    res = client.post("/api/session/restore", json={"url": "https://example.com/article"})
    assert isinstance(res.json()["adapted_paragraphs"], dict)


def test_session_restore_missing_url_returns_422():
    res = client.post("/api/session/restore", json={})
    assert res.status_code == 422


# ─── POST /api/review ─────────────────────────────────────────────────────────

REVIEW_ITEMS = (
    '[{"term": "mitosis", "definition": "cell division", '
    '"esl_equiv": "mitosis", "source_paragraph_index": 2}]'
)


@patch("main.call_gemini", new_callable=AsyncMock)
def test_review_basic(mock_gemini):
    mock_gemini.return_value = REVIEW_ITEMS
    res = client.post("/api/review", json={
        "session_id": "sess-001",
        "paragraphs": [{"index": 2, "text": "Mitosis is complex.", "dwell_ms": 9000, "rescroll_count": 2}],
    })
    assert res.status_code == 200
    data = res.json()
    assert "items" in data
    assert data["items"][0]["term"] == "mitosis"
    assert data["items"][0]["source_paragraph_index"] == 2


@patch("main.call_gemini", new_callable=AsyncMock)
def test_review_with_language(mock_gemini):
    mock_gemini.return_value = REVIEW_ITEMS
    res = client.post("/api/review", json={
        "session_id": "sess-001",
        "paragraphs": [{"index": 0, "text": "Some text.", "dwell_ms": 5000}],
        "language": "french",
    })
    assert res.status_code == 200
    prompt_arg = mock_gemini.call_args[0][0]
    assert "french" in prompt_arg.lower()


@patch("main.call_gemini", new_callable=AsyncMock)
def test_review_empty_paragraphs(mock_gemini):
    """Empty paragraphs list should short-circuit without calling Gemini."""
    res = client.post("/api/review", json={"session_id": "sess-001", "paragraphs": []})
    assert res.status_code == 200
    assert res.json()["items"] == []
    mock_gemini.assert_not_called()


@patch("main.call_gemini", new_callable=AsyncMock)
def test_review_sorts_by_struggle(mock_gemini):
    """Higher dwell+rescroll paragraphs should appear first in the Gemini prompt."""
    mock_gemini.return_value = "[]"
    res = client.post("/api/review", json={
        "session_id": "s",
        "paragraphs": [
            {"index": 0, "text": "Easy paragraph.", "dwell_ms": 1000, "rescroll_count": 0},
            {"index": 1, "text": "Hard paragraph.", "dwell_ms": 15000, "rescroll_count": 5},
        ],
    })
    assert res.status_code == 200
    prompt = mock_gemini.call_args[0][0]
    # Hard paragraph (index 1) should appear before easy one (index 0)
    assert prompt.index("[1]") < prompt.index("[0]")


@patch("main.call_gemini", new_callable=AsyncMock)
def test_review_malformed_gemini_response(mock_gemini):
    mock_gemini.return_value = "not json at all"
    res = client.post("/api/review", json={
        "session_id": "s",
        "paragraphs": [{"index": 0, "text": "Text.", "dwell_ms": 5000}],
    })
    assert res.status_code == 200
    assert res.json()["items"] == []


@patch("main.call_gemini", new_callable=AsyncMock)
def test_review_strips_markdown_fences(mock_gemini):
    mock_gemini.return_value = "```json\n" + REVIEW_ITEMS + "\n```"
    res = client.post("/api/review", json={
        "session_id": "s",
        "paragraphs": [{"index": 0, "text": "Text.", "dwell_ms": 5000}],
    })
    assert res.status_code == 200
    assert len(res.json()["items"]) == 1


@patch("main.call_gemini", new_callable=AsyncMock)
def test_review_gemini_error_returns_502(mock_gemini):
    mock_gemini.side_effect = Exception("timeout")
    res = client.post("/api/review", json={
        "session_id": "s",
        "paragraphs": [{"index": 0, "text": "Text.", "dwell_ms": 5000}],
    })
    assert res.status_code == 502
    assert "Gemini error" in res.json()["detail"]


def test_review_missing_session_id_returns_422():
    res = client.post("/api/review", json={"paragraphs": []})
    assert res.status_code == 422


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
    res = client.post("/api/telemetry", json=TELEMETRY_PAYLOAD)
    assert res.status_code == 200
    assert res.json()["ok"] is True


def test_telemetry_appends_to_log():
    client.post("/api/telemetry", json=TELEMETRY_PAYLOAD)
    assert len(telemetry_log) == 1
    assert telemetry_log[0]["event"] == "struggle_detected"
    assert telemetry_log[0]["session_id"] == "sess-001"
    assert "ts" in telemetry_log[0]


def test_telemetry_multiple_events_accumulate():
    for event in ["struggle_detected", "adaptation_shown", "peek_entered", "session_ended"]:
        client.post("/api/telemetry", json={**TELEMETRY_PAYLOAD, "event": event})
    assert len(telemetry_log) == 4
    events = [e["event"] for e in telemetry_log]
    assert events == ["struggle_detected", "adaptation_shown", "peek_entered", "session_ended"]


def test_telemetry_minimal_payload():
    """Only required fields."""
    res = client.post("/api/telemetry", json={
        "session_id": "s",
        "url": "https://x.com",
        "event": "session_ended",
    })
    assert res.status_code == 200
    assert res.json()["ok"] is True


def test_telemetry_missing_required_fields():
    res = client.post("/api/telemetry", json={"session_id": "s", "url": "https://x.com"})
    assert res.status_code == 422
