# [cite_start]CONTEXTUAL CONCEPT GRAPH [cite: 1]
## [cite_start]Complete Technical & Psychological Specification [cite: 2]
[cite_start]**Adaptive Reading Environment — Internal System Document** [cite: 3]

| Status | Implemented | Version | 2.4.1 | Classification | [cite_start]Internal Reference | [cite: 4]
| :--- | :--- | :--- | :--- | :--- | :--- |

---

## [cite_start]SECTION 1 — SYSTEM OVERVIEW [cite: 5]

### [cite_start]1. What the Contextual Concept Graph Is [cite: 6]
* [cite_start]The Contextual Concept Graph (CCG) is a real-time, client-side data structure that builds a weighted graph of reading struggle during an active session. [cite: 7]
* [cite_start]It does not track what the user reads — it tracks where reading breaks down. [cite: 8]
* [cite_start]The graph connects three entity types: paragraphs, terms, and sessions. [cite: 9] 
* [cite_start]Edges between them carry friction weights derived from telemetry signals. [cite: 9]
* [cite_start]At session end, the graph collapses into a Revision Sheet — a minimalist, actionable review document presenting only the content the system is confident the user struggled with. [cite: 10]
* [cite_start]The CCG is fully implemented as a JavaScript module (ccg.js) running in the browser main thread. [cite: 11]
* [cite_start]It writes to localStorage on every paragraph transition and reads back on page load, enabling deep state persistence across hard refreshes. [cite: 12]
* [cite_start]No data leaves the client. [cite: 13]

> [cite_start]**Design Philosophy:** The graph records struggle, not attention. [cite: 14] [cite_start]A user reading slowly because content is interesting is not the same as a user reading slowly because they do not understand it. [cite: 14] [cite_start]The CCG uses multiple correlated signals to distinguish these two states and only flags content where multiple independent signals converge on friction. [cite: 14]

---

## [cite_start]SECTION 2 — PSYCHOLOGICAL FOUNDATIONS [cite: 15]

### [cite_start]2. Psychological Foundations [cite: 16]
[cite_start]The CCG is grounded in five distinct bodies of cognitive science research. [cite: 17] [cite_start]Each principle directly maps to a design decision in the system. [cite: 18]

[cite_start]**2.1 Desirable Difficulty (Bjork & Bjork, 1994)** [cite: 19]
* [cite_start]Difficulty during encoding is not uniformly bad. [cite: 20] 
* [cite_start]Bjork's research distinguishes between desirable difficulty (productive cognitive effort leading to deeper memory encoding) and undesirable difficulty (cognitive load caused by confusion that impedes comprehension without producing learning). [cite: 20]
* [cite_start]The CCG is designed to identify undesirable difficulty specifically: moments where friction is not productive but obstructive. [cite: 21]
* [cite_start]**Implementation consequence:** The system does not present a revision sheet to celebrate struggle. [cite: 22] [cite_start]It presents it because the struggled content was likely not encoded at all. [cite: 23] [cite_start]The revision sheet is a second-exposure mechanism, not a reward. [cite: 24]

[cite_start]**2.2 The Spacing Effect (Ebbinghaus, 1885; Cepeda et al., 2006)** [cite: 25]
* [cite_start]Memory retention follows a forgetting curve. [cite: 26] [cite_start]Re-exposure to material at increasing intervals produces exponentially stronger retention than massed repetition at first exposure. [cite: 26]
* [cite_start]The CCG's revision sheet is the first scheduled re-exposure. [cite: 27] 
* [cite_start]The system timestamps each term's friction event and can compute an optimal next-review interval based on the user's session history. [cite: 27]
* [cite_start]**Implementation consequence:** The revision sheet is generated at end-of-chapter, not during reading. [cite: 28] [cite_start]Interrupting reading to surface struggled content violates the spacing principle by compressing the re-exposure interval to near zero. [cite: 29]

