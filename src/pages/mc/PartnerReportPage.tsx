import { useState, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useActiveCompany } from '@/hooks/useActiveCompany';
import { usePartnerReport } from '@/hooks/usePartnerReport';
import { useMyProperties } from '@/hooks/useMyProperties';
import { APP_ROUTES } from '@/lib/config/routes';
import { PageContainer } from '@/components/uno/PageContainer';
import { BackButton } from '@/components/uno/BackButton';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { ru, enUS } from 'date-fns/locale';
import { Download, FileDown, Calendar, BarChart3 } from 'lucide-react';

const fmt = (n: number) => `฿${Number(n).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

function downloadCsv(rows: { propertyName: string; feePercent: number; grossRevenue: number; mgmtCommission: number; mgmtExpenses: number; mgmtNetProfit: number }[], monthLabel: string) {
  const header = 'Property,MC %,Gross Revenue,MC Commission,MC Expenses,MC Net';
  const body = rows.map(r =>
    [r.propertyName, r.feePercent, r.grossRevenue, r.mgmtCommission, r.mgmtExpenses, r.mgmtNetProfit].join(',')
  ).join('\n');
  const blob = new Blob([header + '\n' + body], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `partner-report_${monthLabel}_${rows.length}-properties.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function PartnerReportPage() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { activeCompany } = useActiveCompany();
  const { allProperties } = useMyProperties();

  const [selectedProperties, setSelectedProperties] = useState<string[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(() => format(subMonths(new Date(), 1), 'yyyy-MM'));

  const periodStart = startOfMonth(new Date(selectedMonth + '-01'));
  const periodEnd = endOfMonth(periodStart);
  const dateFrom = format(periodStart, 'yyyy-MM-dd');
  const dateTo = format(periodEnd, 'yyyy-MM-dd');

  const propertyIds = selectedProperties.length > 0
    ? selectedProperties
    : allProperties.map((p: { id?: string; property_id?: string }) => p.id || p.property_id).filter(Boolean);

  const { data: rows, isLoading } = usePartnerReport(
    propertyIds.length ? propertyIds : [],
    dateFrom,
    dateTo
  );

  const monthOptions = useMemo(() => {
    const opts = [];
    for (let i = 0; i <= 12; i++) {
      const d = subMonths(new Date(), i);
      opts.push({ value: format(d, 'yyyy-MM'), label: format(d, 'LLLL yyyy', { locale: isRu ? ru : enUS }) });
    }
    return opts;
  }, [isRu]);

  const totals = useMemo(() => {
    if (!rows?.length) return { grossRevenue: 0, mgmtCommission: 0, mgmtExpenses: 0, mgmtNetProfit: 0 };
    return rows.reduce(
      (acc, r) => ({
        grossRevenue: acc.grossRevenue + r.grossRevenue,
        mgmtCommission: acc.mgmtCommission + r.mgmtCommission,
        mgmtExpenses: acc.mgmtExpenses + r.mgmtExpenses,
        mgmtNetProfit: acc.mgmtNetProfit + r.mgmtNetProfit,
      }),
      { grossRevenue: 0, mgmtCommission: 0, mgmtExpenses: 0, mgmtNetProfit: 0 }
    );
  }, [rows]);

  const toggleProperty = (id: string) => {
    setSelectedProperties((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    const ids = allProperties.map((p: { id?: string; property_id?: string }) => p.id || p.property_id).filter(Boolean);
    setSelectedProperties(ids);
  };

  const selectNone = () => setSelectedProperties([]);

  return (
    <PageContainer>
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <BackButton to={APP_ROUTES.MC_REPORTS} />
          <div className="flex-1">
            <h1 className="text-xl font-semibold">
              {isRu ? 'Отчёт партнёра' : 'Partner Report'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isRu ? 'Сводный P&L по объектам — комиссии и расходы УК' : 'Multi-property P&L — MC commissions & expenses'}
            </p>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">{isRu ? 'Период' : 'Period'}</label>
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger>
                    <Calendar className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {monthOptions.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end gap-2">
                <Button variant="outline" size="sm" onClick={selectAll}>
                  {isRu ? 'Все' : 'All'}
                </Button>
                <Button variant="outline" size="sm" onClick={selectNone}>
                  {isRu ? 'Сбросить' : 'Clear'}
                </Button>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">{isRu ? 'Объекты' : 'Properties'}</label>
              <div className="rounded-lg border p-3 max-h-48 overflow-y-auto space-y-2">
                {allProperties.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{isRu ? 'Нет объектов' : 'No properties'}</p>
                ) : (
                  allProperties.slice(0, 50).map((p: { id?: string; property_id?: string; title?: string; title_ru?: string }) => {
                    const id = p.id || p.property_id;
                    if (!id) return null;
                    const name = isRu ? p.title_ru || p.title : p.title || p.title_ru;
                    const checked = selectedProperties.length === 0 || selectedProperties.includes(id);
                    return (
                      <div key={id} className="flex items-center gap-2">
                        <Checkbox
                          id={id}
                          checked={checked}
                          onCheckedChange={() => toggleProperty(id)}
                        />
                        <label htmlFor={id} className="text-sm cursor-pointer flex-1">
                          {name || id.slice(0, 8)}
                        </label>
                      </div>
                    );
                  })
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {selectedProperties.length === 0
                  ? (isRu ? 'Выбраны все объекты' : 'All properties selected')
                  : `${selectedProperties.length} ${isRu ? 'объектов' : 'properties'}`}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6">
                <Skeleton className="h-64 w-full" />
              </div>
            ) : !rows?.length ? (
              <div className="p-12 text-center text-muted-foreground">
                <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>{isRu ? 'Выберите объекты и период' : 'Select properties and period'}</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{isRu ? 'Объект' : 'Property'}</TableHead>
                        <TableHead className="text-right">% УК</TableHead>
                        <TableHead className="text-right">{isRu ? 'Валовый доход' : 'Gross Revenue'}</TableHead>
                        <TableHead className="text-right">{isRu ? 'Комиссия УК' : 'MC Commission'}</TableHead>
                        <TableHead className="text-right">{isRu ? 'Расходы УК' : 'MC Expenses'}</TableHead>
                        <TableHead className="text-right font-medium">{isRu ? 'Прибыль УК' : 'MC Profit'}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows.map((r) => (
                        <TableRow key={r.propertyId}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{isRu ? r.propertyNameRu || r.propertyNameEn : r.propertyNameEn}</p>
                              {r.ownerName && (
                                <p className="text-xs text-muted-foreground">{r.ownerName}</p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">{r.feePercent}%</TableCell>
                          <TableCell className="text-right text-success">{fmt(r.grossRevenue)}</TableCell>
                          <TableCell className="text-right">{fmt(r.mgmtCommission)}</TableCell>
                          <TableCell className="text-right text-destructive">{fmt(r.mgmtExpenses)}</TableCell>
                          <TableCell className="text-right font-medium">{fmt(r.mgmtNetProfit)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                    <TableFooter>
                      <TableRow>
                        <TableCell className="font-semibold">{isRu ? 'ИТОГО' : 'TOTAL'}</TableCell>
                        <TableCell className="text-right">—</TableCell>
                        <TableCell className="text-right text-success font-semibold">{fmt(totals.grossRevenue)}</TableCell>
                        <TableCell className="text-right font-semibold">{fmt(totals.mgmtCommission)}</TableCell>
                        <TableCell className="text-right text-destructive font-semibold">{fmt(totals.mgmtExpenses)}</TableCell>
                        <TableCell className="text-right font-bold">{fmt(totals.mgmtNetProfit)}</TableCell>
                      </TableRow>
                    </TableFooter>
                  </Table>
                </div>

                <div className="p-4 border-t flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      downloadCsv(
                        rows.map((r) => ({
                          propertyName: isRu ? r.propertyNameRu || r.propertyNameEn : r.propertyNameEn,
                          feePercent: r.feePercent,
                          grossRevenue: r.grossRevenue,
                          mgmtCommission: r.mgmtCommission,
                          mgmtExpenses: r.mgmtExpenses,
                          mgmtNetProfit: r.mgmtNetProfit,
                        })),
                        selectedMonth
                      )
                    }
                  >
                    <FileDown className="h-4 w-4 mr-2" />
                    CSV
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => window.print()}>
                    <Download className="h-4 w-4 mr-2" />
                    {isRu ? 'PDF' : 'PDF'}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
