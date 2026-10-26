import { useId, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Users } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePropertyFilterOptions } from '@/hooks/usePropertyFilterOptions';
import { usePropertyQuickFilters } from '@/hooks/usePropertyQuickFilters';
import { APP_ROUTES } from '@/lib/config/routes';
import { pickLang, type LangValues } from '@/lib/i18n/pickLang';
import { bangkokTodayISO, civilDateKey } from '@/lib/hotelDates';
import { readPropertySearchQuery } from '@/lib/propertySearchQuery';
import { HomeSearchDateRange } from './HomeSearchDateRange';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function HomeDiscoverySearch({ rentalOnly = false, hideModeSwitch = false, showGuestsInline = false, initialParams, onSearch, progressive = false, catalogue = false }: { rentalOnly?: boolean; hideModeSwitch?: boolean; showGuestsInline?: boolean; initialParams?: URLSearchParams; onSearch?: (params: URLSearchParams) => void; progressive?: boolean; catalogue?: boolean }) {
  const initial = readPropertySearchQuery(initialParams ?? new URLSearchParams());
  const { language } = useLanguage();
  const guestsId = useId();
  const queryId = useId();
  const [query, setQuery] = useState(initialParams?.get('q') || '');
  const t = (v: LangValues) => pickLang(language, v);
  const { districts, isLoading } = usePropertyQuickFilters();
  const { propertyTypes, isLoading: typesLoading } = usePropertyFilterOptions();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'all' | 'rent' | 'buy'>(rentalOnly ? 'rent' : catalogue && !initial.hasIntent ? 'all' : initial.mode);
  const [district, setDistrict] = useState(initial.search.locations.join(','));
  const [propertyType, setPropertyType] = useState(initial.search.propertyTypes.join(','));
  const [checkIn, setCheckIn] = useState(initial.search.checkIn ? civilDateKey(initial.search.checkIn) : '');
  const [checkOut, setCheckOut] = useState(initial.search.checkOut ? civilDateKey(initial.search.checkOut) : '');
  const [guests, setGuests] = useState(initial.hasGuestFilter ? String(initial.search.guests) : '');
  const [bedrooms, setBedrooms] = useState(initial.search.bedrooms.join(','));
  const [tenancy, setTenancy] = useState<string>(initial.tenancy);
  const today = bangkokTodayISO();
  const [dateError, setDateError] = useState(false);
  const [showRefinements, setShowRefinements] = useState(!progressive);

  function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (mode === 'rent' && ((!!checkIn !== !!checkOut) || (checkIn && (checkIn < today || checkOut <= checkIn)))) {
      setDateError(true);
      return;
    }
    setDateError(false);
    const params = new URLSearchParams(initialParams);
    for (const key of ['district', 'types', 'f.district', 'f.propertyType', 'f.listingType', 'bedrooms', 'f.bedrooms']) params.delete(key);
    params.set('mode', mode);
    if (mode === 'all') for (const key of ['tenancy', 'intent', 'quick', 'checkIn', 'checkOut', 'guests', 'f.guestsAtLeast', 'instant', 'f.instantBooking', 'f.priceLevel']) params.delete(key);
    params.delete('q');
    if (query.trim()) params.set('q', query.trim());
    if (district) params.set('district', district);
    if (propertyType) params.set('types', propertyType);
    if (bedrooms) params.set('bedrooms', bedrooms);
    // Stay dates are civil dates, not instants. Shared/bookmarked URLs must keep
    // the selected calendar days when opened in a different time zone.
    if (mode === 'rent') {
      for (const key of ['checkIn', 'checkOut', 'guests', 'f.guestsAtLeast']) params.delete(key);
      params.set('tenancy', tenancy);
      if (tenancy !== 'short') params.delete('f.priceLevel');
      if (checkIn) params.set('checkIn', checkIn);
      if (checkOut) params.set('checkOut', checkOut);
      if (guests) params.set('guests', guests);
    }
    if (onSearch) onSearch(params);
    else navigate(`${APP_ROUTES.PROPERTY_SEARCH}?${params.toString()}`);
  }

  return (
    <form className={`home-search${showGuestsInline ? ' home-search--homepage' : ''}${catalogue ? ' home-search--catalogue' : ''}`} onSubmit={search} aria-label={t({ ru: 'Поиск жилья', en: 'Find a home', th: 'ค้นหาที่พัก' })}>
      {catalogue && <label className="home-search-query col-span-full" htmlFor={queryId}><span className="home-field-label">{t({ ru: 'Название объекта', en: 'Property name', th: 'ชื่อที่พัก' })}</span><input id={queryId} type="search" value={query} maxLength={120} onChange={event => setQuery(event.target.value)} placeholder={t({ ru: 'Фильтр по названию — необязательно', en: 'Filter by name — optional', th: 'กรองตามชื่อ — ไม่บังคับ' })} /></label>}
      {!rentalOnly && !hideModeSwitch && <div className="home-search-modes" role="group" aria-label={t({ ru: 'Аренда или покупка', en: 'Rent or buy', th: 'เช่าหรือซื้อ' })}>
        {(catalogue ? ['all', 'rent', 'buy'] as const : ['rent', 'buy'] as const).map(value => (
          <button key={value} type="button" aria-pressed={mode === value} onClick={() => setMode(value)}>
            {value === 'all' ? t({ ru: 'Все объекты', en: 'All homes', th: 'ที่พักทั้งหมด' }) : value === 'rent' ? t({ ru: 'Аренда', en: 'Rent', th: 'เช่า' }) : t({ ru: 'Покупка', en: 'Buy', th: 'ซื้อ' })}
          </button>
        ))}
      </div>}
      {mode === 'rent' && (
        <div className="home-search-duration col-span-full flex flex-nowrap gap-1" role="group" aria-label={t({ ru: 'Срок аренды', en: 'Rental duration', th: 'ระยะเวลาเช่า' })}>
          {(['short', 'medium', 'long'] as const).map(value => <button className="min-h-11 border px-3 text-sm aria-pressed:bg-primary aria-pressed:text-primary-foreground" key={value} type="button" aria-pressed={tenancy === value} onClick={() => setTenancy(value)}>{value === 'short' ? t({ ru: 'Посуточно', en: 'Nightly', th: 'รายวัน' }) : value === 'medium' ? t({ ru: 'Помесячно', en: 'Monthly', th: 'รายเดือน' }) : t({ ru: 'На год', en: 'Yearly', th: 'รายปี' })}</button>)}
        </div>
      )}
      {mode === 'rent' && <HomeSearchDateRange checkIn={checkIn} checkOut={checkOut} onChange={(start, end) => { setCheckIn(start); setCheckOut(end); setDateError(false); }} />}
      {showGuestsInline && mode === 'rent' && (
        <label className="home-search-guests home-search-guests-inline" htmlFor={guestsId}>
          <Users size={18} aria-hidden="true" /><span>
            <span className="home-field-label">{t({ ru: 'Гости', en: 'Guests', th: 'ผู้เข้าพัก' })}</span>
            <input id={guestsId} type="number" min="1" max="50" step="1" placeholder={t({ ru: 'Любое количество', en: 'Any number', th: 'ไม่จำกัด' })} value={guests} onChange={e => setGuests(e.target.value)} aria-label={t({ ru: 'Количество гостей', en: 'Number of guests', th: 'จำนวนผู้เข้าพัก' })} />
          </span>
        </label>
      )}
      {showRefinements && <><div className="home-search-type">
        <span className="home-field-label">{t({ ru: 'Тип жилья', en: 'Home type', th: 'ประเภทที่พัก' })}</span>
        <Select value={propertyType || '__all'} onValueChange={value => setPropertyType(value === '__all' ? '' : value)} disabled={typesLoading}>
          <SelectTrigger className="home-search-select" aria-label={t({ ru: 'Тип жилья', en: 'Home type', th: 'ประเภทที่พัก' })}><SelectValue /></SelectTrigger>
          <SelectContent collisionPadding={12}>
            <SelectItem className="min-h-11" value="__all">{typesLoading ? t({ ru: 'Загрузка…', en: 'Loading…', th: 'กำลังโหลด…' }) : t({ ru: 'Любой тип', en: 'Any home', th: 'ทุกประเภท' })}</SelectItem>
            {propertyType.includes(',') && <SelectItem value={propertyType}>{t({ ru: 'Несколько типов', en: 'Multiple home types', th: 'หลายประเภท' })}</SelectItem>}
            {propertyType && !propertyType.includes(',') && !propertyTypes.some(type => type.id === propertyType) && <SelectItem value={propertyType}>{propertyType}</SelectItem>}
            {propertyTypes.map(type => <SelectItem className="min-h-11" key={type.id} value={type.id}>{language === 'ru' ? type.labelRu : type.labelEn}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="home-search-location">
        <div className="min-w-0 flex-1"><span className="home-field-label">{t({ ru: 'Район', en: 'Area', th: 'ย่าน' })}</span>
          <Select value={district || '__all'} onValueChange={value => setDistrict(value === '__all' ? '' : value)} disabled={isLoading}>
            <SelectTrigger className="home-search-select" aria-label={t({ ru: 'Выберите район', en: 'Choose an area', th: 'เลือกย่าน' })}><SelectValue /></SelectTrigger>
            <SelectContent collisionPadding={12}>
              <SelectItem className="min-h-11" value="__all">{isLoading ? t({ ru: 'Загрузка районов…', en: 'Loading areas…', th: 'กำลังโหลดย่าน…' }) : t({ ru: 'Весь Пхукет', en: 'All Phuket', th: 'ทั่วภูเก็ต' })}</SelectItem>
              {district.includes(',') && <SelectItem value={district}>{t({ ru: 'Несколько районов', en: 'Multiple areas', th: 'หลายย่าน' })}</SelectItem>}
              {district && !district.includes(',') && !districts.some(item => item.valueKey === district) && <SelectItem value={district}>{district}</SelectItem>}
              {districts.map(d => <SelectItem className="min-h-11" key={d.id} value={d.valueKey}>{language === 'ru' ? d.labelRu : d.labelEn}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="home-search-bedrooms">
        <span className="home-field-label">{t({ ru: 'Спальни', en: 'Bedrooms', th: 'ห้องนอน' })}</span>
        <Select value={bedrooms || '__all'} onValueChange={value => setBedrooms(value === '__all' ? '' : value)}>
          <SelectTrigger className="home-search-select" aria-label={t({ ru: 'Спальни', en: 'Bedrooms', th: 'ห้องนอน' })}><SelectValue /></SelectTrigger>
          <SelectContent collisionPadding={12}>
            <SelectItem value="__all">{t({ ru: 'Любое количество', en: 'Any', th: 'ไม่จำกัด' })}</SelectItem>
            {bedrooms && !['1+', '2+', '3+', '4+'].includes(bedrooms) && <SelectItem value={bedrooms}>{bedrooms === 'studio' ? t({ ru: 'Студия', en: 'Studio', th: 'สตูดิโอ' }) : bedrooms}</SelectItem>}
            {['1+', '2+', '3+', '4+'].map(value => <SelectItem className="min-h-11" key={value} value={value}>{value}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      </>}
      <button type="submit" className="home-search-submit">{t({ ru: 'Найти жильё', en: 'Find a home', th: 'ค้นหาที่พัก' })}<ArrowRight size={18} aria-hidden="true" /></button>
      {progressive && <button type="button" className="home-search-refine" aria-expanded={showRefinements} onClick={() => setShowRefinements(value => !value)}>{t({ ru: showRefinements ? 'Скрыть уточнения' : 'Уточнить поиск', en: showRefinements ? 'Hide refinements' : 'Refine search', th: showRefinements ? 'ซ่อนตัวกรอง' : 'ปรับการค้นหา' })}</button>}

      {showRefinements && (!catalogue || (mode === 'rent' && !showGuestsInline)) && <details className="home-search-secondary">
        <summary>{catalogue ? t({ ru: 'Гости', en: 'Guests', th: 'ผู้เข้าพัก' }) : t({ ru: mode === 'rent' && !showGuestsInline ? 'Название и гости' : 'Название объекта', en: mode === 'rent' && !showGuestsInline ? 'Name and guests' : 'Property name', th: mode === 'rent' && !showGuestsInline ? 'ชื่อที่พักและผู้เข้าพัก' : 'ชื่อที่พัก' })}</summary>
        <div className="home-search-secondary-fields">
          {!catalogue && <label className="home-search-query" htmlFor={queryId}>
            <span className="home-field-label">{t({ ru: 'Название объекта', en: 'Property name', th: 'ชื่อที่พัก' })}</span>
            <input id={queryId} aria-label={t({ ru: 'Название объекта', en: 'Property name', th: 'ชื่อที่พัก' })} type="search" value={query} maxLength={120} onChange={event => setQuery(event.target.value)} placeholder={t({ ru: 'Введите название виллы или квартиры', en: 'Type a villa or apartment name', th: 'พิมพ์ชื่อวิลล่าหรืออพาร์ตเมนต์' })} />
          </label>}
          {mode === 'rent' && !showGuestsInline && (
            <label className="home-search-guests" htmlFor={guestsId}><Users size={18} aria-hidden="true" /><span>
              <span className="home-field-label">{t({ ru: 'Гости', en: 'Guests', th: 'ผู้เข้าพัก' })}</span>
              <input id={guestsId} aria-describedby={`${guestsId}-optional`} type="number" min="1" max="50" step="1" placeholder={t({ ru: 'Любое', en: 'Any', th: 'ไม่ระบุ' })} value={guests} onChange={e => setGuests(e.target.value)} aria-label={t({ ru: 'Количество гостей', en: 'Number of guests', th: 'จำนวนผู้เข้าพัก' })} />
              <span id={`${guestsId}-optional`} className="sr-only">{t({ ru: 'Необязательно. Оставьте пустым, чтобы не ограничивать число гостей.', en: 'Optional. Leave blank for no guest-count restriction.', th: 'ไม่บังคับ เว้นว่างเพื่อไม่จำกัดจำนวนผู้เข้าพัก' })}</span>
            </span></label>
          )}
        </div>
      </details>}
      {mode === 'rent' && dateError && <p role="alert" className="col-span-full text-sm text-destructive">{t({ ru: 'Выберите даты заезда и выезда. Выезд должен быть позже заезда.', en: 'Choose check-in and check-out dates. Check-out must be after check-in.', th: 'เลือกวันเช็กอินและเช็กเอาต์ โดยวันเช็กเอาต์ต้องอยู่หลังวันเช็กอิน' })}</p>}
    </form>
  );
}
