import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { Building2, X, Bed, MapPin, Layers } from 'lucide-react';

export interface PropertySearchResult {
  id: string;
  title_en: string | null;
  title_ru: string | null;
  property_type: string | null;
  district: string | null;
  bedrooms: number | null;
  price: number | null;
  plot_size_sqm: number | null;
  cover_image: string | null;
  // project fields (when result is a project)
  is_project?: boolean;
  project_status?: string;
}

function usePropertySearch(companyId: string, query: string, includeProjects: boolean) {
  return useQuery({
    queryKey: ['property-search', companyId, query, includeProjects],
    queryFn: async () => {
      if (!query || query.length < 2) return [];
      const term = `%${query}%`;

      // Search properties
      const propPromise = supabase
        .from('properties')
        .select('id, title_en, title_ru, property_type, district, bedrooms, price, plot_size_sqm, cover_image')
        .eq('management_company_id', companyId)
        .or(`title_en.ilike.${term},title_ru.ilike.${term},district.ilike.${term},address_line1.ilike.${term}`)
        .limit(6);

      if (!includeProjects) {
        const { data, error } = await propPromise;
        if (error) throw error;
        return (data || []).map(p => ({ ...p, is_project: false })) as PropertySearchResult[];
      }

      // Also search projects
      const projPromise = supabase
        .from('property_projects')
        .select('id, name_en, name_ru, district, cover_image, price_from, project_status, location_area')
        .or(`name_en.ilike.${term},name_ru.ilike.${term},district.ilike.${term},location_area.ilike.${term}`)
        .limit(4);

      const [propRes, projRes] = await Promise.all([propPromise, projPromise]);
      if (propRes.error) throw propRes.error;
      if (projRes.error) throw projRes.error;

      const properties = (propRes.data || []).map(p => ({ ...p, is_project: false } as PropertySearchResult));
      const projects = (projRes.data || []).map((p: any) => ({
        id: p.id,
        title_en: p.name_en,
        title_ru: p.name_ru,
        property_type: 'project',
        district: p.district || p.location_area,
        bedrooms: null,
        price: p.price_from,
        plot_size_sqm: null,
        cover_image: p.cover_image,
        is_project: true,
        project_status: p.project_status,
      } as PropertySearchResult));

      return [...projects, ...properties];
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
  includeProjects?: boolean;
}

function formatPrice(price: number | null) {
  if (!price) return null;
  if (price >= 1_000_000) return `${(price / 1_000_000).toFixed(1)}M`;
  if (price >= 1_000) return `${(price / 1_000).toFixed(0)}K`;
  return String(price);
}

export function PropertySearchInput({ companyId, onSelect, onClear, selectedProperty, isRu, includeProjects = false }: Props) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { data: results = [] } = usePropertySearch(companyId, query, includeProjects);

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
        {selectedProperty.cover_image ? (
          <img src={selectedProperty.cover_image} alt="" className="w-8 h-8 rounded object-cover shrink-0" />
        ) : (
          <Building2 className="h-4 w-4 text-primary shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            {selectedProperty.is_project && <Layers className="h-3 w-3 text-primary shrink-0" />}
            <span className="text-sm font-medium truncate block">
              {isRu ? selectedProperty.title_ru || selectedProperty.title_en : selectedProperty.title_en || selectedProperty.title_ru}
            </span>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
            {selectedProperty.is_project && <Badge variant="outline" className="text-[8px] h-3.5 px-1">Project</Badge>}
            {selectedProperty.district && <span>{selectedProperty.district}</span>}
            {selectedProperty.bedrooms && <span>{selectedProperty.bedrooms} BD</span>}
            {selectedProperty.price && <span>฿{formatPrice(selectedProperty.price)}</span>}
          </div>
        </div>
        <button onClick={onClear} className="p-0.5 rounded hover:bg-muted"><X className="h-3.5 w-3.5" /></button>
      </div>
    );
  }

  return (
    <div ref={ref} className="relative">
      <Input
        placeholder={isRu
          ? (includeProjects ? 'Поиск объекта или проекта...' : 'Поиск объекта: название, район...')
          : (includeProjects ? 'Search property or project...' : 'Search property: title, district...')}
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
              {p.cover_image ? (
                <img src={p.cover_image} alt="" className="w-8 h-8 rounded object-cover shrink-0" />
              ) : (
                <div className="w-8 h-8 rounded bg-muted flex items-center justify-center shrink-0">
                  {p.is_project ? <Layers className="h-4 w-4 text-muted-foreground" /> : <Building2 className="h-4 w-4 text-muted-foreground" />}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <span className="font-medium truncate block">
                    {isRu ? p.title_ru || p.title_en : p.title_en || p.title_ru}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                  {p.is_project && <Badge variant="outline" className="text-[9px] h-4 px-1">Project</Badge>}
                  {p.property_type && !p.is_project && <Badge variant="outline" className="text-[9px] h-4 px-1">{p.property_type}</Badge>}
                  {p.district && <span className="flex items-center gap-0.5"><MapPin className="h-2.5 w-2.5" />{p.district}</span>}
                  {p.bedrooms && <span className="flex items-center gap-0.5"><Bed className="h-2.5 w-2.5" />{p.bedrooms}</span>}
                  {p.price && <span>฿{formatPrice(p.price)}</span>}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
