import React, { memo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Sparkles, Wallet } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { triggerRipple } from '@/hooks/useRipple';
import { triggerHaptic } from '@/hooks/useHapticFeedback';
import { playSound } from '@/hooks/useSoundEffects';
import { getFeedbackSettings } from '@/hooks/useFeedbackSettings';

interface ChipData {
  id: string;
  icon: React.ElementType;
  label: string;
  labelRu: string;
  path: string;
  gradient: string;
}

const chips: ChipData[] = [
  {
    id: 'owner',
    icon: Building2,
    label: 'For Owners',
    labelRu: 'Владельцам',
    path: '/owner/landing',
    gradient: 'from-teal-500 to-emerald-600',
  },
  {
    id: 'provider',
    icon: Sparkles,
    label: 'Become Partner',
    labelRu: 'Стать партнёром',
    path: '/provider/onboarding',
    gradient: 'from-amber-500 to-orange-600',
  },
  {
    id: 'wallet',
    icon: Wallet,
    label: 'Wallet',
    labelRu: 'Кошелёк',
    path: '/wallet',
    gradient: 'from-violet-500 to-purple-600',
  },
];

export const QuickAccessChips = memo(function QuickAccessChips() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const handleClick = useCallback((chip: ChipData, e: React.MouseEvent<HTMLButtonElement>) => {
    triggerRipple(e);
    const settings = getFeedbackSettings();
    if (settings.hapticEnabled) triggerHaptic('light');
    if (settings.soundEnabled) playSound('click');
    navigate(chip.path);
  }, [navigate]);

  return (
    <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
      {chips.map((chip) => {
        const Icon = chip.icon;
        const label = isRu ? chip.labelRu : chip.label;
        
        return (
          <button
            key={chip.id}
            onClick={(e) => handleClick(chip, e)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-full",
              "bg-gradient-to-r shadow-md hover:shadow-lg",
              "transition-all active:scale-95 flex-shrink-0",
              chip.gradient
            )}
          >
            <Icon className="w-4 h-4 text-white" />
            <span className="text-sm font-medium text-white whitespace-nowrap">
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
});
