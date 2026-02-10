/**
 * EmergencyQuickAccess — Quick access to emergency scenarios from home
 * 6 most common emergency situations with 1-tap access
 */
import React, { memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Heart, Bug, Car, FileX, Wallet, Shield,
  ChevronRight
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { COMPANY_CONTACTS } from '@/lib/config/contacts';

const EMERGENCY_SCENARIOS = [
  {
    id: 'health',
    icon: Heart,
    labelEn: 'Health',
    labelRu: 'Здоровье',
    phone: '1669',
    anchor: '#medical',
    color: 'text-rose-500',
    bg: 'bg-rose-500/10',
  },
  {
    id: 'bite',
    icon: Bug,
    labelEn: 'Bite / Sting',
    labelRu: 'Укус',
    anchor: '#wildlife',
    color: 'text-orange-500',
    bg: 'bg-orange-500/10',
  },
  {
    id: 'accident',
    icon: Car,
    labelEn: 'Accident',
    labelRu: 'Авария',
    phone: '1193',
    anchor: '#traffic',
    color: 'text-amber-500',
    bg: 'bg-amber-500/10',
  },
  {
    id: 'passport',
    icon: FileX,
    labelEn: 'Lost passport',
    labelRu: 'Паспорт',
    anchor: '#documents',
    color: 'text-purple-500',
    bg: 'bg-purple-500/10',
  },
  {
    id: 'money',
    icon: Wallet,
    labelEn: 'No money',
    labelRu: 'Без денег',
    anchor: '#documents',
    color: 'text-slate-500',
    bg: 'bg-slate-500/10',
  },
  {
    id: 'police',
    icon: Shield,
    labelEn: 'Police',
    labelRu: 'Полиция',
    phone: '1155',
    anchor: '#police',
    color: 'text-blue-500',
    bg: 'bg-blue-500/10',
  },
] as const;

export const EmergencyQuickAccess = memo(function EmergencyQuickAccess() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const isRu = language === 'ru';

  return (
    <section className="space-y-2.5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
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

      <div className="grid grid-cols-3 gap-2">
        {EMERGENCY_SCENARIOS.map((scenario) => {
          const Icon = scenario.icon;
          return (
            <button
              key={scenario.id}
              onClick={() => navigate(`/sos${scenario.anchor}`)}
              className={cn(
                "flex flex-col items-center gap-1.5 p-3 rounded-xl",
                "border border-border/50 bg-card",
                "hover:border-destructive/30 hover:bg-destructive/5",
                "transition-all active:scale-[0.96]"
              )}
            >
              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", scenario.bg)}>
                <Icon className={cn("w-4 h-4", scenario.color)} />
              </div>
              <span className="text-[11px] font-medium text-foreground leading-tight text-center">
                {isRu ? scenario.labelRu : scenario.labelEn}
              </span>
            </button>
          );
        })}
      </div>

      {/* Quick WhatsApp line */}
      <a
        href={`https://wa.me/${COMPANY_CONTACTS.whatsapp.number}?text=${encodeURIComponent(isRu ? 'Мне нужна срочная помощь' : 'I need urgent help')}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-medium hover:bg-emerald-500/15 transition-colors"
      >
        💬 {isRu ? 'WhatsApp myUNO — помощь 24/7' : 'WhatsApp myUNO — help 24/7'}
      </a>
    </section>
  );
});
