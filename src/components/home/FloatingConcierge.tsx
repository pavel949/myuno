import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

/**
 * FloatingConcierge — always-available help, never in the way.
 * Sits above AdaptiveBottomNav (bottom nav ≈ 72px, we offset 88px).
 */
export function FloatingConcierge() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';

  return (
    <button
      onClick={() => navigate('/discover?ai=1')}
      aria-label={isRu ? 'Справочная служба' : 'Help desk'}
      className="fixed right-4 bottom-[88px] z-40 h-12 pl-3 pr-4 rounded-full bg-foreground text-background shadow-lg flex items-center gap-2 active:scale-95 transition-transform"
    >
      <MessageCircle className="w-4 h-4" />
      <span className="text-[12.5px] font-semibold">
        {isRu ? 'Справочная' : 'Help'}
      </span>
    </button>
  );
}
