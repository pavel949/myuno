import React from 'react';
import { CreditCard, Building2, MessageCircle } from 'lucide-react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import type { PaymentMethodId } from '@/hooks/useLastPaymentMethod';

interface PaymentMethodPickerProps {
  value: PaymentMethodId;
  onChange: (next: PaymentMethodId) => void;
  className?: string;
}

interface MethodConfig {
  id: PaymentMethodId;
  Icon: typeof CreditCard;
  title: { en: string; ru: string };
  hint: { en: string; ru: string };
}

const METHODS: MethodConfig[] = [
  {
    id: 'card',
    Icon: CreditCard,
    title: { en: 'Credit / debit card', ru: 'Банковская карта' },
    hint: { en: 'Visa · Mastercard · Apple Pay · Google Pay', ru: 'Visa · Mastercard · Apple Pay · Google Pay' },
  },
  {
    id: 'transfer',
    Icon: Building2,
    title: { en: 'Bank transfer', ru: 'Банковский перевод' },
    hint: {
      en: 'Manager confirms instructions in chat',
      ru: 'Менеджер пришлёт реквизиты в чате',
    },
  },
  {
    id: 'whatsapp',
    Icon: MessageCircle,
    title: { en: 'Pay via WhatsApp manager', ru: 'Оплата через менеджера WhatsApp' },
    hint: {
      en: 'For custom terms, crypto, or wire',
      ru: 'Для индивидуальных условий, крипты или SWIFT',
    },
  },
];

/**
 * Airbnb-style "Add payment method" radio list. Three options:
 *   1. card     — online via Stripe checkout
 *   2. transfer — offline bank transfer, opens WhatsApp with manager
 *   3. whatsapp — pure manager negotiation
 *
 * The selected method is owned by the parent (so it can persist via
 * useLastPaymentMethod and gate the CTA accordingly).
 */
export function PaymentMethodPicker({ value, onChange, className }: PaymentMethodPickerProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  return (
    <RadioGroup
      value={value}
      onValueChange={(v) => onChange(v as PaymentMethodId)}
      className={cn('space-y-2', className)}
    >
      {METHODS.map(({ id, Icon, title, hint }) => {
        const selected = value === id;
        return (
          <label
            key={id}
            htmlFor={`pay-method-${id}`}
            className={cn(
              'flex items-center gap-3 rounded-xl border p-4 cursor-pointer transition-colors',
              selected ? 'border-primary bg-primary/5' : 'hover:bg-muted/40',
            )}
          >
            <RadioGroupItem value={id} id={`pay-method-${id}`} />
            <Icon className={cn('w-5 h-5 shrink-0', selected ? 'text-primary' : 'text-muted-foreground')} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{isRu ? title.ru : title.en}</p>
              <p className="text-xs text-muted-foreground truncate">{isRu ? hint.ru : hint.en}</p>
            </div>
          </label>
        );
      })}
    </RadioGroup>
  );
}
