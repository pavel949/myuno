import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { SectionCard } from '@/components/uno/SectionCard';
import { Phone, WifiOff, Shield, Heart, Flame, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

const EMERGENCY_NUMBERS = [
  { icon: Shield, phone: '1155', labelEn: 'Tourist Police', labelRu: 'Турполиция', color: 'text-info', bg: 'bg-info/10' },
  { icon: Heart, phone: '1669', labelEn: 'Ambulance', labelRu: 'Скорая', color: 'text-destructive', bg: 'bg-destructive/10' },
  { icon: Flame, phone: '199', labelEn: 'Fire', labelRu: 'Пожарные', color: 'text-warning', bg: 'bg-warning/10' },
  { icon: AlertTriangle, phone: '191', labelEn: 'Emergency', labelRu: 'SOS', color: 'text-destructive', bg: 'bg-destructive/10' },
];

const EXTRA_CONTACTS = [
  { labelEn: 'Russian Embassy BKK', labelRu: 'Посольство РФ', phone: '02-234-9824' },
  { labelEn: 'Russian Consulate Phuket', labelRu: 'Консульство РФ Пхукет', phone: '076-510-392' },
  { labelEn: 'Immigration Hotline', labelRu: 'Иммиграция', phone: '1178' },
];

interface OfflineEmergencyCardProps {
  compact?: boolean;
}

export function OfflineEmergencyCard({ compact = false }: OfflineEmergencyCardProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const handleCall = (phone: string) => {
    window.location.href = `tel:${phone}`;
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
        {EMERGENCY_NUMBERS.map(item => {
          const Icon = item.icon;
          return (
            <button
              key={item.phone}
              onClick={() => handleCall(item.phone)}
              className={cn(
                "flex flex-col items-center gap-1 p-2.5 rounded-none border border-transparent transition-all active:scale-95",
                item.bg, "hover:border-current/20"
              )}
            >
              <Icon className={cn("w-5 h-5", item.color)} />
              <span className="font-bold text-base">{item.phone}</span>
              <span className="text-[9px] text-muted-foreground leading-tight text-center">
                {isRu ? item.labelRu : item.labelEn}
              </span>
            </button>
          );
        })}
      </div>

      {!compact && (
        <div className="mt-3 pt-3 border-t border-border/50 space-y-1.5">
          {EXTRA_CONTACTS.map(c => (
            <button
              key={c.phone}
              onClick={() => handleCall(c.phone)}
              className="w-full flex items-center justify-between py-1.5 text-sm hover:bg-muted/30 rounded-none px-2 transition-colors"
            >
              <span className="text-muted-foreground text-xs">
                {isRu ? c.labelRu : c.labelEn}
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
