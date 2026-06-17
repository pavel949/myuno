import { useEffect, useRef, useState } from 'react';
import { Search, Loader2, X, MapPin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export interface MapSearchResult {
  id: string;
  label: string;
  sublabel?: string;
  lat: number;
  lng: number;
  source: 'local' | 'osm';
}

interface MapSearchBoxProps {
  onSelect: (result: MapSearchResult) => void;
  language?: 'ru' | 'en';
  className?: string;
}

// Phuket bbox (south,west,north,east) for Nominatim viewbox bias
const PHUKET_VIEWBOX = '98.20,7.70,98.55,8.25';

export function MapSearchBox({ onSelect, language = 'ru', className }: MapSearchBoxProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<MapSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Close on outside click
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  // Debounced search
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const timer = setTimeout(async () => {
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      try {
        const [local, remote] = await Promise.all([
          searchLocal(q),
          searchNominatim(q, ctrl.signal),
        ]);
        // Dedup: prefer local POIs by name
        const seen = new Set<string>();
        const merged: MapSearchResult[] = [];
        [...local, ...remote].forEach((r) => {
          const key = `${r.lat.toFixed(4)}|${r.lng.toFixed(4)}|${r.label.toLowerCase()}`;
          if (seen.has(key)) return;
          seen.add(key);
          merged.push(r);
        });
        setResults(merged.slice(0, 8));
        setOpen(true);
      } catch (err) {
        if ((err as Error).name !== 'AbortError') console.warn('search error', err);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  const handlePick = (r: MapSearchResult) => {
    setQuery(r.label);
    setOpen(false);
    onSelect(r);
  };

  const placeholder = language === 'ru' ? 'Поиск адреса или места…' : 'Search address or place…';
  const emptyText = language === 'ru' ? 'Ничего не найдено' : 'No results';

  return (
    <div ref={containerRef} className={`relative ${className ?? ''}`}>
      <div className="relative flex items-center">
        <Search className="absolute left-3 w-4 h-4 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          inputMode="search"
          autoComplete="off"
          spellCheck={false}
          value={query}
          onChange={(e) => setQuery(e.target.value.slice(0, 120))}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder={placeholder}
          aria-label={placeholder}
          className="w-full h-10 pl-9 pr-9 rounded-md bg-card border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
        {loading ? (
          <Loader2 className="absolute right-3 w-4 h-4 animate-spin text-muted-foreground" />
        ) : query ? (
          <button
            type="button"
            onClick={() => { setQuery(''); setResults([]); setOpen(false); }}
            aria-label="Clear"
            className="absolute right-2 p-1 rounded hover:bg-muted"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        ) : null}
      </div>

      {open && (
        <div className="absolute left-0 right-0 mt-1 bg-card border border-border rounded-md shadow-xl z-30 max-h-80 overflow-y-auto">
          {results.length === 0 && !loading ? (
            <div className="px-3 py-2 text-xs text-muted-foreground">{emptyText}</div>
          ) : (
            <ul role="listbox">
              {results.map((r) => (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => handlePick(r)}
                    className="w-full text-left px-3 py-2 flex items-start gap-2 hover:bg-muted focus:bg-muted focus:outline-none"
                  >
                    <MapPin className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm text-foreground truncate">{r.label}</span>
                      {r.sublabel && (
                        <span className="block text-[11px] text-muted-foreground truncate">{r.sublabel}</span>
                      )}
                    </span>
                    <span className="text-[10px] uppercase text-muted-foreground/70 shrink-0 mt-1">
                      {r.source === 'local' ? 'POI' : 'OSM'}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

async function searchLocal(q: string): Promise<MapSearchResult[]> {
  const pattern = `%${q.replace(/[%_]/g, (m) => `\\${m}`)}%`;
  const { data, error } = await supabase
    .from('phuket_osm_pois')
    .select('id, name_en, name_ru, name_th, category, subcategory, lat, lng')
    .or(`name_en.ilike.${pattern},name_ru.ilike.${pattern},name_th.ilike.${pattern}`)
    .not('lat', 'is', null)
    .not('lng', 'is', null)
    .limit(6);
  if (error || !data) return [];
  return data.map((p: any) => ({
    id: `local:${p.id}`,
    label: p.name_en || p.name_ru || p.name_th || 'POI',
    sublabel: [p.category, p.subcategory].filter(Boolean).join(' · '),
    lat: Number(p.lat),
    lng: Number(p.lng),
    source: 'local' as const,
  }));
}

async function searchNominatim(q: string, signal: AbortSignal): Promise<MapSearchResult[]> {
  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.searchParams.set('q', q);
  url.searchParams.set('format', 'json');
  url.searchParams.set('limit', '6');
  url.searchParams.set('viewbox', PHUKET_VIEWBOX);
  url.searchParams.set('bounded', '1');
  url.searchParams.set('addressdetails', '1');
  try {
    const res = await fetch(url.toString(), {
      signal,
      headers: { 'Accept-Language': 'ru,en' },
    });
    if (!res.ok) return [];
    const json = (await res.json()) as Array<any>;
    return json.map((it) => ({
      id: `osm:${it.osm_type}:${it.osm_id}`,
      label: it.display_name?.split(',').slice(0, 2).join(',') ?? it.display_name ?? q,
      sublabel: it.display_name,
      lat: parseFloat(it.lat),
      lng: parseFloat(it.lon),
      source: 'osm' as const,
    }));
  } catch {
    return [];
  }
}
