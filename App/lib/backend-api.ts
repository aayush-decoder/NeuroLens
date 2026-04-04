const API_BASE_URL =
  process.env.EXPO_PUBLIC_BACKEND_URL?.replace(/\/$/, '') || 'http://10.0.2.2:3000';

export function getBackendBaseUrl(): string {
  return API_BASE_URL;
}

type ApiOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  headers?: Record<string, string>;
  body?: unknown;
};

async function apiRequest<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const text = await response.text();
  const payload = text ? (JSON.parse(text) as T & { error?: string; message?: string }) : ({} as T & { error?: string; message?: string });

  if (!response.ok) {
    throw new Error(payload.error || payload.message || `Request failed (${response.status})`);
  }

  return payload as T;
}

export type StartSessionResponse = {
  id: string;
  userId: string;
  contentId: string;
  status: string;
};

export async function startBackendSession(userId: string, contentId: string): Promise<StartSessionResponse> {
  return apiRequest<StartSessionResponse>('/api/session/start', {
    method: 'POST',
    body: { userId, contentId },
  });
}

export async function endBackendSession(sessionId: string): Promise<void> {
  await apiRequest('/api/session/end', {
    method: 'POST',
    body: { sessionId },
  });
}

export async function sendTelemetryEvent(input: {
  sessionId: string;
  type: string;
  value: number;
  meta?: Record<string, unknown>;
}): Promise<void> {
  await apiRequest('/api/telemetry', {
    method: 'POST',
    body: input,
  });
}

export type AnalyzeResponse = {
  paragraphScores: Record<string, number>;
  strugglingParagraphs: number[];
};

export type FatigueResponse = {
  level: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
  settings: {
    theme: 'light' | 'soft' | 'dark';
    fontWeight: number;
    lineHeight: number;
    contrast: 'normal' | 'medium' | 'high' | 'very-high';
  };
};

export async function analyzeSession(sessionId: string): Promise<AnalyzeResponse> {
  return apiRequest<AnalyzeResponse>('/api/analyze', {
    method: 'POST',
    body: { sessionId },
  });
}

export async function getFatigueState(sessionId: string): Promise<FatigueResponse> {
  return apiRequest<FatigueResponse>('/api/fatigue', {
    method: 'POST',
    body: { sessionId },
  });
}

export async function adaptText(text: string, strugglingParagraphs: number[]): Promise<string> {
  const response = await apiRequest<{ modifiedText: string }>('/api/adapt', {
    method: 'POST',
    body: { text, strugglingParagraphs },
  });

  return response.modifiedText;
}

export async function registerFromMobile(input: {
  username: string;
  email: string;
  password: string;
}): Promise<void> {
  await apiRequest('/api/register', {
    method: 'POST',
    body: input,
  });
}

export type MobileAuthUser = {
  id: string;
  username: string;
  email: string;
};

export async function loginFromMobile(input: {
  email: string;
  password: string;
}): Promise<MobileAuthUser> {
  const response = await apiRequest<{ user: MobileAuthUser }>('/api/auth/login', {
    method: 'POST',
    body: input,
  });

  return response.user;
}

export async function signupFromMobile(input: {
  username: string;
  email: string;
  password: string;
}): Promise<void> {
  await registerFromMobile(input);
}
