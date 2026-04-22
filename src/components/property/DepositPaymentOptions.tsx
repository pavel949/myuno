import React, { useState, useImperativeHandle, forwardRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, MessageCircle, Loader2, Shield, AlertCircle, Building2, Wallet } from 'lucide-react';
import * as Sentry from '@sentry/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ContactAdminButton } from './ContactAdminButton';
import { PaymentMethodPicker } from './PaymentMethodPicker';
import { useLastPaymentMethod, type PaymentMethodId } from '@/hooks/useLastPaymentMethod';
import { useRubEstimate } from '@/hooks/useRubEstimate';
import { useOrders } from '@/hooks/useOrders';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface DepositPaymentOptionsProps {
  propertyId: string;
  propertyTitle: string;
  checkIn: Date;
  checkOut: Date;
  guests: number;
  nights: number;
  totalAmount: number;
  /** Listing currency (USD/THB/EUR/...). Used for the RUB estimate + order metadata. */
  currency?: string;
  cleaningFee?: number;
  guestName: string;
  guestPhone: string;
  guestEmail: string;
  providerOrgId?: string;
  /** Owner of the property — receives manual-payment notifications alongside admins. */
  ownerUserId?: string;
  /** Prepayment amount calculated by the central pricing engine. Defaults to 10% if omitted. */
  prepayAmount?: number;
  /** Prepay percent (for display). Defaults to 10. */
  prepayPercent?: number;
  /** When true, charge the full total immediately instead of just the deposit. */
  payInFull?: boolean;
  onSuccess?: () => void;
  /** Notifies parent (sticky footer) about which method is selected so it can label its CTA. */
  onMethodChange?: (method: PaymentMethodId) => void;
}

export interface DepositPaymentOptionsHandle {
  /** Triggers the currently selected payment flow. Returns true if it kicked off. */
  submit: () => Promise<boolean>;
  getMethod: () => PaymentMethodId;
}

