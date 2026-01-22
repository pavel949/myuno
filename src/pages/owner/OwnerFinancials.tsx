import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useOwnerProperties } from '@/hooks/usePropertyCare';
import { 
  usePropertyFinancialsFull, 
  useFinancialStats,
  useDeleteFinancial,
  INCOME_CATEGORIES,
  EXPENSE_CATEGORIES,
  PropertyFinancialFull
} from '@/hooks/usePropertyFinancials';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { BackButton } from '@/components/uno/BackButton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  DollarSign, TrendingUp, TrendingDown, Plus,
  ArrowUpCircle, ArrowDownCircle, Receipt, Calendar,
  MoreVertical, Trash2, Edit, Building, BarChart3,
  Paperclip, Zap
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FinancialDateFilter, DatePreset } from '@/components/owner/FinancialDateFilter';
import { FinancialCharts } from '@/components/owner/FinancialCharts';
import { ReceiptViewer } from '@/components/owner/ReceiptViewer';

export default function OwnerFinancials() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isRu = language === 'ru';

  const [selectedProperty, setSelectedProperty] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'all' | 'income' | 'expense'>('all');
  const [viewMode, setViewMode] = useState<'list' | 'charts'>('list');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewReceiptUrl, setViewReceiptUrl] = useState<string | null>(null);
  
  // Date filter state
  const [datePreset, setDatePreset] = useState<DatePreset>('all_time');
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  });

  const { data: properties } = useOwnerProperties();
  const { data: financials, isLoading } = usePropertyFinancialsFull(
    selectedProperty === 'all' ? undefined : selectedProperty
  );
  const { data: stats } = useFinancialStats(
    selectedProperty === 'all' ? undefined : selectedProperty
  );
  const deleteFinancial = useDeleteFinancial();

  // Filter financials by date range and type
  const filteredFinancials = useMemo(() => {
    if (!financials) return [];
    
    return financials.filter(f => {
      // Filter by transaction type
      if (activeTab !== 'all' && f.transaction_type !== activeTab) return false;
      
      // Filter by date range
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

  if (!user) {
    navigate('/auth');
    return null;
  }

  return (
    <PageContainer>
      <BackButton fallbackPath="/owner" />
      <PageHeader 
        title={isRu ? 'Финансы' : 'Financials'}
        subtitle={isRu ? 'Доходы и расходы по недвижимости' : 'Property income and expenses'}
      />

      {/* Filters Row */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <Select value={selectedProperty} onValueChange={setSelectedProperty}>
          <SelectTrigger className="flex-1">
            <Building className="h-4 w-4 mr-2" />
            <SelectValue placeholder={isRu ? 'Все объекты' : 'All properties'} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{isRu ? 'Все объекты' : 'All properties'}</SelectItem>
            {properties?.map(p => (
              <SelectItem key={p.id} value={p.id}>
                {isRu && p.title_ru ? p.title_ru : p.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <FinancialDateFilter
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          preset={datePreset}
          onPresetChange={setDatePreset}
        />
      </div>

      {/* View Toggle */}
      <div className="flex gap-2 mb-4">
        <Button
          variant={viewMode === 'list' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setViewMode('list')}
        >
          <Receipt className="h-4 w-4 mr-2" />
          {isRu ? 'Список' : 'List'}
        </Button>
        <Button
          variant={viewMode === 'charts' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setViewMode('charts')}
        >
          <BarChart3 className="h-4 w-4 mr-2" />
          {isRu ? 'Графики' : 'Charts'}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-green-500/20">
                <TrendingUp className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-xl font-bold text-green-600">
                  ฿{((stats?.totalIncome || 0) / 1000).toFixed(1)}k
                </p>
                <p className="text-xs text-muted-foreground">
                  {isRu ? 'Всего доходов' : 'Total Income'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-500/10 to-red-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-red-500/20">
                <TrendingDown className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="text-xl font-bold text-red-600">
                  ฿{((stats?.totalExpenses || 0) / 1000).toFixed(1)}k
                </p>
                <p className="text-xs text-muted-foreground">
                  {isRu ? 'Всего расходов' : 'Total Expenses'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-2 bg-gradient-to-br from-primary/10 to-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-primary/20">
                  <DollarSign className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className={`text-2xl font-bold ${(stats?.netIncome || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ฿{((stats?.netIncome || 0) / 1000).toFixed(1)}k
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {isRu ? 'Чистый доход' : 'Net Income'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">
                  {isRu ? 'Этот месяц' : 'This Month'}
                </p>
                <p className="text-xs text-green-600">+฿{((stats?.thisMonthIncome || 0) / 1000).toFixed(1)}k</p>
                <p className="text-xs text-red-600">-฿{((stats?.thisMonthExpenses || 0) / 1000).toFixed(1)}k</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 mb-6">
        <Button 
          variant="default"
          className="flex-1" 
          onClick={() => navigate('/owner/expenses/quick')}
        >
          <Zap className="h-4 w-4 mr-2" />
          {isRu ? 'Быстрый расход' : 'Quick Expense'}
        </Button>
        <Button 
          variant="outline"
          className="flex-1" 
          onClick={() => navigate('/owner/financials/new')}
        >
          <Plus className="h-4 w-4 mr-2" />
          {isRu ? 'Добавить' : 'Add'}
        </Button>
      </div>

      {/* Charts View */}
      {viewMode === 'charts' && financials && (
        <FinancialCharts financials={financials} dateRange={dateRange.from && dateRange.to ? { from: dateRange.from, to: dateRange.to } : undefined} />
      )}

      {/* Transactions List View */}
      {viewMode === 'list' && (
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="w-full mb-4">
            <TabsTrigger value="all" className="flex-1">
              {isRu ? 'Все' : 'All'}
            </TabsTrigger>
            <TabsTrigger value="income" className="flex-1">
              <ArrowUpCircle className="h-4 w-4 mr-1" />
              {isRu ? 'Доходы' : 'Income'}
            </TabsTrigger>
            <TabsTrigger value="expense" className="flex-1">
              <ArrowDownCircle className="h-4 w-4 mr-1" />
              {isRu ? 'Расходы' : 'Expenses'}
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-3">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                {isRu ? 'Загрузка...' : 'Loading...'}
              </div>
            ) : !filteredFinancials?.length ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">
                    {isRu ? 'Нет транзакций' : 'No transactions'}
                  </p>
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
          </TabsContent>
        </Tabs>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isRu ? 'Удалить транзакцию?' : 'Delete transaction?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isRu 
                ? 'Это действие нельзя отменить.' 
                : 'This action cannot be undone.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{isRu ? 'Отмена' : 'Cancel'}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              {isRu ? 'Удалить' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Receipt Viewer */}
      <ReceiptViewer
        open={!!viewReceiptUrl}
        onOpenChange={() => setViewReceiptUrl(null)}
        receiptUrl={viewReceiptUrl || ''}
      />
    </PageContainer>
  );
}

function TransactionCard({ 
  item, 
  isRu, 
  getCategoryLabel,
  onEdit,
  onDelete,
  onViewReceipt
}: { 
  item: PropertyFinancialFull; 
  isRu: boolean;
  getCategoryLabel: (cat: string | undefined, type: string) => string;
  onEdit: () => void;
  onDelete: () => void;
  onViewReceipt?: () => void;
}) {
  const isIncome = item.transaction_type === 'income';
  const hasReceipt = !!item.receipt_url;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-full ${isIncome ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
            {isIncome ? (
              <ArrowUpCircle className="h-5 w-5 text-green-500" />
            ) : (
              <ArrowDownCircle className="h-5 w-5 text-red-500" />
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-medium text-sm flex items-center gap-1.5">
                  {getCategoryLabel(item.category, item.transaction_type)}
                  {hasReceipt && (
                    <button
                      onClick={onViewReceipt}
                      className="text-primary hover:text-primary/80 transition-colors"
                      title={isRu ? 'Посмотреть чек' : 'View receipt'}
                    >
                      <Paperclip className="h-3.5 w-3.5" />
                    </button>
                  )}
                </p>
                {item.description && (
                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {isRu && item.description_ru ? item.description_ru : item.description}
                  </p>
                )}
              </div>
              <p className={`font-bold whitespace-nowrap ${isIncome ? 'text-green-600' : 'text-red-600'}`}>
                {isIncome ? '+' : '-'}฿{item.amount.toLocaleString()}
              </p>
            </div>
            
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <Badge variant="outline" className="text-xs">
                <Calendar className="h-3 w-3 mr-1" />
                {format(new Date(item.transaction_date), 'd MMM yyyy', { locale: isRu ? ru : undefined })}
              </Badge>
              
              {item.property && (
                <Badge variant="secondary" className="text-xs">
                  {isRu && item.property.title_ru ? item.property.title_ru : item.property.title}
                </Badge>
              )}
              
              {item.status === 'pending' && (
                <Badge variant="destructive" className="text-xs">
                  {isRu ? 'Ожидает' : 'Pending'}
                </Badge>
              )}
              
              {item.tax_deductible && (
                <Badge variant="outline" className="text-xs text-green-600">
                  {isRu ? 'Вычет' : 'Deductible'}
                </Badge>
              )}
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {hasReceipt && (
                <DropdownMenuItem onClick={onViewReceipt}>
                  <Paperclip className="h-4 w-4 mr-2" />
                  {isRu ? 'Посмотреть чек' : 'View Receipt'}
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={onEdit}>
                <Edit className="h-4 w-4 mr-2" />
                {isRu ? 'Редактировать' : 'Edit'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDelete} className="text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                {isRu ? 'Удалить' : 'Delete'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}
