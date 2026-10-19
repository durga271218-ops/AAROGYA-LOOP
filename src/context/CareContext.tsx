import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useAuth } from './AuthContext.tsx';
import { loadAppData, type AppData } from '../services/care.ts';
import type { User } from '../types/models.ts';

interface CareValue {
  ready: boolean;
  error: string | null;
  data: AppData | null;
  activePatientId: string | null;
  activePatient: User | null;
  setActivePatientId: (id: string | null) => void;
  refresh: () => void;
  textSize: 'comfortable' | 'large';
  setTextSize: (size: 'comfortable' | 'large') => void;
}

const CareContext = createContext<CareValue | null>(null);

export function CareProvider({ children }: { children: ReactNode }) {
  const { user, refresh: refreshAuth } = useAuth();
  const [version, setVersion] = useState(0);
  const [ready, setReady] = useState(false);
  const [activePatientId, setActivePatientIdState] = useState<string | null>(null);
  const [textSize, setTextSizeState] = useState<'comfortable' | 'large'>(() =>
    localStorage.getItem('aarogya.textSize') === 'large' ? 'large' : 'comfortable',
  );

  const loaded = useMemo(() => {
    if (!user) return { data: null, error: 'Sign in to view records.' };
    try {
      return { data: loadAppData(user.id), error: null as string | null };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'The demo data could not be read.' };
    }
  }, [user, version]);

  useEffect(() => {
    setReady(false);
    const timer = window.setTimeout(() => setReady(true), 180);
    return () => window.clearTimeout(timer);
  }, [user?.id]);

  useEffect(() => {
    if (!user || !loaded.data) return;
    const stored = localStorage.getItem(`aarogya.active.${user.id}`);
    if (user.role === 'patient') {
      setActivePatientIdState(user.id);
      return;
    }
    if (stored && loaded.data.patients.some((patient) => patient.id === stored)) {
      setActivePatientIdState(stored);
      return;
    }
    setActivePatientIdState(user.role === 'caregiver' ? (loaded.data.patients[0]?.id ?? null) : null);
  }, [user, loaded.data]);

  const value = useMemo<CareValue>(() => {
    const activePatient = loaded.data?.patients.find((patient) => patient.id === activePatientId) ?? null;
    return {
      ready,
      error: loaded.error,
      data: loaded.data,
      activePatientId,
      activePatient,
      setActivePatientId: (id) => {
        setActivePatientIdState(id);
        if (!user) return;
        if (id) localStorage.setItem(`aarogya.active.${user.id}`, id);
        else localStorage.removeItem(`aarogya.active.${user.id}`);
      },
      refresh: () => {
        refreshAuth();
        setVersion((current) => current + 1);
      },
      textSize,
      setTextSize: (size) => {
        localStorage.setItem('aarogya.textSize', size);
        setTextSizeState(size);
      },
    };
  }, [ready, loaded, activePatientId, user, refreshAuth, textSize]);

  return <CareContext.Provider value={value}>{children}</CareContext.Provider>;
}

export function useCare(): CareValue {
  const value = useContext(CareContext);
  if (!value) throw new Error('useCare must be used within CareProvider');
  return value;
}
