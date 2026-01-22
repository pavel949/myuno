import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAdminDashboardStats } from '@/hooks/useAdminDashboardStats';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Clock, Users, Package, FileText, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const TASK_TYPES = {
  pendingBookings: { icon: Clock, label: 'Bookings', labelRu: 'Заказы', color: 'text-warning', bg: 'bg-warning/10' },
  pendingModeration: { icon: FileText, label: 'Moderation', labelRu: 'Модерация', color: 'text-info', bg: 'bg-info/10' },
  providers: { icon: Users, label: 'Providers', labelRu: 'Провайдеры', color: 'text-success', bg: 'bg-success/10' },
  services: { icon: Package, label: 'Services', labelRu: 'Услуги', color: 'text-primary', bg: 'bg-primary/10' },
};

export function AdminTodayBlock() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { data, isLoading } = useAdminDashboardStats();

  if (isLoading) {
    return (
      <Card className="p-3">
        <div className="flex items-center justify-between mb-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-4" />
        </div>
        <Skeleton className="h-10 w-20 mb-2" />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-6 w-16" />
        </div>
      </Card>
    );
  }

  const pendingCount = (data?.pendingBookings || 0) + (data?.pendingContent || 0);
  const hasPending = pendingCount > 0;

  return (
    <Card 
      className={cn(
        "p-3 cursor-pointer transition-colors hover:bg-muted/50",
        hasPending && "border-warning/30"
      )}
      onClick={() => navigate('/admin/operations')}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {isRu ? 'Сегодня' : 'Today'}
        </span>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </div>

      {/* Hero metric */}
      <div className="mb-2">
        <span className={cn(
          "text-3xl font-bold",
          hasPending ? "text-warning" : "text-success"
        )}>
          {pendingCount}
        </span>
        <span className="text-sm text-muted-foreground ml-1.5">
          {isRu ? 'ожидает' : 'pending'}
        </span>
      </div>

      {/* Task pills */}
      <div className="flex flex-wrap gap-1.5">
        {data?.pendingBookings && data.pendingBookings > 0 && (
          <div className={cn(
            "flex items-center gap-1 px-2 py-0.5 rounded-full text-xs",
            TASK_TYPES.pendingBookings.bg, TASK_TYPES.pendingBookings.color
          )}>
            <Clock className="h-3 w-3" />
            <span>{data.pendingBookings}</span>
          </div>
        )}
        {data?.pendingContent && data.pendingContent > 0 && (
          <div className={cn(
            "flex items-center gap-1 px-2 py-0.5 rounded-full text-xs",
            TASK_TYPES.pendingModeration.bg, TASK_TYPES.pendingModeration.color
          )}>
            <FileText className="h-3 w-3" />
            <span>{data.pendingContent}</span>
          </div>
        )}
      </div>

      {!hasPending && (
        <p className="text-xs text-muted-foreground">
          {isRu ? 'Всё обработано ✓' : 'All clear ✓'}
        </p>
      )}
    </Card>
  );
}