export const DepositPaymentOptions = forwardRef<DepositPaymentOptionsHandle, DepositPaymentOptionsProps>(
  function DepositPaymentOptions(
    {
      propertyId,
      propertyTitle,
      checkIn,
      checkOut,
      guests,
      nights,
      totalAmount,
      cleaningFee,
      guestName,
      guestPhone,
      guestEmail,
      providerOrgId,
      prepayAmount,
      prepayPercent,
      payInFull = false,
      onMethodChange,
    },
    ref,
  ) {
    const { language } = useLanguage();
    const { formatPrice } = useCurrency();
    const isRu = language === 'ru';
    const [isProcessing, setIsProcessing] = useState(false);
    const { method, setMethod } = useLastPaymentMethod('card');

    // Notify parent of initial + future selection so the sticky footer can re-label.
    React.useEffect(() => {
      onMethodChange?.(method);
    }, [method, onMethodChange]);

    // Use the engine-calculated prepay; fall back to 10% only if not provided.
    const effectivePercent = prepayPercent ?? 10;
    const depositAmount = prepayAmount ?? Math.round(totalAmount * (effectivePercent / 100));
    // Amount we actually charge right now depends on the "pay when" choice.
    const chargeNow = payInFull ? totalAmount : depositAmount;
    const remainingAmount = Math.max(totalAmount - chargeNow, 0);

    const handleOnlinePayment = async (): Promise<boolean> => {
      setIsProcessing(true);
      try {
        // Bug #5 fix: re-check availability atomically right before launching
        // Stripe checkout — request mode already does this, instant did not.
        const { data: isAvailable, error: availErr } = await supabase.rpc(
          'check_property_dates_available',
          {
            p_property_id: propertyId,
            p_check_in: format(checkIn, 'yyyy-MM-dd'),
            p_check_out: format(checkOut, 'yyyy-MM-dd'),
          },
        );
        if (availErr) {
          console.error('[DepositPaymentOptions] availability check error:', availErr);
          toast.error(
            isRu
              ? 'Не удалось проверить доступность дат. Попробуйте ещё раз.'
              : 'Could not verify date availability. Please try again.',
          );
          return false;
        }
        if (isAvailable === false) {
          toast.error(
            isRu
              ? 'Эти даты только что были забронированы. Выберите другие.'
              : 'These dates were just booked. Please pick different dates.',
          );
          return false;
        }

        const { data, error } = await supabase.functions.invoke('create-property-deposit-checkout', {
          body: {
            property_id: propertyId,
            property_title: propertyTitle,
            check_in: format(checkIn, 'yyyy-MM-dd'),
            check_out: format(checkOut, 'yyyy-MM-dd'),
            guests,
            nights,
            total_amount: totalAmount,
            // The amount the Stripe session should actually charge.
            charge_amount: chargeNow,
            pay_in_full: payInFull,
            // Kept for backward-compat with the existing edge function:
            deposit_amount: chargeNow,
            deposit_percent: payInFull ? 100 : effectivePercent,
            cleaning_fee: cleaningFee || 0,
            guest_name: guestName,
            guest_phone: guestPhone,
            guest_email: guestEmail,
            provider_org_id: providerOrgId,
          },
        });

        if (error) throw error;

        if (data?.url) {
          window.location.href = data.url;
          return true;
        }
        throw new Error('No checkout URL received');
      } catch (error) {
        // Bug #2 fix: surface the real Stripe error and report to Sentry.
        const err = error instanceof Error ? error : new Error(String(error));
        console.error('Payment error:', err);
        Sentry.captureException(err, {
          extra: {
            scope: 'DepositPaymentOptions.handleOnlinePayment',
            propertyId,
            totalAmount,
            chargeNow,
            payInFull,
          },
        });
        toast.error(
          isRu ? 'Ошибка при создании платежа' : 'Error creating payment',
          { description: err.message || (isRu ? 'Попробуйте позже' : 'Please try again') },
        );
        return false;
      } finally {
        setIsProcessing(false);
      }
    };

    const triggerWhatsApp = () => {
      const checkInFormatted = format(checkIn, 'd MMM yyyy', { locale: isRu ? ru : undefined });
      const checkOutFormatted = format(checkOut, 'd MMM yyyy', { locale: isRu ? ru : undefined });
      const message = isRu
        ? `🏠 Запрос на бронирование\n\n📍 ${propertyTitle}\n📅 ${checkInFormatted} → ${checkOutFormatted}\n👥 Гостей: ${guests}\n\n💰 Полная стоимость: ${formatPrice(totalAmount)}\n💳 К оплате сейчас: ${formatPrice(chargeNow)}\n\n👤 ${guestName} · ${guestPhone}\n\nХочу обсудить детали оплаты.`
        : `🏠 Booking Request\n\n📍 ${propertyTitle}\n📅 ${checkInFormatted} → ${checkOutFormatted}\n👥 Guests: ${guests}\n\n💰 Total: ${formatPrice(totalAmount)}\n💳 Due now: ${formatPrice(chargeNow)}\n\n👤 ${guestName} · ${guestPhone}\n\nI'd like to discuss payment options.`;

      // Lazy import to avoid pulling contacts config into the initial bundle.
      import('@/lib/config/contacts').then(({ COMPANY_CONTACTS }) => {
        const url = `https://wa.me/${COMPANY_CONTACTS.whatsapp.number}?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
      });
    };

    useImperativeHandle(
      ref,
      () => ({
        getMethod: () => method,
        submit: async () => {
          if (method === 'card') return handleOnlinePayment();
          // For offline methods we just deep-link out to WhatsApp.
          triggerWhatsApp();
          return true;
        },
      }),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [method, payInFull, totalAmount, chargeNow, propertyId],
    );

    return (
      <div className="space-y-4">
        {/* Price Summary */}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4 space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              {isRu ? 'Сводка бронирования' : 'Booking Summary'}
            </h3>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{isRu ? 'Объект' : 'Property'}</span>
                <span className="font-medium text-right max-w-[60%] truncate">{propertyTitle}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{isRu ? 'Даты' : 'Dates'}</span>
                <span>
                  {format(checkIn, 'd MMM', { locale: isRu ? ru : undefined })} —{' '}
                  {format(checkOut, 'd MMM', { locale: isRu ? ru : undefined })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{isRu ? 'Ночей' : 'Nights'}</span>
                <span>{nights}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{isRu ? 'Гостей' : 'Guests'}</span>
                <span>{guests}</span>
              </div>

              <Separator className="my-2" />

              <div className="flex justify-between">
                <span className="text-muted-foreground">{isRu ? 'Полная стоимость' : 'Total'}</span>
                <span className="font-semibold">{formatPrice(totalAmount)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* What we'll charge now */}
        <Card className="border-success/30 bg-success/5">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium">
                {payInFull
                  ? (isRu ? 'К оплате сейчас (полная)' : 'Charged now (full)')
                  : (isRu ? `Предоплата ${effectivePercent}%` : `${effectivePercent}% deposit`)}
              </span>
              <span className="text-xl font-bold text-success">{formatPrice(chargeNow)}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {payInFull
                ? (isRu ? 'Списание полной суммы. Возврат по правилам отмены.' : 'Full amount charged now. Refunds per cancellation policy.')
                : (isRu
                    ? 'Невозвратная предоплата для подтверждения бронирования'
                    : 'Non-refundable deposit to confirm your booking')}
            </p>
            {remainingAmount > 0 && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
                <AlertCircle className="w-3 h-3" />
                <span>
                  {isRu
                    ? `Остаток ${formatPrice(remainingAmount)} оплачивается при заезде`
                    : `Remaining ${formatPrice(remainingAmount)} paid at check-in`}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Method Picker */}
        <div className="space-y-3">
          <h3 className="font-semibold text-sm">
            {isRu ? 'Способ оплаты' : 'Payment method'}
          </h3>
          <PaymentMethodPicker value={method} onChange={setMethod} />

          {/* Inline contextual CTA per method (parent's sticky footer is the primary CTA, this is the
              fallback when the user scrolls all the way down). */}
          {method === 'card' && (
            <Button
              className="w-full h-12 text-base gap-2"
              onClick={handleOnlinePayment}
              disabled={isProcessing}
            >
              {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
              {isRu ? `Оплатить ${formatPrice(chargeNow)}` : `Pay ${formatPrice(chargeNow)}`}
            </Button>
          )}

          {method === 'transfer' && (
            <ContactAdminButton
              bookingDetails={{
                propertyTitle,
                checkIn,
                checkOut,
                guests,
                totalAmount,
                depositAmount: chargeNow,
                guestName,
                guestPhone,
              }}
              className="w-full h-12 text-base gap-2"
              variant="default"
            />
          )}

          {method === 'whatsapp' && (
            <Button
              variant="default"
              className="w-full h-12 text-base gap-2"
              onClick={triggerWhatsApp}
            >
              <MessageCircle className="w-4 h-4" />
              {isRu ? 'Написать менеджеру' : 'Message manager'}
            </Button>
          )}

          <p className="text-xs text-center text-muted-foreground flex items-center justify-center gap-1">
            {method === 'card' ? (
              <>
                <Shield className="w-3 h-3" />
                {isRu ? 'Платёж защищён Stripe' : 'Payment secured by Stripe'}
              </>
            ) : method === 'transfer' ? (
              <>
                <Building2 className="w-3 h-3" />
                {isRu ? 'Менеджер пришлёт реквизиты' : 'Manager will send bank details'}
              </>
            ) : (
              <>
                <MessageCircle className="w-3 h-3" />
                {isRu ? 'Индивидуальные условия по запросу' : 'Custom terms on request'}
              </>
            )}
          </p>
        </div>
      </div>
    );
  },
);
