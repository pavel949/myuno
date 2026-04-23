import React, { useState, useEffect, useCallback, memo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Shield, Clock, Gift } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ExitIntentModalProps {
  vertical: 'investment' | 'property';
  projectTitle?: string;
  projectId?: string;
  minDelay?: number; // minimum time on page before showing (ms)
}

export const ExitIntentModal = memo(function ExitIntentModal({
  vertical,
  projectTitle,
  projectId,
  minDelay = 10000, // 10 seconds minimum on page
}: ExitIntentModalProps) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const isRu = language === 'ru';
  
  const [isOpen, setIsOpen] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pageReady, setPageReady] = useState(false);

  // Wait for minimum time before enabling exit intent
  useEffect(() => {
    const timer = setTimeout(() => {
      setPageReady(true);
    }, minDelay);
    return () => clearTimeout(timer);
  }, [minDelay]);

  // Exit intent detection
  const handleMouseLeave = useCallback((e: MouseEvent) => {
    // Only trigger when mouse leaves through top of viewport
    if (e.clientY <= 0 && pageReady && !hasTriggered) {
      setIsOpen(true);
      setHasTriggered(true);
    }
  }, [pageReady, hasTriggered]);

  useEffect(() => {
    // Check if already shown in this session
    const sessionKey = `exit_intent_${vertical}_${projectId || 'general'}`;
    if (sessionStorage.getItem(sessionKey)) {
      setHasTriggered(true);
      return;
    }

    document.addEventListener('mouseleave', handleMouseLeave);
    return () => document.removeEventListener('mouseleave', handleMouseLeave);
  }, [handleMouseLeave, vertical, projectId]);

  const handleSubmit = async () => {
    if (!name.trim() || !phone.trim()) {
      toast.error(isRu ? 'Заполните все поля' : 'Please fill all fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('consultation_requests')
        .insert([{
          request_type: vertical === 'investment' ? 'investment_advice' : 'property_consultation',
          vertical_id: vertical,
          entry_point: 'exit_intent_modal',
          lead_source: `exit_intent_${vertical}`,
          name: name,
          phone: phone,
          vertical_metadata: {
            project_id: projectId,
            project_title: projectTitle,
            trigger: 'exit_intent',
            page_url: window.location.href,
          },
        }]);

      if (error) throw error;

      // Mark as shown in session
      const sessionKey = `exit_intent_${vertical}_${projectId || 'general'}`;
      sessionStorage.setItem(sessionKey, 'true');

      toast.success(isRu ? 'Заявка отправлена! Свяжемся в течение 24 часов' : 'Request sent! We\'ll contact you within 24 hours');
      setIsOpen(false);
    } catch (error) {
      console.error('Exit intent submit error:', error);
      toast.error(isRu ? 'Ошибка отправки' : 'Submission error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    const sessionKey = `exit_intent_${vertical}_${projectId || 'general'}`;
    sessionStorage.setItem(sessionKey, 'true');
  };

  const content = {
    investment: {
      title: isRu ? 'Уходите?' : 'Leaving?',
      subtitle: isRu 
        ? 'Получите персональный анализ этого проекта бесплатно'
        : 'Get a free personalized analysis of this project',
      cta: isRu ? 'Получить анализ' : 'Get Analysis',
      benefit1: isRu ? 'Детальный ROI расчёт' : 'Detailed ROI calculation',
      benefit2: isRu ? 'Анализ рисков' : 'Risk analysis',
      benefit3: isRu ? 'Сравнение с аналогами' : 'Comparison with alternatives',
    },
    property: {
      title: isRu ? 'Уходите?' : 'Leaving?',
      subtitle: isRu 
        ? 'Наш эксперт подберёт подходящий вариант под ваш бюджет'
        : 'Our expert will find a suitable option for your budget',
      cta: isRu ? 'Получить подборку' : 'Get Selection',
      benefit1: isRu ? 'Персональная подборка' : 'Personal selection',
      benefit2: isRu ? 'Проверенные цены' : 'Verified prices',
      benefit3: isRu ? 'Проверенные объекты' : 'Verified properties',
    },
  };

  const c = content[vertical];

  /** Portal to body: ancestors with transform/will-change break `position:fixed` (overlay was sized to page, not viewport). */
  if (typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="exit-intent-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/60 z-[100]"
          />

          {/* Modal */}
          <motion.div
            key="exit-intent-modal"
            initial={{ opacity: 0, scale: 0.9, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-md z-[101]"
          >
            <div className="bg-card rounded-none border border-border/50 shadow-2xl overflow-hidden">
              {/* Header with gradient */}
              <div className={cn(
                "p-6 text-center relative",
                vertical === 'investment' 
                  ? "bg-gradient-to-br from-primary/20 via-primary/10 to-transparent"
                  : "bg-gradient-to-br from-primary/20 via-accent/10 to-transparent"
              )}>
                <button
                  onClick={handleClose}
                  className="absolute top-4 right-4 p-1 rounded-full hover:bg-background/50 transition-colors"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>

                <div className={cn(
                  "w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center",
                  vertical === 'investment' 
                    ? "bg-gradient-to-br from-primary to-primary"
                    : "bg-gradient-to-br from-primary to-accent"
                )}>
                  <Gift className="w-8 h-8 text-white" />
                </div>

                <h2 className="text-xl font-bold">{c.title}</h2>
                <p className="text-muted-foreground mt-1">{c.subtitle}</p>

                {projectTitle && (
                  <p className="mt-2 text-sm font-medium text-primary truncate max-w-full">
                    «{projectTitle}»
                  </p>
                )}
              </div>

              {/* Benefits */}
              <div className="px-6 py-4 space-y-2 border-b border-border/50">
                <div className="flex items-center gap-2 text-sm">
                  <Sparkles className="w-4 h-4 text-primary flex-shrink-0" />
                  <span>{c.benefit1}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Shield className="w-4 h-4 text-success flex-shrink-0" />
                  <span>{c.benefit2}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-accent flex-shrink-0" />
                  <span>{c.benefit3}</span>
                </div>
              </div>

              {/* Form */}
              <div className="p-6 space-y-4">
                <Input
                  placeholder={isRu ? 'Ваше имя' : 'Your name'}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-12"
                />
                <Input
                  placeholder={isRu ? 'Телефон / WhatsApp' : 'Phone / WhatsApp'}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="h-12"
                />
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className={cn(
                    "w-full h-12 font-semibold",
                    vertical === 'investment'
                      ? "bg-gradient-to-r from-primary to-primary hover:from-primary hover:to-primary"
                      : ""
                  )}
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      {isRu ? 'Отправка...' : 'Sending...'}
                    </span>
                  ) : (
                    c.cta
                  )}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  {isRu 
                    ? 'Нажимая кнопку, вы соглашаетесь с политикой конфиденциальности'
                    : 'By clicking, you agree to our privacy policy'
                  }
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
});
