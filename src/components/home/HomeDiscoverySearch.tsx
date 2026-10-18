import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, MapPin, Users } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePropertyQuickFilters } from '@/hooks/usePropertyQuickFilters';
import { APP_ROUTES } from '@/lib/config/routes';
import { pickLang, type LangValues } from '@/lib/i18n/pickLang';
import { bangkokTodayISO, parseCivilDate } from '@/lib/hotelDates';
import { addDays, format } from 'date-fns';

export function HomeDiscoverySearch() {
  const { language } = useLanguage();
  const t = (v: LangValues) => pickLang(language, v);
  const { districts, isLoading } = usePropertyQuickFilters();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'rent' | 'buy'>('rent');
  const [district, setDistrict] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState('2');
  const today = bangkokTodayISO();
  const nextDay = checkIn ? format(addDays(parseCivilDate(checkIn), 1), 'yyyy-MM-dd') : today;

  function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const params = new URLSearchParams({ mode });
    if (district) params.set('district', district);
    // The existing catalogue consumes Date instants. Use shared civil-date parsing,
    // then serialize local midnight, preserving dates in its existing URL contract.
    if (mode === 'rent') {
      params.set('tenancy', 'short');
      if (checkIn) params.set('checkIn', parseCivilDate(checkIn).toISOString());
      if (checkOut) params.set('checkOut', parseCivilDate(checkOut).toISOString());
      params.set('guests', guests);
    }
    navigate(`${APP_ROUTES.PROPERTY_SEARCH}?${params.toString()}`);
  }

  return (
    <form className="home-search" onSubmit={search} aria-label={t({ ru: 'Поиск жилья', en: 'Find a home', th: 'ค้นหาที่พัก' })}>
      <div className="home-search-modes" role="group" aria-label={t({ ru: 'Аренда или покупка', en: 'Rent or buy', th: 'เช่าหรือซื้อ' })}>
        {(['rent', 'buy'] as const).map(value => (
          <button key={value} type="button" aria-pressed={mode === value} onClick={() => setMode(value)}>
            {value === 'rent' ? t({ ru: 'Аренда', en: 'Rent', th: 'เช่า' }) : t({ ru: 'Покупка', en: 'Buy', th: 'ซื้อ' })}
          </button>
        ))}
      </div>
      <label className="home-search-location">
        <MapPin size={18} aria-hidden="true" />
        <span><span className="home-field-label">{t({ ru: 'Район', en: 'Area', th: 'ย่าน' })}</span>
          <select value={district} onChange={e => setDistrict(e.target.value)} disabled={isLoading} aria-label={t({ ru: 'Выберите район', en: 'Choose an area', th: 'เลือกย่าน' })}>
            <option value="">{isLoading ? t({ ru: 'Загрузка районов…', en: 'Loading areas…', th: 'กำลังโหลดย่าน…' }) : t({ ru: 'Весь Пхукет', en: 'All Phuket', th: 'ทั่วภูเก็ต' })}</option>
            {districts.map(d => <option key={d.id} value={d.valueKey}>{language === 'ru' ? d.labelRu : d.labelEn}</option>)}
          </select>
        </span>
      </label>
      {mode === 'rent' && <>
        <div className="home-search-dates">
          <label><span className="home-field-label">{t({ ru: 'Заезд', en: 'Check-in', th: 'เช็กอิน' })}</span>
            <input type="date" aria-label={t({ ru: 'Заезд', en: 'Check-in', th: 'เช็กอิน' })} min={today} value={checkIn} required={!!checkOut} onInput={e => { setCheckIn(e.currentTarget.value); if (checkOut && e.currentTarget.value >= checkOut) setCheckOut(''); }} />
          </label>
          <label><span className="home-field-label">{t({ ru: 'Выезд', en: 'Check-out', th: 'เช็กเอาต์' })}</span>
            <input type="date" aria-label={t({ ru: 'Выезд', en: 'Check-out', th: 'เช็กเอาต์' })} min={nextDay} value={checkOut} required={!!checkIn} onInput={e => setCheckOut(e.currentTarget.value)} />
          </label>
        </div>
        <label className="home-search-guests"><Users size={18} aria-hidden="true" /><span>
          <span className="home-field-label">{t({ ru: 'Гости', en: 'Guests', th: 'ผู้เข้าพัก' })}</span>
          <input type="number" min="1" max="50" required value={guests} onChange={e => setGuests(e.target.value)} aria-label={t({ ru: 'Количество гостей', en: 'Number of guests', th: 'จำนวนผู้เข้าพัก' })} />
        </span></label>
      </>}
      <button type="submit" className="home-search-submit">{t({ ru: 'Найти жильё', en: 'Find a home', th: 'ค้นหาที่พัก' })}<ArrowRight size={18} aria-hidden="true" /></button>
    </form>
  );
}
