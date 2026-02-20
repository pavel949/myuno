import { useState, useMemo } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useOwnerProperties } from '@/hooks/usePropertyCare';
import { useMyDelegations } from '@/hooks/usePropertyDelegates';
import { 
  usePropertyFinancialsPaginated, 
  useFinancialStats,
  useDeleteFinancial,
  usePropertyFinancialsCount,
  INCOME_CATEGORIES,
  EXPENSE_CATEGORIES,
} from '@/hooks/usePropertyFinancials';
import { PageContainer } from '@/components/uno/PageContainer';
import { BackButton } from '@/components/uno/BackButton';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  Plus, ArrowUpCircle, ArrowDownCircle, Receipt, 
  Zap, Download, Loader2, Building, BarChart3, TrendingUp, CalendarClock
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { FinancialDateFilter, DatePreset } from '@/components/owner/FinancialDateFilter';
import { FinancialCharts } from '@/components/owner/FinancialCharts';
import { ReceiptViewer } from '@/components/owner/ReceiptViewer';
import { FinancialStatsCards } from '@/components/owner/financials/FinancialStatsCards';
import { TransactionCard } from '@/components/owner/financials/TransactionCard';
import { ExpenseTemplates } from '@/components/owner/expense/ExpenseTemplates';
import { CashFlowForecast } from '@/components/owner/financials/CashFlowForecast';

