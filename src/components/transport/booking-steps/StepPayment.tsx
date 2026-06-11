import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plane, MapPin, ArrowRight, Clock, Shield, CreditCard, Banknote, Handshake, Check } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import type { BaseStepProps, TransferPaymentMethod } from './types';

const stepVariants = {
  enter: { opacity: 0, x: 40 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -40 },
};

interface StepPaymentProps extends BaseStepProps {
  basePrice: number;
  nightSurcharge: number;
  totalPrice: number;
  selectedVehicleLabel: string | undefined;
  selectedDestinationDuration?: number | null;
}

export function StepPayment({
  formData,
  setFormData,
  language,
  basePrice,
  nightSurcharge,
  totalPrice,
  selectedVehicleLabel,
  selectedDestinationDuration,
}: StepPaymentProps) {
  const navigate = useNavigate();

  const paymentOptions: Array<{
    key: TransferPaymentMethod;
    icon: typeof CreditCard;
    iconClass: string;
    label: string;
    sub: string;
  }> = [
    { key: 'stripe', icon: CreditCard, iconClass: 'text-primary', label: language === 'ru' ? 'Картой' : 'Card', sub: 'Visa, MC' },
    { key: 'cash', icon: Banknote, iconClass: 'text-success', label: language === 'ru' ? 'Наличные' : 'Cash', sub: language === 'ru' ? 'Водителю' : 'To driver' },
    { key: 'concierge_advance', icon: Handshake, iconClass: 'text-warning', label: 'myUNO', sub: language === 'ru' ? '0% ком.' : '0% fee' },
  ];

  return (
    <motion.div
      key="step-payment"
      variants={stepVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.25 }}
      className="space-y-5"
    >
      {/* Summary card */}
      <div className="p-3 rounded-none bg-muted/50 border border-border/50 space-y-2">
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-0.5">
              {formData.direction === 'from-airport' ? (
                <><Plane className="w-3 h-3" /><ArrowRight className="w-2.5 h-2.5" /><MapPin className="w-3 h-3" /></>
              ) : (
                <><MapPin className="w-3 h-3" /><ArrowRight className="w-2.5 h-2.5" /><Plane className="w-3 h-3" /></>
              )}
            </div>
            <p className="text-sm font-medium truncate">{formData.destinationAddress}</p>
            <p className="text-xs text-muted-foreground">
              {selectedVehicleLabel}
              {selectedDestinationDuration && ` · ~${selectedDestinationDuration} ${language === 'ru' ? 'мин' : 'min'}`}
            </p>
          </div>
          <p className="font-bold text-lg shrink-0">฿{totalPrice.toLocaleString()}</p>
        </div>
        {(nightSurcharge > 0 || basePrice !== totalPrice) && (
          <div className="pt-2 border-t border-border/50 space-y-1 text-xs">
            <div className="flex justify-between text-muted-foreground">
              <span>{language === 'ru' ? 'Базовый тариф' : 'Base fare'}</span>
              <span>฿{basePrice.toLocaleString()}</span>
            </div>
            {nightSurcharge > 0 && (
              <div className="flex justify-between text-warning">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {language === 'ru' ? 'Ночной тариф (22:00–06:00)' : 'Night surcharge (22:00–06:00)'}
                </span>
                <span>+฿{nightSurcharge.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between font-semibold text-foreground pt-1 border-t border-border/30">
              <span>{language === 'ru' ? 'Итого' : 'Total'}</span>
              <span>฿{totalPrice.toLocaleString()}</span>
            </div>
          </div>
        )}
      </div>

      {/* Fast track upsell */}
      <button
        type="button"
        onClick={() => navigate('/transport/fast-track')}
        className="w-full p-3 rounded-none border border-primary/20 bg-primary/5 flex items-center gap-3 text-left hover:bg-primary/10 transition-colors"
      >
        <Shield className="w-5 h-5 text-primary shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold">
            {language === 'ru' ? 'Fast Track — без очередей' : 'Fast Track — skip queues'}
          </p>
          <p className="text-xs text-muted-foreground">
            {language === 'ru' ? 'от ฿2,500' : 'from ฿2,500'}
          </p>
        </div>
        <ArrowRight className="w-4 h-4 text-primary shrink-0" />
      </button>

      {/* Payment method */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-muted-foreground">
          {language === 'ru' ? 'Способ оплаты' : 'Payment Method'}
        </Label>
        <div className="grid grid-cols-3 gap-2">
          {paymentOptions.map(pm => (
            <button
              key={pm.key}
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, paymentMethod: pm.key }))}
              className={cn(
                'p-3 rounded-none border-2 transition-all text-left relative',
                formData.paymentMethod === pm.key
                  ? 'border-primary bg-primary/10'
                  : 'border-border/50 bg-card hover:border-primary/50',
              )}
            >
              {formData.paymentMethod === pm.key && (
                <div className="absolute top-2 right-2"><Check className="w-3 h-3 text-primary" /></div>
              )}
              <pm.icon className={cn('w-4 h-4 mb-1', pm.iconClass)} />
              <p className="font-medium text-xs">{pm.label}</p>
              <p className="text-[10px] text-muted-foreground">{pm.sub}</p>
            </button>
          ))}
        </div>
        {formData.paymentMethod === 'cash' && (
          <p className="text-xs text-muted-foreground p-2 bg-success/10 rounded-none">
            {language === 'ru'
              ? 'Оплата наличными водителю при встрече. THB или USD.'
              : 'Pay cash to the driver upon meeting. THB or USD.'}
          </p>
        )}
        {formData.paymentMethod === 'concierge_advance' && (
          <p className="text-xs text-muted-foreground p-2 bg-warning/10 rounded-none">
            {language === 'ru'
              ? 'myUNO оплатит трансфер. Вы вернёте сумму после поездки удобным способом.'
              : 'myUNO will pay for your transfer. Return the amount after your trip.'}
          </p>
        )}
      </div>
    </motion.div>
  );
}
