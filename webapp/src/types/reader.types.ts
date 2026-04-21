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
  sessionId?: string | null;
  scrollDepth: number;
  sessionStartTime: number;
  sessionEndTime?: number;
  elapsedMs: number;
  adaptations: TextAdaptation[];
  adaptedParagraphs?: Record<number, string>;
  eyeStrainLevel: number; // 0-1
  analysis?: {
    paragraphScores: Record<number, number>;
    strugglingParagraphs: number[];
  };
  fatigueLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
  simplifiedPhrases?: Array<{
    id: string;
    paragraphIndex: number;
    originalPhrase: string;
    simplifiedPhrase: string;
    explanation: string;
    startOffset: number;
    endOffset: number;
    timestamp: number;
  }>;
  highlightedPhrases?: string[];
}
