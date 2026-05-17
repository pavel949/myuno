/**
 * PrimaryGrid — Bento-сетка главной: 1 hero-tile + 3 mini-tiles.
 *
 * Принцип:
 *  - Иерархия через размер и контраст, не через многоцветность.
 *  - Hero (col-span-1, row-span-2) — самый крупный CTA персоны, тёмный navy fill.
 *  - 3 mini — светлые карточки с orange-акцентом на иконках.
 *  - Соблюдаем canon-палитру (navy / orange / cream).
 *
 * Состав тайлов зависит от первой активной персоны (см. pickSet).
 */
import React from 'react';
import { Link } from 'react-router-dom';
import {
  Home as HomeIcon, Plane, Car, Sparkles,
  Building2, ShoppingBag, FileText, HeartPulse,
  TrendingUp, ScanSearch, Briefcase, Banknote,
  Search, MapPin, Calendar, LifeBuoy, ArrowUpRight,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useUserPersonas, type UserPersona } from '@/hooks/useUserPersonas';
import { APP_ROUTES } from '@/lib/config/routes';
import { cn } from '@/lib/utils';

type Tile = {
  to: string;
  icon: LucideIcon;
  labelEn: string;
  labelRu: string;
  hintEn?: string;
  hintRu?: string;
};

type TileSet = {
  hero: Tile;
  mini: [Tile, Tile, Tile];
};

const SETS: Record<string, TileSet> = {
  travel: {
    hero: {
      to: APP_ROUTES.PROPERTY_RENT_SHORT,
      icon: HomeIcon,
      labelEn: 'Find a stay',
      labelRu: 'Найти жильё',
      hintEn: 'Villas · condos · short rent',
      hintRu: 'Виллы · кондо · краткосрочная',
    },
    mini: [
      { to: APP_ROUTES.EVENTS,           icon: Calendar, labelEn: 'Events',   labelRu: 'События' },
      { to: APP_ROUTES.AIRPORT_TRANSFER, icon: Car,      labelEn: 'Transfer', labelRu: 'Трансфер' },
      { to: APP_ROUTES.SOS,              icon: LifeBuoy, labelEn: 'Help',     labelRu: 'Помощь' },
    ],
  },
  live: {
    hero: {
      to: APP_ROUTES.CLEANING,
      icon: Sparkles,
      labelEn: 'Home services',
      labelRu: 'Дом и быт',
      hintEn: 'Cleaning · laundry · repairs',
      hintRu: 'Уборка · стирка · ремонт',
    },
    mini: [
      { to: APP_ROUTES.DELIVERY,     icon: ShoppingBag, labelEn: 'Delivery',  labelRu: 'Доставка' },
      { to: APP_ROUTES.ME_DOCUMENTS, icon: FileText,    labelEn: 'Documents', labelRu: 'Документы' },
      { to: APP_ROUTES.BEAUTY,       icon: HeartPulse,  labelEn: 'Wellness',  labelRu: 'Здоровье' },
    ],
  },
  invest: {
    hero: {
      to: APP_ROUTES.PROPERTY,
      icon: Building2,
      labelEn: 'Investments',
      labelRu: 'Инвестиции',
      hintEn: 'Off-plan · resale · capital',
      hintRu: 'Off-plan · resale · капитал',
    },
    mini: [
      { to: '/clearview',         icon: ScanSearch, labelEn: 'ClearView', labelRu: 'ClearView' },
      { to: APP_ROUTES.PROPERTY,  icon: TrendingUp, labelEn: 'Yield data', labelRu: 'Доходность' },
      { to: APP_ROUTES.SUPPORT,   icon: Banknote,   labelEn: 'Capital',   labelRu: 'Капитал' },
    ],
  },
  business: {
    hero: {
      to: APP_ROUTES.PROPERTY,
      icon: Briefcase,
      labelEn: 'Workspace',
      labelRu: 'Рабочее место',
      hintEn: 'Manage your services',
      hintRu: 'Управляйте своими услугами',
    },
    mini: [
      { to: APP_ROUTES.PROPERTY,             icon: Building2, labelEn: 'Property',  labelRu: 'Объекты' },
      { to: APP_ROUTES.ME_DOCUMENTS,         icon: FileText,  labelEn: 'Docs',      labelRu: 'Документы' },
      { to: APP_ROUTES.SUPPORT,              icon: LifeBuoy,  labelEn: 'Support',   labelRu: 'Поддержка' },
    ],
  },
  universal: {
    hero: {
      to: APP_ROUTES.PROPERTY_RENT_SHORT,
      icon: HomeIcon,
      labelEn: 'Find a stay',
      labelRu: 'Найти жильё',
      hintEn: 'Where will you live in Phuket?',
      hintRu: 'Где будете жить на Пхукете?',
    },
    mini: [
      { to: APP_ROUTES.SEARCH, icon: Search,   labelEn: 'Search', labelRu: 'Поиск' },
      { to: APP_ROUTES.MAP,    icon: MapPin,   labelEn: 'Map',    labelRu: 'Карта' },
      { to: APP_ROUTES.SOS,    icon: LifeBuoy, labelEn: 'Help',   labelRu: 'Помощь' },
    ],
  },
};

