# API Documentation

## 1. `/api/adapt`
Adapts a paragraph when struggle is detected. Core feature.

### Input
```json
{
  "paragraph": "string — full original paragraph text",
  "paragraph_index": 0,
  "url": "string — page URL (for caching)",
  "dwell_ms": 9400,
  "rescroll_count": 2,
  "session_elapsed_min": 12,
  "language": "spanish | french | hindi | null"
}
```

### Output
```json
{
  "adapted_html": "string — paragraph with <em class='ar-simple'>simpler word</em> and <em class='ar-esl'>traducción</em> inline",
  "replacements": [
    {
      "original": "photosynthesis",
      "simplified": "the process plants use to make food from sunlight",
      "esl_equiv": "fotosíntesis",
      "char_offset": 42
    }
  ],
  "cache_hit": false
}
```

**Notes:**
- `replacements` is used by the extension to precisely locate and highlight words in the DOM.
- `char_offset` = character position in the paragraph → avoids fuzzy matching.
- Backend caching: `sha256(paragraph + language)` → avoids duplicate AI calls.

---

## 2. `/api/session/save`
Persists session state server-side. Called on every scroll (debounced 2s) and on every adaptation.

### Input
```json
{
  "session_id": "string — uuid generated at session start",
  "url": "string",
  "scroll_pct": 34,
  "adapted_indices": [2, 5, 11],
  "struggled_indices": [2, 5, 11],
  "dwell_map": { "0": 3200, "1": 1100, "2": 9800 },
  "rescroll_map": { "2": 3 },
  "session_elapsed_min": 14,
  "language": "spanish | null"
}
```

### Output
```json
{ "saved": true }
```

---

## 3. `/api/session/restore`
Called on page load to check if an active session exists for this URL + device.

### Input
```json
{
  "url": "string"
}
```

### Output
```json
{
  "found": true,
  "session_id": "string",
  "scroll_pct": 34,
  "adapted_paragraphs": {
    "2": "string — previously adapted HTML",
    "5": "string — previously adapted HTML"
  },
  "dwell_map": { "0": 3200, "2": 9800 },
  "rescroll_map": { "2": 3 },
  "session_elapsed_min": 14
}
```

---

## 4. `/api/review`
Generates the end-of-session review sheet from struggled paragraphs.

### Input
```json
{
  "session_id": "string",
  "paragraphs": [
    {
      "index": 2,
      "text": "string — original paragraph text",
      "dwell_ms": 9800,
      "rescroll_count": 3
    }
  ],
  "language": "spanish | null"
}
```

**Note:**
- `dwell_ms` and `rescroll_count` help prioritize key concepts.
- Higher struggle → more emphasis in review output.

### Output
```json
{
  "items": [
    {
      "term": "mitosis",
      "definition": "the process by which a cell splits into two identical copies",
      "esl_equiv": "mitosis — división celular",
      "source_paragraph_index": 2
    }
  ]
}
```

---

## 5. `/api/telemetry`
Lightweight, fire-and-forget logging for analytics and personalization.

### Input
```json
{
  "session_id": "string",
  "url": "string",
  "event": "struggle_detected | adaptation_shown | peek_entered | session_ended",
  "paragraph_index": 2,
  "dwell_ms": 9800,
  "rescroll_count": 3,
  "session_elapsed_min": 12
}
```

### Output
```json
{ "ok": true }
```

---

## Summary Table

| Endpoint                | Called when                                  | Latency                | Cached |
|------------------------|-----------------------------------------------|------------------------|--------|
| `/api/adapt`           | Struggle detected on a paragraph              | <3s (user waits)       | Yes    |
| `/api/session/save`    | Every scroll (debounced 2s) + adaptation      | <500ms (background)    | No     |
| `/api/session/restore` | Page load before reader renders               | <300ms (blocking)      | No     |
| `/api/review`          | User clicks "Review & End"                    | <5s (user waits)       | No     |
| `/api/telemetry`       | Any struggle/adaptation event                 | Fire-and-forget        | No     |

---

## Key Takeaway

- Only `/api/adapt` is user-blocking.
- Everything else runs in the background.
- Simple, focused design — no over-engineering.