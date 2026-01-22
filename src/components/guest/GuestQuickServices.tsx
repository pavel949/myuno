import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Utensils, 
  Car, 
  Sparkles, 
  Stethoscope,
  ShoppingBag,
  Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickService {
  id: string;
  icon: React.ElementType;
  title: string;
  titleRu: string;
  href: string;
  color: string;
}

const quickServices: QuickService[] = [
  { 
    id: 'food',
    icon: Utensils, 
    title: 'Food', 
    titleRu: 'Еда',
    href: '/food',
    color: 'text-warning'
  },
  { 
    id: 'transport',
    icon: Car, 
    title: 'Transport', 
    titleRu: 'Транспорт',
    href: '/transport',
    color: 'text-info'
  },
  { 
    id: 'health',
    icon: Stethoscope, 
    title: 'Health', 
    titleRu: 'Здоровье',
    href: '/health',
    color: 'text-success'
  },
  { 
    id: 'shopping',
    icon: ShoppingBag, 
    title: 'Shopping', 
    titleRu: 'Покупки',
    href: '/shopping',
    color: 'text-purple-500'
  },
];

export function GuestQuickServices() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Zap className="h-4 w-4 text-warning" />
          {isRu ? 'Быстрые услуги' : 'Quick Services'}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-5 gap-2">
          {quickServices.map((service) => (
            <Button
              key={service.id}
              variant="ghost"
              className="h-auto flex-col gap-1.5 py-3 px-2 hover:bg-muted"
              onClick={() => navigate(service.href)}
            >
              <div className={cn(
                "p-2 rounded-full bg-muted",
                service.color
              )}>
                <service.icon className="h-4 w-4" />
              </div>
              <span className="text-[10px] font-medium leading-tight text-center">
                {isRu ? service.titleRu : service.title}
              </span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
