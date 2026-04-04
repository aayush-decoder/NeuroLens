export interface ReaderFile {
  id: string;
  name: string;
  content: string;
  folderId: string | null;
  createdAt: number;
  lastRead?: number;
  scrollDepth?: number;
  readingTimeSeconds?: number;
}

export interface Folder {
  id: string;
  name: string;
  color: string;
  createdAt: number;
}

export interface ParagraphTelemetry {
  paragraphIndex: number;
  dwellTimeMs: number;
  hesitationCount: number;
  highlightedWords: string[];
  frictionScore: number; // 0-1
}

export interface SessionTelemetry {
  fileId: string;
  startTime: number;
  totalReadingTimeMs: number;
  paragraphs: ParagraphTelemetry[];
  avgScrollVelocity: number;
  struggledTerms: StruggledTerm[];
}

export interface StruggledTerm {
  word: string;
  paragraphIndex: number;
  frictionScore: number;
  definition?: string;
  synonym?: string;
  cognate?: string;
}

export interface TextAdaptation {
  original: string;
  adapted: string;
  type: 'synonym' | 'definition' | 'acronym' | 'cognate';
}

export interface ReadingSessionState {
  fileId: string;
  scrollDepth: number;
  sessionStartTime: number;
  elapsedMs: number;
  adaptations: TextAdaptation[];
  eyeStrainLevel: number; // 0-1
}
