# 🧠 Adaptive Reading System — Agent Workflow

## Overview

This document defines the real-time and batch workflows governing the interaction
between agents in the adaptive reading system.

The system is event-driven and operates on a hybrid model:
- Real-time inference loop (during reading)
- Deferred processing loop (post-session intelligence)

---

# 1. REAL-TIME READING LOOP

## Trigger:
User opens document OR resumes session

---

### Step 1: UI Initialization

Agent: UI State Agent  
- Load last known session state
- Restore scroll position
- Apply prior adaptations

↓

Agent: Memory Persistence Agent  
- Fetch:
  - Scroll depth
  - Telemetry snapshot
  - Adaptation history

---

### Step 2: Passive Telemetry Capture

Agent: Telemetry Agent  
Continuously emits:

- scroll_velocity
- dwell_time_per_paragraph
- re-read_events (scroll up)
- highlight_hesitation
- idle_time

↓

Publishes to Event Bus:
`telemetry.stream`

---

### Step 3: Comprehension Inference

Agent: Comprehension Inference Agent  

Consumes:
`telemetry.stream`

Outputs:
- comprehension_score (per paragraph)
- friction_score
- confidence_score

↓

Publishes:
`comprehension.update`

Latency target: < 150ms

---

### Step 4: Flow State Detection

Agent: Cognitive Profiling Agent  

Consumes:
- telemetry.stream
- comprehension.update

Detects:
- FLOW_STATE
- STRUGGLE_STATE
- SKIMMING_STATE

↓

Publishes:
`cognitive.state`

---

### Step 5: Adaptation Decision Engine

Agent: Text Adaptation Agent  

Consumes:
- comprehension.update
- cognitive.state

Decision rules:
- IF STRUGGLE_STATE → simplify / inject definitions
- IF SKIMMING_STATE → increase friction / expand spacing
- IF FLOW_STATE → NO INTERVENTION

↓

Publishes:
`text.adaptation`

---

### Step 6: UI Rendering

Agent: UI State Agent  

Consumes:
`text.adaptation`

Applies:
- Inline definitions
- Synonym replacement
- Acronym expansion
- Layout adjustments

Constraint:
- No visible UI chrome
- Zero disruption

---

### Step 7: Ambient Adjustment

Agent: UI State Agent  

Also monitors:
- session duration

Adjusts:
- font weight
- contrast
- line height

Publishes:
`ui.adjustment`

---

### Step 8: Multilingual Assist (Conditional)

Agent: Multilingual Mapping Agent  

Trigger:
Repeated hesitation on same token

Action:
- Replace word with cognate OR
- Inject inline translation

Publishes:
`text.adaptation`

---

# 2. BACKGROUND STATE PERSISTENCE LOOP

Runs every 5–10 seconds

Agent: Memory Persistence Agent  

Stores:
- scroll position
- telemetry aggregates
- adaptation state
- cognitive state

Destination:
- LocalStorage (fast)
- Backend DB (durable)

---

# 3. POST-SESSION PROCESSING

## Trigger:
User exits OR session idle > threshold

---

### Step 1: Concept Extraction

Agent: Concept Graph Agent  

Consumes:
- full telemetry log
- comprehension history

Outputs:
- weak_concepts[]
- strong_concepts[]
- confusion_clusters

---

### Step 2: Graph Construction

Build:
- nodes = concepts
- edges = relationships
- weights = struggle intensity

↓

Publishes:
`concept.graph.ready`

---

### Step 3: Review Sheet Generation

Agent: Text Adaptation Agent + LLM Layer  

Generates:
- minimalist summary
- key weak areas
- suggested review points

---

### Step 4: Vocabulary Profile Update

Agent: Cognitive Profiling Agent  

Updates:
- known_words[]
- difficult_words[]
- progression_level

---

# 4. LONG-TERM LEARNING LOOP

Runs daily / periodically

---

### Step 1: Forgetting Curve Scheduling

Agent: Cognitive Profiling Agent  

Schedules:
- revisit weak concepts
- spaced repetition triggers

---

### Step 2: Personalization Refinement

Agent: Comprehension Inference Agent  

Improves:
- thresholds
- adaptation sensitivity

---

# EVENT BUS DESIGN

All agents communicate via pub/sub topics:

- telemetry.stream
- comprehension.update
- cognitive.state
- text.adaptation
- ui.adjustment
- concept.graph.ready

---

# FAILURE HANDLING

- If Telemetry Agent fails → fallback to static reading mode  
- If LLM fails → disable dynamic adaptation  
- If latency > threshold → queue adaptation for next paragraph  
- If Memory fails → degrade to session-only mode  

---

# LATENCY CONSTRAINTS

| Component                     | Max Latency |
|-----------------------------|------------|
| Telemetry → Inference       | 150ms      |
| Inference → Adaptation      | 200ms      |
| UI Update                   | < 16ms     |

---

# DESIGN PRINCIPLE

> The system must NEVER interrupt flow.

Rules:
- Adaptation must feel invisible
- No popups, no modals
- All intelligence is ambient

---

# END STATE

A system that:
- Observes silently
- Learns continuously
- Adapts invisibly
- Teaches effectively