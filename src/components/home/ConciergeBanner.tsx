import React, { memo } from 'react';
import { MessageCircle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { getWhatsAppUrl } from '@/lib/config/contacts';

/**
 * ConciergeBanner — Calm support block
 * Trust signal: real human responds in 15 minutes
 * No marketing gradients, just reliable presence
 */
export const ConciergeBanner = memo(function ConciergeBanner() {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const whatsappUrl = getWhatsAppUrl(
    isRu ? 'Здравствуйте! Мне нужна помощь' : 'Hello! I need help'
  );

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 px-4 py-3 rounded-xl border border-border/60 bg-card hover:bg-accent/30 transition-colors active:scale-[0.98]"
    >
      <div className="w-9 h-9 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
        <MessageCircle className="w-4.5 h-4.5 text-green-600 dark:text-green-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium text-foreground">
          {isRu ? 'Нужна помощь?' : 'Need help?'}
        </p>
        <p className="text-[11px] text-muted-foreground">
          {isRu ? 'Живой менеджер ответит за 15 мин' : 'A real person will reply in 15 min'}
        </p>
      </div>
      <div className="w-2 h-2 rounded-full bg-green-500 shrink-0 animate-pulse" />
    </a>
  );
});
