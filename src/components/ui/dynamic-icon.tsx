/**
 * DynamicIcon — renders a Lucide icon by name using dynamic imports.
 * Replaces `import * as LucideIcons` which kills tree-shaking (~200KB bloat).
 * Uses React.lazy + Suspense for code-split icon loading.
 */
import React, { lazy, Suspense, useMemo } from 'react';
import type { LucideProps } from 'lucide-react';
import dynamicIconImports from 'lucide-react/dynamicIconImports';
import { Compass } from 'lucide-react';

// Convert PascalCase icon name to kebab-case for dynamicIconImports
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

// Cache lazy components to avoid re-creating on every render
const iconCache = new Map<string, React.LazyExoticComponent<React.ComponentType<LucideProps>>>();

function getLazyIcon(kebabName: string) {
  if (iconCache.has(kebabName)) return iconCache.get(kebabName)!;
  
  const importFn = dynamicIconImports[kebabName as keyof typeof dynamicIconImports];
  if (!importFn) return null;
  
  const LazyIcon = lazy(importFn);
  iconCache.set(kebabName, LazyIcon);
  return LazyIcon;
}

export function DynamicIcon({ name, fallback, ...props }: DynamicIconProps) {
  const kebabName = useMemo(() => {
    // If already kebab-case, use as is; otherwise convert
    return name.includes('-') ? name : toKebabCase(name);
  }, [name]);

  const LazyIcon = useMemo(() => getLazyIcon(kebabName), [kebabName]);

  if (!LazyIcon) {
    // Icon name not found — render fallback
    return fallback ? <>{fallback}</> : <Compass {...props} />;
  }

  return (
    <Suspense fallback={fallback || <Compass {...props} />}>
      <LazyIcon {...props} />
    </Suspense>
  );
}

export default DynamicIcon;
