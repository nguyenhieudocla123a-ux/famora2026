/**
 * PHASE 2 MOCK — replaced by Redux Toolkit thunks + Axios in Phase 7.
 * Gives screens the same loading / error / success shape the real API calls will have,
 * so every screen already handles its loading, error and empty states.
 */
import { useCallback, useEffect, useState } from 'react';

type Status = 'loading' | 'error' | 'success';

export function useMockResource<T>(load: () => T, delayMs = 300) {
  const [status, setStatus] = useState<Status>('loading');
  const [data, setData] = useState<T | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    setStatus('loading');
    const t = setTimeout(() => {
      try {
        setData(load());
        setStatus('success');
      } catch {
        setStatus('error');
      }
    }, delayMs);
    return () => clearTimeout(t);
    // `load` is a pure lookup of mock data; re-run only on retry.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt, delayMs]);

  const reload = useCallback(() => setAttempt(a => a + 1), []);
  return { status, data, reload };
}
