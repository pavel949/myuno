import React from 'react';
import { Check } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { INCLUDED_SERVICES, getIncludedServiceLabel } from '@/lib/propertyTaxonomy';

interface IncludedServicesProps {
  services: string[];
  className?: string;
}

export function IncludedServices({ services, className }: IncludedServicesProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  if (!services || services.length === 0) return null;

  return (
    <div className={className}>
      <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
        <Check className="w-5 h-5 text-primary" />
        {isRu ? 'Что включено' : "What's Included"}
      </h3>
      <div className="grid grid-cols-2 gap-2">
        {services.map((serviceId) => {
          const service = INCLUDED_SERVICES.find(s => s.id === serviceId);
          const label = service 
            ? (isRu ? service.labelRu : service.labelEn)
            : getIncludedServiceLabel(serviceId, isRu ? 'ru' : 'en');
          const icon = service?.icon || '✓';
          
          return (
            <div
              key={serviceId}
              className="flex items-center gap-2 p-2.5 rounded-lg bg-primary/5 border border-primary/10"
            >
              <span className="text-lg">{icon}</span>
              <span className="text-sm font-medium">{label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
