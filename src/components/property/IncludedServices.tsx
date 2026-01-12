import React from 'react';
import { Check } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface IncludedServicesProps {
  services: string[];
  className?: string;
}

const serviceLabels: Record<string, { en: string; ru: string; icon: string }> = {
  wifi: { en: 'WiFi', ru: 'WiFi', icon: '📶' },
  ac: { en: 'Air Conditioning', ru: 'Кондиционер', icon: '❄️' },
  cleaning_weekly: { en: 'Weekly Cleaning', ru: 'Уборка еженедельно', icon: '🧹' },
  cleaning_daily: { en: 'Daily Cleaning', ru: 'Уборка ежедневно', icon: '🧹' },
  cleaning_biweekly: { en: 'Biweekly Cleaning', ru: 'Уборка раз в 2 недели', icon: '🧹' },
  linen: { en: 'Linen Change', ru: 'Смена белья', icon: '🛏️' },
  pool: { en: 'Pool Access', ru: 'Бассейн', icon: '🏊' },
  gym: { en: 'Gym Access', ru: 'Тренажёрный зал', icon: '🏋️' },
  parking: { en: 'Parking', ru: 'Парковка', icon: '🅿️' },
  security: { en: '24/7 Security', ru: 'Охрана 24/7', icon: '🛡️' },
  water: { en: 'Water Included', ru: 'Вода включена', icon: '💧' },
  electricity: { en: 'Electricity Included', ru: 'Электричество включено', icon: '⚡' },
  gas: { en: 'Gas Included', ru: 'Газ включён', icon: '🔥' },
  tv: { en: 'Cable TV', ru: 'Кабельное ТВ', icon: '📺' },
  netflix: { en: 'Netflix', ru: 'Netflix', icon: '🎬' },
  kitchen: { en: 'Full Kitchen', ru: 'Полная кухня', icon: '👨‍🍳' },
  washer: { en: 'Washer', ru: 'Стиральная машина', icon: '🧺' },
  dryer: { en: 'Dryer', ru: 'Сушилка', icon: '🌀' },
  iron: { en: 'Iron', ru: 'Утюг', icon: '👔' },
  garden: { en: 'Garden', ru: 'Сад', icon: '🌳' },
  bbq: { en: 'BBQ Area', ru: 'Зона барбекю', icon: '🍖' },
};

export function IncludedServices({ services, className }: IncludedServicesProps) {
  const { language, t } = useLanguage();
  const isRu = language === 'ru';

  if (!services || services.length === 0) return null;

  return (
    <div className={className}>
      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
        <Check className="w-5 h-5 text-primary" />
        {isRu ? 'Что включено' : "What's Included"}
      </h3>
      <div className="grid grid-cols-2 gap-2">
        {services.map((service) => {
          const label = serviceLabels[service];
          return (
            <div
              key={service}
              className="flex items-center gap-2 p-2.5 rounded-lg bg-primary/5 border border-primary/10"
            >
              <span className="text-lg">{label?.icon || '✓'}</span>
              <span className="text-sm font-medium">
                {label ? (isRu ? label.ru : label.en) : service}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
