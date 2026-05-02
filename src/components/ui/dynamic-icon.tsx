/**
 * DynamicIcon — renders a Lucide icon by name using on-demand dynamic imports.
 *
 * Why not `lucide-react/dynamicIconImports`?
 *   That module is a static object literal referencing every icon. Even though
 *   each value is a dynamic `import()`, Vite hoists the whole map into the
 *   entry graph, which forces `vendor-icons-rare` to be preloaded on the home
 *   screen — even though `DynamicIcon` is only used on LifeOS / LifeFlow /
 *   admin pages.
 *
 * Instead we use `import.meta.glob` against `lucide-react/dist/esm/icons/*.js`
 * with `{ eager: false }`. Vite emits one async chunk per icon and never pulls
 * the map into the initial bundle. The first `DynamicIcon` render on a LifeOS
 * page triggers the icon fetch; the home screen pays nothing.
 */
import React, { lazy, Suspense, useMemo } from 'react';
import type { LucideProps } from 'lucide-react';
import { Compass } from 'lucide-react';

// One async import() per icon file. Vite resolves this at build time into
// per-icon chunks — none of which land in the entry graph.
const iconLoaders = import.meta.glob<{ default: React.ComponentType<LucideProps> }>(
  '../../../node_modules/lucide-react/dist/esm/icons/*.js',
);

// Build a kebab-name → loader lookup once.
const loaderByName: Record<string, () => Promise<{ default: React.ComponentType<LucideProps> }>> = {};
for (const [path, loader] of Object.entries(iconLoaders)) {
  const match = path.match(/\/icons\/([^/]+)\.js$/);
  if (match) loaderByName[match[1]] = loader;
}

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
  const loader = loaderByName[kebabName];
  if (!loader) return null;
  const LazyIcon = lazy(loader);
  iconCache.set(kebabName, LazyIcon);
  return LazyIcon;
}

export function DynamicIcon({ name, fallback, ...props }: DynamicIconProps) {
  const kebabName = useMemo(
    () => (name.includes('-') ? name : toKebabCase(name)),
    [name],
  );
  const LazyIcon = useMemo(() => getLazyIcon(kebabName), [kebabName]);

  if (!LazyIcon) {
    return fallback ? <>{fallback}</> : <Compass {...props} />;
  }

  return (
    <Suspense fallback={fallback || <Compass {...props} />}>
      <LazyIcon {...props} />
    </Suspense>
  );
}

export default DynamicIcon;
