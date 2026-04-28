/**
 * PrimaryGrid — упрощённая главная: 4 крупных тайла под активную персону.
 *
 * Показываем максимум 4 действия. Состав зависит от первой активной персоны:
 *  - tourist / nomad / couple / nightlife / active → travel-set
 *  - resident / family / pet_owner / relocation   → live-set
 *  - investor / property_owner / developer         → invest-set
 *  - business / services_provider                  → business-set
 *  - default (нет персоны)                         → universal-set
 *
 * Каждый тайл — крупный (минимум 140×140), большие иконки, 1 строка текста.
 * Никаких счётчиков, бэйджей и подзаголовков. «Меньше = быстрее».
 */
import React from 'react';
import { Link } from 'react-router-dom';
import {
  Home as HomeIcon, Plane, Car, Sparkles,
  Building2, ShoppingBag, FileText, HeartPulse,
  TrendingUp, ScanSearch, Briefcase, Banknote,
  Search, MapPin, Calendar, LifeBuoy,
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
};

const TILES: Record<string, Tile[]> = {
  travel: [
    { to: APP_ROUTES.PROPERTY_RENT_SHORT,  icon: HomeIcon, labelEn: 'Stay',     labelRu: 'Жильё' },
    { to: APP_ROUTES.EVENTS,               icon: Calendar, labelEn: 'Events',   labelRu: 'События' },
    { to: APP_ROUTES.AIRPORT_TRANSFER,     icon: Car,      labelEn: 'Transfer', labelRu: 'Трансфер' },
    { to: APP_ROUTES.SOS,                  icon: LifeBuoy, labelEn: 'Help',     labelRu: 'Помощь' },
  ],
  live: [
    { to: APP_ROUTES.CLEANING,    icon: Sparkles,   labelEn: 'Home',      labelRu: 'Дом' },
    { to: APP_ROUTES.DELIVERY,    icon: ShoppingBag, labelEn: 'Delivery', labelRu: 'Доставка' },
    { to: APP_ROUTES.ME_DOCUMENTS, icon: FileText,  labelEn: 'Documents', labelRu: 'Документы' },
    { to: APP_ROUTES.BEAUTY,      icon: HeartPulse, labelEn: 'Wellness',  labelRu: 'Здоровье' },
  ],
  invest: [
    { to: APP_ROUTES.PROPERTY,      icon: Building2,  labelEn: 'Listings',  labelRu: 'Объекты' },
    { to: '/clearview',             icon: ScanSearch, labelEn: 'ClearView', labelRu: 'ClearView' },
    { to: APP_ROUTES.PROPERTY,      icon: TrendingUp, labelEn: 'Invest',    labelRu: 'Инвест' },
    { to: APP_ROUTES.SUPPORT,       icon: Banknote,   labelEn: 'Capital',   labelRu: 'Капитал' },
  ],
  business: [
    { to: APP_ROUTES.PROPERTY,             icon: Building2, labelEn: 'Property',   labelRu: 'Объекты' },
    { to: APP_ROUTES.FOR_LOCAL_SERVICE_PROVIDERS, icon: Briefcase, labelEn: 'Workspace', labelRu: 'Бизнес' },
    { to: APP_ROUTES.ME_DOCUMENTS,         icon: FileText,  labelEn: 'Documents',  labelRu: 'Документы' },
    { to: APP_ROUTES.SUPPORT,              icon: LifeBuoy,  labelEn: 'Support',    labelRu: 'Поддержка' },
  ],
  universal: [
    { to: APP_ROUTES.SEARCH,               icon: Search,    labelEn: 'Search',    labelRu: 'Найти' },
    { to: APP_ROUTES.MAP,                  icon: MapPin,    labelEn: 'Map',       labelRu: 'Карта' },
    { to: APP_ROUTES.PROPERTY_RENT_SHORT,  icon: HomeIcon,  labelEn: 'Stay',      labelRu: 'Жильё' },
    { to: APP_ROUTES.SOS,                  icon: LifeBuoy,  labelEn: 'Help',      labelRu: 'Помощь' },
  ],
};

function pickSet(persona: UserPersona | undefined): keyof typeof TILES {
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
  const tiles = TILES[setKey];

  return (
    <section className="px-4 mt-4">
      <div className="grid grid-cols-2 gap-3">
        {tiles.map((tile) => {
          const Icon = tile.icon;
          return (
            <Link
              key={tile.to + tile.labelEn}
              to={tile.to}
              className={cn(
                'group relative flex flex-col items-start justify-between',
                'aspect-square rounded-2xl p-4',
                'bg-card border border-border',
                'hover:border-primary/40 hover:bg-primary/5',
                'transition-colors active:scale-[0.98]',
              )}
            >
              <span className="grid w-12 h-12 place-items-center rounded-xl bg-primary/10 text-primary">
                <Icon className="w-6 h-6" strokeWidth={2} />
              </span>
              <span className="text-[15px] font-semibold tracking-tight text-foreground">
                {isRu ? tile.labelRu : tile.labelEn}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
