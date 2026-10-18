import { useId, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, MapPin, Users } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePropertyFilterOptions } from '@/hooks/usePropertyFilterOptions';
import { usePropertyQuickFilters } from '@/hooks/usePropertyQuickFilters';
import { APP_ROUTES } from '@/lib/config/routes';
import { pickLang, type LangValues } from '@/lib/i18n/pickLang';
import { bangkokTodayISO, parseCivilDate } from '@/lib/hotelDates';
import { HomeSearchDateRange } from './HomeSearchDateRange';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function HomeDiscoverySearch({ rentalOnly = false }: { rentalOnly?: boolean }) {
  const { language } = useLanguage();
  const guestsId = useId();
  const t = (v: LangValues) => pickLang(language, v);
  const { districts, isLoading } = usePropertyQuickFilters();
  const { propertyTypes, isLoading: typesLoading } = usePropertyFilterOptions();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'rent' | 'buy'>('rent');
  const [district, setDistrict] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState('2');
  const today = bangkokTodayISO();
  const [dateError, setDateError] = useState(false);

  function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (mode === 'rent' && ((!!checkIn !== !!checkOut) || (checkIn && (checkIn < today || checkOut <= checkIn)))) {
      setDateError(true);
      return;
    }
    setDateError(false);
    const params = new URLSearchParams({ mode });
    if (district) params.set('district', district);
    if (propertyType) params.set('types', propertyType);
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
      {!rentalOnly && <div className="home-search-modes" role="group" aria-label={t({ ru: 'Аренда или покупка', en: 'Rent or buy', th: 'เช่าหรือซื้อ' })}>
        {(['rent', 'buy'] as const).map(value => (
          <button key={value} type="button" aria-pressed={mode === value} onClick={() => setMode(value)}>
            {value === 'rent' ? t({ ru: 'Аренда', en: 'Rent', th: 'เช่า' }) : t({ ru: 'Покупка', en: 'Buy', th: 'ซื้อ' })}
          </button>
        ))}
      </div>}
      <div className="home-search-type">
        <span className="home-field-label">{t({ ru: 'Тип жилья', en: 'Home type', th: 'ประเภทที่พัก' })}</span>
        <Select value={propertyType || '__all'} onValueChange={value => setPropertyType(value === '__all' ? '' : value)} disabled={typesLoading}>
          <SelectTrigger className="home-search-select" aria-label={t({ ru: 'Тип жилья', en: 'Home type', th: 'ประเภทที่พัก' })}><SelectValue /></SelectTrigger>
          <SelectContent collisionPadding={12}>
            <SelectItem className="min-h-11" value="__all">{typesLoading ? t({ ru: 'Загрузка…', en: 'Loading…', th: 'กำลังโหลด…' }) : t({ ru: 'Любой тип', en: 'Any home', th: 'ทุกประเภท' })}</SelectItem>
            {propertyTypes.map(type => <SelectItem className="min-h-11" key={type.id} value={type.id}>{language === 'ru' ? type.labelRu : type.labelEn}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="home-search-location">
        <MapPin size={18} aria-hidden="true" />
        <div className="min-w-0 flex-1"><span className="home-field-label">{t({ ru: 'Район', en: 'Area', th: 'ย่าน' })}</span>
          <Select value={district || '__all'} onValueChange={value => setDistrict(value === '__all' ? '' : value)} disabled={isLoading}>
            <SelectTrigger className="home-search-select" aria-label={t({ ru: 'Выберите район', en: 'Choose an area', th: 'เลือกย่าน' })}><SelectValue /></SelectTrigger>
            <SelectContent collisionPadding={12}>
              <SelectItem className="min-h-11" value="__all">{isLoading ? t({ ru: 'Загрузка районов…', en: 'Loading areas…', th: 'กำลังโหลดย่าน…' }) : t({ ru: 'Весь Пхукет', en: 'All Phuket', th: 'ทั่วภูเก็ต' })}</SelectItem>
              {districts.map(d => <SelectItem className="min-h-11" key={d.id} value={d.valueKey}>{language === 'ru' ? d.labelRu : d.labelEn}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      {mode === 'rent' && <>
        <HomeSearchDateRange checkIn={checkIn} checkOut={checkOut} onChange={(start, end) => { setCheckIn(start); setCheckOut(end); setDateError(false); }} />
        <label className="home-search-guests" htmlFor={guestsId}><Users size={18} aria-hidden="true" /><span>
          <span className="home-field-label">{t({ ru: 'Гости', en: 'Guests', th: 'ผู้เข้าพัก' })}</span>
          <input id={guestsId} type="number" min="1" max="50" required value={guests} onChange={e => setGuests(e.target.value)} aria-label={t({ ru: 'Количество гостей', en: 'Number of guests', th: 'จำนวนผู้เข้าพัก' })} />
        </span></label>
      </>}
      {mode === 'rent' && dateError && <p role="alert" className="col-span-full text-sm text-destructive">{t({ ru: 'Выберите даты заезда и выезда. Выезд должен быть позже заезда.', en: 'Choose check-in and check-out dates. Check-out must be after check-in.', th: 'เลือกวันเช็กอินและเช็กเอาต์ โดยวันเช็กเอาต์ต้องอยู่หลังวันเช็กอิน' })}</p>}
      <button type="submit" className="home-search-submit">{t({ ru: 'Найти жильё', en: 'Find a home', th: 'ค้นหาที่พัก' })}<ArrowRight size={18} aria-hidden="true" /></button>
    </form>
  );
}
