/**
 * EmptyState — universal empty placeholder.
 * Use whenever a list / table / grid has no data.
 *
 * Note: this is the canonical empty state. The legacy `src/components/uno/EmptyState.tsx`
 * remains for backward compatibility but new code MUST import from `@/components/page`.
 */
import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { PageState } from './PageState';

interface EmptyStateProps {
  icon?: LucideIcon | ReactNode;
  title: string;
  /** Russian title — when `isRu` is true takes precedence over `title`. Backwards-compat with legacy uno/EmptyState. */
  titleRu?: string;
  description?: string;
  /** Russian description — when `isRu` is true takes precedence over `description`. */
  descriptionRu?: string;
  action?: ReactNode;
  className?: string;
  /** Reduce vertical padding (for inline use inside cards). */
  compact?: boolean;
  /** When true, renders Russian variants of title/description if provided. */
  isRu?: boolean;
}

export function EmptyState({
  icon,
  title,
  titleRu,
  description,
  descriptionRu,
  action,
  className,
  compact = false,
  isRu = false,
}: EmptyStateProps) {
  return (
    <PageState
      title={isRu ? titleRu || title : title}
      description={isRu ? descriptionRu || description : description}
      icon={icon}
      heading="h3"
      compact={compact}
      className={className}
    >
      {action}
    </PageState>
  );
}
