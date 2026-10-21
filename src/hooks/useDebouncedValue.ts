import { useEffect, useState } from 'react';

/**
 * Debounces a value by `delay` ms. Useful for search inputs to avoid
 * filtering large lists on every keystroke (mobile performance).
 */
export function useDebouncedValue<T>(value: T, delay = 250): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);

  return debounced;
}
