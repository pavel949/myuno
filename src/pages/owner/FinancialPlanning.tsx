import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import type { DcfInput, DcfResult } from '@/lib/finance/dcfMath';
import { PlanningOverview } from '@/components/owner/financial-planning/PlanningOverview';
import { DriversGrid } from '@/components/owner/financial-planning/DriversGrid';
import { MonthlyPnLGrid } from '@/components/owner/financial-planning/MonthlyPnLGrid';
import { CapExCashFlow } from '@/components/owner/financial-planning/CapExCashFlow';
import { ScenariosPanel } from '@/components/owner/financial-planning/ScenariosPanel';
import { DCFPanel } from '@/components/owner/financial-planning/DCFPanel';
import { MonteCarloPanel } from '@/components/owner/financial-planning/MonteCarloPanel';
import { PortfolioRollupPanel } from '@/components/owner/financial-planning/PortfolioRollupPanel';
import { AIAdvisorPanel } from '@/components/owner/financial-planning/AIAdvisorPanel';
import { exportFinancialModelExcel, downloadBlob } from '@/utils/exportFinancialModelExcel';
import { generateInvestorDeckPDF, downloadPdfBlob } from '@/utils/exportInvestorDeckPDF';
import { Download, Save, LineChart, Sliders, Table, Wallet, Layers, Calculator, Dice5, Building2, FileText, Building } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { APP_ROUTES } from '@/lib/config/routes';

