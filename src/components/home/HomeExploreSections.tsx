/**
 * HomeExploreSections — Contextual entry points to platform verticals
 * Mobile: compact list cards
 * Desktop: Airbnb-style photo cards in 3-4 column grid with price badges
 */
import React, { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { ArrowRight, Compass, Car, Anchor, Sparkles, Utensils, Stethoscope, Scale, GraduationCap, Flower2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ExploreItem {
  id: string;
  titleEn: string;
  titleRu: string;
  subtitleEn: string;
  subtitleRu: string;
  path: string;
  icon: React.ElementType;
  image: string;
  badgeEn?: string;
  badgeRu?: string;
  isTopPick?: boolean;
}

const EXPLORE_ITEMS: ExploreItem[] = [
  {
    id: 'experiences',
    titleEn: 'Things to do',
    titleRu: 'Чем заняться',
    subtitleEn: 'Tours, excursions, activities',
    subtitleRu: 'Туры, экскурсии, активности',
    path: '/experiences',
    icon: Compass,
    image: 'https://images.unsplash.com/photo-1537956965359-7573183d1f57?w=600&h=400&fit=crop',
    badgeEn: 'from ฿1,200',
    badgeRu: 'от ฿1 200',
    isTopPick: true,
  },
  {
    id: 'transport',
    titleEn: 'Car & bike rental',
    titleRu: 'Авто и байки',
    subtitleEn: 'Cars, bikes, transfers',
    subtitleRu: 'Авто, байки, трансферы',
    path: '/transport',
    icon: Car,
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600&h=400&fit=crop',
    badgeEn: 'from ฿200/day',
    badgeRu: 'от ฿200/день',
  },
  {
    id: 'yachts',
    titleEn: 'Yacht charters',
    titleRu: 'Яхты',
    subtitleEn: 'Day trips & sunset cruises',
    subtitleRu: 'Дневные и вечерние прогулки',
    path: '/yachts',
    icon: Anchor,
    image: 'https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?w=600&h=400&fit=crop',
    badgeEn: 'from ฿15,000',
    badgeRu: 'от ฿15 000',
    isTopPick: true,
  },
  {
    id: 'beauty',
    titleEn: 'Beauty & wellness',
    titleRu: 'Красота и SPA',
    subtitleEn: 'Salons, massage, wellness',
    subtitleRu: 'Салоны, массаж, велнес',
    path: '/beauty',
    icon: Sparkles,
    image: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=600&h=400&fit=crop',
    badgeEn: 'from ฿500',
    badgeRu: 'от ฿500',
  },
  {
    id: 'restaurants',
    titleEn: 'Restaurants',
    titleRu: 'Рестораны',
    subtitleEn: 'Best dining in Phuket',
    subtitleRu: 'Лучшие рестораны Пхукета',
    path: '/restaurants',
    icon: Utensils,
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&h=400&fit=crop',
  },
  {
    id: 'flowers',
    titleEn: 'Flower delivery',
    titleRu: 'Доставка цветов',
    subtitleEn: 'Fresh bouquets, same day',
    subtitleRu: 'Свежие букеты, в тот же день',
    path: '/flowers',
    icon: Flower2,
    image: 'https://images.unsplash.com/photo-1487530811176-3780de880c2d?w=600&h=400&fit=crop',
    badgeEn: 'from ฿1,500',
    badgeRu: 'от ฿1 500',
  },
];

const SERVICES_ITEMS: ExploreItem[] = [
  {
    id: 'medical',
    titleEn: 'Healthcare',
    titleRu: 'Медицина',
    subtitleEn: 'Clinics, doctors, pharmacy',
    subtitleRu: 'Клиники, врачи, аптека',
    path: '/medical',
    icon: Stethoscope,
    image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=600&h=400&fit=crop',
  },
  {
    id: 'legal',
    titleEn: 'Legal & visa',
    titleRu: 'Юрист и визы',
    subtitleEn: 'Immigration, contracts, taxes',
    subtitleRu: 'Иммиграция, договоры, налоги',
    path: '/legal',
    icon: Scale,
    image: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&h=400&fit=crop',
  },
  {
    id: 'education',
    titleEn: 'Education',
    titleRu: 'Образование',
    subtitleEn: 'Schools, tutors, courses',
    subtitleRu: 'Школы, репетиторы, курсы',
    path: '/education',
    icon: GraduationCap,
    image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=600&h=400&fit=crop',
  },
];

/** Mobile: compact list card */
function ExploreCardMobile({ item, language }: { item: ExploreItem; language: string }) {
  const navigate = useNavigate();
  const isRu = language === 'ru';
  const Icon = item.icon;

  return (
    <button
      onClick={() => navigate(item.path)}
      className={cn(
        "flex items-center gap-3 p-3 rounded-xl border border-border/60",
        "bg-card hover:border-border hover:shadow-sm",
        "transition-all active:scale-[0.98] text-left w-full",
        "lg:hidden"
      )}
    >
      <div className="w-12 h-12 rounded-xl bg-primary/8 flex items-center justify-center shrink-0">
        <Icon className="w-6 h-6 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground line-clamp-1">
          {isRu ? item.titleRu : item.titleEn}
        </p>
        <p className="text-xs text-muted-foreground line-clamp-1">
          {isRu ? item.subtitleRu : item.subtitleEn}
        </p>
      </div>
      <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
    </button>
  );
}

/** Desktop: Airbnb-style photo card with overlay + badges */
function ExploreCardDesktop({ item, language }: { item: ExploreItem; language: string }) {
  const navigate = useNavigate();
  const isRu = language === 'ru';
  const badge = isRu ? item.badgeRu : item.badgeEn;

  return (
    <button
      onClick={() => navigate(item.path)}
      className={cn(
        "hidden lg:block group relative overflow-hidden rounded-2xl",
        "aspect-[3/2] w-full",
        "hover:shadow-lg hover:scale-[1.02] transition-all duration-300",
        "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      )}
    >
      <img
        src={item.image}
        alt={isRu ? item.titleRu : item.titleEn}
        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
      
      {/* Top badges */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
        {item.isTopPick && (
          <span className="px-2.5 py-1 rounded-full bg-white/90 text-xs font-semibold text-foreground backdrop-blur-sm">
            Top Pick
          </span>
        )}
        {badge && (
          <span className="px-2.5 py-1 rounded-full bg-black/50 text-xs font-medium text-white backdrop-blur-sm ml-auto">
            {badge}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <h3 className="text-lg font-semibold text-white leading-tight">
          {isRu ? item.titleRu : item.titleEn}
        </h3>
        <p className="text-sm text-white/80 mt-0.5">
          {isRu ? item.subtitleRu : item.subtitleEn}
        </p>
      </div>
    </button>
  );
}

export const HomeExploreSections = memo(function HomeExploreSections() {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  return (
    <div className="space-y-6 lg:space-y-10">
      {/* Leisure & Lifestyle */}
      <section className="space-y-3 lg:space-y-4">
        <p className={cn(
          "text-xs font-medium text-muted-foreground uppercase tracking-wide",
          "lg:text-lg lg:font-semibold lg:text-foreground lg:normal-case lg:tracking-normal"
        )}>
          {isRu ? 'Отдых и досуг' : 'Leisure & lifestyle'}
        </p>
        
        <div className="space-y-2 lg:hidden">
          {EXPLORE_ITEMS.map((item) => (
            <ExploreCardMobile key={item.id} item={item} language={language} />
          ))}
        </div>
        
        <div className="hidden lg:grid lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {EXPLORE_ITEMS.map((item) => (
            <ExploreCardDesktop key={item.id} item={item} language={language} />
          ))}
        </div>
      </section>

      {/* Services */}
      <section className="space-y-3 lg:space-y-4">
        <p className={cn(
          "text-xs font-medium text-muted-foreground uppercase tracking-wide",
          "lg:text-lg lg:font-semibold lg:text-foreground lg:normal-case lg:tracking-normal"
        )}>
          {isRu ? 'Услуги' : 'Services'}
        </p>
        
        <div className="space-y-2 lg:hidden">
          {SERVICES_ITEMS.map((item) => (
            <ExploreCardMobile key={item.id} item={item} language={language} />
          ))}
        </div>
        
        <div className="hidden lg:grid lg:grid-cols-3 gap-5">
          {SERVICES_ITEMS.map((item) => (
            <ExploreCardDesktop key={item.id} item={item} language={language} />
          ))}
        </div>
      </section>
    </div>
  );
});

export default HomeExploreSections;
