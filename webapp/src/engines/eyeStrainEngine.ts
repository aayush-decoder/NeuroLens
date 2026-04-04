// Framework-free eye strain engine
export interface EyeStrainState {
  sessionStartTime: number;
  level: number; // 0-1
}

const MAX_SESSION_MINUTES = 60;
const UPDATE_INTERVAL = 30000; // 30 seconds

export function createEyeStrainState(): EyeStrainState {
  return { sessionStartTime: Date.now(), level: 0 };
}

export function updateEyeStrainLevel(state: EyeStrainState): EyeStrainState {
  const elapsedMinutes = (Date.now() - state.sessionStartTime) / 60000;
  const level = Math.min(1, elapsedMinutes / MAX_SESSION_MINUTES);
  return { ...state, level };
}

export function getLineHeight(level: number): number {
  // 1.8 → 2.2 as eye strain increases
  return 1.8 + level * 0.4;
}

export function getFontWeight(level: number): number {
  // 400 → 500
  return Math.round(400 + level * 100);
}

export function getSepiaIntensity(level: number): number {
  // 0 → 0.3 opacity of sepia overlay
  return level * 0.3;
}

export { UPDATE_INTERVAL };
