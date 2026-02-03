import React from 'react';
import { motion } from 'framer-motion';
import { Briefcase, ShoppingBag, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { triggerHaptic } from '@/hooks/useHapticFeedback';

export type ContentMode = 'services' | 'products';

interface ContentModeToggleProps {
  value: ContentMode;
  onChange: (mode: ContentMode) => void;
  className?: string;
}

export function ContentModeToggle({ value, onChange, className }: ContentModeToggleProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const handleChange = (mode: ContentMode) => {
    if (mode !== value) {
      triggerHaptic('light');
      onChange(mode);
      localStorage.setItem('myuno-content-mode', mode);
    }
  };

  return (
    <div 
      className={cn(
        "relative flex p-1.5 bg-gradient-to-r from-secondary via-muted to-secondary rounded-2xl border border-border/50 shadow-sm",
        className
      )}
    >
      {/* Animated background indicator with color based on mode */}
      <motion.div
        className={cn(
          "absolute top-1.5 bottom-1.5 rounded-xl shadow-md",
          value === 'services' 
            ? "bg-gradient-to-r from-amber-500 to-orange-500" 
            : "bg-gradient-to-r from-emerald-500 to-teal-500"
        )}
        initial={false}
        animate={{
          left: value === 'services' ? '6px' : '50%',
          width: 'calc(50% - 6px)',
        }}
        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
      />

      {/* Services tab */}
      <button
        onClick={() => handleChange('services')}
        className={cn(
          "relative z-10 flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all",
          value === 'services' 
            ? "text-white" 
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <Briefcase className={cn(
          "w-4 h-4 transition-transform",
          value === 'services' && "animate-pulse"
        )} />
        <span>{isRu ? 'Услуги' : 'Services'}</span>
        {value !== 'services' && (
          <motion.div
            className="absolute -top-1 -right-1"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5 }}
          >
            <Sparkles className="w-3 h-3 text-amber-500 animate-pulse" />
          </motion.div>
        )}
      </button>

      {/* Products tab */}
      <button
        onClick={() => handleChange('products')}
        className={cn(
          "relative z-10 flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold transition-all",
          value === 'products' 
            ? "text-white" 
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <ShoppingBag className={cn(
          "w-4 h-4 transition-transform",
          value === 'products' && "animate-pulse"
        )} />
        <span>{isRu ? 'Товары' : 'Products'}</span>
        {value !== 'products' && (
          <motion.div
            className="absolute -top-1 -right-1"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5 }}
          >
            <Sparkles className="w-3 h-3 text-emerald-500 animate-pulse" />
          </motion.div>
        )}
      </button>
    </div>
  );
}
