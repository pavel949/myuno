import React from 'react';
import { motion } from 'framer-motion';
import { Briefcase, ShoppingBag } from 'lucide-react';
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
        "relative flex p-1 bg-muted rounded-xl",
        className
      )}
    >
      {/* Animated background indicator */}
      <motion.div
        className="absolute top-1 bottom-1 rounded-lg bg-background shadow-sm"
        initial={false}
        animate={{
          left: value === 'services' ? '4px' : '50%',
          width: 'calc(50% - 4px)',
        }}
        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
      />

      {/* Services tab */}
      <button
        onClick={() => handleChange('services')}
        className={cn(
          "relative z-10 flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-colors",
          value === 'services' 
            ? "text-foreground" 
            : "text-muted-foreground hover:text-foreground/80"
        )}
      >
        <Briefcase className="w-4 h-4" />
        <span>{isRu ? 'Услуги' : 'Services'}</span>
      </button>

      {/* Products tab */}
      <button
        onClick={() => handleChange('products')}
        className={cn(
          "relative z-10 flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-colors",
          value === 'products' 
            ? "text-foreground" 
            : "text-muted-foreground hover:text-foreground/80"
        )}
      >
        <ShoppingBag className="w-4 h-4" />
        <span>{isRu ? 'Товары' : 'Products'}</span>
      </button>
    </div>
  );
}
