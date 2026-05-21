/**
 * WelcomePersonaRouter — one entry card per canonical content cluster.
 *
 * Cards mirror the 6 surfaces from `src/lib/catalog/taxonomy.ts` (Arrive,
 * Live, Invest, Manage, Legal, Build) so every canonical role
 * (`src/types/canonical.ts:CANONICAL_ROLE_META.defaultCluster`) lands on a
 * non-empty home. Workspace-audience clusters (Manage, Build) are still
 * surfaced — gating happens downstream by role/persona.
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Plane, Home, TrendingUp, Building2, Scale, HardHat } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { APP_ROUTES } from '@/lib/config/routes';
import { cn } from '@/lib/utils';

/**
 * IDs identifying the 6 Welcome entry cards — one per **content cluster**
 * (see `src/lib/catalog/taxonomy.ts:ClusterId`), not per canonical role.
 * Each canonical role lands on its `defaultCluster` (see `CANONICAL_ROLE_META`
 * in `src/types/canonical.ts`), so cluster-keyed entries cover all 6 roles.
 */
export type WelcomeEntryId = 'arrive' | 'live' | 'invest' | 'manage' | 'legal' | 'build';

/**
 * Deep-link helper: marks traffic from Welcome so downstream surfaces can tune defaults.
 */
export function buildWelcomeNavigatorHref(path: string, entry: WelcomeEntryId): string {
  try {
    const base =
      typeof window !== 'undefined' && window.location?.origin
        ? window.location.origin
        : 'https://myuno.app';
    const url = new URL(path, base);
    url.searchParams.set('from', 'welcome');
    url.searchParams.set('entry', entry);
    return `${url.pathname}${url.search}`;
  } catch {
    const sep = path.includes('?') ? '&' : '?';
    return `${path}${sep}from=welcome&entry=${entry}`;
  }
}

export function WelcomePersonaRouter() {
  const { t } = useLanguage();
  const navigate = useNavigate();

  const cards: {
    id: WelcomeEntryId;
    title: string;
    subline: string;
    hint: string;
    aria: string;
    target: string;
    Icon: typeof Plane;
  }[] = [
    {
      id: 'arrive',
      title: t('welcome.persona.arrive.title'),
      subline: t('welcome.persona.arrive.subline'),
      hint: t('welcome.persona.arrive.hint'),
      aria: t('welcome.persona.arrive.aria'),
      target: buildWelcomeNavigatorHref(APP_ROUTES.ARRIVE_CLUSTER, 'arrive'),
      Icon: Plane,
    },
    {
      id: 'live',
      title: t('welcome.persona.live.title'),
      subline: t('welcome.persona.live.subline'),
      hint: t('welcome.persona.live.hint'),
      aria: t('welcome.persona.live.aria'),
      target: buildWelcomeNavigatorHref(APP_ROUTES.DISCOVER, 'live'),
      Icon: Home,
    },
    {
      id: 'invest',
      title: t('welcome.persona.invest.title'),
      subline: t('welcome.persona.invest.subline'),
      hint: t('welcome.persona.invest.hint'),
      aria: t('welcome.persona.invest.aria'),
      target: buildWelcomeNavigatorHref(APP_ROUTES.INVEST_CLUSTER, 'invest'),
      Icon: TrendingUp,
    },
    {
      id: 'manage',
      title: t('welcome.persona.manage.title'),
      subline: t('welcome.persona.manage.subline'),
      hint: t('welcome.persona.manage.hint'),
      aria: t('welcome.persona.manage.aria'),
      target: buildWelcomeNavigatorHref(APP_ROUTES.FOR_MANAGEMENT_COMPANIES, 'manage'),
      Icon: Building2,
    },
    {
      id: 'legal',
      title: t('welcome.persona.legal.title'),
      subline: t('welcome.persona.legal.subline'),
      hint: t('welcome.persona.legal.hint'),
      aria: t('welcome.persona.legal.aria'),
      target: buildWelcomeNavigatorHref(APP_ROUTES.LEGAL_CLUSTER, 'legal'),
      Icon: Scale,
    },
    {
      id: 'build',
      title: t('welcome.persona.build.title'),
      subline: t('welcome.persona.build.subline'),
      hint: t('welcome.persona.build.hint'),
      aria: t('welcome.persona.build.aria'),
      target: buildWelcomeNavigatorHref(APP_ROUTES.FOR_REAL_ESTATE_DEVELOPERS, 'build'),
      Icon: HardHat,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-px overflow-hidden rounded-none border border-border bg-border/50 sm:grid-cols-2 lg:grid-cols-3">
      {cards.map(({ id, title, subline, hint, aria, target, Icon }) => (
        <button
          key={id}
          type="button"
          aria-label={aria}
          data-testid={`welcome-persona-${id}`}
          onClick={() => navigate(target)}
          className={cn(
            'group bg-background p-6 text-left transition-colors sm:p-7',
            'hover:bg-card/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          )}
        >
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-none border border-border bg-card transition-colors group-hover:border-primary/30">
            <Icon className="h-5 w-5 text-primary" strokeWidth={1.75} aria-hidden />
          </div>
          <h3 className="font-display text-h3 font-normal tracking-tight text-foreground">{title}</h3>
          <p className="mt-2 font-sans text-body-sm leading-relaxed text-muted-foreground">{subline}</p>
          <p className="mt-4 font-sans text-caption font-medium uppercase tracking-wide text-primary">{hint}</p>
          <p className="mt-1 font-sans text-caption text-muted-foreground">
            {t('welcome.persona.tapToContinue')}
          </p>
        </button>
      ))}
    </div>
  );
}