[cite_start]**2.3 Zone of Proximal Development (Vygotsky, 1934)** [cite: 30]
* [cite_start]Learning is most effective at the boundary between what a learner already knows and what they are almost capable of understanding with assistance. [cite: 31]
* [cite_start]The CCG approximates this boundary through friction tier classification. [cite: 32] 
* [cite_start]Terms in the Struggled tier (FS 0.50–0.75) sit closest to the ZPD — they are not beyond the user's reach, but they required effort. [cite: 32]
* [cite_start]These are weighted more heavily on the revision sheet than Blocked terms, which may be too far outside the user's current knowledge base for a single definition to resolve. [cite: 33]

[cite_start]**2.4 Cognitive Load Theory (Sweller, 1988)** [cite: 34]
* [cite_start]Working memory has limited capacity. [cite: 35] [cite_start]When encountering an unknown term embedded in a complex sentence, the reader must simultaneously hold the sentence context, the unknown term, and any prior concepts in working memory. [cite: 35]
* [cite_start]If this load exceeds capacity, comprehension of the entire passage fails — not just the term. [cite: 36]
* [cite_start]The CCG detects this through term recurrence scoring: the same term triggering friction across multiple paragraphs indicates it is consuming working memory persistently across the session. [cite: 37]

[cite_start]**2.5 The Testing Effect (Roediger & Karpicke, 2006)** [cite: 38]
* [cite_start]Active retrieval produces stronger memory traces than passive re-reading. [cite: 39] 
* [cite_start]The revision sheet supports active retrieval: terms are presented without definitions visible by default, requiring the user to attempt recall before seeing the explanation. [cite: 39]
* [cite_start]The Concept Quiz action at the bottom of the sheet operationalises this directly. [cite: 40]

[cite_start]**2.6 Metacognitive Calibration (Flavell, 1979; Dunning-Kruger, 1999)** [cite: 41]
* [cite_start]Readers are frequently poor judges of their own comprehension. [cite: 42] [cite_start]They may feel they understood a paragraph when in fact they merely decoded words without constructing meaning. [cite: 42]
* [cite_start]The CCG does not rely on self-report. [cite: 43] [cite_start]It infers comprehension failure from behavioural signals (scroll hesitation, hover events, velocity drops) exhibited without conscious awareness. [cite: 43]
* [cite_start]This makes the system more accurate than any self-assessment mechanism. [cite: 44]

> [cite_start]**Key Insight:** The single most predictive signal of comprehension failure is an aborted highlight: the user selected text, then released before completing the selection. [cite: 45] [cite_start]This indicates they reached for external help (e.g. intended to copy and search) but abandoned the action. [cite: 45] [cite_start]This signal is weighted at 2x in the Interaction Density calculation. [cite: 45]

---

## [cite_start]SECTION 3 — DATA STRUCTURES [cite: 46]

### [cite_start]3. Complete Data Structures [cite: 47]
[cite_start]The CCG maintains three primary data structures in memory and serialises them to localStorage on every paragraph transition. [cite: 48]

[cite_start]**3.1 ParagraphNode** [cite: 49]
[cite_start]One node is created per paragraph in the document, keyed by DOM order index. [cite: 50]
* [cite_start]`id`: string (e.g., 'p-14') [cite: 51]
* [cite_start]`text`: string (Full paragraph text content) [cite: 51]
* [cite_start]`wordCount`: number (Whitespace-tokenised count) [cite: 51]
* [cite_start]`position`: number (Scroll Y position at paragraph top) [cite: 51]
* [cite_start]`firstEntryAt`: number (Unix ms, first time user scrolled in) [cite: 51]
* [cite_start]`lastExitAt`: number (Unix ms, last time user scrolled past) [cite: 51]
* [cite_start]`totalDwellMs`: number (Cumulative dwell excluding tab-away) [cite: 51]
* [cite_start]`scrollbacks`: number (Count of return visits after exit) [cite: 51]
* [cite_start]`pauseEvents`: number (Scroll stops >3s while in paragraph) [cite: 51]
* [cite_start]`hoverEvents`: number (mouseover events on paragraph text) [cite: 51]
* [cite_start]`highlightStarts`: number (mousedown events on paragraph text) [cite: 51]
* [cite_start]`abortedHighlights`: number (mousedown followed by mouseup <50ms) [cite: 51]
* [cite_start]`completedHighlights`: number (mouseup >50ms intentional selection) [cite: 51]
* [cite_start]`velocityOnEntry`: number (px/s scroll speed when entering para) [cite: 51]
* [cite_start]`velocityOnExit`: number (px/s scroll speed when leaving para) [cite: 51]
* [cite_start]`frictionScore`: number (Computed FS, 0.0–1.0) [cite: 51]
* [cite_start]`frictionTier`: string ('fluent'|'noticed'|'struggled'|'blocked') [cite: 51]
* [cite_start]`triggeredTerms`: string[] (Terms with friction in this paragraph) [cite: 51]
* [cite_start]`adaptationsApplied`: Adaptation[] (Inline changes made to this paragraph) [cite: 51]
* [cite_start]`visitCount`: number (Total number of times paragraph entered) [cite: 51]

