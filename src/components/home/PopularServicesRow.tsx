import React, { memo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Anchor, Scissors, UtensilsCrossed, Dumbbell, Flower2, Waves, CalendarDays, Shield, ArrowRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { triggerHaptic } from '@/hooks/useHapticFeedback';
import { playSound } from '@/hooks/useSoundEffects';
import { getFeedbackSettings } from '@/hooks/useFeedbackSettings';
import { Button } from '@/components/ui/button';

interface ServiceItem {
  id: string;
  icon: React.ElementType;
  labelEn: string;
  labelRu: string;
  path: string;
}

const services: (ServiceItem & { color: string; bg: string })[] = [
  { id: 'yacht', icon: Anchor, labelEn: 'Yachts', labelRu: 'Яхты', path: '/yachts', color: 'text-sky-600', bg: 'bg-sky-100 dark:bg-sky-900/30' },
  { id: 'beauty', icon: Scissors, labelEn: 'Beauty', labelRu: 'Красота', path: '/beauty', color: 'text-pink-600', bg: 'bg-pink-100 dark:bg-pink-900/30' },
  { id: 'restaurant', icon: UtensilsCrossed, labelEn: 'Restaurants', labelRu: 'Рестораны', path: '/restaurants', color: 'text-orange-600', bg: 'bg-orange-100 dark:bg-orange-900/30' },
  { id: 'fitness', icon: Dumbbell, labelEn: 'Fitness', labelRu: 'Фитнес', path: '/fitness', color: 'text-emerald-600', bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
  { id: 'flower', icon: Flower2, labelEn: 'Flowers', labelRu: 'Цветы', path: '/flowers', color: 'text-rose-600', bg: 'bg-rose-100 dark:bg-rose-900/30' },
  { id: 'water', icon: Waves, labelEn: 'Water Sports', labelRu: 'Водный спорт', path: '/water', color: 'text-cyan-600', bg: 'bg-cyan-100 dark:bg-cyan-900/30' },
  { id: 'event', icon: CalendarDays, labelEn: 'Events', labelRu: 'Мероприятия', path: '/events', color: 'text-violet-600', bg: 'bg-violet-100 dark:bg-violet-900/30' },
  { id: 'insurance', icon: Shield, labelEn: 'Insurance', labelRu: 'Страхование', path: '/insurance', color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-900/30' },
];

export const PopularServicesRow = memo(function PopularServicesRow() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const handleClick = useCallback((path: string) => {
    const settings = getFeedbackSettings();
    if (settings.hapticEnabled) triggerHaptic('light');
    if (settings.soundEnabled) playSound('click');
    navigate(path);
  }, [navigate]);

  return (
    <section>
      <h2 className="text-base font-semibold text-foreground mb-3">
        {isRu ? 'Популярные услуги' : 'Popular Services'}
      </h2>
      <div className="grid grid-cols-4 gap-3">
        {services.map((svc) => {
          const Icon = svc.icon;
          return (
            <button
              key={svc.id}
              onClick={() => handleClick(svc.path)}
              className="flex flex-col items-center gap-1.5 group"
            >
              <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center transition-colors",
                svc.bg
              )}>
                <Icon className={cn("w-5 h-5 transition-colors", svc.color)} />
              </div>
              <span className="text-xs text-foreground/70 group-hover:text-foreground transition-colors text-center leading-tight">
                {isRu ? svc.labelRu : svc.labelEn}
              </span>
            </button>
          );
        })}
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="w-full mt-3 text-muted-foreground"
        onClick={() => navigate('/discover')}
      >
        {isRu ? 'Все услуги' : 'All Services'}
        <ArrowRight className="w-4 h-4 ml-1" />
      </Button>
    </section>
  );
});
