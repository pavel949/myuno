import React, { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { TrendingUp, ChevronRight, Building2, Hotel, Briefcase, Star, BarChart3, Users, Anchor, Coins } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { triggerHaptic } from '@/hooks/useHapticFeedback';

export const InvestorPromoCard = memo(function InvestorPromoCard() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const handleClick = () => {
    triggerHaptic('medium');
    navigate('/property/invest');
  };

  const categories = [
    { icon: <Building2 className="w-3.5 h-3.5" />, labelEn: 'Real Estate', labelRu: 'Недвижимость' },
    { icon: <Hotel className="w-3.5 h-3.5" />, labelEn: 'Hotels', labelRu: 'Отели' },
    { icon: <Briefcase className="w-3.5 h-3.5" />, labelEn: 'Business', labelRu: 'Бизнес' },
    { icon: <Anchor className="w-3.5 h-3.5" />, labelEn: 'Boat Charters', labelRu: 'Чартер' },
  ];

  const trustIndicators = [
    { icon: <Star className="w-3 h-3" />, labelEn: 'muUNO Scoring', labelRu: 'muUNO Scoring' },
    { icon: <BarChart3 className="w-3 h-3" />, labelEn: 'Due Diligence', labelRu: 'Due Diligence' },
    { icon: <Coins className="w-3 h-3" />, labelEn: '150+ deals', labelRu: '150+ сделок' },
  ];

  return (
    <>
      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={handleClick}
        className={cn(
          "relative w-full p-4 rounded-2xl text-left transition-all overflow-hidden",
          "bg-gradient-to-br from-primary/10 via-accent/10 to-secondary/10",
          "border-2 border-primary/30 hover:border-primary/50",
          "hover:shadow-lg hover:shadow-primary/10",
          "active:scale-[0.99]"
        )}
      >
        {/* Background decorative elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/10 to-transparent rounded-full blur-2xl" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-accent/10 to-transparent rounded-full blur-xl" />

        <div className="relative flex items-start gap-3">
          {/* Icon */}
          <div className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0",
            "bg-gradient-to-br from-primary to-accent",
            "shadow-lg shadow-primary/30"
          )}>
            <TrendingUp className="w-6 h-6 text-primary-foreground" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 space-y-2">
            {/* Header with badge */}
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-bold text-sm text-foreground">
                {isRu ? 'Инвестиции в Пхукет' : 'Invest in Phuket'}
              </h3>
              <Badge variant="default" className="bg-primary text-primary-foreground text-[10px] px-2 py-0.5 flex-shrink-0">
                {isRu ? 'до 12% ROI' : 'up to 12% ROI'}
              </Badge>
            </div>

            {/* Categories */}
            <div className="flex flex-wrap gap-1.5">
              {categories.map((cat, index) => (
                <span
                  key={index}
                  className={cn(
                    "inline-flex items-center gap-1 px-2 py-0.5 rounded-full",
                    "bg-background/60 border border-border/50",
                    "text-[10px] font-medium text-muted-foreground"
                  )}
                >
                  {cat.icon}
                  {isRu ? cat.labelRu : cat.labelEn}
                </span>
              ))}
            </div>

            {/* Value proposition */}
            <p className="text-xs text-muted-foreground">
              {isRu 
                ? 'Экспертный анализ и доступ к закрытым сделкам'
                : 'Expert analysis and access to exclusive deals'
              }
            </p>

            {/* Trust indicators */}
            <div className="flex flex-wrap gap-x-3 gap-y-1">
              {trustIndicators.map((indicator, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 text-[10px] text-primary"
                >
                  {indicator.icon}
                  {isRu ? indicator.labelRu : indicator.labelEn}
                </span>
              ))}
            </div>
          </div>

          {/* Arrow */}
          <ChevronRight className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
        </div>
      </motion.button>
    </>
  );
});
