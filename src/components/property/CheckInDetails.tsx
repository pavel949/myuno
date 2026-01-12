import React from 'react';
import { Clock, Key, Car, Phone, MessageCircle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Badge } from '@/components/ui/badge';
import { PriceDisplay } from '@/components/uno/PriceDisplay';

interface CheckInDetailsProps {
  checkIn?: string;
  checkOut?: string;
  earlyCheckinPrice?: number;
  lateCheckoutPrice?: number;
  lateCheckoutPenalty?: number;
  keyHandover?: string;
  /** English version of check-in instructions */
  instructions?: string;
  /** Russian version of check-in instructions */
  instructions_ru?: string;
  transfer?: {
    available: boolean;
    airportPrice?: number;
    notes?: string;
    notes_ru?: string;
  };
  manager?: {
    name?: string;
    phone?: string;
    lineId?: string;
    languages?: string[];
  };
  currency?: string;
  className?: string;
}

const keyHandoverLabels: Record<string, { en: string; ru: string; icon: string }> = {
  in_person: { en: 'Meet & Greet', ru: 'Личная встреча', icon: '🤝' },
  lockbox: { en: 'Lockbox', ru: 'Сейфовый ящик', icon: '🔐' },
  doorman: { en: 'Doorman/Concierge', ru: 'Консьерж', icon: '🧑‍💼' },
  keypad: { en: 'Digital Keypad', ru: 'Цифровой код', icon: '🔢' },
  smart_lock: { en: 'Smart Lock', ru: 'Умный замок', icon: '📱' },
};

export function CheckInDetails({ 
  checkIn, 
  checkOut, 
  earlyCheckinPrice,
  lateCheckoutPrice,
  lateCheckoutPenalty,
  keyHandover,
  instructions,
  instructions_ru,
  transfer,
  manager,
  currency = 'THB',
  className 
}: CheckInDetailsProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  return (
    <div className={className}>
      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
        <Clock className="w-5 h-5 text-primary" />
        {isRu ? 'Заезд и выезд' : 'Check-in & Check-out'}
      </h3>
      
      <div className="space-y-3">
        {/* Times */}
        <div className="grid grid-cols-2 gap-3">
          {checkIn && (
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
              <p className="text-xs text-muted-foreground mb-1">
                {isRu ? 'Заезд' : 'Check-in'}
              </p>
              <p className="text-lg font-semibold">{checkIn}</p>
              {earlyCheckinPrice && earlyCheckinPrice > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  {isRu ? 'Ранний:' : 'Early:'} +฿{earlyCheckinPrice}
                </p>
              )}
            </div>
          )}
          {checkOut && (
            <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
              <p className="text-xs text-muted-foreground mb-1">
                {isRu ? 'Выезд' : 'Check-out'}
              </p>
              <p className="text-lg font-semibold">{checkOut}</p>
              {lateCheckoutPrice && lateCheckoutPrice > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  {isRu ? 'Поздний:' : 'Late:'} +฿{lateCheckoutPrice}
                </p>
              )}
              {lateCheckoutPenalty && lateCheckoutPenalty > 0 && (
                <p className="text-xs text-destructive mt-1">
                  {isRu ? 'Штраф:' : 'Penalty:'} ฿{lateCheckoutPenalty}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Key handover */}
        {keyHandover && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-card border border-border/50">
            <Key className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">
                {keyHandoverLabels[keyHandover] 
                  ? `${keyHandoverLabels[keyHandover].icon} ${isRu ? keyHandoverLabels[keyHandover].ru : keyHandoverLabels[keyHandover].en}`
                  : keyHandover}
              </p>
              {(instructions || instructions_ru) && (
                <p className="text-xs text-muted-foreground mt-1">
                  {isRu ? instructions_ru || instructions : instructions}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Transfer */}
        {transfer && transfer.available && (
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Car className="w-5 h-5 text-primary" />
                <span className="font-medium">{isRu ? 'Трансфер из аэропорта' : 'Airport Transfer'}</span>
              </div>
              {transfer.airportPrice && (
                <PriceDisplay price={transfer.airportPrice} currency={currency} size="sm" />
              )}
            </div>
            {(transfer.notes || transfer.notes_ru) && (
              <p className="text-xs text-muted-foreground mt-2">
                {isRu ? transfer.notes_ru || transfer.notes : transfer.notes}
              </p>
            )}
          </div>
        )}

        {/* Manager contact */}
        {manager && (manager.name || manager.phone) && (
          <div className="p-3 rounded-lg bg-card border border-border/50">
            <p className="text-sm font-medium mb-2">
              {isRu ? 'Менеджер' : 'Property Manager'}
            </p>
            {manager.name && (
              <p className="text-sm">{manager.name}</p>
            )}
            <div className="flex items-center gap-3 mt-2">
              {manager.phone && (
                <a 
                  href={`tel:${manager.phone}`}
                  className="flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  <Phone className="w-3 h-3" />
                  {manager.phone}
                </a>
              )}
              {manager.lineId && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MessageCircle className="w-3 h-3" />
                  Line: {manager.lineId}
                </span>
              )}
            </div>
            {manager.languages && manager.languages.length > 0 && (
              <div className="flex gap-1 mt-2">
                {manager.languages.map((lang) => (
                  <Badge key={lang} variant="secondary" className="text-xs">
                    {lang}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