export default function OwnerFinancials() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isRu = language === 'ru';

  const [selectedProperty, setSelectedProperty] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'all' | 'income' | 'expense'>('all');
  const [viewMode, setViewMode] = useState<'list' | 'charts' | 'forecast'>('list');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewReceiptUrl, setViewReceiptUrl] = useState<string | null>(null);
  const [datePreset, setDatePreset] = useState<DatePreset>('all_time');
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined, to: undefined,
  });

  const { data: ownedProperties } = useOwnerProperties();
  const { data: delegations } = useMyDelegations();

  // Merge owned + delegated properties for the selector
  const delegatedProperties = (delegations || [])
    .filter(d => d.status === 'active' && (d.permissions as any)?.financials)
    .map(d => d.property)
    .filter(Boolean);

  const allProperties = [
    ...(ownedProperties || []),
    ...delegatedProperties.filter(dp => !(ownedProperties || []).some(op => op.id === dp.id)),
  ];

  const { data: financialsData, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = usePropertyFinancialsPaginated(
    selectedProperty === 'all' ? undefined : selectedProperty
  );
  const { data: totalCount } = usePropertyFinancialsCount(selectedProperty === 'all' ? undefined : selectedProperty);
  const { data: stats } = useFinancialStats(selectedProperty === 'all' ? undefined : selectedProperty);
  const deleteFinancial = useDeleteFinancial();

  const financials = useMemo(() => {
    if (!financialsData?.pages) return [];
    return financialsData.pages.flatMap(page => page.data);
  }, [financialsData]);

  const filteredFinancials = useMemo(() => {
    if (!financials) return [];
    return financials.filter(f => {
      if (activeTab !== 'all' && f.transaction_type !== activeTab) return false;
      if (dateRange.from || dateRange.to) {
        const txDate = parseISO(f.transaction_date);
        if (dateRange.from && txDate < dateRange.from) return false;
        if (dateRange.to && txDate > dateRange.to) return false;
      }
      return true;
    });
  }, [financials, activeTab, dateRange]);

  const getCategoryLabel = (category: string | undefined, type: string) => {
    if (!category) return isRu ? 'Без категории' : 'Uncategorized';
    const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
    const cat = categories.find(c => c.value === category);
    return cat ? (isRu ? cat.labelRu : cat.labelEn) : category;
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteFinancial.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  const handleExportCSV = () => {
    if (!filteredFinancials.length) return;
    const headers = [
      isRu ? 'Дата' : 'Date', isRu ? 'Тип' : 'Type', isRu ? 'Категория' : 'Category',
      isRu ? 'Сумма' : 'Amount', isRu ? 'Объект' : 'Property', isRu ? 'Описание' : 'Description', isRu ? 'Статус' : 'Status',
    ];
    const rows = filteredFinancials.map(f => [
      f.transaction_date,
      f.transaction_type === 'income' ? (isRu ? 'Доход' : 'Income') : (isRu ? 'Расход' : 'Expense'),
      getCategoryLabel(f.category, f.transaction_type), f.amount, f.property?.title || '', f.description || '', f.status || '',
    ]);
    const csvContent = [headers.join(','), ...rows.map(row => row.map(cell => `"${cell}"`).join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `financials_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <PageContainer>
      <BackButton fallbackPath="/owner" />
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold">{isRu ? 'Финансы' : 'Financials'}</h1>
          <p className="text-sm text-muted-foreground">{isRu ? 'Доходы и расходы по недвижимости' : 'Property income and expenses'}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => navigate('/owner/portfolio')}>
          <BarChart3 className="h-4 w-4 mr-1" />
          {isRu ? 'Портфель' : 'Portfolio'}
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <Select value={selectedProperty} onValueChange={setSelectedProperty}>
          <SelectTrigger className="flex-1">
            <Building className="h-4 w-4 mr-2" />
            <SelectValue placeholder={isRu ? 'Все объекты' : 'All properties'} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{isRu ? 'Все объекты' : 'All properties'}</SelectItem>
            {allProperties?.map(p => (
              <SelectItem key={p.id} value={p.id}>{isRu && (p as any).title_ru ? (p as any).title_ru : p.title}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FinancialDateFilter dateRange={dateRange} onDateRangeChange={setDateRange} preset={datePreset} onPresetChange={setDatePreset} />
      </div>

      {/* View Toggle */}
      <div className="flex gap-2 mb-4">
        <Button variant={viewMode === 'list' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('list')}>
          <Receipt className="h-4 w-4 mr-2" />{isRu ? 'Список' : 'List'}
        </Button>
        <Button variant={viewMode === 'charts' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('charts')}>
          <BarChart3 className="h-4 w-4 mr-2" />{isRu ? 'Графики' : 'Charts'}
        </Button>
        <Button variant={viewMode === 'forecast' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('forecast')}>
          <CalendarClock className="h-4 w-4 mr-2" />{isRu ? 'Прогноз' : 'Forecast'}
        </Button>
      </div>

      {viewMode !== 'forecast' && <FinancialStatsCards stats={stats} isRu={isRu} />}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2 mb-6">
        <Button variant="default" className="flex-1 min-w-0" onClick={() => navigate('/owner/expenses/quick')}>
          <Zap className="h-4 w-4 mr-2" />{isRu ? 'Расход' : 'Expense'}
        </Button>
        <Button
          variant="outline"
          className="flex-1 min-w-0 border-success text-success hover:bg-success/10"
          onClick={() => navigate(`/owner/income/quick${selectedProperty !== 'all' ? `?propertyId=${selectedProperty}` : ''}`)}
        >
          <TrendingUp className="h-4 w-4 mr-2" />{isRu ? 'Доход' : 'Income'}
        </Button>
        <Button variant="outline" className="flex-1 min-w-0" onClick={() => navigate('/owner/financials/new')}>
          <Plus className="h-4 w-4 mr-2" />{isRu ? 'Ещё' : 'More'}
        </Button>
        {selectedProperty !== 'all' && (
          <ExpenseTemplates propertyId={selectedProperty} onApplied={() => {}} />
        )}
        <Button variant="outline" size="icon" onClick={handleExportCSV} disabled={!filteredFinancials.length} title={isRu ? 'Экспорт CSV' : 'Export CSV'}>
          <Download className="h-4 w-4" />
        </Button>
      </div>

      {viewMode === 'forecast' && (
        <CashFlowForecast propertyId={selectedProperty === 'all' ? undefined : selectedProperty} />
      )}

      {viewMode === 'charts' && financials && (
        <FinancialCharts financials={financials} dateRange={dateRange.from && dateRange.to ? { from: dateRange.from, to: dateRange.to } : undefined} />
      )}

      {viewMode === 'list' && (
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="w-full mb-4">
            <TabsTrigger value="all" className="flex-1">{isRu ? 'Все' : 'All'}</TabsTrigger>
            <TabsTrigger value="income" className="flex-1"><ArrowUpCircle className="h-4 w-4 mr-1" />{isRu ? 'Доходы' : 'Income'}</TabsTrigger>
            <TabsTrigger value="expense" className="flex-1"><ArrowDownCircle className="h-4 w-4 mr-1" />{isRu ? 'Расходы' : 'Expenses'}</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-3">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">{isRu ? 'Загрузка...' : 'Loading...'}</div>
            ) : !filteredFinancials?.length ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">{isRu ? 'Нет транзакций' : 'No transactions'}</p>
                </CardContent>
              </Card>
            ) : (
              filteredFinancials.map((item) => (
                <TransactionCard
                  key={item.id}
                  item={item}
                  isRu={isRu}
                  getCategoryLabel={getCategoryLabel}
                  onEdit={() => navigate(`/owner/financials/${item.id}`)}
                  onDelete={() => setDeleteId(item.id)}
                  onViewReceipt={item.receipt_url ? () => setViewReceiptUrl(item.receipt_url!) : undefined}
                />
              ))
            )}
            
            {hasNextPage && (
              <div className="pt-4">
                <Button variant="outline" className="w-full" onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
                  {isFetchingNextPage ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" />{isRu ? 'Загрузка...' : 'Loading...'}</>
                  ) : (
                    <>{isRu ? 'Загрузить ещё' : 'Load More'}
                      {totalCount && financials.length < totalCount && <span className="ml-2 text-muted-foreground">({financials.length} / {totalCount})</span>}
                    </>
                  )}
                </Button>
              </div>
            )}
            
            {!hasNextPage && financials.length > 0 && (
              <p className="text-center text-sm text-muted-foreground py-4">
                {isRu ? `Показано ${financials.length} транзакций` : `Showing ${financials.length} transactions`}
              </p>
            )}
          </TabsContent>
        </Tabs>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{isRu ? 'Удалить транзакцию?' : 'Delete transaction?'}</AlertDialogTitle>
            <AlertDialogDescription>{isRu ? 'Это действие нельзя отменить.' : 'This action cannot be undone.'}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{isRu ? 'Отмена' : 'Cancel'}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">{isRu ? 'Удалить' : 'Delete'}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ReceiptViewer open={!!viewReceiptUrl} onOpenChange={() => setViewReceiptUrl(null)} receiptUrl={viewReceiptUrl || ''} />
    </PageContainer>
  );
}
