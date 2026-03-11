import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePropertyProjects } from '@/hooks/usePropertyProjects';
import { useGoogleGeocode } from '@/hooks/useGoogleGeocode';
import { MapPin, Building2, Search, Loader2, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { PropertyProject } from '@/hooks/usePropertyProjects';
import type { PropertyFormData } from '@/hooks/usePropertyWizard';

interface LocationProjectSearchProps {
  formData: PropertyFormData;
  updateFormData: (updates: Partial<PropertyFormData>) => void;
  selectedProject: PropertyProject | null;
  setSelectedProject: (p: PropertyProject | null) => void;
  className?: string;
}

export function LocationProjectSearch({
  formData,
  updateFormData,
  selectedProject,
  setSelectedProject,
  className,
}: LocationProjectSearchProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { data: projects = [] } = usePropertyProjects();
  const { searchAddress, isReady: mapsReady } = useGoogleGeocode(language);

  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const [addressResults, setAddressResults] = useState<Array<{ address: string; lat: number; lng: number }>>([]);
  const [searching, setSearching] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const matchingProjects = useMemo(() => {
    if (!query.trim() || query.length < 2) return [];
    const q = query.toLowerCase();
    return projects.filter(
      (p) =>
        (p.name_en?.toLowerCase().includes(q) ||
          p.name_ru?.toLowerCase().includes(q) ||
          p.address?.toLowerCase().includes(q) ||
          p.district?.toLowerCase().includes(q)) &&
        p.lat != null &&
        p.lng != null
    );
  }, [projects, query]);

  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setAddressResults([]);
      setSearching(false);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const results = await searchAddress(query, { country: 'TH' });
        setAddressResults(results.slice(0, 5));
      } catch {
        setAddressResults([]);
      } finally {
        setSearching(false);
      }
    }, 280);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, searchAddress]);

  const showDropdown = focused && query.length >= 2;

  const selectProject = (p: PropertyProject) => {
    setSelectedProject(p);
    updateFormData({
      project_id: p.id,
      address: p.address || formData.address,
      district: p.district || formData.district,
      lat: p.lat,
      lng: p.lng,
    });
    setQuery('');
    setFocused(false);
  };

  const selectAddress = (r: { address: string; lat: number; lng: number }) => {
    setSelectedProject(null);
    updateFormData({
      project_id: undefined,
      address: r.address,
      lat: r.lat,
      lng: r.lng,
    });
    setQuery('');
    setFocused(false);
  };

  const clearSelection = () => {
    setSelectedProject(null);
    updateFormData({ project_id: undefined });
    setQuery('');
  };

  const displayValue = selectedProject
    ? (isRu ? selectedProject.name_ru : selectedProject.name_en) + (selectedProject.address ? ` · ${selectedProject.address}` : '')
    : formData.address || '';

  return (
    <Card className={cn('', className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          {isRu ? 'Где находится объект?' : 'Where is your listing?'}
        </CardTitle>
        <p className="text-xs text-muted-foreground mt-0.5">
          {isRu
            ? 'Начните вводить адрес или название проекта — выберите из списка, адрес и точка на карте подставятся сами.'
            : 'Start typing address or project name — pick from the list and address + map pin will be set.'}
        </p>
      </CardHeader>
      <CardContent className="relative" ref={containerRef}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            value={focused ? query : displayValue}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 180)}
            placeholder={isRu ? 'Адрес или название проекта...' : 'Address or project name...'}
            className="pl-10 pr-10 h-11 text-base"
          />
          {(selectedProject || (formData.address && formData.lat && formData.lng)) && !focused && (
            <button
              type="button"
              onClick={clearSelection}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md hover:bg-muted text-muted-foreground"
              aria-label={isRu ? 'Очистить' : 'Clear'}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {showDropdown && (
          <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-popover border border-border rounded-lg shadow-lg max-h-[320px] overflow-y-auto">
            {!mapsReady && (
              <div className="p-3 flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                {isRu ? 'Загрузка карты…' : 'Loading map…'}
              </div>
            )}
            {mapsReady && searching && (
              <div className="p-3 flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                {isRu ? 'Поиск...' : 'Searching...'}
              </div>
            )}
            {mapsReady && !searching && matchingProjects.length > 0 && (
              <div className="py-1">
                <p className="px-3 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {isRu ? 'Проекты / ЖК' : 'Projects'}
                </p>
                {matchingProjects.slice(0, 5).map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className="w-full px-3 py-2.5 flex items-center gap-3 text-left hover:bg-muted transition-colors"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      selectProject(p);
                    }}
                  >
                    {p.cover_image ? (
                      <img src={p.cover_image} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">{isRu ? p.name_ru : p.name_en}</p>
                      {(p.address || p.district) && (
                        <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                          <MapPin className="h-3 w-3 shrink-0" />
                          {[p.district, p.address].filter(Boolean).join(' · ')}
                        </p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
            {mapsReady && !searching && addressResults.length > 0 && (
              <div className="py-1">
                <p className="px-3 py-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {isRu ? 'Адреса' : 'Addresses'}
                </p>
                {addressResults.map((r, i) => (
                  <button
                    key={i}
                    type="button"
                    className="w-full px-3 py-2.5 flex items-center gap-2 text-left hover:bg-muted transition-colors"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      selectAddress(r);
                    }}
                  >
                    <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                    <p className="text-sm truncate">{r.address}</p>
                  </button>
                ))}
              </div>
            )}
            {mapsReady && !searching && matchingProjects.length === 0 && addressResults.length === 0 && query.length >= 2 && (
              <p className="px-3 py-3 text-sm text-muted-foreground">
                {isRu ? 'Ничего не найдено. Введите адрес или название проекта.' : 'No results. Try address or project name.'}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
