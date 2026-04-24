import { useLoyalty, LoyaltyTier } from "@/hooks/useLoyalty";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Compass, 
  Map, 
  Globe, 
  Crown, 
  ChevronRight,
  Sparkles,
  Gift
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getCurrencySymbol } from '@/lib/config/currencies';

const tierIcons: Record<string, React.ReactNode> = {
  compass: <Compass className="h-5 w-5" />,
  map: <Map className="h-5 w-5" />,
  globe: <Globe className="h-5 w-5" />,
  crown: <Crown className="h-5 w-5" />,
};

const tierColors: Record<string, { bg: string; text: string; border: string; progress: string }> = {
  gray: { 
    bg: "bg-muted/50", 
    text: "text-muted-foreground", 
    border: "border-muted",
    progress: "bg-muted-foreground"
  },
  blue: { 
    bg: "bg-primary/10", 
    text: "text-primary", 
    border: "border-primary/40",
    progress: "bg-primary"
  },
  purple: { 
    bg: "bg-primary/10", 
    text: "text-primary", 
    border: "border-primary/40",
    progress: "bg-primary"
  },
  amber: { 
    bg: "bg-accent/10", 
    text: "text-accent", 
    border: "border-accent/40",
    progress: "bg-accent"
  },
};

interface TierBadgeProps {
  tier: LoyaltyTier;
  size?: "sm" | "md" | "lg";
}

export const TierBadge = ({ tier, size = "md" }: TierBadgeProps) => {
  const colors = tierColors[tier.color] || tierColors.gray;
  const icon = tierIcons[tier.icon] || <Compass className="h-4 w-4" />;
  
  const sizeClasses = {
    sm: "text-xs px-2 py-0.5 gap-1",
    md: "text-sm px-3 py-1 gap-1.5",
    lg: "text-base px-4 py-2 gap-2",
  };
  
  return (
    <Badge 
      variant="outline" 
      className={cn(
        "font-medium flex items-center",
        colors.bg,
        colors.text,
        colors.border,
        sizeClasses[size]
      )}
    >
      {icon}
      {tier.tier_name}
    </Badge>
  );
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('th-TH', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount) + ' ' + getCurrencySymbol('THB');
};

export const LoyaltyStatusCard = () => {
  const { language } = useLanguage();
  const { 
    currentTier, 
    nextTier, 
    progressToNextTier, 
    amountToNextTier,
    isLoading,
    cashbackPercent,
    data
  } = useLoyalty();

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!currentTier) return null;

  const colors = tierColors[currentTier.color] || tierColors.gray;
  const isMaxTier = !nextTier;

  return (
    <Card className={cn("overflow-hidden border-2", colors.border)}>
      <div className={cn("h-1.5", colors.progress)} />
      
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            {language === 'ru' ? 'Ваш статус' : 'Your Status'}
          </CardTitle>
          <TierBadge tier={currentTier} size="md" />
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Cashback highlight */}
        <div className={cn("rounded-none p-4 flex items-center justify-between", colors.bg)}>
          <div className="flex items-center gap-3">
            <div className={cn("p-2 rounded-full", colors.bg, colors.text)}>
              <Gift className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">
                {language === 'ru' ? 'Ваш кэшбек' : 'Your Cashback'}
              </div>
              <div className={cn("text-2xl font-bold", colors.text)}>
                {cashbackPercent}%
              </div>
            </div>
          </div>
        </div>

        {/* Progress to next tier */}
        {!isMaxTier && nextTier && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {language === 'ru' ? 'До' : 'Until'} {nextTier.tier_name}
              </span>
              <span className="font-medium">
                {formatCurrency(amountToNextTier)}
              </span>
            </div>
            <Progress value={progressToNextTier} className="h-2" />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {language === 'ru' ? 'Потрачено в этом году' : 'Spent this year'}: {formatCurrency(data?.status.gmv_this_year || 0)}
              </span>
              <span>{Math.round(progressToNextTier)}%</span>
            </div>
          </div>
        )}

        {isMaxTier && (
          <div className="text-center py-2">
            <div className={cn("text-sm font-medium", colors.text)}>
              🎉 {language === 'ru' ? 'Вы достигли максимального уровня!' : "You've reached the top tier!"}
            </div>
          </div>
        )}

        {/* Current tier benefits */}
        <div className="space-y-2">
          <div className="text-sm font-medium">
            {language === 'ru' ? 'Ваши привилегии' : 'Your Benefits'}
          </div>
          <ul className="space-y-1">
            {currentTier.benefits.map((benefit, index) => (
              <li key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                <ChevronRight className="h-3 w-3 text-primary" />
                {benefit}
              </li>
            ))}
          </ul>
        </div>

        {/* Next tier preview */}
        {nextTier && (
          <div className="pt-2 border-t">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {language === 'ru' ? 'Следующий уровень' : 'Next Level'}
              </div>
              <TierBadge tier={nextTier} size="sm" />
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              +{nextTier.cashback_percent - cashbackPercent}% {language === 'ru' ? 'кэшбек' : 'cashback'} • {nextTier.benefits[0]}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
