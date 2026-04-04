import { API_ROUTES } from './api';

type JsonObject = Record<string, unknown>;

async function requestJson<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    credentials: 'include',
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

  const payload = (await response.json().catch(() => ({}))) as T & { error?: string; message?: string };

  if (!response.ok) {
    throw new Error(payload.error || payload.message || 'Request failed');
  }

  return payload;
}

export type StartSessionInput = {
  userId: string;
  contentId: string;
  title: string;
  body: string;
  startedAt?: string;
};

export type StartSessionResponse = {
  sessionId: string;
  contentId?: string;
};

export async function startReaderSession(input: StartSessionInput): Promise<StartSessionResponse> {
  const payload = await requestJson<StartSessionResponse | { id: string } | { sessionId: string }>(API_ROUTES.sessionStart, {
    method: 'POST',
    body: JSON.stringify(input),
  });

  return {
    sessionId: 'sessionId' in payload ? payload.sessionId : payload.id,
    contentId: 'contentId' in payload ? payload.contentId : input.contentId,
  };
}

export async function fetchReaderSession(sessionId: string) {
  return requestJson<JsonObject | null>(API_ROUTES.sessionGet(sessionId), {
    method: 'GET',
  });
}

export async function sendReaderTelemetry(input: {
  sessionId: string;
  type: string;
  value: number;
  meta?: JsonObject;
}) {
  return requestJson(API_ROUTES.telemetry, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function analyzeReaderSession(sessionId: string) {
  return requestJson<{ paragraphScores: Record<string, number>; strugglingParagraphs: number[] }>(API_ROUTES.analyze, {
    method: 'POST',
    body: JSON.stringify({ sessionId }),
  });
}

export async function adaptReaderText(input: { text: string; strugglingParagraphs: number[] }) {
  return requestJson<{ modifiedText: string }>(API_ROUTES.adapt, {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function endReaderSession(sessionId: string) {
  return requestJson(API_ROUTES.sessionEnd, {
    method: 'POST',
    body: JSON.stringify({ sessionId }),
    keepalive: true,
  });
}

export async function fetchReaderFatigue(sessionId: string) {
  return requestJson<{ level: string; settings: JsonObject }>(API_ROUTES.fatigue, {
    method: 'POST',
    body: JSON.stringify({ sessionId }),
  });
}