/**
 * @deprecated Re-exports the canonical `EmptyState` from `@/components/page`.
 * Kept only for backwards-compatibility with existing imports
 * (`import { EmptyState } from '@/components/uno/EmptyState'`).
 *
 * For new code:
 *   import { EmptyState } from '@/components/page';
 *
 * The canonical version supports the legacy bilingual props
 * (`titleRu`, `descriptionRu`, `isRu`) for backwards-compatibility.
 */
export { EmptyState } from '@/components/page/EmptyState';
