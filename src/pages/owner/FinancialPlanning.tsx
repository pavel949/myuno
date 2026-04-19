import { useEffect, useMemo, useState } from 'react';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { useOwnerProperties } from '@/hooks/usePropertyCare';
import {
  useFinancialModel, useSaveFinancialModel, useFinancialModelComputed, usePlanVsActual,
  type Scenario,
} from '@/hooks/useFinancialPlanning';
import { usePropertyBudgets } from '@/hooks/usePropertyBudgets';
import { emptyDrivers, type Drivers, type CapExItem, type LoanItem, type Assumptions, type ExpenseRow } from '@/lib/finance/financialModelMath';
import { PlanningOverview } from '@/components/owner/financial-planning/PlanningOverview';
import { DriversGrid } from '@/components/owner/financial-planning/DriversGrid';
import { MonthlyPnLGrid } from '@/components/owner/financial-planning/MonthlyPnLGrid';
import { CapExCashFlow } from '@/components/owner/financial-planning/CapExCashFlow';
import { ScenariosPanel } from '@/components/owner/financial-planning/ScenariosPanel';
import { exportFinancialModelExcel, downloadBlob } from '@/utils/exportFinancialModelExcel';
import { Download, Save, LineChart, Sliders, Table, Wallet, Layers } from 'lucide-react';
import { toast } from 'sonner';

