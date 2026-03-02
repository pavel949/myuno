import React, { memo, forwardRef } from 'react';
import { MessageCircle, ChevronRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { getWhatsAppUrl } from '@/lib/config/contacts';

/**
 * ConciergeBanner — Calm support block
 * Trust signal: real human responds in 15 minutes
 */
export const ConciergeBanner = memo(forwardRef<HTMLAnchorElement>(function ConciergeBanner(_props, ref) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const whatsappUrl = getWhatsAppUrl(
    isRu ? 'Здравствуйте! Мне нужна помощь' : 'Hello! I need help'
  );

  return (
    <a
      ref={ref}
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3.5 px-4 py-3.5 rounded-2xl border border-border/50 bg-card shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)] transition-all duration-200 active:scale-[0.98] group"
    >
      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-success/10 border border-success/15">
        <MessageCircle className="w-5 h-5 text-success" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground">
          {isRu ? 'Нужна помощь?' : 'Need help?'}
        </p>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          {isRu ? 'Живой менеджер ответит за 15 мин' : 'A real person will reply in 15 min'}
        </p>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <div className="w-2 h-2 rounded-full animate-pulse bg-success" />
        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
      </div>
    </a>
  );
}));
