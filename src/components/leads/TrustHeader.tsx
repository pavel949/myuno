import React from 'react';
import { ShieldCheck, Lock, Clock } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface TrustHeaderProps {
  className?: string;
  variant?: 'compact' | 'full';
}

export function TrustHeader({ className, variant = 'compact' }: TrustHeaderProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const badges = [
    { 
      icon: <ShieldCheck className="w-3.5 h-3.5" />, 
      label: isRu ? 'Проверено' : 'Verified',
    },
    { 
      icon: <Lock className="w-3.5 h-3.5" />, 
      label: isRu ? 'Защита данных' : 'Data Protection',
    },
    { 
      icon: <Clock className="w-3.5 h-3.5" />, 
      label: isRu ? 'Ответ 24ч' : '24h Response',
    },
  ];

  if (variant === 'full') {
    return (
      <div className={cn(
        "flex flex-wrap gap-3 p-3 rounded-xl bg-primary/5 border border-primary/10",
        className
      )}>
        {badges.map((badge, index) => (
          <div
            key={index}
            className="flex items-center gap-1.5 text-xs text-primary"
          >
            {badge.icon}
            <span className="font-medium">{badge.label}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={cn(
      "flex items-center justify-center gap-3 py-2 text-[10px] text-muted-foreground",
      className
    )}>
      {badges.map((badge, index) => (
        <React.Fragment key={index}>
          <span className="flex items-center gap-1">
            {badge.icon}
            {badge.label}
          </span>
          {index < badges.length - 1 && (
            <span className="text-border">•</span>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}
