import React, { memo } from 'react';
import { Plane, Users, Building2, TrendingUp, Check } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { useUserPersonas, UserPersona } from '@/hooks/useUserPersonas';
import { triggerHaptic } from '@/hooks/useHapticFeedback';
import { cn } from '@/lib/utils';

interface ChipData {
  persona: UserPersona;
  icon: React.ReactNode;
  label: { en: string; ru: string };
  activeColor: string;
  navigateOnFirstActivation?: string;
}

const CHIPS: ChipData[] = [
  {
    persona: 'tourist',
    icon: <Plane className="w-3.5 h-3.5" />,
    label: { en: 'Tourist', ru: 'Турист' },
    activeColor: 'bg-sky-500/15 border-sky-500/50 text-sky-700 dark:text-sky-300',
  },
  {
    persona: 'resident',
    icon: <Users className="w-3.5 h-3.5" />,
    label: { en: 'Resident', ru: 'Резидент' },
    activeColor: 'bg-emerald-500/15 border-emerald-500/50 text-emerald-700 dark:text-emerald-300',
  },
  {
    persona: 'property_owner',
    icon: <Building2 className="w-3.5 h-3.5" />,
    label: { en: 'Owner', ru: 'Владелец' },
    activeColor: 'bg-amber-500/15 border-amber-500/50 text-amber-700 dark:text-amber-300',
    navigateOnFirstActivation: '/owner/landing',
  },
  {
    persona: 'investor',
    icon: <TrendingUp className="w-3.5 h-3.5" />,
    label: { en: 'Investor', ru: 'Инвестор' },
    activeColor: 'bg-purple-500/15 border-purple-500/50 text-purple-700 dark:text-purple-300',
    navigateOnFirstActivation: '/invest',
  },
];

export const PersonaChips = memo(function PersonaChips() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { personas, togglePersona } = useUserPersonas();
  const isRu = language === 'ru';

  const handleClick = (chip: ChipData) => {
    triggerHaptic('light');
    const isCurrentlyActive = personas.includes(chip.persona);
    togglePersona(chip.persona);
    if (chip.navigateOnFirstActivation && !isCurrentlyActive) {
      navigate(chip.navigateOnFirstActivation);
    }
  };

  return (
    <div className="space-y-1.5">
      <span className="text-xs font-medium text-muted-foreground">
        {isRu ? 'Я здесь как:' : "I'm here as:"}
      </span>
      <div className="flex gap-2 flex-wrap">
        {CHIPS.map((chip) => {
          const isActive = personas.includes(chip.persona);
          return (
            <button
              key={chip.persona}
              onClick={() => handleClick(chip)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition-all",
                isActive
                  ? chip.activeColor
                  : "bg-card border-border text-muted-foreground hover:border-primary/30"
              )}
            >
              {chip.icon}
              {isRu ? chip.label.ru : chip.label.en}
              {isActive && <Check className="w-3 h-3" />}
            </button>
          );
        })}
      </div>
    </div>
  );
});
