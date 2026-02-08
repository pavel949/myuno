/**
 * WhatsAppConciergeBlock — "Let myUNO handle everything" CTA
 * Warm, trust-building block that opens WhatsApp with a pre-filled message.
 */
import { useLanguage } from '@/contexts/LanguageContext';
import { COMPANY_CONTACTS } from '@/lib/config/contacts';
import { MessageCircle, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface WhatsAppConciergeBlockProps {
  /** Custom WhatsApp message context */
  context?: 'trip' | 'general';
  className?: string;
}

export function WhatsAppConciergeBlock({ context = 'trip', className }: WhatsAppConciergeBlockProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const messages: Record<string, { ru: string; en: string }> = {
    trip: {
      ru: 'Здравствуйте! Помогите спланировать поездку на о. Пхукет',
      en: 'Hi! Please help me plan a trip to Phuket',
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
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.4 }}
      className={className}
    >
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/15 dark:border-emerald-500/10 p-5">
        {/* Subtle glow */}
        <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-emerald-500/8 blur-2xl" />

        <div className="relative z-10 space-y-3">
          {/* Icon + Title */}
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 bg-emerald-500/15">
              <MessageCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="flex-1 pt-0.5">
              <h3 className="text-sm font-bold">
                {isRu ? 'Пусть myUNO всё сделает' : 'Let myUNO handle everything'}
              </h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                {isRu
                  ? 'Напишите нам — и мы спланируем поездку за вас. Отвечает живой человек, не бот.'
                  : "Message us and we'll plan your trip. A real person will reply, not a bot."}
              </p>
            </div>
          </div>

          {/* CTA Button */}
          <Button
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-600 dark:hover:bg-emerald-500"
            onClick={() => window.open(whatsappUrl, '_blank')}
          >
            <MessageCircle className="w-4 h-4" />
            {isRu ? 'Написать в WhatsApp' : 'Message on WhatsApp'}
          </Button>

          {/* Response time badge */}
          <div className="flex justify-center">
            <Badge variant="secondary" className="gap-1.5 text-[10px] font-normal bg-emerald-500/8 text-muted-foreground border-0">
              <Clock className="w-3 h-3" />
              {isRu ? 'Обычно отвечаем за 15 минут' : 'Usually reply within 15 minutes'}
            </Badge>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
