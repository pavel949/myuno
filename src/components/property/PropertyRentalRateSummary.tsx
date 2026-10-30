import { useCurrency } from '@/contexts/CurrencyContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { propertyRentalRateOptions, type PropertyRentalRateSource } from '@/lib/real-estate/propertyDetailIntent';

/** Show independent stored tariffs together, never a converted monthly/nightly estimate. */
export function PropertyRentalRateSummary({ property, rentalTerms }: {
  property: PropertyRentalRateSource;
  rentalTerms?: { price_per_night?: number | null; currency?: string | null } | null;
}) {
  const { language } = useLanguage();
  const { formatPrice } = useCurrency();
  const options = propertyRentalRateOptions(property, rentalTerms);
  const ru = language === 'ru';
  const th = language === 'th';
  if (property.currency?.trim().toUpperCase() !== 'THB') return null;
  if (options.ambiguous) return <p role="status" className="text-sm text-muted-foreground">{ru ? 'Тарифы требуют подтверждения — автоматический расчёт недоступен.' : th ? 'กรุณายืนยันอัตราค่าเช่าก่อนคำนวณราคา' : 'Rental rates need confirmation — automatic quote unavailable.'}</p>;
  if (options.rates.length < 2) return null;
  const labels = {
    night: ru ? 'за ночь' : th ? 'ต่อคืน' : 'per night',
    week: ru ? 'в неделю' : th ? 'ต่อสัปดาห์' : 'per week',
    month: ru ? 'в месяц' : th ? 'ต่อเดือน' : 'per month',
    year: ru ? 'в год' : th ? 'ต่อปี' : 'per year',
    total: ru ? 'за весь срок' : th ? 'รวมทั้งหมด' : 'total',
  };
  return <div aria-label={ru ? 'Тарифы аренды' : th ? 'อัตราค่าเช่า' : 'Rental rates'} className="space-y-1 text-sm">
    {options.rates.map(rate => <p key={rate.period}><strong>{formatPrice(rate.amount)}</strong> <span>{labels[rate.period]}</span></p>)}
  </div>;
}
