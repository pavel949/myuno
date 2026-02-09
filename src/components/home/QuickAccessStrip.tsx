import React, { memo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plane, Home, Stethoscope, Compass, Car } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { triggerHaptic } from '@/hooks/useHapticFeedback';
import { playSound } from '@/hooks/useSoundEffects';
import { getFeedbackSettings } from '@/hooks/useFeedbackSettings';

interface StripItem {
  id: string;
  icon: React.ElementType;
  labelEn: string;
  labelRu: string;
  path: string;
}

const items: StripItem[] = [
  { id: 'transfers', icon: Plane, labelEn: 'Transfers', labelRu: 'Трансферы', path: '/transfers' },
  { id: 'property', icon: Home, labelEn: 'Real Estate', labelRu: 'Недвижимость', path: '/properties' },
  { id: 'medical', icon: Stethoscope, labelEn: 'Healthcare', labelRu: 'Медицина', path: '/medical' },
  { id: 'experiences', icon: Compass, labelEn: 'Things To Do', labelRu: 'Чем заняться', path: '/experiences' },
  { id: 'vehicles', icon: Car, labelEn: 'Car Rental', labelRu: 'Аренда авто', path: '/transport' },
];

export const QuickAccessStrip = memo(function QuickAccessStrip() {
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
    <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-4 px-4 snap-x snap-proximity touch-pan-x">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            onClick={() => handleClick(item.path)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-full snap-start",
              "bg-primary/10 hover:bg-primary/20 text-primary",
              "transition-all active:scale-95 flex-shrink-0",
              "border border-primary/15"
            )}
          >
            <Icon className="w-4 h-4" />
            <span className="text-sm font-medium whitespace-nowrap">
              {isRu ? item.labelRu : item.labelEn}
            </span>
          </button>
        );
      })}
    </div>
  );
});
