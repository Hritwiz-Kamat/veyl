/**
 * useHealthCheck — polls GET /api/v1/health on mount and reports status.
 *
 * Returns:
 *   status: 'idle' | 'loading' | 'connected' | 'error'
 *   data:   HealthResponse | null
 *   error:  string | null
 *   refetch: () => void
 */
import { useState, useEffect, useCallback } from 'react';
import { getHealth } from '../services/api/health';
import type { HealthResponse } from '../types/api';

export type HealthStatus = 'idle' | 'loading' | 'connected' | 'error';

export interface UseHealthCheckResult {
  status: HealthStatus;
  data: HealthResponse | null;
  error: string | null;
  refetch: () => void;
}

export function useHealthCheck(): UseHealthCheckResult {
  const [status, setStatus] = useState<HealthStatus>('loading');
  const [data, setData] = useState<HealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const check = useCallback(async () => {
    setStatus('loading');
    setError(null);
    try {
      const response = await getHealth();
      setData(response);
      setStatus('connected');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    getHealth()
      .then((res) => {
        if (!cancelled) {
          setData(res);
          setStatus('connected');
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Unknown error');
          setStatus('error');
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { status, data, error, refetch: check };
}