[cite_start]**3.2 TermNode** [cite: 52]
[cite_start]One node per unique content word/phrase triggering friction signals (excluding stop words; multi-word phrases detected via bigram colocation). [cite: 53, 54]
* [cite_start]`term`: string (Canonical lowercase form) [cite: 55]
* [cite_start]`surfaceForms`: string[] (All casing variants seen in text) [cite: 55]
* [cite_start]`paragraphIds`: string[] (All paragraphs where term appeared) [cite: 55]
* [cite_start]`frictionParagraphs`: string[] (Paragraphs where term triggered signals) [cite: 55]
* [cite_start]`hoverCount`: number (Total hover events over this term) [cite: 55]
* [cite_start]`abortedHighlights`: number (Aborted selections starting on this term) [cite: 55]
* [cite_start]`lookupTriggers`: number (Inline definition requests triggered) [cite: 55]
* [cite_start]`synonymSwaps`: number (Times replaced with simpler synonym) [cite: 55]
* [cite_start]`cognateSwaps`: number (Times replaced with L2 cognate) [cite: 55]
* [cite_start]`firstSeenAt`: number (Unix ms) [cite: 55]
* [cite_start]`lastFrictionAt`: number (Unix ms of most recent friction event) [cite: 55]
* [cite_start]`recencyDecayedFS`: number (Weighted FS with recency decay applied) [cite: 55]
* [cite_start]`cumulativeFriction`: number (Raw sum before decay normalisation) [cite: 55]
* [cite_start]`tier`: string ('fluent'|'noticed'|'struggled'|'blocked') [cite: 55]
* [cite_start]`clusterIds`: string[] (Semantic clusters this term belongs to) [cite: 55]
* [cite_start]`definition`: string|null (AI-generated plain-language definition) [cite: 55]
* [cite_start]`contextSentence`: string|null (Sentence from text where term was hardest) [cite: 55]

[cite_start]**3.3 ConceptCluster** [cite: 56]
[cite_start]Clusters are formed post-session by grouping TermNodes that co-occur in high-friction paragraphs. [cite: 57] [cite_start]They represent conceptual domains, not isolated vocabulary. [cite: 58]
* [cite_start]`id`: string ('cluster-{uuid}') [cite: 59]
* [cite_start]`label`: string (AI-inferred domain name) [cite: 59]
* [cite_start]`termIds`: string[] (TermNode ids in this cluster) [cite: 59]
* [cite_start]`paragraphIds`: string[] (Paragraphs contributing to cluster) [cite: 59]
* [cite_start]`meanFS`: number (Mean friction score across cluster terms) [cite: 59]
* [cite_start]`peakFS`: number (Highest single FS in cluster) [cite: 59]
* [cite_start]`tier`: string (Tier of the cluster overall) [cite: 59]
* [cite_start]`insightStatement`: string (AI-generated pattern summary sentence) [cite: 59]
* [cite_start]`reviewPriority`: number (1–10 ranking for revision sheet order) [cite: 59]

