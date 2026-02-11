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
      className="relative w-full h-[220px] md:h-[300px] rounded-3xl overflow-hidden shadow-xl"
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
      {/* Multi-layer gradient for depth */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/5" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-transparent" />

      {/* Location pill */}
      <div className="absolute top-4 left-4">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-md border border-white/20">
          <MapPin className="w-3.5 h-3.5 text-white" />
          <span className="text-[11px] font-medium text-white">Phuket, Thailand</span>
        </div>
      </div>

      {/* Content */}
      <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <h1 className="text-[26px] md:text-4xl font-extrabold text-white leading-[1.1] tracking-tight">
            {isRu ? 'Ваша жизнь,' : 'Your life,'}
            <br />
            <span className="text-white/90">{isRu ? 'упрощённая' : 'simplified'}</span>
          </h1>
          <p className="text-[13px] md:text-base text-white/70 mt-2 max-w-[280px]">
            {isRu ? 'Всё для жизни на Пхукете в одном месте' : 'Everything for life in Phuket, in one place'}
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
});
