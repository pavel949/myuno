import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ClipboardList, Clock, CheckCircle, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Order {
  id: string;
  service_name: string;
  service_name_ru?: string;
  order_number: string;
  status: string;
}

interface GuestOrdersBlockProps {
  activeOrders: Order[];
  loading?: boolean;
  onViewAll?: () => void;
}

const statusColors: Record<string, string> = {
  pending: 'bg-muted text-muted-foreground',
  assigned: 'bg-info/20 text-info',
  in_progress: 'bg-warning/20 text-warning',
  completed: 'bg-success/20 text-success',
};

const statusLabels: Record<string, { en: string; ru: string }> = {
  pending: { en: 'Pending', ru: 'Ожидает' },
  assigned: { en: 'Assigned', ru: 'Назначен' },
  in_progress: { en: 'In Progress', ru: 'В работе' },
  completed: { en: 'Done', ru: 'Готово' },
};

export function GuestOrdersBlock({ activeOrders, loading, onViewAll }: GuestOrdersBlockProps) {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';

  if (loading) {
    return (
      <Card className="p-3">
        <div className="flex items-center justify-between mb-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-4" />
        </div>
        <Skeleton className="h-10 w-16 mb-2" />
        <Skeleton className="h-12 w-full" />
      </Card>
    );
  }

  const hasOrders = activeOrders.length > 0;

  if (!hasOrders) {
    return (
      <Card 
        className="p-3 cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={onViewAll}
      >
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {isRu ? 'Заказы' : 'Orders'}
          </span>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="flex items-center gap-2 py-2">
          <div className="p-2 rounded-full bg-success/10">
            <CheckCircle className="h-5 w-5 text-success" />
          </div>
          <div>
            <p className="text-sm font-medium">{isRu ? 'Нет активных' : 'No active orders'}</p>
            <p className="text-xs text-muted-foreground">{isRu ? 'Закажите услугу' : 'Order a service'}</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card 
      className={cn(
        "p-3 cursor-pointer transition-colors hover:bg-muted/50",
        hasOrders && "border-warning/30"
      )}
      onClick={onViewAll}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5">
          <Clock className="h-4 w-4 text-warning" />
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {isRu ? 'Заказы' : 'Orders'}
          </span>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </div>

      {/* Count */}
      <div className="mb-2">
        <span className="text-3xl font-bold text-warning">{activeOrders.length}</span>
        <span className="text-sm text-muted-foreground ml-1.5">
          {isRu ? 'активных' : 'active'}
        </span>
      </div>

      {/* Order previews */}
      <div className="space-y-1.5">
        {activeOrders.slice(0, 2).map((order) => (
          <div 
            key={order.id}
            className="flex items-center justify-between p-2 rounded-lg bg-muted/30"
          >
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">
                {isRu ? order.service_name_ru || order.service_name : order.service_name}
              </p>
            </div>
            <Badge className={cn("text-xs flex-shrink-0", statusColors[order.status])}>
              {statusLabels[order.status]?.[isRu ? 'ru' : 'en'] || order.status}
            </Badge>
          </div>
        ))}
        {activeOrders.length > 2 && (
          <p className="text-xs text-muted-foreground text-center pt-1">
            +{activeOrders.length - 2} {isRu ? 'ещё' : 'more'}
          </p>
        )}
      </div>
    </Card>
  );
}
