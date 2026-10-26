'use client';

import { useCallback, useEffect, useState } from 'react';
import { ApiError, api } from '@/lib/api-client';

/** Chargement d'une ressource admin avec rechargement manuel et message d'erreur lisible. */
export function useAdminData<T>(path: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!path) return;
    setLoading(true);
    try {
      setData(await api<T>(path));
      setError('');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Chargement impossible.');
    } finally {
      setLoading(false);
    }
  }, [path]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { data, error, loading, reload, setData };
}

export function errorMessage(err: unknown): string {
  return err instanceof ApiError ? err.message : 'Action impossible, réessayez.';
}
