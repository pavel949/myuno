/**
 * MC Statement Approvals page — list & track owner statement approval flow.
 * Route: /mc/finance/statement-approvals
 */
import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCompanyStatementApprovals } from '@/hooks/useStatementApprovals';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/uno/LoadingSpinner';
import { FileCheck, Clock, CheckCircle2, XCircle, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export default function StatementApprovalsPage() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { data: items = [], isLoading } = useCompanyStatementApprovals();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const stats = {
    pending: items.filter(i => i.status === 'pending').length,
    approved: items.filter(i => i.status === 'approved').length,
    rejected: items.filter(i => i.status === 'rejected').length,
  };

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6 pb-24">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <FileCheck className="w-5 h-5 text-primary" />
          <h1 className="text-xl md:text-2xl font-bold">
            {isRu ? 'Одобрения отчётов' : 'Statement Approvals'}
          </h1>
        </div>
        <p className="text-sm text-muted-foreground">
          {isRu
            ? 'Отслеживайте одобрение ежемесячных отчётов собственниками.'
            : 'Track owner approvals of monthly statements.'}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard label={isRu ? 'Ожидают' : 'Pending'} value={stats.pending} cls="text-warning" Icon={Clock} />
        <StatCard label={isRu ? 'Одобрено' : 'Approved'} value={stats.approved} cls="text-success" Icon={CheckCircle2} />
        <StatCard label={isRu ? 'Отклонено' : 'Rejected'} value={stats.rejected} cls="text-destructive" Icon={XCircle} />
      </div>

      {/* List */}
      {items.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center text-muted-foreground">
            <FileCheck className="w-10 h-10 opacity-30 mx-auto mb-3" />
            <p className="text-sm">
              {isRu
                ? 'Пока нет отправленных отчётов на одобрение.'
                : 'No statements sent for approval yet.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {items.map(item => {
            const cfgMap: Record<string, { label: string; cls: string; Icon: typeof Clock }> = {
              pending: { label: isRu ? 'Ожидает' : 'Pending', cls: 'bg-warning/15 text-warning', Icon: Clock },
              approved: { label: isRu ? 'Одобрено' : 'Approved', cls: 'bg-success/15 text-success', Icon: CheckCircle2 },
              rejected: { label: isRu ? 'Отклонено' : 'Rejected', cls: 'bg-destructive/15 text-destructive', Icon: XCircle },
              expired: { label: isRu ? 'Истёк' : 'Expired', cls: 'bg-muted text-muted-foreground', Icon: Clock },
            };
            const cfg = cfgMap[item.status];
            const Icon = cfg.Icon;
            return (
              <Card key={item.id}>
                <CardContent className="p-4 flex flex-wrap items-center gap-3">
                  <Badge variant="outline" className={cn('text-xs gap-1', cfg.cls)}>
                    <Icon className="w-3 h-3" />
                    {cfg.label}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">
                      {format(new Date(item.period_start), 'd MMM', { locale: isRu ? ru : undefined })} –{' '}
                      {format(new Date(item.period_end), 'd MMM yyyy', { locale: isRu ? ru : undefined })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {isRu ? 'Отправлено: ' : 'Sent: '}
                      {format(new Date(item.created_at), 'd MMM HH:mm', { locale: isRu ? ru : undefined })}
                      {item.signed_at && ` · ${isRu ? 'подписано' : 'signed'} ${format(new Date(item.signed_at), 'd MMM HH:mm', { locale: isRu ? ru : undefined })}`}
                    </p>
                    {item.rejection_reason && (
                      <p className="text-xs text-destructive mt-1">⚠️ {item.rejection_reason}</p>
                    )}
                  </div>
                  {item.net_amount != null && (
                    <span className="text-sm font-semibold tabular-nums">
                      {item.net_amount.toLocaleString()} {item.currency || 'THB'}
                    </span>
                  )}
                  {item.statement_url && (
                    <a href={item.statement_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                    </a>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, cls, Icon }: { label: string; value: number; cls: string; Icon: typeof Clock }) {
  return (
    <Card>
      <CardContent className="p-3 space-y-1">
        <div className={cn('flex items-center gap-1.5 text-xs', cls)}>
          <Icon className="w-3.5 h-3.5" />
          <span>{label}</span>
        </div>
        <p className="text-2xl font-bold tabular-nums">{value}</p>
      </CardContent>
    </Card>
  );
}
