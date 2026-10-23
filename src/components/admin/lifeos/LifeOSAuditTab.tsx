/**
 * LifeOS Audit Log Tab
 * Per LIFE OS Contract: Log all admin actions with before/after diff
 */
import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAdminLifeSituations } from '@/hooks/useLifeOS';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { Search, History, User, FileText, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AuditLogEntry {
  id: string;
  action: string;
  admin_id: string;
  admin_email?: string;
  entity_type: string | null;
  entity_id: string | null;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  created_at: string;
  ip_address?: string;
  life_situation_code?: string;
}

const ACTION_COLORS: Record<string, string> = {
  create: 'bg-success/10 text-success border-success/20',
  update: 'bg-info/10 text-info border-info/20',
  delete: 'bg-destructive/10 text-destructive border-destructive/20',
  toggle: 'bg-warning/10 text-warning border-warning/20',
};

export function LifeOSAuditTab() {
  const { language } = useLanguage();
  const isRussian = language === 'ru';

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [situationFilter, setSituationFilter] = useState<string>('all');

  const { data: situations } = useAdminLifeSituations();

  // Fetch audit logs (using admin_audit_logs table)
  const { data: auditLogs, isLoading } = useQuery({
    queryKey: ['lifeos-audit-logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_audit_logs')
        .select('*')
        .or('entity_type.eq.life_situation,entity_type.eq.catalog_life_map')
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) throw error;
      
      return (data || []) as AuditLogEntry[];
    },
  });

  // Filter logs
  const filteredLogs = auditLogs?.filter((log) => {
    if (actionFilter !== 'all' && log.action !== actionFilter) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!log.entity_id?.toLowerCase().includes(query) && 
          !log.admin_id?.toLowerCase().includes(query)) return false;
    }
    return true;
  });

  const formatDiff = (oldData: Record<string, unknown> | null, newData: Record<string, unknown> | null) => {
    if (!oldData && !newData) return null;
    
    const changes: { field: string; from: string; to: string }[] = [];
    const allKeys = new Set([...Object.keys(oldData || {}), ...Object.keys(newData || {})]);
    
    for (const key of allKeys) {
      const oldVal = oldData?.[key];
      const newVal = newData?.[key];
      if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
        changes.push({
          field: key,
          from: oldVal !== undefined ? JSON.stringify(oldVal) : '(empty)',
          to: newVal !== undefined ? JSON.stringify(newVal) : '(deleted)',
        });
      }
    }
    
    return changes;
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <History className="w-5 h-5" />
            {isRussian ? 'Журнал аудита LifeOS' : 'LifeOS Audit Log'}
          </CardTitle>
          <CardDescription>
            {isRussian 
              ? 'История всех изменений в настройках LifeOS'
              : 'History of all LifeOS configuration changes'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder={isRussian ? 'Поиск по ID или админу...' : 'Search by ID or admin...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9"
              />
            </div>

            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-[150px] h-9">
                <SelectValue placeholder={isRussian ? 'Действие' : 'Action'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{isRussian ? 'Все действия' : 'All actions'}</SelectItem>
                <SelectItem value="create">{isRussian ? 'Создание' : 'Create'}</SelectItem>
                <SelectItem value="update">{isRussian ? 'Обновление' : 'Update'}</SelectItem>
                <SelectItem value="delete">{isRussian ? 'Удаление' : 'Delete'}</SelectItem>
                <SelectItem value="toggle">{isRussian ? 'Переключение' : 'Toggle'}</SelectItem>
              </SelectContent>
            </Select>

            <Select value={situationFilter} onValueChange={setSituationFilter}>
              <SelectTrigger className="w-[180px] h-9">
                <SelectValue placeholder={isRussian ? 'Ситуация' : 'Situation'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{isRussian ? 'Все ситуации' : 'All situations'}</SelectItem>
                {situations?.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {isRussian ? s.title_ru : s.title_en}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[180px]">{isRussian ? 'Время' : 'Time'}</TableHead>
                <TableHead>{isRussian ? 'Админ' : 'Admin'}</TableHead>
                <TableHead>{isRussian ? 'Действие' : 'Action'}</TableHead>
                <TableHead>{isRussian ? 'Сущность' : 'Entity'}</TableHead>
                <TableHead>{isRussian ? 'Изменения' : 'Changes'}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">Loading...</TableCell>
                </TableRow>
              ) : !filteredLogs?.length ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    <FileText className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p>{isRussian ? 'Нет записей аудита' : 'No audit entries'}</p>
                    <p className="text-xs mt-2">
                      {isRussian 
                        ? 'Записи появятся после изменений в LifeOS'
                        : 'Entries will appear after LifeOS changes'}
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredLogs.map((log) => {
                  const changes = formatDiff(log.old_data, log.new_data);
                  
                  return (
                    <TableRow key={log.id}>
                      <TableCell>
                        <div className="text-sm">
                          {format(new Date(log.created_at), 'dd.MM.yyyy')}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(log.created_at), 'HH:mm:ss')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <code className="text-xs">{log.admin_id.slice(0, 8)}...</code>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className={cn(ACTION_COLORS[log.action] || 'bg-muted')}
                        >
                          {log.action}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <Badge variant="secondary" className="text-xs">
                            {log.entity_type}
                          </Badge>
                          {log.entity_id && (
                            <code className="text-xs text-muted-foreground ml-2">
                              {log.entity_id.slice(0, 8)}...
                            </code>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {changes && changes.length > 0 ? (
                          <ScrollArea className="max-h-[80px]">
                            <div className="space-y-1">
                              {changes.slice(0, 3).map((change, i) => (
                                <div key={i} className="flex items-center gap-1 text-xs">
                                  <span className="font-medium">{change.field}:</span>
                                  <span className="text-muted-foreground truncate max-w-[100px]">
                                    {change.from}
                                  </span>
                                  <ArrowRight className="w-3 h-3 text-muted-foreground shrink-0" />
                                  <span className="text-foreground truncate max-w-[100px]">
                                    {change.to}
                                  </span>
                                </div>
                              ))}
                              {changes.length > 3 && (
                                <span className="text-xs text-muted-foreground">
                                  +{changes.length - 3} more
                                </span>
                              )}
                            </div>
                          </ScrollArea>
                        ) : (
                          <span className="text-xs text-muted-foreground">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Stats */}
      {filteredLogs && filteredLogs.length > 0 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground px-2">
          <span>
            {isRussian ? 'Показано' : 'Showing'} {filteredLogs.length} {isRussian ? 'записей' : 'entries'}
          </span>
          <span>
            {isRussian ? 'Последние 200 записей' : 'Last 200 entries'}
          </span>
        </div>
      )}
    </div>
  );
}
