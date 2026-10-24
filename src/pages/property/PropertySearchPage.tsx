import { SEOHead } from '@/components/seo/SEOHead';
import '@/styles/public-commerce.css';
/**
 * PropertySearchPage — Full catalog grid with filters
 * One shared app-style editor; all criteria are hydrated from the catalogue URL.
 */
import { pickLang } from '@/lib/i18n/pickLang';
import React, { useState, useMemo, useEffect, useRef, lazy, Suspense } from 'react';
import { useSearchParams, useLocation, useNavigate } from 'react-router-dom';
import { Home, SlidersHorizontal, Loader2, Check, Map as MapIcon, List } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { UniversalFilter, FilterValues, type FilterConfig } from '@/components/filters/UniversalFilter';
import { usePropertyFilterOptions } from '@/hooks/usePropertyFilterOptions';
import { usePropertiesInfinite, Property } from '@/hooks/useProperties';
import { Skeleton } from '@/components/ui/skeleton';
import { BackButton } from '@/components/uno/BackButton';
import { HomeDiscoverySearch } from '@/components/home/HomeDiscoverySearch';
import { readPropertySearchQuery, updatePropertySearchSort } from '@/lib/propertySearchQuery';
import { propertySearchFeatureLabels } from '@/lib/propertySearchPresentation';
import { PROPERTY_FEATURE_MAP } from '@/lib/config/propertyFeatures';
import { serializeFilters } from '@/lib/propertyBrowseFilters';
import '@/styles/cinematic-home.css';
import { PropertyListingCard } from '@/components/property/PropertyListingCard';
import { PROPERTY_DISCOVERY_FEATURE_IDS, matchesCategory } from '@/components/property/PropertyCategoryIcons';
import { usePropertyQuickFilters } from '@/hooks/usePropertyQuickFilters';
import { filterValuesToPropertyFilters, mergeSearchBarIntoFilterValues, propertyPriceLevelDescriptions } from '@/lib/propertyCatalogServerFilters';
import { comparePropertiesForSort } from '@/lib/propertySortPrice';
import { useMapListSync } from '@/hooks/useMapListSync';
import type { PropertyFilters } from '@/hooks/useProperties';
import { CrossSellSection } from '@/components/crosssell';
import { PropertySortSelect, PropertySortKey } from '@/components/property/PropertySortSelect';
import { PropertyCompareTrigger } from '@/components/property/PropertyCompare';
import { VerticalCTA } from '@/components/leads/VerticalCTA';
import { OffplanCTASection } from '@/components/property/OffplanCTASection';
import { differenceInDays, format } from 'date-fns';
import { useSearchPropertyAvailability } from '@/hooks/useSearchPropertyAvailability';
import '@/styles/property-search.css';
import { PUBLIC_CONTENT_LAYOUT, PUBLIC_CATALOG_GRID } from '@/design-system/ecosystemLayout';

const FILTER_TITLES_TH: Record<string, string> = {'priceLevel': 'ระดับราคา', 'bedrooms': 'ห้องนอน', 'areaAtLeast': 'พื้นที่', 'instantBooking': 'การจอง', 'viewType': 'วิว', 'furnishingLevel': 'เฟอร์นิเจอร์', 'poolType': 'สระว่ายน้ำ', 'parkingType': 'ที่จอดรถ', 'ownershipForm': 'กรรมสิทธิ์', 'amenities': 'สิ่งอำนวยความสะดวก', 'highlights': 'จุดเด่น'};
const FEATURE_LABELS_TH: Record<string, string> = {'beachfront': 'ติดชายหาด', 'walk_to_beach': 'เดินไปชายหาดได้', 'sea_view': 'วิวทะเล', 'private_pool': 'สระว่ายน้ำส่วนตัว', 'pool': 'สระว่ายน้ำ', 'washer': 'เครื่องซักผ้า', 'pet_friendly': 'อนุญาตให้นำสัตว์เลี้ยงเข้าพัก', 'kid_friendly': 'เหมาะสำหรับเด็ก', 'parking': 'ที่จอดรถ', 'wifi': 'WiFi', 'luxury': 'หรูหรา', 'air_conditioning': 'เครื่องปรับอากาศ', 'gym': 'ห้องออกกำลังกาย', 'jacuzzi': 'อ่างจากุซซี่'};
const QUICK_FEATURE_IDS = ['walk_to_beach', 'private_pool', 'sea_view'];

