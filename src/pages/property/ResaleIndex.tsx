/**
 * ResaleIndex — Secondary market & assignment catalog
 * /property/resale
 */
import React, { useState, useMemo } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Building2, ArrowRightLeft, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useLanguage } from '@/contexts/LanguageContext';
import { useResaleProperties, type ResaleFilters } from '@/hooks/useResaleProperties';
import { ResalePropertyCard } from '@/components/property/ResalePropertyCard';
import { cn } from '@/lib/utils';
import { PHUKET_DISTRICTS } from '@/lib/taxonomies';
import { pickLang } from '@/lib/i18n/pickLang';
import { priceLevelToPriceRange, propertyPriceLevelDescriptions } from '@/lib/propertyCatalogServerFilters';
import { PUBLIC_CATALOG_GRID } from '@/design-system/ecosystemLayout';

type TabFilter = 'all' | 'assignment' | 'ready';

const PROPERTY_TYPES = [
  { value: 'condo', labelEn: 'Condo', labelRu: 'Кондо', labelTh: 'คอนโด' },
  { value: 'villa', labelEn: 'Villa', labelRu: 'Вилла', labelTh: 'วิลล่า' },
  { value: 'townhouse', labelEn: 'Townhouse', labelRu: 'Таунхаус', labelTh: 'ทาวน์เฮาส์' },
  { value: 'land', labelEn: 'Land', labelRu: 'Земля', labelTh: 'ที่ดิน' },
];