function pickSet(persona: UserPersona | undefined): keyof typeof SETS {
  if (!persona) return 'universal';
  if (['tourist', 'nomad', 'couple', 'nightlife', 'active'].includes(persona)) return 'travel';
  if (['resident', 'family', 'pet_owner', 'relocation'].includes(persona)) return 'live';
  if (['investor', 'property_owner', 'real_estate_developer'].includes(persona)) return 'invest';
  if (['business', 'local_services_provider'].includes(persona)) return 'business';
  return 'universal';
}

export function PrimaryGrid() {
  const { language } = useLanguage();
  const { personas } = useUserPersonas();
  const isRu = language === 'ru';

  const setKey = pickSet(personas[0]);
  const { hero, mini } = SETS[setKey];
  const HeroIcon = hero.icon;

  return (
    <section className="px-4 mt-5">
      {/* Section eyebrow */}
      <div className="flex items-baseline justify-between mb-3">
        <h2 className="text-[11px] tracking-[0.14em] uppercase text-muted-foreground/70 font-semibold">
          {isRu ? 'Что сделать сейчас' : 'Do now'}
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {/* HERO TILE — col-span-1, row-span-2 (tall) */}
        <Link
          to={hero.to}
          className={cn(
            'group relative row-span-2 flex flex-col justify-between',
            'rounded-2xl p-5 min-h-[260px] overflow-hidden',
            'bg-primary text-primary-foreground',
            'transition-all hover:shadow-lg active:scale-[0.99]',
          )}
        >
          {/* Decorative orange glow */}
          <div
            aria-hidden
            className="pointer-events-none absolute -right-8 -top-8 w-40 h-40 rounded-full opacity-30"
            style={{
              background:
                'radial-gradient(circle, hsl(var(--brand-orange-400) / 0.7) 0%, transparent 70%)',
            }}
          />
          {/* Subtle grid */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage:
                'linear-gradient(hsl(var(--primary-foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary-foreground)) 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          />

          <div className="relative">
            <span
              className="grid w-12 h-12 place-items-center rounded-xl"
              style={{
                backgroundColor: 'hsl(var(--brand-orange))',
                color: 'hsl(var(--primary-foreground))',
              }}
            >
              <HeroIcon className="w-6 h-6" strokeWidth={2} />
            </span>
          </div>

          <div className="relative">
            <div className="flex items-end justify-between gap-2">
              <h3 className="font-display text-[22px] leading-[1.05] font-semibold tracking-tight text-primary-foreground">
                {isRu ? hero.labelRu : hero.labelEn}
              </h3>
              <ArrowUpRight className="w-5 h-5 text-primary-foreground/70 flex-shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" strokeWidth={2} />
            </div>
            {(hero.hintEn || hero.hintRu) && (
              <p className="text-[12px] text-primary-foreground/65 mt-1.5 leading-snug">
                {isRu ? hero.hintRu : hero.hintEn}
              </p>
            )}
          </div>
        </Link>

        {/* 3 MINI TILES — col-span-1 each, light surface, orange icon accent */}
        {mini.map((tile) => {
          const Icon = tile.icon;
          return (
            <Link
              key={tile.to + tile.labelEn}
              to={tile.to}
              className={cn(
                'group relative flex flex-col justify-between',
                'rounded-2xl p-3.5 min-h-[122px]',
                'bg-card border border-border',
                'transition-all hover:border-primary/30 hover:shadow-md active:scale-[0.98]',
              )}
            >
              <span
                className="grid w-10 h-10 place-items-center rounded-lg"
                style={{
                  backgroundColor: 'hsl(var(--brand-orange) / 0.12)',
                  color: 'hsl(var(--brand-orange))',
                }}
              >
                <Icon className="w-5 h-5" strokeWidth={2} />
              </span>
              <div className="flex items-end justify-between gap-1">
                <span className="text-[14px] font-semibold tracking-tight text-foreground leading-tight">
                  {isRu ? tile.labelRu : tile.labelEn}
                </span>
                <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground/50 flex-shrink-0 transition-all group-hover:text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5" strokeWidth={2.2} />
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
