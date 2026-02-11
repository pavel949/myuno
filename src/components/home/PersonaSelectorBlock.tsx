import React, { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plane, Users, Building2, TrendingUp, Check, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useUserPersonas, UserPersona } from '@/hooks/useUserPersonas';
import { triggerHaptic } from '@/hooks/useHapticFeedback';
import { cn } from '@/lib/utils';

interface PersonaCardData {
  id: string;
  persona: UserPersona;
  icon: React.ReactNode;
  iconBg: string;
  title: { en: string; ru: string };
  cardGradient: string;
  borderColor: string;
  activeBorderColor: string;
  navigateOnFirstActivation?: string;
}

const MAIN_PERSONAS: PersonaCardData[] = [
  {
    id: 'tourists',
    persona: 'tourist',
    icon: <Plane className="w-4 h-4 text-sky-600" />,
    iconBg: 'bg-gradient-to-br from-sky-500/25 to-blue-500/35',
    title: { en: 'Tourist', ru: 'Турист' },
    cardGradient: 'from-sky-500/10 via-blue-500/5 to-transparent',
    borderColor: 'border-sky-500/30 hover:border-sky-500/50',
    activeBorderColor: 'border-sky-500 ring-sky-500/30',
  },
  {
    id: 'residents',
    persona: 'resident',
    icon: <Users className="w-4 h-4 text-emerald-600" />,
    iconBg: 'bg-gradient-to-br from-emerald-500/25 to-green-500/35',
    title: { en: 'Resident', ru: 'Резидент' },
    cardGradient: 'from-emerald-500/10 via-green-500/5 to-transparent',
    borderColor: 'border-emerald-500/30 hover:border-emerald-500/50',
    activeBorderColor: 'border-emerald-500 ring-emerald-500/30',
  },
  {
    id: 'owners',
    persona: 'property_owner',
    icon: <Building2 className="w-4 h-4 text-amber-600" />,
    iconBg: 'bg-gradient-to-br from-amber-500/25 to-orange-500/35',
    title: { en: 'Owner / MC', ru: 'Владелец / УК' },
    cardGradient: 'from-amber-500/10 via-orange-500/5 to-transparent',
    borderColor: 'border-amber-500/30 hover:border-amber-500/50',
    activeBorderColor: 'border-amber-500 ring-amber-500/30',
    navigateOnFirstActivation: '/owner',
  },
];

const INVESTOR_PERSONA: PersonaCardData = {
  id: 'investors',
  persona: 'investor',
  icon: <TrendingUp className="w-5 h-5 text-purple-600" />,
  iconBg: 'bg-gradient-to-br from-purple-500/25 to-violet-500/35',
  title: { en: 'Investor', ru: 'Инвестор' },
  cardGradient: 'from-purple-500/10 via-violet-500/5 to-transparent',
  borderColor: 'border-purple-500/30 hover:border-purple-500/50',
  activeBorderColor: 'border-purple-500 ring-purple-500/30',
  navigateOnFirstActivation: '/invest',
};

interface SmallPersonaCardProps {
  card: PersonaCardData;
  isActive: boolean;
  isRu: boolean;
  onClick: () => void;
}

// Active indicator component to avoid ref issues with AnimatePresence
const ActiveIndicator = memo(function ActiveIndicator({ size = 'small' }: { size?: 'small' | 'large' }) {
  const sizeClass = size === 'large' 
    ? 'top-2.5 right-2.5 w-5 h-5' 
    : 'top-1.5 right-1.5 w-4 h-4';
  const iconSize = size === 'large' ? 'w-3 h-3' : 'w-2.5 h-2.5';
  
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      className={cn(
        "absolute rounded-full bg-primary flex items-center justify-center",
        sizeClass
      )}
    >
      <Check className={cn(iconSize, "text-primary-foreground")} />
    </motion.div>
  );
});

const SmallPersonaCard = memo(function SmallPersonaCard({ 
  card, 
  isActive, 
  isRu, 
  onClick 
}: SmallPersonaCardProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={cn(
        "relative flex-1 min-w-0 p-2.5 rounded-xl text-center transition-all",
        "bg-gradient-to-br border-2",
        "hover:shadow-md active:scale-[0.98]",
        card.cardGradient,
        isActive ? card.activeBorderColor : card.borderColor,
        isActive && "ring-2 ring-offset-1 ring-offset-background"
      )}
    >
      {/* Active Indicator */}
      <AnimatePresence mode="wait">
        {isActive && <ActiveIndicator key="indicator" size="small" />}
      </AnimatePresence>

      <div className={cn(
        "w-8 h-8 rounded-lg flex items-center justify-center mx-auto mb-1.5",
        card.iconBg
      )}>
        {card.icon}
      </div>
      <div className="font-medium text-xs text-foreground">
        {isRu ? card.title.ru : card.title.en}
      </div>
    </motion.button>
  );
});

export const PersonaSelectorBlock = memo(function PersonaSelectorBlock() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { personas, togglePersona } = useUserPersonas();
  const isRu = language === 'ru';

  const handleClick = (card: PersonaCardData) => {
    triggerHaptic('light');
    const isCurrentlyActive = personas.includes(card.persona);
    togglePersona(card.persona);
    
    if (card.navigateOnFirstActivation && !isCurrentlyActive) {
      navigate(card.navigateOnFirstActivation);
    }
  };

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium text-muted-foreground">
          {isRu ? 'Я здесь как:' : "I'm here as:"}
        </span>
      </div>

      {/* Main personas row */}
      <div className="flex gap-2">
        {MAIN_PERSONAS.map((card) => (
          <SmallPersonaCard
            key={card.id}
            card={card}
            isActive={personas.includes(card.persona)}
            isRu={isRu}
            onClick={() => handleClick(card)}
          />
        ))}
      </div>

      {/* Investor card - full width */}
      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={() => handleClick(INVESTOR_PERSONA)}
        className={cn(
          "relative w-full p-3 rounded-xl text-left transition-all",
          "bg-gradient-to-br border-2",
          "hover:shadow-lg active:scale-[0.99]",
          INVESTOR_PERSONA.cardGradient,
          personas.includes(INVESTOR_PERSONA.persona) 
            ? INVESTOR_PERSONA.activeBorderColor 
            : INVESTOR_PERSONA.borderColor,
          personas.includes(INVESTOR_PERSONA.persona) && "ring-2 ring-offset-1 ring-offset-background"
        )}
      >
        {/* Active Indicator */}
        <AnimatePresence mode="wait">
          {personas.includes(INVESTOR_PERSONA.persona) && <ActiveIndicator key="investor-indicator" size="large" />}
        </AnimatePresence>

        <div className="flex items-center gap-3">
          <div className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
            INVESTOR_PERSONA.iconBg
          )}>
            {INVESTOR_PERSONA.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm text-foreground">
              {isRu ? 'Инвесторам' : 'For Investors'}
            </div>
            <div className="text-xs text-muted-foreground">
              {isRu 
                ? 'Инвестиции с доходностью до 12% ROI' 
                : 'Investments with up to 12% ROI'}
            </div>
          </div>
        </div>
      </motion.button>
    </div>
  );
});
