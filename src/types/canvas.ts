/**
 * @module CanvasTypes
 * @description Canonical app-shell ("canvas") taxonomy.
 *
 * **Terminology — read this before adding navigation code:**
 *
 *  - **Canvas (App Shell)** — one of the 6 long-lived navigation shells used
 *    by global navigation: `home`, `discover`, `operate`, `wallet`, `me`,
 *    `admin`. Owns the chrome (top bar, bottom bar, side drawer) and the
 *    base route prefix. Maps roughly to "what app am I in right now."
 *
 *  - **Cluster (Content Cluster / Surface)** — one of the 6 content
 *    clusters defined in `src/lib/catalog/taxonomy.ts:CLUSTERS`: `arrive`,
 *    `live`, `manage`, `invest`, `legal`, `build`. Owns the catalog
 *    taxonomy (categories → services) and the role-aware audience gates.
 *    Maps to "what kind of job am I doing."
 *
 *  - **JTBD Cluster (functional)** — one of the 10 A..J codes in
 *    `src/lib/taxonomies/master.ts`. Tagging / AI routing only — never a
 *    navigation entity. See that file for the strict separation rules.
 *
 * Prior to 2026-05 the term "Surface" referred to both Canvases and
 * Content Clusters; CLAUDE.md §1.5 documents the rename. This module
 * exists so future routing/permission code can refer to Canvases with a
 * type-safe identifier instead of a string literal.
 *
 * Adoption status (as of 2026-05-20 taxonomy audit, obs 3101):
 *  - ✅ Runtime classifier — `canvasFromPath()` below; consumed by
 *    `useCurrentCanvas()` (`src/hooks/useCurrentCanvas.ts`) and by
 *    `NavShell` as a `data-canvas` attribute for CSS / analytics targeting.
 *  - 🚧 Route-tree typing — `AnimatedRoutes.tsx` / `pageRegistry.ts` still
 *    use plain `<Route>` definitions, not `CanvasId`-keyed groups. Migrate
 *    incrementally; no urgency while the classifier covers shell-level needs.
 */

export type CanvasId =
  | 'home'
  | 'discover'
  | 'operate'
  | 'wallet'
  | 'me'
  | 'admin';

export const CANVAS_IDS: readonly CanvasId[] = [
  'home',
  'discover',
  'operate',
  'wallet',
  'me',
  'admin',
] as const;

/**
 * Visibility tier for a canvas:
 *  - `public` — every visitor sees the shell (Home, Discover).
 *  - `authenticated` — any signed-in user (Wallet, Me).
 *  - `workspace` — gated by canonical role / persona (Operate).
 *  - `admin` — internal staff only (Admin).
 */
export type CanvasAudience = 'public' | 'authenticated' | 'workspace' | 'admin';

export interface CanvasMeta {
  id: CanvasId;
  labelEn: string;
  labelRu: string;
  audience: CanvasAudience;
  /**
   * Default landing path for this canvas. Routing layers should treat this
   * as the umbrella entry — deep links into a specific cluster/service may
   * still apply on top.
   */
  defaultPath: string;
}

export const CANVAS_META: Record<CanvasId, CanvasMeta> = {
  home:     { id: 'home',     labelEn: 'Home',     labelRu: 'Главная',     audience: 'public',         defaultPath: '/' },
  discover: { id: 'discover', labelEn: 'Discover', labelRu: 'Открыть',     audience: 'public',         defaultPath: '/discover' },
  operate:  { id: 'operate',  labelEn: 'Operate',  labelRu: 'Управление',  audience: 'workspace',      defaultPath: '/mc' },
  wallet:   { id: 'wallet',   labelEn: 'Wallet',   labelRu: 'Кошелёк',     audience: 'authenticated',  defaultPath: '/wallet' },
  me:       { id: 'me',       labelEn: 'Me',       labelRu: 'Я',           audience: 'authenticated',  defaultPath: '/me' },
  admin:    { id: 'admin',    labelEn: 'Admin',    labelRu: 'Админ',       audience: 'admin',          defaultPath: '/admin' },
};

export function isCanvasId(value: string | null | undefined): value is CanvasId {
  if (!value) return false;
  return (CANVAS_IDS as readonly string[]).includes(value);
}

// ─────────────────────────────────────────────────────────────
// Path → Canvas classification
//
// First-match-wins ordered rules. Routes are not exhaustive — anything
// unmatched falls through to `home`, which is the safe default for the
// public consumer shell.
//
// When you add a new top-level shell (per CLAUDE.md §1.5 you should not,
// but if you must), extend the rule list here so analytics/CSS targeting
// stays accurate.
// ─────────────────────────────────────────────────────────────

interface CanvasRule {
  prefixes: readonly string[];
  canvas: CanvasId;
}

const CANVAS_RULES: readonly CanvasRule[] = [
  { canvas: 'admin',    prefixes: ['/admin'] },
  {
    canvas: 'operate',
    prefixes: [
      '/mc',
      '/owner',
      '/owner-portal',
      '/vendor',
      '/staff',
      '/team',
      '/capital',
      '/developer-portal',
    ],
  },
  { canvas: 'wallet',   prefixes: ['/wallet', '/cart', '/checkout', '/orders'] },
  {
    canvas: 'me',
    prefixes: ['/me', '/profile', '/account', '/notifications', '/favorites', '/auth'],
  },
  {
    canvas: 'discover',
    prefixes: ['/discover', '/navigator', '/cluster', '/catalog', '/categories', '/search'],
  },
  { canvas: 'home',     prefixes: ['/'] },
];

/**
 * Classify a URL pathname into one of the 6 canonical canvases. Pure —
 * safe to call outside React. Uses ordered prefix matching: `/admin/*`
 * resolves to `admin`, `/mc/*` (and legacy `/owner/*`) to `operate`, etc.
 * Unknown paths fall through to `home`.
 */
export function canvasFromPath(pathname: string): CanvasId {
  for (const rule of CANVAS_RULES) {
    for (const prefix of rule.prefixes) {
      if (prefix === '/') {
        if (pathname === '/') return rule.canvas;
        continue;
      }
      if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
        return rule.canvas;
      }
    }
  }
  return 'home';
}
