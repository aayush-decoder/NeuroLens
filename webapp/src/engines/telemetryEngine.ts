// Framework-free telemetry engine
import { ParagraphTelemetry, StruggledTerm } from '@/types/reader.types';

const FRICTION_DWELL_THRESHOLD = 8000; // ms - long pause suggests difficulty
const FRICTION_HESITATION_THRESHOLD = 3;
const SCROLL_VELOCITY_SLOW = 0.5; // px/ms

export interface TelemetryState {
  paragraphs: Map<number, ParagraphTelemetry>;
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

export function enterParagraph(state: TelemetryState, index: number): TelemetryState {
  // Finalize previous paragraph
  if (state.currentParagraph >= 0) {
    state = finalizeParagraph(state);
  }
  return {
    ...state,
    currentParagraph: index,
    paragraphEntryTime: Date.now(),
  };
}

function finalizeParagraph(state: TelemetryState): TelemetryState {
  const idx = state.currentParagraph;
  const existing = state.paragraphs.get(idx) || {
    paragraphIndex: idx,
    dwellTimeMs: 0,
    hesitationCount: 0,
    highlightedWords: [],
    frictionScore: 0,
  };

  const dwell = existing.dwellTimeMs + (Date.now() - state.paragraphEntryTime);
  const frictionScore = Math.min(1, (
    (dwell / FRICTION_DWELL_THRESHOLD) * 0.6 +
    (existing.hesitationCount / FRICTION_HESITATION_THRESHOLD) * 0.4
  ));

  const updated = { ...existing, dwellTimeMs: dwell, frictionScore };
  const newMap = new Map(state.paragraphs);
  newMap.set(idx, updated);

  return { ...state, paragraphs: newMap };
}

export function recordHesitation(state: TelemetryState, paragraphIndex: number, word: string): TelemetryState {
  const existing = state.paragraphs.get(paragraphIndex) || {
    paragraphIndex,
    dwellTimeMs: 0,
    hesitationCount: 0,
    highlightedWords: [],
    frictionScore: 0,
  };

  const updated = {
    ...existing,
    hesitationCount: existing.hesitationCount + 1,
    highlightedWords: [...new Set([...existing.highlightedWords, word])],
  };

  const newMap = new Map(state.paragraphs);
  newMap.set(paragraphIndex, updated);

  return { ...state, paragraphs: newMap };
}

export function recordScrollVelocity(state: TelemetryState, velocity: number): TelemetryState {
  const velocities = [...state.scrollVelocities.slice(-50), velocity];
  return { ...state, scrollVelocities: velocities };
}

export function getAvgScrollVelocity(state: TelemetryState): number {
  if (state.scrollVelocities.length === 0) return 0;
  return state.scrollVelocities.reduce((a, b) => a + b, 0) / state.scrollVelocities.length;
}

export function detectFriction(state: TelemetryState, paragraphIndex: number): boolean {
  const p = state.paragraphs.get(paragraphIndex);
  if (!p) return false;
  return p.frictionScore > 0.5;
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

export function getFrictionParagraphs(state: TelemetryState): number[] {
  const result: number[] = [];
  state.paragraphs.forEach((p) => {
    if (p.frictionScore > 0.5) result.push(p.paragraphIndex);
  });
  return result;
}

export { SCROLL_VELOCITY_SLOW };
