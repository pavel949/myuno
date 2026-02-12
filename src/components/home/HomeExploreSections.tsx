/**
 * HomeExploreSections — Visual entry points to platform verticals
 * 
 * Mobile: 2-column photo cards with overlaid text
 * Desktop: 3-4 column photo grid
 * Design: warm, calm, rounded corners with gradient overlays
 */
import React, { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Compass, Car, Anchor, Sparkles, Utensils, Stethoscope, Scale, GraduationCap, Flower2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ChevronRight } from 'lucide-react';

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
}

const EXPLORE_ITEMS: ExploreItem[] = [
  {
    id: 'experiences', titleEn: 'Things to do', titleRu: 'Чем заняться',
    subtitleEn: 'Tours & activities', subtitleRu: 'Туры и активности',
    path: '/experiences', icon: Compass,
    image: 'https://images.unsplash.com/photo-1537956965359-7573183d1f57?w=600&h=400&fit=crop',
    badgeEn: 'from ฿1,200', badgeRu: 'от ฿1 200',
  },
  {
    id: 'transport', titleEn: 'Transport', titleRu: 'Транспорт',
    subtitleEn: 'Cars, bikes, transfers', subtitleRu: 'Авто, байки, трансферы',
    path: '/transport', icon: Car,
    image: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=600&h=400&fit=crop',
    badgeEn: 'from ฿200/day', badgeRu: 'от ฿200/день',
  },
  {
    id: 'yachts', titleEn: 'Yachts', titleRu: 'Яхты',
    subtitleEn: 'Day trips & sunset cruises', subtitleRu: 'Дневные и закатные прогулки',
    path: '/yachts', icon: Anchor,
    image: 'https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?w=600&h=400&fit=crop',
    badgeEn: 'from ฿15,000', badgeRu: 'от ฿15 000',
  },
  {
    id: 'beauty', titleEn: 'Beauty & SPA', titleRu: 'Красота и SPA',
    subtitleEn: 'Salons, massage, wellness', subtitleRu: 'Салоны, массаж, велнес',
    path: '/beauty', icon: Sparkles,
    image: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=600&h=400&fit=crop',
    badgeEn: 'from ฿500', badgeRu: 'от ฿500',
  },
  {
    id: 'restaurants', titleEn: 'Restaurants', titleRu: 'Рестораны',
    subtitleEn: 'Best dining in Phuket', subtitleRu: 'Лучшие рестораны',
    path: '/restaurants', icon: Utensils,
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&h=400&fit=crop',
  },
  {
    id: 'flowers', titleEn: 'Flowers', titleRu: 'Цветы',
    subtitleEn: 'Fresh bouquets, same day', subtitleRu: 'Букеты в тот же день',
    path: '/flowers', icon: Flower2,
    image: 'https://images.unsplash.com/photo-1487530811176-3780de880c2d?w=600&h=400&fit=crop',
    badgeEn: 'from ฿1,500', badgeRu: 'от ฿1 500',
  },
];

const SERVICES_ITEMS: ExploreItem[] = [
  {
    id: 'medical', titleEn: 'Healthcare', titleRu: 'Медицина',
    subtitleEn: 'Clinics & doctors', subtitleRu: 'Клиники и врачи',
    path: '/medical', icon: Stethoscope,
    image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=600&h=400&fit=crop',
  },
  {
    id: 'legal', titleEn: 'Legal & Visa', titleRu: 'Юрист и визы',
    subtitleEn: 'Immigration & contracts', subtitleRu: 'Иммиграция, договоры',
    path: '/legal', icon: Scale,
    image: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&h=400&fit=crop',
  },
  {
    id: 'education', titleEn: 'Education', titleRu: 'Образование',
    subtitleEn: 'Schools & courses', subtitleRu: 'Школы и курсы',
    path: '/education', icon: GraduationCap,
    image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=600&h=400&fit=crop',
  },
];

function ExploreCard({ item, language, featured }: { item: ExploreItem; language: string; featured?: boolean }) {
  const navigate = useNavigate();
  const isRu = language === 'ru';
  const badge = isRu ? item.badgeRu : item.badgeEn;
  const Icon = item.icon;

  return (
    <button
      onClick={() => navigate(item.path)}
      className={cn(
        "group relative overflow-hidden rounded-2xl w-full",
        featured ? "aspect-[4/5]" : "aspect-[4/3]",
        "hover:shadow-lg transition-shadow duration-300",
        "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      )}
    >
      <img
        src={item.image}
        alt={isRu ? item.titleRu : item.titleEn}
        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
        loading="lazy"
      />
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
      
      {/* Price badge */}
      {badge && (
        <div className="absolute top-3 right-3">
          <span className="px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-sm text-[11px] font-semibold text-foreground shadow-sm">
            {badge}
          </span>
        </div>
      )}

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-3.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <Icon className="w-3.5 h-3.5 text-white" />
          </div>
          <div className="text-left">
            <h3 className="text-sm lg:text-base font-semibold text-white leading-tight">
              {isRu ? item.titleRu : item.titleEn}
            </h3>
            <p className="text-[11px] text-white/70 mt-0.5 line-clamp-1">
              {isRu ? item.subtitleRu : item.subtitleEn}
            </p>
          </div>
        </div>
      </div>
    </button>
  );
}

function SectionHeader({ title, actionLabel, onAction }: { title: string; actionLabel?: string; onAction?: () => void }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="text-[13px] font-semibold text-muted-foreground uppercase tracking-widest lg:text-lg lg:text-foreground lg:normal-case lg:tracking-normal lg:font-bold">
        {title}
      </h2>
      {actionLabel && onAction && (
        <button onClick={onAction} className="text-xs text-primary font-medium flex items-center gap-0.5 hover:underline">
          {actionLabel}
          <ChevronRight className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}

export const HomeExploreSections = memo(function HomeExploreSections() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const isRu = language === 'ru';

  return (
    <div className="space-y-8 lg:space-y-12">
      {/* Leisure */}
      <section>
        <SectionHeader 
          title={isRu ? 'Отдых и досуг' : 'Leisure & lifestyle'} 
          actionLabel={isRu ? 'Все' : 'All'}
          onAction={() => navigate('/discover')}
        />
        
        {/* Mobile: 2-col grid */}
        <div className="grid grid-cols-2 gap-3 lg:hidden">
          {EXPLORE_ITEMS.map((item) => (
            <ExploreCard key={item.id} item={item} language={language} />
          ))}
        </div>
        
        {/* Desktop: 3-col uniform grid */}
        <div className="hidden lg:grid lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {EXPLORE_ITEMS.map((item) => (
            <ExploreCard key={item.id} item={item} language={language} />
          ))}
        </div>
      </section>

      {/* Services */}
      <section>
        <SectionHeader 
          title={isRu ? 'Услуги' : 'Services'}
          actionLabel={isRu ? 'Все' : 'All'}
          onAction={() => navigate('/discover')}
        />
        
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 lg:gap-5">
          {SERVICES_ITEMS.map((item) => (
            <ExploreCard key={item.id} item={item} language={language} />
          ))}
        </div>
      </section>
    </div>
  );
});

export default HomeExploreSections;