[cite_start]**3.4 CCGSession — Root Object** [cite: 60]
[cite_start]The root object wraps all state and serialises to localStorage. [cite: 61]
* [cite_start]`sessionId`: string (UUID, generated on first page load) [cite: 62]
* [cite_start]`documentId`: string (Hash of document content) [cite: 62]
* [cite_start]`chapterTitle`: string [cite: 62]
* [cite_start]`startedAt`: number (Unix ms) [cite: 62]
* [cite_start]`lastActiveAt`: number (Unix ms, updated on every event) [cite: 62]
* [cite_start]`totalReadingMs`: number (Excludes tab-away periods) [cite: 62]
* [cite_start]`paragraphs`: Map<string, ParagraphNode> [cite: 62]
* [cite_start]`terms`: Map<string, TermNode> [cite: 62]
* [cite_start]`clusters`: ConceptCluster[] [cite: 62]
* [cite_start]`scrollDepth`: number (Furthest scroll position reached) [cite: 62]
* [cite_start]`activeAdaptations`: Adaptation[] (Currently active inline text changes) [cite: 62]
* [cite_start]`calibration`: CalibrationState [cite: 62]
* [cite_start]`revisionSheet`: RevisionSheet|null (null until chapter end) [cite: 62]
* [cite_start]`storageKey`: string (localStorage key for this session) [cite: 62]

[cite_start]**3.5 CalibrationState** [cite: 63]
[cite_start]Per-user calibration persists across sessions, adjusting formula weights. [cite: 64]
* [cite_start]`baselineWPM`: number (Estimated reading speed for this user) [cite: 65]
* [cite_start]`drWeight`: number (Default 0.35, adjusts per session) [cite: 65]
* [cite_start]`shiWeight`: number (Default 0.40) [cite: 65]
* [cite_start]`idWeight`: number (Default 0.25) [cite: 65]
* [cite_start]`interventionAcceptRate`: number (% of injected definitions user read) [cite: 65]
* [cite_start]`postInterventionVelocityDelta`: number (Avg velocity change after inject) [cite: 65]
* [cite_start]`sessionCount`: number (Total sessions used for calibration) [cite: 65]
* [cite_start]`lastCalibrated`: number (Unix ms) [cite: 65]

[cite_start]**3.6 Graph Edge Structure** [cite: 66]
[cite_start]Edges are implicit in the arrays on TermNodes and ConceptClusters, avoiding O(n²) memory overhead. [cite: 67, 68]
* [cite_start]Edge Weight (Term T, Paragraph P): `edgeWeight(T, P) = T.recencyDecayedFS * P.frictionScore` [cite: 69]
* Co-occurrence (Terms T1, T2): `cooccurrence(T1, T2) = |intersection(T1.frictionParagraphs, T2.frictionParagraphs)| [cite_start]/ |union(T1.frictionParagraphs, T2.frictionParagraphs)|` [cite: 69]
* [cite_start]*(Note: This is Jaccard similarity. Terms with Jaccard >= 0.35 are candidate cluster members).* [cite: 69]

---

## [cite_start]SECTION 4 — SCORING FORMULAS [cite: 70]

### [cite_start]4. Complete Scoring Formulas [cite: 71]

[cite_start]**4.1 Expected Dwell Time** [cite: 72]
[cite_start]Computed from the calibrated reading speed (starts at 200 WPM default). [cite: 73, 74]
* [cite_start]`E_dwell(P) = (P.wordCount / baselineWPM) * 60000` (Result in ms). [cite: 75]

[cite_start]**4.2 Dwell Ratio (DR)** [cite: 76]
Compares actual to expected dwell time. [cite_start]Values > 1.0 indicate longer than expected. [cite: 77]
* [cite_start]Raw: `DR(P) = P.totalDwellMs / E_dwell(P)` [cite: 79]
* [cite_start]Normalised: `DR_norm(P) = clamp((DR(P) - 1.0) / 2.0, 0.0, 1.0)` [cite: 80]
* [cite_start]*(Normalization denominator of 2.0 requires taking 3x expected time to produce maximum signal, preventing slow reading from dominating).* [cite: 81, 82]

