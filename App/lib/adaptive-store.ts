import AsyncStorage from '@react-native-async-storage/async-storage';

export const STORAGE_KEYS = {
  session: 'adaptive_session_v1',
  documents: 'adaptive_documents_v1',
  profile: 'adaptive_profile_v1',
  backup: 'adaptive_backup_v1',
};

export type ReaderSession = {
  scrollVelocity: number;
  dwellMs: number;
  hesitationScore: number;
  comprehensionScore: number;
  simplificationLevel: 0 | 1 | 2;
  sessionSeconds: number;
  scrollDepth: number;
  eyeStrainLoad: number;
  stalledWord: string;
  stalledWordCount: number;
  conceptFriction: Array<{ concept: string; score: number }>;
  updatedAt: number;
};

export type ReaderDocument = {
  id: string;
  folder: string;
  title: string;
  text: string;
  wordCount: number;
  createdAt: number;
};

export type ProfileData = {
  name: string;
  grade: string;
  preferredLanguage: string;
  darkMode: boolean;
  updatedAt: number;
};

export const DEFAULT_SESSION: ReaderSession = {
  scrollVelocity: 0,
  dwellMs: 0,
  hesitationScore: 0,
  comprehensionScore: 82,
  simplificationLevel: 0,
  sessionSeconds: 0,
  scrollDepth: 0,
  eyeStrainLoad: 0,
  stalledWord: 'comprehension',
  stalledWordCount: 0,
  conceptFriction: [
    { concept: 'Vocabulary load', score: 0.2 },
    { concept: 'Inference depth', score: 0.15 },
    { concept: 'Retention', score: 0.12 },
  ],
  updatedAt: Date.now(),
};

export const DEFAULT_PROFILE: ProfileData = {
  name: 'Reader',
  grade: 'Grade 10',
  preferredLanguage: 'Hindi',
  darkMode: false,
  updatedAt: Date.now(),
};

export function stripFormatting(input: string): string {
  return input
    .replace(/\r/g, '\n')
    .replace(/\t/g, ' ')
    .replace(/[ ]{2,}/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/\s+([,.!?;:])/g, '$1')
    .trim();
}

export async function loadSession(): Promise<ReaderSession> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.session);
    if (!raw) {
      return DEFAULT_SESSION;
    }
    return { ...DEFAULT_SESSION, ...(JSON.parse(raw) as Partial<ReaderSession>) };
  } catch {
    return DEFAULT_SESSION;
  }
}

export async function saveSession(session: ReaderSession): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.session, JSON.stringify(session));
}

export async function loadDocuments(): Promise<ReaderDocument[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.documents);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as ReaderDocument[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function saveDocuments(docs: ReaderDocument[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.documents, JSON.stringify(docs));
}

export async function loadProfile(): Promise<ProfileData> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.profile);
    if (!raw) {
      return DEFAULT_PROFILE;
    }
    return { ...DEFAULT_PROFILE, ...(JSON.parse(raw) as Partial<ProfileData>) };
  } catch {
    return DEFAULT_PROFILE;
  }
}

export async function saveProfile(profile: ProfileData): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEYS.profile, JSON.stringify(profile));
}

export async function createBackupPayload(): Promise<string> {
  const [session, documents, profile] = await Promise.all([
    loadSession(),
    loadDocuments(),
    loadProfile(),
  ]);

  const payload = {
    exportedAt: new Date().toISOString(),
    session,
    documents,
    profile,
  };

  const serialized = JSON.stringify(payload, null, 2);
  await AsyncStorage.setItem(STORAGE_KEYS.backup, serialized);
  return serialized;
}

export function countWords(text: string): number {
  const words = text
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean);
  return words.length;
}
