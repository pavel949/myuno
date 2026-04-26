/**
 * AudienceEntries — gov-style "find your door" block on Home.
 *
 * Goal: every visitor recognises themselves in <3 seconds and gets a single,
 * obvious entry point with 2–3 concrete sub-tasks (linked, not decorative).
 *
 * Tone: calm, professional, gosuslugi-like — but commercial. Square corners,
 * 1px border, navy spine, no gradients on cards. Cluster colour appears only
 * as a small icon tile + thin accent under the spine.
 *
 * Order is opinionated: Visiting → Living → Owning → Investing → Business.
 * Five doors covers the persona stack without overwhelming the home page.
 */
import React from 'react';
import { Link } from 'react-router-dom';
import {
  Plane, Home as HomeIcon, Building2, TrendingUp, Briefcase,
  ArrowUpRight,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { SectionHead } from './SectionHead';
import { cn } from '@/lib/utils';

type AudienceId = 'visiting' | 'living' | 'owning' | 'investing' | 'business';

interface SubLink {
  ru: string;
  en: string;
  to: string;
}

interface Audience {
  id: AudienceId;
  icon: LucideIcon;
  /** CSS variable name for the cluster accent (without `var(...)`). */
  accentVar: string;
  titleRu: string;
  titleEn: string;
  taglineRu: string;
  taglineEn: string;
  primary: { ru: string; en: string; to: string };
  links: SubLink[];
}

const AUDIENCES: Audience[] = [
  {
    id: 'visiting',
    icon: Plane,
    accentVar: '--cluster-arrive',
    titleRu: 'Я приехал на Пхукет',
    titleEn: 'I am visiting Phuket',
    taglineRu: 'Прилёт, жильё на короткий срок, экскурсии',
    taglineEn: 'Arrival, short stays, experiences',
    primary: { ru: 'Открыть приезд', en: 'Open arrival', to: '/life/arrival' },
    links: [
      { ru: 'Трансфер из аэропорта', en: 'Airport transfer', to: '/transport/airport-transfer' },
      { ru: 'SIM-карта', en: 'SIM card', to: '/sim' },
      { ru: 'Жильё на короткий срок', en: 'Short-term stays', to: '/property/rent/short-term' },
    ],
  },
  {
    id: 'living',
    icon: HomeIcon,
    accentVar: '--cluster-live',
    titleRu: 'Я живу на Пхукете',
    titleEn: 'I live in Phuket',
    taglineRu: 'Виза, ежедневные сервисы, медицина, школы',
    taglineEn: 'Visa, daily services, healthcare, schools',
    primary: { ru: 'Сервисы для жизни', en: 'Daily services', to: '/discover' },
    links: [
      { ru: 'Виза и документы', en: 'Visa & documents', to: '/legal' },
      { ru: 'Жильё на длительный срок', en: 'Long-term housing', to: '/property/rent/long-term' },
      { ru: 'Медицина', en: 'Healthcare', to: '/medical' },
    ],
  },
  {
    id: 'owning',
    icon: Building2,
    accentVar: '--cluster-manage',
    titleRu: 'У меня есть недвижимость',
    titleEn: 'I own property here',
    taglineRu: 'Управление, аренда, отчётность, обслуживание',
    taglineEn: 'Management, rentals, reporting, maintenance',
    primary: { ru: 'Кабинет собственника', en: 'Owner workspace', to: '/mc' },
    links: [
      { ru: 'Мой объект', en: 'My property', to: '/my-property' },
      { ru: 'Бронирования', en: 'Bookings', to: '/mc/bookings' },
      { ru: 'Финансы', en: 'Finance', to: '/mc/finance' },
    ],
  },
  {
    id: 'investing',
    icon: TrendingUp,
    accentVar: '--cluster-invest',
    titleRu: 'Я инвестирую',
    titleEn: 'I am investing',
    taglineRu: 'Новостройки, перепродажа, сделки и pipeline',
    taglineEn: 'New builds, resale, deals & pipeline',
    primary: { ru: 'Открыть инвестиции', en: 'Open invest', to: '/invest' },
    links: [
      { ru: 'Новостройки', en: 'New developments', to: '/newbuilds' },
      { ru: 'Перепродажа', en: 'Resale', to: '/property/resale' },
      { ru: 'ClearView рейтинги', en: 'ClearView ratings', to: '/clearview' },
    ],
  },
  {
    id: 'business',
    icon: Briefcase,
    accentVar: '--cluster-build',
    titleRu: 'У меня бизнес или сервис',
    titleEn: 'I run a business or service',
    taglineRu: 'Регистрация, листинг, бронирования и выплаты',
    taglineEn: 'Registration, listings, bookings & payouts',
    primary: { ru: 'Кабинет поставщика', en: 'Vendor workspace', to: '/vendor' },
    links: [
      { ru: 'Стать партнёром', en: 'Become a partner', to: '/list-with-us' },
      { ru: 'Юр. оформление', en: 'Legal setup', to: '/stay-legal' },
      { ru: 'Решения для бизнеса', en: 'Business solutions', to: '/for-local-services' },
    ],
  },
];

export function AudienceEntries() {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  return (
    <section className="px-4 pb-6" aria-label={isRu ? 'Найдите свой раздел' : 'Find your section'}>
      <SectionHead
        title={isRu ? 'Найдите свой раздел' : 'Find your section'}
        meta={isRu ? 'Выберите, кто вы — и получите свою дверь' : 'Pick your situation — get your door'}
      />

      <ul className="flex flex-col gap-2">
        {AUDIENCES.map((a) => {
          const Icon = a.icon;
          const title = isRu ? a.titleRu : a.titleEn;
          const tagline = isRu ? a.taglineRu : a.taglineEn;
          const primaryLabel = isRu ? a.primary.ru : a.primary.en;
          return (
            <li key={a.id}>
              <article
                className={cn(
                  'group relative bg-card border border-border rounded-none overflow-hidden',
                  'transition-colors hover:border-primary/40',
                )}
              >
                {/* Navy spine — anchors the card to the brand band */}
                <div className="absolute inset-y-0 left-0 w-[3px] bg-primary" aria-hidden />
                {/* Cluster accent — thin hairline next to the spine */}
                <div
                  className="absolute inset-y-[10px] left-[3px] w-[2px] opacity-80"
                  style={{ background: `hsl(var(${a.accentVar}))` }}
                  aria-hidden
                />

                <div className="pl-[18px] pr-3.5 pt-3.5 pb-3 flex items-start gap-3">
                  {/* Icon tile in cluster accent */}
                  <div
                    className="w-10 h-10 flex items-center justify-center shrink-0"
                    style={{
                      background: `hsl(var(${a.accentVar}) / 0.12)`,
                      color: `hsl(var(${a.accentVar}))`,
                    }}
                    aria-hidden
                  >
                    <Icon className="w-5 h-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Audience label — gov-style uppercase eyebrow */}
                    <div className="text-[10px] tracking-[0.12em] uppercase text-muted-foreground/60 font-semibold">
                      {isRu ? 'Для вас, если' : 'For you, if'}
                    </div>
                    <h3 className="font-display text-[15.5px] font-semibold text-foreground mt-0.5 tracking-[-0.01em] group-hover:text-primary transition-colors">
                      {title}
                    </h3>
                    <p className="text-[12px] text-muted-foreground mt-0.5 leading-snug">
                      {tagline}
                    </p>
                  </div>
                </div>

                {/* Sub-links — concrete, real routes; this is the proof the
                    door actually opens. Each row is its own tap target. */}
                <ul className="pl-[18px] pr-2 pb-2 divide-y divide-border/60 border-t border-border/60 mt-1">
                  {a.links.map((l) => (
                    <li key={l.to}>
                      <Link
                        to={l.to}
                        className="flex items-center justify-between gap-3 py-2.5 px-1.5 -mx-1.5 text-[13px] text-foreground hover:bg-primary/[0.04] hover:text-primary transition-colors group/link"
                      >
                        <span className="truncate">{isRu ? l.ru : l.en}</span>
                        <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground/50 group-hover/link:text-primary transition-colors shrink-0" />
                      </Link>
                    </li>
                  ))}
                </ul>

                {/* Primary CTA — full-width strip, navy on hover. Uses Link
                    not a button so middle-click / share works as expected. */}
                <Link
                  to={a.primary.to}
                  className={cn(
                    'flex items-center justify-between gap-3 px-[18px] py-3',
                    'bg-muted/40 border-t border-border text-[13px] font-semibold text-foreground',
                    'hover:bg-primary hover:text-primary-foreground transition-colors',
                  )}
                >
                  <span>{primaryLabel}</span>
                  <ArrowUpRight className="w-4 h-4" />
                </Link>
              </article>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
