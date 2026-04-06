import { useState, useMemo } from 'react';
import { Calculator, TrendingUp, Percent, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { useLanguage } from '@/contexts/LanguageContext';

interface Props {
  purchasePrice?: number;
  currency?: string;
  nightlyRate?: number;
}

function fmt(n: number, currency = 'THB'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(n);
}

export function ROICalculator({ purchasePrice = 0, currency = 'THB', nightlyRate = 0 }: Props) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const [price, setPrice] = useState(purchasePrice);
  const [nightly, setNightly] = useState(nightlyRate || Math.round(purchasePrice * 0.0004));
  const [occupancy, setOccupancy] = useState(65);
  const [opCosts, setOpCosts] = useState(22);
  const [appreciation, setAppreciation] = useState(3);

  const calc = useMemo(() => {
    if (!price || price <= 0) return null;

    const grossAnnual = nightly * 365 * (occupancy / 100);
    const opCostAmount = grossAnnual * (opCosts / 100);
    const netAnnual = grossAnnual - opCostAmount;
    const grossYield = (grossAnnual / price) * 100;
    const netYield = (netAnnual / price) * 100;
    const capRate = netYield;

    // 5-year projection
    const appreciationTotal = price * (Math.pow(1 + appreciation / 100, 5) - 1);
    const totalReturn5yr = netAnnual * 5 + appreciationTotal;
    const annualizedROI = (totalReturn5yr / price / 5) * 100;

    return {
      grossAnnual: Math.round(grossAnnual),
      opCostAmount: Math.round(opCostAmount),
      netAnnual: Math.round(netAnnual),
      netMonthly: Math.round(netAnnual / 12),
      grossYield: Math.round(grossYield * 10) / 10,
      netYield: Math.round(netYield * 10) / 10,
      capRate: Math.round(capRate * 10) / 10,
      appreciationTotal: Math.round(appreciationTotal),
      totalReturn5yr: Math.round(totalReturn5yr),
      annualizedROI: Math.round(annualizedROI * 10) / 10,
    };
  }, [price, nightly, occupancy, opCosts, appreciation]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Calculator className="h-4 w-4" />
          {isRu ? 'Калькулятор ROI' : 'ROI Calculator'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Inputs */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-[11px]">{isRu ? 'Цена покупки' : 'Purchase Price'}</Label>
            <Input type="number" value={price || ''} onChange={e => setPrice(Number(e.target.value))} />
          </div>
          <div>
            <Label className="text-[11px]">{isRu ? 'Ставка/ночь' : 'Nightly Rate'}</Label>
            <Input type="number" value={nightly || ''} onChange={e => setNightly(Number(e.target.value))} />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between">
            <Label className="text-[11px]">{isRu ? 'Загрузка' : 'Occupancy'}</Label>
            <span className="text-xs font-medium">{occupancy}%</span>
          </div>
          <Slider value={[occupancy]} onValueChange={([v]) => setOccupancy(v)} min={20} max={95} step={5} />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between">
            <Label className="text-[11px]">{isRu ? 'Опер. расходы' : 'Operating Costs'}</Label>
            <span className="text-xs font-medium">{opCosts}%</span>
          </div>
          <Slider value={[opCosts]} onValueChange={([v]) => setOpCosts(v)} min={10} max={40} step={1} />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between">
            <Label className="text-[11px]">{isRu ? 'Рост цены/год' : 'Appreciation/yr'}</Label>
            <span className="text-xs font-medium">{appreciation}%</span>
          </div>
          <Slider value={[appreciation]} onValueChange={([v]) => setAppreciation(v)} min={0} max={10} step={0.5} />
        </div>

        {/* Results */}
        {calc && (
          <div className="border-t pt-3 space-y-2">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-muted/50 rounded-lg p-2">
                <p className="text-[10px] text-muted-foreground">{isRu ? 'Валовая доходн.' : 'Gross Yield'}</p>
                <p className="text-lg font-bold text-primary">{calc.grossYield}%</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-2">
                <p className="text-[10px] text-muted-foreground">{isRu ? 'Чистая доходн.' : 'Net Yield'}</p>
                <p className="text-lg font-bold text-success">{calc.netYield}%</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-2">
                <p className="text-[10px] text-muted-foreground">{isRu ? 'ROI 5 лет' : '5yr ROI'}</p>
                <p className="text-lg font-bold text-info">{calc.annualizedROI}%</p>
              </div>
            </div>

            <div className="text-xs space-y-1 text-muted-foreground">
              <div className="flex justify-between">
                <span>{isRu ? 'Годовой доход (валовый)' : 'Gross Annual'}</span>
                <span className="font-medium text-foreground">{fmt(calc.grossAnnual, currency)}</span>
              </div>
              <div className="flex justify-between">
                <span>{isRu ? 'Расходы' : 'Op. Costs'}</span>
                <span className="text-destructive">-{fmt(calc.opCostAmount, currency)}</span>
              </div>
              <div className="flex justify-between font-medium">
                <span>{isRu ? 'Чистый годовой' : 'Net Annual'}</span>
                <span className="text-foreground">{fmt(calc.netAnnual, currency)}</span>
              </div>
              <div className="flex justify-between">
                <span>{isRu ? 'Чистый месячный' : 'Net Monthly'}</span>
                <span className="font-medium text-foreground">{fmt(calc.netMonthly, currency)}</span>
              </div>
              <div className="flex justify-between pt-1 border-t">
                <span>{isRu ? 'Рост за 5 лет' : '5yr Appreciation'}</span>
                <span className="text-success">+{fmt(calc.appreciationTotal, currency)}</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
