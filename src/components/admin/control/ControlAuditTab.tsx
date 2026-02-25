import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuditLogs, formatAuditAction, formatEntityType } from '@/hooks/useAuditLogs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  FileText,
  Search,
  ChevronLeft,
  ChevronRight,
  User,
  Clock,
  Eye,
  Filter,
} from 'lucide-react';
import { format } from 'date-fns';

const ENTITY_TYPE_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'provider', label: 'Provider' },
  { value: 'service', label: 'Service' },
  { value: 'property', label: 'Property' },
  { value: 'project', label: 'Project' },
  { value: 'user', label: 'User' },
  { value: 'booking', label: 'Booking' },
  { value: 'order', label: 'Order' },
  { value: 'product', label: 'Product' },
];

const LIMIT = 25;

export function ControlAuditTab() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  
  const [searchQuery, setSearchQuery] = useState('');
  const [entityTypeFilter, setEntityTypeFilter] = useState('');
  const [offset, setOffset] = useState(0);
  const [selectedLog, setSelectedLog] = useState<any>(null);

  const { data, isLoading } = useAuditLogs({
    entityType: entityTypeFilter || undefined,
    action: searchQuery || undefined,
    limit: LIMIT,
    offset,
  });

  const logs = data?.logs || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / LIMIT);
  const currentPage = Math.floor(offset / LIMIT) + 1;

  const handlePrevPage = () => {
    if (offset > 0) setOffset(offset - LIMIT);
  };

  const handleNextPage = () => {
    if (offset + LIMIT < total) setOffset(offset + LIMIT);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-16" />)}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">
            {isRu ? 'Журнал аудита' : 'Audit Log'}
          </h2>
          <p className="text-sm text-muted-foreground">
            {isRu ? `Всего записей: ${total}` : `Total entries: ${total}`}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={isRu ? 'Поиск по действию...' : 'Search by action...'}
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setOffset(0); }}
            className="pl-9"
          />
        </div>
        <Select 
          value={entityTypeFilter} 
          onValueChange={(v) => { setEntityTypeFilter(v); setOffset(0); }}
        >
          <SelectTrigger className="w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder={isRu ? 'Тип сущности' : 'Entity Type'} />
          </SelectTrigger>
          <SelectContent>
            {ENTITY_TYPE_OPTIONS.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Logs List */}
      {logs.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="font-medium mb-1">
              {isRu ? 'Нет записей' : 'No audit entries'}
            </h3>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {logs.map((log) => {
                const actionInfo = formatAuditAction(log.action);
                return (
                  <div 
                    key={log.id} 
                    className="p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => setSelectedLog(log)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <Badge className={actionInfo.color}>
                            {actionInfo.label}
                          </Badge>
                          <Badge variant="outline">
                            {formatEntityType(log.entity_type)}
                          </Badge>
                          {log.entity_id && (
                            <code className="text-xs bg-muted px-1 py-0.5 rounded">
                              {log.entity_id.slice(0, 8)}...
                            </code>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {log.action}
                        </p>
                      </div>
                      <div className="text-right text-sm shrink-0">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <User className="h-3 w-3" />
                          <span>{log.admin_name || log.admin_email || 'Admin'}</span>
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground mt-1">
                          <Clock className="h-3 w-3" />
                          <span>{format(new Date(log.created_at), 'dd.MM.yyyy HH:mm')}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {total > LIMIT && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {isRu 
              ? `Страница ${currentPage} из ${totalPages}`
              : `Page ${currentPage} of ${totalPages}`}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevPage}
              disabled={offset === 0}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNextPage}
              disabled={offset + LIMIT >= total}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              {isRu ? 'Детали записи' : 'Entry Details'}
            </DialogTitle>
          </DialogHeader>

          {selectedLog && (
            <ScrollArea className="flex-1 pr-4">
              <div className="space-y-4">
                {/* Meta */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">{isRu ? 'Действие:' : 'Action:'}</span>
                    <p className="font-medium">{selectedLog.action}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">{isRu ? 'Администратор:' : 'Admin:'}</span>
                    <p>{selectedLog.admin_name || selectedLog.admin_email || 'Unknown'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">{isRu ? 'Тип сущности:' : 'Entity Type:'}</span>
                    <p>{formatEntityType(selectedLog.entity_type)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Entity ID:</span>
                    <p className="font-mono text-xs">{selectedLog.entity_id || '—'}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">{isRu ? 'Дата:' : 'Date:'}</span>
                    <p>{format(new Date(selectedLog.created_at), 'dd.MM.yyyy HH:mm:ss')}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">IP:</span>
                    <p>{selectedLog.ip_address || '—'}</p>
                  </div>
                </div>

                {/* Old Data */}
                {selectedLog.old_data && (
                  <div>
                    <h4 className="font-medium mb-2 text-accent-amber">
                      {isRu ? 'Старые данные:' : 'Old Data:'}
                    </h4>
                    <pre className="bg-accent-amber/5 p-3 rounded-lg text-xs overflow-auto max-h-48">
                      {JSON.stringify(selectedLog.old_data, null, 2)}
                    </pre>
                  </div>
                )}

                {/* New Data */}
                {selectedLog.new_data && (
                  <div>
                    <h4 className="font-medium mb-2 text-success">
                      {isRu ? 'Новые данные:' : 'New Data:'}
                    </h4>
                    <pre className="bg-success/5 p-3 rounded-lg text-xs overflow-auto max-h-48">
                      {JSON.stringify(selectedLog.new_data, null, 2)}
                    </pre>
                  </div>
                )}

                {/* User Agent */}
                {selectedLog.user_agent && (
                  <div>
                    <span className="text-muted-foreground text-sm">User Agent:</span>
                    <p className="text-xs text-muted-foreground mt-1 break-all">
                      {selectedLog.user_agent}
                    </p>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
