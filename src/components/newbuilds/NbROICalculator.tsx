/**
 * NbROICalculator — Full investment ROI calculator for Phuket newbuilds
 * Pre-fills from project data, computes yields, payback, projections
 */
import React, { useState, useMemo } from 'react';
import { Calculator, TrendingUp, DollarSign, Clock, Copy, Check } from 'lucide-react';

interface Props {
  /** Pre-fill purchase price */
  defaultPrice?: number | null;
  /** Pre-fill projected ROI % */
  defaultRoi?: number | null;
  /** Pre-fill CAM fee per sqm */
  defaultCamFee?: number | null;
  /** Compact mode for sidebar */
  compact?: boolean;
}

interface CalcInputs {
  purchasePrice: number;
  rentalPerNight: number;
  occupancyRate: number;
  annualAppreciation: number;
  camFeeMonthly: number;
  managementFee: number;
  taxRate: number;
  furnishingCost: number;
}

const DEFAULT_INPUTS: CalcInputs = {
  purchasePrice: 5_000_000,
  rentalPerNight: 3_000,
  occupancyRate: 70,
  annualAppreciation: 5,
  camFeeMonthly: 3_000,
  managementFee: 20,
  taxRate: 5,
  furnishingCost: 500_000,
};

function formatThb(value: number): string {
  if (Math.abs(value) >= 1_000_000) return `฿${(value / 1_000_000).toFixed(2)}M`;
  if (Math.abs(value) >= 1_000) return `฿${(value / 1_000).toFixed(0)}K`;
  return `฿${value.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
}

export function NbROICalculator({ defaultPrice, defaultRoi, defaultCamFee, compact = false }: Props) {
  const [inputs, setInputs] = useState<CalcInputs>({
    ...DEFAULT_INPUTS,
    purchasePrice: defaultPrice || DEFAULT_INPUTS.purchasePrice,
    camFeeMonthly: defaultCamFee ? defaultCamFee * 40 : DEFAULT_INPUTS.camFeeMonthly, // rough estimate: 40sqm avg unit
  });
  const [copied, setCopied] = useState(false);

  const update = (field: keyof CalcInputs, value: string) => {
    const num = parseFloat(value) || 0;
    setInputs(prev => ({ ...prev, [field]: num }));
  };

  const results = useMemo(() => {
    const totalInvestment = inputs.purchasePrice + inputs.furnishingCost;
    const occupiedDays = Math.round(365 * (inputs.occupancyRate / 100));
    const grossRentalIncome = inputs.rentalPerNight * occupiedDays;
    const camAnnual = inputs.camFeeMonthly * 12;
    const managementCost = grossRentalIncome * (inputs.managementFee / 100);
    const taxCost = grossRentalIncome * (inputs.taxRate / 100);
    const totalExpenses = camAnnual + managementCost + taxCost;
    const netRentalIncome = grossRentalIncome - totalExpenses;
    const grossYield = totalInvestment > 0 ? (grossRentalIncome / totalInvestment) * 100 : 0;
    const netYield = totalInvestment > 0 ? (netRentalIncome / totalInvestment) * 100 : 0;
    const monthlyCashFlow = netRentalIncome / 12;
    const paybackYears = netRentalIncome > 0 ? totalInvestment / netRentalIncome : Infinity;

    // Projections
    const projections = [1, 3, 5, 10].map(year => {
      const appreciatedValue = inputs.purchasePrice * Math.pow(1 + inputs.annualAppreciation / 100, year);
      const totalRental = netRentalIncome * year;
      const totalReturn = (appreciatedValue - inputs.purchasePrice) + totalRental;
      const totalROI = totalInvestment > 0 ? (totalReturn / totalInvestment) * 100 : 0;
      return { year, propertyValue: appreciatedValue, totalRental, totalReturn, totalROI };
    });

    return {
      totalInvestment,
      grossRentalIncome,
      netRentalIncome,
      grossYield,
      netYield,
      monthlyCashFlow,
      paybackYears,
      totalExpenses,
      projections,
    };
  }, [inputs]);

  const copyResults = () => {
    const text = [
      `=== Инвестиционный расчёт ===`,
      `Стоимость: ${formatThb(inputs.purchasePrice)}`,
      `Общие инвестиции: ${formatThb(results.totalInvestment)}`,
      `Годовой доход (gross): ${formatThb(results.grossRentalIncome)}`,
      `Годовой доход (net): ${formatThb(results.netRentalIncome)}`,
      `Доходность gross: ${results.grossYield.toFixed(1)}%`,
      `Доходность net: ${results.netYield.toFixed(1)}%`,
      `Окупаемость: ${results.paybackYears === Infinity ? '∞' : `${results.paybackYears.toFixed(1)} лет`}`,
      `Ежемесячный кэшфлоу: ${formatThb(results.monthlyCashFlow)}`,
      ``,
      `Рассчитано на myUNO`,
    ].join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const inputStyle = {
    background: 'hsl(var(--nb-bg))',
    color: 'hsl(var(--nb-text))',
    border: '1px solid hsl(var(--nb-gold) / 0.2)',
  };

  return (
    <div className={`space-y-${compact ? '4' : '6'}`}>
      {!compact && (
        <div className="flex items-center gap-2">
          <Calculator className="w-5 h-5" style={{ color: 'hsl(var(--nb-gold))' }} />
          <h3 className="nb-display text-xl" style={{ color: 'hsl(var(--nb-text))' }}>ROI Калькулятор</h3>
        </div>
      )}

      {/* Inputs */}
      <div className={`grid ${compact ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'} gap-3`}>
        {([
          { key: 'purchasePrice', label: 'Цена покупки (฿)', placeholder: '5000000' },
          { key: 'furnishingCost', label: 'Мебель и отделка (฿)', placeholder: '500000' },
          { key: 'rentalPerNight', label: 'Аренда за ночь (฿)', placeholder: '3000' },
          { key: 'occupancyRate', label: 'Заполняемость (%)', placeholder: '70' },
          { key: 'annualAppreciation', label: 'Рост цены в год (%)', placeholder: '5' },
          { key: 'camFeeMonthly', label: 'CAM fee/мес (฿)', placeholder: '3000' },
          { key: 'managementFee', label: 'УК аренды (%)', placeholder: '20' },
          { key: 'taxRate', label: 'Налог (%)', placeholder: '5' },
        ] as { key: keyof CalcInputs; label: string; placeholder: string }[]).map(({ key, label, placeholder }) => (
          <div key={key}>
            <label className="text-[11px] mb-1 block" style={{ color: 'hsl(var(--nb-muted))' }}>{label}</label>
            <input
              type="number"
              value={inputs[key] || ''}
              onChange={e => update(key, e.target.value)}
              placeholder={placeholder}
              className="w-full px-3 py-2 rounded-none text-sm"
              style={inputStyle}
            />
          </div>
        ))}
      </div>

      {/* Results */}
      <div className="nb-separator" />
      <div className="space-y-4">
        <p className="nb-label">РЕЗУЛЬТАТЫ</p>

        <div className={`grid ${compact ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-4'} gap-3`}>
          <div className="p-3 rounded-none" style={{ background: 'hsl(var(--nb-surface))' }}>
            <p className="text-[10px] mb-1" style={{ color: 'hsl(var(--nb-muted))' }}>Gross доход/год</p>
            <p className="nb-mono text-sm font-bold" style={{ color: 'hsl(var(--nb-gold))' }}>{formatThb(results.grossRentalIncome)}</p>
          </div>
          <div className="p-3 rounded-none" style={{ background: 'hsl(var(--nb-surface))' }}>
            <p className="text-[10px] mb-1" style={{ color: 'hsl(var(--nb-muted))' }}>Net доход/год</p>
            <p className="nb-mono text-sm font-bold" style={{ color: results.netRentalIncome >= 0 ? 'hsl(142 70% 55%)' : 'hsl(0 70% 55%)' }}>{formatThb(results.netRentalIncome)}</p>
          </div>
          <div className="p-3 rounded-none" style={{ background: 'hsl(var(--nb-surface))' }}>
            <p className="text-[10px] mb-1" style={{ color: 'hsl(var(--nb-muted))' }}>Gross yield</p>
            <p className="nb-mono text-sm font-bold" style={{ color: 'hsl(var(--nb-gold))' }}>{results.grossYield.toFixed(1)}%</p>
          </div>
          <div className="p-3 rounded-none" style={{ background: 'hsl(var(--nb-surface))' }}>
            <p className="text-[10px] mb-1" style={{ color: 'hsl(var(--nb-muted))' }}>Net yield</p>
            <p className="nb-mono text-sm font-bold" style={{ color: results.netYield >= 0 ? 'hsl(142 70% 55%)' : 'hsl(0 70% 55%)' }}>{results.netYield.toFixed(1)}%</p>
          </div>
        </div>

        {/* Key metrics */}
        <div className="nb-glass p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" style={{ color: 'hsl(var(--nb-gold))' }} />
              <span className="text-sm" style={{ color: 'hsl(var(--nb-text))' }}>Окупаемость</span>
            </div>
            <span className="nb-mono font-bold" style={{ color: 'hsl(var(--nb-gold))' }}>
              {results.paybackYears === Infinity ? '—' : `${results.paybackYears.toFixed(1)} лет`}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" style={{ color: 'hsl(var(--nb-gold))' }} />
              <span className="text-sm" style={{ color: 'hsl(var(--nb-text))' }}>Кэшфлоу/мес</span>
            </div>
            <span className="nb-mono font-bold" style={{ color: results.monthlyCashFlow >= 0 ? 'hsl(142 70% 55%)' : 'hsl(0 70% 55%)' }}>
              {formatThb(results.monthlyCashFlow)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" style={{ color: 'hsl(var(--nb-gold))' }} />
              <span className="text-sm" style={{ color: 'hsl(var(--nb-text))' }}>Расходы/год</span>
            </div>
            <span className="nb-mono font-bold" style={{ color: 'hsl(var(--nb-muted))' }}>
              {formatThb(results.totalExpenses)}
            </span>
          </div>
        </div>

        {/* Projections */}
        {!compact && (
          <div>
            <p className="nb-label mb-3">ПРОГНОЗ</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid hsl(var(--nb-gold) / 0.15)' }}>
                    <th className="text-left py-2 text-xs font-normal" style={{ color: 'hsl(var(--nb-muted))' }}>Год</th>
                    <th className="text-right py-2 text-xs font-normal" style={{ color: 'hsl(var(--nb-muted))' }}>Стоимость</th>
                    <th className="text-right py-2 text-xs font-normal" style={{ color: 'hsl(var(--nb-muted))' }}>Доход за период</th>
                    <th className="text-right py-2 text-xs font-normal" style={{ color: 'hsl(var(--nb-muted))' }}>Общий ROI</th>
                  </tr>
                </thead>
                <tbody>
                  {results.projections.map(p => (
                    <tr key={p.year} style={{ borderBottom: '1px solid hsl(var(--nb-gold) / 0.08)' }}>
                      <td className="py-2.5 nb-mono" style={{ color: 'hsl(var(--nb-text))' }}>{p.year}г</td>
                      <td className="py-2.5 text-right nb-mono" style={{ color: 'hsl(var(--nb-text))' }}>{formatThb(p.propertyValue)}</td>
                      <td className="py-2.5 text-right nb-mono" style={{ color: 'hsl(142 70% 55%)' }}>{formatThb(p.totalRental)}</td>
                      <td className="py-2.5 text-right nb-mono font-bold" style={{ color: p.totalROI >= 0 ? 'hsl(var(--nb-gold))' : 'hsl(0 70% 55%)' }}>
                        {p.totalROI.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Copy results */}
        <button
          onClick={copyResults}
          className="w-full py-2.5 rounded-none text-sm font-medium flex items-center justify-center gap-2 transition-all"
          style={{ background: 'hsl(var(--nb-gold) / 0.15)', color: 'hsl(var(--nb-gold))', border: '1px solid hsl(var(--nb-gold) / 0.3)' }}
        >
          {copied ? <><Check className="w-4 h-4" /> Скопировано</> : <><Copy className="w-4 h-4" /> Копировать результаты</>}
        </button>
      </div>
    </div>
  );
}
