/**
 * Public marketing / app URLs — single source for SEO, legal, and deep links.
 * Do not put API secrets here (Vite env only).
 */
export const PUBLIC_URLS = {
  /** Primary production hostname (no trailing slash) */
  APP_ORIGIN: 'https://myuno.app',
  /** Marketing / Lovable preview (when applicable) */
  LOVABLE_PREVIEW_HOST: 'lovable.dev',
} as const;

/** Build absolute URL to a path on the main app */
export function appUrl(path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${PUBLIC_URLS.APP_ORIGIN}${p}`;
}
