import { useState, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useOwnerProperties } from '@/hooks/usePropertyCare';
import {
  usePropertyBudgets,
  useBudgetVsActual,
  useSaveBudget,
  BudgetVsActual,
} from '@/hooks/usePropertyBudgets';
import {
  INCOME_CATEGORIES,
  EXPENSE_CATEGORIES,
} from '@/hooks/usePropertyFinancials';
import { PageContainer } from '@/components/uno/PageContainer';
import { BackButton } from '@/components/uno/BackButton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Target, Plus, Save, Download, TrendingUp, TrendingDown,
  ArrowUpRight, ArrowDownRight, Loader2, CalendarDays,
} from 'lucide-react';
import { format, startOfMonth, addMonths, subMonths } from 'date-fns';
import { ru as ruLocale, enUS } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';

export default function BudgetPage() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const isRu = language === 'ru';

  const { data: properties } = useOwnerProperties();
  const [selectedProperty, setSelectedProperty] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(
    format(startOfMonth(new Date()), 'yyyy-MM-dd')
  );
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [activeTab, setActiveTab] = useState<'comparison' | 'plan'>('comparison');

  const { data: comparison = [], isLoading: loadingComparison } = useBudgetVsActual(selectedProperty, selectedMonth);
  const { data: budgets = [], isLoading: loadingBudgets } = usePropertyBudgets(selectedProperty, selectedMonth);
  const saveBudget = useSaveBudget();

  // Budget form state
  const [budgetItems, setBudgetItems] = useState<Array<{
    category: string;
    transaction_type: 'income' | 'expense';
    planned_amount: number;
  }>>([]);

  const selectedProp = properties?.find((p: any) => p.id === selectedProperty);
  const propTitle = isRu
    ? (selectedProp as any)?.title_ru || (selectedProp as any)?.title || ''
    : (selectedProp as any)?.title || '';

  // Month navigation
  const months = useMemo(() => {
    const result = [];
    for (let i = -3; i <= 3; i++) {
      const d = addMonths(startOfMonth(new Date()), i);
      result.push({
        value: format(d, 'yyyy-MM-dd'),
        label: format(d, 'LLLL yyyy', { locale: isRu ? ruLocale : enUS }),
      });
    }
    return result;
  }, [isRu]);

  // Summary
  const incomePlan = comparison.filter(r => r.transaction_type === 'income').reduce((s, r) => s + r.planned, 0);
  const incomeFact = comparison.filter(r => r.transaction_type === 'income').reduce((s, r) => s + r.actual, 0);
  const expensePlan = comparison.filter(r => r.transaction_type === 'expense').reduce((s, r) => s + r.planned, 0);
  const expenseFact = comparison.filter(r => r.transaction_type === 'expense').reduce((s, r) => s + r.actual, 0);

  const addBudgetItem = (category: string, type: 'income' | 'expense') => {
    if (budgetItems.some(i => i.category === category && i.transaction_type === type)) return;
    setBudgetItems(prev => [...prev, { category, transaction_type: type, planned_amount: 0 }]);
  };

  const handleSave = () => {
    if (!selectedProperty || budgetItems.length === 0) return;
    saveBudget.mutate(
      budgetItems
        .filter(i => i.planned_amount > 0)
        .map(i => ({
          property_id: selectedProperty,
          budget_month: selectedMonth,
          ...i,
        })),
      { onSuccess: () => { setShowAddDialog(false); setBudgetItems([]); } }
    );
  };

  const handleExport = async () => {
    if (comparison.length === 0) return;
    const { exportBudgetExcel } = await import('@/utils/exportFinancialsExcel');
    exportBudgetExcel(comparison, propTitle, selectedMonth, language as 'ru' | 'en');
  };

  const formatAmount = (n: number) =>
    new Intl.NumberFormat(isRu ? 'ru-RU' : 'en-US', { style: 'currency', currency: 'THB', minimumFractionDigits: 0 }).format(n);

  const getCatLabel = (cat: string, type: string) => {
    const list = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
    const found = list.find(c => c.value === cat);
    return found ? (isRu ? found.labelRu : found.labelEn) : cat;
  };

  const VarianceRow = ({ row }: { row: BudgetVsActual }) => {
    const isOverBudget = row.transaction_type === 'expense' ? row.actual > row.planned : row.actual < row.planned;
    const progress = row.planned > 0 ? Math.min((row.actual / row.planned) * 100, 150) : 0;

    return (
      <div className="flex items-center gap-3 py-3 border-b last:border-0">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {row.transaction_type === 'income'
            ? <TrendingUp className="h-3.5 w-3.5 text-success shrink-0" />
              : <TrendingDown className="h-3.5 w-3.5 text-destructive shrink-0" />
            }
            <span className="text-sm font-medium truncate">
              {getCatLabel(row.category, row.transaction_type)}
            </span>
          </div>
          <Progress value={Math.min(progress, 100)} className="h-1.5" />
        </div>
        <div className="text-right shrink-0 space-y-0.5">
          <div className="text-xs text-muted-foreground">
            {formatAmount(row.actual)} / {formatAmount(row.planned)}
          </div>
          <Badge
            variant={isOverBudget ? 'destructive' : 'secondary'}
            className="text-[10px] px-1.5 py-0"
          >
            {row.variancePercent > 0 ? '+' : ''}{row.variancePercent}%
          </Badge>
        </div>
      </div>
    );
  };

  return (
    <PageContainer>
      <BackButton fallbackPath="/owner/finances" />

      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Target className="h-6 w-6 text-primary" />
            {isRu ? 'Бюджет' : 'Budget'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isRu ? 'План vs Факт по категориям' : 'Plan vs Actual by category'}
          </p>
        </div>
        <div className="flex gap-2">
          {comparison.length > 0 && (
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-1" />
              Excel
            </Button>
          )}
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button size="sm" disabled={!selectedProperty}>
                <Plus className="h-4 w-4 mr-1" />
                {isRu ? 'Создать бюджет' : 'Create Budget'}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{isRu ? 'Бюджет на месяц' : 'Monthly Budget'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">{isRu ? 'Доходные категории' : 'Income Categories'}</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {INCOME_CATEGORIES.map(c => (
                        <Badge
                          key={c.value}
                          variant={budgetItems.some(i => i.category === c.value && i.transaction_type === 'income') ? 'default' : 'outline'}
                          className="cursor-pointer text-[10px]"
                          onClick={() => addBudgetItem(c.value, 'income')}
                        >
                          {isRu ? c.labelRu : c.labelEn}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">{isRu ? 'Расходные категории' : 'Expense Categories'}</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {EXPENSE_CATEGORIES.slice(0, 12).map(c => (
                        <Badge
                          key={c.value}
                          variant={budgetItems.some(i => i.category === c.value && i.transaction_type === 'expense') ? 'default' : 'outline'}
                          className="cursor-pointer text-[10px]"
                          onClick={() => addBudgetItem(c.value, 'expense')}
                        >
                          {isRu ? c.labelRu : c.labelEn}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                {budgetItems.length > 0 && (
                  <div className="space-y-2">
                    {budgetItems.map((item, idx) => (
                      <div key={`${item.category}-${item.transaction_type}`} className="flex items-center gap-2">
                        <Badge variant={item.transaction_type === 'income' ? 'default' : 'secondary'} className="text-[10px] shrink-0">
                          {item.transaction_type === 'income'
                            ? (isRu ? 'Доход' : 'Income')
                            : (isRu ? 'Расход' : 'Expense')}
                        </Badge>
                        <span className="text-sm truncate flex-1">
                          {getCatLabel(item.category, item.transaction_type)}
                        </span>
                        <Input
                          type="number"
                          className="w-28"
                          placeholder="0"
                          value={item.planned_amount || ''}
                          onChange={e => {
                            const val = Number(e.target.value);
                            setBudgetItems(prev => prev.map((p, i) => i === idx ? { ...p, planned_amount: val } : p));
                          }}
                        />
                      </div>
                    ))}
                    <Button onClick={handleSave} className="w-full" disabled={saveBudget.isPending}>
                      {saveBudget.isPending
                        ? <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        : <Save className="h-4 w-4 mr-2" />}
                      {isRu ? 'Сохранить бюджет' : 'Save Budget'}
                    </Button>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Selectors */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <Select value={selectedProperty} onValueChange={setSelectedProperty}>
          <SelectTrigger>
            <SelectValue placeholder={isRu ? 'Объект' : 'Property'} />
          </SelectTrigger>
          <SelectContent>
            {(properties || []).map((p: any) => (
              <SelectItem key={p.id} value={p.id}>
                {isRu ? p.title_ru || p.title : p.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
          <SelectTrigger>
            <CalendarDays className="h-4 w-4 mr-1 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {months.map(m => (
              <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!selectedProperty ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Target className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">{isRu ? 'Выберите объект для просмотра бюджета' : 'Select a property to view budget'}</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <Card>
              <CardContent className="p-3">
                <p className="text-xs text-muted-foreground mb-1">{isRu ? 'Доходы план / факт' : 'Income plan / actual'}</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-lg font-bold text-success">{formatAmount(incomeFact)}</span>
                  <span className="text-xs text-muted-foreground">/ {formatAmount(incomePlan)}</span>
                </div>
                {incomePlan > 0 && (
                  <Progress value={Math.min((incomeFact / incomePlan) * 100, 100)} className="h-1.5 mt-2" />
                )}
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3">
                <p className="text-xs text-muted-foreground mb-1">{isRu ? 'Расходы план / факт' : 'Expenses plan / actual'}</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-lg font-bold text-destructive">{formatAmount(expenseFact)}</span>
                  <span className="text-xs text-muted-foreground">/ {formatAmount(expensePlan)}</span>
                </div>
                {expensePlan > 0 && (
                  <Progress value={Math.min((expenseFact / expensePlan) * 100, 100)} className="h-1.5 mt-2" />
                )}
              </CardContent>
            </Card>
          </div>

          {/* Comparison list */}
          {loadingComparison ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : comparison.length > 0 ? (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">
                  {isRu ? 'План vs Факт' : 'Plan vs Actual'}
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                {comparison.map(row => (
                  <VarianceRow key={`${row.transaction_type}-${row.category}`} row={row} />
                ))}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground text-sm mb-3">
                  {isRu ? 'Бюджет на этот месяц ещё не создан' : 'No budget for this month yet'}
                </p>
                <Button variant="outline" size="sm" onClick={() => setShowAddDialog(true)}>
                  <Plus className="h-4 w-4 mr-1" />
                  {isRu ? 'Создать' : 'Create'}
                </Button>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </PageContainer>
  );
}
