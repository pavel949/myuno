import type { ReactNode } from 'react';
import type { LangValues } from '@/lib/i18n/pickLang';
import { HomeGallery } from './HomeGallery';
import { CatalogState } from './HomeCatalogGalleries';

/**
 * Reusable homepage carousel: one heading/link contract plus separate
 * loading, failure and empty states so a failed read never looks like empty supply.
 */
export function HomeCarousel<T>({ id, title, description, href, linkLabel, items, getKey, renderItem, isLoading = false, isError = false, onRetry, empty, className }: {
  id: string; title: string; description?: string; href: string; linkLabel: string;
  items: readonly T[]; getKey: (item: T) => string; renderItem: (item: T) => ReactNode;
  isLoading?: boolean; isError?: boolean; onRetry?: () => unknown; empty: LangValues; className?: string;
}) {
  const showState = isLoading || isError || items.length === 0;
  return (
    <HomeGallery id={id} title={title} description={description} href={href} linkLabel={linkLabel} className={className}
      state={showState ? <CatalogState loading={isLoading} error={isError} empty={empty} retry={onRetry ?? (() => undefined)} /> : undefined}>
      {items.map(item => <div key={getKey(item)} className="contents">{renderItem(item)}</div>)}
    </HomeGallery>
  );
}
