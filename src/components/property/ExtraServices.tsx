import React from 'react';
import { Plus } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { PriceDisplay } from '@/components/uno/PriceDisplay';

interface ExtraService {
  id: string;
  price: number;
  currency?: string;
}

interface ExtraServicesProps {
  services: ExtraService[];
  currency?: string;
  className?: string;
}

const serviceLabels: Record<string, { en: string; ru: string; icon: string }> = {
  extra_cleaning: { en: 'Extra Cleaning', ru: 'Доп. уборка', icon: '🧹' },
  linen_change: { en: 'Linen Change', ru: 'Смена белья', icon: '🛏️' },
  airport_transfer: { en: 'Airport Transfer', ru: 'Трансфер аэропорт', icon: '✈️' },
  early_checkin: { en: 'Early Check-in', ru: 'Ранний заезд', icon: '⏰' },
  late_checkout: { en: 'Late Check-out', ru: 'Поздний выезд', icon: '🌙' },
  pool_heating: { en: 'Pool Heating', ru: 'Подогрев бассейна', icon: '🔥' },
  babysitter: { en: 'Babysitter', ru: 'Няня', icon: '👶' },
  chef: { en: 'Private Chef', ru: 'Личный повар', icon: '👨‍🍳' },
  massage: { en: 'Massage', ru: 'Массаж', icon: '💆' },
  driver: { en: 'Personal Driver', ru: 'Личный водитель', icon: '🚗' },
  tour_guide: { en: 'Tour Guide', ru: 'Гид', icon: '🗺️' },
  bike_rental: { en: 'Bike Rental', ru: 'Аренда байка', icon: '🏍️' },
  car_rental: { en: 'Car Rental', ru: 'Аренда авто', icon: '🚙' },
  laundry: { en: 'Laundry Service', ru: 'Стирка', icon: '🧺' },
  grocery_delivery: { en: 'Grocery Delivery', ru: 'Доставка продуктов', icon: '🛒' },
};

export function ExtraServices({ services, currency = 'THB', className }: ExtraServicesProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  if (!services || services.length === 0) return null;

  return (
    <div className={className}>
      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
        <Plus className="w-5 h-5 text-primary" />
        {isRu ? 'Дополнительные услуги' : 'Extra Services'}
      </h3>
      <div className="space-y-2">
        {services.map((service) => {
          const label = serviceLabels[service.id];
          return (
            <div
              key={service.id}
              className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50"
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">{label?.icon || '➕'}</span>
                <span className="text-sm font-medium">
                  {label ? (isRu ? label.ru : label.en) : service.id}
                </span>
              </div>
              <PriceDisplay 
                price={service.price} 
                currency={service.currency || currency} 
                size="sm"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
