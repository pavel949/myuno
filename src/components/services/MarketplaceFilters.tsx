import '@/styles/marketplace-filters.css';
import { useLanguage } from '@/contexts/LanguageContext';
import { pickLang } from '@/lib/i18n/pickLang';
import { Button } from '@/components/ui/button';
import type { MarketplaceFilters as Filters, MarketplaceFilterKey } from '@/lib/services/marketplaceDiscovery';
import { phuketToday } from '@/lib/services/slots';

export function MarketplaceFilters({ filters, params, districts, currencies, onChange, onClear }: {
  filters: Filters; params: URLSearchParams; districts: string[]; currencies: string[];
  onChange: (key: MarketplaceFilterKey, value: string) => void; onClear: () => void;
}) {
  const { language } = useLanguage();
  const t = (ru: string, en: string, th: string) => pickLang(language, { ru, en, th });
  return <fieldset className="marketplace-filters">
    <legend>{t('Подобрать предложение', 'Find a provider offer', 'ค้นหาข้อเสนอจากผู้ให้บริการ')}</legend>
    <div className="marketplace-filter-grid">
      <label><span>{t('Район', 'Area', 'ย่าน')}</span><select value={filters.district} onChange={event => onChange('district', event.target.value)}>
        <option value="">{t('Все районы', 'All areas', 'ทุกย่าน')}</option>
        {[...new Set([...districts, ...(filters.district ? [filters.district] : [])])].map(area => <option key={area} value={area}>{area}</option>)}
      </select></label>
      <label><span>{t('Дата (Пхукет)', 'Date (Phuket)', 'วันที่ (ภูเก็ต)')}</span><input type="date" aria-label={t('Дата (Пхукет)', 'Date (Phuket)', 'วันที่ (ภูเก็ต)')} min={phuketToday()} value={filters.date} onChange={event => onChange('date', event.target.value)} /></label>
      <label><span>{t('Цена от', 'Min price', 'ราคาต่ำสุด')}</span><input type="number" aria-label={t('Цена от', 'Min price', 'ราคาต่ำสุด')} min="0" step="0.01" inputMode="decimal" value={params.get('minPrice') ?? ''} onChange={event => onChange('minPrice', event.target.value)} /></label>
      <label><span>{t('Цена до', 'Max price', 'ราคาสูงสุด')}</span><input type="number" aria-label={t('Цена до', 'Max price', 'ราคาสูงสุด')} min="0" step="0.01" inputMode="decimal" value={params.get('maxPrice') ?? ''} onChange={event => onChange('maxPrice', event.target.value)} /></label>
      <label><span>{t('Валюта цены', 'Price currency', 'สกุลเงินราคา')}</span><select value={filters.currency} onChange={event => onChange('currency', event.target.value)}>
        {[...new Set([filters.currency, ...currencies])].map(code => <option key={code} value={code}>{code}</option>)}
      </select></label>
    </div>
    <div className="marketplace-filter-actions">
      <label className="marketplace-today"><input type="checkbox" aria-label={t('Есть свободное время сегодня', 'Free request slots today', 'มีเวลาว่างวันนี้')} checked={filters.todayOnly} onChange={event => onChange('today', event.target.checked ? '1' : '')} /><span>{t('Есть свободное время сегодня', 'Free request slots today', 'มีเวลาว่างวันนี้')}</span></label>
      {filters.active && <Button variant="ghost" onClick={onClear}>{t('Сбросить фильтры предложений', 'Clear offer filters', 'ล้างตัวกรองข้อเสนอ')}</Button>}
    </div>
    <p className="text-sm text-muted-foreground">{t('Цены сравниваются в выбранной валюте без конвертации. Доступность проверяется по графику; время подтверждает исполнитель.', 'Prices are compared in the selected currency without conversion. Slots are checked against the schedule; the provider confirms the time.', 'เปรียบเทียบราคาในสกุลเงินที่เลือกโดยไม่แปลงค่า ผู้ให้บริการจะยืนยันเวลา')}</p>
    {filters.invalid && <p role="alert">{t('Проверьте дату и диапазон цены: минимум не должен превышать максимум.', 'Check the date and price range: minimum cannot exceed maximum.', 'ตรวจสอบวันที่และช่วงราคา ราคาต่ำสุดต้องไม่เกินราคาสูงสุด')}</p>}
  </fieldset>;
}
