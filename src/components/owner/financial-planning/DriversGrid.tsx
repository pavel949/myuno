import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Copy } from 'lucide-react';
import type { Drivers, MonthDriver } from '@/lib/finance/financialModelMath';

interface Props {
  drivers: Drivers;
  onChange: (next: Drivers) => void;
}

const MONTHS_RU = ['Янв','Фев','Мар','Апр','Май','Июн','Июл','Авг','Сен','Окт','Ноя','Дек'];
const MONTHS_EN = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

type DriverField = 'adr' | 'occupancy' | 'nights' | 'cleaningFeePerBooking' | 'otherIncomePct';

export function DriversGrid({ drivers, onChange }: Props) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const labels = isRu ? MONTHS_RU : MONTHS_EN;
  const [copied, setCopied] = useState<DriverField | null>(null);

  const update = (idx: number, field: DriverField, value: number) => {
    const next: MonthDriver[] = drivers.months.map((m, i) =>
      i === idx ? { ...m, [field]: value } : m
    );
    onChange({ ...drivers, months: next });
  };

  const copyToAll = (field: DriverField, idx: number) => {
    const v = drivers.months[idx][field];
    const next = drivers.months.map(m => ({ ...m, [field]: v }));
    onChange({ ...drivers, months: next });
    setCopied(field);
    setTimeout(() => setCopied(null), 1200);
  };

  const rows: Array<{ key: DriverField; label: string; isPct?: boolean; step?: number }> = [
    { key: 'adr', label: isRu ? 'ADR (฿/ночь)' : 'ADR (฿/night)', step: 100 },
    { key: 'occupancy', label: isRu ? 'Загрузка %' : 'Occupancy %', isPct: true, step: 0.05 },
    { key: 'nights', label: isRu ? 'Ночей доступно' : 'Available nights', step: 1 },
    { key: 'cleaningFeePerBooking', label: isRu ? 'Уборка ฿/бронь' : 'Cleaning ฿/booking', step: 100 },
    { key: 'otherIncomePct', label: isRu ? 'Доп. доход %' : 'Other income %', isPct: true, step: 0.01 },
  ];

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-xs min-w-[800px]">
            <thead className="bg-muted/50 sticky top-0">
              <tr>
                <th className="text-left px-3 py-2 sticky left-0 bg-muted/50 z-10 min-w-[160px]">
                  {isRu ? 'Драйвер' : 'Driver'}
                </th>
                {labels.map((l, i) => (
                  <th key={i} className="px-1 py-2 text-center font-medium text-muted-foreground min-w-[68px]">{l}</th>
                ))}
                <th className="px-2 py-2 text-center w-10"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map(row => (
                <tr key={row.key} className="border-t">
                  <td className="px-3 py-1.5 font-medium sticky left-0 bg-background z-10">{row.label}</td>
                  {drivers.months.map((m, idx) => {
                    const raw = m[row.key] ?? 0;
                    const display = row.isPct ? Number((raw * 100).toFixed(2)) : raw;
                    return (
                      <td key={idx} className="px-0.5 py-1">
                        <Input
                          type="number"
                          step={row.isPct ? 1 : row.step}
                          value={display}
                          onChange={e => {
                            const v = parseFloat(e.target.value) || 0;
                            update(idx, row.key, row.isPct ? v / 100 : v);
                          }}
                          className="h-8 text-xs px-1.5 text-right tabular-nums"
                        />
                      </td>
                    );
                  })}
                  <td className="px-1 py-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      onClick={() => copyToAll(row.key, 0)}
                      title={isRu ? 'Скопировать январь во все месяцы' : 'Copy January to all months'}
                    >
                      <Copy className={`h-3.5 w-3.5 ${copied === row.key ? 'text-success' : ''}`} />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[11px] text-muted-foreground p-3 border-t">
          {isRu
            ? 'Доход = ADR × Загрузка × Ночи. Уборка добавляется per booking. Изменения сохраняются автоматически.'
            : 'Revenue = ADR × Occupancy × Nights. Cleaning added per booking. Changes auto-save.'}
        </p>
      </CardContent>
    </Card>
  );
}
