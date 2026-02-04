import React, { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Layers, HeartHandshake, MapPin, AlertTriangle, Shield, Plane, Users, Building2, Check, TrendingUp } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useUserPersonas, UserPersona } from '@/hooks/useUserPersonas';
import { triggerHaptic } from '@/hooks/useHapticFeedback';
import { InlineSearch } from '@/components/search/InlineSearch';
import { cn } from '@/lib/utils';
interface TrustBadgeProps {
  icon: React.ReactNode;
  label: string;
}

const TrustBadge = memo(({ icon, label }: TrustBadgeProps) => (
  <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted/50 border border-border text-[10px] font-medium text-muted-foreground">
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
  activeBorderColor: string;
  isActive: boolean;
  onClick: () => void;
}

const AudienceCard = memo(({ 
  icon, 
  iconBg, 
  title, 
  services, 
  cardGradient, 
  borderColor, 
  activeBorderColor,
  isActive, 
  onClick 
}: AudienceCardProps) => (
  <motion.button
    whileTap={{ scale: 0.97 }}
    onClick={onClick}
    className={cn(
      "relative flex-1 min-w-0 p-3 rounded-2xl text-left transition-all",
      "bg-gradient-to-br border-2",
      "hover:shadow-lg active:scale-[0.98]",
      cardGradient,
      isActive ? activeBorderColor : borderColor,
      isActive && "ring-2 ring-offset-2 ring-offset-background"
    )}
  >
    {/* Active Indicator - shown for all cards */}
    <AnimatePresence>
      {isActive && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center"
        >
          <Check className="w-3 h-3 text-primary-foreground" />
        </motion.div>
      )}
    </AnimatePresence>

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
  const { personas, togglePersona, isToggling } = useUserPersonas();
  const isRu = language === 'ru';

  // Map audience IDs to persona types
  const personaMap: Record<string, UserPersona> = {
    tourists: 'tourist',
    residents: 'resident',
    owners: 'property_owner',
  };

  // Main audience cards (first row)
  const mainAudienceCards = [
    {
      id: 'tourists',
      persona: 'tourist' as UserPersona,
      isToggleable: true,
      icon: <Plane className="w-5 h-5 text-sky-600" />,
      iconBg: 'bg-gradient-to-br from-sky-500/25 to-blue-500/35 shadow-lg shadow-sky-500/20',
      title: { en: 'Tourists', ru: 'Туристам' },
      services: { en: 'Tours • Transport • Yachts', ru: 'Туры • Транспорт • Яхты' },
      cardGradient: 'from-sky-500/10 via-blue-500/5 to-transparent',
      borderColor: 'border-sky-500/30 hover:border-sky-500/50',
      activeBorderColor: 'border-sky-500 ring-sky-500/30',
    },
    {
      id: 'residents',
      persona: 'resident' as UserPersona,
      isToggleable: true,
      icon: <Users className="w-5 h-5 text-emerald-600" />,
      iconBg: 'bg-gradient-to-br from-emerald-500/25 to-green-500/35 shadow-lg shadow-emerald-500/20',
      title: { en: 'Residents', ru: 'Резидентам' },
      services: { en: 'Visas • Medical • Banking', ru: 'Визы • Медицина • Банки' },
      cardGradient: 'from-emerald-500/10 via-green-500/5 to-transparent',
      borderColor: 'border-emerald-500/30 hover:border-emerald-500/50',
      activeBorderColor: 'border-emerald-500 ring-emerald-500/30',
    },
    {
      id: 'owners',
      persona: 'property_owner' as UserPersona,
      isToggleable: true,
      navigateOnFirstActivation: '/owner/landing',
      icon: <Building2 className="w-5 h-5 text-amber-600" />,
      iconBg: 'bg-gradient-to-br from-amber-500/25 to-orange-500/35 shadow-lg shadow-amber-500/20',
      title: { en: 'Owners', ru: 'Владельцам' },
      services: { en: 'List & manage property', ru: 'Управление объектами' },
      cardGradient: 'from-amber-500/10 via-orange-500/5 to-transparent',
      borderColor: 'border-amber-500/30 hover:border-amber-500/50',
      activeBorderColor: 'border-amber-500 ring-amber-500/30',
    },
  ];

  // Investor card (second row, full width)
  const investorCard = {
    id: 'investors',
    persona: 'investor' as UserPersona,
    isToggleable: true,
    navigateOnFirstActivation: '/invest',
    icon: <TrendingUp className="w-5 h-5 text-purple-600" />,
    iconBg: 'bg-gradient-to-br from-purple-500/25 to-violet-500/35 shadow-lg shadow-purple-500/20',
    title: { en: 'Investors', ru: 'Инвесторам' },
    services: { en: 'Real estate & business investments with ROI up to 12%', ru: 'Инвестиции в недвижимость и бизнес с доходностью до 12%' },
    cardGradient: 'from-purple-500/10 via-violet-500/5 to-transparent',
    borderColor: 'border-purple-500/30 hover:border-purple-500/50',
    activeBorderColor: 'border-purple-500 ring-purple-500/30',
  };

  // Compact single-line badges
  const badges = [
    { icon: <ShieldCheck className="w-3 h-3" />, label: isRu ? 'Проверено' : 'Verified' },
    { icon: <Shield className="w-3 h-3" />, label: isRu ? 'Гарантия' : 'Guaranteed' },
    { icon: <HeartHandshake className="w-3 h-3" />, label: '24/7' },
    { icon: <Layers className="w-3 h-3" />, label: isRu ? 'Всё здесь' : 'All-in-one' },
  ];

  const handleAudienceClick = (card: typeof mainAudienceCards[0] | typeof investorCard) => {
    triggerHaptic('light');
    
    const isCurrentlyActive = personas.includes(card.persona);
    
    // Always toggle the persona
    togglePersona(card.persona);
    
    // Navigate on first activation (when persona was not active)
    if ('navigateOnFirstActivation' in card && card.navigateOnFirstActivation && !isCurrentlyActive) {
      navigate(card.navigateOnFirstActivation);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="space-y-4"
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
          className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-destructive/10 border border-destructive/30 hover:bg-destructive/20 transition-colors"
        >
          <AlertTriangle className="w-3 h-3 text-destructive" />
          <span className="text-[10px] font-bold text-destructive">SOS</span>
        </Link>
      </div>

      {/* Search - primary action */}
      <div data-tour="search">
        <InlineSearch />
      </div>

      {/* Trust badges - single compact line */}
      <div className="flex items-center justify-center gap-1">
        {badges.map((badge, index) => (
          <TrustBadge key={index} icon={badge.icon} label={badge.label} />
        ))}
      </div>

      {/* Audience Cards - Row 1: Main personas */}
      <div className="flex gap-2">
        {mainAudienceCards.map((card) => (
          <AudienceCard
            key={card.id}
            id={card.id}
            icon={card.icon}
            iconBg={card.iconBg}
            title={isRu ? card.title.ru : card.title.en}
            services={isRu ? card.services.ru : card.services.en}
            cardGradient={card.cardGradient}
            borderColor={card.borderColor}
            activeBorderColor={card.activeBorderColor}
            isActive={personas.includes(card.persona)}
            onClick={() => handleAudienceClick(card)}
          />
        ))}
      </div>

      {/* Audience Cards - Row 2: Investor (full width) */}
      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={() => handleAudienceClick(investorCard)}
        className={cn(
          "relative w-full p-4 rounded-2xl text-left transition-all",
          "bg-gradient-to-br border-2",
          "hover:shadow-lg active:scale-[0.99]",
          investorCard.cardGradient,
          personas.includes(investorCard.persona) ? investorCard.activeBorderColor : investorCard.borderColor,
          personas.includes(investorCard.persona) && "ring-2 ring-offset-2 ring-offset-background"
        )}
      >
        {/* Active Indicator */}
        <AnimatePresence>
          {personas.includes(investorCard.persona) && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="absolute top-3 right-3 w-5 h-5 rounded-full bg-primary flex items-center justify-center"
            >
              <Check className="w-3 h-3 text-primary-foreground" />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center gap-4">
          <div className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0",
            investorCard.iconBg
          )}>
            {investorCard.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-base text-foreground">
              {isRu ? investorCard.title.ru : investorCard.title.en}
            </div>
            <div className="text-sm text-muted-foreground">
              {isRu ? investorCard.services.ru : investorCard.services.en}
            </div>
          </div>
        </div>
      </motion.button>
    </motion.div>
  );
});
