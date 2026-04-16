import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { Building2, X, Bed, MapPin } from 'lucide-react';

export interface PropertySearchResult {
  id: string;
  title_en: string | null;
  title_ru: string | null;
  property_type: string | null;
  district: string | null;
  bedrooms: number | null;
  price_thb: number | null;
  size_sqm: number | null;
  cover_image_url: string | null;
}

function usePropertySearch(companyId: string, query: string) {
  return useQuery({
    queryKey: ['property-search', companyId, query],
    queryFn: async () => {
      if (!query || query.length < 2) return [];
      const { data, error } = await supabase
        .from('properties')
        .select('id, title_en, title_ru, property_type, district, bedrooms, price_thb, size_sqm, cover_image_url')
        .eq('management_company_id', companyId)
        .or(`title_en.ilike.%${query}%,title_ru.ilike.%${query}%,district.ilike.%${query}%,address_line1.ilike.%${query}%`)
        .limit(8);
      if (error) throw error;
      return (data || []) as PropertySearchResult[];
    },
    enabled: !!companyId && query.length >= 2,
  });
}

interface Props {
  companyId: string;
  onSelect: (property: PropertySearchResult) => void;
  onClear: () => void;
  selectedProperty: PropertySearchResult | null;
  isRu: boolean;
}

function formatPrice(price: number | null) {
  if (!price) return null;
  if (price >= 1_000_000) return `${(price / 1_000_000).toFixed(1)}M`;
  if (price >= 1_000) return `${(price / 1_000).toFixed(0)}K`;
  return String(price);
}

export function PropertySearchInput({ companyId, onSelect, onClear, selectedProperty, isRu }: Props) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { data: results = [] } = usePropertySearch(companyId, query);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (selectedProperty) {
    return (
      <div className="flex items-center gap-2 p-2 rounded-lg border bg-primary/5">
        {selectedProperty.cover_image_url ? (
          <img src={selectedProperty.cover_image_url} alt="" className="w-8 h-8 rounded object-cover shrink-0" />
        ) : (
          <Building2 className="h-4 w-4 text-primary shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <span className="text-sm font-medium truncate block">
            {isRu ? selectedProperty.title_ru || selectedProperty.title_en : selectedProperty.title_en || selectedProperty.title_ru}
          </span>
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
            {selectedProperty.district && <span>{selectedProperty.district}</span>}
            {selectedProperty.bedrooms && <span>{selectedProperty.bedrooms} BD</span>}
            {selectedProperty.price_thb && <span>฿{formatPrice(selectedProperty.price_thb)}</span>}
          </div>
        </div>
        <button onClick={onClear} className="p-0.5 rounded hover:bg-muted"><X className="h-3.5 w-3.5" /></button>
      </div>
    );
  }

  return (
    <div ref={ref} className="relative">
      <Input
        placeholder={isRu ? 'Поиск объекта: название, район...' : 'Search property: title, district...'}
        value={query}
        onChange={e => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => query.length >= 2 && setOpen(true)}
      />
      {open && results.length > 0 && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-popover border rounded-lg shadow-lg max-h-56 overflow-y-auto">
          {results.map(p => (
            <button
              key={p.id}
              onClick={() => { onSelect(p); setQuery(''); setOpen(false); }}
              className="w-full text-left px-3 py-2 hover:bg-accent text-sm flex items-center gap-2"
            >
              {p.cover_image_url ? (
                <img src={p.cover_image_url} alt="" className="w-8 h-8 rounded object-cover shrink-0" />
              ) : (
                <div className="w-8 h-8 rounded bg-muted flex items-center justify-center shrink-0">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <span className="font-medium truncate block">
                  {isRu ? p.title_ru || p.title_en : p.title_en || p.title_ru}
                </span>
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                  {p.property_type && <Badge variant="outline" className="text-[9px] h-4 px-1">{p.property_type}</Badge>}
                  {p.district && <span className="flex items-center gap-0.5"><MapPin className="h-2.5 w-2.5" />{p.district}</span>}
                  {p.bedrooms && <span className="flex items-center gap-0.5"><Bed className="h-2.5 w-2.5" />{p.bedrooms}</span>}
                  {p.price_thb && <span>฿{formatPrice(p.price_thb)}</span>}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
