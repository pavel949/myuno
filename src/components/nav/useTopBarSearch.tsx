import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useLanguage } from '@/contexts/LanguageContext';
import { pickLang } from '@/lib/i18n/pickLang';

const GlobalSearchModal = lazy(async () => ({
  default: (await import('@/components/search/GlobalSearchModal')).GlobalSearchModal,
}));

export function useTopBarSearch(shortcutEnabled: boolean) {
  const { language } = useLanguage();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchRequested, setSearchRequested] = useState(false);
  const searchOrigin = useRef<HTMLElement | null>(null);

  const openSearch = useCallback((origin?: HTMLElement) => {
    if (!searchOpen) {
      searchOrigin.current = origin
        ?? (document.activeElement instanceof HTMLElement ? document.activeElement : null);
    }
    setSearchRequested(true);
    setSearchOpen(true);
  }, [searchOpen]);

  const handleSearchOpenChange = useCallback((open: boolean) => {
    setSearchOpen(open);
    // The controlled dialog has no Radix trigger to restore focus to.
    if (!open) {
      const origin = searchOrigin.current;
      requestAnimationFrame(() => { if (origin?.isConnected) origin.focus({ preventScroll: true }); });
    }
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!shortcutEnabled || !(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== 'k') return;
      event.preventDefault();
      openSearch();
    };
    const openHandler = () => openSearch();
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('myuno:open-search', openHandler);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('myuno:open-search', openHandler);
    };
  }, [openSearch, shortcutEnabled]);

  const searchDialog = searchRequested && (
    <ErrorBoundary fallback={(
      <span role="alert">
        {pickLang(language, { ru: 'Не удалось загрузить поиск', en: 'Search could not load', th: 'โหลดการค้นหาไม่สำเร็จ' })}
      </span>
    )}>
      <Suspense fallback={(
        <span className="sr-only" role="status">
          {pickLang(language, { ru: 'Загрузка поиска', en: 'Loading search', th: 'กำลังโหลดการค้นหา' })}
        </span>
      )}>
        <GlobalSearchModal open={searchOpen} onOpenChange={handleSearchOpenChange} />
      </Suspense>
    </ErrorBoundary>
  );

  return { openSearch, searchDialog };
}
