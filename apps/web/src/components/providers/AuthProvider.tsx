'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api } from '@/lib/api-client';
import type { SessionUser } from '@/lib/types';

interface AuthContextValue {
  user: SessionUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<SessionUser>;
  logout: () => Promise<void>;
  reload: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    try {
      let data = await api<{ user: SessionUser | null }>('/api/auth/me');
      if (!data.user) {
        // Jeton d'accès expiré mais session encore valide : on tente un renouvellement silencieux.
        const refreshed = await fetch('/api/auth/refresh', { method: 'POST', headers: { 'x-glaciora-csrf': '1' }, credentials: 'same-origin' });
        if (refreshed.ok) data = (await refreshed.json()) as { user: SessionUser | null };
      }
      setUser(data.user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      reload,
      login: async (email, password) => {
        const data = await api<{ user: SessionUser }>('/api/auth/login', { method: 'POST', json: { email, password } });
        setUser(data.user);
        return data.user;
      },
      logout: async () => {
        await api('/api/auth/logout', { method: 'POST' }).catch(() => undefined);
        setUser(null);
      },
    }),
    [user, loading, reload],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth doit être utilisé dans AuthProvider');
  return ctx;
}
