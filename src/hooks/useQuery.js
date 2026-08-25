import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Fetch-on-mount with refetch, keeping the previous data on screen while a
 * refresh runs. Nothing in this app needs a cache layer — every screen reads a
 * single endpoint and re-reads it after a mutation.
 *
 * `fetcher` must be stable (wrap it in useCallback) or pass `deps` and let this
 * hook own the identity.
 */
export function useQuery(fetcher, deps = [], { enabled = true } = {}) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(enabled);
  const [refreshing, setRefreshing] = useState(false);

  // Survives unmount mid-flight and stops a stale response from overwriting a
  // newer one when deps change fast (tab switching, mostly).
  const generation = useRef(0);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const run = useCallback(
    async ({ silent = false } = {}) => {
      if (!enabled) return null;
      const ticket = ++generation.current;
      if (silent) setRefreshing(true);
      else setLoading((current) => (data === null ? true : current));

      try {
        const result = await fetcher();
        if (!mounted.current || ticket !== generation.current) return null;
        setData(result);
        setError(null);
        return result;
      } catch (caught) {
        if (!mounted.current || ticket !== generation.current) return null;
        setError(caught);
        return null;
      } finally {
        if (mounted.current && ticket === generation.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [enabled, ...deps]
  );

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    setLoading(true);
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, ...deps]);

  const reload = useCallback(() => run({ silent: true }), [run]);

  return { data, error, loading, refreshing, reload, setData };
}

export default useQuery;
