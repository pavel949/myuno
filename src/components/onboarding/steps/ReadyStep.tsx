import React, { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { Check, LucideIcon, Shield, Star, Zap } from 'lucide-react';

type Language = 'ru' | 'en' | 'th';

interface ReadyStepProps {
  lang: Language;
  step: {
    icon: LucideIcon;
    title: { en: string; ru: string; th: string };
    subtitle: { en: string; ru: string; th: string };
  };
}

const features = [
  { 
    icon: Shield, 
    text: { 
      en: 'Verified providers only', 
      ru: 'Только проверенные провайдеры', 
      th: 'ผู้ให้บริการที่ได้รับการยืนยันเท่านั้น' 
    } 
  },
  { 
    icon: Star, 
    text: { 
      en: 'Real customer reviews', 
      ru: 'Реальные отзывы клиентов', 
      th: 'รีวิวจากลูกค้าจริง' 
    } 
  },
  { 
    icon: Zap, 
    text: { 
      en: 'Instant booking & support', 
      ru: 'Мгновенное бронирование и поддержка', 
      th: 'จองทันทีและการสนับสนุน' 
    } 
  },
];

export const ReadyStep = forwardRef<HTMLDivElement, ReadyStepProps>(
  function ReadyStep({ lang, step }, ref) {
    return (
      <div ref={ref} className="space-y-6 flex-1 flex flex-col justify-center">
        <div className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/25"
          >
            <Check className="w-10 h-10 text-white" />
          </motion.div>
          <h2 className="text-2xl font-bold mb-2">
            {step.title[lang]}
          </h2>
          <p className="text-sm text-muted-foreground">
            {step.subtitle[lang]}
          </p>
        </div>
        
        <div className="space-y-3 pt-4">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
                className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <IconComponent className="w-5 h-5 text-primary" />
                </div>
                <span className="text-sm font-medium">
                  {feature.text[lang]}
                </span>
              </motion.div>
            );
          })}
        </div>
      </div>
    );
  }
);
