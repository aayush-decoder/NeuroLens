# Extension Backend

FastAPI service that powers the Adaptive Reader browser extension. Rewrites web page paragraphs for easier reading using Gemini 2.0 Flash, and persists reading sessions in memory.

---

## Stack

- Python 3.11+
- FastAPI + Uvicorn
- Google Gemini 2.0 Flash via `google-genai` SDK
- Pydantic v2
- In-memory stores (no database)

---

## Setup

```bash
cd extension-backend
pip install -r requirements.txt
```

Create a `.env` file:

```
GEMINI_API_KEY=your_key_here
```

Run the server:

```bash
uvicorn main:app --reload --port 8000
```

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `GEMINI_API_KEY` | Yes | Google AI Studio API key |

---

## API Reference

### GET /

Health check.

**Response**
```json
{
  "status": "ok",
  "model": "gemini-2.0-flash",
  "endpoints": [...]
}
```

---

### POST /api/adapt

Rewrites a paragraph for a 7th-grade reading level. Results are cached by `sha256(paragraph + language)`.

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
  "adapted_html": "<p>Simplified text with <em class='ar-simple'>...</em></p>",
  "replacements": [
    {
      "original": "mitosis",
      "simplified": "cell splitting",
      "esl_equiv": "mitosis",
      "char_offset": 12
    }
  ],
  "cache_hit": false
}
```

**Errors**

| Status | Cause |
|---|---|
| 422 | Missing `paragraph` field |
| 502 | Gemini API error (bad key, invalid request) |
| 503 | Gemini unavailable after 3 retries |

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
  "dwell_map": { "1": 8000, "3": 12000 },
  "rescroll_map": { "3": 2 },
  "session_elapsed_min": 7.5,
  "language": "spanish"
}
```

**Response**
```json
{ "saved": true }
```

---

### POST /api/session/restore

Returns the most recently updated session for a given URL.

**Request**
```json
{ "url": "https://example.com/article" }
```

**Response (found)**
```json
{
  "found": true,
  "session_id": "abc123",
  "scroll_pct": 0.45,
  "adapted_paragraphs": {},
  "dwell_map": { "1": 8000 },
  "rescroll_map": { "3": 2 },
  "session_elapsed_min": 7.5
}
```

**Response (not found)**
```json
{ "found": false }
```

Note: `adapted_paragraphs` is always an empty map. The client must re-call `/api/adapt` for any paragraph it needs re-rendered.

---

### POST /api/review

Generates a vocabulary review sheet from paragraphs the reader struggled with. Paragraphs are sorted by struggle score (`dwell_ms + rescroll_count * 3000`) before being sent to Gemini.

**Request**
```json
{
  "session_id": "string (required)",
  "paragraphs": [
    {
      "index": 2,
      "text": "Mitosis is the process...",
      "dwell_ms": 9000,
      "rescroll_count": 2
    }
  ],
  "language": "french"
}
```

**Response**
```json
{
  "items": [
    {
      "term": "mitosis",
      "definition": "the process by which a cell divides into two identical cells",
      "esl_equiv": "mitose",
      "source_paragraph_index": 2
    }
  ]
}
```

An empty `paragraphs` array returns `{ "items": [] }` without calling Gemini.

---

### POST /api/telemetry

Appends a single event to the in-memory telemetry log.

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

Valid event values: `struggle_detected`, `adaptation_shown`, `peek_entered`, `session_ended`.

**Response**
```json
{ "ok": true }
```

---

## Gemini Integration

The `call_gemini` helper wraps `google-genai` SDK calls with:

- Model: `gemini-2.0-flash`
- Temperature: `0.2`, max output tokens: `2048`
- Retry logic: up to 3 attempts with exponential backoff (`2^attempt` seconds) on `ServerError` (5xx / rate-limit)
- `ClientError` (4xx) raises immediately as HTTP 502
- Exhausted retries raise HTTP 503

---

## Testing

```bash
python -m pytest test/test_main.py -v
```

All Gemini calls are mocked via `unittest.mock.AsyncMock`. No real API calls are made during tests. 38 tests cover every endpoint including cache behaviour, error paths, and input validation.

---

## Deployment (Render)

Set the `GEMINI_API_KEY` environment variable in the Render dashboard.

Start command:

```bash
uvicorn main:app --host 0.0.0.0 --port $PORT
```

All required packages are listed in `requirements.txt`. The service has no external database dependency — all state is in-memory and resets on restart.