const PropertyMapView = lazy(() => import('@/components/property/PropertyMapView').then(module => ({ default: module.PropertyMapView })));

export default function PropertySearchPage() {
  const { language } = useLanguage();
  const [searchParamsUrl, setSearchParamsUrl] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const isRu = language === 'ru';
  const text = (ru: string, en: string, th: string) => pickLang(language, { ru, en, th });
  const [focusResults, setFocusResults] = useState(false);
  const resultsHeadingRef = useRef<HTMLHeadingElement>(null);
  const { districts } = usePropertyQuickFilters();
  useEffect(() => {
    if (!focusResults) return;
    resultsHeadingRef.current?.focus({ preventScroll: true });
    resultsHeadingRef.current?.scrollIntoView({ block: 'start', behavior: 'auto' });
    setFocusResults(false);
  }, [focusResults]);

  const queryKey = searchParamsUrl.toString();
  // Sort changes result presentation, not the unapplied search-editor draft.
  const searchEditorKey = useMemo(() => {
    const params = new URLSearchParams(queryKey);
    params.delete('sort');
    return params.toString();
  }, [queryKey]);
  const state = useMemo(() => readPropertySearchQuery(new URLSearchParams(queryKey)), [queryKey]);
  const { mode: propertyMode, search: searchParams, filterValues, categories: categoryFilters } = state;
  const priceBandUnavailable = propertyMode === 'rent' && state.tenancy !== 'short';
  useEffect(() => {
    if (!priceBandUnavailable || !searchParamsUrl.has('f.priceLevel')) return;
    const params = new URLSearchParams(searchParamsUrl);
    params.delete('f.priceLevel');
    navigate({ search: params.toString(), hash: location.hash }, { replace: true });
  }, [priceBandUnavailable, searchParamsUrl, navigate, location.hash]);
  const [hoveredProperty, setHoveredProperty] = useState<string | null>(null);
  const { selectedId: focusedId, select: selectFocused } = useMapListSync();
  const [showStickyCTA, setShowStickyCTA] = useState(false);
  const sortKey = state.sort;
  const setSortKey = (value: PropertySortKey) => navigate({ search: updatePropertySearchSort(searchParamsUrl, value).toString(), hash: location.hash }, { state: location.state });
  const showMap = searchParamsUrl.get('view') === 'map';
  const selectedCompanyId = searchParamsUrl.get('company');
  const searchText = searchParamsUrl.get('q')?.trim() || '';
  const setShowMap = (show: boolean) => {
    const params = new URLSearchParams(searchParamsUrl);
    if (show) params.set('view', 'map'); else params.delete('view');
    setSearchParamsUrl(params);
  };
  const updateFilters = (values: FilterValues, categories = categoryFilters) => {
    const params = new URLSearchParams(searchParamsUrl);
    // Preserve legacy core values until explicitly edited in the primary form.
    const editableKeys = new Set(Object.keys(filterValues).map(key => `f.${key}`));
    [...params.keys()].filter(key => key === 'cats' || editableKeys.has(key)).forEach(key => params.delete(key));
    params.delete('bedrooms');
    params.delete('instant');
    params.delete('f.bedrooms');
    params.delete('f.instantBooking');
    params.delete('amenities');
    Object.entries(serializeFilters(values, categories)).forEach(([key, value]) => params.set(key, value));
    setSearchParamsUrl(params);
  };
  // Features retain their existing `cats` URL/matching contract. The sheet is
  // another editor for that same state, never a second amenities filter.
  const setAdvancedFilters = ({ guestFeatures, ...values }: FilterValues) =>
    updateFilters(
      {
        ...values,
        ...(filterValues.bedrooms ? { bedrooms: filterValues.bedrooms } : {}),
        ...(propertyMode === 'buy' && filterValues.instantBooking ? { instantBooking: filterValues.instantBooking } : {}),
      },
      Array.isArray(guestFeatures) ? guestFeatures : [],
    );
  const setCategoryFilters = (categories: string[]) => updateFilters(filterValues, categories);

  // Calculate nights from selected dates
  const nights = useMemo(() => {
    if (searchParams.checkIn && searchParams.checkOut) {
      return differenceInDays(searchParams.checkOut, searchParams.checkIn);
    }
    return 0;
  }, [searchParams.checkIn, searchParams.checkOut]);

  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setShowStickyCTA(window.scrollY > 800);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const { filterConfig, propertyTypes } = usePropertyFilterOptions();
  // Core criteria have one editor (the search bar). Avoid a second conflicting
  // property type/district/bedroom/party selection inside the advanced filter sheet.
  const advancedFilterConfig = useMemo<FilterConfig>(() => ({
    sections: [
      ...filterConfig.sections.filter(section => !['propertyType', 'district', 'bedrooms', 'listingType', 'guestsAtLeast', ...(priceBandUnavailable ? ['priceLevel'] : []), ...(propertyMode === 'buy' ? ['instantBooking'] : [])].includes(section.id)).map(section => ({ ...section, titleTh: FILTER_TITLES_TH[section.id], ...(section.id === 'priceLevel' ? { priceLevelDescriptions: propertyPriceLevelDescriptions(propertyMode === 'buy' ? 'sale' : 'rent', language) } : {}) })),
      {
        id: 'guestFeatures', titleEn: 'Popular features', titleRu: 'Популярные удобства', titleTh: 'สิ่งอำนวยความสะดวกยอดนิยม', type: 'multi',
        options: PROPERTY_DISCOVERY_FEATURE_IDS.flatMap(id => {
          const feature = PROPERTY_FEATURE_MAP.get(id);
          return feature ? [{ id, ...propertySearchFeatureLabels(feature), labelTh: FEATURE_LABELS_TH[id] }] : [];
        }),
      },
    ],
  }), [filterConfig, propertyMode, priceBandUnavailable, language]);
  const advancedValues: FilterValues = { ...filterValues, guestFeatures: categoryFilters };
  delete advancedValues.bedrooms;
  if (propertyMode === 'buy') delete advancedValues.instantBooking;

  const listingCatalogType = propertyMode === 'buy' ? 'sale' : 'rent';
  const rentTenancy = state.tenancy;

  const mergedFilterValues = useMemo(
    () => mergeSearchBarIntoFilterValues(filterValues, searchParams),
    [filterValues, searchParams]
  );

  const serverFilters = useMemo((): PropertyFilters => {
    const eligibleValues = { ...mergedFilterValues };
    if (listingCatalogType === 'sale') delete eligibleValues.instantBooking;
    const base = filterValuesToPropertyFilters(eligibleValues, {
      listingType: listingCatalogType,
      minGuestsFromSearch: listingCatalogType === 'rent' && state.hasGuestFilter ? searchParams.guests : undefined,
      instantBookingFromSearch: listingCatalogType === 'rent' && searchParams.instantBooking,
      saleIntent: state.saleIntent,
      isQuickSale: listingCatalogType === 'sale' && state.isQuickSale,
      rentTenancy: listingCatalogType === 'rent' ? rentTenancy : undefined,
    });
    return {
      ...base,
      search: searchText || undefined,
      managementCompanyId: selectedCompanyId || undefined,
    };
  }, [
    mergedFilterValues,
    listingCatalogType,
    searchParams.guests,
    searchParams.instantBooking,
    selectedCompanyId,
    searchText,
    rentTenancy,
    state.hasGuestFilter,
    state.saleIntent,
    state.isQuickSale,
  ]);

  const {
    data: infiniteData,
    isLoading,
    isFetchingNextPage,
    isError,
    refetch,
    hasNextPage,
    fetchNextPage,
  } = usePropertiesInfinite(serverFilters);

  useEffect(() => {
    const sentinel = loadMoreRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) fetchNextPage();
      },
      { rootMargin: '400px' }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const candidateProperties = useMemo(() => {
    const allItems = infiniteData?.pages.flatMap((p) => p.properties) || [];

    const filtered = allItems.filter((prop) => {
      if (categoryFilters.length > 0) {
        if (!categoryFilters.every((cat) => matchesCategory(prop, cat))) return false;
      }

      return true;
    }) as unknown as Property[];

    const sortMode = propertyMode === 'buy' ? 'buy' : 'rent';
    const sorted = [...filtered];
    sorted.sort((a, b) => comparePropertiesForSort(a, b, sortKey, sortMode));

    return sorted;
  }, [infiniteData, sortKey, categoryFilters, propertyMode]);

  const availability = useSearchPropertyAvailability(
    candidateProperties.map(property => property.id),
    propertyMode === 'rent' && nights > 0 ? format(searchParams.checkIn!, 'yyyy-MM-dd') : undefined,
    propertyMode === 'rent' && nights > 0 ? format(searchParams.checkOut!, 'yyyy-MM-dd') : undefined,
  );
  const properties = availability.enabled
    ? candidateProperties.filter(property => availability.availableIds.has(property.id))
    : candidateProperties;
  const availabilityText = (ru: string, en: string, th: string) => isRu ? ru : language === 'th' ? th : en;

  const advancedFilterCount = Object.entries(filterValues).reduce((count, [key, value]) => {
    if (key === 'bedrooms') return count;
    if (propertyMode === 'buy' && key === 'instantBooking') return count;
    return count + (Array.isArray(value) ? value.length : value ? 1 : 0);
  }, categoryFilters.length);
  const activeFilterCount = advancedFilterCount + searchParams.bedrooms.length + searchParams.propertyTypes.length + searchParams.locations.length + (selectedCompanyId ? 1 : 0) + (searchText ? 1 : 0) + (state.hasGuestFilter || nights > 0 ? 1 : 0);

  const clearAllFilters = () => {
    const resetUrl = new URLSearchParams({ mode: propertyMode });
    if (propertyMode === 'rent') resetUrl.set('tenancy', rentTenancy);
    setSearchParamsUrl(resetUrl);
  };

  const submitSearch = (params: URLSearchParams) => {
    setSearchParamsUrl(params);
    setFocusResults(true);
  };
  const summaryTypes = searchParams.propertyTypes.map(id => {
    const type = propertyTypes.find(item => item.id === id);
    return type ? (isRu ? type.labelRu : type.labelEn) : id;
  }).join(', ') || (text('Любое жильё', 'Any home', 'ที่พักทุกประเภท'));
  const summaryAreas = searchParams.locations.map(id => {
    const district = districts.find(item => item.valueKey === id);
    return district ? (isRu ? district.labelRu : district.labelEn) : id;
  }).join(', ') || (text('Весь Пхукет', 'All Phuket', 'ทั่วภูเก็ต'));
  const dateLabel = (date: Date) => new Intl.DateTimeFormat(isRu ? 'ru' : language === 'th' ? 'th' : 'en', { day: 'numeric', month: 'short' }).format(date);
  const summaryDates = searchParams.checkIn && searchParams.checkOut
    ? `${dateLabel(searchParams.checkIn)} – ${dateLabel(searchParams.checkOut)}`
    : (text('Без дат', 'Any dates', 'ไม่ระบุวันที่'));
  const summaryExtraFilters = advancedFilterCount + (selectedCompanyId ? 1 : 0);
  const summaryDuration = rentTenancy === 'medium' ? (text('Помесячно', 'Monthly', 'รายเดือน')) : rentTenancy === 'long' ? (text('На год', 'Yearly', 'รายปี')) : (text('Посуточно', 'Nightly', 'รายคืน'));

  return (
    <div data-property-mode={propertyMode} className={cn(PUBLIC_CONTENT_LAYOUT.catalogue, 'public-commerce public-commerce--search property-discovery min-h-screen bg-background')}>
      <SEOHead title={text('Жильё на Пхукете', 'Homes in Phuket', 'ที่พักในภูเก็ต')} description={text('Смотрите опубликованные предложения жилья на Пхукете и уточняйте условия поиска.', 'Browse published homes in Phuket and refine your search.', 'ดูประกาศที่พักในภูเก็ตและปรับการค้นหาของคุณ')} />
        <header className="property-discovery-header border-b">
          <h1 className="property-discovery-title">{text('Найдите ваш дом на Пхукете', 'Find your home in Phuket', 'ค้นหาที่พักในภูเก็ต')}</h1>
          <p className="text-body-sm text-muted-foreground">{text('Введите название объекта или выберите параметры ниже и нажмите «Найти жильё».', 'Enter a property name or choose your criteria below, then select “Find a home”.', 'กรอกชื่อที่พักหรือเลือกเงื่อนไขด้านล่าง แล้วกด “ค้นหาที่พัก”')}</p>
          <div className="flex items-center gap-3">
            <BackButton fallbackPath="/property" variant="ghost" size="sm" className="shrink-0 min-h-11 min-w-11" />
            <div className="property-discovery-intent" role="group" aria-label={text('Аренда или покупка', 'Rent or buy', 'เช่าหรือซื้อ')}>
              {(['rent', 'buy'] as const).map(mode => <button key={mode} type="button" aria-pressed={propertyMode === mode} onClick={() => {
                if (mode === propertyMode) return;
                const params = new URLSearchParams(searchParamsUrl);
                params.set('mode', mode);
                            setSearchParamsUrl(params);
              }}>{mode === 'rent' ? (text('Аренда', 'Rent', 'เช่า')) : (text('Покупка', 'Buy', 'ซื้อ'))}</button>)}
            </div>
          </div>
          <div className="property-search-editor property-discovery-editor">
            <HomeDiscoverySearch key={searchEditorKey} hideModeSwitch initialParams={searchParamsUrl} onSearch={submitSearch} />
          </div>
          <div className="text-body-sm text-muted-foreground" aria-label={text('Текущий поиск', 'Current search', 'การค้นหาปัจจุบัน')}>
            <p>{summaryTypes} · {summaryAreas}{searchParams.bedrooms.length > 0 ? ` · ${text('Спальни', 'Bedrooms', 'ห้องนอน')}: ${searchParams.bedrooms.join(', ')}` : ''}{searchText ? ` · «${searchText}»` : ''}</p>
            {propertyMode === 'rent' && <p>{summaryDuration} · {summaryDates} · {state.hasGuestFilter ? `${text('Гостей', 'Guests', 'ผู้เข้าพัก')}: ${searchParams.guests}` : (text('Гости не указаны', 'Guests not specified', 'ไม่ระบุจำนวนผู้เข้าพัก'))}</p>}
            {summaryExtraFilters > 0 && <p>{text('Дополнительных фильтров', 'Additional filters', 'ตัวกรองเพิ่มเติม')}: {summaryExtraFilters}</p>}
          </div>
          <div className="flex min-w-0 items-center gap-2">
            <UniversalFilter config={advancedFilterConfig} values={advancedValues} onChange={setAdvancedFilters} activeCount={advancedFilterCount}>
              <button type="button" className={cn('property-discovery-filter', advancedFilterCount > 0 && 'border-primary text-primary')}>
                <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
                <span>{priceBandUnavailable ? text('Удобства', 'Amenities', 'สิ่งอำนวยความสะดวก') : text('Цена и удобства', 'Price & amenities', 'ราคาและสิ่งอำนวยความสะดวก')}</span>
                {advancedFilterCount > 0 && <span className="font-mono">({advancedFilterCount})</span>}
              </button>
            </UniversalFilter>
            <div className="property-discovery-features" role="group" aria-label={text('Популярные удобства', 'Popular features', 'สิ่งอำนวยความสะดวกยอดนิยม')}>
              {QUICK_FEATURE_IDS.map(id => {
                const feature = PROPERTY_FEATURE_MAP.get(id)!;
                const selected = categoryFilters.includes(id);
                return <button type="button" key={id} aria-pressed={selected} onClick={() => setCategoryFilters(selected ? categoryFilters.filter(value => value !== id) : [...categoryFilters, id])}>
                  {selected && <Check className="h-3.5 w-3.5" aria-hidden="true" />}
                  {pickLang(language, { ru: feature.labelRu, en: feature.labelEn, th: FEATURE_LABELS_TH[feature.id] })}
                </button>;
              })}
            </div>
          </div>
          {priceBandUnavailable && <p role="note" className="text-body-sm text-muted-foreground">{isRu ? 'Цена уточняется для выбранного срока. Фильтр по цене недоступен; в карточках указан базовый тариф за соответствующий период.' : language === 'th' ? 'สอบถามราคาสำหรับระยะเวลาที่เลือก ตัวกรองราคายังไม่พร้อมใช้งาน การ์ดแสดงราคาเริ่มต้นตามช่วงเวลาที่ระบุ' : 'Confirm pricing for your chosen duration. Price filtering is unavailable; cards show the base rate for the labelled period.'}</p>}
          {categoryFilters.filter(id => !QUICK_FEATURE_IDS.includes(id)).length > 0 && <div className="flex flex-wrap gap-2" aria-label={text('Выбранные особенности', 'Selected features', 'สิ่งอำนวยความสะดวกที่เลือก')}>
            {categoryFilters.filter(id => !QUICK_FEATURE_IDS.includes(id)).map(id => {
              const feature = PROPERTY_FEATURE_MAP.get(id);
              const label = feature ? (pickLang(language, { ru: feature.labelRu, en: feature.labelEn, th: FEATURE_LABELS_TH[feature.id] })) : id;
              return <button type="button" key={id} className="min-h-11 border border-primary/30 bg-card px-3 text-body-sm" aria-label={`${text('Убрать', 'Remove', 'นำออก')} ${label}`} onClick={() => setCategoryFilters(categoryFilters.filter(value => value !== id))}>{label} ×</button>;
            })}
          </div>}
        </header>

        {availability.enabled && <div role="status" aria-label={availabilityText('Проверка занятости', 'Availability check', 'ตรวจสอบห้องว่าง')} className="my-2 border-l-2 border-primary/30 pl-3 text-sm text-muted-foreground">
          {availability.pending
            ? availabilityText('Проверяем занятость на выбранные даты…', 'Checking availability for your dates…', 'กำลังตรวจสอบห้องว่างสำหรับวันที่เลือก…')
            : availabilityText('Показаны объекты без занятых ночей по календарю на выбранные даты. Условия и доступность повторно проверяются при бронировании.', 'Only homes without blocked calendar nights for your dates are shown. Stay rules and availability are checked again when booking.', 'แสดงเฉพาะที่พักที่ไม่มีคืนที่ถูกจองในวันที่เลือก เงื่อนไขและห้องว่างสุดท้ายจะตรวจสอบเมื่อจอง')}
          {availability.failed && <div role="alert" className="mt-2">
            {availabilityText('Часть объектов не удалось проверить и они скрыты. Повторите проверку.', 'Some homes could not be checked and are hidden. Retry the check.', 'ตรวจสอบที่พักบางแห่งไม่สำเร็จและถูกซ่อนไว้ กรุณาลองอีกครั้ง')}
            <Button variant="outline" size="sm" className="ml-2" onClick={() => availability.retry()}>{availabilityText('Повторить', 'Try again', 'ลองอีกครั้ง')}</Button>
          </div>}
        </div>}
        <div className="py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 ref={resultsHeadingRef} tabIndex={-1} className="scroll-mt-[calc(var(--consumer-header-height,0px)+1rem)] text-h3 font-display basis-full sm:basis-auto">
              {isLoading ? (text('Ищем жильё…', 'Finding homes…', 'กำลังค้นหาที่พัก…')) : isError ? (text('Каталог недоступен', 'Catalogue unavailable', 'ไม่สามารถโหลดรายการที่พักได้')) : <>{availability.enabled ? availabilityText('Проверено, подходит по датам:', 'Checked date matches:', 'ที่พักที่ตรวจสอบแล้วตรงกับวันที่:') : hasNextPage ? text('Загружено объектов:', 'Homes loaded:', 'โหลดที่พักแล้ว:') : text('Найдено объектов:', 'Places found:', 'พบที่พัก:')} {properties.length}</>}
            </h2>
            <div className="property-discovery-result-actions flex flex-wrap items-center gap-2">
              <PropertySortSelect value={sortKey} onChange={setSortKey} />
              <PropertyCompareTrigger />
              {/* Map toggle */}
              <Button
                variant={showMap ? 'default' : 'outline'}
                size="sm"
                className={cn("gap-1.5 min-h-11 rounded-none text-body-sm", showMap && "!text-primary-foreground")}
                aria-pressed={showMap}
                onClick={() => setShowMap(!showMap)}
              >
                {showMap ? <List className="w-3.5 h-3.5" /> : <MapIcon className="w-3.5 h-3.5" />}
                {showMap ? (text('Список', 'List', 'รายการ')) : (text('Карта', 'Map', 'แผนที่'))}
              </Button>
              {activeFilterCount > 0 && (
                <Button variant="ghost" size="sm" className="text-body-sm min-h-11" onClick={clearAllFilters}>
                  {text('Сбросить всё', 'Clear all', 'ล้างทั้งหมด')}
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className={cn('property-discovery-results', showMap && 'property-discovery-results--map')}>
        {/* Existing map/list state and callbacks share the same filtered properties. */}
        {showMap && (
          <div className="property-discovery-map-panel mb-4">
            <Suspense fallback={<div role="status" className="min-h-64 p-4">{text('Загрузка карты…', 'Loading map…', 'กำลังโหลดแผนที่…')}</div>}>
            <PropertyMapView
              properties={properties}
              hoveredProperty={hoveredProperty}
              onHover={setHoveredProperty}
              selectedId={focusedId}
              onSelect={selectFocused}
              mode={propertyMode}
              nights={nights > 0 ? nights : undefined}
              className="property-discovery-map"
            />
            </Suspense>
          </div>
        )}


        <section aria-label={text('Результаты поиска жилья', 'Home search results', 'ผลการค้นหาที่พัก')} className="property-discovery-list min-w-0 pb-24">
          {isLoading && (
            <div className={cn(PUBLIC_CATALOG_GRID, 'property-discovery-card-grid')} data-testid="property-results-skeleton">
              {[1,2,3,4,5,6,7,8].map(i => (
                <div key={i} className="space-y-3">
                  <Skeleton className="aspect-square rounded-none" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          )}

          {!isLoading && !isError && properties.length > 0 && (
            <>

              <div className={cn(PUBLIC_CATALOG_GRID, 'property-discovery-card-grid')} data-testid="property-results-grid">
                {properties.map(property => {
                  return (
                    <PropertyListingCard
                      key={property.id}
                      property={property}
                      mode={propertyMode}
                      isHovered={hoveredProperty === property.id}
                      onHover={setHoveredProperty}
                      isSelected={focusedId === property.id}
                      onSelect={showMap ? selectFocused : undefined}
                      nights={nights > 0 ? nights : undefined}
                    />
                  );
                })}

              </div>
            </>
          )}

          <div ref={loadMoreRef} className={cn("flex justify-center", properties.length > 0 && "py-8")}>
            {hasNextPage && !isFetchingNextPage && <Button variant="outline" onClick={() => fetchNextPage()}>{availabilityText('Загрузить ещё', 'Load more', 'โหลดเพิ่มเติม')}</Button>}
            {isFetchingNextPage && <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />}
            {!isLoading && !hasNextPage && !availability.pending && !availability.failed && properties.length > 0 && (
              <p className="text-sm text-muted-foreground">{text('Все объекты загружены', 'All properties loaded', 'โหลดที่พักทั้งหมดแล้ว')}</p>
            )}
          </div>

          {isError && <div role="alert" className="py-16 text-center">
            <h2 className="mb-3">{text('Не удалось загрузить жильё', 'Homes could not be loaded', 'ไม่สามารถโหลดที่พักได้')}</h2>
            <p className="mb-5 text-muted-foreground">{text('Параметры поиска сохранены. Попробуйте ещё раз.', 'Your search is kept. Please try again.', 'เก็บเงื่อนไขการค้นหาไว้แล้ว กรุณาลองอีกครั้ง')}</p>
            <Button variant="outline" onClick={() => refetch()}>{text('Повторить', 'Try again', 'ลองอีกครั้ง')}</Button>
          </div>}
          {!isLoading && !isError && !availability.pending && !availability.failed && !hasNextPage && properties.length === 0 && (
            <div className="text-center py-8">
              <Home className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">{text('Ничего не найдено', 'No properties found', 'ไม่พบที่พัก')}</h3>
              <p className="text-muted-foreground mb-4">{text('Попробуйте изменить фильтры', 'Try adjusting your filters', 'ลองเปลี่ยนตัวกรอง')}</p>
              <Button variant="outline" onClick={clearAllFilters}>
                {text('Сбросить фильтры', 'Reset filters', 'ล้างตัวกรอง')}
              </Button>
            </div>
          )}

          {propertyMode === 'buy' && !isError && <OffplanCTASection className="mt-8" />}
          {properties.length > 0 && !isError && <CrossSellSection currentVertical="property" className="mt-8 px-4" />}

          {showStickyCTA && <VerticalCTA vertical="property" variant="sticky" context="list" />}
        </section>
        </div>
      </div>
  );
}
