import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import heroImage from '@/assets/discover-hero.jpg';

export const DiscoverHero = memo(function DiscoverHero() {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 1.02 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="relative w-full h-[200px] md:h-[280px] rounded-2xl overflow-hidden"
    >
      <img
        src={heroImage}
        alt="Phuket coastline"
        className="w-full h-full object-cover"
        loading="eager"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-5 md:p-8">
        <h1 className="text-2xl md:text-3xl font-bold text-white leading-tight">
          {isRu ? 'Ваша жизнь, упрощённая' : 'Your life, simplified'}
        </h1>
        <p className="text-sm md:text-base text-white/80 mt-1">
          {isRu ? 'Всё для жизни на Пхукете в одном месте' : 'Everything for life in Phuket, in one place'}
        </p>
      </div>
    </motion.div>
  );
});
