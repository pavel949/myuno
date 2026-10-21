/** A return location is navigation context only, never an authorization input. */
export function getTodayReturnPath(value: string | null): string | null {
  if (!value || !/^\/mc\/today(?:[?#]|$)/.test(value)) return null;
  if ([...value].some(char => char === '\\' || char.charCodeAt(0) <= 32 || char.charCodeAt(0) === 127)) return null;
  try {
    const base = 'https://task-navigation.invalid';
    const url = new URL(value, base);
    if (url.origin !== base || url.pathname !== '/mc/today') return null;
    return value;
  } catch {
    return null;
  }
}
