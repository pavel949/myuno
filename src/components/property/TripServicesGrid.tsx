import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Plane, Car, ShoppingCart, Flower2, Sparkles, 
  CreditCard, Utensils, Baby, Wifi, ArrowRight 
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface TripService {
  id: string;
  icon: React.ElementType;
  path: string;
  labelEn: string;
  labelRu: string;
  descEn: string;
  descRu: string;
  gradient: string;
  priority: number;
}

const TRIP_SERVICES: TripService[] = [
  {
    id: 'transfer',
    icon: Plane,
    path: '/transport',
    labelEn: 'Airport Transfer',
    labelRu: 'Трансфер',
    descEn: 'Meet & greet service',
    descRu: 'Встреча в аэропорту',
    gradient: 'from-primary to-primary',
    priority: 1,
  },
  {
    id: 'car_rental',
    icon: Car,
    path: '/transport?type=rental',
    labelEn: 'Rent a Car',
    labelRu: 'Аренда авто',
    descEn: 'Cars & bikes',
    descRu: 'Авто и байки',
    gradient: 'from-slate-600 to-slate-800',
    priority: 2,
  },
  {
    id: 'grocery',
    icon: ShoppingCart,
    path: '/market?category=grocery',
    labelEn: 'Groceries',
    labelRu: 'Продукты',
    descEn: 'Stock up fridge',
    descRu: 'Заполнить холодильник',
    gradient: 'from-success to-success',
    priority: 3,
  },
  {
    id: 'flowers',
    icon: Flower2,
    path: '/flowers',
    labelEn: 'Flowers',
    labelRu: 'Цветы',
    descEn: 'Welcome bouquet',
    descRu: 'Букет к приезду',
    gradient: 'from-accent to-accent',
    priority: 4,
  },
  {
    id: 'cleaning',
    icon: Sparkles,
    path: '/services?type=cleaning',
    labelEn: 'Extra Cleaning',
    labelRu: 'Уборка',
    descEn: 'During your stay',
    descRu: 'Во время проживания',
    gradient: 'from-success to-primary',
    priority: 5,
  },
  {
    id: 'bank',
    icon: CreditCard,
    path: '/banking',
    labelEn: 'Open Account',
    labelRu: 'Открыть счёт',
    descEn: 'Thai bank account',
    descRu: 'Тайский банк',
    gradient: 'from-accent to-accent',
    priority: 6,
  },
  {
    id: 'restaurant',
    icon: Utensils,
    path: '/restaurants',
    labelEn: 'Restaurants',
    labelRu: 'Рестораны',
    descEn: 'Book a table',
    descRu: 'Забронировать столик',
    gradient: 'from-accent to-red-500',
    priority: 7,
  },
  {
    id: 'babysitter',
    icon: Baby,
    path: '/babysitter',
    labelEn: 'Babysitter',
    labelRu: 'Няня',
    descEn: 'Childcare service',
    descRu: 'Присмотр за детьми',
    gradient: 'from-primary to-primary',
    priority: 8,
  },
  {
    id: 'sim',
    icon: Wifi,
    path: '/market?category=sim',
    labelEn: 'SIM Card',
    labelRu: 'SIM-карта',
    descEn: 'Stay connected',
    descRu: 'Оставайся на связи',
    gradient: 'from-primary to-primary',
    priority: 9,
  },
];

interface TripServicesGridProps {
  maxItems?: number;
  variant?: 'compact' | 'full';
  className?: string;
  bookingId?: string;
  propertyId?: string;
}

export function TripServicesGrid({
  maxItems = 6,
  variant = 'compact',
  className,
  bookingId,
  propertyId,
}: TripServicesGridProps) {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const displayServices = TRIP_SERVICES
    .sort((a, b) => a.priority - b.priority)
    .slice(0, maxItems);

  const handleServiceClick = (service: TripService) => {
    // Add booking context to URL if available
    const params = new URLSearchParams();
    if (bookingId) params.set('booking_id', bookingId);
    if (propertyId) params.set('property_id', propertyId);
    
    const separator = service.path.includes('?') ? '&' : '?';
    const url = params.toString() 
      ? `${service.path}${separator}${params.toString()}`
      : service.path;
    
    navigate(url);
  };

  if (variant === 'compact') {
    return (
      <div className={cn("space-y-3", className)}>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">
            {isRu ? '🚀 Подготовьтесь к поездке' : '🚀 Prepare for Your Trip'}
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="h-7 text-xs gap-1"
          >
            {isRu ? 'Все' : 'All'}
            <ArrowRight className="w-3 h-3" />
          </Button>
        </div>
        
        <div className="grid grid-cols-3 gap-2">
          {displayServices.map((service, index) => {
            const Icon = service.icon;
            return (
              <motion.button
                key={service.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => handleServiceClick(service)}
                className="flex flex-col items-center p-3 rounded-none bg-card border border-border hover:border-primary/30 hover:shadow-md transition-all"
              >
                <div className={cn(
                  "w-10 h-10 rounded-none flex items-center justify-center mb-2 bg-gradient-to-br",
                  service.gradient
                )}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <span className="text-xs font-medium text-center line-clamp-1">
                  {isRu ? service.labelRu : service.labelEn}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>
    );
  }

  // Full variant with descriptions
  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">
            {isRu ? '🚀 Подготовьтесь к поездке' : '🚀 Prepare for Your Trip'}
          </h3>
          <p className="text-sm text-muted-foreground">
            {isRu ? 'Закажите услуги заранее' : 'Book services in advance'}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/')}
          className="gap-1"
        >
          {isRu ? 'Все услуги' : 'All Services'}
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {displayServices.map((service, index) => {
          const Icon = service.icon;
          return (
            <motion.button
              key={service.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => handleServiceClick(service)}
              className="flex flex-col items-center p-4 rounded-none bg-card border border-border hover:border-primary/30 hover:shadow-lg transition-all group"
            >
              <div className={cn(
                "w-12 h-12 rounded-none flex items-center justify-center mb-3 bg-gradient-to-br group-hover:scale-110 transition-transform",
                service.gradient
              )}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <span className="font-medium text-sm text-center">
                {isRu ? service.labelRu : service.labelEn}
              </span>
              <span className="text-xs text-muted-foreground text-center mt-0.5 line-clamp-1">
                {isRu ? service.descRu : service.descEn}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
