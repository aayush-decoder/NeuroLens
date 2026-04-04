# Enfinity — Adaptive Reading Intelligence

Enfinity is a cross-platform adaptive reading system that transforms how people consume written content. It works across a Chrome extension, a Next.js web application, and a React Native mobile app — all sharing a single user identity, a single Postgres database, and a single AI backend. Every article you read online, every document you upload, every moment of struggle with a hard word — all of it is captured, simplified in real time, and turned into a personalized revision system.

---

## The Problem

Most people read passively. They encounter hard words, slow down, re-read the same sentence three times, and move on without understanding. For children, ESL learners, and students reading dense academic or news content, this friction compounds into disengagement. No existing tool watches how you read and responds to it in real time.

Enfinity does.

---

## System Architecture

```
Chrome Extension  ──────────────────────────────────────────────────────────┐
  popup.js (auth)  →  webapp /api/auth/extension/login|register             │
  background.js    →  extension-backend /api/adapt|session|review|telemetry │
  content scripts  →  live DOM manipulation on any webpage                  │
                                                                             │
Next.js Webapp  ─────────────────────────────────────────────────────────── ┤  →  PostgreSQL (Neon)
  /api/auth        →  NextAuth + bcrypt + JWT                               │
  /api/session     →  ReadingSession CRUD                                   │
  /api/telemetry   →  TelemetryEvent append                                 │
  /api/adapt       →  Gemini 2.0 Flash text simplification                  │
  /api/analyze     →  Session paragraph scoring                             │
  /api/fatigue     →  Eye-strain level + typography settings                │
                                                                             │
React Native App ────────────────────────────────────────────────────────── ┤
  Reader screen    →  webapp /api/session|telemetry|adapt|analyze|fatigue   │
  Dashboard        →  concept friction graph, comprehension score           │
  Profile          →  language prefs, backup, account linking               │
                                                                             │
Extension Backend (FastAPI / Render) ───────────────────────────────────────┘
  /api/adapt       →  Gemini 2.0 Flash paragraph rewrite + word replacement
  /api/session     →  In-memory session save/restore
  /api/review      →  AI-generated vocabulary review sheet
  /api/telemetry   →  Event log
  /api/auth        →  JWT auth backed by DynamoDB (ar_users)
```

---

## The Chrome Extension

The extension is the most impactful surface. It works on any webpage — news articles, Wikipedia, academic papers, government documents — without the user having to copy or paste anything.

### How it activates

The user clicks the extension icon, signs in (or is auto-registered on first use), selects an optional second language, and clicks Activate. The extension injects a full-screen reading overlay directly over the current page, extracting all meaningful paragraphs (minimum 80 characters, deduplicated) and rendering them in a clean, distraction-free column.

### Real-time struggle detection

Every paragraph is observed using the browser's `IntersectionObserver` API. The system tracks:

- **Dwell time** — how long each paragraph stays in the viewport
- **Rescroll count** — how many times the reader scrolls back up to re-read a paragraph

The struggle score for paragraph $i$ is:

$$S_i = d_i + 3000 \cdot r_i$$

where $d_i$ is total dwell time in milliseconds and $r_i$ is the rescroll count. When $S_i$ exceeds the threshold ($d_i > 20{,}000\text{ms}$ or $r_i \geq 1$), the paragraph is flagged and sent to the AI backend for rewriting.

### AI paragraph adaptation

Flagged paragraphs are sent to Gemini 2.0 Flash with a structured prompt that instructs the model to:

1. Rewrite for a 7th-grade reading level while preserving all facts
2. Replace hard words with simpler synonyms inline
3. Wrap technical terms in `<em class='ar-simple'>` with inline definitions
4. Expand acronyms with `<em class='ar-acronym'>`
5. Append ESL equivalents in the user's chosen second language

The response is parsed for an `---JSON---` block containing a structured replacement list:

```json
[{ "original": "sovereignty", "simplified": "supreme authority", "esl_equiv": "सार्वभौमिकता", "char_offset": 42 }]
```

The adapted HTML is injected directly into the DOM. The original text is preserved for the review sheet.

### Inline word glossing (without AI)

In parallel, a 100-word hardcoded vocabulary map (`AR_HARD_WORDS`) covers political, military, geographic, humanitarian, and legal vocabulary. When a reader dwells on a paragraph for 10 seconds, the system automatically annotates hard words with inline English glosses (blue dotted underline). At 20 seconds, the glosses transition to the reader's preferred language (Hindi by default) with a smooth fade animation.

