# Extension Backend

FastAPI service powering the Adaptive Reader browser extension. Handles authentication (JWT + DynamoDB), paragraph adaptation via Gemini 2.0 Flash, session persistence, review generation, and telemetry.

---

## Stack

- Python 3.11+, FastAPI, Uvicorn
- Google Gemini 2.0 Flash (`google-genai` SDK)
- AWS DynamoDB (user store)
- JWT (`python-jose`), bcrypt password hashing
- In-memory stores for sessions, cache, telemetry

---

## Setup

```bash
pip install -r requirements.txt
```

`.env`:
```
GEMINI_API_KEY=...
JWT_SECRET=change-me-in-production
DYNAMO_TABLE=ar_users
AWS_REGION=eu-north-1
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
```

```bash
uvicorn main:app --reload --port 8000
```

---

## DynamoDB Schema

Table: `ar_users`  
Partition key: `user_id` (String)

| Attribute | Type | Notes |
|---|---|---|
| `user_id` | String (PK) | UUID v4 |
| `username` | String | unique |
| `email` | String | unique |
| `password` | String | bcrypt hash |
| `reading_level` | String | nullable |
| `preferred_lang` | String | nullable |
| `fatigue_score` | Number | default 0 |
| `created_at` | String | ISO 8601 UTC |

---

## Authentication

All endpoints except `GET /`, `POST /api/auth/register`, and `POST /api/auth/login` require a Bearer token:

```
Authorization: Bearer <access_token>
```

Tokens are HS256 JWTs, valid for 7 days. The payload contains `sub` (user_id), `email`, and `username`.

---

## API Reference

### GET /

Health check. No auth required.

```json
{ "status": "ok", "model": "gemini-2.0-flash", "endpoints": [...] }
```

---

### POST /api/auth/register

Create a new account. Returns a token immediately.

**Request**
```json
{ "username": "alice", "email": "alice@example.com", "password": "secret123" }
```

**Response** `201`
```json
{ "access_token": "...", "token_type": "bearer", "user_id": "...", "username": "alice", "email": "alice@example.com" }
```

**Errors:** `400` email or username taken, `422` missing fields.

---

### POST /api/auth/login

**Request**
```json
{ "email": "alice@example.com", "password": "secret123" }
```

**Response** `200` — same shape as register.

**Errors:** `401` invalid credentials.

---

### GET /api/auth/me

Returns the authenticated user's profile.

```json
{
  "user_id": "...",
  "username": "alice",
  "email": "alice@example.com",
  "reading_level": null,
  "preferred_lang": null,
  "fatigue_score": 0,
  "created_at": "2024-01-01T00:00:00+00:00"
}
```

---

### POST /api/adapt

Rewrites a paragraph for a 7th-grade reading level. Cached by `sha256(paragraph + language)`.

**Request**
```json
{
  "paragraph": "string (required)",
  "paragraph_index": 0,
  "url": "",
  "dwell_ms": 0,
  "rescroll_count": 0,
  "session_elapsed_min": 0.0,
  "language": "spanish"
}
```

**Response**
```json
{
  "adapted_html": "<p>...<em class='ar-simple'>...</em>...</p>",
  "replacements": [{ "original": "...", "simplified": "...", "esl_equiv": "...", "char_offset": 0 }],
  "cache_hit": false
}
```

**Errors:** `422` missing paragraph, `502` Gemini API error, `503` Gemini unavailable after 3 retries.

---

### POST /api/session/save

Persists a reading session in memory, keyed by `session_id`.

**Request**
```json
{
  "session_id": "string (required)",
  "url": "string (required)",
  "scroll_pct": 0.45,
  "adapted_indices": [1, 3],
  "struggled_indices": [1, 3],
  "dwell_map": { "1": 8000 },
  "rescroll_map": { "3": 2 },
  "session_elapsed_min": 7.5,
  "language": "spanish"
}
```

**Response:** `{ "saved": true }`

---

### POST /api/session/restore

Returns the most recently updated session for a URL.

**Request:** `{ "url": "https://example.com/article" }`

**Response**
```json
{
  "found": true,
  "session_id": "...",
  "scroll_pct": 0.45,
  "adapted_paragraphs": {},
  "dwell_map": {},
  "rescroll_map": {},
  "session_elapsed_min": 7.5
}
```

`adapted_paragraphs` is always empty — client must re-call `/api/adapt` for re-renders.

---

### POST /api/review

Generates a vocabulary review sheet from struggled paragraphs. Sorted by `dwell_ms + rescroll_count * 3000` before sending to Gemini.

**Request**
```json
{
  "session_id": "string (required)",
  "paragraphs": [{ "index": 2, "text": "...", "dwell_ms": 9000, "rescroll_count": 2 }],
  "language": "french"
}
```

**Response**
```json
{
  "items": [{ "term": "...", "definition": "...", "esl_equiv": "...", "source_paragraph_index": 2 }]
}
```

Empty `paragraphs` returns `{ "items": [] }` without calling Gemini.

---

### POST /api/telemetry

Appends an event to the in-memory log.

**Request**
```json
{
  "session_id": "string (required)",
  "url": "string (required)",
  "event": "struggle_detected",
  "paragraph_index": 3,
  "dwell_ms": 12000,
  "rescroll_count": 2,
  "session_elapsed_min": 5.0
}
```

Valid events: `struggle_detected`, `adaptation_shown`, `peek_entered`, `session_ended`.

**Response:** `{ "ok": true }`

---

## Gemini Integration

`call_gemini` in `main.py` wraps the SDK with:
- Model: `gemini-2.0-flash`, temperature `0.2`, max tokens `2048`
- Retries: up to 3 on `ServerError` (5xx/rate-limit) with `2^attempt` second backoff
- `ClientError` (4xx) → HTTP 502 immediately
- Retries exhausted → HTTP 503

---

## Testing

```bash
python -m pytest test/test_main.py -v
```

41 tests. Gemini is mocked via `AsyncMock`. DynamoDB calls are mocked via `unittest.mock.patch`. Auth is bypassed in non-auth tests via FastAPI's `dependency_overrides`.

---

## Deployment (Render)

Start command:
```bash
uvicorn main:app --host 0.0.0.0 --port $PORT
```

Set all `.env` variables in the Render dashboard. No database migrations needed — DynamoDB table must be created manually with `user_id` (String) as the partition key.
