/**
 * HomeExploreSections — Services-only visual entry points
 * Leisure verticals are already covered by QuickActionsGrid
 */
import React, { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Stethoscope, Scale, GraduationCap, Baby, Sparkles, ChevronRight } from 'lucide-react';
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
}

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

function ExploreCard({ item, language }: { item: ExploreItem; language: string }) {
  const navigate = useNavigate();
  const isRu = language === 'ru';
  const Icon = item.icon;

  return (
    <button
      onClick={() => navigate(item.path)}
      className={cn(
        "group relative overflow-hidden rounded-2xl w-full aspect-[4/3]",
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
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/5" />
      
      <div className="absolute bottom-0 left-0 right-0 p-4 flex items-end justify-between">
        <div className="flex items-center gap-2.5">
          <div className="rounded-xl bg-white/25 backdrop-blur-md flex items-center justify-center shrink-0 w-8 h-8">
            <Icon className="text-white w-4 h-4" />
          </div>
          <div className="text-left">
            <h3 className="font-bold text-white text-sm leading-tight">
              {isRu ? item.titleRu : item.titleEn}
            </h3>
            <p className="text-white/70 mt-0.5 line-clamp-1 text-[11px]">
              {isRu ? item.subtitleRu : item.subtitleEn}
            </p>
          </div>
        </div>
        <ChevronRight className="text-white/60 shrink-0 w-4 h-4 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-white" />
      </div>
    </button>
  );
}

export const HomeExploreSections = memo(function HomeExploreSections() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const isRu = language === 'ru';

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-bold text-foreground">
            {isRu ? 'Услуги' : 'Services'}
          </h2>
        </div>
        <button onClick={() => navigate('/discover')} className="text-xs text-primary font-medium flex items-center gap-0.5 hover:underline">
          {isRu ? 'Все' : 'All'}
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>
      
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-5">
        {SERVICES_ITEMS.map((item) => (
          <ExploreCard key={item.id} item={item} language={language} />
        ))}
      </div>
    </section>
  );
});

export default HomeExploreSections;