This works entirely offline — no API call required.

### Eye-strain adaptation

The `eyestrain.js` module runs a time-based ambient typography system:

| Time elapsed | Effect |
|---|---|
| 0s | Apply stored dark mode + font family preference |
| 15s | Warm cream background tint (`#fdf8ee`) with 2.5s CSS transition |
| 30s | Line-height expands from 1.6 → 1.9 |
| 2min+ | Continuous warmth deepening over a 60-minute session |

The warmth at time $t$ minutes follows:

$$\text{hsl}(43,\ \lfloor 62 \cdot \min(t/60, 1) \rfloor\%,\ \lfloor 100 - 12 \cdot \min(t/60, 1) \rfloor\%)$$

In dark mode, all warm tints are suppressed. The reader can also manually select from 8 Google Fonts and toggle dark mode from the settings panel.

### Session persistence

Every 2 seconds of scroll activity, the session state is saved — both to the extension-backend API and to `chrome.storage.local` as an offline fallback. On the next visit to the same URL, the session is restored: scroll position, dwell maps, rescroll maps, and elapsed time are all recovered. The eye-strain phase resumes from where it left off.

### Peek mode

Pressing `Escape` (or the Peek button) collapses the reading overlay and shows a minimal progress bar over the original page. The reader can check the original article, then press Resume to return to the exact scroll position. Peek events are logged as telemetry.

### Session review

When the reader ends a session, a three-tab modal appears:

**Smart Review** — Gemini generates a vocabulary review sheet from all struggled paragraphs, sorted by struggle score. Each entry includes the term, a plain-English definition, and the ESL equivalent in the reader's language.

**Concept Map** — An SVG graph clusters all annotated hard words into five semantic categories (Political, Military, Geographic, Humanitarian, Legal) with hub-and-spoke layout. Each category has a distinct color. Words are positioned radially around their category hub.

**Revision Sheet** — A Markdown file (`content/revision.md`) bundled with the extension is rendered as structured HTML, providing a static study guide.

The full article text, concept graph SVG, and revision markdown are saved to cloud storage at session end.

### Why this matters for children

Children reading news articles or textbooks encounter vocabulary that is 2–3 grade levels above their reading level. The extension requires zero setup from a teacher or parent — the child simply activates it on any page. Hard words are explained inline, in their language, without breaking reading flow. The system never interrupts — it waits for the child to struggle, then helps. The review sheet at the end turns passive reading into active revision automatically.

---

## The Web Application

The webapp is a Next.js 16 application deployed on Vercel. It serves as the primary dashboard and document reader for uploaded content, and as the authentication authority for the entire system.

### Authentication

The webapp uses NextAuth with a credentials provider backed by bcrypt-hashed passwords in Postgres. Two additional endpoints — `/api/auth/extension/login` and `/api/auth/extension/register` — issue HS256 JWTs (7-day expiry, signed with `NEXTAUTH_SECRET`) for the Chrome extension and mobile app. All three surfaces share the same user table.

### Reading sessions

Sessions are created via `/api/session/start`, updated with telemetry events via `/api/telemetry`, and closed via `/api/session/end`. Each session stores scroll depth, average scroll speed, pause patterns, and highlights. The `/api/session/[id]` endpoint returns the full session with all telemetry events for dashboard rendering.

### AI adaptation

`/api/adapt` uses `@google/generative-ai` to rewrite uploaded document text. It accepts the full text and a list of struggling paragraph indices (from the analysis endpoint), and returns a simplified version.

### Session analysis

`/api/analyze` scores each paragraph in a session based on three signals:

- `wordComplexity` — proportion of words above 8 characters
- `hesitation` — normalized dwell time relative to word count
- `pauseDuration` — pause events per paragraph

These scores drive the concept friction graph in both the webapp dashboard and the mobile app.

### Fatigue detection

`/api/fatigue` maps session telemetry to a four-level fatigue state (LOW / MEDIUM / HIGH / EXTREME) and returns typography settings:

```json
{
  "level": "HIGH",
  "settings": {
    "theme": "soft",
    "fontWeight": 500,
    "lineHeight": 1.75,
    "contrast": "high"
  }
}
```

These settings are consumed by the mobile app's reader to adjust font weight, line height, and text contrast in real time.

### File upload

