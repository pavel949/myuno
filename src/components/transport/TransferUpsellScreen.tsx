/**
 * TransferUpsellScreen - Shown after Fast Track booking
 * "Your assistant will escort you to the exit. Want your car waiting already?"
 * Goal: 40-70% attachment rate
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Car, ArrowRight, X, Clock, Shield } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useVehicleTypes } from '@/hooks/useTransportConfig';
import { cn } from '@/lib/utils';

interface TransferUpsellScreenProps {
  flightDate?: string;
  flightTime?: string;
  direction?: 'arrival' | 'departure';
  onSkip: () => void;
  onSelectTransfer: (vehicleType: string) => void;
}

const UPSELL_VEHICLES = [
  { type: 'sedan', icon: '🚗', labelEn: 'Sedan', labelRu: 'Седан', highlight: false },
  { type: 'van', icon: '🚐', labelEn: 'Family Van', labelRu: 'Семейный вэн', highlight: false },
  { type: 'suv', icon: '🚙', labelEn: 'Luxury SUV', labelRu: 'Премиум SUV', highlight: true },
];

export function TransferUpsellScreen({
  flightDate,
  flightTime,
  direction = 'arrival',
  onSkip,
  onSelectTransfer,
}: TransferUpsellScreenProps) {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const isRu = language === 'ru';
  const { vehicleTypes } = useVehicleTypes('airport_transfer');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed inset-0 z-50 bg-background flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="font-semibold">
          {isRu ? 'Добавить трансфер?' : 'Add a transfer?'}
        </h2>
        <button onClick={onSkip} className="p-2 rounded-full hover:bg-muted transition-colors">
          <X className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        {/* Hero message */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-none bg-primary/10 flex items-center justify-center mx-auto">
            <Car className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-bold">
              {isRu
                ? 'Ваш ассистент проведёт вас до выхода.'
                : 'Your assistant will escort you to the exit.'}
            </h3>
            <p className="text-muted-foreground mt-1">
              {isRu
                ? 'Хотите, чтобы машина уже ждала?'
                : 'Want your car waiting already?'}
            </p>
          </div>
        </div>

        {/* Benefits */}
        <div className="flex gap-3 justify-center">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Shield className="w-3.5 h-3.5 text-primary" />
            {isRu ? 'Встреча у выхода' : 'Meet at exit'}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="w-3.5 h-3.5 text-primary" />
            {isRu ? 'Без ожидания' : 'No waiting'}
          </div>
        </div>

        {/* Vehicle cards */}
        <div className="space-y-3">
          {UPSELL_VEHICLES.map((v, i) => {
            const dbVehicle = vehicleTypes.find(vt =>
              vt.type === 'airport_transfer' &&
              vt.name_en.toLowerCase().includes(v.type)
            );
            const price = dbVehicle ? Number(dbVehicle.base_price) : 0;

            return (
              <motion.button
                key={v.type}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * (i + 1) }}
                onClick={() => onSelectTransfer(v.type)}
                className={cn(
                  "w-full p-4 rounded-none border-2 flex items-center gap-4 text-left transition-all",
                  "hover:border-primary/50 hover:shadow-sm",
                  v.highlight
                    ? "border-primary/30 bg-primary/5"
                    : "border-border"
                )}
              >
                <span className="text-3xl">{v.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold">
                    {isRu ? v.labelRu : v.labelEn}
                  </p>
                  {v.highlight && (
                    <span className="text-[10px] font-semibold text-primary uppercase tracking-wide">
                      {isRu ? 'Рекомендуем' : 'Recommended'}
                    </span>
                  )}
                </div>
                <div className="text-right shrink-0">
                  {price > 0 && (
                    <p className="text-lg font-bold">฿{price.toLocaleString()}</p>
                  )}
                  <ArrowRight className="w-4 h-4 text-muted-foreground ml-auto" />
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Bottom */}
      <div className="p-4 border-t pb-safe">
        <Button
          variant="ghost"
          className="w-full text-muted-foreground"
          onClick={onSkip}
        >
          {isRu ? 'Пропустить' : 'Skip'}
        </Button>
      </div>
    </motion.div>
  );
}
