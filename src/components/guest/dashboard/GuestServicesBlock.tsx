import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card } from '@/components/ui/card';
import { 
  Utensils, 
  Car, 
  Sparkles, 
  Stethoscope,
  ShoppingBag,
  ChevronRight,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';

const SERVICES = [
  { id: 'food', icon: Utensils, label: 'Food', labelRu: 'Еда', href: '/food', color: 'text-warning' },
  { id: 'transport', icon: Car, label: 'Transport', labelRu: 'Транспорт', href: '/transport', color: 'text-info' },
  { id: 'wellness', icon: Sparkles, label: 'Wellness', labelRu: 'Красота', href: '/wellness', color: 'text-pink-500' },
  { id: 'health', icon: Stethoscope, label: 'Health', labelRu: 'Здоровье', href: '/health', color: 'text-success' },
  { id: 'shopping', icon: ShoppingBag, label: 'Shopping', labelRu: 'Покупки', href: '/shopping', color: 'text-purple-500' },
];

export function GuestServicesBlock() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';

  return (
    <Card 
      className="p-3 cursor-pointer hover:bg-muted/50 transition-colors"
      onClick={() => navigate('/discover')}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <Zap className="h-4 w-4 text-warning" />
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {isRu ? 'Услуги' : 'Services'}
          </span>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </div>

      {/* Services grid */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {SERVICES.map((service) => {
          const Icon = service.icon;
          return (
            <div
              key={service.id}
              className="flex-shrink-0 w-14 p-2 rounded-xl bg-muted/50 hover:bg-muted text-center cursor-pointer transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                navigate(service.href);
              }}
            >
              <div className={cn("mx-auto mb-1", service.color)}>
                <Icon className="h-5 w-5 mx-auto" />
              </div>
              <p className="text-[9px] text-muted-foreground truncate">
                {isRu ? service.labelRu : service.label}
              </p>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
