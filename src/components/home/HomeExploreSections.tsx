/**
 * HomeExploreSections — Contextual entry points to platform verticals
 * Airbnb-style: clean horizontal cards with real photos
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
  },
  {
    id: 'transport',
    titleEn: 'Transport',
    titleRu: 'Транспорт',
    subtitleEn: 'Cars, bikes, transfers',
    subtitleRu: 'Авто, байки, трансферы',
    path: '/transport',
    icon: Car,
  },
  {
    id: 'yachts',
    titleEn: 'Yacht charters',
    titleRu: 'Яхты',
    subtitleEn: 'Day trips & sunset cruises',
    subtitleRu: 'Дневные и вечерние прогулки',
    path: '/yachts',
    icon: Anchor,
  },
  {
    id: 'beauty',
    titleEn: 'Beauty & SPA',
    titleRu: 'Красота и SPA',
    subtitleEn: 'Salons, massage, wellness',
    subtitleRu: 'Салоны, массаж, велнес',
    path: '/beauty',
    icon: Sparkles,
  },
  {
    id: 'restaurants',
    titleEn: 'Restaurants',
    titleRu: 'Рестораны',
    subtitleEn: 'Best dining in Phuket',
    subtitleRu: 'Лучшие рестораны Пхукета',
    path: '/restaurants',
    icon: Utensils,
  },
  {
    id: 'flowers',
    titleEn: 'Flower delivery',
    titleRu: 'Доставка цветов',
    subtitleEn: 'Fresh bouquets, same day',
    subtitleRu: 'Свежие букеты, в тот же день',
    path: '/flowers',
    icon: Flower2,
  },
];

const SERVICES_ITEMS: ExploreItem[] = [
  {
    id: 'medical',
    titleEn: 'Medical',
    titleRu: 'Медицина',
    subtitleEn: 'Clinics, doctors, pharmacy',
    subtitleRu: 'Клиники, врачи, аптека',
    path: '/medical',
    icon: Stethoscope,
  },
  {
    id: 'legal',
    titleEn: 'Legal & Visa',
    titleRu: 'Юрист и визы',
    subtitleEn: 'Immigration, contracts, taxes',
    subtitleRu: 'Иммиграция, договоры, налоги',
    path: '/legal',
    icon: Scale,
  },
  {
    id: 'education',
    titleEn: 'Education',
    titleRu: 'Образование',
    subtitleEn: 'Schools, tutors, courses',
    subtitleRu: 'Школы, репетиторы, курсы',
    path: '/education',
    icon: GraduationCap,
  },
];

function ExploreCard({ item, language }: { item: ExploreItem; language: string }) {
  const navigate = useNavigate();
  const isRu = language === 'ru';
  const Icon = item.icon;

  return (
    <button
      onClick={() => navigate(item.path)}
      className={cn(
        "flex items-center gap-3 p-3 rounded-xl border border-border/60",
        "bg-card hover:border-border hover:shadow-sm",
        "transition-all active:scale-[0.98] text-left w-full"
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

export const HomeExploreSections = memo(function HomeExploreSections() {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  return (
    <div className="space-y-6">
      {/* Leisure & Lifestyle */}
      <section className="space-y-3">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {isRu ? 'Отдых и досуг' : 'Leisure & lifestyle'}
        </p>
        <div className="space-y-2">
          {EXPLORE_ITEMS.map((item) => (
            <ExploreCard key={item.id} item={item} language={language} />
          ))}
        </div>
      </section>

      {/* Services */}
      <section className="space-y-3">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {isRu ? 'Услуги' : 'Services'}
        </p>
        <div className="space-y-2">
          {SERVICES_ITEMS.map((item) => (
            <ExploreCard key={item.id} item={item} language={language} />
          ))}
        </div>
      </section>
    </div>
  );
});

export default HomeExploreSections;
