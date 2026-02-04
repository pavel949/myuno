/**
 * ModerationStatusBanner - Informational banner about moderation process
 * Shown at the end of listing wizards to set proper expectations
 */
import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Clock, CheckCircle2, Shield, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModerationStatusBannerProps {
  variant?: 'info' | 'success' | 'pending';
  className?: string;
  showNotificationHint?: boolean;
}

export function ModerationStatusBanner({ 
  variant = 'info',
  className,
  showNotificationHint = true,
}: ModerationStatusBannerProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const variants = {
    info: {
      icon: Shield,
      bg: 'bg-info/10 border-info/20',
      iconColor: 'text-info',
      title: isRu ? 'Модерация контента' : 'Content Moderation',
      description: isRu 
        ? 'Все новые листинги проходят проверку модератором для обеспечения качества.'
        : 'All new listings are reviewed by a moderator to ensure quality.',
    },
    pending: {
      icon: Clock,
      bg: 'bg-warning/10 border-warning/20',
      iconColor: 'text-warning',
      title: isRu ? 'На модерации' : 'Pending Review',
      description: isRu 
        ? 'Ваш листинг отправлен на проверку. Обычно это занимает до 24 часов.'
        : 'Your listing has been submitted for review. This usually takes up to 24 hours.',
    },
    success: {
      icon: CheckCircle2,
      bg: 'bg-success/10 border-success/20',
      iconColor: 'text-success',
      title: isRu ? 'Опубликовано' : 'Published',
      description: isRu 
        ? 'Ваш листинг опубликован и доступен пользователям.'
        : 'Your listing is published and visible to users.',
    },
  };

  const config = variants[variant];
  const Icon = config.icon;

  return (
    <div className={cn(
      'rounded-xl border p-4',
      config.bg,
      className
    )}>
      <div className="flex gap-3">
        <div className={cn('p-2 rounded-full bg-background/50', config.iconColor)}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <h4 className="font-medium text-sm mb-1">{config.title}</h4>
          <p className="text-sm text-muted-foreground">
            {config.description}
          </p>
          
          {showNotificationHint && variant !== 'success' && (
            <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
              <Bell className="h-3.5 w-3.5" />
              <span>
                {isRu 
                  ? 'Мы уведомим вас, когда статус изменится'
                  : "We'll notify you when the status changes"}
              </span>
            </div>
          )}
        </div>
      </div>
      
      {/* Timeline for pending */}
      {variant === 'pending' && (
        <div className="mt-4 pt-3 border-t border-dashed border-current/10">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-success" />
              <span className="text-muted-foreground">{isRu ? 'Отправлено' : 'Submitted'}</span>
            </div>
            <div className="flex-1 mx-2 border-t border-dashed border-muted-foreground/30" />
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-warning animate-pulse" />
              <span className="text-muted-foreground">{isRu ? 'На проверке' : 'In Review'}</span>
            </div>
            <div className="flex-1 mx-2 border-t border-dashed border-muted-foreground/30" />
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-muted" />
              <span className="text-muted-foreground">{isRu ? 'Публикация' : 'Published'}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
