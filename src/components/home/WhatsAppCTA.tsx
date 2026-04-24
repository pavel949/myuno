/**
 * WhatsAppCTA — high-contrast white text on green gradient.
 */
import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { MessageCircle, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const WHATSAPP_NUMBER = '+66612345678';
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER.replace(/[^0-9]/g, '')}?text=${encodeURIComponent('Hi, I need help with services in Phuket')}`;

export function WhatsAppCTA({ className }: { className?: string }) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  return (
    <section
      className={cn(
        'relative rounded-none overflow-hidden',
        className
      )}
      aria-labelledby="whatsapp-cta-title"
    >
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary-hover)) 100%)' }}
        aria-hidden
      />

      <div className="relative px-4 py-6 md:px-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <div
              className="w-10 h-10 rounded-none flex items-center justify-center shrink-0"
              style={{ background: 'rgba(255,255,255,0.18)' }}
              aria-hidden
            >
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h3
                id="whatsapp-cta-title"
                className="text-lg font-bold font-display leading-tight text-white"
              >
                {isRu ? 'Нужна помощь.' : 'Need a hand.'}
              </h3>
              <p className="text-xs text-white/80">
                {isRu ? 'Отвечаем за 5 минут' : 'We reply in 5 minutes'}
              </p>
            </div>
          </div>
          <p className="text-sm leading-relaxed text-white/90">
            {isRu
              ? 'Персональный менеджер поможет с арендой, трансфером, экскурсиями — чем угодно на Пхукете.'
              : 'Personal concierge helps with rentals, transfers, tours — anything in Phuket.'}
          </p>
        </div>

        <a
          href={WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={isRu ? 'Написать в WhatsApp' : 'Open WhatsApp chat'}
          className="flex items-center gap-2 px-5 py-3 rounded-[var(--radius-full)] font-bold text-sm shadow-lg hover:shadow-xl transition-all shrink-0 min-h-[44px] bg-white text-[hsl(var(--primary-hover))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[hsl(var(--primary))]"
        >
          <span className="relative">
            <MessageCircle className="w-4 h-4" aria-hidden />
            <span className="wa-dot absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[hsl(var(--primary))]" aria-hidden />
          </span>
          WhatsApp
          <ArrowRight className="w-3.5 h-3.5" aria-hidden />
        </a>
      </div>
    </section>
  );
}
