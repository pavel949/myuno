/**
 * EmergencyQuickAccess — Compact single-line emergency banner
 */
import React, { memo } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ChevronRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export const EmergencyQuickAccess = memo(function EmergencyQuickAccess() {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  return (
    <Link
      to="/sos"
      className="flex items-center gap-3 px-4 py-3 rounded-xl border border-destructive/20 bg-destructive/5 hover:bg-destructive/10 transition-colors active:scale-[0.98]"
    >
      <div className="w-9 h-9 rounded-full bg-destructive/15 flex items-center justify-center shrink-0">
        <AlertTriangle className="w-4 h-4 text-destructive" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium text-foreground">
          {isRu ? 'Экстренная помощь 24/7' : 'Emergency Help 24/7'}
        </p>
        <p className="text-[11px] text-muted-foreground">
          {isRu ? 'Здоровье, полиция, документы — SOS' : 'Health, police, documents — SOS'}
        </p>
      </div>
      <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
    </Link>
  );
});
