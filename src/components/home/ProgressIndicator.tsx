/**
 * ProgressIndicator — "Вы используете 3 из 40+ сервисов"
 * Shows on dashboard to encourage discovery
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Compass } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface ProgressIndicatorProps {
  usedCount?: number;
  totalCount?: number;
  className?: string;
}

export function ProgressIndicator({ usedCount = 3, totalCount = 40, className }: ProgressIndicatorProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const progress = Math.min((usedCount / totalCount) * 100, 100);

  return (
    <div
      className={`rounded-none p-4 ${className || ''}`}
      style={{
        background: 'hsl(var(--card))',
        border: '1px solid hsl(0 0% 100% / 0.07)',
      }}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="w-8 h-8 rounded-none flex items-center justify-center shrink-0"
          style={{ background: 'hsl(var(--primary) / 0.12)' }}
        >
          <Compass className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">
            {isRu
              ? `Вы используете ${usedCount} из ${totalCount}+ сервисов`
              : `You use ${usedCount} of ${totalCount}+ services`}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 rounded-[var(--radius-full)] mb-3 overflow-hidden"
        style={{ background: 'hsl(var(--bg-elevated))' }}
      >
        <div
          className="h-full rounded-[var(--radius-full)] transition-all duration-500"
          style={{ width: `${progress}%`, background: 'hsl(var(--primary))' }}
        />
      </div>

      <Link
        to="/discover"
        className="flex items-center gap-1 text-[13px] text-primary font-semibold hover:text-primary/80 transition-colors"
      >
        {isRu ? 'Открыть навигатор' : 'Open navigator'} <ChevronRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
}
