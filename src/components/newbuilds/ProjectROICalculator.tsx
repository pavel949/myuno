/**
 * ProjectROICalculator — reusable ROI calculator for newbuild microsites.
 *
 * Pure presentation: receives presets + currency + theme via props, no DB calls.
 * Used by /peylaa today and by /p/:slug microsites going forward.
 */
import React, { useState, useMemo } from 'react';
import { Calculator, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export interface RoiPreset {
  label: string;
  /** Purchase price in base currency (THB). */
  price: number;
  /** Unit area in m² — used for CAM fee calc. */
  area: number;
  /** Default monthly rent in base currency (THB). */
  rent: number;
}

interface Props {
  presets: RoiPreset[];
  /** CAM fee per m² per month (THB). Defaults to 120. */
  camFeePerSqmMonthly?: number;
  /** Currency symbol prefix, e.g. '฿'. */
  currencySymbol?: string;
  /** USD conversion rate (1 USD = X THB). Defaults to 35. */
  usdRate?: number;
  /** Disclaimer line shown below the result card. */
  disclaimer?: string;
  onGetConsultation: () => void;
}

function formatThb(amount: number, symbol = '฿'): string {
  if (!amount) return '—';
  if (amount >= 1_000_000) return `${symbol}${(amount / 1_000_000).toFixed(1)}M`;
  return `${symbol}${amount.toLocaleString()}`;
}

export function ProjectROICalculator({
  presets,
  camFeePerSqmMonthly = 120,
  currencySymbol = '฿',
  disclaimer,
  onGetConsultation,
}: Props) {
  const [activePreset, setActivePreset] = useState(0);
  const [purchasePrice, setPurchasePrice] = useState(presets[0]?.price ?? 0);
  const [monthlyRent, setMonthlyRent] = useState(presets[0]?.rent ?? 0);
  const [occupancyRate, setOccupancyRate] = useState(75);
  const [annualAppreciation, setAnnualAppreciation] = useState(5);
  const [managementFee, setManagementFee] = useState(25);
  const [holdYears, setHoldYears] = useState(5);

  const selectPreset = (i: number) => {
    setActivePreset(i);
    setPurchasePrice(presets[i].price);
    setMonthlyRent(presets[i].rent);
  };

  const calc = useMemo(() => {
    const area = presets[activePreset]?.area ?? 0;
    const annualRent = monthlyRent * 12 * (occupancyRate / 100);
    const managementCost = annualRent * (managementFee / 100);
    const camFee = area * camFeePerSqmMonthly * 12;
    const netRentalIncome = annualRent - managementCost - camFee;
    const grossYield = purchasePrice ? (annualRent / purchasePrice) * 100 : 0;
    const netYield = purchasePrice ? (netRentalIncome / purchasePrice) * 100 : 0;
    const futureValue = purchasePrice * Math.pow(1 + annualAppreciation / 100, holdYears);
    const capitalGain = futureValue - purchasePrice;
    const totalRentalIncome = netRentalIncome * holdYears;
    const totalReturn = capitalGain + totalRentalIncome;
    const totalROI = purchasePrice ? (totalReturn / purchasePrice) * 100 : 0;
    const annualizedROI = purchasePrice
      ? (Math.pow(1 + totalReturn / purchasePrice, 1 / holdYears) - 1) * 100
      : 0;
    return {
      annualRent, netRentalIncome, grossYield, netYield, capitalGain,
      futureValue, totalRentalIncome, totalReturn, totalROI, annualizedROI, camFee,
    };
  }, [purchasePrice, monthlyRent, occupancyRate, annualAppreciation, managementFee, holdYears, activePreset, presets, camFeePerSqmMonthly]);

  if (presets.length === 0) {
    return (
      <div className="text-center py-8 text-white/40 text-sm">
        Калькулятор недоступен — нет доступных юнитов
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 justify-center">
        {presets.map((p, i) => (
          <button
            key={p.label}
            onClick={() => selectPreset(i)}
            className={`px-4 py-2 rounded-none text-sm font-medium transition-colors ${
              activePreset === i
                ? 'bg-accent text-black'
                : 'bg-white/5 border border-white/10 text-white/60 hover:bg-white/10'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-6 space-y-5">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <Calculator className="w-4 h-4 text-accent" /> Параметры
            </h3>

            <SliderRow
              label="Цена покупки"
              value={purchasePrice}
              display={formatThb(purchasePrice, currencySymbol)}
              min={5_000_000} max={20_000_000} step={500_000}
              onChange={setPurchasePrice}
            />
            <SliderRow
              label="Аренда в месяц"
              value={monthlyRent}
              display={`${currencySymbol}${monthlyRent.toLocaleString()}`}
              min={20_000} max={150_000} step={5_000}
              onChange={setMonthlyRent}
            />
            <SliderRow label="Загрузка" value={occupancyRate} display={`${occupancyRate}%`}
              min={50} max={95} step={5} onChange={setOccupancyRate} />
            <SliderRow label="Рост стоимости / год" value={annualAppreciation}
              display={`${annualAppreciation}%`} min={0} max={15} step={1}
              onChange={setAnnualAppreciation} />
            <SliderRow label="Горизонт (лет)" value={holdYears} display={`${holdYears}`}
              min={1} max={10} step={1} onChange={setHoldYears} />
          </CardContent>
        </Card>

        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-6 space-y-5">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-success" />
              Результат за {holdYears} {holdYears === 1 ? 'год' : holdYears < 5 ? 'года' : 'лет'}
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <Metric label="Gross Yield" value={`${calc.grossYield.toFixed(1)}%`} tone="white" />
              <Metric label="Net Yield" value={`${calc.netYield.toFixed(1)}%`} tone="emerald" />
              <Metric label="Total ROI" value={`${calc.totalROI.toFixed(0)}%`} tone="amber" />
              <Metric label="ROI / год" value={`${calc.annualizedROI.toFixed(1)}%`} tone="amber" />
            </div>

            <div className="space-y-2 text-sm">
              <Row label="Доход от аренды (net)" value={`+${formatThb(calc.totalRentalIncome, currencySymbol)}`} accent="emerald" />
              <Row label="Рост стоимости" value={`+${formatThb(calc.capitalGain, currencySymbol)}`} accent="emerald" />
              <div className="flex justify-between text-white/60 border-t border-white/10 pt-2">
                <span className="font-semibold text-white">Общий доход</span>
                <span className="font-mono font-bold text-accent">
                  +{formatThb(calc.totalReturn, currencySymbol)}
                </span>
              </div>
              <div className="flex justify-between text-white/40 text-xs">
                <span>Стоимость через {holdYears} лет</span>
                <span className="font-mono">{formatThb(calc.futureValue, currencySymbol)}</span>
              </div>
            </div>

            <Button className="w-full bg-accent hover:bg-accent text-black font-bold" onClick={onGetConsultation}>
              Получить детальный расчёт
            </Button>

            {disclaimer && (
              <p className="text-[10px] text-white/30 text-center leading-relaxed">{disclaimer}</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SliderRow({ label, value, display, min, max, step, onChange }: {
  label: string; value: number; display: string; min: number; max: number; step: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <label className="text-xs text-white/40 flex justify-between">
        <span>{label}</span>
        <span className="font-mono text-accent">{display}</span>
      </label>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full mt-2 accent-amber-500"
      />
    </div>
  );
}

function Metric({ label, value, tone }: { label: string; value: string; tone: 'white' | 'emerald' | 'amber' }) {
  const toneClass = tone === 'emerald' ? 'text-success' : tone === 'amber' ? 'text-accent' : 'text-white';
  return (
    <div className="p-3 rounded-none bg-white/5">
      <div className="text-xs text-white/40">{label}</div>
      <div className={`font-mono text-xl font-bold ${toneClass}`}>
        {value}
      </div>
    </div>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent: 'emerald' }) {
  return (
    <div className="flex justify-between text-white/60">
      <span>{label}</span>
      <span className={`font-mono ${accent === 'emerald' ? 'text-success' : ''}`}>
        {value}
      </span>
    </div>
  );
}
