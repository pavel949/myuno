/**
 * EmergencyQuickAccess — Compact emergency strip with 1-tap access
 */
import React, { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Heart, Bug, Car, FileX, Wallet, Shield,
  ChevronRight, MessageCircle
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { COMPANY_CONTACTS } from '@/lib/config/contacts';

const EMERGENCY_SCENARIOS = [
  {
    id: 'health', icon: Heart,
    labelEn: 'Health', labelRu: 'Здоровье',
    anchor: '#medical',
    color: 'text-rose-500', bg: 'bg-rose-500/10', border: 'border-rose-500/20',
  },
  {
    id: 'bite', icon: Bug,
    labelEn: 'Bite', labelRu: 'Укус',
    anchor: '#wildlife',
    color: 'text-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-500/20',
  },
  {
    id: 'accident', icon: Car,
    labelEn: 'Accident', labelRu: 'Авария',
    anchor: '#traffic',
    color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20',
  },
  {
    id: 'passport', icon: FileX,
    labelEn: 'Passport', labelRu: 'Паспорт',
    anchor: '#documents',
    color: 'text-purple-500', bg: 'bg-purple-500/10', border: 'border-purple-500/20',
  },
  {
    id: 'money', icon: Wallet,
    labelEn: 'No money', labelRu: 'Без денег',
    anchor: '#documents',
    color: 'text-slate-500', bg: 'bg-slate-500/10', border: 'border-slate-500/20',
  },
  {
    id: 'police', icon: Shield,
    labelEn: 'Police', labelRu: 'Полиция',
    anchor: '#police',
    color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20',
  },
] as const;

export const EmergencyQuickAccess = memo(function EmergencyQuickAccess() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const isRu = language === 'ru';

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-semibold uppercase tracking-widest text-muted-foreground lg:text-base lg:font-semibold lg:normal-case lg:tracking-normal lg:text-foreground">
          {isRu ? 'Экстренные ситуации' : 'Emergency'}
        </p>
        <button
          onClick={() => navigate('/sos')}
          className="text-xs text-primary font-medium flex items-center gap-0.5 hover:underline"
        >
          SOS
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      {/* Horizontal scrollable on mobile, grid on desktop */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar lg:grid lg:grid-cols-6 lg:gap-3 lg:overflow-visible">
        {EMERGENCY_SCENARIOS.map((scenario) => {
          const Icon = scenario.icon;
          return (
            <button
              key={scenario.id}
              onClick={() => navigate(`/sos${scenario.anchor}`)}
              className={cn(
                "flex-shrink-0 flex flex-col items-center gap-1.5 py-3 px-4 lg:px-2 rounded-xl",
                "border bg-card",
                scenario.border,
                "hover:shadow-sm",
                "transition-all active:scale-[0.96]",
                "min-w-[72px] lg:min-w-0"
              )}
            >
              <div className={cn("w-8 h-8 lg:w-10 lg:h-10 rounded-xl flex items-center justify-center", scenario.bg)}>
                <Icon className={cn("w-4 h-4 lg:w-5 lg:h-5", scenario.color)} />
              </div>
              <span className="text-[10px] lg:text-xs font-medium text-foreground leading-tight text-center whitespace-nowrap">
                {isRu ? scenario.labelRu : scenario.labelEn}
              </span>
            </button>
          );
        })}
      </div>

      {/* WhatsApp help */}
      <a
        href={`https://wa.me/${COMPANY_CONTACTS.whatsapp.number}?text=${encodeURIComponent(isRu ? 'Мне нужна срочная помощь' : 'I need urgent help')}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-emerald-500/8 border border-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-xs font-medium hover:bg-emerald-500/12 transition-colors"
      >
        <MessageCircle className="w-3.5 h-3.5" />
        {isRu ? 'WhatsApp myUNO — помощь 24/7' : 'WhatsApp myUNO — help 24/7'}
      </a>
    </section>
  );
});
