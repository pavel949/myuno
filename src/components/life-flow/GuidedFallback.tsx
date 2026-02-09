/**
 * GuidedFallback - Never show "No results found"
 * Per UX Contract §4.1: Always provide guided fallback
 * - Human support / concierge option
 * - Explanation, not error
 * - Premium visual design
 */
import React, { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { MessageCircle, Phone, ArrowRight, Sparkles, HeartHandshake, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("py-8 px-4", className)}
    >
      {/* Hero illustration with gradient */}
      <div className="text-center mb-8">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
          className="relative w-24 h-24 mx-auto mb-6"
        >
          {/* Outer glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-primary/5 rounded-3xl blur-xl" />
          {/* Main icon container */}
          <div className="relative w-full h-full rounded-3xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center shadow-lg">
            <Sparkles className="w-10 h-10 text-primary" />
          </div>
          {/* Floating accent */}
          <motion.div 
            animate={{ y: [0, -5, 0] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center shadow-lg"
          >
            <Clock className="w-4 h-4 text-white" />
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h3 className="text-xl font-bold mb-3">
            {isRussian 
              ? 'Подбираем лучшие варианты' 
              : 'Curating the Best Options'}
          </h3>
          <p className="text-muted-foreground text-sm max-w-sm mx-auto leading-relaxed">
            {isRussian
              ? `Для ситуации «${situationTitle || 'вашего запроса'}» мы готовим персональные рекомендации. А пока наш консьерж готов помочь прямо сейчас.`
              : `We're preparing personalized recommendations for "${situationTitle || 'your request'}". Meanwhile, our concierge is ready to assist.`}
          </p>
        </motion.div>
      </div>

      {/* Action cards */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-3 max-w-sm mx-auto"
      >
        {/* Primary: Concierge chat */}
        <button
          onClick={() => {
            const chatButton = document.querySelector('[data-chat-fab]') as HTMLButtonElement;
            chatButton?.click();
          }}
          className={cn(
            "w-full p-4 rounded-2xl text-left transition-all duration-200",
            "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground",
            "hover:shadow-lg hover:shadow-primary/25 hover:-translate-y-0.5",
            "flex items-center gap-4"
          )}
        >
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
            <MessageCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="font-semibold">
              {isRussian ? 'Написать консьержу' : 'Chat with Concierge'}
            </p>
            <p className="text-sm opacity-90">
              {isRussian ? 'Отвечаем в течение 5 минут' : 'We respond within 5 minutes'}
            </p>
          </div>
        </button>

        {/* Secondary: Call */}
        <button
          onClick={() => window.location.href = 'tel:+66123456789'}
          className={cn(
            "w-full p-4 rounded-2xl text-left transition-all duration-200",
            "bg-card border hover:border-primary/30 hover:shadow-md hover:-translate-y-0.5",
            "flex items-center gap-4"
          )}
        >
          <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center shrink-0">
            <Phone className="w-5 h-5 text-muted-foreground" />
          </div>
          <div>
            <p className="font-semibold">
              {isRussian ? 'Позвонить' : 'Call Us'}
            </p>
            <p className="text-sm text-muted-foreground">
              {isRussian ? 'Работаем 24/7' : 'Available 24/7'}
            </p>
          </div>
        </button>

        {/* Tertiary: VIP Concierge */}
        <button
          onClick={() => navigate('/vip-concierge')}
          className={cn(
            "w-full p-4 rounded-2xl text-left transition-all duration-200",
            "bg-gradient-to-br from-amber-500/10 to-transparent border border-amber-500/20",
            "hover:border-amber-500/40 hover:shadow-md hover:-translate-y-0.5",
            "flex items-center gap-4"
          )}
        >
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
            <HeartHandshake className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="font-semibold text-amber-700 dark:text-amber-500">
              {isRussian ? 'VIP Консьерж' : 'VIP Concierge'}
            </p>
            <p className="text-sm text-muted-foreground">
              {isRussian ? 'Персональный помощник' : 'Personal assistant'}
            </p>
          </div>
        </button>
      </motion.div>

      {/* Explore catalog link */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-8 text-center"
      >
        <Button
          variant="ghost"
          className="gap-2 text-muted-foreground hover:text-foreground"
          onClick={() => navigate('/discover')}
        >
          {isRussian ? 'Или исследуйте каталог' : 'Or explore the catalog'}
          <ArrowRight className="w-4 h-4" />
        </Button>
      </motion.div>
    </motion.div>
  );
});
