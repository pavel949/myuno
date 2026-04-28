/**
 * @deprecated Re-exports the canonical `PageHeader` from `@/components/page`.
 * Kept only for backwards-compatibility with existing imports
 * (`import { PageHeader } from '@/components/uno/PageHeader'`).
 *
 * For new code:
 *   import { PageHeader } from '@/components/page';
 *
 * The canonical version supports the legacy `variant?: 'default' | 'sticky' | 'transparent'`
 * prop as a deprecated alias for `sticky` boolean.
 */
export { PageHeader } from '@/components/page/PageHeader';
