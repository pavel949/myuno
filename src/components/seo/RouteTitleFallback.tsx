import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { pickLang } from '@/lib/i18n/pickLang';

const STATIC_TITLE_SELECTOR = 'title[data-static-title]';
const OBSERVE_WINDOW_MS = 10_000;
const SETTLE_DELAY_MS = 200;
const MAX_HEADING_LENGTH = 70;

const BRAND_TITLE = {
  ru: 'myUNO — ваш дом и жизнь на Пхукете',
  en: 'myUNO — your home and life in Phuket',
  th: 'myUNO — บ้านและชีวิตของคุณในภูเก็ต',
};

/** Title for a page that declares none: its visible H1, else the brand line. */
export function fallbackTitleFromHeading(heading: string | null | undefined, brand: string): string {
  const text = (heading ?? '').replace(/\s+/g, ' ').trim();
  if (!text) return brand;
  const clipped = text.length > MAX_HEADING_LENGTH ? `${text.slice(0, MAX_HEADING_LENGTH - 1).trimEnd()}…` : text;
  return `${clipped} | myUNO`;
}

/**
 * Keeps the static `<title>` from index.html meaningful on routes that render
 * no `SEOHead`. React hoists a page's own `<title>` ahead of the static one, so
 * explicit page titles always win; this only fills the gap so a browser tab,
 * history entry or screen reader never announces the same generic name for
 * different pages.
 */
export function RouteTitleFallback() {
  const { pathname } = useLocation();
  const { language } = useLanguage();

  useEffect(() => {
    const titleEl = document.head.querySelector(STATIC_TITLE_SELECTOR);
    if (!titleEl) return;
    const brand = pickLang(language, BRAND_TITLE);
    titleEl.textContent = brand;

    let timer: number | undefined;
    const apply = () => {
      timer = undefined;
      const heading = document.querySelector<HTMLElement>('main h1') ?? document.querySelector<HTMLElement>('h1');
      const next = fallbackTitleFromHeading(heading?.innerText ?? heading?.textContent, brand);
      if (titleEl.textContent !== next) titleEl.textContent = next;
    };
    const schedule = () => {
      if (timer === undefined) timer = window.setTimeout(apply, SETTLE_DELAY_MS);
    };

    schedule();
    const observer = new MutationObserver(schedule);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    const stop = window.setTimeout(() => observer.disconnect(), OBSERVE_WINDOW_MS);

    return () => {
      observer.disconnect();
      window.clearTimeout(stop);
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, [pathname, language]);

  return null;
}
