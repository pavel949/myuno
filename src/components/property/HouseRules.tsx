import React from 'react';
import { 
  FileText, Cigarette, Dog, PartyPopper, Baby, 
  Volume2, Clock, AlertTriangle, Shield 
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Badge } from '@/components/ui/badge';

interface HouseRulesProps {
  rules?: string;
  rules_ru?: string;
  pets?: {
    allowed: boolean;
    deposit?: number;
    notes?: string;
    notes_ru?: string;
  };
  parties?: {
    allowed: boolean;
    maxGuests?: number;
  };
  quietHours?: {
    start?: string;
    end?: string;
  };
  children?: {
    friendly: boolean;
    hasCrib?: boolean;
    hasHighChair?: boolean;
  };
  smoking?: {
    allowed: boolean;
    penalty?: number;
  };
  emergencyContact?: {
    name?: string;
    phone?: string;
  };
  cancellationPolicy?: string;
  className?: string;
}

const cancellationPolicies: Record<string, { en: string; ru: string }> = {
  flexible: { en: 'Flexible - Free cancellation 24h before', ru: 'Гибкая - бесплатная отмена за 24ч' },
  moderate: { en: 'Moderate - Free cancellation 5 days before', ru: 'Умеренная - бесплатная отмена за 5 дней' },
  strict: { en: 'Strict - 50% refund up to 1 week before', ru: 'Строгая - 50% возврат за неделю' },
  non_refundable: { en: 'Non-refundable', ru: 'Без возврата' },
};

export function HouseRules({ 
  rules, 
  rules_ru,
  pets,
  parties,
  quietHours,
  children,
  smoking,
  emergencyContact,
  cancellationPolicy,
  className 
}: HouseRulesProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  return (
    <div className={className}>
      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
        <FileText className="w-5 h-5 text-primary" />
        {isRu ? 'Правила дома' : 'House Rules'}
      </h3>
      
      <div className="space-y-3">
        {/* Quick rules badges */}
        <div className="flex flex-wrap gap-2">
          {/* Smoking */}
          <Badge 
            variant={smoking?.allowed ? 'default' : 'destructive'}
            className="gap-1"
          >
            <Cigarette className="w-3 h-3" />
            {smoking?.allowed 
              ? (isRu ? 'Курение разрешено' : 'Smoking allowed')
              : (isRu ? 'Не курить' : 'No smoking')}
          </Badge>

          {/* Pets */}
          {pets && (
            <Badge 
              variant={pets.allowed ? 'default' : 'secondary'}
              className="gap-1"
            >
              <Dog className="w-3 h-3" />
              {pets.allowed 
                ? (isRu ? 'Питомцы OK' : 'Pets OK')
                : (isRu ? 'Без питомцев' : 'No pets')}
            </Badge>
          )}

          {/* Parties */}
          {parties && (
            <Badge 
              variant={parties.allowed ? 'default' : 'secondary'}
              className="gap-1"
            >
              <PartyPopper className="w-3 h-3" />
              {parties.allowed 
                ? (isRu ? `Вечеринки до ${parties.maxGuests || '?'} чел` : `Parties up to ${parties.maxGuests || '?'}`)
                : (isRu ? 'Без вечеринок' : 'No parties')}
            </Badge>
          )}

          {/* Children friendly */}
          {children && (
            <Badge 
              variant={children.friendly ? 'default' : 'secondary'}
              className="gap-1"
            >
              <Baby className="w-3 h-3" />
              {children.friendly 
                ? (isRu ? 'Дети welcome' : 'Child-friendly')
                : (isRu ? 'Не для детей' : 'Not child-friendly')}
            </Badge>
          )}
        </div>

        {/* Quiet hours */}
        {quietHours && (quietHours.start || quietHours.end) && (
          <div className="flex items-center gap-2 p-2 rounded-none bg-muted/30">
            <Volume2 className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm">
              {isRu ? 'Тишина:' : 'Quiet hours:'} {quietHours.start || '22:00'} – {quietHours.end || '08:00'}
            </span>
          </div>
        )}

        {/* Pet details */}
        {pets?.allowed && (pets.deposit || pets.notes) && (
          <div className="text-sm text-muted-foreground p-2 rounded-none bg-muted/30">
            {pets.deposit && (
              <p>{isRu ? `Депозит за питомца: ฿${pets.deposit}` : `Pet deposit: ฿${pets.deposit}`}</p>
            )}
            {(pets.notes || pets.notes_ru) && (
              <p className="mt-1">{isRu ? pets.notes_ru || pets.notes : pets.notes}</p>
            )}
          </div>
        )}

        {/* Children amenities */}
        {children?.friendly && (children.hasCrib || children.hasHighChair) && (
          <div className="text-sm text-muted-foreground p-2 rounded-none bg-muted/30">
            <p className="flex items-center gap-2">
              <Baby className="w-4 h-4" />
              {isRu ? 'Доступно:' : 'Available:'}
              {children.hasCrib && <span>{isRu ? 'Детская кроватка' : 'Crib'}</span>}
              {children.hasCrib && children.hasHighChair && ', '}
              {children.hasHighChair && <span>{isRu ? 'Детский стульчик' : 'High chair'}</span>}
            </p>
          </div>
        )}

        {/* Smoking penalty */}
        {!smoking?.allowed && smoking?.penalty && (
          <div className="flex items-center gap-2 text-sm text-destructive p-2 rounded-none bg-destructive/10">
            <AlertTriangle className="w-4 h-4" />
            {isRu ? `Штраф за курение: ฿${smoking.penalty}` : `Smoking penalty: ฿${smoking.penalty}`}
          </div>
        )}

        {/* Written rules */}
        {(rules || rules_ru) && (
          <div className="p-3 rounded-none bg-card border border-border/50">
            <p className="text-sm whitespace-pre-line">
              {isRu ? rules_ru || rules : rules}
            </p>
          </div>
        )}

        {/* Cancellation policy */}
        {cancellationPolicy && (
          <div className="p-3 rounded-none bg-muted/30">
            <p className="text-xs text-muted-foreground mb-1">
              {isRu ? 'Политика отмены' : 'Cancellation Policy'}
            </p>
            <p className="text-sm font-medium">
              {cancellationPolicies[cancellationPolicy]?.[isRu ? 'ru' : 'en'] || cancellationPolicy}
            </p>
          </div>
        )}

        {/* Emergency contact */}
        {emergencyContact && (emergencyContact.name || emergencyContact.phone) && (
          <div className="p-3 rounded-none bg-destructive/5 border border-destructive/20">
            <div className="flex items-center gap-2 mb-1">
              <Shield className="w-4 h-4 text-destructive" />
              <span className="text-sm font-medium">{isRu ? 'Экстренный контакт' : 'Emergency Contact'}</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {emergencyContact.name && <span>{emergencyContact.name}</span>}
              {emergencyContact.name && emergencyContact.phone && ' · '}
              {emergencyContact.phone && (
                <a href={`tel:${emergencyContact.phone}`} className="text-primary hover:underline">
                  {emergencyContact.phone}
                </a>
              )}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
