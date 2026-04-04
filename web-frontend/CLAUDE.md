# Claude Subsystem: The Semantic Engine of Flow

## 1. System Philosophy: The Subtle Assistant
Claude is not a chat interface. It is a real-time semantic modifier. It lives in the gaps of user focus. It predicts struggle. It simplifies density. It vanishes with the UI.

### Guardrails: Intent Preservation
- **Authorial Respect:** No modification of direct quotes or key technical definitions.
- **Narrative Protection:** Delay simplification in "High Tension" or "Atmospheric" literary contexts.
- **Anti-Clutter:** Interventions must be < 5% of visible text to prevent cognitive overload.

---

## 2. Advanced Prompt Strategies

### A. Contextual Simplification (Direct Semantic Refactor)
- **Role:** High-friction paragraph remapping.
- **Rules:**
  - Break compound-complex sentences.
  - Maintain Flesch-Kincaid Level < {USER_THRESHOLD}.
  - Retain ALL factual claims.
- **Prompt Fragment:**
  ```xml
  <refactor_directive>
  Given <context>, rewrite <target_paragraph> to prioritize clarity without losing nuance. 
  Limit sentence length to 15 words. Replace OOV terms with high-frequency synonyms.
  </refactor_directive>
  ```

### B. Semantic Zoom (Density Modulation)
- **Role:** Expanding or contracting text based on dwell time focus.
- **Strategy:**
  - **Zoom In:** Injecting clarifying metaphors and sub-clauses for focused terms.
  - **Zoom Out:** **Concept Compression.** Synthesizing redundant descriptive paragraphs into core fact-sentences.
- **Prompt Fragment:**
  ```xml
  <density_control mode="COMPRESS">
  Condense <block> into a single, high-information sentence. Preserve key entities and logical relationships.
  </density_control>
  ```

### C. Multilingual Cognate Mapping (ESL Support)
- **Role:** Seamlessly swapping stalling terms with L2 cognates.
- **Rules:**
  - Choose high-confidence cognates only.
  - If no cognate, provide a 3-word L2 definition in-line.
- **Example:** `"Equanimity" -> "Ecuanimidad (Calm)"`.

### D. Stealth Comprehension Testing
- **Role:** Generating subtle, non-intrusive logic checks.
- **Strategy:**
  - Occasionally swap a small detail (e.g. "Paris" to "Moscow") to check if user dwell time increases (indicating they caught the discrepancy).
  - Use results to verify "Flow" vs "Passive Scrolling".

---

## 3. Inference Architecture

### Strata 1: Pre-Computation (Ingest Phase)
- **Action:** Full document scanning.
- **Output:**
  - Complexity Heatmap (where users are *likely* to struggle).
  - OOV (Out-of-Vocabulary) dictionary generation.
  - Conceptual Graph Seed (entities and their links).

### Strata 2: Real-Time (Friction Phase)
- **Action:** Sub-200ms semantic resolution.
- **Model:** Prompt-cached fast-mo or optimized system-prompt chain.
- **Output:** 
  - Inline Definitions.
  - Synonym Swaps.
  - Contextual Acronym Expansions.

### Strata 3: Post-Session (Review Phase)
- **Action:** Concept synthesis.
- **Output:** 
  - **Contextual Concept Graph:** Visualizing the session's "Difficult Knowledge".
  - **Minimalist Review Sheet:** Space-repetition ready bullet points.

---

## 4. Personalization Techniques

### Vocabulary Evolution Mapping
- **Active Tracking:** Not just *if* a user knows a word, but how often they need it defined.
- **Evolution:** As a user repeats a concept over weeks, Claude gradually re-introduces the original complex term to "Level Up" the user's vocabulary.

### Tone Control
- **Adaptation:** Matching the user's reading context (Academic vs Professional vs Casual) in generated simplifications.
- **Preservation:** Using the original author's voice/persona in all modifications.
