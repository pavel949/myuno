import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Brush, Wrench, Camera, ShoppingCart, Key, FileText, Zap
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickService {
  id: string;
  icon: React.ElementType;
  labelEn: string;
  labelRu: string;
  type: string;
  color: string;
  bgColor: string;
}

const QUICK_SERVICES: QuickService[] = [
  { 
    id: 'cleaning',
    icon: Brush, 
    labelEn: 'Cleaning', 
    labelRu: 'Уборка',
    type: 'cleaning',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
  },
  { 
    id: 'repair',
    icon: Wrench, 
    labelEn: 'Repair', 
    labelRu: 'Ремонт',
    type: 'maintenance',
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
  },
  { 
    id: 'photo',
    icon: Camera, 
    labelEn: 'Photo', 
    labelRu: 'Фото',
    type: 'inspection',
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
  },
  { 
    id: 'shopping',
    icon: ShoppingCart, 
    labelEn: 'Shopping', 
    labelRu: 'Закупки',
    type: 'shopping',
    color: 'text-pink-500',
    bgColor: 'bg-pink-500/10',
  },
  { 
    id: 'keys',
    icon: Key, 
    labelEn: 'Keys', 
    labelRu: 'Ключи',
    type: 'check_in',
    color: 'text-success',
    bgColor: 'bg-success/10',
  },
  { 
    id: 'other',
    icon: FileText, 
    labelEn: 'Other', 
    labelRu: 'Другое',
    type: 'other',
    color: 'text-muted-foreground',
    bgColor: 'bg-muted',
  },
];

export function QuickServiceGrid() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const handleServiceClick = (service: QuickService) => {
    if (service.type === 'inspection') {
      navigate('/owner/inspection');
    } else {
      navigate(`/owner/service-request?type=${service.type}`);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="text-sm flex items-center gap-2">
          <Zap className="h-4 w-4 text-warning" />
          {isRu ? 'Что нужно сделать?' : 'What do you need?'}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <div className="grid grid-cols-3 gap-2">
          {QUICK_SERVICES.map((service) => (
            <button
              key={service.id}
              onClick={() => handleServiceClick(service)}
              className={cn(
                "flex flex-col items-center gap-1.5 p-3 rounded-xl",
                "border border-transparent",
                "hover:border-primary/20 hover:bg-muted/50",
                "active:scale-95 transition-all"
              )}
            >
              <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center",
                service.bgColor
              )}>
                <service.icon className={cn("h-5 w-5", service.color)} />
              </div>
              <span className="text-xs font-medium text-center">
                {isRu ? service.labelRu : service.labelEn}
              </span>
            </button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
