import React from 'react';
import { Plus } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { PriceDisplay } from '@/components/uno/PriceDisplay';
import { EXTRA_SERVICES, getExtraServiceLabel } from '@/lib/propertyTaxonomy';

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
          const serviceDef = EXTRA_SERVICES.find(s => s.id === service.id);
          const label = serviceDef
            ? (isRu ? serviceDef.labelRu : serviceDef.labelEn)
            : getExtraServiceLabel(service.id, isRu ? 'ru' : 'en');
          const icon = serviceDef?.icon || '➕';
          
          return (
            <div
              key={service.id}
              className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50"
            >
              <div className="flex items-center gap-3">
                <span className="text-lg">{icon}</span>
                <span className="text-sm font-medium">{label}</span>
              </div>
              <PriceDisplay 
                price={service.price} 
                sourceCurrency={service.currency || currency} 
                size="sm"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
