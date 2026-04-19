import React, { useState } from 'react';
import { Clock, Key, Car, Phone, MessageCircle, Info, ChevronDown } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Badge } from '@/components/ui/badge';
import { PriceDisplay } from '@/components/uno/PriceDisplay';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

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
  /** When true, show a deposit hint row linking to #property-pricing (no amount duplicated here). */
  showPricingDeposit?: boolean;
}

const keyHandoverLabels: Record<string, { en: string; ru: string; icon: string }> = {
  in_person: { en: 'Meet & Greet', ru: 'Личная встреча', icon: '🤝' },
  lockbox: { en: 'Lockbox', ru: 'Сейфовый ящик', icon: '🔐' },
  doorman: { en: 'Doorman/Concierge', ru: 'Консьерж', icon: '🧑‍💼' },
  keypad: { en: 'Digital Keypad', ru: 'Цифровой код', icon: '🔢' },
  smart_lock: { en: 'Smart Lock', ru: 'Умный замок', icon: '📱' },
};

const INTRO_POPOVER = {
  ru: 'Время заезда и выезда задаёт хозяин или управление объектом. Ранний заезд и поздний выезд могут быть платными — условия и суммы указаны в разделе «Стоимость», если применимо.',
  en: 'Check-in and check-out times are set by the host or the property. Early check-in and late check-out may cost extra — see the Pricing section when applicable.',
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
  className,
  showPricingDeposit,
}: CheckInDetailsProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const instructionText = isRu ? instructions_ru || instructions : instructions;
  const longInstructions = Boolean(instructionText && instructionText.length > 160);
  const [instructionsExpanded, setInstructionsExpanded] = useState(false);

  return (
    <Card variant="content" className={cn('overflow-hidden', className)}>
      <CardHeader className="pb-2 flex flex-row items-start justify-between gap-2 space-y-0">
        <CardTitle className="text-lg flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary shrink-0" />
          {isRu ? 'Заезд и выезд' : 'Check-in & Check-out'}
        </CardTitle>
        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="rounded-full p-1 text-muted-foreground hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring shrink-0"
              aria-label={isRu ? 'Справка по заезду' : 'About check-in'}
            >
              <Info className="w-4 h-4" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-[min(100vw-2rem,320px)] text-sm" align="end">
            <p className="text-muted-foreground leading-relaxed">{isRu ? INTRO_POPOVER.ru : INTRO_POPOVER.en}</p>
          </PopoverContent>
        </Popover>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        {/* Top row: times + access summary */}
        <div className="grid md:grid-cols-2 gap-3 md:gap-4 w-full min-w-0">
          <div className="grid grid-cols-2 gap-2 min-w-0">
            {checkIn && (
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/10 min-w-0">
                <p className="text-xs text-muted-foreground mb-1">{isRu ? 'Заезд' : 'Check-in'}</p>
                <p className="text-base font-semibold tabular-nums">{checkIn}</p>
                {earlyCheckinPrice != null && earlyCheckinPrice > 0 && (
                  <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs text-muted-foreground">
                      {isRu ? 'Ранний заезд' : 'Early'} +฿{earlyCheckinPrice.toLocaleString()}
                    </span>
                    <Popover>
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          className="rounded-full p-0.5 text-muted-foreground hover:text-foreground"
                          aria-label={isRu ? 'О раннем заезде' : 'About early check-in'}
                        >
                          <Info className="w-3.5 h-3.5" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[min(100vw-2rem,280px)] text-xs" align="start">
                        {isRu
                          ? 'Стоимость согласуется с хозяином; подробности — в разделе «Стоимость» ниже.'
                          : 'Charged per host policy; details are in the Pricing section below.'}
                      </PopoverContent>
                    </Popover>
                  </div>
                )}
              </div>
            )}
            {checkOut && (
              <div className="p-3 rounded-lg bg-muted/30 border border-border/50 min-w-0">
                <p className="text-xs text-muted-foreground mb-1">{isRu ? 'Выезд' : 'Check-out'}</p>
                <p className="text-base font-semibold tabular-nums">{checkOut}</p>
                {lateCheckoutPrice != null && lateCheckoutPrice > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {isRu ? 'Поздний:' : 'Late:'} +฿{lateCheckoutPrice.toLocaleString()}
                  </p>
                )}
                {lateCheckoutPenalty != null && lateCheckoutPenalty > 0 && (
                  <p className="text-xs text-destructive mt-1">
                    {isRu ? 'Штраф:' : 'Penalty:'} ฿{lateCheckoutPenalty.toLocaleString()}
                  </p>
                )}
                {(lateCheckoutPrice == null || lateCheckoutPrice <= 0) &&
                  (lateCheckoutPenalty == null || lateCheckoutPenalty <= 0) && (
                    <div className="mt-1 flex items-center gap-1.5">
                      <span className="text-xs text-muted-foreground">
                        {isRu ? 'Поздний выезд — по правилам объекта' : 'Late check-out per property rules'}
                      </span>
                      <Popover>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            className="rounded-full p-0.5 text-muted-foreground hover:text-foreground shrink-0"
                            aria-label={isRu ? 'О позднем выезде' : 'About late check-out'}
                          >
                            <Info className="w-3.5 h-3.5" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[min(100vw-2rem,280px)] text-xs" align="start">
                          {isRu
                            ? 'Суммы и штрафы — в разделе «Стоимость» или в правилах дома.'
                            : 'Fees are listed under Pricing or house rules.'}
                        </PopoverContent>
                      </Popover>
                    </div>
                  )}
              </div>
            )}
          </div>

          <div className="min-w-0 flex flex-col gap-2">
            {keyHandover ? (
              <div className="flex gap-2 p-3 rounded-lg bg-card border border-border/50 min-h-[4.5rem]">
                <Key className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground mb-0.5">{isRu ? 'Доступ / ключи' : 'Access'}</p>
                  <p className="text-sm font-medium leading-snug break-words">
                    {keyHandoverLabels[keyHandover]
                      ? `${keyHandoverLabels[keyHandover].icon} ${isRu ? keyHandoverLabels[keyHandover].ru : keyHandoverLabels[keyHandover].en}`
                      : keyHandover}
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-lg border border-dashed border-border/60 text-xs text-muted-foreground min-h-[4.5rem] flex items-center">
                {isRu
                  ? 'Способ передачи ключей уточните у менеджера после бронирования.'
                  : 'Key handover details are confirmed with the manager after booking.'}
              </div>
            )}
          </div>
        </div>

        {showPricingDeposit && (
          <div className="flex items-start gap-2 rounded-lg bg-warning/5 border border-warning/15 px-3 py-2">
            <Info className="w-4 h-4 text-warning shrink-0 mt-0.5" />
            <div className="min-w-0 text-sm">
              <p className="font-medium text-foreground">{isRu ? 'Залог / депозит' : 'Security deposit'}</p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                {isRu
                  ? 'Сумма и условия возврата указаны в разделе «Стоимость» — не дублируем цифры здесь.'
                  : 'Amount and refund terms are in the Pricing section — we do not repeat them here.'}
              </p>
              <a
                href="#property-pricing"
                className="inline-flex mt-1 text-xs font-medium text-primary hover:underline"
              >
                {isRu ? 'Перейти к разделу «Стоимость»' : 'Go to Pricing'}
              </a>
            </div>
          </div>
        )}

        {instructionText && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              {isRu ? 'Инструкции' : 'Instructions'}
            </p>
            <p
              className={cn(
                'text-sm text-muted-foreground leading-relaxed',
                longInstructions && !instructionsExpanded && 'line-clamp-4'
              )}
            >
              {instructionText}
            </p>
            {longInstructions && (
              <button
                type="button"
                onClick={() => setInstructionsExpanded((v) => !v)}
                className="flex items-center gap-1 text-xs font-medium text-primary mt-1 hover:underline"
              >
                <ChevronDown className={cn('w-4 h-4 transition-transform', instructionsExpanded && 'rotate-180')} />
                {instructionsExpanded
                  ? isRu
                    ? 'Свернуть'
                    : 'Show less'
                  : isRu
                    ? 'Полные инструкции'
                    : 'Full instructions'}
              </button>
            )}
          </div>
        )}

        {transfer && transfer.available && (
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Car className="w-5 h-5 text-primary shrink-0" />
                <span className="font-medium text-sm">{isRu ? 'Трансфер из аэропорта' : 'Airport transfer'}</span>
              </div>
              {transfer.airportPrice != null && transfer.airportPrice > 0 && (
                <PriceDisplay price={transfer.airportPrice} sourceCurrency={currency} size="sm" />
              )}
            </div>
            {(transfer.notes || transfer.notes_ru) && (
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                {isRu ? transfer.notes_ru || transfer.notes : transfer.notes}
              </p>
            )}
          </div>
        )}

        {manager && (manager.name || manager.phone) && (
          <div className="p-3 rounded-lg bg-card border border-border/50">
            <p className="text-sm font-medium mb-2">{isRu ? 'Менеджер' : 'Property manager'}</p>
            {manager.name && <p className="text-sm">{manager.name}</p>}
            <div className="flex flex-wrap items-center gap-3 mt-2">
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
              <div className="flex flex-wrap gap-1 mt-2">
                {manager.languages.map((lang) => (
                  <Badge key={lang} variant="secondary" className="text-xs">
                    {lang}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
