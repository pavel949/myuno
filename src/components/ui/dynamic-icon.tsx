/**
 * DynamicIcon — renders a Lucide icon by name using dynamic imports.
 *
 * Why we lazy-load `lucide-react/dynamicIconImports`:
 *   That module is a static object literal mapping every icon to a dynamic
 *   `import()`. Even though each value is async, the *map itself* is a
 *   static module — and Vite's manualChunks classifies it as
 *   `vendor-icons-core`. Once any entry-graph module statically imports
 *   `dynamic-icon.tsx`, the entry chunk gains a static dependency on the map,
 *   which in turn statically references every icon file. Result: all three
 *   `vendor-icons-{core,extended,rare}` chunks get preloaded on the home page,
 *   even though `DynamicIcon` is only rendered on LifeOS / LifeFlow / admin
 *   surfaces.
 *
 * Loading the map via `await import(...)` makes it a code-split chunk that
 * only ships when the first `DynamicIcon` actually mounts.
 */
import React, { lazy, Suspense, useMemo } from 'react';
import type { LucideProps } from 'lucide-react';
import { Compass } from 'lucide-react';

function toKebabCase(str: string): string {
  return str
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
    .toLowerCase();
}

interface DynamicIconProps extends Omit<LucideProps, 'ref'> {
  /** Icon name in PascalCase (e.g. "ListChecks") or kebab-case ("list-checks") */
  name: string;
  /** Fallback icon shown while loading or if icon not found */
  fallback?: React.ReactNode;
}

const iconCache = new Map<string, React.LazyExoticComponent<React.ComponentType<LucideProps>>>();

function getLazyIcon(kebabName: string) {
  if (iconCache.has(kebabName)) return iconCache.get(kebabName)!;
  const LazyIcon = lazy(async () => {
    const map = (await import('lucide-react/dynamicIconImports')).default as Record<
      string,
      () => Promise<{ default: React.ComponentType<LucideProps> }>
    >;
    const importFn = map[kebabName];
    if (!importFn) return { default: Compass as React.ComponentType<LucideProps> };
    return importFn();
  });
  iconCache.set(kebabName, LazyIcon);
  return LazyIcon;
}

export function DynamicIcon({ name, fallback, ...props }: DynamicIconProps) {
  const kebabName = useMemo(
    () => (name.includes('-') ? name : toKebabCase(name)),
    [name],
  );
  const LazyIcon = useMemo(() => getLazyIcon(kebabName), [kebabName]);

  return (
    <Suspense fallback={fallback || <Compass {...props} />}>
      <LazyIcon {...props} />
    </Suspense>
  );
}

export default DynamicIcon;