[cite_start]**4.3 Scroll Hesitation Index (SHI)** [cite: 83]
[cite_start]Counts deliberate backward scrolls into a paragraph and sustained pauses. [cite: 84, 85]
* [cite_start]Raw: `SHI_raw(P) = P.scrollbacks + P.pauseEvents` [cite: 87]
* [cite_start]Normalised: `SHI_norm(P) = clamp(SHI_raw(P) / (P.wordCount / 50), 0.0, 1.0)` [cite: 88]

[cite_start]**4.4 Interaction Density (ID)** [cite: 89]
[cite_start]Measures deliberate micro-interactions, distinguishing aborted highlights (highest signal) from completed ones. [cite: 90, 91]
* [cite_start]Raw: `ID_raw(P) = (P.abortedHighlights * 2.0) + P.hoverEvents + P.completedHighlights` [cite: 92]
* [cite_start]Normalised: `ID_norm(P) = clamp(ID_raw(P) / (P.wordCount * 0.1), 0.0, 1.0)` [cite: 93]

[cite_start]**4.5 Composite Friction Score (FS)** [cite: 94]
* [cite_start]`FS(P) = (w_DR * DR_norm(P)) + (w_SHI * SHI_norm(P)) + (w_ID * ID_norm(P))` [cite: 98]
* [cite_start]Default Weights: `w_DR = 0.35`, `w_SHI = 0.40`, `w_ID = 0.25`. [cite: 98]
* [cite_start]Weights calibrate over sessions based on correlations with adaptation acceptance rates (converging around 5 sessions). [cite: 99]

[cite_start]**4.6 Term-Level Friction Score** [cite: 100]
[cite_start]Aggregates paragraph scores where the term appeared, applying a recency decay factor (0.85). [cite: 101, 102]
* [cite_start]Raw: `TFS(T) = SUM[FS(P) * (0.85 ^ paragraphsAgo(P))]` for P in T.frictionParagraphs. [cite: 102]
* [cite_start]Normalised: `TFS_norm(T) = TFS(T) / |T.frictionParagraphs|` [cite: 103]

[cite_start]**4.7 Friction Tier Classification** [cite: 104]
* [cite_start]**0.00 – 0.25 (Fluent):** No action. [cite: 105]
* [cite_start]**0.25 – 0.50 (Noticed):** Stored but deprioritised. [cite: 105]
* [cite_start]**0.50 – 0.75 (Struggled):** Candidate for synonym swap; on revision sheet. [cite: 105]
* [cite_start]**0.75 – 1.00 (Blocked):** Immediate inline expansion triggered; top priority. [cite: 105]

[cite_start]**4.8 Cluster Formation — Jaccard Similarity** [cite: 106]
* `Jaccard(T1, T2) = |T1.frictionParagraphs ∩ T2.frictionParagraphs| / |T1.frictionParagraphs ∪ T2.frictionParagraphs|` [cite: 109, 110]
* [cite_start]Terms with Jaccard >= 0.35 enter candidate clusters. [cite: 110]
* [cite_start]Validation requires >= 2 terms and mean TFS >= 0.40. [cite: 111, 112]

[cite_start]**4.9 Review Priority Score** [cite: 113]
[cite_start]Ranks revision sheet entries based on mean FS, term recurrence, and cluster density. [cite: 114, 115]
* [cite_start]`Priority(C) = (meanTFS(C) * 0.50) + (recurrenceRate(C) * 0.30) + (clusterDensity(C) * 0.20)` [cite: 116]
* Sub-components: 
  * [cite_start]`recurrenceRate(C) = mean(|T.frictionParagraphs| / totalParagraphs)` [cite: 117]
  * `clusterDensity(C) = |C.termIds| / maxClusterSize (cap at 8)` [cite: 117]

---

## [cite_start]SECTION 5 — TELEMETRY ENGINE [cite: 118]

### [cite_start]5. Telemetry Engine — Implementation [cite: 119]

[cite_start]**5.1 Paragraph Viewport Tracking** [cite: 120]
Uses `IntersectionObserver` API. [cite_start]A 0.3 threshold triggers entry/exit; a 0.9 threshold detects full-paragraph reading. [cite: 121, 122, 123] [cite_start]It computes `totalDwellMs` and increments `scrollbacks` upon paragraph exit. [cite: 124]

