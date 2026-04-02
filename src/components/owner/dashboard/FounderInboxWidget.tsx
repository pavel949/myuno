import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Inbox, Target, Handshake, ClipboardList } from 'lucide-react';
import { useFounderInbox, type FounderInboxItem } from '@/hooks/useFounderInbox';
import { APP_ROUTES } from '@/lib/config/routes';

const SOURCE_CONFIG = {
  task: { icon: ClipboardList, color: 'bg-blue-500/10 text-blue-600', label: 'Task', labelRu: 'Задача', route: APP_ROUTES.MC_TASKS },
  deal: { icon: Handshake, color: 'bg-emerald-500/10 text-emerald-600', label: 'Deal', labelRu: 'Сделка', route: APP_ROUTES.MC_SALES },
  prospect: { icon: Target, color: 'bg-purple-500/10 text-purple-600', label: 'Prospect', labelRu: 'Проспект', route: '/mc/vendor-acquisition' },
};

const PRIORITY_BADGE: Record<string, string> = {
  high: 'bg-destructive/10 text-destructive border-destructive/20',
  medium: 'bg-warning/10 text-warning border-warning/20',
  low: 'bg-muted text-muted-foreground border-border',
};

function InboxItem({ item }: { item: FounderInboxItem }) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const navigate = useNavigate();
  const config = SOURCE_CONFIG[item.source_type];
  const Icon = config.icon;

  return (
    <button
      onClick={() => navigate(config.route)}
      className="flex items-center gap-3 w-full text-left py-2 px-2 rounded-lg hover:bg-muted/50 transition-colors"
    >
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${config.color}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{item.title}</p>
        <p className="text-xs text-muted-foreground">
          {isRu ? config.labelRu : config.label} · {item.status}
        </p>
      </div>
      <Badge variant="outline" className={`text-[10px] px-1.5 ${PRIORITY_BADGE[item.priority] || ''}`}>
        {item.priority}
      </Badge>
    </button>
  );
}

export function FounderInboxWidget() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { data: items, isLoading } = useFounderInbox(8);

  if (isLoading) {
    return <Skeleton className="h-[200px] rounded-xl" />;
  }

  if (!items?.length) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Inbox className="h-4 w-4 text-primary" />
          {isRu ? 'Входящие задачи' : 'Founder Inbox'}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-0.5">
        {items.map(item => (
          <InboxItem key={`${item.source_type}-${item.id}`} item={item} />
        ))}
      </CardContent>
    </Card>
  );
}
