/**
 * ControlLogsTab — real recent-activity feed for the admin Control Center.
 *
 * Pulls the latest entries from `admin_audit_logs` (the same source as
 * the Audit tab, trimmed to the 50 most recent rows and presented as a
 * compact timeline). Manual «Refresh» button — no auto-polling so we
 * don't quietly hit the DB while the tab is open in the background.
 *
 * Previously this file displayed a 5-row hardcoded mock list with a
 * «Live» badge — it never reflected anything real. Replaced because
 * fake-but-real-looking data erodes admin trust in the panel.
 */
import { useAuditLogs, formatAuditAction, formatEntityType } from '@/hooks/useAuditLogs';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { FileText, RefreshCw, Inbox, User } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { ru, enUS } from 'date-fns/locale';

const RECENT_LIMIT = 50;

export function ControlLogsTab() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const locale = isRu ? ru : enUS;

  const { data, isLoading, isFetching, refetch } = useAuditLogs({ limit: RECENT_LIMIT });

  const logs = data?.logs || [];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {isRu ? 'Последние действия' : 'Recent activity'}
              {!isLoading && logs.length > 0 && (
                <Badge variant="outline" className="ml-2 font-mono text-xs">
                  {logs.length}
                </Badge>
              )}
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
              className="gap-1.5"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} />
              {isRu ? 'Обновить' : 'Refresh'}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {isRu
              ? `Последние ${RECENT_LIMIT} записей из admin_audit_logs. Нажмите «Обновить» для свежих данных.`
              : `Last ${RECENT_LIMIT} entries from admin_audit_logs. Click «Refresh» for fresh data.`}
          </p>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="p-3 rounded-full bg-muted/40 mb-3">
                <Inbox className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium">
                {isRu ? 'Пока нет записей в журнале' : 'No audit entries yet'}
              </p>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                {isRu
                  ? 'Здесь появятся действия админов: создание, редактирование, одобрение, удаление сущностей.'
                  : 'Admin actions will appear here: create, edit, approve, delete events on entities.'}
              </p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {logs.map((log) => {
                const actionMeta = formatAuditAction(log.action);
                const entityLabel = formatEntityType(log.entity_type);
                const actor = log.admin_name || log.admin_email || (isRu ? 'Админ' : 'Admin');
                const ts = new Date(log.created_at);
                return (
                  <div
                    key={log.id}
                    className="flex items-start gap-3 p-2.5 rounded-none bg-muted/40 hover:bg-muted transition-colors text-sm"
                  >
                    <Badge className={`${actionMeta.color} whitespace-nowrap shrink-0`}>
                      {actionMeta.label}
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">{entityLabel}</span>
                        {log.entity_id && (
                          <span className="font-mono text-[10.5px] truncate max-w-[180px]" title={log.entity_id}>
                            {log.entity_id.slice(0, 8)}
                          </span>
                        )}
                        <span className="opacity-50">·</span>
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {actor}
                        </span>
                      </div>
                      <div className="text-xs font-mono text-muted-foreground mt-0.5" title={format(ts, 'yyyy-MM-dd HH:mm:ss')}>
                        {formatDistanceToNow(ts, { addSuffix: true, locale })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
