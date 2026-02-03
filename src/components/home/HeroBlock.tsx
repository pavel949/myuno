import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Layers, Languages, HeartHandshake, MapPin, AlertTriangle, ChevronRight, Shield, Plane, Users, Building2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
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

interface AudienceCardProps {
  id: string;
  icon: React.ReactNode;
  title: string;
  services: string;
  gradient: string;
  onClick: () => void;
}

const AudienceCard = memo(({ icon, title, services, gradient, onClick }: AudienceCardProps) => (
  <motion.button
    whileTap={{ scale: 0.97 }}
    onClick={onClick}
    className={cn(
      "flex-1 min-w-0 p-3 rounded-2xl text-left transition-all",
      "bg-gradient-to-br border border-border/50",
      "hover:shadow-md hover:border-border active:scale-[0.98]",
      gradient
    )}
  >
    <div className="text-xl mb-1">{icon}</div>
    <div className="font-semibold text-sm text-foreground truncate">{title}</div>
    <div className="text-[10px] text-muted-foreground line-clamp-1">{services}</div>
  </motion.button>
));

AudienceCard.displayName = 'AudienceCard';

/**
 * HeroBlock - Unified header combining:
 * - Location indicator
 * - Brand identity
 * - Value proposition headline
 * - Audience cards
 * - Search bar
 * - Safety banner (UNO Alert)
 */
export const HeroBlock = memo(function HeroBlock() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const isRu = language === 'ru';

  const audienceCards = [
    {
      id: 'tourists',
      icon: <Plane className="w-5 h-5 text-sky-600" />,
      title: { en: 'Tourists', ru: 'Туристам' },
      services: { en: 'Tours • Transport • Yachts', ru: 'Туры • Транспорт • Яхты' },
      gradient: 'from-sky-500/15 to-blue-500/10',
    },
    {
      id: 'residents',
      icon: <Users className="w-5 h-5 text-emerald-600" />,
      title: { en: 'Residents', ru: 'Резидентам' },
      services: { en: 'Visas • Medical • Banking', ru: 'Визы • Медицина • Банки' },
      gradient: 'from-emerald-500/15 to-green-500/10',
    },
    {
      id: 'owners',
      icon: <Building2 className="w-5 h-5 text-amber-600" />,
      title: { en: 'Owners', ru: 'Владельцам' },
      services: { en: 'Property • Cleaning • Legal', ru: 'Недвижимость • Клининг' },
      gradient: 'from-amber-500/15 to-orange-500/10',
    },
  ];

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

  const handleAudienceClick = (audienceId: string) => {
    // Save preference for personalization
    localStorage.setItem('uno_audience_preference', audienceId);
    navigate(`/discover?audience=${audienceId}`);
  };

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

        {/* Main headline */}
        <div className="space-y-1 px-2">
          <h1 className="text-base sm:text-lg font-bold text-gradient-gold uppercase tracking-wide">
            {isRu ? 'Единственное приложение для жизни за рубежом' : 'The only app you need abroad'}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {isRu ? 'Все решения в одном месте' : 'All solutions in one place'}
          </p>
        </div>
      </div>

      {/* Audience Cards */}
      <div className="flex gap-2">
        {audienceCards.map((card) => (
          <AudienceCard
            key={card.id}
            id={card.id}
            icon={card.icon}
            title={isRu ? card.title.ru : card.title.en}
            services={isRu ? card.services.ru : card.services.en}
            gradient={card.gradient}
            onClick={() => handleAudienceClick(card.id)}
          />
        ))}
      </div>

      {/* Trust badges */}
      <div className="flex flex-wrap items-center justify-center gap-1.5">
        {badges.map((badge, index) => (
          <TrustBadge key={index} icon={badge.icon} label={badge.label} />
        ))}
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
