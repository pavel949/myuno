/**
 * InsurancePromptBlock - Contextual insurance recommendation for LifeOS routes
 * 
 * USP: myUNO не просто продаёт страховку — мы поможем на месте при страховом случае:
 * навигация, коммуникация с больницей, переводчик.
 * Страховые услуги — партнёрские, но поддержка — наша.
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, HeartPulse, Phone, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

/** Routes where the insurance block is contextually relevant */
const INSURANCE_ROUTES = [
  'pre_trip_planning',
  'family_with_children', 
  'arrival_first_day',
  'emergency_medical',
  'vacation_leisure',
] as const;

type InsuranceContext = 'pre_trip' | 'family' | 'arrival' | 'emergency' | 'leisure';

const contextMap: Record<string, InsuranceContext> = {
  pre_trip_planning: 'pre_trip',
  family_with_children: 'family',
  arrival_first_day: 'arrival',
  emergency_medical: 'emergency',
  vacation_leisure: 'leisure',
};

const contextContent: Record<InsuranceContext, { 
  icon: typeof Shield;
  title_ru: string; title_en: string;
  body_ru: string; body_en: string;
  cta_ru: string; cta_en: string;
}> = {
  pre_trip: {
    icon: Shield,
    title_ru: '🛡 Оформите страховку до вылета',
    title_en: '🛡 Get insured before your flight',
    body_ru: 'Средний счёт тайской больницы — от 50 000 ฿. Оформите страховку через myUNO — и при страховом случае мы поможем на месте: навигация, перевод, связь с больницей.',
    body_en: 'Average Thai hospital bill starts at ฿50,000. Get insured through myUNO — and if something happens, we\'ll help on-site: navigation, translation, hospital coordination.',
    cta_ru: 'Оформить страховку',
    cta_en: 'Get Travel Insurance',
  },
  family: {
    icon: HeartPulse,
    title_ru: '👨‍👩‍👧 Семья застрахована?',
    title_en: '👨‍👩‍👧 Is your family insured?',
    body_ru: 'С детьми непредвиденные ситуации случаются чаще. Страховка через myUNO — это не просто полис: при необходимости мы лично поможем с навигацией и коммуникацией в тайской больнице.',
    body_en: 'With kids, unexpected situations happen more often. Insurance through myUNO isn\'t just a policy — we\'ll personally help with hospital navigation and communication if needed.',
    cta_ru: 'Застраховать семью',
    cta_en: 'Insure Your Family',
  },
  arrival: {
    icon: Shield,
    title_ru: '⚠️ Ещё не оформили страховку?',
    title_en: '⚠️ Still uninsured?',
    body_ru: 'Вы уже на месте — но страховку ещё можно оформить. Через myUNO — быстро, и если что-то случится, мы поможем разобраться на месте.',
    body_en: 'You\'re already here — but you can still get covered. Through myUNO — fast, and if anything happens, we\'ll help you navigate it locally.',
    cta_ru: 'Оформить сейчас',
    cta_en: 'Get Covered Now',
  },
  emergency: {
    icon: HeartPulse,
    title_ru: '🏥 Есть страховка? Мы поможем с ней',
    title_en: '🏥 Have insurance? We\'ll help you use it',
    body_ru: 'Если у вас уже есть страховой полис — мы поможем в коммуникации с больницей и страховой компанией. Нет полиса? Оформите сейчас на будущее.',
    body_en: 'If you already have a policy — we\'ll help communicate with the hospital and insurer. No policy? Get one now for the future.',
    cta_ru: 'Подробнее о страховке',
    cta_en: 'Learn About Insurance',
  },
  leisure: {
    icon: Shield,
    title_ru: '🏖 Отдыхайте спокойно',
    title_en: '🏖 Relax with peace of mind',
    body_ru: 'Активный отдых — это риск травм. Со страховкой через myUNO вы защищены, и мы рядом, чтобы помочь при страховом случае: координация, перевод, сопровождение.',
    body_en: 'Active leisure means injury risk. With insurance through myUNO you\'re covered, and we\'re here to help with any claim: coordination, translation, support.',
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
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.45 }}
      className="space-y-3"
    >
      <div className="flex items-center gap-2">
        <div className="h-px flex-1 bg-border" />
        <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground px-2 whitespace-nowrap">
          {isRu ? 'Важно для безопасности' : 'Important for safety'}
        </span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <button
        onClick={() => navigate('/insurance/travel')}
        className={cn(
          "w-full text-left rounded-2xl border overflow-hidden transition-all duration-200",
          "hover:shadow-lg hover:-translate-y-0.5 group",
          "bg-gradient-to-br from-emerald-500/5 to-blue-500/5",
          "border-emerald-500/20 hover:border-emerald-500/40"
        )}
      >
        <div className="p-4 space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
              <Icon className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold leading-tight mb-1">
                {isRu ? content.title_ru : content.title_en}
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {isRu ? content.body_ru : content.body_en}
              </p>
            </div>
          </div>

          {/* USP badge */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/15">
            <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <p className="text-[11px] text-emerald-700 dark:text-emerald-400 leading-snug">
              {isRu 
                ? 'Преимущество myUNO: поможем на месте при страховом случае — навигация, перевод, координация с больницей'
                : 'myUNO advantage: on-site support if anything happens — navigation, translation, hospital coordination'}
            </p>
          </div>

          <Button 
            variant="outline"
            size="sm"
            className="w-full gap-2 border-emerald-500/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10"
          >
            {isRu ? content.cta_ru : content.cta_en}
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </button>
    </motion.div>
  );
}

/** Check if a route code should show the insurance prompt */
export function shouldShowInsurancePrompt(routeCode: string): boolean {
  return (INSURANCE_ROUTES as readonly string[]).includes(routeCode);
}
