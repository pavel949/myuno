import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { resolveIcon } from '@/lib/iconMap';
import type { BaseStepProps } from './types';

const stepVariants = {
  enter: { opacity: 0, x: 40 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -40 },
};

interface VehicleType {
  id: string;
  name_ru: string;
  name_en: string;
  icon?: string | null;
  base_price: number;
  price_multiplier: number;
  max_passengers: number;
  eta_minutes?: number | null;
}

interface StepVehicleProps extends BaseStepProps {
  vehicleTypes: VehicleType[];
  routeBasePrice: number;
}

export function StepVehicle({ formData, setFormData, language, vehicleTypes, routeBasePrice }: StepVehicleProps) {
  return (
    <motion.div
      key="step-vehicle"
      variants={stepVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.25 }}
      className="space-y-3"
    >
      <p className="text-sm text-muted-foreground">
        {language === 'ru' ? 'Выберите автомобиль' : 'Choose your vehicle'}
      </p>

      <div className="space-y-2">
        {vehicleTypes.map((vehicle) => {
          const price = routeBasePrice > 0
            ? Math.round(routeBasePrice * vehicle.price_multiplier)
            : vehicle.base_price;
          const Icon = resolveIcon(vehicle.icon || '🚗');
          const isSelected = formData.vehicleType === vehicle.id;

          return (
            <button
              key={vehicle.id}
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, vehicleType: vehicle.id }))}
              className={cn(
                'w-full flex items-center gap-3 p-4 rounded-none border-2 transition-all text-left',
                isSelected
                  ? 'border-primary bg-primary/10'
                  : 'border-border/50 bg-card hover:border-primary/30',
              )}
            >
              <div className={cn(
                'w-12 h-12 rounded-none flex items-center justify-center shrink-0',
                isSelected ? 'bg-primary/20' : 'bg-muted',
              )}>
                <Icon className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">
                  {language === 'ru' ? vehicle.name_ru : vehicle.name_en}
                </p>
                <p className="text-xs text-muted-foreground">
                  {language === 'ru' ? `до ${vehicle.max_passengers} пасс.` : `up to ${vehicle.max_passengers} pax`}
                  {vehicle.eta_minutes ? ` · ~${vehicle.eta_minutes} ${language === 'ru' ? 'мин' : 'min'}` : ''}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-bold text-base text-foreground">฿{price.toLocaleString()}</p>
              </div>
              {isSelected && <Check className="w-5 h-5 text-primary shrink-0" />}
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}
