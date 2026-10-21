import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { SectionCard } from '@/components/uno/SectionCard';
import { Phone, WifiOff, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  getEmergencyContacts,
  getEmergencyCategory,
  sanitizeTelNumber,
  EMERGENCY_TONE_CLASSES,
} from '@/lib/emergency/contacts';

interface OfflineEmergencyCardProps {
  compact?: boolean;
}

export function OfflineEmergencyCard({ compact = false }: OfflineEmergencyCardProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const { quickDial } = getEmergencyContacts('phuket');
  // Embassy / consulate / immigration lines are handy to keep offline too.
  const extras = getEmergencyCategory('documents')?.contacts.filter(c => c.id !== 'immigration-phuket') ?? [];

  const handleCall = (phone: string) => {
    window.location.href = `tel:${sanitizeTelNumber(phone)}`;
  };

  return (
    <SectionCard className="border-warning/30 bg-warning/5">
      <div className="flex items-center gap-2 mb-3">
        <WifiOff className="w-4 h-4 text-warning" />
        <p className="text-xs font-semibold text-warning uppercase tracking-wider">
          {isRu ? 'Экстренные номера (офлайн)' : 'Emergency Numbers (Offline)'}
        </p>
      </div>

      <div className={cn("grid gap-2", compact ? "grid-cols-4" : "grid-cols-2")}>
        {quickDial.map(item => {
          const Icon = item.icon ?? AlertTriangle;
          const tone = EMERGENCY_TONE_CLASSES[item.tone ?? 'destructive'];
          return (
            <button
              key={item.id}
              onClick={() => handleCall(item.phone)}
              className={cn(
                "flex flex-col items-center gap-1 p-2.5 rounded-none border border-transparent transition-all ",
                tone.bg, "hover:border-current/20"
              )}
            >
              <Icon className={cn("w-5 h-5", tone.color)} />
              <span className="font-bold text-base">{item.phone}</span>
              <span className="text-[9px] text-muted-foreground leading-tight text-center">
                {isRu ? (item.shortLabelRu ?? item.nameRu) : (item.shortLabelEn ?? item.nameEn)}
              </span>
            </button>
          );
        })}
      </div>

      {!compact && extras.length > 0 && (
        <div className="mt-3 pt-3 border-t border-border/50 space-y-1.5">
          {extras.map(c => (
            <button
              key={c.id}
              onClick={() => handleCall(c.phone)}
              className="w-full flex items-center justify-between py-1.5 text-sm hover:bg-muted/30 rounded-none px-2 transition-colors"
            >
              <span className="text-muted-foreground text-xs">
                {isRu ? c.nameRu : c.nameEn}
              </span>
              <span className="flex items-center gap-1 text-primary font-medium text-xs">
                <Phone className="w-3 h-3" />
                {c.phone}
              </span>
            </button>
          ))}
        </div>
      )}
    </SectionCard>
  );
}
