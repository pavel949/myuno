import { useId } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { propertySupportsMode } from '@/lib/real-estate/propertyDetailIntent';
import { changeCommercialOffer, type PropertyCommercialValues } from '@/lib/propertyCommercialFields';

export function PropertyCommercialFields({ values, onChange, disabled = false }: { values: PropertyCommercialValues; onChange: (values: PropertyCommercialValues) => void; disabled?: boolean }) {
  const { language } = useLanguage();
  const ru = language === 'ru';
  const id = useId();
  const field = (key: keyof Pick<PropertyCommercialValues, 'price' | 'price_per_night' | 'price_per_month' | 'price_per_year' | 'sale_price' | 'currency' | 'sale_currency' | 'price_period'>, en: string, russian: string, numeric = true) => <div className="space-y-2"><Label htmlFor={`${id}-${key}`}>{ru ? russian : en}</Label>{key === 'price_period' ? <select id={`${id}-price_period`} className="h-10 w-full border border-input bg-background px-3 text-sm" value={values.price_period} onChange={event => onChange({ ...values, price_period: event.target.value })}>
    <option value="">{ru ? 'Не задан' : 'Not set'}</option>
    {!["", "night", "week", "month", "year", "total"].includes(values.price_period) && <option value={values.price_period}>{values.price_period}</option>}
    {(['night', 'week', 'month', 'year', 'total'] as const).map((value, index) => <option key={value} value={value}>{ru ? ['За ночь', 'За неделю', 'За месяц', 'За год', 'За объект'][index] : ['Per night', 'Per week', 'Per month', 'Per year', 'Total'][index]}</option>)}
  </select> : <Input id={`${id}-${key}`} inputMode={numeric ? 'decimal' : 'text'} value={values[key]} onChange={event => onChange({ ...values, [key]: event.target.value })} />}</div>;
  return <Card><CardHeader><CardTitle>{ru ? 'Цены и предложения' : 'Prices and offers'}</CardTitle></CardHeader><CardContent>
    <fieldset disabled={disabled} className="space-y-4 min-w-0">
      <div className="flex flex-wrap gap-6">
        {(['rent', 'sale'] as const).map(mode => <label key={mode} className="flex items-center gap-2"><Switch aria-label={mode === 'rent' ? 'Offer for rent' : 'Offer for sale'} checked={propertySupportsMode(values, mode === 'rent' ? 'rent' : 'buy')} onCheckedChange={enabled => onChange(changeCommercialOffer(values, mode, enabled))} />{mode === 'rent' ? (ru ? 'Аренда' : 'Rent') : (ru ? 'Продажа' : 'Sale')}</label>)}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {field('price', 'Offer amount', 'Цена предложения')}
        {field('price_period', 'Billing period', 'Период цены', false)}
        {field('currency', 'Rental / offer currency', 'Валюта аренды / предложения', false)}
        {field('price_per_night', 'Price per night', 'Цена за ночь')}
        {field('price_per_month', 'Price per month', 'Цена за месяц')}
        {field('price_per_year', 'Price per year', 'Цена за год')}
        {field('sale_price', 'Sale price', 'Цена продажи')}
        {field('sale_currency', 'Sale currency', 'Валюта продажи', false)}
      </div>
      <p className="text-sm text-muted-foreground">{ru ? 'Валюта: код из трёх букв. Изменение валюты не пересчитывает суммы.' : 'Use three-letter currency codes. Changing a currency does not convert the amounts.'}</p>
    </fieldset>
  </CardContent></Card>;
}
