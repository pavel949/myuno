import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Layers, Languages, HeartHandshake, MapPin, AlertTriangle, ChevronRight, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { InlineSearch } from '@/components/search/InlineSearch';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface TrustBadgeProps {
  icon: React.ReactNode;
  label: string;
}

const TrustBadge = memo(({ icon, label }: TrustBadgeProps) => (
  <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-card text-foreground border border-border shadow-sm text-[10px] font-medium">
    {icon}
    <span>{label}</span>
  </div>
));

TrustBadge.displayName = 'TrustBadge';

/**
 * HeroBlock - Unified header combining:
 * - Location indicator
 * - Brand identity
 * - Search bar
 * - Safety banner (UNO Alert)
 */
export const HeroBlock = memo(function HeroBlock() {
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
      label: '24/7',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="space-y-4"
    >
      {/* Brand Header */}
      <div className="flex flex-col items-center justify-center text-center space-y-2">
        {/* Location indicator */}
        <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
          <MapPin className="w-3 h-3 text-primary flex-shrink-0" />
          <span className="font-medium">{isRu ? 'Пхукет, Таиланд' : 'Phuket, Thailand'}</span>
        </div>

        {/* Brand logo */}
        <div className="flex items-center justify-center gap-1.5">
          <span className="text-sm font-medium text-muted-foreground">my</span>
          <div className="w-7 h-7 rounded-lg gradient-gold flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-primary-foreground">U</span>
          </div>
          <span className="text-lg font-display font-bold text-gradient-gold">UNO</span>
        </div>

        {/* Main tagline */}
        <h1 className="text-base sm:text-lg font-bold text-foreground px-2">
          {isRu ? 'Экосистема для жизни за рубежом' : 'Ecosystem for life abroad'}
        </h1>

        {/* Trust badges */}
        <div className="flex flex-wrap items-center justify-center gap-1.5">
          {badges.map((badge, index) => (
            <TrustBadge key={index} icon={badge.icon} label={badge.label} />
          ))}
        </div>
      </div>

      {/* Integrated Search */}
      <div data-tour="search">
        <InlineSearch />
      </div>

      {/* Safety Banner (UNO Alert) */}
      <Link to="/sos" className="block">
        <div className={cn(
          "flex items-center gap-3 p-3 rounded-2xl",
          "bg-gradient-to-r from-destructive/10 via-orange-500/10 to-amber-500/10",
          "border border-destructive/20 hover:border-destructive/40",
          "transition-all hover:shadow-md active:scale-[0.98]"
        )}>
          {/* Icon */}
          <div className="p-2.5 rounded-xl bg-destructive/20 flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-destructive" />
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-foreground">
                UNO ALERT
              </span>
              <Badge className="bg-destructive text-destructive-foreground text-[10px] px-1.5 py-0 animate-pulse">
                24/7
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
              <Shield className="w-3 h-3" />
              {isRu ? 'Экстренная помощь и поддержка' : 'Emergency help & support'}
            </p>
          </div>
          
          {/* Arrow */}
          <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
        </div>
      </Link>
    </motion.div>
  );
});
