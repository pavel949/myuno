/**
 * InsurancePromptBlock - Contextual insurance recommendation
 * Calm, no gradients, trust-first.
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, HeartPulse, Phone, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

const INSURANCE_ROUTES = [
  'pre_trip_planning',
  'family',
  'arrival',
  'health',
  'leisure',
] as const;

type InsuranceContext = 'pre_trip' | 'family' | 'arrival' | 'emergency' | 'leisure';

const contextMap: Record<string, InsuranceContext> = {
  pre_trip_planning: 'pre_trip',
  family: 'family',
  arrival: 'arrival',
  health: 'emergency',
  leisure: 'leisure',
};

const contextContent: Record<InsuranceContext, { 
  icon: typeof Shield;
  title_ru: string; title_en: string;
  body_ru: string; body_en: string;
  cta_ru: string; cta_en: string;
}> = {
  pre_trip: {
    icon: Shield,
    title_ru: 'Оформите страховку до вылета',
    title_en: 'Get insured before your flight',
    body_ru: 'Средний счёт тайской больницы — от 50 000 ฿. Оформите страховку через myUNO — и при страховом случае мы поможем на месте.',
    body_en: 'Average Thai hospital bill starts at ฿50,000. Get insured through myUNO — and if something happens, we\'ll help on-site.',
    cta_ru: 'Оформить страховку',
    cta_en: 'Get Travel Insurance',
  },
  family: {
    icon: HeartPulse,
    title_ru: 'Семья застрахована?',
    title_en: 'Is your family insured?',
    body_ru: 'С детьми непредвиденные ситуации случаются чаще. При необходимости мы лично поможем с навигацией в тайской больнице.',
    body_en: 'With kids, unexpected situations happen more often. We\'ll personally help with hospital navigation if needed.',
    cta_ru: 'Застраховать семью',
    cta_en: 'Insure Your Family',
  },
  arrival: {
    icon: Shield,
    title_ru: 'Ещё не оформили страховку?',
    title_en: 'Still uninsured?',
    body_ru: 'Вы уже на месте — но страховку ещё можно оформить. Через myUNO — быстро, и мы поможем разобраться на месте.',
    body_en: 'You\'re already here — but you can still get covered. Through myUNO — fast, and we\'ll help you navigate locally.',
    cta_ru: 'Оформить сейчас',
    cta_en: 'Get Covered Now',
  },
  emergency: {
    icon: HeartPulse,
    title_ru: 'Есть страховка? Мы поможем с ней',
    title_en: 'Have insurance? We\'ll help you use it',
    body_ru: 'Если у вас есть полис — мы поможем в коммуникации с больницей. Нет полиса? Оформите сейчас.',
    body_en: 'If you have a policy — we\'ll help communicate with the hospital. No policy? Get one now.',
    cta_ru: 'Подробнее о страховке',
    cta_en: 'Learn About Insurance',
  },
  leisure: {
    icon: Shield,
    title_ru: 'Отдыхайте спокойно',
    title_en: 'Relax with peace of mind',
    body_ru: 'Активный отдых — это риск травм. Со страховкой через myUNO вы защищены, и мы рядом.',
    body_en: 'Active leisure means injury risk. With insurance through myUNO you\'re covered, and we\'re here to help.',
    cta_ru: 'Оформить страховку',
    cta_en: 'Get Insurance',
  },
};

interface InsurancePromptBlockProps {
  routeCode: string;
  accentColor?: string;
}

export function InsurancePromptBlock({ routeCode, accentColor }: InsurancePromptBlockProps) {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const context = contextMap[routeCode];
  if (!context) return null;

  const content = contextContent[context];
  const Icon = content.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.45 }}
      className="space-y-3"
    >
      <div className="flex items-center gap-2">
        <div className="h-px flex-1 bg-border/50" />
        <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground px-2 whitespace-nowrap">
          {isRu ? 'Важно для безопасности' : 'Important for safety'}
        </span>
        <div className="h-px flex-1 bg-border/50" />
      </div>

      <button
        onClick={() => navigate('/insurance/travel')}
        className="w-full text-left rounded-2xl border border-border/60 bg-card overflow-hidden hover:shadow-sm active:scale-[0.99] transition-all touch-manipulation"
      >
        <div className="p-4 space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/8 flex items-center justify-center shrink-0">
              <Icon className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold leading-tight mb-1">
                {isRu ? content.title_ru : content.title_en}
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {isRu ? content.body_ru : content.body_en}
              </p>
            </div>
          </div>

          {/* USP badge */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 border border-border/40">
            <Phone className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <p className="text-[11px] text-muted-foreground leading-snug">
              {isRu 
                ? 'Преимущество myUNO: поможем на месте при страховом случае'
                : 'myUNO advantage: on-site support if anything happens'}
            </p>
          </div>

          <Button 
            variant="outline"
            size="sm"
            className="w-full gap-2"
          >
            {isRu ? content.cta_ru : content.cta_en}
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </button>
    </motion.div>
  );
}

export function shouldShowInsurancePrompt(routeCode: string): boolean {
  return (INSURANCE_ROUTES as readonly string[]).includes(routeCode);
}