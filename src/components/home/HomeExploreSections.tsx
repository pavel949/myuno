/**
 * HomeExploreSections — Visual entry points to platform verticals
 * 
 * Mobile: Hero+Grid layout with featured cards
 * Desktop: 3-4 column photo grid
 * Design: warm, calm, rounded corners with gradient overlays
 */
import React, { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Compass, Car, Anchor, Sparkles, Utensils, Stethoscope, Scale, GraduationCap, Flower2, Baby, ChevronRight } from 'lucide-react';
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
  featured?: boolean;
}

const EXPLORE_ITEMS: ExploreItem[] = [
  {
    id: 'experiences', titleEn: 'Things to do', titleRu: 'Чем заняться',
    subtitleEn: 'Tours & activities', subtitleRu: 'Туры и активности',
    path: '/experiences', icon: Compass,
    image: 'https://images.unsplash.com/photo-1537956965359-7573183d1f57?w=800&h=450&fit=crop',
    badgeEn: 'from ฿1,200', badgeRu: 'от ฿1 200',
    featured: true,
  },
  {
    id: 'yachts', titleEn: 'Yachts', titleRu: 'Яхты',
    subtitleEn: 'Day trips & sunset cruises', subtitleRu: 'Дневные и закатные прогулки',
    path: '/yachts', icon: Anchor,
    image: 'https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?w=800&h=450&fit=crop',
    badgeEn: 'from ฿15,000', badgeRu: 'от ฿15 000',
    featured: true,
  },
  {
    id: 'transport', titleEn: 'Transport', titleRu: 'Транспорт',
    subtitleEn: 'Cars, bikes, transfers', subtitleRu: 'Авто, байки, трансферы',
    path: '/transport', icon: Car,
    image: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=600&h=400&fit=crop',
    badgeEn: 'from ฿200/day', badgeRu: 'от ฿200/день',
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
  {
    id: 'childcare', titleEn: 'Childcare', titleRu: 'Няни и дети',
    subtitleEn: 'Babysitters & nannies', subtitleRu: 'Бебиситтеры и няни',
    path: '/babysitters', icon: Baby,
    image: 'https://images.unsplash.com/photo-1587616211892-f743fcca64f9?w=600&h=400&fit=crop',
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
        featured ? "aspect-[16/9]" : "aspect-[4/3]",
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
      {/* Gradient overlay — stronger for readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/5" />
      
      {/* Price badge — primary colored */}
      {badge && (
        <div className="absolute top-3 right-3">
          <span className="px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-bold shadow-lg shadow-primary/25">
            {badge}
          </span>
        </div>
      )}

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-4 flex items-end justify-between">
        <div className="flex items-center gap-2.5">
          <div className={cn(
            "rounded-xl bg-white/25 backdrop-blur-md flex items-center justify-center shrink-0",
            featured ? "w-10 h-10" : "w-8 h-8"
          )}>
            <Icon className={cn("text-white", featured ? "w-5 h-5" : "w-4 h-4")} />
          </div>
          <div className="text-left">
            <h3 className={cn(
              "font-bold text-white leading-tight",
              featured ? "text-base" : "text-sm"
            )}>
              {isRu ? item.titleRu : item.titleEn}
            </h3>
            <p className={cn(
              "text-white/70 mt-0.5 line-clamp-1",
              featured ? "text-xs" : "text-[11px]"
            )}>
              {isRu ? item.subtitleRu : item.subtitleEn}
            </p>
          </div>
        </div>
        {/* Chevron — tap signal */}
        <ChevronRight className={cn(
          "text-white/60 shrink-0 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-white",
          featured ? "w-5 h-5" : "w-4 h-4"
        )} />
      </div>
    </button>
  );
}

function SectionHeader({ title, icon: Icon, actionLabel, onAction }: { title: string; icon?: React.ElementType; actionLabel?: string; onAction?: () => void }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        {Icon && <Icon className="w-5 h-5 text-primary" />}
        <h2 className="text-lg font-bold text-foreground">
          {title}
        </h2>
      </div>
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

  const featuredItems = EXPLORE_ITEMS.filter(i => i.featured);
  const gridItems = EXPLORE_ITEMS.filter(i => !i.featured);

  return (
    <div className="space-y-8 lg:space-y-12">
      {/* Leisure */}
      <section>
        <SectionHeader 
          title={isRu ? 'Отдых и досуг' : 'Leisure & lifestyle'}
          icon={Compass}
          actionLabel={isRu ? 'Все' : 'All'}
          onAction={() => navigate('/discover')}
        />
        
        {/* Mobile: Featured hero cards + 2-col grid */}
        <div className="space-y-3 lg:hidden">
          {featuredItems.map((item) => (
            <ExploreCard key={item.id} item={item} language={language} featured />
          ))}
          <div className="grid grid-cols-2 gap-3">
            {gridItems.map((item) => (
              <ExploreCard key={item.id} item={item} language={language} />
            ))}
          </div>
        </div>
        
        {/* Desktop: uniform grid */}
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
          icon={Sparkles}
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
