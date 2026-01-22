import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Activity, UserPlus, ShoppingCart, FileCheck, ChevronRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import { cn } from '@/lib/utils';

// Mock recent activity - in production this would come from admin_audit_logs
const MOCK_ACTIVITY = [
  { id: '1', type: 'booking', icon: ShoppingCart, label: 'New booking', labelRu: 'Новый заказ', time: new Date(Date.now() - 1000 * 60 * 30), color: 'text-success' },
  { id: '2', type: 'provider', icon: UserPlus, label: 'Provider registered', labelRu: 'Провайдер зарегистрирован', time: new Date(Date.now() - 1000 * 60 * 120), color: 'text-info' },
  { id: '3', type: 'moderation', icon: FileCheck, label: 'Content approved', labelRu: 'Контент одобрен', time: new Date(Date.now() - 1000 * 60 * 180), color: 'text-primary' },
];

export function AdminActivityBlock() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';

  // In production, replace with actual hook
  const isLoading = false;
  const activities = MOCK_ACTIVITY;

  if (isLoading) {
    return (
      <Card className="p-3">
        <div className="flex items-center justify-between mb-3">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-4" />
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card 
      className="p-3 cursor-pointer hover:bg-muted/50 transition-colors"
      onClick={() => navigate('/admin/analytics')}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <Activity className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {isRu ? 'Активность' : 'Activity'}
          </span>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </div>

      {/* Activity list */}
      <div className="space-y-2">
        {activities.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            {isRu ? 'Нет недавней активности' : 'No recent activity'}
          </p>
        ) : (
          activities.map((activity) => {
            const Icon = activity.icon;
            return (
              <div 
                key={activity.id}
                className="flex items-center gap-2.5 p-2 rounded-lg bg-muted/30"
              >
                <div className={cn("p-1.5 rounded-lg bg-muted", activity.color)}>
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {isRu ? activity.labelRu : activity.label}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground flex-shrink-0">
                  {formatDistanceToNow(activity.time, { 
                    addSuffix: false, 
                    locale: isRu ? ru : undefined 
                  })}
                </span>
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
}
