/**
 * FlowersIndex — Unified catalog using MiniAppLayout + CatalogCard
 */
import '@/styles/public-commerce.css';
import { useMemo, useRef } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Flower2, Info } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCart } from '@/contexts/CartContext';
import { MiniAppLayout, CatalogCard } from '@/components/miniapp';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/uno/EmptyState';
import { useBouquets } from '@/hooks/useBouquets';
import { useFlowerFilterOptions } from '@/hooks/useDynamicFilterOptions';
import { ActiveFilters, FilterValues } from '@/components/filters/UniversalFilter';
import { mapBouquetToCatalogCard } from '@/lib/adapters/catalogCardAdapters';
import { APP_ROUTES } from '@/lib/config/routes';
import { PersonaFilterChip } from '@/components/landings/PersonaFilterChip';
import { usePersonaFilter } from '@/hooks/usePersonaFilter';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { MarketplaceRequestSteps } from '@/components/services/MarketplaceRequestSteps';
import { FLOWER_FILTER_KEYS, readFlowerFilters, writeFlowerFilters } from '@/lib/discovery/flowerCatalogue';
import { pickLang } from '@/lib/i18n/pickLang';

export default function FlowersIndex() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { getItemsByType } = useCart();
  const [params, setParams] = useSearchParams();
  const location = useLocation();
  const pending = useRef({ key: location.key, params });
  if (pending.current.key !== location.key) pending.current = { key: location.key, params };
  const selectedCategory = params.get('category') || 'all';
  const searchQuery = params.get('q') || '';
  const filterValues = useMemo(() => readFlowerFilters(params), [params]);
  const update = (key: string, value: string) => {
    const next = new URLSearchParams(pending.current.params);
    if (!value || value === 'all') next.delete(key); else next.set(key, value);
    pending.current.params = next;
    setParams(next, { replace: key === 'q' });
  };
  const setFilterValues = (values: FilterValues) => {
    const next = writeFlowerFilters(pending.current.params, values);
    pending.current.params = next;
    setParams(next);
  };
  const t = (ru: string, en: string, th: string) => pickLang(language, { ru, en, th });
  const isRu = language === 'ru';
  const { applyFilter: applyPersonaFilter, personaTags, clearPersona } = usePersonaFilter();

  const { categoryRibbon, filterConfig: rawFilterConfig } = useFlowerFilterOptions();
  // Expose only filters implemented against the catalogue, never inert size/delivery promises.
  const filterConfig = useMemo(() => ({ ...rawFilterConfig, sections: rawFilterConfig.sections.filter(section => FLOWER_FILTER_KEYS.some(key => key === section.id)) }), [rawFilterConfig]);
  const categories = useMemo(() => categoryRibbon.map(opt => ({
    id: opt.id,
    labelEn: opt.labelEn,
    labelRu: opt.labelRu,
  })), [categoryRibbon]);

  const { bouquets, isLoading, error, refetch } = useBouquets({
    category: selectedCategory !== 'all' ? selectedCategory : undefined,
    onlyActive: true,
  });

  const activeFilterCount = useMemo(() => {
    let count = 0;
    Object.values(filterValues).forEach(v => {
      if (Array.isArray(v)) count += v.length;
      else if (v) count += 1;
    });
    return count;
  }, [filterValues]);

  const debouncedSearchQuery = useDebouncedValue(searchQuery, 250);

  // Precompute a lowercased haystack per bouquet once per `bouquets` identity.
  // This is the most expensive step on mobile — caching it avoids re-joining
  // arrays on every keystroke or filter toggle.
  const haystacks = useMemo(() => {
    const map = new Map<string, string>();
    for (const b of bouquets) {
      map.set(b.id, [
        b.name_en, b.name_ru,
        b.description_en, b.description_ru,
        b.style, b.color_palette,
        ...(b.flowers || []),
        ...(b.colors || []),
        ...(b.occasion_tags || []),
      ].filter(Boolean).join(' ').toLowerCase());
    }
    return map;
  }, [bouquets]);

  const normalizedQuery = useMemo(
    () => debouncedSearchQuery.trim().toLowerCase(),
    [debouncedSearchQuery],
  );

  // Stage 1: search-only result, cached on (bouquets, normalizedQuery).
  // Toggling a filter (without changing the query) reuses this slice.
  const searchedBouquets = useMemo(() => {
    if (!normalizedQuery) return bouquets;
    return bouquets.filter(b => (haystacks.get(b.id) || '').includes(normalizedQuery));
  }, [bouquets, haystacks, normalizedQuery]);

  // Stage 2: structured filters, cached on (searchedBouquets, filterValues).
  // Typing in the search box without touching filters reuses prior filter pass.
  const structurallyFiltered = useMemo(() => {
    if (activeFilterCount === 0) return searchedBouquets;
    const priceLevel = filterValues.priceLevel as string | null;
    const occasions = filterValues.occasion as string[] | undefined;
    const styles = (filterValues.style as string[] | undefined)?.map(s => s.toLowerCase());
    const colors = (filterValues.colorPalette as string[] | undefined)?.map(c => c.toLowerCase());
    const flowerTypes = (filterValues.flowerType as string[] | undefined)?.map(f => f.toLowerCase());
    const priceRanges: Record<string, [number, number]> = {
      '1': [0, 1500], '2': [1500, 3000], '3': [3000, 5000], '4': [5000, Infinity],
    };
    if (priceLevel && !priceRanges[priceLevel]) return [];
    const [pMin, pMax] = priceLevel ? priceRanges[priceLevel] : [0, Infinity];

    return searchedBouquets.filter(b => {
      if (priceLevel && (b.price < pMin || b.price >= pMax)) return false;
      if (occasions?.length && !(b.occasion_tags || []).some((o: string) => occasions.includes(o))) return false;
      if (styles?.length) {
        const bStyle = b.style?.toLowerCase();
        if (!bStyle || !styles.includes(bStyle)) return false;
      }
      if (colors?.length) {
        const palette = b.color_palette?.toLowerCase() || '';
        const bColors = (b.colors || []).map((c: string) => c.toLowerCase());
        if (!colors.some(c => palette.includes(c) || bColors.some(bc => bc.includes(c)))) return false;
      }
      if (flowerTypes?.length) {
        const flowers = (b.flowers || []).map((f: string) => f.toLowerCase());
        if (!flowerTypes.some(ft => flowers.some(f => f.includes(ft)))) return false;
      }
      return true;
    });
  }, [searchedBouquets, filterValues, activeFilterCount]);

  // Stage 3: persona filter (cheap, depends on persona context).
  const filteredBouquets = useMemo(
    () => applyPersonaFilter(structurallyFiltered, (b) => {
      const tags = (b.occasion_tags as string[] | null) ?? [];
      return [...tags, b.style].filter(Boolean) as string[];
    }, { strict: true }),
    [structurallyFiltered, applyPersonaFilter],
  );

  const handleRemoveFilter = (sectionId: string, optionId?: string) => {
    const current = filterValues[sectionId];
    setFilterValues({ ...filterValues, [sectionId]: Array.isArray(current) && optionId ? current.filter(v => v !== optionId) : null });
  };
  const handleClearAll = () => {
    const next = writeFlowerFilters(pending.current.params, {});
    next.delete('category');
    next.delete('q');
    pending.current.params = next;
    setParams(next);
  };
  const hasFilters = activeFilterCount > 0 || selectedCategory !== 'all' || Boolean(searchQuery.trim());

  const flowersInCart = getItemsByType('flowers');
  const totalItems = flowersInCart.reduce((sum, item) => sum + item.quantity, 0);



  return (
    <MiniAppLayout
      contentClassName="public-commerce"
      title={t('Доставка цветов', 'Flower delivery', 'บริการส่งดอกไม้')}
      subtitle={error ? t('Каталог временно недоступен', 'Catalogue temporarily unavailable', 'รายการไม่พร้อมใช้งานชั่วคราว') : isLoading ? t('Загружаем букеты…', 'Loading bouquets…', 'กำลังโหลดช่อดอกไม้…') : isRu ? `Найдено: ${filteredBouquets.length}` : `${filteredBouquets.length} results`}
      fallbackPath={APP_ROUTES.GOAL_SERVICES}
      showSearch
      searchValue={searchQuery}
      onSearchChange={value => update('q', value)}
      searchPlaceholder={isRu ? 'Поиск букетов, цветов, поводов…' : 'Search bouquets, flowers, occasions…'}
      showHero={false}
      categories={categories}
      selectedCategory={selectedCategory}
      onCategoryChange={value => update('category', value)}
      filterConfig={filterConfig}
      filterValues={filterValues}
      onFilterChange={setFilterValues}
      filterActiveCount={activeFilterCount}
      showCartButton={true}
      cartItemCount={totalItems}
      showBottomNav={false}
    >
      <Helmet>
        <title>{isRu ? 'Доставка цветов на Пхукете | myUNO' : 'Flower Delivery in Phuket | myUNO'}</title>
        <meta name="description" content={isRu
          ? 'Букеты и цветы на Пхукете. Выберите композицию и уточните наличие и доставку при оформлении.'
          : 'Bouquets and flowers in Phuket. Choose an arrangement and confirm availability and delivery when ordering.'
        } />
      </Helmet>

      <section className="py-4" aria-label={t('О доставке цветов', 'About flower delivery', 'เกี่ยวกับบริการส่งดอกไม้')}>
        <p className="text-xs font-semibold uppercase tracking-widest text-accent">myUNO · {t('Пхукет', 'Phuket', 'ภูเก็ต')}</p>
        <h2 className="mt-2 font-display text-2xl sm:text-3xl">{t('Цветы для особенного момента', 'Flowers for a special moment', 'ดอกไม้สำหรับช่วงเวลาพิเศษ')}</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t('Выберите букет по поводу, цветам и бюджету. Фотографии, состав и варианты размера — в карточке предложения.', 'Choose a bouquet by occasion, flowers and budget. Explore photos, composition and size options on its page.', 'เลือกช่อดอกไม้ตามโอกาส ชนิดและงบประมาณ ดูรูป ส่วนประกอบและขนาดในหน้าข้อเสนอ')}</p>
        <p className="mt-3 flex items-start gap-2 text-sm text-muted-foreground"><Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />{t('myUNO согласует наличие, состав букета и время доставки. Они требуют подтверждения.', 'myUNO confirms availability, bouquet composition and delivery time before fulfilment.', 'myUNO จะยืนยันความพร้อม ส่วนประกอบและเวลาจัดส่งก่อนให้บริการ')}</p>
      </section>
      {personaTags.length > 0 && <PersonaFilterChip className="mb-4" />}
      {hasFilters && <div className="flex flex-wrap items-center justify-between gap-3 border border-border p-4"><p className="text-sm">{t('Выбраны условия поиска', 'Search filters selected', 'เลือกตัวกรองการค้นหาแล้ว')}</p><Button variant="outline" onClick={handleClearAll}>{t('Сбросить всё', 'Clear all', 'ล้างทั้งหมด')}</Button></div>}

      {activeFilterCount > 0 && (
        <ActiveFilters
          config={filterConfig}
          values={filterValues}
          onRemove={handleRemoveFilter}
          onClearAll={handleClearAll}
          className="mb-4"
        />
      )}

      {error ? <div role="alert" className="space-y-3 border border-border p-6"><p>{t('Не удалось загрузить букеты. Попробуйте ещё раз.', 'Bouquets could not be loaded. Please try again.', 'โหลดช่อดอกไม้ไม่สำเร็จ โปรดลองอีกครั้ง')}</p><Button variant="outline" onClick={() => refetch()}>{t('Повторить', 'Try again', 'ลองอีกครั้ง')}</Button></div> : isLoading ? (
        <div className="grid grid-cols-1 gap-5 min-[420px]:grid-cols-2 md:gap-6 lg:grid-cols-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="aspect-[3/4] rounded-none" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      ) : filteredBouquets.length === 0 ? (
        <EmptyState
          icon={Flower2}
          title={isRu ? 'Букеты не найдены' : 'No bouquets found'}
          description={personaTags.length > 0
            ? t('Нет букетов, подходящих под этот сценарий и остальные условия.', 'No bouquets match this scenario and your other selections.', 'ไม่มีช่อดอกไม้ที่ตรงกับสถานการณ์และตัวเลือกอื่น ๆ ของคุณ')
            : isRu
            ? activeFilterCount > 0 ? 'Попробуйте изменить фильтры' : 'В этой категории пока нет букетов'
            : activeFilterCount > 0 ? 'Try adjusting your filters' : 'No bouquets in this category yet'
          }
          action={personaTags.length > 0 ? <Button variant="outline" onClick={clearPersona}>{t('Искать без сценария', 'Search without scenario', 'ค้นหาโดยไม่เลือกสถานการณ์')}</Button> : hasFilters ? (
            <Button variant="outline" onClick={handleClearAll}>
              {isRu ? 'Сбросить фильтры' : 'Reset filters'}
            </Button>
          ) : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 gap-5 min-[420px]:grid-cols-2 md:gap-6 lg:grid-cols-3">
          {filteredBouquets.map(bouquet => (
            <CatalogCard className="public-commerce-catalog-card" key={bouquet.id} {...mapBouquetToCatalogCard(bouquet, language, navigate)} onClick={undefined} href={`/flowers/bouquet/${bouquet.id}`} />
          ))}
        </div>
      )}
      <MarketplaceRequestSteps />
    </MiniAppLayout>
  );
}
