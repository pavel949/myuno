import React from 'react';
import { useLocation } from '@/contexts/LocationContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  Users, 
  Thermometer, 
  DollarSign, 
  Clock, 
  Globe2, 
  MapPin 
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickFact {
  icon: React.ElementType;
  label: string;
  value: string;
}

// Quick facts data by city slug (extendable)
const cityQuickFacts: Record<string, { en: QuickFact[]; ru: QuickFact[] }> = {
  phuket: {
    en: [
      { icon: MapPin, label: 'Location', value: 'Andaman Sea, Thailand' },
      { icon: Users, label: 'Population', value: '~400,000' },
      { icon: Thermometer, label: 'Climate', value: '28°C average' },
      { icon: DollarSign, label: 'Currency', value: 'Thai Baht (฿)' },
      { icon: Clock, label: 'Timezone', value: 'UTC+7' },
      { icon: Globe2, label: 'Language', value: 'Thai, English' },
    ],
    ru: [
      { icon: MapPin, label: 'Расположение', value: 'Андаманское море, Таиланд' },
      { icon: Users, label: 'Население', value: '~400,000' },
      { icon: Thermometer, label: 'Климат', value: '28°C в среднем' },
      { icon: DollarSign, label: 'Валюта', value: 'Тайский бат (฿)' },
      { icon: Clock, label: 'Часовой пояс', value: 'UTC+7' },
      { icon: Globe2, label: 'Язык', value: 'Тайский, английский' },
    ],
  },
};

export function QuickFactsGrid() {
  const { currentCity } = useLocation();
  const { language } = useLanguage();

  const facts = currentCity?.slug 
    ? cityQuickFacts[currentCity.slug]?.[language as 'en' | 'ru'] || cityQuickFacts[currentCity.slug]?.en
    : null;

  if (!facts) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {facts.map((fact, index) => (
        <QuickFactItem key={index} {...fact} />
      ))}
    </div>
  );
}

function QuickFactItem({ icon: Icon, label, value }: QuickFact) {
  return (
    <div className="bg-muted/50 rounded-none p-3 flex items-center gap-3">
      <div className="p-2 bg-primary/10 rounded-none">
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground truncate">{label}</p>
        <p className="text-sm font-medium text-foreground truncate">{value}</p>
      </div>
    </div>
  );
}
