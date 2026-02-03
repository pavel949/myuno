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
  <div className={cn(
    "flex items-center gap-1.5 px-2.5 py-1 rounded-full",
    "bg-gradient-to-r from-primary/10 to-amber-500/10",
    "border border-primary/20",
    "text-[11px] font-medium text-foreground/90",
    "shadow-sm"
  )}>
    <span className="text-primary">{icon}</span>
    <span>{label}</span>
  </div>
));

TrustBadge.displayName = 'TrustBadge';

interface AudienceCardProps {
  id: string;
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  services: string;
  cardGradient: string;
  borderColor: string;
  onClick: () => void;
}

const AudienceCard = memo(({ icon, iconBg, title, services, cardGradient, borderColor, onClick }: AudienceCardProps) => (
  <motion.button
    whileTap={{ scale: 0.97 }}
    onClick={onClick}
    className={cn(
      "flex-1 min-w-0 p-3 rounded-2xl text-left transition-all",
      "bg-gradient-to-br border",
      "hover:shadow-lg active:scale-[0.98]",
      cardGradient,
      borderColor
    )}
  >
    <div className={cn(
      "w-10 h-10 rounded-xl flex items-center justify-center mb-2",
      iconBg
    )}>
      {icon}
    </div>
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
      iconBg: 'bg-gradient-to-br from-sky-500/25 to-blue-500/35 shadow-lg shadow-sky-500/20',
      title: { en: 'Tourists', ru: 'Туристам' },
      services: { en: 'Tours • Transport • Yachts', ru: 'Туры • Транспорт • Яхты' },
      cardGradient: 'from-sky-500/10 via-blue-500/5 to-transparent',
      borderColor: 'border-sky-500/20 hover:border-sky-500/40',
    },
    {
      id: 'residents',
      icon: <Users className="w-5 h-5 text-emerald-600" />,
      iconBg: 'bg-gradient-to-br from-emerald-500/25 to-green-500/35 shadow-lg shadow-emerald-500/20',
      title: { en: 'Residents', ru: 'Резидентам' },
      services: { en: 'Visas • Medical • Banking', ru: 'Визы • Медицина • Банки' },
      cardGradient: 'from-emerald-500/10 via-green-500/5 to-transparent',
      borderColor: 'border-emerald-500/20 hover:border-emerald-500/40',
    },
    {
      id: 'owners',
      icon: <Building2 className="w-5 h-5 text-amber-600" />,
      iconBg: 'bg-gradient-to-br from-amber-500/25 to-orange-500/35 shadow-lg shadow-amber-500/20',
      title: { en: 'Owners', ru: 'Владельцам' },
      services: { en: 'Property • Cleaning • Legal', ru: 'Недвижимость • Клининг' },
      cardGradient: 'from-amber-500/10 via-orange-500/5 to-transparent',
      borderColor: 'border-amber-500/20 hover:border-amber-500/40',
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
            iconBg={card.iconBg}
            title={isRu ? card.title.ru : card.title.en}
            services={isRu ? card.services.ru : card.services.en}
            cardGradient={card.cardGradient}
            borderColor={card.borderColor}
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
