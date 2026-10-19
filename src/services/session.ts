const STORAGE_KEY = 'aarogya.session.v1';
const EIGHT_HOURS = 8 * 60 * 60 * 1000;

export interface Session {
  userId: string;
  expiresAt: number;
}

export function readSession(now = Date.now()): Session | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as Session;
    if (!session.userId || typeof session.expiresAt !== 'number') return null;
    if (session.expiresAt <= now) return session;
    return session;
  } catch {
    return null;
  }
}

export function sessionExpired(session: Session | null, now = Date.now()): boolean {
  return Boolean(session && session.expiresAt <= now);
}

export function writeSession(userId: string, now = Date.now()): Session {
  const session = { userId, expiresAt: now + EIGHT_HOURS };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  return session;
}

export function clearSession(): void {
  localStorage.removeItem(STORAGE_KEY);
}
