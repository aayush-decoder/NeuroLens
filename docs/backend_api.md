# Backend API Documentation

**Project:** Distraction-Free Adaptive Reader
**Stack:** Next.js (App Router), Prisma, PostgreSQL

---

# 1. Overview

This backend provides an adaptive reading system that:

* Tracks user behavior during reading
* Detects comprehension difficulty using telemetry
* Dynamically adapts content
* Adjusts UI for eye strain (fatigue)
* Maintains session state for continuity

The system is centered around the concept of a **reading session**, which acts as a container for all user interactions.

---

# 2. Core Concepts

### Reading Session

A session represents a single reading instance. All telemetry events, analysis, and adaptations are tied to a session.

### Telemetry Events

User interaction data such as scroll speed, pauses, and highlights. These are used to infer comprehension difficulty.

### Paragraph Indexing

Text is split into paragraphs using newline (`\n`). Each paragraph is identified by its index.

---

# 3. Session API

---

## 3.1 Create Session

### Endpoint

```
POST /api/session/start
```

### Description

Creates a new reading session. This must be called before sending telemetry or performing analysis.

---

### Request Body

```json
{
  "userId": "string",
  "contentId": "string"
}
```

---

### Response

```json
{
  "sessionId": "string"
}
```

---

### Notes

* A session ID is required for all subsequent APIs.
* A new session should be created whenever a user starts reading new content.

---

## 3.2 Get Session

### Endpoint

```
GET /api/session/:id
```

---

### Description

Fetches a reading session along with all associated telemetry events.

---

### Response

```json
{
  "id": "string",
  "userId": "string",
  "startTime": "datetime",
  "telemetryEvents": [
    {
      "type": "pause",
      "value": 3.2,
      "meta": {
        "paragraph": 0
      }
    }
  ]
}
```

---

### Notes

* Used for restoring session state after refresh.
* Useful for debugging and analytics.
* Provides the complete history of user interactions.

---

# 4. Telemetry API

---

## Endpoint

```
POST /api/telemetry
```

---

## Description

Stores user interaction data during reading.

---

## Request Body

```json
{
  "sessionId": "string",
  "type": "string",
  "value": "number",
  "meta": {
    "paragraph": "number"
  }
}
```

---

## Fields

| Field          | Description                              |
| -------------- | ---------------------------------------- |
| sessionId      | ID of the reading session                |
| type           | Type of event (pause, scroll, highlight) |
| value          | Numeric value associated with event      |
| meta.paragraph | Paragraph index where event occurred     |

---

## Response

```json
{
  "success": true
}
```

---

## Notes

* This is the primary data source for all intelligence.
* Events should be sent frequently from the frontend.

---

# 5. Friction Analysis API

---

## Endpoint

```
POST /api/analyze
```

---

## Description

Analyzes telemetry data to detect comprehension difficulty at the paragraph level.

---

## Request Body

```json
{
  "sessionId": "string"
}
```

---

## Response

```json
{
  "paragraphScores": {
    "0": 6,
    "2": 3
  },
  "strugglingParagraphs": [0]
}
```

---

## Logic

Telemetry events are scored as follows:

| Event     | Condition         | Score |
| --------- | ----------------- | ----- |
| Pause     | value > 2 seconds | +2    |
| Scroll    | slow velocity     | +1    |
| Highlight | any               | +2    |

A paragraph is marked as struggling if its score exceeds a threshold.

---

## Notes

* Returns both raw scores and filtered struggling paragraphs.
* Used as input for the adaptation engine.

---

# 6. Adaptation API

---

## Endpoint

```
POST /api/adapt
```

---

## Description

Dynamically modifies text using a Large Language Model based on detected difficulty.
---

## Request Body

```json
{
  "text": "string",
  "strugglingParagraphs": [0, 2]
}
```

---

## Response

```json
{
  "modifiedText": "string"
}
```

---

## Processing Steps

1. Split text into paragraphs using newline.
2. Identify paragraphs marked as struggling.
3. Send selected paragraphs to Gemini API
4. Apply simplification or augmentation logic to those paragraphs.
5. Reconstruct the full text.

---

## Notes

* Only selected paragraphs are modified.
* Non-struggling paragraphs remain unchanged.

---

# 7. Fatigue (Eye-Strain) API

---

## Endpoint

```
POST /api/fatigue
```

---

## Description

Calculates user fatigue based on session duration and returns UI adjustment parameters.

---

## Request Body

```json
{
  "sessionId": "string"
}
```

---

## Response

```json
{
  "level": "HIGH",
  "settings": {
    "theme": "dark",
    "fontWeight": 500,
    "lineHeight": 1.7,
    "contrast": "high"
  }
}
```

---

## Fatigue Levels

| Duration      | Level   |
| ------------- | ------- |
| < 5 minutes   | LOW     |
| 5–15 minutes  | MEDIUM  |
| 15–30 minutes | HIGH    |
| > 30 minutes  | EXTREME |

---

## Notes

* Backend determines fatigue level.
* Frontend applies visual changes.
* Helps reduce eye strain during long reading sessions.

---

# 8. System Flow

```
User opens content
   ↓
Create session
   ↓
User reads content
   ↓
Telemetry events sent continuously
   ↓
Analyze API detects struggling paragraphs
   ↓
Adapt API modifies text
   ↓
Fatigue API adjusts UI parameters
   ↓
Session API retrieves full session if needed
```

---

# 9. Design Principles

* Separation of concerns between backend logic and frontend rendering
* Event-driven architecture using telemetry
* Stateless APIs with session-based context
* On-demand computation instead of storing derived data

---

# 10. Summary

This backend system transforms passive reading into an adaptive experience by:

* Tracking user behavior
* Inferring comprehension difficulty
* Dynamically modifying content
* Adjusting visual presentation based on fatigue


