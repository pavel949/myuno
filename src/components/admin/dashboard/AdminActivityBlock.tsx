import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAdminAuditLogs, ACTION_CONFIG } from '@/hooks/useAdminAuditLogs';
import { Surface } from '@/components/ui/surface';
import { Skeleton } from '@/components/ui/skeleton';
import { SectionHeader } from '@/components/ds';
import { Activity, ShoppingCart, UserPlus, FileCheck, Settings, Package, Home, Ship, Calendar, CreditCard, TicketCheck, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import { cn } from '@/lib/utils';

// Map entity types to icons
const ENTITY_ICONS: Record<string, React.ElementType> = {
  booking: ShoppingCart,
  order: ShoppingCart,
  provider: UserPlus,
  content: FileCheck,
  property: Home,
  yacht: Ship,
  tour: Calendar,
  user: UserPlus,
  payout: CreditCard,
  ticket: TicketCheck,
  settings: Settings,
  default: Package,
};

function getActionIcon(action: string, entityType: string | null): React.ElementType {
  const actionBase = action.split('.')[0];
  if (ENTITY_ICONS[actionBase]) return ENTITY_ICONS[actionBase];
  if (entityType && ENTITY_ICONS[entityType]) return ENTITY_ICONS[entityType];
  return ENTITY_ICONS.default;
}

function getActionConfig(action: string) {
  return ACTION_CONFIG[action] || {
    labelEn: action.replace(/[._]/g, ' '),
    labelRu: action.replace(/[._]/g, ' '),
    color: 'text-muted-foreground',
  };
}

export function AdminActivityBlock() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { data: logs, isLoading } = useAdminAuditLogs(5);

  if (isLoading) {
    return (
      <Surface variant="card" padding="sm" radius="xl">
        <div className="flex items-center justify-between mb-3">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-4" />
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </Surface>
    );
  }

  const activities = logs || [];

  return (
    <Surface 
      variant="card" 
      padding="sm" 
      radius="xl"
      className="cursor-pointer hover:bg-muted/50 transition-colors"
      onClick={() => navigate('/admin/analytics')}
    >
      <SectionHeader
        title={isRu ? 'Активность' : 'Activity'}
        icon={Activity}
        size="sm"
        action={{ label: isRu ? 'Все' : 'All', onClick: () => navigate('/admin/analytics') }}
        className="mb-2"
      />

      {/* Activity list */}
      <div className="space-y-2">
        {activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="p-2 rounded-full bg-muted mb-2">
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              {isRu ? 'Нет недавней активности' : 'No recent activity'}
            </p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              {isRu ? 'Действия будут отображаться здесь' : 'Actions will appear here'}
            </p>
          </div>
        ) : (
          activities.map((log) => {
            const Icon = getActionIcon(log.action, log.entity_type);
            const config = getActionConfig(log.action);
            
            return (
              <Surface 
                key={log.id}
                variant="muted"
                padding="sm"
                radius="lg"
                bordered={false}
                className="flex items-center gap-2.5"
              >
                <div className={cn("p-1.5 rounded-lg bg-muted", config.color)}>
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {isRu ? config.labelRu : config.labelEn}
                  </p>
                  {log.admin_name && (
                    <p className="text-xs text-muted-foreground truncate">
                      {log.admin_name}
                    </p>
                  )}
                </div>
                <span className="text-xs text-muted-foreground flex-shrink-0">
                  {formatDistanceToNow(new Date(log.created_at), { 
                    addSuffix: false, 
                    locale: isRu ? ru : undefined 
                  })}
                </span>
              </Surface>
            );
          })
        )}
      </div>
    </Surface>
  );
}
