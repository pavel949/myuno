import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { FLOATING_OFFSET } from '@/lib/nav/floatingStack';

/**
 * FloatingConcierge — always-available help, never in the way.
 * Sits *above* the PWA install row (see floatingStack) so the two FABs do not stack on the same baseline.
 */
export function FloatingConcierge() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';

  return (
    <button
      type="button"
      onClick={() => navigate('/discover?ai=1')}
      aria-label={isRu ? 'Справочная служба' : 'Help desk'}
      className={cn(
        'fixed right-4 h-12 pl-3 pr-4 rounded-full flex items-center gap-2 font-sans text-sm font-semibold',
        'bg-primary text-primary-foreground shadow-lg shadow-primary/30',
        'ring-1 ring-primary/20',
        'active:scale-95 transition-transform hover:bg-primary/90',
        'z-[55]',
        FLOATING_OFFSET.chatAboveStack,
      )}
    >
      <MessageCircle className="w-4 h-4 shrink-0" />
      {isRu ? 'Справочная' : 'Help'}
    </button>
  );
}