`/api/upload` accepts documents and stores them in AWS S3 (`eu-north-1`). The S3 key and public URL are saved to the `UserFile` table in Postgres.

---

## The Mobile App

The React Native app (Expo Router) provides a portable reading environment for uploaded documents. It shares the same backend as the webapp.

### Focus Reader

The reader screen implements the same telemetry model as the extension:

$$\text{hesitation}_{t+1} = \text{clip}\left(\text{hesitation}_t + \begin{cases} +0.06 & \text{if } 0.04 \leq |v| \leq 0.13 \\ -0.02 & \text{otherwise} \end{cases},\ 0,\ 1\right)$$

where $v$ is scroll velocity in pixels per millisecond. The simplification level is derived:

$$\text{level} = \begin{cases} 2 & \text{if hesitation} > 0.65 \\ 1 & \text{if hesitation} > 0.35 \\ 0 & \text{otherwise} \end{cases}$$

At level 1, hard words are replaced with simpler synonyms. At level 2, cognate annotations are appended in the reader's preferred language. The app supports Hindi, Spanish, French, and Telugu.

The comprehension score is estimated as:

$$C = \text{clip}\left(84 + \min\!\left(\frac{d}{39{,}000}, 9\right) - 20h,\ 45,\ 97\right)$$

where $d$ is cumulative dwell time in milliseconds and $h$ is the hesitation score.

### Ambient typography

The reader polls `/api/fatigue` every 20 seconds and applies the returned typography settings — font weight, line height, contrast — to the live text. The background color interpolates between neutral, warm, and amber tones as fatigue increases, using React Native Reanimated's `interpolateColor`.

### Dashboard

The Explore tab renders a concept friction graph with three nodes — Vocabulary load, Inference depth, Retention — each scored from the backend analysis. Nodes are color-coded: green (low), amber (medium), red (high). The review sheet provides three actionable revision steps based on the session.

### Library and document management

The Home tab shows document count, total word count, and folder count. Documents are organized into user-defined folders. The import engine accepts `.txt` and `.md` files, strips formatting, and stores them in `AsyncStorage`. Word count is computed as:

$$W = |\{w \in \text{tokens} : w \neq \varnothing\}|$$

### Profile and backup

The profile screen allows the reader to set their name, email, grade, and preferred language. A backup snapshot (session state + all documents + profile) can be exported as JSON and uploaded to Google Drive. Backup reminder notifications are scheduled via Expo Notifications.

---

## How the Three Surfaces Connect

All three surfaces share one user identity. A student can:

1. Read a news article on Chrome with the extension — hard words are simplified, the session is saved
2. Open the webapp dashboard — see their comprehension score, concept friction graph, and review sheet for that article
3. Open the mobile app on their phone — continue reading an uploaded textbook chapter, with the same fatigue-aware typography and the same vocabulary simplification

The JWT issued at login works across the extension (stored in `chrome.storage.local`) and the mobile app (stored in `AsyncStorage`). The Postgres database is the single source of truth for users, sessions, and telemetry.

---

## Environment Variables

### extension-backend (.env)

```env
GEMINI_API_KEY=
JWT_SECRET=
DYNAMO_TABLE=ar_users
AWS_REGION=eu-north-1
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
```

### webapp (.env)

```env
DATABASE_URL=
NEXTAUTH_SECRET=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_S3_BUCKET_NAME=
AWS_REGION=
```

### App (.env / app.config.js)

```env
EXPO_PUBLIC_BACKEND_URL=https://your-webapp.vercel.app
```

---

## Running Locally

```bash
# Extension backend
cd extension-backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# Webapp
cd webapp
npm install
npm run dev

# Mobile app
cd App
npm install
npx expo start
```

Load the `extension/` folder as an unpacked Chrome extension from `chrome://extensions`.

---

## Deployment

| Surface | Platform | Command |
|---|---|---|
| Extension backend | Render | `uvicorn main:app --host 0.0.0.0 --port $PORT` |
| Webapp | Vercel | `next build` |
| Mobile app | Expo EAS | `eas build` |

The `extension-backend/render.yaml` configures the Render service with `rootDir: extension-backend` and all required environment variable slots.

---

## Testing

```bash
# Extension backend — 41 tests, all mocked (no real API calls)
cd extension-backend
python -m pytest test/test_main.py -v

# Live auth integration test (requires real AWS credentials)
python -m pytest test/test_live_auth.py -v -s

# Webapp
cd webapp
npm test
```
