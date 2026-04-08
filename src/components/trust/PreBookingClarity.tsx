/**
 * PreBookingClarity — P2.3 Expectation Clarity
 * 
 * Before any booking/purchase, the user clearly understands:
 * - What is included
 * - What is NOT included
 * - What happens after payment
 * - When/how confirmation arrives
 * - Who to contact if something goes wrong
 */
import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import {
  Check, X, ArrowRight, Clock, MessageCircle, HelpCircle,
} from 'lucide-react';
import { COMPANY_CONTACTS } from '@/lib/config/contacts';

interface PreBookingClarityProps {
  /** What's included */
  included?: string[];
  /** What's NOT included */
  excluded?: string[];
  /** What happens after payment */
  afterPayment?: string;
  /** Confirmation timeline */
  confirmationTime?: string;
  /** Show support contact */
  showSupportContact?: boolean;
  className?: string;
}

export function PreBookingClarity({
  included = [],
  excluded = [],
  afterPayment,
  confirmationTime,
  showSupportContact = true,
  className,
}: PreBookingClarityProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const defaultAfterPayment = isRu
    ? 'Вы получите подтверждение на email и в приложении'
    : 'You\'ll receive confirmation via email and in the app';

  const defaultConfirmation = isRu
    ? 'В течение 15 минут'
    : 'Within 15 minutes';

  return (
    <div className={cn(
      'rounded-xl border bg-card p-4 space-y-3',
      className
    )}>
      {/* Header */}
      <div className="flex items-center gap-2">
        <HelpCircle className="w-4 h-4 text-primary" />
        <h4 className="text-sm font-semibold">
          {isRu ? 'Перед бронированием' : 'Before you book'}
        </h4>
      </div>

      {/* Included */}
      {included.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {isRu ? 'Включено' : 'Included'}
          </p>
          <ul className="space-y-1">
            {included.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <Check className="w-3.5 h-3.5 text-success shrink-0 mt-0.5" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Excluded */}
      {excluded.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {isRu ? 'Не включено' : 'Not included'}
          </p>
          <ul className="space-y-1">
            {excluded.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                <X className="w-3.5 h-3.5 text-destructive/60 shrink-0 mt-0.5" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* What happens next */}
      <div className="border-t pt-3 space-y-2">
        <div className="flex items-start gap-2 text-sm">
          <ArrowRight className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
          <span>{afterPayment || defaultAfterPayment}</span>
        </div>
        <div className="flex items-start gap-2 text-sm">
          <Clock className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
          <span>
            {isRu ? 'Подтверждение: ' : 'Confirmation: '}
            {confirmationTime || defaultConfirmation}
          </span>
        </div>
      </div>

      {/* Support contact */}
      {showSupportContact && (
        <div className="border-t pt-3">
          <a
            href={`https://wa.me/${COMPANY_CONTACTS.whatsapp.number}?text=${encodeURIComponent(
              isRu ? 'Здравствуйте, мне нужна помощь с бронированием' : 'Hi, I need help with a booking'
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-success hover:underline"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            {isRu ? 'Вопросы? Напишите нам' : 'Questions? Message us'}
          </a>
        </div>
      )}
    </div>
  );
}
