/**
 * WhatsAppConciergeBlock — "Let myUNO handle everything" CTA
 * Calm, trust-building block. No gradients, no glow.
 */
import { useLanguage } from '@/contexts/LanguageContext';
import { useState } from 'react';
import { ConciergeHelpSheet } from '@/components/concierge/ConciergeHelpSheet';
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

  const [open, setOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className={className}
    >
      <div className="rounded-none border border-border/60 bg-card p-5 space-y-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-none bg-success/10 flex items-center justify-center shrink-0">
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
          onClick={() => setOpen(true)}
        >
          <MessageCircle className="w-4 h-4" />
          {isRu ? 'Оставить заявку' : language === 'th' ? 'ส่งคำขอ' : 'Send a request'}
        </Button>

        <p className="text-center text-[10px] text-muted-foreground flex items-center justify-center gap-1">
          <Clock className="w-3 h-3" />
          {isRu ? 'Команда myUNO уточнит детали' : 'The myUNO team will confirm the details'}
        </p>
      </div>
      {open && <ConciergeHelpSheet open={open} onOpenChange={setOpen} topic="general"
        sourceData={{source: 'life_flow_concierge', context}} />}
    </motion.div>
  );
}