[cite_start]**5.2 Scroll Velocity Measurement** [cite: 125]
Sampled at 100ms intervals. [cite_start]Computes `velocityOnEntry` and `velocityOnExit`, and triggers pause events for sustained stops. [cite: 126, 127]

[cite_start]**5.3 Interaction Density Capture** [cite: 128]
[cite_start]Document-level mouse listeners detect hovers, highlighted starts, aborted selections (<50ms), and completed selections (>50ms). [cite: 129, 131] [cite_start]Avoids per-paragraph listeners for constant memory overhead. [cite: 130]

[cite_start]**5.4 Term Attribution** [cite: 132]
[cite_start]Reverse-lookups map DOM events to terms based on a `[data-term]` attribute parsed at load time. [cite: 133, 134, 135] [cite_start]Only paragraphs with FS >= 0.25 map the term into `frictionParagraphs`. [cite: 135]

---

## [cite_start]SECTION 6 — ARCHITECTURE & FLOW [cite: 136]

### [cite_start]6. Full System Architecture & Processing Flow [cite: 137]

[cite_start]**6.1 Initialization Flow** [cite: 138]
[cite_start]Executes on page load: [cite: 139]
1. [cite_start]Load localStorage. [cite: 140]
2. [cite_start]Restore session/calibration, OR create a new CCGSession (hashing doc text). [cite: 141, 142]
3. [cite_start]Tokenize doc, assign DOM indices, build reverse lookup. [cite: 143]
4. [cite_start]Attach IntersectionObserver. [cite: 144]
5. [cite_start]Attach scroll velocity sampler. [cite: 145]
6. [cite_start]Attach document-level mouse listeners. [cite: 146]
7. [cite_start]Restore scroll position. [cite: 147]
8. [cite_start]Re-apply active adaptations. [cite: 148]
9. [cite_start]Start eye-strain timer. [cite: 149]

[cite_start]**6.2 Per-Paragraph Processing Flow** [cite: 150]
[cite_start]Fires on paragraph exit: [cite: 151]
* [cite_start]Accumulates totalDwellMs; computes expected dwell and normalises DR, SHI, ID. [cite: 152]
* [cite_start]Computes Composite FS, assigns friction tier. [cite: 152]
* [cite_start]Recomputes TFS for terms with friction events; applies adaptations if 'blocked'. [cite: 152]
* [cite_start]Persists to localStorage. [cite: 152]

[cite_start]**6.3 Session-End Processing Flow** [cite: 153]
[cite_start]Triggered post-reading or after 30 mins inactivity: [cite: 154]
* [cite_start]Finalises nodes, computes final TFS. [cite: 155]
* [cite_start]Clusters terms via Jaccard and single-linkage clustering. [cite: 155]
* [cite_start]Requests AI labels/statements from Anthropic API. [cite: 155]
* [cite_start]Builds RevisionSheet, updates calibration, persists to localStorage, and renders UI. [cite: 155]

[cite_start]**6.4 Module Architecture** [cite: 156]
* [cite_start]`ccg.js`: Root module. [cite: 157]
* [cite_start]`telemetry.js`: Observers and listeners. [cite: 157]
* [cite_start]`scoring.js`: All formulas and normalisation. [cite: 157]
* [cite_start]`clustering.js`: Jaccard matrix and grouping logic. [cite: 157]
* [cite_start]`adaptation.js`: DOM mutations (inline definitions/swaps). [cite: 157]
* [cite_start]`persistence.js`: localStorage logic. [cite: 157]
* [cite_start]`calibration.js`: Weight adjustments post-session. [cite: 157]
* [cite_start]`revision.js`: UI rendering and Anthropic API handling. [cite: 157]
* [cite_start]`api.js`: Thin wrapper around Anthropic /v1/messages. [cite: 157]

---

## [cite_start]SECTION 7 — DYNAMIC TEXT ADAPTATION [cite: 158]

### [cite_start]7. Dynamic Text Adaptation [cite: 159]
[cite_start]Modifies DOM for Blocked-tier terms without interrupting reading flow. [cite: 160] [cite_start]Reversible and persistent. [cite: 161]

