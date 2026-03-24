import React, { useState } from 'react';
import { CreditCard, MessageCircle, Loader2, Shield, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ContactAdminButton } from './ContactAdminButton';
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
  cleaningFee?: number;
  guestName: string;
  guestPhone: string;
  guestEmail: string;
  providerOrgId?: string;
  onSuccess?: () => void;
}

export function DepositPaymentOptions({
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
  onSuccess,
}: DepositPaymentOptionsProps) {
  const { language } = useLanguage();
  const { formatPrice } = useCurrency();
  const isRu = language === 'ru';
  const [isProcessing, setIsProcessing] = useState(false);

  const depositAmount = Math.round(totalAmount * 0.1);
  const remainingAmount = totalAmount - depositAmount;

  const handleOnlinePayment = async () => {
    setIsProcessing(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('create-property-deposit-checkout', {
        body: {
          property_id: propertyId,
          property_title: propertyTitle,
          check_in: format(checkIn, 'yyyy-MM-dd'),
          check_out: format(checkOut, 'yyyy-MM-dd'),
          guests,
          nights,
          total_amount: totalAmount,
          deposit_amount: depositAmount,
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
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error(isRu ? 'Ошибка при создании платежа' : 'Error creating payment');
    } finally {
      setIsProcessing(false);
    }
  };

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
                {format(checkIn, 'd MMM', { locale: isRu ? ru : undefined })} — {format(checkOut, 'd MMM', { locale: isRu ? ru : undefined })}
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

      {/* Deposit Info */}
      <Card className="border-success/30 bg-success/5">
        <CardContent className="p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-medium">{isRu ? 'Предоплата 10%' : '10% Deposit'}</span>
            <span className="text-xl font-bold text-success">{formatPrice(depositAmount)}</span>
          </div>
          <p className="text-xs text-muted-foreground">
            {isRu 
              ? 'Невозвратная предоплата для подтверждения бронирования' 
              : 'Non-refundable deposit to confirm your booking'}
          </p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
            <AlertCircle className="w-3 h-3" />
            <span>{isRu ? `Остаток ${formatPrice(remainingAmount)} оплачивается при заезде` : `Remaining ${formatPrice(remainingAmount)} paid at check-in`}</span>
          </div>
        </CardContent>
      </Card>

      {/* Payment Options */}
      <div className="space-y-3">
        <h3 className="font-semibold text-sm">
          {isRu ? 'Выберите способ оплаты предоплаты' : 'Choose deposit payment method'}
        </h3>
        
        {/* Online Payment */}
        <Button
          className="w-full h-12 text-base gap-2"
          onClick={handleOnlinePayment}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <CreditCard className="w-4 h-4" />
          )}
          {isRu ? `Оплатить онлайн ${formatPrice(depositAmount)}` : `Pay Online ${formatPrice(depositAmount)}`}
        </Button>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <Separator className="w-full" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              {isRu ? 'или' : 'or'}
            </span>
          </div>
        </div>

        {/* Offline Payment */}
        <ContactAdminButton
          bookingDetails={{
            propertyTitle,
            checkIn,
            checkOut,
            guests,
            totalAmount,
            depositAmount,
            guestName,
            guestPhone,
          }}
          className="w-full h-12 text-base"
          variant="outline"
        />

        <p className="text-xs text-center text-muted-foreground">
          {isRu 
            ? 'При оффлайн-оплате свяжитесь с командой myUNO для обсуждения способа оплаты' 
            : 'For offline payment, contact myUNO team to discuss payment options'}
        </p>
      </div>
    </div>
  );
}
