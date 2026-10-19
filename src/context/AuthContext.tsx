import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { RegisterInput, User } from '../types/models.ts';
import { getUser, login as loginAccount, registerAccount, type AuthResult } from '../services/care.ts';
import { clearSession, readSession, sessionExpired, writeSession } from '../services/session.ts';

interface AuthValue {
  user: User | null;
  ready: boolean;
  expired: boolean;
  login: (email: string, password: string) => AuthResult;
  register: (input: RegisterInput) => AuthResult;
  logout: () => void;
  refresh: () => void;
  clearExpired: () => void;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    const session = readSession();
    if (session && sessionExpired(session)) {
      clearSession();
      setExpired(true);
    } else if (session) {
      setUser(getUser(session.userId));
    }
    setReady(true);
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      const session = readSession();
      if (session && sessionExpired(session)) {
        clearSession();
        setUser(null);
        setExpired(true);
      }
    }, 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const value = useMemo<AuthValue>(
    () => ({
      user,
      ready,
      expired,
      login: (email, password) => {
        const result = loginAccount(email, password);
        if (result.ok) {
          writeSession(result.user.id);
          setUser(result.user);
          setExpired(false);
        }
        return result;
      },
      register: (input) => {
        const result = registerAccount(input);
        if (result.ok) {
          writeSession(result.user.id);
          setUser(result.user);
          setExpired(false);
        }
        return result;
      },
      logout: () => {
        clearSession();
        setUser(null);
      },
      refresh: () => setUser((current) => (current ? getUser(current.id) : null)),
      clearExpired: () => setExpired(false),
    }),
    [user, ready, expired],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used within AuthProvider');
  return value;
}
