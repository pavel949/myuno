import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Layers, Languages, HeartHandshake, MapPin } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface TrustBadgeProps {
  icon: React.ReactNode;
  label: string;
}

const TrustBadge = ({ icon, label }: TrustBadgeProps) => (
  <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-card text-foreground border border-border shadow-sm text-[10px] font-medium">
    {icon}
    <span>{label}</span>
  </div>
);

export function HeroBanner() {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const badges = [
    {
      icon: <ShieldCheck className="w-3 h-3" />,
      label: isRu ? 'Верифицировано' : 'Verified',
    },
    {
      icon: <Layers className="w-3 h-3" />,
      label: isRu ? 'Всё в одном' : 'All-in-one',
    },
    {
      icon: <Languages className="w-3 h-3" />,
      label: 'RU / EN',
    },
    {
      icon: <HeartHandshake className="w-3 h-3" />,
      label: isRu ? 'Поддержка 24/7' : '24/7 Support',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="w-full flex flex-col items-center justify-center text-center space-y-2 py-2"
    >
      {/* Location indicator */}
      <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground w-full">
        <MapPin className="w-3 h-3 text-primary flex-shrink-0" />
        <span className="font-medium">{isRu ? 'Пхукет, Таиланд' : 'Phuket, Thailand'}</span>
      </div>

      {/* Unified brand logo */}
      <div className="flex items-center justify-center gap-1.5 mb-1 w-full">
        <span className="text-sm font-medium text-muted-foreground">my</span>
        <div className="w-7 h-7 rounded-lg gradient-gold flex items-center justify-center flex-shrink-0">
          <span className="text-xs font-bold text-primary-foreground">U</span>
        </div>
        <span className="text-lg font-display font-bold text-gradient-gold">UNO</span>
      </div>

      {/* Main tagline - Updated */}
      <h1 className="text-lg sm:text-xl font-bold text-foreground w-full px-2">
        {isRu ? 'За рубежом' : 'Abroad'}
      </h1>

      {/* Trust badges - all 4 values */}
      <div className="flex flex-wrap items-center justify-center gap-1.5 w-full px-2">
        {badges.map((badge, index) => (
          <TrustBadge key={index} icon={badge.icon} label={badge.label} />
        ))}
      </div>
    </motion.div>
  );
}
