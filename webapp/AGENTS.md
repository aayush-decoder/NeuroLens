# Adaptive Reader: Multi-Agent Architectural Specification

## 1. System Philosophy: The Invisible Orchestration
The system operates as a zero-latency recursive loop. User interaction feeds telemetry. Telemetry drives inference. Inference triggers adaptation. All chrome is secondary. The text is the interface.

### Architectural Constraints
- **UI Responsiveness:** 120Hz refresh rate target (8.33ms budget).
- **Inference Latency:** <150ms for real-time semantic injection.
- **Privacy:** Local-first telemetry; zero-knowledge sync.
- **Reliability:** Graceful degradation to "Vanilla Static Text" on agent cascade failure.

---

## 2. Agent Node Definitions

### A. Telemetry Agent (The "Nervous System")
- **Role:** High-frequency event sampling.
- **Responsibilities:** 
  - Sub-pixel scroll delta monitoring.
  - Saccade-proxy tracking (cursor/dwell vectors).
  - Highlighting hesitation & abandonment analysis.
- **Output Contract:** Typed `InteractionDelta` [Protobuf/JSON].
- **Failure Mode:** Periodic sampling (throttle) -> Dead-man's default.

### B. Comprehension Inference Agent (The "Cognitive Proxy")
- **Role:** Real-time friction/flow modeling.
- **Responsibilities:** 
  - Bayesian estimation of comprehension.
  - **Flow State Detection:** Monitoring velocity consistency vs. complexity density.
  - **Stealth Comprehension Testing:** Inserting subtle logic checks/swaps to verify focus.
- **Input:** `InteractionDelta` + `TextComplexityMap`.
- **Output:** `CognitiveLoadHeatmap` + `InterventionTrigger`.

### C. Text Adaptation Agent (The "Semantic Sculptor")
- **Role:** Dynamic DOM/State manipulation.
- **Responsibilities:** 
  - **Concept Compression:** Summarizing non-critical adjacent paragraphs.
  - **Semantic Zoom:** Expanding/Contracting text density based on dwell focus.
  - Inline definition injection & synonym remapping.
- **Input:** `InterventionTrigger` + `UserVocabProfile`.
- **Output:** `DOMPatch` / `StateDelta`.

### D. Cognitive Profiling Agent (The "Spaced Knowledge Base")
- **Role:** Long-term memory and growth tracking.
- **Responsibilities:** 
  - **Personalized Vocabulary Evolution:** Tracking "learned" vs. "borrowed" terms.
  - **Spaced Repetition Integration:** Re-injecting struggled terms in future sessions.
  - Subject matter expertise mapping.
- **Output:** `UserVector` [N-dimensional embedding].

### E. UI State Agent (The "Chrome Eraser")
- **Role:** Aesthetic and ergonomic modulation.
- **Responsibilities:** 
  - **Zero-Chrome Management:** Predictive UI hiding on reading onset.
  - **Ambient Eye-Strain Adjustment:** Dynamic font-weight/spacing/contrast shifting.
- **Input:** `FlowStateStatus` + `SessionDuration`.
- **Output:** `CSSVariableDelta`.

### F. Concept Graph Agent (The "Post-Session Analyst")
- **Role:** Relationship mapping and review generation.
- **Responsibilities:** 
  - Constructing bidirectional links between struggled entities.
  - Generating minimalist "Review Sheets" and "Concept Heatmaps".
- **Input:** `SessionFrictionLogs` + `KnowledgeGraph`.
- **Output:** `InteractiveReviewSnapshot`.

### G. Document Ingest Agent (Batch/Local)
- **Role:** Sanitization and structure extraction.
- **Responsibilities:** 
  - **Local Document Stripping:** Drag-and-drop .txt/.md ingestion.
  - Formatting stripping & semantic chunking.
  - ODD (Original Document Document) normalization.
- **Input:** `RawFile` [Blob].
- **Output:** `StructuredSemanticDocument` [JSON Tree].
- **Failure Mode:** Revert to plain-text sanitization only.

---

## 3. Communication Infrastructure

### Event Bus: Reactive Pub/Sub
- **Implementation:** Persistent event stream with priority queuing.
- **Critical Flow:**
  - `TELEMETRY -> INFERENCE`: Priority 1 (Real-time).
  - `INFERENCE -> ADAPTATION`: Priority 1 (Real-time).
  - `ADAPTATION -> PERSISTENCE`: Priority 3 (Background).

### Data Contracts
- **InteractionDelta:** `{ pId, velocityX, velocityY, dwellT, regressionCounter }`.
- **InterventionTrigger:** `{ pId, type: "SIMPLIFY" | "DEFINE" | "EXPAND", urgency: 0.0-1.0 }`.
- **DOMPatch:** `{ targetSelector, replacementHTML, transitionMs }`.
