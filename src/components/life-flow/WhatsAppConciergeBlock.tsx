/**
 * WhatsAppConciergeBlock — "Let myUNO handle everything" CTA
 * Calm, trust-building block. No gradients, no glow.
 */
import { useLanguage } from '@/contexts/LanguageContext';
import { COMPANY_CONTACTS } from '@/lib/config/contacts';
import { MessageCircle, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

interface WhatsAppConciergeBlockProps {
  context?: 'trip' | 'general';
  className?: string;
}

export function WhatsAppConciergeBlock({ context = 'trip', className }: WhatsAppConciergeBlockProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const messages: Record<string, { ru: string; en: string }> = {
    trip: {
      ru: 'Здравствуйте! Помогите с моей ситуацией на Пхукете',
      en: 'Hi! I need help with my situation in Phuket',
    },
    general: {
      ru: 'Здравствуйте! Мне нужна помощь',
      en: 'Hi! I need help',
    },
  };

  const msg = messages[context] || messages.trip;
  const whatsappUrl = `https://wa.me/${COMPANY_CONTACTS.whatsapp.number}?text=${encodeURIComponent(isRu ? msg.ru : msg.en)}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className={className}
    >
      <div className="rounded-2xl border border-border/60 bg-card p-5 space-y-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center shrink-0">
            <MessageCircle className="w-5 h-5 text-success" />
          </div>
          <div className="flex-1 pt-0.5">
            <h3 className="text-sm font-semibold">
              {isRu ? 'Пусть myUNO всё сделает' : 'Let myUNO handle everything'}
            </h3>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              {isRu
                ? 'Напишите нам — и мы спланируем поездку за вас. Отвечает живой человек, не бот.'
                : "Message us and we'll plan your trip. A real person will reply, not a bot."}
            </p>
          </div>
        </div>

        <Button
          className="w-full bg-success hover:bg-success/90 text-success-foreground"
          onClick={() => window.open(whatsappUrl, '_blank')}
        >
          <MessageCircle className="w-4 h-4" />
          {isRu ? 'Написать в WhatsApp' : 'Message on WhatsApp'}
        </Button>

        <p className="text-center text-[10px] text-muted-foreground flex items-center justify-center gap-1">
          <Clock className="w-3 h-3" />
          {isRu ? 'Обычно отвечаем за 15 минут' : 'Usually reply within 15 minutes'}
        </p>
      </div>
    </motion.div>
  );
}