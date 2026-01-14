import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, 
  Gift, 
  Calendar, 
  Tag, 
  Sparkles, 
  TrendingUp,
  X,
  ChevronRight
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface SmartNotificationCardProps {
  type: 'promo' | 'reminder' | 'recommendation' | 'trending';
  title: string;
  description: string;
  actionLabel?: string;
  actionPath?: string;
  image?: string;
  discount?: number;
  promoCode?: string;
  expiresAt?: string;
  onDismiss?: () => void;
  className?: string;
}

const typeConfig = {
  promo: {
    icon: Gift,
    gradient: 'from-amber-500/20 via-orange-500/10 to-red-500/5',
    borderColor: 'border-amber-500/30',
    iconBg: 'bg-amber-500',
  },
  reminder: {
    icon: Calendar,
    gradient: 'from-blue-500/20 via-cyan-500/10 to-sky-500/5',
    borderColor: 'border-blue-500/30',
    iconBg: 'bg-blue-500',
  },
  recommendation: {
    icon: Sparkles,
    gradient: 'from-purple-500/20 via-pink-500/10 to-rose-500/5',
    borderColor: 'border-purple-500/30',
    iconBg: 'bg-purple-500',
  },
  trending: {
    icon: TrendingUp,
    gradient: 'from-green-500/20 via-emerald-500/10 to-teal-500/5',
    borderColor: 'border-green-500/30',
    iconBg: 'bg-green-500',
  },
};

export function SmartNotificationCard({
  type,
  title,
  description,
  actionLabel,
  actionPath,
  image,
  discount,
  promoCode,
  expiresAt,
  onDismiss,
  className,
}: SmartNotificationCardProps) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const config = typeConfig[type];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border p-4",
        `bg-gradient-to-r ${config.gradient}`,
        config.borderColor,
        className
      )}
    >
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="absolute top-2 right-2 p-1 rounded-full hover:bg-background/50 transition-colors"
        >
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      )}

      <div className="flex gap-4">
        {image ? (
          <img 
            src={image} 
            alt="" 
            className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
          />
        ) : (
          <div className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0",
            config.iconBg
          )}>
            <Icon className="w-6 h-6 text-white" />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2">
            <h3 className="font-semibold text-sm line-clamp-1 flex-1">{title}</h3>
            {discount && (
              <Badge className="bg-destructive text-destructive-foreground text-xs flex-shrink-0">
                -{discount}%
              </Badge>
            )}
          </div>
          
          <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">
            {description}
          </p>

          {promoCode && (
            <div className="flex items-center gap-2 mt-2">
              <Tag className="w-3.5 h-3.5 text-primary" />
              <code className="text-xs font-mono bg-primary/10 text-primary px-2 py-0.5 rounded">
                {promoCode}
              </code>
            </div>
          )}

          {expiresAt && (
            <p className="text-[10px] text-muted-foreground mt-1">
              {t('booking.expires')} {expiresAt}
            </p>
          )}

          {actionLabel && actionPath && (
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-0 mt-2 text-primary hover:text-primary/80"
              onClick={() => navigate(actionPath)}
            >
              {actionLabel}
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
