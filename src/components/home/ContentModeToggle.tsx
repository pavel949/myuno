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
    <motion.div 
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={cn(
        "relative flex p-1.5 rounded-2xl border shadow-lg overflow-hidden",
        "bg-gradient-to-r from-card via-background to-card",
        "border-primary/20",
        className
      )}
    >
      {/* Subtle shimmer effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
        animate={{ x: ['-100%', '100%'] }}
        transition={{ 
          duration: 3, 
          repeat: Infinity, 
          repeatDelay: 2,
          ease: "easeInOut" 
        }}
      />

      {/* Animated background indicator with color based on mode */}
      <motion.div
        className={cn(
          "absolute top-1.5 bottom-1.5 rounded-xl shadow-lg",
          value === 'services' 
            ? "bg-gradient-to-r from-amber-500 to-orange-500" 
            : "bg-gradient-to-r from-emerald-500 to-teal-500"
        )}
        initial={false}
        animate={{
          left: value === 'services' ? '6px' : '50%',
          width: 'calc(50% - 6px)',
        }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      />

      {/* Glow effect behind active button */}
      <motion.div
        className={cn(
          "absolute top-1/2 -translate-y-1/2 w-24 h-24 rounded-full blur-2xl opacity-30",
          value === 'services' 
            ? "bg-amber-500" 
            : "bg-emerald-500"
        )}
        animate={{
          left: value === 'services' ? '10%' : '60%',
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      />

      {/* Services tab */}
      <motion.button
        onClick={() => handleChange('services')}
        whileTap={{ scale: 0.97 }}
        className={cn(
          "relative z-10 flex-1 flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-xl text-sm font-bold transition-all",
          value === 'services' 
            ? "text-white" 
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <motion.div
          animate={value === 'services' ? { 
            rotate: [0, -10, 10, -5, 5, 0],
            scale: [1, 1.1, 1]
          } : {}}
          transition={{ duration: 0.5 }}
        >
          <Briefcase className="w-5 h-5" />
        </motion.div>
        <span className="tracking-wide">{isRu ? 'Услуги' : 'Services'}</span>
      </motion.button>

      {/* Products tab */}
      <motion.button
        onClick={() => handleChange('products')}
        whileTap={{ scale: 0.97 }}
        className={cn(
          "relative z-10 flex-1 flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-xl text-sm font-bold transition-all",
          value === 'products' 
            ? "text-white" 
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        <motion.div
          animate={value === 'products' ? { 
            rotate: [0, -10, 10, -5, 5, 0],
            scale: [1, 1.1, 1]
          } : {}}
          transition={{ duration: 0.5 }}
        >
          <ShoppingBag className="w-5 h-5" />
        </motion.div>
        <span className="tracking-wide">{isRu ? 'Товары' : 'Products'}</span>
      </motion.button>
    </motion.div>
  );
}
