export const API_ROUTES = {
  register: '/api/register',
  upload: '/api/upload',
  telemetry: '/api/telemetry',
  analyze: '/api/analyze',
  sessionStart: '/api/session/start',
  sessionGet: (id: string) => `/api/session/${id}`,
  sessionEnd: '/api/session/end',
  adapt: '/api/adapt',
  fatigue: '/api/fatigue',
} as const;