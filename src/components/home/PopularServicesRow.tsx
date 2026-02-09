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

const services: ServiceItem[] = [
  { id: 'yacht', icon: Anchor, labelEn: 'Yachts', labelRu: 'Яхты', path: '/yachts' },
  { id: 'beauty', icon: Scissors, labelEn: 'Beauty', labelRu: 'Красота', path: '/beauty' },
  { id: 'restaurant', icon: UtensilsCrossed, labelEn: 'Restaurants', labelRu: 'Рестораны', path: '/restaurants' },
  { id: 'fitness', icon: Dumbbell, labelEn: 'Fitness', labelRu: 'Фитнес', path: '/fitness' },
  { id: 'flower', icon: Flower2, labelEn: 'Flowers', labelRu: 'Цветы', path: '/flowers' },
  { id: 'water', icon: Waves, labelEn: 'Water Sports', labelRu: 'Водный спорт', path: '/water-activities' },
  { id: 'event', icon: CalendarDays, labelEn: 'Events', labelRu: 'Мероприятия', path: '/events' },
  { id: 'insurance', icon: Shield, labelEn: 'Insurance', labelRu: 'Страхование', path: '/insurance' },
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
                "w-12 h-12 rounded-2xl flex items-center justify-center",
                "bg-muted/50 group-hover:bg-primary/10 transition-colors"
              )}>
                <Icon className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <span className="text-[11px] text-muted-foreground group-hover:text-foreground transition-colors text-center leading-tight">
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
