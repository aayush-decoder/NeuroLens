// src/engines/telemetryEngine.ts
import { ParagraphTelemetry, StruggledTerm } from '@/types/reader.types';

// Constants for behavioral heuristics
const AVG_WPM = 230; 
const MS_PER_WORD = (60 / AVG_WPM) * 1000; // ~260ms per word
const FRICTION_HESITATION_WEIGHT = 0.15; // Hovering over complex words
const FRICTION_SELECTION_WEIGHT = 0.3;   // Actively highlighting text

export interface ExtendedParagraphTelemetry extends ParagraphTelemetry {
  wordCount: number;
  selectionCount: number;
  comprehensionScore: number;
}

export interface TelemetryState {
  paragraphs: Map<number, ExtendedParagraphTelemetry>;
  scrollVelocities: number[];
  struggledTerms: StruggledTerm[];
  currentParagraph: number;
  paragraphEntryTime: number;
}

export interface TelemetrySnapshot {
  paragraphs: ExtendedParagraphTelemetry[];
  scrollVelocities: number[];
  struggledTerms: StruggledTerm[];
  currentParagraph: number;
  paragraphEntryTime: number;
}

export function createTelemetryState(): TelemetryState {
  return {
    paragraphs: new Map(),
    scrollVelocities: [],
    struggledTerms: [],
    currentParagraph: -1,
    paragraphEntryTime: Date.now(),
  };
}

export function serializeTelemetryState(state: TelemetryState): TelemetrySnapshot {
  return {
    paragraphs: Array.from(state.paragraphs.values()),
    scrollVelocities: [...state.scrollVelocities],
    struggledTerms: [...state.struggledTerms],
    currentParagraph: state.currentParagraph,
    paragraphEntryTime: state.paragraphEntryTime,
  };
}

export function hydrateTelemetryState(snapshot: TelemetrySnapshot): TelemetryState {
  return {
    paragraphs: new Map(snapshot.paragraphs.map((paragraph) => [paragraph.paragraphIndex, paragraph])),
    scrollVelocities: [...snapshot.scrollVelocities],
    struggledTerms: [...snapshot.struggledTerms],
    currentParagraph: snapshot.currentParagraph,
    paragraphEntryTime: snapshot.paragraphEntryTime,
  };
}

export function enterParagraph(state: TelemetryState, index: number, wordCount: number = 0): TelemetryState {
  if (state.currentParagraph >= 0) {
    state = finalizeParagraph(state);
  }
  
  // Initialize new paragraph if it doesn't exist
  if (!state.paragraphs.has(index)) {
    state.paragraphs.set(index, {
      paragraphIndex: index,
      dwellTimeMs: 0,
      hesitationCount: 0,
      selectionCount: 0,
      highlightedWords: [],
      frictionScore: 0,
      comprehensionScore: 100,
      wordCount: wordCount,
    });
  }

  return {
    ...state,
    currentParagraph: index,
    paragraphEntryTime: Date.now(),
  };
}

export function finalizeParagraph(state: TelemetryState): TelemetryState {
  const idx = state.currentParagraph;
  const existing = state.paragraphs.get(idx);
  if (!existing) return state;

  const sessionDwell = Date.now() - state.paragraphEntryTime;
  const totalDwell = existing.dwellTimeMs + sessionDwell;
  
  // Calculate expected reading time dynamically
  const expectedDwell = Math.max(existing.wordCount * MS_PER_WORD, 2000); 
  
  // Dwell Ratio: 1.0 means read at exactly average speed. > 1.5 indicates struggling.
  const dwellRatio = totalDwell / expectedDwell;
  let dwellPenalty = 0;
  if (dwellRatio > 1.5) dwellPenalty = Math.min((dwellRatio - 1.5) * 0.4, 0.6);

  // Calculate composite friction (0.0 to 1.0)
  const baseFriction = Math.min(1, (
    dwellPenalty +
    (existing.hesitationCount * FRICTION_HESITATION_WEIGHT) +
    (existing.selectionCount * FRICTION_SELECTION_WEIGHT)
  ));

  // Comprehension is inversely proportional to friction
  const comprehensionScore = Math.max(0, Math.round((1 - baseFriction) * 100));

  const updated = { 
    ...existing, 
    dwellTimeMs: totalDwell, 
    frictionScore: baseFriction,
    comprehensionScore
  };

  const newMap = new Map(state.paragraphs);
  newMap.set(idx, updated);

  return { ...state, paragraphs: newMap };
}

export function recordHesitation(state: TelemetryState, paragraphIndex: number, word: string, isSelection = false): TelemetryState {
  const existing = state.paragraphs.get(paragraphIndex);
  if (!existing) return state;

  const updated = {
    ...existing,
    hesitationCount: isSelection ? existing.hesitationCount : existing.hesitationCount + 1,
    selectionCount: isSelection ? existing.selectionCount + 1 : existing.selectionCount,
    highlightedWords: [...new Set([...existing.highlightedWords, word])],
  };

  const newMap = new Map(state.paragraphs);
  newMap.set(paragraphIndex, updated);

  return finalizeParagraph({ ...state, paragraphs: newMap }); // Recalculate score immediately
}

export function recordScrollVelocity(state: TelemetryState, velocity: number): TelemetryState {
  const velocities = [...state.scrollVelocities.slice(-50), velocity];
  return { ...state, scrollVelocities: velocities };
}

export function getStruggledTerms(state: TelemetryState): StruggledTerm[] {
  const terms: StruggledTerm[] = [];
  state.paragraphs.forEach((p) => {
    if (p.frictionScore > 0.4) {
      p.highlightedWords.forEach(word => {
        terms.push({
          word,
          paragraphIndex: p.paragraphIndex,
          frictionScore: p.frictionScore,
        });
      });
    }
  });
  return terms;
}