export default function FinancialPlanning() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const currentYear = new Date().getFullYear();

  const { data: properties } = useOwnerProperties();
  const [propertyId, setPropertyId] = useState<string | undefined>();
  const [year, setYear] = useState<number>(currentYear);
  const [scenario, setScenario] = useState<Scenario>('base');

  // Auto-pick first property
  useEffect(() => {
    if (!propertyId && properties && properties.length > 0) {
      setPropertyId(properties[0].id);
    }
  }, [properties, propertyId]);

  const { data: serverModel } = useFinancialModel(propertyId, year, scenario);
  const { computed } = useFinancialModelComputed(propertyId, year, scenario);
  const { data: actuals } = usePlanVsActual(propertyId, year);
  const { data: budgets } = usePropertyBudgets(propertyId, undefined);

  const saveModel = useSaveFinancialModel();

  // Local editable state, hydrated from server
  const [drivers, setDrivers] = useState<Drivers>(() => emptyDrivers(year));
  const [capex, setCapex] = useState<CapExItem[]>([]);
  const [loans, setLoans] = useState<LoanItem[]>([]);
  const [assumptions, setAssumptions] = useState<Assumptions>({});

  // Sync local from server when model changes
  useEffect(() => {
    if (serverModel) {
      setDrivers(serverModel.drivers || emptyDrivers(year));
      setCapex(serverModel.capex || []);
      setLoans(serverModel.loans || []);
      setAssumptions(serverModel.assumptions || {});
    } else {
      setDrivers(emptyDrivers(year));
      setCapex([]);
      setLoans([]);
      setAssumptions({});
    }
  }, [serverModel, year]);

  // Build expense rows for live local recompute (matches usePropertyBudgets data shape)
  const expenseRowsLocal: ExpenseRow[] = useMemo(() => {
    if (!budgets) return [];
    const map = new Map<string, number[]>();
    budgets
      .filter(b => b.transaction_type === 'expense')
      .filter(b => new Date(b.budget_month).getFullYear() === year)
      .forEach(b => {
        const m = new Date(b.budget_month).getMonth();
        const cur = map.get(b.category) || Array(12).fill(0);
        cur[m] = (cur[m] || 0) + Number(b.planned_amount || 0);
        map.set(b.category, cur);
      });
    return Array.from(map.entries()).map(([category, monthly]) => ({ category, monthly }));
  }, [budgets, year]);

  const handleSave = () => {
    if (!propertyId) {
      toast.error(isRu ? 'Выберите объект' : 'Select a property');
      return;
    }
    saveModel.mutate(
      { property_id: propertyId, model_year: year, scenario, drivers, capex, loans, assumptions },
      {
        onSuccess: () => toast.success(isRu ? 'Модель сохранена' : 'Model saved'),
      }
    );
  };

  const handleExport = async () => {
    const propName = properties?.find(p => p.id === propertyId);
    const name = propName ? (isRu && (propName as { title_ru?: string }).title_ru ? (propName as { title_ru: string }).title_ru : (propName as { title_en?: string; title?: string }).title_en || (propName as { title?: string }).title || 'Property') : 'Portfolio';
    try {
      const blob = await exportFinancialModelExcel({
        propertyName: String(name),
        year,
        scenario,
        model: serverModel ?? null,
        computed,
      });
      downloadBlob(blob, `Financial_Model_${String(name).replace(/\s+/g, '_')}_${year}_${scenario}.xlsx`);
      toast.success(isRu ? 'Excel-модель скачана' : 'Excel model downloaded');
    } catch (e) {
      toast.error('Export error: ' + (e as Error).message);
    }
  };

  const propertyOptions = (properties || []).map(p => ({
    id: p.id,
    label: isRu ? ((p as { title_ru?: string; title_en?: string }).title_ru || (p as { title_en?: string }).title_en || 'Объект') : ((p as { title_en?: string; title_ru?: string }).title_en || (p as { title_ru?: string }).title_ru || 'Property'),
  }));

  const years = [currentYear - 1, currentYear, currentYear + 1, currentYear + 2];

  return (
    <PageContainer>
      <PageHeader
        title={isRu ? 'Финансовое планирование' : 'Financial Planning'}
        subtitle={isRu ? 'Профессиональная модель: драйверы, P&L, сценарии, экспорт' : 'Pro model: drivers, P&L, scenarios, export'}
        showBack
        fallbackPath="/mc/finance"
      />

      {/* Selectors row */}
      <div className="flex flex-wrap gap-2 mb-4">
        <Select value={propertyId} onValueChange={setPropertyId}>
          <SelectTrigger className="w-full sm:w-[220px] h-9">
            <SelectValue placeholder={isRu ? 'Объект' : 'Property'} />
          </SelectTrigger>
          <SelectContent>
            {propertyOptions.map(p => <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={String(year)} onValueChange={v => setYear(parseInt(v, 10))}>
          <SelectTrigger className="w-[100px] h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={scenario} onValueChange={v => setScenario(v as Scenario)}>
          <SelectTrigger className="w-[150px] h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="base">{isRu ? 'Базовый' : 'Base'}</SelectItem>
            <SelectItem value="optimistic">{isRu ? 'Оптимистичный' : 'Optimistic'}</SelectItem>
            <SelectItem value="pessimistic">{isRu ? 'Пессимистичный' : 'Pessimistic'}</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex gap-2 ml-auto">
          <Button size="sm" variant="outline" onClick={handleExport} disabled={!propertyId}>
            <Download className="h-4 w-4 mr-1.5" />
            Excel
          </Button>
          <Button size="sm" onClick={handleSave} disabled={!propertyId || saveModel.isPending}>
            <Save className="h-4 w-4 mr-1.5" />
            {isRu ? 'Сохранить' : 'Save'}
          </Button>
        </div>
      </div>

      {!propertyId ? (
        <div className="text-center py-12 text-muted-foreground">
          {isRu ? 'Выберите объект для построения модели' : 'Select a property to build the model'}
        </div>
      ) : (
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid grid-cols-5 mb-4 w-full">
            <TabsTrigger value="overview" className="text-xs gap-1">
              <LineChart className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{isRu ? 'Обзор' : 'Overview'}</span>
            </TabsTrigger>
            <TabsTrigger value="drivers" className="text-xs gap-1">
              <Sliders className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{isRu ? 'Драйверы' : 'Drivers'}</span>
            </TabsTrigger>
            <TabsTrigger value="pnl" className="text-xs gap-1">
              <Table className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">P&L</span>
            </TabsTrigger>
            <TabsTrigger value="capex" className="text-xs gap-1">
              <Wallet className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">CapEx</span>
            </TabsTrigger>
            <TabsTrigger value="scenarios" className="text-xs gap-1">
              <Layers className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{isRu ? 'Сценарии' : 'Scenarios'}</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <PlanningOverview computed={computed} actuals={actuals ?? null} />
          </TabsContent>

          <TabsContent value="drivers">
            <div className="mb-2 flex items-center gap-2">
              <Badge variant="secondary" className="text-[10px]">
                {isRu ? 'Сценарий' : 'Scenario'}: {scenario}
              </Badge>
              <p className="text-xs text-muted-foreground">
                {isRu ? 'Не забудьте нажать «Сохранить» после изменений' : 'Click Save after changes'}
              </p>
            </div>
            <DriversGrid drivers={drivers} onChange={setDrivers} />
          </TabsContent>

          <TabsContent value="pnl">
            <MonthlyPnLGrid computed={computed} />
            <p className="text-xs text-muted-foreground mt-3">
              {isRu
                ? 'Расходы берутся из раздела «Бюджет». Перейдите туда, чтобы редактировать категории и суммы.'
                : 'Expenses come from the Budget section. Edit categories and amounts there.'}
            </p>
          </TabsContent>

          <TabsContent value="capex">
            <CapExCashFlow
              capex={capex}
              loans={loans}
              assumptions={assumptions}
              onCapexChange={setCapex}
              onLoansChange={setLoans}
              onAssumptionsChange={setAssumptions}
            />
          </TabsContent>

          <TabsContent value="scenarios">
            <ScenariosPanel
              drivers={drivers}
              budgetExpenses={expenseRowsLocal}
              capex={capex}
              loans={loans}
              assumptions={assumptions}
            />
          </TabsContent>
        </Tabs>
      )}
    </PageContainer>
  );
}
