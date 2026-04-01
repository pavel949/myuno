/**
 * WhatsAppCTA — Premium CTA block with WhatsApp contact
 * Target: foreigners in Phuket needing concierge help
 */
import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { MessageCircle, Phone, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const WHATSAPP_NUMBER = '+66612345678'; // Replace with real number
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER.replace(/[^0-9]/g, '')}?text=${encodeURIComponent('Hi! I need help with services in Phuket')}`;

export function WhatsAppCTA({ className }: { className?: string }) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={cn(
        "relative rounded-2xl overflow-hidden",
        className
      )}
    >
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[hsl(142,70%,35%)] via-[hsl(142,65%,30%)] to-[hsl(142,60%,25%)]" />
      <div className="absolute inset-0 opacity-[0.05]" style={{
        backgroundImage: 'radial-gradient(circle at 70% 30%, white 1px, transparent 1px)',
        backgroundSize: '20px 20px',
      }} />

      <div className="relative px-5 py-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white leading-tight">
                {isRu ? 'Нужна помощь?' : 'Need help?'}
              </h3>
              <p className="text-xs text-white/70">
                {isRu ? 'Отвечаем за 5 минут' : 'We reply in 5 minutes'}
              </p>
            </div>
          </div>
          <p className="text-sm text-white/80 leading-relaxed">
            {isRu
              ? 'Персональный менеджер поможет с арендой, трансфером, экскурсиями — чем угодно на Пхукете'
              : 'Personal concierge helps with rentals, transfers, tours — anything in Phuket'}
          </p>
        </div>

        <a
          href={WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white text-[hsl(142,70%,30%)] font-bold text-sm shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all shrink-0"
        >
          <MessageCircle className="w-4 h-4" />
          WhatsApp
          <ArrowRight className="w-3.5 h-3.5" />
        </a>
      </div>
    </motion.section>
  );
}