[cite_start]**7.1 Adaptation Types** [cite: 162]
* **Inline definition:** For Blocked terms (FS >= 0.75). [cite_start]Injects superscript tooltip. [cite: 163]
* **Synonym swap:** For Struggled terms (FS >= 0.50). [cite_start]Replaces text, original on hover. [cite: 163]
* [cite_start]**Cognate swap:** For ESL mode users. [cite: 163]
* [cite_start]**Acronym expansion:** Expands all-caps terms >= Struggled tier. [cite: 163]

[cite_start]**7.2 Adaptation Data Structure** [cite: 164]
[cite_start]Tracks `id`, `termId`, `paragraphId`, `type`, `originalText`, `adaptedText`, `appliedAt`, `accepted`, and `domSelector`. [cite: 165]

[cite_start]**7.3 Acceptance Tracking** [cite: 166]
* [cite_start]Dismissed <= 1000ms: `accepted = false`. [cite: 167, 169]
* [cite_start]Dismissed > 1000ms: `accepted = true`. [cite: 168, 169]
* [cite_start]Not dismissed: `accepted = (velocityAfterInject < velocityBeforeInject * 0.7)` (Inferred by a 30%+ drop in scroll velocity). [cite: 168, 170]

---

## [cite_start]SECTION 8 — CALIBRATION ENGINE [cite: 171]

### [cite_start]8. Calibration Engine [cite: 172]
[cite_start]Runs at session end to adjust per-user formula weights based on observations. [cite: 173, 174]

[cite_start]**8.1 Baseline WPM Estimation** [cite: 175]
[cite_start]Uses clean "Fluent" paragraphs to adjust true reading speed. [cite: 176, 177]
* [cite_start]`WPM_observed = SUM(P.wordCount) / SUM(P.totalDwellMs) * 60000` (for Fluent paragraphs). [cite: 178]
* [cite_start]`New baselineWPM = 0.80 * existingWPM + 0.20 * WPM_observed` (Exponential moving average). [cite: 178]

[cite_start]**8.2 Signal Reliability Adjustment** [cite: 179]
[cite_start]Calculates Pearson correlation between signal values and adaptation acceptance. [cite: 180, 181]
* [cite_start]`corr(signal) = Pearson(signal_norm_values, adaptation_accepted_values)` [cite: 182]
* [cite_start]If `< 0.3`: Decay weight (`*= 0.95`). [cite: 182]
* [cite_start]If `> 0.6`: Boost weight (`*= 1.05`). [cite: 183]
* [cite_start]Weights are renormalized to equal 1.0. [cite: 183]

[cite_start]**8.3 Convergence** [cite: 184]
Requires >= 10 high-FS paragraphs to run. [cite_start]Converges to stability around 4–6 reading sessions. [cite: 185, 186, 187]

---

## [cite_start]SECTION 9 — DEEP STATE PERSISTENCE [cite: 188]

### [cite_start]9. Deep State Persistence [cite: 189]
[cite_start]Serialises session to a JSON blob in localStorage on every paragraph transition. [cite: 190]

[cite_start]**9.1 Storage Schema** [cite: 191]
* [cite_start]Session Key: `'ccg:session:{documentId}'` [cite: 192]
* [cite_start]Calibration Key: `'ccg:calibration'` [cite: 192]
* [cite_start]Revision Sheet Key: `'ccg:revision:{documentId}'` [cite: 192]

[cite_start]**9.2 Serialisation Strategy** [cite: 193]
[cite_start]JavaScript Maps are converted to arrays of `[key, value]` entries for JSON stringification. [cite: 194, 195, 196]

[cite_start]**9.3 Write Frequency & Storage Limits** [cite: 197]
[cite_start]Written on paragraph exits and friction signal changes, with a 500ms debounce. [cite: 198, 199] [cite_start]Sizes range from 15–80KB, well under the 5MB localStorage limit. [cite: 200]

---

## [cite_start]SECTION 10 — REVISION SHEET [cite: 201]

### [cite_start]10. Revision Sheet — Architecture & Presentation [cite: 202]

