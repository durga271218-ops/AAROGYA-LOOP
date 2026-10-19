export const proposedApi = [
  { method: 'POST', path: '/v1/auth/login', purpose: 'Start a session after the server checks the password.' },
  { method: 'POST', path: '/v1/auth/register', purpose: 'Create an account. Doctor registration must not imply credential verification.' },
  { method: 'POST', path: '/v1/auth/logout', purpose: 'End the server session.' },
  { method: 'POST', path: '/v1/auth/password', purpose: 'Change a password for the signed-in account.' },
  { method: 'GET', path: '/v1/me', purpose: 'Return the signed-in profile and role.' },
  { method: 'GET', path: '/v1/patients', purpose: 'Return only patients the caller is allowed to open.' },
  { method: 'GET', path: '/v1/medications', purpose: 'List medications for an authorized patient.' },
  { method: 'POST', path: '/v1/medications', purpose: 'Add a prescribed entry or a personal reminder.' },
  { method: 'PATCH', path: '/v1/medications/:id', purpose: 'Edit a reminder or discontinue an entry.' },
  { method: 'POST', path: '/v1/doses/:id', purpose: 'Record a reminder as taken, skipped, or missed.' },
  { method: 'GET', path: '/v1/appointments', purpose: 'List authorized appointments.' },
  { method: 'POST', path: '/v1/appointments', purpose: 'Create an appointment.' },
  { method: 'POST', path: '/v1/appointments/:id/cancel', purpose: 'Cancel an appointment.' },
  { method: 'POST', path: '/v1/appointments/:id/reschedule', purpose: 'Move an appointment.' },
  { method: 'GET', path: '/v1/prescriptions', purpose: 'List authorized prescriptions.' },
  { method: 'POST', path: '/v1/prescriptions', purpose: 'Store a clinician entry or an uploaded document for review.' },
  { method: 'GET', path: '/v1/follow-ups', purpose: 'List authorized follow-ups.' },
  { method: 'POST', path: '/v1/follow-ups', purpose: 'Create a follow-up reminder.' },
  { method: 'POST', path: '/v1/follow-ups/:id/complete', purpose: 'Mark a follow-up complete.' },
  { method: 'GET', path: '/v1/notifications', purpose: 'List reminders for the signed-in person.' },
  { method: 'GET', path: '/v1/records', purpose: 'List authorized health documents.' },
  { method: 'POST', path: '/v1/records', purpose: 'Store document metadata after a real upload service exists.' },
] as const;

export const API_UNAVAILABLE =
  'The API data source is selected, but no backend is connected. Nothing was sent to a server. Use the browser demo, or implement the routes described in src/services/contract.ts.';
