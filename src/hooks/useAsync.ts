import { useCallback, useState } from "react";

/**
 * Hook pour débouncer une valeur
 * Utile pour retarder les recherches, validations, etc.
 */
export function useDebounce<T>(value: T, delayMs = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);

    return () => clearTimeout(handler);
  }, [value, delayMs]);

  return debouncedValue;
}

/**
 * Hook pour throttle une valeur
 * Utile pour les events fréquents (scroll, resize, etc.)
 */
export function useThrottle<T>(value: T, throttleMs = 500): T {
  const [throttledValue, setThrottledValue] = useState<T>(value);
  const [lastUpdated, setLastUpdated] = useState<number>(Date.now());

  useEffect(() => {
    const now = Date.now();
    if (now >= lastUpdated + throttleMs) {
      setLastUpdated(now);
      setThrottledValue(value);
    } else {
      const handler = setTimeout(() => {
        setLastUpdated(Date.now());
        setThrottledValue(value);
      }, throttleMs);

      return () => clearTimeout(handler);
    }
  }, [value, throttleMs, lastUpdated]);

  return throttledValue;
}

/**
 * Hook pour gérer les appels async avec loading et error states
 */
interface UseAsyncState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

export function useAsync<T>(
  asyncFunction: () => Promise<T>,
  immediate = true
): UseAsyncState<T> & { execute: () => Promise<T> } {
  const [state, setState] = useState<UseAsyncState<T>>({
    data: null,
    loading: immediate,
    error: null,
  });

  const execute = useCallback(async () => {
    setState({ data: null, loading: true, error: null });
    try {
      const response = await asyncFunction();
      setState({ data: response, loading: false, error: null });
      return response;
    } catch (error) {
      const err = error instanceof Error ? error : new Error("Erreur inconnue");
      setState({ data: null, loading: false, error: err });
      throw err;
    }
  }, [asyncFunction]);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [execute, immediate]);

  return { ...state, execute };
}

import { useEffect } from "react";
