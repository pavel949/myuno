import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '@/contexts/LanguageContext';
import { MapPin } from 'lucide-react';
import heroImage from '@/assets/discover-hero.jpg';

export const DiscoverHero = memo(function DiscoverHero() {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="relative w-full h-[120px] md:h-[160px] rounded-2xl overflow-hidden"
    >
      <motion.img
        src={heroImage}
        alt="Phuket coastline"
        className="w-full h-full object-cover"
        loading="eager"
        initial={{ scale: 1.1 }}
        animate={{ scale: 1 }}
        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/5" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-transparent" />

      {/* Location pill */}
      <div className="absolute top-3 left-3">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/20">
          <MapPin className="w-3 h-3 text-white" />
          <span className="text-[10px] font-medium text-white">Phuket, Thailand</span>
        </div>
      </div>

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-4 md:p-5">
        <h1 className="text-lg md:text-2xl font-extrabold text-white leading-tight tracking-tight">
          {isRu ? 'Ваша жизнь, упрощённая' : 'Your life, simplified'}
        </h1>
        <p className="text-[11px] md:text-sm text-white/70 mt-0.5">
          {isRu ? 'Всё для жизни на Пхукете в одном месте' : 'Everything for life in Phuket, in one place'}
        </p>
      </div>
    </motion.div>
  );
});
