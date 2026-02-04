import React from 'react';
import { motion } from 'framer-motion';
import { Home, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { triggerHaptic } from '@/hooks/useHapticFeedback';

export type PropertyMode = 'rent' | 'buy';

interface PropertyModeToggleProps {
  value: PropertyMode;
  onChange: (mode: PropertyMode) => void;
  className?: string;
}

export function PropertyModeToggle({ value, onChange, className }: PropertyModeToggleProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const handleChange = (mode: PropertyMode) => {
    if (mode !== value) {
      triggerHaptic('light');
      onChange(mode);
    }
  };

  return (
    <div 
      className={cn(
        "relative flex p-1 bg-muted/50 rounded-xl border border-border/50",
        className
      )}
    >
      {/* Animated background indicator */}
      <motion.div
        className={cn(
          "absolute top-1 bottom-1 rounded-lg shadow-sm",
          value === 'rent' 
            ? "bg-primary" 
            : "bg-gradient-to-r from-amber-500 to-orange-500"
        )}
        initial={false}
        animate={{
          left: value === 'rent' ? '4px' : '50%',
          width: 'calc(50% - 4px)',
        }}
        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
      />

      {/* Rent tab */}
      <button
        onClick={() => handleChange('rent')}
        className={cn(
          "relative z-10 flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-medium transition-colors",
          value === 'rent' 
            ? "text-primary-foreground" 
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <Home className="w-4 h-4" />
        <span>{isRu ? 'Аренда' : 'Rent'}</span>
      </button>

      {/* Buy tab */}
      <button
        onClick={() => handleChange('buy')}
        className={cn(
          "relative z-10 flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-medium transition-colors",
          value === 'buy' 
            ? "text-white" 
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <Building2 className="w-4 h-4" />
        <span>{isRu ? 'Покупка' : 'Buy'}</span>
      </button>
    </div>
  );
}
