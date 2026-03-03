/**
 * PropertyCompare — Compare up to 3 properties side by side
 * Stored in localStorage, accessible from property detail pages
 */
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, GitCompareArrows, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { getPropertyTypeLabel, getDistrictLabel } from '@/lib/propertyTaxonomy';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

const MAX_COMPARE = 3;
const STORAGE_KEY = 'myuno_compare_properties';

export interface CompareProperty {
  id: string;
  title_en: string;
  title_ru?: string;
  cover_image?: string;
  property_type?: string;
  district?: string;
  bedrooms?: number;
  bathrooms?: number;
  area_sqm?: number;
  max_guests?: number;
  price?: number;
  price_per_night?: number;
  price_period?: string;
  rating?: number;
  amenities?: string[];
}

interface CompareContextType {
  items: CompareProperty[];
  add: (property: CompareProperty) => void;
  remove: (id: string) => void;
  clear: () => void;
  isInCompare: (id: string) => boolean;
  openSheet: () => void;
}

const CompareContext = createContext<CompareContextType | null>(null);

export function usePropertyCompare() {
  const ctx = useContext(CompareContext);
  if (!ctx) throw new Error('usePropertyCompare must be used within CompareProvider');
  return ctx;
}

export function CompareProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CompareProperty[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  });
  const [sheetOpen, setSheetOpen] = useState(false);
  const { language } = useLanguage();
  const isRu = language === 'ru';

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const add = useCallback((property: CompareProperty) => {
    setItems(prev => {
      if (prev.length >= MAX_COMPARE) {
        toast.error(isRu ? `Максимум ${MAX_COMPARE} объекта` : `Maximum ${MAX_COMPARE} properties`);
        return prev;
      }
      if (prev.some(p => p.id === property.id)) {
        toast.info(isRu ? 'Уже в сравнении' : 'Already in compare');
        return prev;
      }
      toast.success(isRu ? 'Добавлено к сравнению' : 'Added to compare');
      return [...prev, property];
    });
  }, [isRu]);

  const remove = useCallback((id: string) => {
    setItems(prev => prev.filter(p => p.id !== id));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const isInCompare = useCallback((id: string) => items.some(p => p.id === id), [items]);

  const openSheet = useCallback(() => setSheetOpen(true), []);

  return (
    <CompareContext.Provider value={{ items, add, remove, clear, isInCompare, openSheet }}>
      {children}
      {/* Floating compare bar */}
      <AnimatePresence>
        {items.length > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50"
          >
            <Button
              onClick={() => setSheetOpen(true)}
              className="gap-2 rounded-full shadow-lg px-5 py-3 h-auto"
              size="lg"
            >
              <GitCompareArrows className="w-4 h-4" />
              {isRu ? 'Сравнить' : 'Compare'} ({items.length})
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Compare Sheet */}
      <CompareSheet open={sheetOpen} onOpenChange={setSheetOpen} />
    </CompareContext.Provider>
  );
}

function CompareSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { items, remove, clear } = usePropertyCompare();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { formatPrice } = useCurrency();
  const isRu = language === 'ru';

  const specs = [
    { key: 'type', label: isRu ? 'Тип' : 'Type', render: (p: CompareProperty) => p.property_type ? getPropertyTypeLabel(p.property_type, isRu ? 'ru' : 'en') : '—' },
    { key: 'district', label: isRu ? 'Район' : 'District', render: (p: CompareProperty) => p.district ? getDistrictLabel(p.district, isRu ? 'ru' : 'en') : '—' },
    { key: 'bedrooms', label: isRu ? 'Спальни' : 'Bedrooms', render: (p: CompareProperty) => p.bedrooms ?? '—' },
    { key: 'bathrooms', label: isRu ? 'Ванные' : 'Bathrooms', render: (p: CompareProperty) => p.bathrooms ?? '—' },
    { key: 'area', label: isRu ? 'Площадь' : 'Area', render: (p: CompareProperty) => p.area_sqm ? `${p.area_sqm} м²` : '—' },
    { key: 'guests', label: isRu ? 'Гости' : 'Guests', render: (p: CompareProperty) => p.max_guests ?? '—' },
    { key: 'price', label: isRu ? 'Цена' : 'Price', render: (p: CompareProperty) => {
      const price = p.price_per_night || p.price;
      return price ? formatPrice(price) : '—';
    }},
    { key: 'rating', label: isRu ? 'Рейтинг' : 'Rating', render: (p: CompareProperty) => p.rating ? `★ ${p.rating.toFixed(1)}` : '—' },
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] overflow-y-auto">
        <SheetHeader className="flex-row items-center justify-between pb-4">
          <SheetTitle>{isRu ? 'Сравнение объектов' : 'Compare properties'}</SheetTitle>
          {items.length > 0 && (
            <Button variant="ghost" size="sm" onClick={clear} className="text-destructive">
              <Trash2 className="w-4 h-4 mr-1" />
              {isRu ? 'Очистить' : 'Clear'}
            </Button>
          )}
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <GitCompareArrows className="w-12 h-12 mb-3 opacity-30" />
            <p>{isRu ? 'Добавьте объекты для сравнения' : 'Add properties to compare'}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px]">
              {/* Property headers with images */}
              <thead>
                <tr>
                  <th className="w-28 sm:w-36" />
                  {items.map(p => (
                    <th key={p.id} className="p-2 text-left align-top">
                      <div className="relative">
                        <button
                          onClick={() => remove(p.id)}
                          className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-destructive/10 text-destructive flex items-center justify-center hover:bg-destructive/20 z-10"
                        >
                          <X className="w-3 h-3" />
                        </button>
                        <div
                          className="cursor-pointer"
                          onClick={() => { onOpenChange(false); navigate(`/property/${p.id}`); }}
                        >
                          {p.cover_image && (
                            <img src={p.cover_image} alt="" className="w-full aspect-[4/3] rounded-lg object-cover mb-2" />
                          )}
                          <p className="font-semibold text-sm line-clamp-2 text-foreground">
                            {isRu ? (p.title_ru || p.title_en) : p.title_en}
                          </p>
                        </div>
                      </div>
                    </th>
                  ))}
                  {items.length < MAX_COMPARE && (
                    <th className="p-2 align-top">
                      <div
                        className="aspect-[4/3] rounded-lg border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:border-primary/50 transition-colors"
                        onClick={() => { onOpenChange(false); navigate('/property'); }}
                      >
                        <div className="text-center text-muted-foreground">
                          <Plus className="w-6 h-6 mx-auto mb-1" />
                          <span className="text-xs">{isRu ? 'Добавить' : 'Add'}</span>
                        </div>
                      </div>
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {specs.map(spec => (
                  <tr key={spec.key} className="border-t border-border/50">
                    <td className="py-3 px-2 text-sm font-medium text-muted-foreground whitespace-nowrap">
                      {spec.label}
                    </td>
                    {items.map(p => (
                      <td key={p.id} className="py-3 px-2 text-sm text-foreground">
                        {spec.render(p)}
                      </td>
                    ))}
                    {items.length < MAX_COMPARE && <td />}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

/** Button to add/remove property from compare list */
export function CompareButton({ property, variant = 'ghost', size = 'sm', className }: {
  property: CompareProperty;
  variant?: 'ghost' | 'outline' | 'default';
  size?: 'sm' | 'default';
  className?: string;
}) {
  const { add, remove, isInCompare } = usePropertyCompare();
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const inCompare = isInCompare(property.id);

  return (
    <Button
      variant={inCompare ? 'default' : variant}
      size={size}
      className={cn("gap-1.5", className)}
      onClick={(e) => {
        e.stopPropagation();
        inCompare ? remove(property.id) : add(property);
      }}
    >
      <GitCompareArrows className="w-4 h-4" />
      <span className="hidden sm:inline">
        {inCompare ? (isRu ? 'В сравнении' : 'Comparing') : (isRu ? 'Сравнить' : 'Compare')}
      </span>
    </Button>
  );
}
