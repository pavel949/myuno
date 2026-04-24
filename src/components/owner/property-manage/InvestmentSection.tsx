import { useState, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useOwnerProperty, useUpdateOwnerProperty } from '@/hooks/usePropertyCare';
import { useFinancialStats, usePropertyFinancialsFull } from '@/hooks/usePropertyFinancials';
import { SectionCard, SectionTitle } from '@/components/uno/SectionCard';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { getCurrencySymbol, formatCurrencyAmount } from '@/lib/config/currencies';

// Helper to maintain backward compatibility with formatPriceWithSymbol calls
const formatPriceWithSymbol = (amount: number, currency: string = 'THB') => 
  formatCurrencyAmount(amount, currency);
import { toast } from 'sonner';
import { 
  TrendingUp, DollarSign, Calculator, PiggyBank, 
  Calendar, Save, Loader2, Info, Target, Clock
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface InvestmentSectionProps {
  propertyId: string;
}

interface InvestmentMetrics {
  totalInvestment: number;
  annualIncome: number;
  annualExpenses: number;
  netOperatingIncome: number;
  grossYield: number;
  capRate: number;
  roi: number;
  paybackYears: number;
  occupancyRate: number;
}

export function PropertyManageInvestmentSection({ propertyId }: InvestmentSectionProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  
  const { data: property, isLoading: loadingProperty } = useOwnerProperty(propertyId);
  const { data: financialStats, isLoading: loadingStats } = useFinancialStats(propertyId);
  const { data: transactions } = usePropertyFinancialsFull(propertyId);
  const updateProperty = useUpdateOwnerProperty();
  
  const [purchasePrice, setPurchasePrice] = useState<string>('');
  const [acquisitionCosts, setAcquisitionCosts] = useState<string>('');
  const [renovationCosts, setRenovationCosts] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  
  // Initialize from property data
  useState(() => {
    if (property) {
      setPurchasePrice(property.purchase_price?.toString() || '');
      setAcquisitionCosts(property.acquisition_costs?.toString() || '');
      setRenovationCosts(property.renovation_costs?.toString() || '');
    }
  });

  // Calculate investment metrics
  const metrics = useMemo<InvestmentMetrics | null>(() => {
    const purchase = parseFloat(purchasePrice) || (property?.purchase_price as number) || 0;
    const acquisition = parseFloat(acquisitionCosts) || (property?.acquisition_costs as number) || 0;
    const renovation = parseFloat(renovationCosts) || (property?.renovation_costs as number) || 0;
    
    if (!purchase || purchase <= 0) return null;
    
    const totalInvestment = purchase + acquisition + renovation;
    
    // Use financial stats for income/expenses
    const annualIncome = financialStats?.totalIncome || 0;
    const annualExpenses = financialStats?.totalExpenses || 0;
    const netOperatingIncome = annualIncome - annualExpenses;
    
    // Calculate rates
    const grossYield = purchase > 0 ? (annualIncome / purchase) * 100 : 0;
    const capRate = purchase > 0 ? (netOperatingIncome / purchase) * 100 : 0;
    const roi = totalInvestment > 0 ? (netOperatingIncome / totalInvestment) * 100 : 0;
    const paybackYears = netOperatingIncome > 0 ? totalInvestment / netOperatingIncome : Infinity;
    
    // Estimate occupancy (simplified - would need booking data for accurate calc)
    const occupancyRate = 72; // Placeholder - integrate with booking data later
    
    return {
      totalInvestment,
      annualIncome,
      annualExpenses,
      netOperatingIncome,
      grossYield,
      capRate,
      roi,
      paybackYears,
      occupancyRate,
    };
  }, [purchasePrice, acquisitionCosts, renovationCosts, property, financialStats]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateProperty.mutateAsync({
        id: propertyId,
        purchase_price: parseFloat(purchasePrice) || null,
        acquisition_costs: parseFloat(acquisitionCosts) || 0,
        renovation_costs: parseFloat(renovationCosts) || 0,
      } as any);
      toast.success(isRu ? 'Данные сохранены' : 'Data saved');
    } catch (error) {
      toast.error(isRu ? 'Ошибка сохранения' : 'Save failed');
    } finally {
      setIsSaving(false);
    }
  };

  if (loadingProperty || loadingStats) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-48 w-full rounded-none" />
        <Skeleton className="h-64 w-full rounded-none" />
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-none bg-primary/10">
            <TrendingUp className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">
              {isRu ? 'Инвестиционный анализ' : 'Investment Analysis'}
            </h2>
            <p className="text-sm text-muted-foreground">
              {isRu ? 'Доходность и окупаемость объекта' : 'Property ROI and profitability'}
            </p>
          </div>
        </div>

        {/* Acquisition Costs Input */}
        <SectionCard>
          <SectionTitle>
            <div className="flex items-center gap-2">
              <PiggyBank className="h-4 w-4" />
              {isRu ? 'Стоимость приобретения' : 'Acquisition Costs'}
            </div>
          </SectionTitle>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                {isRu ? 'Цена покупки' : 'Purchase Price'}
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3.5 w-3.5 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    {isRu ? 'Стоимость покупки недвижимости' : 'Property purchase price'}
                  </TooltipContent>
                </Tooltip>
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">฿</span>
                <Input
                  type="number"
                  value={purchasePrice}
                  onChange={(e) => setPurchasePrice(e.target.value)}
                  placeholder="5,000,000"
                  className="pl-7"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                {isRu ? 'Доп. расходы' : 'Additional Costs'}
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3.5 w-3.5 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    {isRu ? 'Налоги, юрист, оформление' : 'Taxes, legal, closing costs'}
                  </TooltipContent>
                </Tooltip>
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">฿</span>
                <Input
                  type="number"
                  value={acquisitionCosts}
                  onChange={(e) => setAcquisitionCosts(e.target.value)}
                  placeholder="350,000"
                  className="pl-7"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="flex items-center gap-1">
                {isRu ? 'Ремонт/мебель' : 'Renovation/Furnishing'}
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-3.5 w-3.5 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    {isRu ? 'Затраты на ремонт и меблировку' : 'Renovation and furnishing costs'}
                  </TooltipContent>
                </Tooltip>
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">฿</span>
                <Input
                  type="number"
                  value={renovationCosts}
                  onChange={(e) => setRenovationCosts(e.target.value)}
                  placeholder="200,000"
                  className="pl-7"
                />
              </div>
            </div>
          </div>
          
          <Separator className="my-4" />
          
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                {isRu ? 'Общие инвестиции' : 'Total Investment'}
              </p>
              <p className="text-2xl font-bold text-primary">
                {formatPriceWithSymbol(metrics?.totalInvestment || 0, 'THB')}
              </p>
            </div>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {isRu ? 'Сохранить' : 'Save'}
            </Button>
          </div>
        </SectionCard>

        {/* Financial Performance */}
        <SectionCard>
          <SectionTitle>
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              {isRu ? 'Финансовые показатели' : 'Financial Performance'}
            </div>
          </SectionTitle>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <MetricCard
              label={isRu ? 'Доходы' : 'Income'}
              value={formatPriceWithSymbol(financialStats?.totalIncome || 0, 'THB')}
              trend={financialStats?.thisMonthIncome ? `+${formatPriceWithSymbol(financialStats.thisMonthIncome, 'THB')}` : undefined}
              trendUp
            />
            <MetricCard
              label={isRu ? 'Расходы' : 'Expenses'}
              value={formatPriceWithSymbol(financialStats?.totalExpenses || 0, 'THB')}
              trend={financialStats?.thisMonthExpenses ? formatPriceWithSymbol(financialStats.thisMonthExpenses, 'THB') : undefined}
            />
            <MetricCard
              label={isRu ? 'Чистый доход' : 'Net Income'}
              value={formatPriceWithSymbol(financialStats?.netIncome || 0, 'THB')}
              highlight={(financialStats?.netIncome || 0) > 0}
            />
            <MetricCard
              label={isRu ? 'Загрузка' : 'Occupancy'}
              value={`${metrics?.occupancyRate || 0}%`}
            />
          </div>
        </SectionCard>

        {/* Investment Metrics */}
        {metrics && metrics.totalInvestment > 0 ? (
          <SectionCard>
            <SectionTitle>
              <div className="flex items-center gap-2">
                <Calculator className="h-4 w-4" />
                {isRu ? 'Ключевые метрики инвестора' : 'Key Investor Metrics'}
              </div>
            </SectionTitle>
            
            <div className="space-y-6">
              {/* ROI */}
              <MetricRow
                label="ROI"
                sublabel={isRu ? 'Return on Investment' : 'Return on Investment'}
                value={`${metrics.roi.toFixed(1)}%`}
                description={
                  isRu 
                    ? `${formatPriceWithSymbol(metrics.netOperatingIncome, 'THB')} / ${formatPriceWithSymbol(metrics.totalInvestment, 'THB')}`
                    : `${formatPriceWithSymbol(metrics.netOperatingIncome, 'THB')} / ${formatPriceWithSymbol(metrics.totalInvestment, 'THB')}`
                }
                progress={Math.min(metrics.roi * 5, 100)}
                tooltip={isRu ? 'Возврат на инвестиции: чистый доход / общие инвестиции' : 'Return on total investment'}
              />
              
              {/* Cap Rate */}
              <MetricRow
                label="Cap Rate"
                sublabel={isRu ? 'Ставка капитализации' : 'Capitalization Rate'}
                value={`${metrics.capRate.toFixed(1)}%`}
                description={
                  isRu 
                    ? `NOI ${formatPriceWithSymbol(metrics.netOperatingIncome, 'THB')} / ${formatPriceWithSymbol(parseFloat(purchasePrice) || 0, 'THB')}`
                    : `NOI ${formatPriceWithSymbol(metrics.netOperatingIncome, 'THB')} / ${formatPriceWithSymbol(parseFloat(purchasePrice) || 0, 'THB')}`
                }
                progress={Math.min(metrics.capRate * 5, 100)}
                tooltip={isRu ? 'Чистый операционный доход / стоимость покупки' : 'Net Operating Income / Purchase Price'}
              />
              
              {/* Gross Yield */}
              <MetricRow
                label="Gross Yield"
                sublabel={isRu ? 'Валовая доходность' : 'Gross Rental Yield'}
                value={`${metrics.grossYield.toFixed(1)}%`}
                description={
                  isRu 
                    ? `Доход ${formatPriceWithSymbol(metrics.annualIncome, 'THB')} / ${formatPriceWithSymbol(parseFloat(purchasePrice) || 0, 'THB')}`
                    : `Income ${formatPriceWithSymbol(metrics.annualIncome, 'THB')} / ${formatPriceWithSymbol(parseFloat(purchasePrice) || 0, 'THB')}`
                }
                progress={Math.min(metrics.grossYield * 5, 100)}
                tooltip={isRu ? 'Валовой доход / стоимость покупки (без расходов)' : 'Gross income / Purchase price (before expenses)'}
              />
              
              <Separator />
              
              {/* Payback Period */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-none bg-muted">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium">
                      {isRu ? 'Срок окупаемости' : 'Payback Period'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {isRu ? 'При текущей доходности' : 'At current yield'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">
                    {metrics.paybackYears === Infinity 
                      ? '∞' 
                      : `~${Math.round(metrics.paybackYears)} ${isRu ? 'лет' : 'years'}`}
                  </p>
                </div>
              </div>
            </div>
          </SectionCard>
        ) : (
          <SectionCard className="text-center py-8">
            <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {isRu 
                ? 'Укажите стоимость покупки для расчёта метрик' 
                : 'Enter purchase price to calculate metrics'}
            </p>
          </SectionCard>
        )}

        {/* Data Notice */}
        <p className="text-xs text-muted-foreground text-center">
          {isRu 
            ? 'Данные о доходах и расходах подтягиваются из раздела "Финансы"' 
            : 'Income and expense data is pulled from the Financials section'}
        </p>
      </div>
    </TooltipProvider>
  );
}

// Helper Components

interface MetricCardProps {
  label: string;
  value: string;
  trend?: string;
  trendUp?: boolean;
  highlight?: boolean;
}

function MetricCard({ label, value, trend, trendUp, highlight }: MetricCardProps) {
  return (
    <div className={`p-3 rounded-none border ${highlight ? 'bg-success/10 border-success/40' : 'bg-muted/50'}`}>
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className={`text-lg font-bold ${highlight ? 'text-success' : ''}`}>{value}</p>
      {trend && (
        <p className={`text-xs ${trendUp ? 'text-success' : 'text-muted-foreground'}`}>
          {trend}
        </p>
      )}
    </div>
  );
}

interface MetricRowProps {
  label: string;
  sublabel: string;
  value: string;
  description: string;
  progress: number;
  tooltip: string;
}

function MetricRow({ label, sublabel, value, description, progress, tooltip }: MetricRowProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-semibold">{label}</span>
          <Tooltip>
            <TooltipTrigger>
              <Info className="h-3.5 w-3.5 text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">{tooltip}</TooltipContent>
          </Tooltip>
        </div>
        <Badge variant="secondary" className="font-mono text-base">
          {value}
        </Badge>
      </div>
      <Progress value={progress} className="h-2" />
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  );
}
