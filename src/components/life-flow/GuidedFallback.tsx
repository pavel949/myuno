/**
 * GuidedFallback - Never show "No results found"
 * Calm, trust-first. No gradients, no decorative glow.
 */
import React, { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { MessageCircle, Phone, ArrowRight, Compass, HeartHandshake } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getTelLink } from '@/lib/config/contacts';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface GuidedFallbackProps {
  situationTitle?: string;
  className?: string;
}

export const GuidedFallback = memo(function GuidedFallback({
  situationTitle,
  className,
}: GuidedFallbackProps) {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRussian = language === 'ru';

  return (
    <motion.div 
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("py-6", className)}
    >
      {/* Illustration — simple, no glow */}
      <div className="text-center mb-6">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-muted flex items-center justify-center">
          <Compass className="w-7 h-7 text-muted-foreground" />
        </div>

        <h3 className="text-lg font-semibold mb-2">
          {isRussian 
            ? 'Подбираем подходящие варианты' 
            : 'Curating Great Options'}
        </h3>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
          {isRussian
            ? `Для ситуации «${situationTitle || 'вашего запроса'}» мы готовим персональные рекомендации. А пока наш консьерж готов помочь.`
            : `We're preparing personalized recommendations for "${situationTitle || 'your request'}". Meanwhile, our concierge is ready to assist.`}
        </p>
      </div>

      {/* Action cards — calm, no gradients */}
      <div className="space-y-2 max-w-sm mx-auto">
        {/* Primary: Concierge chat */}
        <button
          onClick={() => {
            const chatButton = document.querySelector('[data-chat-fab]') as HTMLButtonElement;
            chatButton?.click();
          }}
          className="w-full flex items-center gap-3 p-4 rounded-2xl bg-primary text-primary-foreground text-left active:scale-[0.98] transition-transform touch-manipulation"
        >
          <div className="w-10 h-10 rounded-xl bg-primary-foreground/15 flex items-center justify-center shrink-0">
            <MessageCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-semibold">
              {isRussian ? 'Написать консьержу' : 'Chat with Concierge'}
            </p>
            <p className="text-xs opacity-80">
              {isRussian ? 'Отвечаем в течение 15 минут' : 'We respond within 15 minutes'}
            </p>
          </div>
        </button>

        {/* Secondary: Call */}
        <button
          onClick={() => window.location.href = 'tel:+66123456789'}
          className="w-full flex items-center gap-3 p-4 rounded-2xl bg-card border border-border/60 text-left hover:shadow-sm active:scale-[0.98] transition-all touch-manipulation"
        >
          <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
            <Phone className="w-5 h-5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-semibold">
              {isRussian ? 'Позвонить' : 'Call Us'}
            </p>
            <p className="text-xs text-muted-foreground">
              {isRussian ? 'Работаем 24/7' : 'Available 24/7'}
            </p>
          </div>
        </button>

        {/* Tertiary: VIP Concierge */}
        <button
          onClick={() => navigate('/vip-concierge')}
          className="w-full flex items-center gap-3 p-4 rounded-2xl bg-card border border-border/60 text-left hover:shadow-sm active:scale-[0.98] transition-all touch-manipulation"
        >
          <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
            <HeartHandshake className="w-5 h-5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-semibold">
              {isRussian ? 'VIP Консьерж' : 'VIP Concierge'}
            </p>
            <p className="text-xs text-muted-foreground">
              {isRussian ? 'Персональный помощник' : 'Personal assistant'}
            </p>
          </div>
        </button>
      </div>

      {/* Explore catalog */}
      <div className="mt-6 text-center">
        <Button
          variant="ghost"
          className="gap-2 text-muted-foreground hover:text-foreground"
          onClick={() => navigate('/discover')}
        >
          {isRussian ? 'Или исследуйте каталог' : 'Or explore the catalog'}
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );
});