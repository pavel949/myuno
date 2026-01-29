import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Users, Globe } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface TrustBadgeProps {
  icon: React.ReactNode;
  label: string;
}

const TrustBadge = ({ icon, label }: TrustBadgeProps) => (
  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
    {icon}
    <span>{label}</span>
  </div>
);

export function HeroBanner() {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const badges = [
    {
      icon: <ShieldCheck className="w-3.5 h-3.5" />,
      label: isRu ? 'G-Trust Партнёры' : 'G-Trust Partners',
    },
    {
      icon: <Users className="w-3.5 h-3.5" />,
      label: isRu ? 'Команда 24/7' : '24/7 Team',
    },
    {
      icon: <Globe className="w-3.5 h-3.5" />,
      label: 'RU + EN',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="text-center space-y-3 py-3"
    >
      {/* Main tagline */}
      <h1 className="text-xl sm:text-2xl font-bold text-foreground">
        {isRu ? 'Дом там, где myUNO' : 'Home is where myUNO is'}
      </h1>

      {/* Positioning statement */}
      <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
        {isRu
          ? 'Верифицированная инфраструктура для комфортной жизни за рубежом'
          : 'Verified infrastructure for comfortable life abroad'}
      </p>

      {/* Trust badges */}
      <div className="flex flex-wrap justify-center gap-2 pt-1">
        {badges.map((badge, index) => (
          <TrustBadge key={index} icon={badge.icon} label={badge.label} />
        ))}
      </div>
    </motion.div>
  );
}
