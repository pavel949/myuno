/**
 * PEYLAA ROI Calculator — Interactive investment calculator
 */
import React, { useState, useMemo } from 'react';
import { Calculator, TrendingUp, DollarSign, Home, Percent } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { formatThb } from '@/hooks/usePeylaa';

interface Props {
  onGetConsultation: () => void;
}

// Presets based on actual PEYLAA prices
const PRESETS = [
  { label: '1BR (45м²)', price: 8000000, area: 45.57, rent: 45000 },
  { label: '2BR Corner (83м²)', price: 14500000, area: 83.5, rent: 75000 },
  { label: '2BR Middle (83м²)', price: 14000000, area: 83.5, rent: 72000 },
];

export function PeylaaROICalculator({ onGetConsultation }: Props) {
  const [activePreset, setActivePreset] = useState(0);
  const [purchasePrice, setPurchasePrice] = useState(PRESETS[0].price);
  const [monthlyRent, setMonthlyRent] = useState(PRESETS[0].rent);
  const [occupancyRate, setOccupancyRate] = useState(75);
  const [annualAppreciation, setAnnualAppreciation] = useState(5);
  const [managementFee, setManagementFee] = useState(25);
  const [holdYears, setHoldYears] = useState(5);

  const selectPreset = (i: number) => {
    setActivePreset(i);
    setPurchasePrice(PRESETS[i].price);
    setMonthlyRent(PRESETS[i].rent);
  };

  const calc = useMemo(() => {
    const annualRent = monthlyRent * 12 * (occupancyRate / 100);
    const managementCost = annualRent * (managementFee / 100);
    const camFee = PRESETS[activePreset].area * 120 * 12; // ฿120/sqm/month
    const netRentalIncome = annualRent - managementCost - camFee;
    const grossYield = (annualRent / purchasePrice) * 100;
    const netYield = (netRentalIncome / purchasePrice) * 100;

    // Capital appreciation over hold period
    const futureValue = purchasePrice * Math.pow(1 + annualAppreciation / 100, holdYears);
    const capitalGain = futureValue - purchasePrice;

    // Total return
    const totalRentalIncome = netRentalIncome * holdYears;
    const totalReturn = capitalGain + totalRentalIncome;
    const totalROI = (totalReturn / purchasePrice) * 100;
    const annualizedROI = (Math.pow(1 + totalReturn / purchasePrice, 1 / holdYears) - 1) * 100;

    return {
      annualRent,
      netRentalIncome,
      grossYield,
      netYield,
      capitalGain,
      futureValue,
      totalRentalIncome,
      totalReturn,
      totalROI,
      annualizedROI,
      camFee,
    };
  }, [purchasePrice, monthlyRent, occupancyRate, annualAppreciation, managementFee, holdYears, activePreset]);

  return (
    <div className="space-y-6">
      {/* Presets */}
      <div className="flex flex-wrap gap-2 justify-center">
        {PRESETS.map((p, i) => (
          <button
            key={p.label}
            onClick={() => selectPreset(i)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activePreset === i
                ? 'bg-amber-500 text-black'
                : 'bg-white/5 border border-white/10 text-white/60 hover:bg-white/10'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Inputs */}
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-6 space-y-5">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <Calculator className="w-4 h-4 text-amber-400" />
              Параметры
            </h3>

            <div>
              <label className="text-xs text-white/40 flex justify-between">
                <span>Цена покупки</span>
                <span className="text-amber-400" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{formatThb(purchasePrice)}</span>
              </label>
              <input
                type="range"
                min={5000000}
                max={20000000}
                step={500000}
                value={purchasePrice}
                onChange={e => setPurchasePrice(Number(e.target.value))}
                className="w-full mt-2 accent-amber-500"
              />
            </div>

            <div>
              <label className="text-xs text-white/40 flex justify-between">
                <span>Аренда в месяц</span>
                <span className="text-amber-400" style={{ fontFamily: 'JetBrains Mono, monospace' }}>฿{monthlyRent.toLocaleString()}</span>
              </label>
              <input
                type="range"
                min={20000}
                max={150000}
                step={5000}
                value={monthlyRent}
                onChange={e => setMonthlyRent(Number(e.target.value))}
                className="w-full mt-2 accent-amber-500"
              />
            </div>

            <div>
              <label className="text-xs text-white/40 flex justify-between">
                <span>Загрузка</span>
                <span>{occupancyRate}%</span>
              </label>
              <input
                type="range"
                min={50}
                max={95}
                step={5}
                value={occupancyRate}
                onChange={e => setOccupancyRate(Number(e.target.value))}
                className="w-full mt-2 accent-amber-500"
              />
            </div>

            <div>
              <label className="text-xs text-white/40 flex justify-between">
                <span>Рост стоимости / год</span>
                <span>{annualAppreciation}%</span>
              </label>
              <input
                type="range"
                min={0}
                max={15}
                step={1}
                value={annualAppreciation}
                onChange={e => setAnnualAppreciation(Number(e.target.value))}
                className="w-full mt-2 accent-amber-500"
              />
            </div>

            <div>
              <label className="text-xs text-white/40 flex justify-between">
                <span>Горизонт (лет)</span>
                <span>{holdYears}</span>
              </label>
              <input
                type="range"
                min={1}
                max={10}
                step={1}
                value={holdYears}
                onChange={e => setHoldYears(Number(e.target.value))}
                className="w-full mt-2 accent-amber-500"
              />
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-6 space-y-5">
            <h3 className="text-white font-semibold flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              Результат за {holdYears} {holdYears === 1 ? 'год' : holdYears < 5 ? 'года' : 'лет'}
            </h3>

            {/* Key metrics */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-white/5">
                <div className="text-xs text-white/40">Gross Yield</div>
                <div className="text-xl font-bold text-white" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                  {calc.grossYield.toFixed(1)}%
                </div>
              </div>
              <div className="p-3 rounded-lg bg-white/5">
                <div className="text-xs text-white/40">Net Yield</div>
                <div className="text-xl font-bold text-emerald-400" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                  {calc.netYield.toFixed(1)}%
                </div>
              </div>
              <div className="p-3 rounded-lg bg-white/5">
                <div className="text-xs text-white/40">Total ROI</div>
                <div className="text-xl font-bold text-amber-400" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                  {calc.totalROI.toFixed(0)}%
                </div>
              </div>
              <div className="p-3 rounded-lg bg-white/5">
                <div className="text-xs text-white/40">ROI / год</div>
                <div className="text-xl font-bold text-amber-400" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                  {calc.annualizedROI.toFixed(1)}%
                </div>
              </div>
            </div>

            {/* Breakdown */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-white/60">
                <span>Доход от аренды (net)</span>
                <span className="text-emerald-400" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                  +{formatThb(calc.totalRentalIncome)}
                </span>
              </div>
              <div className="flex justify-between text-white/60">
                <span>Рост стоимости</span>
                <span className="text-emerald-400" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                  +{formatThb(calc.capitalGain)}
                </span>
              </div>
              <div className="flex justify-between text-white/60 border-t border-white/10 pt-2">
                <span className="font-semibold text-white">Общий доход</span>
                <span className="font-bold text-amber-400" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                  +{formatThb(calc.totalReturn)}
                </span>
              </div>
              <div className="flex justify-between text-white/40 text-xs">
                <span>Стоимость через {holdYears} лет</span>
                <span style={{ fontFamily: 'JetBrains Mono, monospace' }}>{formatThb(calc.futureValue)}</span>
              </div>
            </div>

            <Button
              className="w-full bg-amber-500 hover:bg-amber-600 text-black font-bold"
              onClick={onGetConsultation}
            >
              Получить детальный расчёт
            </Button>

            <p className="text-[10px] text-white/30 text-center leading-relaxed">
              Расчёт носит ознакомительный характер. Фактическая доходность зависит от рыночных условий.
              Данные CBRE: средняя доходность branded residences Пхукета — 6–8% gross.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