[cite_start]**10.1 RevisionSheet Data Structure** [cite: 203]
[cite_start]Contains document ID, session stats (meanFS, total terms flagged, interventions accepted), a timeline array, sorted ConceptClusters, and an AI-generated metacognitive summary. [cite: 204]

[cite_start]**10.2 What the Revision Sheet Presents** [cite: 205]
* **Reading Friction Map:** Horizontal timeline color-coded by FS band. [cite_start]Clickable bars scroll back to the text. [cite: 206, 207]
* [cite_start]**Session Statistics:** Displayed as metric cards to minimize reading overhead. [cite: 208, 209]
* [cite_start]**Insight Statement:** AI-generated 2nd-person plain-language summary per cluster. [cite: 210, 211]
* [cite_start]**Concept Clusters:** Shows domain, term counts, plain-language definitions (hidden by default to encourage recall), and context sentences. [cite: 212, 213, 214]
* [cite_start]**Action Buttons:** Deep Dive (Claude explanation), Quiz (retrieval questions), Background Reading. [cite: 215]

[cite_start]**10.3 What the Revision Sheet Does Not Present** [cite: 216]
* [cite_start]Full paragraph text (it is a review tool). [cite: 217]
* [cite_start]Raw numeric scores (demotivating). [cite: 218]
* [cite_start]Fluent or Noticed terms (noise). [cite: 219]
* [cite_start]Unconverged isolated terms. [cite: 220]
* [cite_start]Comprehension grades or percentages. [cite: 221]

> [cite_start]**On Metacognitive Framing:** Presented as 'Where you slowed down' rather than 'What you got wrong'. [cite: 222] [cite_start]Attributing difficulty to situational cognitive load vs fixed ability aligns with growth mindset research and reduces affective cost. [cite: 222]

---

## [cite_start]SECTION 11 — INTERNAL METRICS & REPORTING [cite: 223]

### [cite_start]11. Internal Metrics & Reporting [cite: 224]
[cite_start]Internal metrics track system health and calibration, but remain hidden from the user. [cite: 225, 226]
* [cite_start]**Mean FS:** Overall document difficulty. [cite: 227]
* [cite_start]**Peak FS paragraph:** Worst failure point identifier. [cite: 227]
* [cite_start]**Term recurrence rate:** Separates foundational gaps from isolated confusion. [cite: 227]
* **Intervention acceptance rate:** Target > 0.55. [cite_start]Below 0.40 triggers ID signal weight decay. [cite: 227]
* [cite_start]**Pre/post velocity delta:** Primary proxy for intervention effectiveness. [cite: 227]
* [cite_start]**Cluster coherence:** Mean intra-cluster Jaccard similarity. [cite: 227]
* [cite_start]**Revision sheet engagement:** Measures UI format effectiveness. [cite: 227]
* [cite_start]**Calibration drift:** Rapid drift indicates user's reading domain/pattern is shifting. [cite: 227]

---

## [cite_start]SECTION 12 — KNOWN LIMITATIONS [cite: 228]

### [cite_start]12. Known Limitations & Mitigations [cite: 229]
* **DR confound:** Slow reading can imply interest. [cite_start]Mitigated by low default weight (0.35) and never letting DR trigger an adaptation alone. [cite: 230]
* **Touch device gap:** No hovers on mobile. [cite_start]Mitigated via an `ID_mobile` flag counting taps as hovers and redistributing weight to SHI. [cite: 230]
* [cite_start]**Tab-away pollution:** Handled via Page visibility API pausing the timer. [cite: 230]
* [cite_start]**Short paragraphs:** Paragraphs < 20 words excluded from FS computations. [cite: 230]
* [cite_start]**Cold start:** Mitigated by conservative defaults (200 WPM, standard weights). [cite: 230]
* [cite_start]**Cluster API latency:** Mitigated by displaying skeleton placeholders while Anthropic resolves. [cite: 230]
* [cite_start]**Quota limits:** Sessions pruned after 30 days (max 10 recent per doc retained); revision sheets kept for 90 days. [cite: 230]

***End of Document. All formulas, data structures, and flows described herein reflect the implemented system as of version 2.4.1.*** [cite: 231]