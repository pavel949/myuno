import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Car, 
  Flower2, 
  Pill, 
  Shirt, 
  Zap,
  UtensilsCrossed,
  Ship,
  MessageSquare
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

import { Badge } from '@/components/ui/badge';

interface QuickService {
  id: string;
  icon: React.ElementType;
  label: string;
  labelRu: string;
  description: string;
  descriptionRu: string;
  path: string;
  color: string;
  popular?: boolean;
}

const quickServices: QuickService[] = [
  {
    id: 'consultation',
    icon: MessageSquare,
    label: 'Consultation',
    labelRu: 'Консультация',
    description: 'Property experts',
    descriptionRu: 'Эксперты по недвижимости',
    path: '/property/consultation',
    color: 'from-violet-500 to-purple-600',
    popular: true,
  },
  {
    id: 'restaurants',
    icon: UtensilsCrossed,
    label: 'Restaurants',
    labelRu: 'Рестораны',
    description: 'Book & Order',
    descriptionRu: 'Бронь и доставка',
    path: '/restaurants',
    color: 'from-orange-500 to-red-500',
    popular: true,
  },
  {
    id: 'airport-transfer',
    icon: Car,
    label: 'Airport Transfer',
    labelRu: 'Трансфер',
    description: 'Book now',
    descriptionRu: 'Забронировать',
    path: '/transport/airport',
    color: 'from-indigo-500 to-purple-500',
    popular: true,
  },
  {
    id: 'yachts',
    icon: Ship,
    label: 'Yachts',
    labelRu: 'Яхты',
    description: 'Luxury boats',
    descriptionRu: 'Люкс лодки',
    path: '/yachts',
    color: 'from-cyan-500 to-blue-500',
    popular: true,
  },
  {
    id: 'cleaning',
    icon: Shirt,
    label: 'Cleaning',
    labelRu: 'Уборка',
    description: 'Home & Laundry',
    descriptionRu: 'Дом и прачечная',
    path: '/cleaning',
    color: 'from-emerald-500 to-green-500',
  },
  {
    id: 'pharmacy',
    icon: Pill,
    label: 'Pharmacy',
    labelRu: 'Аптека',
    description: '24/7 delivery',
    descriptionRu: 'Доставка 24/7',
    path: '/pharmacy',
    color: 'from-green-500 to-emerald-500',
  },
  {
    id: 'flowers',
    icon: Flower2,
    label: 'Flowers',
    labelRu: 'Цветы',
    description: 'Express delivery',
    descriptionRu: 'Быстрая доставка',
    path: '/flowers',
    color: 'from-rose-500 to-pink-500',
  },
];

export function QuickServicesSection() {
  const { language, t } = useLanguage();
  const navigate = useNavigate();

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="p-1.5 bg-gradient-to-br from-amber-400/20 to-orange-500/10 rounded-lg">
          <Zap className="w-5 h-5 text-amber-500" />
        </div>
        <h2 className="text-lg font-semibold">
          {t('home.quickServices')}
        </h2>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {quickServices.map((service) => {
          const Icon = service.icon;
          
          return (
            <button
              key={service.id}
              onClick={() => navigate(service.path)}
              className={cn(
                "relative flex flex-col items-center p-3 rounded-2xl",
                "bg-card border border-border/50",
                "hover:border-primary/30 hover:shadow-md",
                "transition-all active:scale-[0.97] group"
              )}
            >
              {service.popular && (
                <Badge 
                  className="absolute -top-1.5 -right-1.5 text-[8px] px-1.5 py-0.5 bg-amber-500 text-white border-0"
                >
                  {t('badge.hot')}
                </Badge>
              )}
              
              <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center mb-2",
                "bg-gradient-to-br shadow-sm",
                service.color,
                "group-hover:scale-110 transition-transform"
              )}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              
              <span className="text-xs font-medium text-center leading-tight line-clamp-1">
                {language === 'ru' ? service.labelRu : service.label}
              </span>
              
              <span className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">
                {language === 'ru' ? service.descriptionRu : service.description}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
