import React, { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plane, Home, Building2, Check, Sparkles, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { useUserPersonas, UserPersona, PERSONA_INFO } from '@/hooks/useUserPersonas';
import { triggerHaptic } from '@/hooks/useHapticFeedback';
import { Skeleton } from '@/components/ui/skeleton';

interface PersonaChipProps {
  persona: UserPersona;
  isActive: boolean;
  onToggle: () => void;
  isLoading?: boolean;
}

const PERSONA_ICONS: Record<UserPersona, React.ElementType> = {
  tourist: Plane,
  resident: Home,
  property_owner: Building2,
  investor: TrendingUp,
};

const PersonaChip = memo(function PersonaChip({ 
  persona, 
  isActive, 
  onToggle, 
  isLoading 
}: PersonaChipProps) {
  const { language } = useLanguage();
  const info = PERSONA_INFO[persona];
  const Icon = PERSONA_ICONS[persona];
  const label = language === 'ru' ? info.labelRu : info.labelEn;

  return (
    <motion.button
      onClick={() => {
        triggerHaptic('light');
        onToggle();
      }}
      disabled={isLoading}
      className={cn(
        "relative flex items-center gap-2 px-4 py-2.5 rounded-xl",
        "border-2 transition-all duration-200",
        "focus:outline-none focus:ring-2 focus:ring-primary/50",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        "active:scale-[0.98]",
        isActive
          ? "border-primary bg-primary/10 shadow-sm"
          : "border-border bg-card hover:border-primary/50 hover:bg-card/80"
      )}
      whileTap={{ scale: 0.98 }}
    >
      {/* Icon */}
      <div className={cn(
        "w-8 h-8 rounded-lg flex items-center justify-center",
        isActive ? "bg-primary/20" : info.bgColor
      )}>
        <Icon className={cn(
          "w-4 h-4",
          isActive ? "text-primary" : info.color
        )} />
      </div>
      
      {/* Label */}
      <span className={cn(
        "text-sm font-medium",
        isActive ? "text-primary" : "text-foreground"
      )}>
        {label}
      </span>
      
      {/* Check indicator */}
      <AnimatePresence>
        {isActive && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="w-5 h-5 rounded-full bg-primary flex items-center justify-center"
          >
            <Check className="w-3 h-3 text-primary-foreground" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
});

export const PersonaSelector = memo(function PersonaSelector() {
  const { language } = useLanguage();
  const { 
    personas, 
    isLoading, 
    isAuthenticated,
    togglePersona, 
    isToggling 
  } = useUserPersonas();

  // Show for all users - guests use localStorage, authenticated users use DB
  const allPersonas: UserPersona[] = ['tourist', 'resident', 'property_owner'];

  if (isLoading) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide touch-pan-y -mx-4 px-4 pb-1">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-12 w-32 rounded-xl flex-shrink-0" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium text-muted-foreground">
          {language === 'ru' ? 'Кто вы?' : 'Who are you?'}
        </span>
        {personas.length > 0 && (
          <span className="text-xs text-muted-foreground/70">
            ({personas.length} {language === 'ru' ? 'выбрано' : 'selected'})
          </span>
        )}
      </div>
      
      {/* Persona chips */}
      <div 
        className="flex gap-2 overflow-x-auto scrollbar-hide touch-pan-y -mx-4 px-4 pb-1"
        style={{ scrollSnapType: 'x mandatory' }}
      >
        {allPersonas.map((persona) => (
          <div key={persona} style={{ scrollSnapAlign: 'start' }}>
            <PersonaChip
              persona={persona}
              isActive={personas.includes(persona)}
              onToggle={() => togglePersona(persona)}
              isLoading={isToggling}
            />
          </div>
        ))}
      </div>
      
      {/* Hint when no personas selected */}
      <AnimatePresence>
        {personas.length === 0 && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="text-xs text-muted-foreground pl-6"
          >
            {language === 'ru' 
              ? 'Выберите, чтобы получить персональные рекомендации' 
              : 'Select to get personalized recommendations'}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
});