export default function ResaleIndex() {
  const { language } = useLanguage();
  const text = (ru: string, en: string, th: string) => pickLang(language, { ru, en, th });
  const [params] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const tab: TabFilter = params.get('tab') === 'assignment' ? 'assignment' : params.get('tab') === 'ready' ? 'ready' : 'all';
  const zone = params.get('zone') || '';
  const propertyType = params.get('property_type') || '';
  const budget = /^[1-4]$/.test(params.get('budget') || '') ? params.get('budget')! : '';
  const [filtersOpen, setFiltersOpen] = useState(false);
  const budgetRange = priceLevelToPriceRange(budget, 'sale');
  const budgetLabels = propertyPriceLevelDescriptions('sale', language);
  const update = (changes: Record<string, string>) => {
    const next = new URLSearchParams(params);
    Object.entries(changes).forEach(([key, value]) => value ? next.set(key, value) : next.delete(key));
    navigate({ search: next.toString(), hash: location.hash }, { state: location.state });
  };

  const filters: ResaleFilters = useMemo(() => ({
    zone: zone || undefined,
    property_type: propertyType || undefined,
    tab,
    ...(budgetRange?.minPrice != null ? { min_price: budgetRange.minPrice } : {}),
    ...(budgetRange?.maxPrice != null ? { max_price: budgetRange.maxPrice } : {}),
  }), [zone, propertyType, tab, budgetRange?.minPrice, budgetRange?.maxPrice]);

  const { data, isLoading, isError, refetch } = useResaleProperties(filters);
  // These are the existing THB bands, never a conversion of an unknown currency.
  const properties = budget ? data?.filter(property => property.currency?.trim().toUpperCase() === 'THB') : data;

  const activeFilterCount = [zone, propertyType, budget].filter(Boolean).length;

  const clearFilters = () => {
    update({ zone: '', property_type: '', budget: '' });
  };

  const tabs: { value: TabFilter; labelEn: string; labelRu: string; labelTh: string }[] = [
    { value: 'all', labelEn: 'All', labelRu: 'Все', labelTh: 'ทั้งหมด' },
    { value: 'assignment', labelEn: 'Assignments', labelRu: 'Переуступки', labelTh: 'ขายต่อสิทธิ์' },
    { value: 'ready', labelEn: 'Ready', labelRu: 'Готовые', labelTh: 'พร้อมอยู่' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-[var(--consumer-header-height,0px)] z-20 bg-background/95 border-b border-border/50 px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-lg font-bold text-foreground">
              {text('Вторичная недвижимость', 'Resale Market', 'อสังหาริมทรัพย์มือสอง')}
            </h1>
            <p className="text-xs text-muted-foreground">
              {text('Готовые объекты и переуступки. Уточните район, тип жилья и бюджет.', 'Ready homes and assignments. Refine the area, home type and budget.', 'บ้านพร้อมอยู่และขายต่อสิทธิ์ เลือกย่าน ประเภทที่พัก และงบประมาณ')}
            </p>
          </div>

          <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="relative">
                <SlidersHorizontal className="w-4 h-4 mr-1" />
                {text('Фильтры', 'Filters', 'ตัวกรอง')}
                {activeFilterCount > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-[10px]">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="max-h-[90dvh] overflow-y-auto rounded-none">
              <SheetHeader>
                <SheetTitle>{text('Фильтры', 'Filters', 'ตัวกรอง')}</SheetTitle>
              </SheetHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">
                    {text('Тип недвижимости', 'Property Type', 'ประเภทอสังหาริมทรัพย์')}
                  </label>
                  <Select value={propertyType || "__all"} onValueChange={value => update({ property_type: value === "__all" ? "" : value })}>
                    <SelectTrigger aria-label={text('Тип недвижимости', 'Property Type', 'ประเภทอสังหาริมทรัพย์')}><SelectValue placeholder={text('Все типы', 'All types', 'ทุกประเภท')} /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all">{text('Все типы', 'All types', 'ทุกประเภท')}</SelectItem>
                      {propertyType && !PROPERTY_TYPES.some(item => item.value === propertyType) && <SelectItem value={propertyType}>{propertyType}</SelectItem>}
                      {PROPERTY_TYPES.map(t => (
                        <SelectItem key={t.value} value={t.value}>
                          {text(t.labelRu, t.labelEn, t.labelTh)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">
                    {text('Район', 'Area', 'ย่าน')}
                  </label>
                  <Select value={zone || "__all"} onValueChange={value => update({ zone: value === "__all" ? "" : value })}>
                    <SelectTrigger aria-label={text('Район', 'Area', 'ย่าน')}><SelectValue placeholder={text('Все районы', 'All areas', 'ทุกย่าน')} /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all">{text('Все районы', 'All areas', 'ทุกย่าน')}</SelectItem>
                      {zone && !PHUKET_DISTRICTS.some(item => item.labelEn === zone) && <SelectItem value={zone}>{zone}</SelectItem>}
                      {PHUKET_DISTRICTS.map((d) => (
                        <SelectItem key={d.id} value={d.labelEn}>
                          {text(d.labelRu, d.labelEn, d.labelEn)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">{text('Бюджет в THB', 'Budget in THB', 'งบประมาณ THB')}</label>
                  <Select value={budget || '__all'} onValueChange={value => update({ budget: value === '__all' ? '' : value })}>
                    <SelectTrigger aria-label={text('Бюджет в THB', 'Budget in THB', 'งบประมาณ THB')}><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all">{text('Любой бюджет', 'Any budget', 'ทุกงบประมาณ')}</SelectItem>
                      {['1', '2', '3', '4'].map(level => <SelectItem key={level} value={level}>{budgetLabels[level]}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <p className="mt-2 text-xs text-muted-foreground">{text('Бюджет применяется к объявлениям с ценой в THB.', 'Budget applies to listings priced in THB.', 'งบประมาณใช้กับประกาศที่ระบุราคาเป็น THB')}</p>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={clearFilters}>
                    {text('Сбросить', 'Clear', 'รีเซ็ต')}
                  </Button>
                  <Button className="flex-1" onClick={() => setFiltersOpen(false)}>
                    {text('Показать', 'Show results', 'ดูผลลัพธ์')}
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Tabs */}
        <div className="flex gap-1">
          {tabs.map(t => (
            <button
              key={t.value}
              onClick={() => update({ tab: t.value === 'all' ? '' : t.value })}
              aria-pressed={tab === t.value}
              className={cn(
                "px-3 py-1.5 rounded-full text-sm font-medium transition-all",
                tab === t.value
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted"
              )}
            >
              {t.value === 'assignment' && <ArrowRightLeft className="w-3 h-3 inline mr-1" />}
              {text(t.labelRu, t.labelEn, t.labelTh)}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      <div className="px-4 py-3">
        {!isLoading && !isError && properties && (
          <p className="text-sm text-muted-foreground mb-3">
            {text(`Найдено: ${properties.length}`, `Found: ${properties.length}`, `พบ: ${properties.length}`)}
          </p>
        )}

        {isLoading ? (
          <div className={PUBLIC_CATALOG_GRID}>
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-64 rounded-none" />
            ))}
          </div>
        ) : isError ? (
          <div role="alert" className="space-y-3 border border-border p-6">
            <p>{text('Не удалось загрузить объявления. Попробуйте ещё раз.', 'Listings could not be loaded. Try again.', 'ไม่สามารถโหลดประกาศได้ โปรดลองอีกครั้ง')}</p>
            <Button variant="outline" onClick={() => refetch()}>{text('Повторить', 'Try again', 'ลองอีกครั้ง')}</Button>
          </div>
        ) : properties && properties.length > 0 ? (
          <div className={PUBLIC_CATALOG_GRID}>
            {properties.map(property => (
              <ResalePropertyCard key={property.id} property={property} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Building2 className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground">
              {text('Нет объектов по выбранным фильтрам', 'No properties match your filters', 'ไม่พบอสังหาริมทรัพย์ที่ตรงกับตัวกรอง')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