export default function FinancialPlanning() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const currentYear = new Date().getFullYear();
  const navigate = useNavigate();
  const driversSectionRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState('overview');

  const { data: properties, isLoading: propertiesLoading } = useOwnerProperties();
  const noProperties = !propertiesLoading && Array.isArray(properties) && properties.length === 0;
  const [propertyId, setPropertyId] = useState<string | undefined>();
  const [year, setYear] = useState<number>(currentYear);
  const [scenario, setScenario] = useState<Scenario>('base');

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

  const [drivers, setDrivers] = useState<Drivers>(() => emptyDrivers(year));
  const [capex, setCapex] = useState<CapExItem[]>([]);
  const [loans, setLoans] = useState<LoanItem[]>([]);
  const [assumptions, setAssumptions] = useState<Assumptions>({});
  const [dcfResult, setDcfResult] = useState<DcfResult | null>(null);

  useEffect(() => {
    if (serverModel) {
      setDrivers(serverModel.drivers || emptyDrivers(year));
      setCapex(serverModel.capex || []);
      setLoans(serverModel.loans || []);
      setAssumptions(serverModel.assumptions || {});
    } else {
      setDrivers(emptyDrivers(year));
      setCapex([]); setLoans([]); setAssumptions({});
    }
  }, [serverModel, year]);

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

  const dcfBaseInput: DcfInput = useMemo(() => ({
    year0NOI: computed.totals.noi,
    year0NetIncome: computed.totals.netIncome,
    initialInvestment: assumptions.cashInvested ?? assumptions.propertyValue ?? 0,
    holdYears: 10,
    noiGrowthPct: 0.04,
    exitCapRatePct: 0.07,
    discountRatePct: 0.10,
    sellingCostPct: 0.03,
    loanBalanceAtExit: 0,
  }), [computed, assumptions]);

  const handleSave = () => {
    if (!propertyId) { toast.error(isRu ? 'Выберите объект' : 'Select a property'); return; }
    saveModel.mutate(
      { property_id: propertyId, model_year: year, scenario, drivers, capex, loans, assumptions },
      { onSuccess: () => toast.success(isRu ? 'Модель сохранена' : 'Model saved') }
    );
  };

  const propMeta = useMemo(() => {
    const p = properties?.find(x => x.id === propertyId);
    if (!p) return { name: 'Property' };
    return {
      name: String(isRu ? ((p as { title_ru?: string; title_en?: string }).title_ru || (p as { title_en?: string }).title_en || 'Объект') : ((p as { title_en?: string; title_ru?: string }).title_en || (p as { title_ru?: string }).title_ru || 'Property')),
      type: (p as { property_type?: string }).property_type,
      bedrooms: (p as { bedrooms?: number }).bedrooms,
      district: (p as { district?: string }).district,
      propertyValue: assumptions.propertyValue,
    };
  }, [properties, propertyId, isRu, assumptions.propertyValue]);

  const handleExportExcel = async () => {
    try {
      const blob = await exportFinancialModelExcel({
        propertyName: propMeta.name, year, scenario,
        model: serverModel ?? null, computed,
      });
      downloadBlob(blob, `Financial_Model_${propMeta.name.replace(/\s+/g, '_')}_${year}_${scenario}.xlsx`);
      toast.success(isRu ? 'Excel-модель скачана' : 'Excel downloaded');
    } catch (e) { toast.error('Export error: ' + (e as Error).message); }
  };

  const handleExportPDF = () => {
    try {
      const blob = generateInvestorDeckPDF({
        language: isRu ? 'ru' : 'en',
        property: propMeta, year, scenario: String(scenario),
        computed, dcf: dcfResult,
      });
      downloadPdfBlob(blob, `Investor_Deck_${propMeta.name.replace(/\s+/g, '_')}_${year}.pdf`);
      toast.success(isRu ? 'Investor Deck готов' : 'Investor Deck ready');
    } catch (e) { toast.error('PDF error: ' + (e as Error).message); }
  };

  const propertyOptions = (properties || []).map(p => ({
    id: p.id,
    label: isRu ? ((p as { title_ru?: string; title_en?: string }).title_ru || (p as { title_en?: string }).title_en || 'Объект') : ((p as { title_en?: string; title_ru?: string }).title_en || (p as { title_ru?: string }).title_ru || 'Property'),
  }));

  const years = [currentYear - 1, currentYear, currentYear + 1, currentYear + 2];

  const handleGoToDrivers = () => {
    setActiveTab('drivers');
    setTimeout(() => {
      driversSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  return (
    <PageContainer>
      <PageHeader
        title={isRu ? 'Финансовое планирование' : 'Financial Planning'}
        subtitle={isRu ? 'DCF · Monte Carlo · AI · Portfolio · Excel · PDF' : 'DCF · Monte Carlo · AI · Portfolio · Excel · PDF'}
        showBack fallbackPath="/mc/finance"
      />

      {!noProperties && (
      <Card className="mb-4 border-dashed bg-muted/25">
        <CardContent className="pt-4 pb-4 space-y-2">
          <p className="text-sm text-foreground">
            {isRu
              ? 'Модель привязана к объекту, году и сценарию (базовый / оптимистичный / пессимистичный). Нажмите «Сохранить», чтобы записать её в базу. Черновик в интерфейсе есть сразу после выбора параметров.'
              : 'The model is tied to a property, year, and scenario (base / optimistic / pessimistic). Click Save to persist it. A draft appears in the UI as soon as you pick these settings.'}
          </p>
          <p className="text-sm text-muted-foreground">
            {isRu
              ? 'Вкладка «Портфель» — сводка по сохранённым моделям объектов и бюджетам за выбранный год и сценарий, а не отдельная запись «модели портфеля».'
              : 'The Portfolio tab rolls up saved per-property models and budgets for the selected year and scenario—it is not a separate stored “portfolio model”.'}
          </p>
          <p className="text-sm text-muted-foreground flex flex-wrap items-center gap-x-1 gap-y-1">
            <span>
              {isRu
                ? 'PDF/Excel отчёты по периодам и фактам — в разделе «Отчёты».'
                : 'Formal PDF/Excel reports by period and actuals are under Reports.'}
            </span>
            <Button
              type="button"
              variant="link"
              className="h-auto p-0 text-sm font-medium"
              onClick={() => navigate(APP_ROUTES.MC_REPORTS)}
            >
              {isRu ? 'Открыть отчёты' : 'Open reports'}
            </Button>
          </p>
          {propertyId ? (
            <Button type="button" variant="secondary" size="sm" className="mt-1" onClick={handleGoToDrivers}>
              {isRu ? 'Перейти к драйверам' : 'Go to drivers'}
            </Button>
          ) : null}
        </CardContent>
      </Card>
      )}

      {propertiesLoading ? (
        <div className="space-y-3 mb-4">
          <Skeleton className="h-9 w-full max-w-md" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      ) : noProperties ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center space-y-4">
            <Building className="h-12 w-12 mx-auto text-muted-foreground opacity-60" />
            <div className="space-y-1">
              <p className="font-medium">{isRu ? 'Нет объектов для модели' : 'No properties yet'}</p>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                {isRu
                  ? 'Добавьте объект в каталоге, чтобы строить финансовую модель, сохранять сценарии и видеть сводку портфеля.'
                  : 'Add a property in the catalog to build a financial model, save scenarios, and use portfolio rollup.'}
              </p>
            </div>
            <Button type="button" onClick={() => navigate(APP_ROUTES.MC_PROPERTIES)}>
              {isRu ? 'Перейти к объектам' : 'Go to properties'}
            </Button>
          </CardContent>
        </Card>
      ) : (
      <>
      <div className="flex flex-wrap gap-2 mb-4">
        <Select value={propertyId} onValueChange={setPropertyId}>
          <SelectTrigger className="w-full sm:w-[220px] h-9"><SelectValue placeholder={isRu ? 'Объект' : 'Property'} /></SelectTrigger>
          <SelectContent>{propertyOptions.map(p => <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={String(year)} onValueChange={v => setYear(parseInt(v, 10))}>
          <SelectTrigger className="w-[100px] h-9"><SelectValue /></SelectTrigger>
          <SelectContent>{years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={scenario} onValueChange={v => setScenario(v as Scenario)}>
          <SelectTrigger className="w-[150px] h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="base">{isRu ? 'Базовый' : 'Base'}</SelectItem>
            <SelectItem value="optimistic">{isRu ? 'Оптимистичный' : 'Optimistic'}</SelectItem>
            <SelectItem value="pessimistic">{isRu ? 'Пессимистичный' : 'Pessimistic'}</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex gap-2 ml-auto flex-wrap">
          <Button size="sm" variant="outline" onClick={handleExportExcel} disabled={!propertyId}><Download className="h-4 w-4 mr-1.5" />Excel</Button>
          <Button size="sm" variant="outline" onClick={handleExportPDF} disabled={!propertyId}><FileText className="h-4 w-4 mr-1.5" />PDF Deck</Button>
          <Button size="sm" onClick={handleSave} disabled={!propertyId || saveModel.isPending}><Save className="h-4 w-4 mr-1.5" />{isRu ? 'Сохранить' : 'Save'}</Button>
        </div>
      </div>

      {!propertyId ? (
        <div className="text-center py-12 text-muted-foreground">{isRu ? 'Выберите объект' : 'Select a property'}</div>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
            <TabsList className="inline-flex w-auto sm:grid sm:grid-cols-9 mb-4 sm:w-full">
              <TabsTrigger value="overview" className="text-xs gap-1"><LineChart className="h-3.5 w-3.5" /><span className="hidden sm:inline">{isRu ? 'Обзор' : 'Overview'}</span></TabsTrigger>
              <TabsTrigger value="drivers" className="text-xs gap-1"><Sliders className="h-3.5 w-3.5" /><span className="hidden sm:inline">{isRu ? 'Драйверы' : 'Drivers'}</span></TabsTrigger>
              <TabsTrigger value="pnl" className="text-xs gap-1"><Table className="h-3.5 w-3.5" /><span className="hidden sm:inline">P&L</span></TabsTrigger>
              <TabsTrigger value="capex" className="text-xs gap-1"><Wallet className="h-3.5 w-3.5" /><span className="hidden sm:inline">CapEx</span></TabsTrigger>
              <TabsTrigger value="dcf" className="text-xs gap-1"><Calculator className="h-3.5 w-3.5" /><span className="hidden sm:inline">DCF</span></TabsTrigger>
              <TabsTrigger value="montecarlo" className="text-xs gap-1"><Dice5 className="h-3.5 w-3.5" /><span className="hidden sm:inline">Monte Carlo</span></TabsTrigger>
              <TabsTrigger value="scenarios" className="text-xs gap-1"><Layers className="h-3.5 w-3.5" /><span className="hidden sm:inline">{isRu ? 'Сценарии' : 'Scenarios'}</span></TabsTrigger>
              <TabsTrigger value="portfolio" className="text-xs gap-1"><Building2 className="h-3.5 w-3.5" /><span className="hidden sm:inline">{isRu ? 'Портфель' : 'Portfolio'}</span></TabsTrigger>
              <TabsTrigger value="ai" className="text-xs gap-1">✨<span className="hidden sm:inline">AI</span></TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="overview"><PlanningOverview computed={computed} actuals={actuals ?? null} /></TabsContent>

          <TabsContent value="drivers" ref={driversSectionRef}>
            <div className="mb-2 flex items-center gap-2">
              <Badge variant="secondary" className="text-[10px]">{isRu ? 'Сценарий' : 'Scenario'}: {scenario}</Badge>
              <p className="text-xs text-muted-foreground">{isRu ? 'Нажмите «Сохранить» после изменений' : 'Click Save after changes'}</p>
            </div>
            <DriversGrid drivers={drivers} onChange={setDrivers} />
          </TabsContent>

          <TabsContent value="pnl">
            <MonthlyPnLGrid computed={computed} />
            <p className="text-xs text-muted-foreground mt-3">{isRu ? 'Расходы — из раздела «Бюджет».' : 'Expenses come from Budget section.'}</p>
          </TabsContent>

          <TabsContent value="capex">
            <CapExCashFlow capex={capex} loans={loans} assumptions={assumptions}
              onCapexChange={setCapex} onLoansChange={setLoans} onAssumptionsChange={setAssumptions} />
          </TabsContent>

          <TabsContent value="dcf">
            <DCFPanel
              year0NOI={computed.totals.noi}
              year0NetIncome={computed.totals.netIncome}
              defaultPropertyValue={assumptions.propertyValue}
              defaultCashInvested={assumptions.cashInvested}
              onResultChange={setDcfResult}
            />
          </TabsContent>

          <TabsContent value="montecarlo">
            <MonteCarloPanel baseInput={dcfBaseInput} />
          </TabsContent>

          <TabsContent value="scenarios">
            <ScenariosPanel drivers={drivers} budgetExpenses={expenseRowsLocal}
              capex={capex} loans={loans} assumptions={assumptions} />
          </TabsContent>

          <TabsContent value="portfolio">
            <PortfolioRollupPanel year={year} scenario={scenario} />
          </TabsContent>

          <TabsContent value="ai">
            <AIAdvisorPanel
              computed={computed}
              dcf={dcfResult}
              property={propMeta}
              monthlyOccupancy={drivers.months.map(m => m.occupancy)}
              monthlyAdr={drivers.months.map(m => m.adr)}
            />
          </TabsContent>
        </Tabs>
      )}
      </>
      )}
    </PageContainer>
  );
}
