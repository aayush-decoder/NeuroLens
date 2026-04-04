import { ReadingSessionState } from '@/types/reader.types';

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
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveFiles(files: any[]): void {
  localStorage.setItem(`${STORAGE_PREFIX}:files`, JSON.stringify(files));
}

export function loadFiles(): any[] {
  const raw = localStorage.getItem(`${STORAGE_PREFIX}:files`);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveFolders(folders: any[]): void {
  localStorage.setItem(`${STORAGE_PREFIX}:folders`, JSON.stringify(folders));
}

export function loadFolders(): any[] {
  const raw = localStorage.getItem(`${STORAGE_PREFIX}:folders`);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveTelemetrySnapshot(fileId: string, data: any): void {
  localStorage.setItem(`${STORAGE_PREFIX}:telemetry:${fileId}`, JSON.stringify(data));
}

export function loadTelemetrySnapshot(fileId: string): any | null {
  const raw = localStorage.getItem(`${STORAGE_PREFIX}:telemetry:${fileId}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
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

export function generateUniqueFileName(fileName: string, existingFiles: string[]): string {
  // Check if file already exists in the folder
  if (!existingFiles.includes(fileName)) {
    return fileName;
  }

  // Split fileName into name and extension
  const lastDotIndex = fileName.lastIndexOf('.');
  const name = lastDotIndex === -1 ? fileName : fileName.substring(0, lastDotIndex);
  const extension = lastDotIndex === -1 ? '' : fileName.substring(lastDotIndex);

  // Find the next available number
  let counter = 1;
  let newFileName = `${name}-${counter}${extension}`;

  while (existingFiles.includes(newFileName)) {
    counter++;
    newFileName = `${name}-${counter}${extension}`;
  }

  return newFileName;
}
