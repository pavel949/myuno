/**
 * Lodash-free helpers for spec-driven forms.
 * Read/write deeply-nested JSON paths like "attributes.cuisine_types".
 */

export function getPath<T = unknown>(obj: unknown, path: string): T | undefined {
  if (!obj || !path) return undefined;
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object' && key in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj) as T | undefined;
}

export function setPath<T extends Record<string, unknown>>(obj: T, path: string, value: unknown): T {
  if (!path) return obj;
  const keys = path.split('.');
  const next: Record<string, unknown> = { ...(obj as Record<string, unknown>) };
  let cursor: Record<string, unknown> = next;
  for (let i = 0; i < keys.length - 1; i++) {
    const k = keys[i];
    const existing = cursor[k];
    cursor[k] = existing && typeof existing === 'object' && !Array.isArray(existing)
      ? { ...(existing as Record<string, unknown>) }
      : {};
    cursor = cursor[k] as Record<string, unknown>;
  }
  cursor[keys[keys.length - 1]] = value;
  return next as T;
}
