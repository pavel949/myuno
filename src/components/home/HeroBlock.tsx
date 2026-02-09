import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { MapPin, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { InlineSearch } from '@/components/search/InlineSearch';

/**
 * HeroBlock - Compact header combining:
 * - Location indicator
 * - Brand identity
 * - Search bar
 * - SOS button
 * 
 * Persona selection and trust badges moved to separate components
 */
export const HeroBlock = memo(function HeroBlock() {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="space-y-2.5 lg:space-y-2"
    >
      {/* Compact Header: Location + Brand + SOS */}
      <div className="flex items-center justify-between">
        {/* Left: Location */}
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="w-3 h-3 text-primary" />
          <span className="font-medium">{isRu ? 'Пхукет' : 'Phuket'}</span>
        </div>

        {/* Center: Brand */}
        <div className="flex items-center gap-1">
          <span className="text-xs font-medium text-muted-foreground">my</span>
          <div className="w-6 h-6 rounded-md gradient-gold flex items-center justify-center">
            <span className="text-[10px] font-bold text-primary-foreground">U</span>
          </div>
          <span className="text-base font-display font-bold text-gradient-gold">UNO</span>
        </div>

        {/* Right: SOS Button */}
        <Link 
          to="/sos" 
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-destructive/10 border border-destructive/30 hover:bg-destructive/20 active:bg-destructive/25 transition-colors"
        >
          <AlertTriangle className="w-3 h-3 text-destructive" />
          <span className="text-[10px] font-bold text-destructive">SOS</span>
        </Link>
      </div>

      {/* Main headline — tighter on mobile */}
      <h1 className="text-center lg:text-left text-xl sm:text-2xl lg:text-2xl font-display font-bold text-foreground">
        {isRu ? 'Дом вдали от дома' : 'Home Away From Home'}
      </h1>
      <p className="text-center lg:text-left text-[13px] text-muted-foreground -mt-1.5">
        {isRu ? 'Все решения в одном приложении' : 'All solutions in one app'}
      </p>

      {/* Search - primary action */}
      <div data-tour="search">
        <InlineSearch />
      </div>
    </motion.div>
  );
});
