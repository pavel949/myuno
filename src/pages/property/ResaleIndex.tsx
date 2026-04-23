/**
 * ResaleIndex — Secondary market & assignment catalog
 * /property/resale
 */
import React, { useState, useMemo } from 'react';
import { Building2, MapPin, ArrowRightLeft, SlidersHorizontal, X, TrendingUp, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useResaleProperties, type ResaleFilters } from '@/hooks/useResaleProperties';
import { ResalePropertyCard } from '@/components/property/ResalePropertyCard';
import { cn } from '@/lib/utils';
import { PHUKET_DISTRICTS } from '@/lib/taxonomies';

type TabFilter = 'all' | 'assignment' | 'ready';

const PROPERTY_TYPES = [
  { value: 'condo', labelEn: 'Condo', labelRu: 'Кондо' },
  { value: 'villa', labelEn: 'Villa', labelRu: 'Вилла' },
  { value: 'townhouse', labelEn: 'Townhouse', labelRu: 'Таунхаус' },
  { value: 'land', labelEn: 'Land', labelRu: 'Земля' },
];

export default function ResaleIndex() {
  const { language } = useLanguage();
  const { formatPrice } = useCurrency();
  const isRu = language === 'ru';

  const [tab, setTab] = useState<TabFilter>('all');
  const [zone, setZone] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);

  const filters: ResaleFilters = useMemo(() => ({
    zone: zone || undefined,
    property_type: propertyType || undefined,
    tab,
  }), [zone, propertyType, tab]);

  const { data: properties, isLoading } = useResaleProperties(filters);

  const activeFilterCount = [zone, propertyType].filter(Boolean).length;

  const clearFilters = () => {
    setZone('');
    setPropertyType('');
  };

  const tabs: { value: TabFilter; labelEn: string; labelRu: string }[] = [
    { value: 'all', labelEn: 'All', labelRu: 'Все' },
    { value: 'assignment', labelEn: 'Assignments', labelRu: 'Переуступки' },
    { value: 'ready', labelEn: 'Ready', labelRu: 'Готовые' },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border/50 px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-lg font-bold text-foreground">
              {isRu ? 'Вторичный рынок' : 'Resale Market'}
            </h1>
            <p className="text-xs text-muted-foreground">
              {isRu ? 'Переуступки и готовая недвижимость' : 'Assignments & ready properties'}
            </p>
          </div>

          <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="relative">
                <SlidersHorizontal className="w-4 h-4 mr-1" />
                {isRu ? 'Фильтры' : 'Filters'}
                {activeFilterCount > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-[10px]">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[60vh] rounded-none">
              <SheetHeader>
                <SheetTitle>{isRu ? 'Фильтры' : 'Filters'}</SheetTitle>
              </SheetHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">
                    {isRu ? 'Тип недвижимости' : 'Property Type'}
                  </label>
                  <Select value={propertyType} onValueChange={setPropertyType}>
                    <SelectTrigger><SelectValue placeholder={isRu ? 'Все типы' : 'All types'} /></SelectTrigger>
                    <SelectContent>
                      {PROPERTY_TYPES.map(t => (
                        <SelectItem key={t.value} value={t.value}>
                          {isRu ? t.labelRu : t.labelEn}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">
                    {isRu ? 'Район' : 'Zone'}
                  </label>
                  <Select value={zone} onValueChange={setZone}>
                    <SelectTrigger><SelectValue placeholder={isRu ? 'Все районы' : 'All zones'} /></SelectTrigger>
                    <SelectContent>
                      {PHUKET_DISTRICTS.map((d) => (
                        <SelectItem key={d.id} value={d.labelEn}>
                          {isRu ? d.labelRu : d.labelEn}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={clearFilters}>
                    {isRu ? 'Сбросить' : 'Clear'}
                  </Button>
                  <Button className="flex-1" onClick={() => setFiltersOpen(false)}>
                    {isRu ? 'Показать' : 'Apply'}
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
              onClick={() => setTab(t.value)}
              className={cn(
                "px-3 py-1.5 rounded-full text-sm font-medium transition-all",
                tab === t.value
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted"
              )}
            >
              {t.value === 'assignment' && <ArrowRightLeft className="w-3 h-3 inline mr-1" />}
              {isRu ? t.labelRu : t.labelEn}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      <div className="px-4 py-3">
        {!isLoading && properties && (
          <p className="text-sm text-muted-foreground mb-3">
            {isRu ? `Найдено: ${properties.length}` : `Found: ${properties.length}`}
          </p>
        )}

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-64 rounded-none" />
            ))}
          </div>
        ) : properties && properties.length > 0 ? (
          <div className="space-y-4">
            {properties.map(property => (
              <ResalePropertyCard key={property.id} property={property} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Building2 className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground">
              {isRu ? 'Нет объектов по выбранным фильтрам' : 'No properties match your filters'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
