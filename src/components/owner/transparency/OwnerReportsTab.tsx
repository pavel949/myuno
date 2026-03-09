import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, Calendar, Download, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { ru, enUS } from 'date-fns/locale';
import { ReportDetailSheet } from '@/components/owner/reports/ReportDetailSheet';
import type { PropertyReport } from '@/hooks/usePropertyReports';

interface Props {
  propertyId: string;
}

export function OwnerReportsTab({ propertyId }: Props) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const [viewReport, setViewReport] = useState<PropertyReport | null>(null);

  const { data: reports, isLoading } = useQuery({
    queryKey: ['owner-transparency-reports', propertyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('property_reports')
        .select('*, property:properties(id, title_en, title_ru)')
        .eq('property_id', propertyId)
        .in('status', ['ready', 'sent', 'viewed'])
        .order('period_end', { ascending: false })
        .limit(20);
      if (error) throw error;
      return (data || []) as PropertyReport[];
    },
    enabled: !!propertyId,
  });

  const getStatusLabel = (status: string) => {
    const map: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
      ready: { label: isRu ? 'Готов' : 'Ready', variant: 'default' },
      sent: { label: isRu ? 'Отправлен' : 'Sent', variant: 'default' },
      viewed: { label: isRu ? 'Просмотрен' : 'Viewed', variant: 'secondary' },
    };
    return map[status] || { label: status, variant: 'outline' as const };
  };

  const getTypeLabel = (type: string) => {
    const map: Record<string, string> = {
      monthly: isRu ? 'Ежемесячный' : 'Monthly',
      quarterly: isRu ? 'Квартальный' : 'Quarterly',
      annual: isRu ? 'Годовой' : 'Annual',
      owner_statement: isRu ? 'Отчёт собственнику' : 'Owner Statement',
      pnl: 'P&L',
      management: isRu ? 'Управленческий' : 'Management',
      per_booking: isRu ? 'По заездам' : 'Per Booking',
    };
    return map[type] || type;
  };

  if (isLoading) {
    return <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}</div>;
  }

  if (!reports?.length) {
    return (
      <div className="text-center py-10">
        <FileText className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
        <p className="text-sm text-muted-foreground">
          {isRu ? 'Управляющая компания ещё не отправляла отчётов' : 'No reports shared by the management company yet'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {reports.map((report) => {
        const status = getStatusLabel(report.status);
        const data = (report.data || {}) as Record<string, any>;
        const netIncome = Number(data.net_income || 0);

        return (
          <Card key={report.id} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary shrink-0" />
                  <div>
                    <h3 className="font-medium text-sm">{getTypeLabel(report.report_type)}</h3>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(report.period_start), 'dd MMM', { locale: isRu ? ru : enUS })}
                      {' — '}
                      {format(new Date(report.period_end), 'dd MMM yyyy', { locale: isRu ? ru : enUS })}
                    </p>
                  </div>
                </div>
                <Badge variant={status.variant}>{status.label}</Badge>
              </div>

              {data.income && (
                <div className="grid grid-cols-3 gap-3 pt-2 border-t mt-2">
                  <div>
                    <p className="text-[10px] text-muted-foreground">{isRu ? 'Доход' : 'Income'}</p>
                    <p className="text-sm font-medium text-success">฿{Number(data.income?.total || 0).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">{isRu ? 'Расходы' : 'Expenses'}</p>
                    <p className="text-sm font-medium text-destructive">฿{Number(data.expenses?.total || 0).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">{isRu ? 'Чистый' : 'Net'}</p>
                    <p className={`text-sm font-medium ${netIncome >= 0 ? 'text-success' : 'text-destructive'}`}>
                      ฿{netIncome.toLocaleString()}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex gap-2 mt-3">
                <Button variant="outline" size="sm" className="flex-1 h-8" onClick={() => setViewReport(report)}>
                  <Eye className="h-3.5 w-3.5 mr-1" />
                  {isRu ? 'Подробнее' : 'Details'}
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}

      <ReportDetailSheet report={viewReport} open={!!viewReport} onOpenChange={(open) => { if (!open) setViewReport(null); }} />
    </div>
  );
}
