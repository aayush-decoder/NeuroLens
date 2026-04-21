import { ReaderFile, Folder, ReadingSessionState } from '@/types/reader.types';

const STORAGE_PREFIX = 'adaptive-reader';

export function saveSessionState(state: ReadingSessionState): void {
  localStorage.setItem(
    `${STORAGE_PREFIX}:session:${state.fileId}`,
    JSON.stringify(state)
  );
}

export function loadSessionState(fileId: string): ReadingSessionState | null {
  const raw = localStorage.getItem(`${STORAGE_PREFIX}:session:${fileId}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ReadingSessionState;
  } catch {
    return null;
  }
}

export function saveFiles(files: ReaderFile[]): void {
  localStorage.setItem(`${STORAGE_PREFIX}:files`, JSON.stringify(files));
}

export function loadFiles(): ReaderFile[] {
  const raw = localStorage.getItem(`${STORAGE_PREFIX}:files`);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as ReaderFile[];
  } catch {
    return [];
  }
}

export function saveFolders(folders: Folder[]): void {
  localStorage.setItem(`${STORAGE_PREFIX}:folders`, JSON.stringify(folders));
}

export function loadFolders(): Folder[] {
  const raw = localStorage.getItem(`${STORAGE_PREFIX}:folders`);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as Folder[];
  } catch {
    return [];
  }
}

export function saveTelemetrySnapshot(fileId: string, data: object): void {
  localStorage.setItem(`${STORAGE_PREFIX}:telemetry:${fileId}`, JSON.stringify(data));
}

export function loadTelemetrySnapshot(fileId: string): Record<string, unknown> | null {  const raw = localStorage.getItem(`${STORAGE_PREFIX}:telemetry:${fileId}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function saveTheme(theme: 'light' | 'dark'): void {
  localStorage.setItem(`${STORAGE_PREFIX}:theme`, theme);
}

export function loadTheme(): 'light' | 'dark' {
  return (localStorage.getItem(`${STORAGE_PREFIX}:theme`) as 'light' | 'dark') || 'light';
}

export function deleteSessionState(fileId: string): void {
  localStorage.removeItem(`${STORAGE_PREFIX}:session:${fileId}`);
}

export function deleteTelemetrySnapshot(fileId: string): void {
  localStorage.removeItem(`${STORAGE_PREFIX}:telemetry:${fileId}`);
}

export function deleteFileSessionData(fileId: string): void {
  deleteSessionState(fileId);
  deleteTelemetrySnapshot(fileId);
}

export function getAllSessionFiles(): Array<{ fileId: string; timestamp?: number }> {
  const sessions: Array<{ fileId: string; timestamp?: number }> = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(`${STORAGE_PREFIX}:session:`) && !key.includes('telemetry')) {
      const fileId = key.replace(`${STORAGE_PREFIX}:session:`, '');
      try {
        const data = JSON.parse(localStorage.getItem(key) || '{}') as Record<string, unknown>;
        sessions.push({ fileId, timestamp: data.timestamp as number | undefined });
      } catch {
        sessions.push({ fileId });
      }
    }
  }
  return sessions;
}

export function clearAllSessionData(): void {
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(STORAGE_PREFIX)) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach(key => localStorage.removeItem(key));
}
