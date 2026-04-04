import hashlib
import json
import logging
import asyncio
from datetime import datetime, UTC
from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import os

from google import genai
from google.genai import types
from google.api_core.exceptions import ResourceExhausted, ServiceUnavailable, GoogleAPIError

load_dotenv()

logger = logging.getLogger("adaptive_reader")
logging.basicConfig(level=logging.INFO)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = "gemini-2.0-flash"

_genai_client = genai.Client(api_key=GEMINI_API_KEY)

app = FastAPI(title="Adaptive Reader API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── In-memory stores ────────────────────────────────────────────────────────
adapt_cache: dict[str, dict] = {}
sessions: dict[str, dict] = {}
telemetry_log: list[dict] = []

# ─── Gemini helper ───────────────────────────────────────────────────────────
_RETRYABLE = (ResourceExhausted, ServiceUnavailable)
_MAX_RETRIES = 3
_BACKOFF_BASE = 2.0  # seconds


async def call_gemini(prompt: str) -> str:
    """
    Call Gemini 2.0 Flash via the google-genai SDK.
    Retries up to _MAX_RETRIES times on rate-limit / transient errors
    with exponential backoff.
    """
    last_exc: Exception | None = None

    for attempt in range(_MAX_RETRIES):
        try:
            response = await asyncio.to_thread(
                _genai_client.models.generate_content,
                model=GEMINI_MODEL,
                contents=prompt,
                config=types.GenerateContentConfig(
                    temperature=0.2,
                    max_output_tokens=2048,
                ),
            )
            text = response.text
            if text is None:
                raise ValueError("Gemini returned an empty response")
            return text.strip()

        except _RETRYABLE as exc:
            last_exc = exc
            wait = _BACKOFF_BASE ** attempt
            logger.warning("Gemini transient error (attempt %d/%d): %s — retrying in %.1fs",
                           attempt + 1, _MAX_RETRIES, exc, wait)
            await asyncio.sleep(wait)

        except GoogleAPIError as exc:
            # Non-retryable API error (bad key, invalid request, etc.)
            logger.error("Gemini API error: %s", exc)
            raise HTTPException(status_code=502, detail=f"Gemini API error: {exc}") from exc

        except Exception as exc:
            logger.error("Unexpected Gemini error: %s", exc)
            raise HTTPException(status_code=502, detail=f"Gemini error: {exc}") from exc

    raise HTTPException(
        status_code=503,
        detail=f"Gemini unavailable after {_MAX_RETRIES} retries: {last_exc}",
    )


# ─────────────────────────────────────────────────────────────────────────────
# 1. POST /api/adapt
# ─────────────────────────────────────────────────────────────────────────────
class AdaptRequest(BaseModel):
    paragraph: str
    paragraph_index: int = 0
    url: str = ""
    dwell_ms: int = 0
    rescroll_count: int = 0
    session_elapsed_min: float = 0
    language: Optional[str] = None


@app.post("/api/adapt")
async def adapt(req: AdaptRequest):
    lang_key = req.language or ""
    cache_key = hashlib.sha256(f"{req.paragraph}{lang_key}".encode()).hexdigest()

    if cache_key in adapt_cache:
        return {**adapt_cache[cache_key], "cache_hit": True}

    lang_line = (
        f"After each [definition], also add the {req.language} equivalent in (parentheses)."
        if req.language else ""
    )

    prompt = f"""You are a reading assistant. Rewrite the paragraph below for a 7th-grade reader.
Rules:
1. Keep the same meaning and all facts.
2. Replace harder words with simpler synonyms inline.
3. For technical terms: <em class='ar-simple'>simpler word [definition]</em>
4. For acronyms: <em class='ar-acronym'>ACRONYM (full expansion)</em>
5. {lang_line}
6. After the rewritten paragraph, output a JSON block delimited by ---JSON--- and ---END--- containing a list of replacements:
   [{{"original": "...", "simplified": "...", "esl_equiv": "...", "char_offset": 0}}]
   Set esl_equiv to "" if no language requested.
7. Return ONLY the HTML paragraph then the JSON block — no extra commentary.

Paragraph:
{req.paragraph}"""

    raw = await call_gemini(prompt)

    adapted_html = raw
    replacements = []
    if "---JSON---" in raw and "---END---" in raw:
        parts = raw.split("---JSON---")
        adapted_html = parts[0].strip()
        json_block = parts[1].split("---END---")[0].strip()
        try:
            replacements = json.loads(json_block)
        except Exception:
            replacements = []

    adapted_html = adapted_html.replace("```html", "").replace("```", "").strip()

    result = {"adapted_html": adapted_html, "replacements": replacements, "cache_hit": False}
    adapt_cache[cache_key] = {k: v for k, v in result.items() if k != "cache_hit"}
    return result


# ─────────────────────────────────────────────────────────────────────────────
# 2. POST /api/session/save
# ─────────────────────────────────────────────────────────────────────────────
class SessionSaveRequest(BaseModel):
    session_id: str
    url: str
    scroll_pct: float = 0
    adapted_indices: list[int] = []
    struggled_indices: list[int] = []
    dwell_map: dict[str, int] = {}
    rescroll_map: dict[str, int] = {}
    session_elapsed_min: float = 0
    language: Optional[str] = None


@app.post("/api/session/save")
async def session_save(req: SessionSaveRequest):
    sessions[req.session_id] = {
        **req.model_dump(),
        "updated_at": datetime.now(UTC).isoformat(),
    }
    return {"saved": True}


# ─────────────────────────────────────────────────────────────────────────────
# 3. POST /api/session/restore
# ─────────────────────────────────────────────────────────────────────────────
class SessionRestoreRequest(BaseModel):
    url: str


@app.post("/api/session/restore")
async def session_restore(req: SessionRestoreRequest):
    matching = [s for s in sessions.values() if s.get("url") == req.url]
    if not matching:
        return {"found": False}

    session = max(matching, key=lambda s: s.get("updated_at", ""))

    return {
        "found": True,
        "session_id": session["session_id"],
        "scroll_pct": session.get("scroll_pct", 0),
        "adapted_paragraphs": {},
        "dwell_map": session.get("dwell_map", {}),
        "rescroll_map": session.get("rescroll_map", {}),
        "session_elapsed_min": session.get("session_elapsed_min", 0),
    }


# ─────────────────────────────────────────────────────────────────────────────
# 4. POST /api/review
# ─────────────────────────────────────────────────────────────────────────────
class ReviewParagraph(BaseModel):
    index: int
    text: str
    dwell_ms: int = 0
    rescroll_count: int = 0


class ReviewRequest(BaseModel):
    session_id: str
    paragraphs: list[ReviewParagraph]
    language: Optional[str] = None


@app.post("/api/review")
async def review(req: ReviewRequest):
    if not req.paragraphs:
        return {"items": []}

    sorted_paras = sorted(
        req.paragraphs,
        key=lambda p: p.dwell_ms + p.rescroll_count * 3000,
        reverse=True,
    )

    combined = "\n\n".join(
        f"[{p.index}] (dwell={p.dwell_ms}ms, rescrolls={p.rescroll_count})\n{p.text}"
        for p in sorted_paras
    )

    lang_note = (
        f"Also include an '{req.language}' equivalent in 'esl_equiv' for every term."
        if req.language else "Set esl_equiv to empty string."
    )

    prompt = f"""From the paragraphs below (which a reader found difficult), generate a review sheet.
{lang_note}
Return a JSON array — no markdown, no fences, no explanation — in this exact format:
[{{"term": "...", "definition": "...", "esl_equiv": "...", "source_paragraph_index": 0}}]

Paragraphs:
{combined}"""

    raw = await call_gemini(prompt)

    clean = raw.replace("```json", "").replace("```", "").strip()
    try:
        items = json.loads(clean)
    except Exception:
        items = []

    return {"items": items}


# ─────────────────────────────────────────────────────────────────────────────
# 5. POST /api/telemetry
# ─────────────────────────────────────────────────────────────────────────────
class TelemetryRequest(BaseModel):
    session_id: str
    url: str
    event: str  # struggle_detected | adaptation_shown | peek_entered | session_ended
    paragraph_index: Optional[int] = None
    dwell_ms: Optional[int] = None
    rescroll_count: Optional[int] = None
    session_elapsed_min: Optional[float] = None


@app.post("/api/telemetry")
async def telemetry(req: TelemetryRequest):
    telemetry_log.append({
        **req.model_dump(),
        "ts": datetime.now(UTC).isoformat(),
    })
    return {"ok": True}


# ─── Health check ────────────────────────────────────────────────────────────
@app.get("/")
async def root():
    return {
        "status": "ok",
        "model": GEMINI_MODEL,
        "endpoints": ["/api/adapt", "/api/session/save", "/api/session/restore", "/api/review", "/api/telemetry"],
    }
