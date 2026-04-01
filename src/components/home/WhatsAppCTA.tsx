/**
 * WhatsAppCTA — with wa-dot pulse animation
 */
import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { MessageCircle, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { useSectionReveal } from '@/hooks/useScrollBehavior';

const WHATSAPP_NUMBER = '+66612345678';
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER.replace(/[^0-9]/g, '')}?text=${encodeURIComponent('Hi! I need help with services in Phuket')}`;

export function WhatsAppCTA({ className }: { className?: string }) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const sectionRef = useSectionReveal<HTMLElement>();

  return (
    <section
      ref={sectionRef}
      className={cn(
        "section-reveal relative rounded-[var(--radius-lg)] overflow-hidden",
        className
      )}
    >
      <div className="absolute inset-0" style={{
        background: 'linear-gradient(135deg, #00D68F 0%, #00A67A 100%)'
      }} />

      <div className="relative px-4 py-6 md:px-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-10 h-10 rounded-[var(--radius-sm)] flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.2)' }}
            >
              <MessageCircle className="w-5 h-5" style={{ color: 'hsl(var(--primary-foreground))' }} />
            </div>
            <div>
              <h3 className="text-lg font-bold font-display leading-tight" style={{ color: 'hsl(var(--primary-foreground))' }}>
                {isRu ? 'Нужна помощь?' : 'Need help?'}
              </h3>
              <p className="text-xs" style={{ color: 'rgba(8,16,30,0.6)' }}>
                {isRu ? 'Отвечаем за 5 минут' : 'We reply in 5 minutes'}
              </p>
            </div>
          </div>
          <p className="text-sm leading-relaxed" style={{ color: 'rgba(8,16,30,0.7)' }}>
            {isRu
              ? 'Персональный менеджер поможет с арендой, трансфером, экскурсиями — чем угодно на Пхукете'
              : 'Personal concierge helps with rentals, transfers, tours — anything in Phuket'}
          </p>
        </div>

        <a
          href={WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-5 py-3 rounded-[var(--radius-full)] font-bold text-sm shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all shrink-0 min-h-[44px]"
          style={{ background: '#fff', color: '#00A67A' }}
        >
          <div className="relative">
            <MessageCircle className="w-4 h-4" />
            <div className="wa-dot absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-primary" />
          </div>
          WhatsApp
          <ArrowRight className="w-3.5 h-3.5" />
        </a>
      </div>
    </section>
  );
}
