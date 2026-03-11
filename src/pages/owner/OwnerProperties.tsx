import { useState, useMemo, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { useMyProperties, type UnifiedProperty } from '@/hooks/useMyProperties';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { BackButton } from '@/components/uno/BackButton';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { PropertyCard, PropertyCardSkeleton } from '@/components/property/PropertyCard';
import { PropertyMapView } from '@/components/property/PropertyMapView';
import {
  Home, Plus, Download, Building2, Search, X, Filter, Map, List,
  CheckSquare, Trash2, ToggleLeft, ToggleRight, FileSpreadsheet, FolderSync, XCircle,
  ChevronDown, ChevronRight, Archive,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { motion, AnimatePresence } from 'framer-motion';

/** Fetch complex & project names for filter labels */
function usePropertyLookups(complexIds: string[], projectIds: string[]) {
  const complexQuery = useQuery({
    queryKey: ['property-complexes-lookup', complexIds],
    queryFn: async () => {
      if (!complexIds.length) return {};
      const { data } = await supabase
        .from('property_complexes')
        .select('id, name, name_ru')
        .in('id', complexIds);
      const map: Record<string, { name: string; name_ru: string | null }> = {};
      (data || []).forEach(c => { map[c.id] = { name: c.name, name_ru: c.name_ru }; });
      return map;
    },
    enabled: complexIds.length > 0,
  });

  const projectQuery = useQuery({
    queryKey: ['property-projects-lookup', projectIds],
    queryFn: async () => {
      if (!projectIds.length) return {};
      const { data } = await supabase
        .from('property_projects')
        .select('id, name_en, name_ru')
        .in('id', projectIds);
      const map: Record<string, { name_en: string; name_ru: string }> = {};
      (data || []).forEach(p => { map[p.id] = { name_en: p.name_en, name_ru: p.name_ru }; });
      return map;
    },
    enabled: projectIds.length > 0,
  });

  return {
    complexNames: complexQuery.data || {},
    projectNames: projectQuery.data || {},
  };
}

/** Fetch all complexes and projects for reassignment */
function useAllComplexesAndProjects() {
  const complexes = useQuery({
    queryKey: ['all-complexes-for-bulk'],
    queryFn: async () => {
      const { data } = await supabase
        .from('property_complexes')
        .select('id, name, name_ru')
        .order('name');
      return data || [];
    },
  });

  const projects = useQuery({
    queryKey: ['all-projects-for-bulk'],
    queryFn: async () => {
      const { data } = await supabase
        .from('property_projects')
        .select('id, name_en, name_ru')
        .order('name_en');
      return data || [];
    },
  });

  return {
    complexes: complexes.data || [],
    projects: projects.data || [],
  };
}

export default function OwnerProperties() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isRu = language === 'ru';
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  // Filters
  const [searchId, setSearchId] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [selectedComplex, setSelectedComplex] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(true);

  // Bulk selection
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkReassignOpen, setBulkReassignOpen] = useState(false);
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [hoveredPropertyId, setHoveredPropertyId] = useState<string | null>(null);
  const [reassignType, setReassignType] = useState<'complex' | 'project'>('complex');
  const [reassignTargetId, setReassignTargetId] = useState<string>('');
  const [showInactiveSection, setShowInactiveSection] = useState(true);

  const { allProperties, isLoading } = useMyProperties();
  const activeOnly = useMemo(() => (allProperties || []).filter((p) => p.is_active), [allProperties]);

  // Extract unique filter values
  const { districts, complexIds, projectIds, propertyTypes } = useMemo(() => {
    const dists = new Set<string>();
    const compIds = new Set<string>();
    const projIds = new Set<string>();
    const types = new Set<string>();
    activeOnly.forEach(p => {
      if (p.district) dists.add(p.district);
      if (p.complex_id) compIds.add(p.complex_id);
      if (p.project_id) projIds.add(p.project_id);
      if (p.property_type) types.add(p.property_type);
    });
    return {
      districts: Array.from(dists).sort(),
      complexIds: Array.from(compIds),
      projectIds: Array.from(projIds),
      propertyTypes: Array.from(types).sort(),
    };
  }, [activeOnly]);

  const { complexNames, projectNames } = usePropertyLookups(complexIds, projectIds);

  // Apply filters (search, district, type, etc.)
  const filteredProperties = useMemo(() => {
    if (!allProperties) return [];
    return allProperties.filter(p => {
      if (searchId && !p.property_id.toLowerCase().includes(searchId.toLowerCase()) && !p.title.toLowerCase().includes(searchId.toLowerCase())) return false;
      if (selectedDistrict && p.district !== selectedDistrict) return false;
      if (selectedComplex && p.complex_id !== selectedComplex) return false;
      if (selectedProject && p.project_id !== selectedProject) return false;
      if (selectedType && p.property_type !== selectedType) return false;
      return true;
    });
  }, [allProperties, searchId, selectedDistrict, selectedComplex, selectedProject, selectedType]);

  // Split: active (main list) and inactive (separate "archived" section)
  const activeProperties = useMemo(() => filteredProperties.filter(p => p.is_active), [filteredProperties]);
  const inactiveProperties = useMemo(() => filteredProperties.filter(p => !p.is_active), [filteredProperties]);

  const hasActiveFilters = !!(searchId || selectedDistrict || selectedComplex || selectedProject || selectedType);

  const clearFilters = () => {
    setSearchId('');
    setSelectedDistrict(null);
    setSelectedComplex(null);
    setSelectedProject(null);
    setSelectedType(null);
  };

  // --- Selection helpers ---
  const toggleSelection = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (selectedIds.size === activeProperties.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(activeProperties.map(p => p.property_id)));
    }
  }, [activeProperties, selectedIds.size]);

  const exitSelectionMode = () => {
    setSelectionMode(false);
    setSelectedIds(new Set());
  };

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['owner-properties'] });
    queryClient.invalidateQueries({ queryKey: ['assigned-properties'] });
    queryClient.invalidateQueries({ queryKey: ['company-properties'] });
    queryClient.invalidateQueries({ queryKey: ['properties'] });
  };

  // --- Bulk handlers ---
  const handleBulkToggleActive = async (activate: boolean) => {
    setBulkProcessing(true);
    const ids = Array.from(selectedIds);
    const { error } = await supabase.from('properties').update({ is_active: activate }).in('id', ids);
    setBulkProcessing(false);
    if (error) {
      toast({ title: isRu ? 'Ошибка' : 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: isRu ? `${ids.length} объектов ${activate ? 'активированы' : 'деактивированы'}` : `${ids.length} properties ${activate ? 'activated' : 'deactivated'}` });
      invalidateAll();
      exitSelectionMode();
    }
  };

  const handleBulkDelete = async () => {
    setBulkProcessing(true);
    const ids = Array.from(selectedIds);
    const { error } = await supabase
      .from('properties')
      .update({ deleted_at: new Date().toISOString(), deleted_by: user?.id ?? null, is_active: false } as Record<string, unknown>)
      .in('id', ids);
    setBulkProcessing(false);
    setBulkDeleteOpen(false);
    if (error) {
      toast({ title: isRu ? 'Ошибка удаления' : 'Delete failed', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: isRu ? `${ids.length} объектов удалено` : `${ids.length} properties deleted` });
      invalidateAll();
      exitSelectionMode();
    }
  };

  const handleBulkReassign = async () => {
    if (!reassignTargetId) return;
    setBulkProcessing(true);
    const ids = Array.from(selectedIds);
    const updatePayload = reassignType === 'complex'
      ? { complex_id: reassignTargetId }
      : { project_id: reassignTargetId };
    const { error } = await supabase.from('properties').update(updatePayload).in('id', ids);
    setBulkProcessing(false);
    setBulkReassignOpen(false);
    setReassignTargetId('');
    if (error) {
      toast({ title: isRu ? 'Ошибка' : 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: isRu ? `${ids.length} объектов обновлено` : `${ids.length} properties updated` });
      invalidateAll();
      queryClient.invalidateQueries({ queryKey: ['property-complexes-lookup'] });
      queryClient.invalidateQueries({ queryKey: ['property-projects-lookup'] });
      exitSelectionMode();
    }
  };

  const handleBulkExport = () => {
    const selected = filteredProperties.filter(p => selectedIds.has(p.property_id));
    const rows = selected.map(p => ({
      ID: p.property_id,
      Title: p.title,
      'Title RU': p.title_ru,
      District: p.district || '',
      Type: p.property_type || '',
      Bedrooms: p.bedrooms ?? '',
      Bathrooms: p.bathrooms ?? '',
      'Price/Night': p.price_per_night ?? '',
      Currency: p.currency,
      Active: p.is_active ? 'Yes' : 'No',
      Source: p.source,
    }));

    const headers = Object.keys(rows[0] || {});
    const csvContent = [
      headers.join(','),
      ...rows.map(row => headers.map(h => {
        const val = String((row as Record<string, unknown>)[h] ?? '');
        return val.includes(',') ? `"${val}"` : val;
      }).join(',')),
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `properties_export_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast({ title: isRu ? `Экспорт ${selected.length} объектов` : `Exported ${selected.length} properties` });
  };

  // --- Single handlers ---
  const handleView = (id: string) => navigate(`/mc/properties/${id}`);
  const handleEdit = (id: string) => navigate(`/mc/properties/${id}/editor`);
  const handleDuplicate = (id: string) => navigate(`/mc/properties/new?cloneFrom=${id}`);

  const handleToggleActive = async (id: string, activate: boolean) => {
    const { error } = await supabase.from('properties').update({ is_active: activate }).eq('id', id);
    if (error) {
      toast({ title: isRu ? 'Ошибка' : 'Error', variant: 'destructive' });
    } else {
      toast({ title: activate ? (isRu ? 'Объект активирован' : 'Property activated') : (isRu ? 'Объект деактивирован' : 'Property deactivated') });
      invalidateAll();
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const { error } = await supabase
      .from('properties')
      .update({ deleted_at: new Date().toISOString(), deleted_by: user?.id ?? null, is_active: false } as Record<string, unknown>)
      .eq('id', deleteTarget);
    if (error) {
      toast({ title: isRu ? 'Ошибка удаления' : 'Delete failed', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: isRu ? 'Объект удалён' : 'Property deleted' });
      invalidateAll();
    }
    setDeleteTarget(null);
  };

  return (
    <PageContainer>
      <BackButton />
      <PageHeader
        title={isRu ? 'Мои объекты' : 'My Properties'}
        subtitle={isRu ? 'Управление недвижимостью' : 'Property management'}
      />

      {/* Workspace badge */}
      <div className="flex items-center gap-2 mb-4">
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/8 text-primary">
          <Building2 className="h-4 w-4" />
          <span className="text-sm font-medium">{isRu ? 'Рабочее место УК' : 'MC Workspace'}</span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <Button className="flex-1 min-w-0" onClick={() => navigate('/mc/properties/new')}>
          <Plus className="h-4 w-4 mr-2" />
          {isRu ? 'Добавить объект' : 'Add Property'}
        </Button>
        <Button variant="outline" onClick={() => navigate('/mc/properties/import')}>
          <Download className="h-4 w-4 mr-2" />
          {isRu ? 'Импорт' : 'Import'}
        </Button>
        {allProperties && allProperties.length > 0 && (
          <>
            <Button
              variant={selectionMode ? 'default' : 'outline'}
              onClick={() => selectionMode ? exitSelectionMode() : setSelectionMode(true)}
            >
              <CheckSquare className="h-4 w-4 mr-2" />
              {selectionMode ? (isRu ? 'Отмена' : 'Cancel') : (isRu ? 'Выбрать' : 'Select')}
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 shrink-0"
              onClick={() => setViewMode(viewMode === 'list' ? 'map' : 'list')}
            >
              {viewMode === 'list' ? <Map className="h-4 w-4" /> : <List className="h-4 w-4" />}
            </Button>
          </>
        )}
      </div>

      {/* Filters */}
      {allProperties && allProperties.length > 0 && (
        <div className="mb-4 space-y-3">
          {/* Search + toggle */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={isRu ? 'Поиск по ID или названию...' : 'Search by ID or name...'}
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                className="pl-9 h-9"
              />
              {searchId && (
                <button onClick={() => setSearchId('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                  <X className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              )}
            </div>
            <Button
              variant={showFilters ? 'default' : 'outline'}
              size="icon"
              className="h-9 w-9 shrink-0"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4" />
            </Button>
          </div>

          {showFilters && (
            <div className="space-y-2">
              {districts.length > 0 && (
                <FilterRow label={isRu ? 'Район' : 'District'}>
                  {districts.map(d => (
                    <FilterChip key={d} label={d} active={selectedDistrict === d} onClick={() => setSelectedDistrict(selectedDistrict === d ? null : d)} />
                  ))}
                </FilterRow>
              )}
              {propertyTypes.length > 0 && (
                <FilterRow label={isRu ? 'Тип' : 'Type'}>
                  {propertyTypes.map(t => (
                    <FilterChip key={t} label={t} active={selectedType === t} onClick={() => setSelectedType(selectedType === t ? null : t)} />
                  ))}
                </FilterRow>
              )}
              {complexIds.length > 0 && (
                <FilterRow label={isRu ? 'Комплекс' : 'Complex'}>
                  {complexIds.map(id => {
                    const info = complexNames[id];
                    const label = info ? (isRu && info.name_ru ? info.name_ru : info.name) : id.slice(0, 8);
                    return <FilterChip key={id} label={label} active={selectedComplex === id} onClick={() => setSelectedComplex(selectedComplex === id ? null : id)} />;
                  })}
                </FilterRow>
              )}
              {projectIds.length > 0 && (
                <FilterRow label={isRu ? 'Проект' : 'Project'}>
                  {projectIds.map(id => {
                    const info = projectNames[id];
                    const label = info ? (isRu ? info.name_ru : info.name_en) : id.slice(0, 8);
                    return <FilterChip key={id} label={label} active={selectedProject === id} onClick={() => setSelectedProject(selectedProject === id ? null : id)} />;
                  })}
                </FilterRow>
              )}
              {hasActiveFilters && (
                <button onClick={clearFilters} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                  <X className="h-3 w-3" />
                  {isRu ? 'Сбросить фильтры' : 'Clear filters'}
                </button>
              )}
            </div>
          )}

          {hasActiveFilters && (
            <p className="text-xs text-muted-foreground">
              {isRu ? `Найдено: ${activeProperties.length} активных, ${inactiveProperties.length} неактивных` : `Found: ${activeProperties.length} active, ${inactiveProperties.length} inactive`}
            </p>
          )}
        </div>
      )}

      {/* Select all row (active list only) */}
      {selectionMode && activeProperties.length > 0 && (
        <div className="flex items-center gap-3 mb-3 px-1">
          <Checkbox
            checked={selectedIds.size === activeProperties.length && activeProperties.length > 0}
            onCheckedChange={toggleSelectAll}
          />
          <span className="text-sm text-muted-foreground">
            {selectedIds.size > 0
              ? (isRu ? `Выбрано: ${selectedIds.size}` : `Selected: ${selectedIds.size}`)
              : (isRu ? 'Выбрать все активные' : 'Select all active')}
          </span>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <PropertyCardSkeleton key={i} variant="list" />
          ))}
        </div>
      ) : !allProperties?.length ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Home className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {isRu ? 'Нет объектов' : 'No Properties'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {isRu ? 'Добавьте вашу первую недвижимость для управления' : 'Add your first property to manage'}
            </p>
            <Button onClick={() => navigate('/mc/properties/new')}>
              <Plus className="h-4 w-4 mr-2" />
              {isRu ? 'Добавить' : 'Add Property'}
            </Button>
          </CardContent>
        </Card>
      ) : filteredProperties.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Search className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">
              {isRu ? 'Ничего не найдено' : 'No properties match your filters'}
            </p>
            <Button variant="link" onClick={clearFilters} className="mt-2">
              {isRu ? 'Сбросить фильтры' : 'Clear filters'}
            </Button>
          </CardContent>
        </Card>
      ) : viewMode === 'map' ? (
        <div className="space-y-4 pb-20">
          <PropertyMapView
            properties={activeProperties.map(p => ({
              id: p.property_id,
              lat: p.lat,
              lng: p.lng,
              price: p.price_per_night ?? 0,
              title_en: p.title,
            })) as any}
            hoveredProperty={hoveredPropertyId}
            onHover={setHoveredPropertyId}
            mode="rent"
            className="h-[500px] lg:h-[600px]"
          />
          {activeProperties.filter(p => !p.lat || !p.lng).length > 0 && (
            <p className="text-xs text-muted-foreground text-center">
              {isRu
                ? `${activeProperties.filter(p => !p.lat || !p.lng).length} объектов без координат — не отображаются на карте`
                : `${activeProperties.filter(p => !p.lat || !p.lng).length} properties without coordinates — not shown on map`}
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-4 pb-20">
          {activeProperties.length === 0 && inactiveProperties.length > 0 && (
            <p className="text-sm text-muted-foreground">
              {isRu ? 'Нет активных объектов. Неактивные показаны ниже.' : 'No active properties. Inactive ones are listed below.'}
            </p>
          )}
          {/* Active properties — main list */}
          {activeProperties.map((property) => (
            <div key={property.id} className="relative flex items-start gap-2">
              {selectionMode && (
                <div className="pt-4 pl-1 shrink-0">
                  <Checkbox
                    checked={selectedIds.has(property.property_id)}
                    onCheckedChange={() => toggleSelection(property.property_id)}
                  />
                </div>
              )}
              <div className={cn('flex-1 min-w-0 relative', selectionMode && 'pointer-events-none')}>
                {(property.source === 'managed' || (!property.lat && !property.lng)) && (
                  <div className="absolute top-2 left-2 z-10 flex flex-col gap-1 pointer-events-none">
                    {property.source === 'managed' && (
                      <Badge variant="secondary" className="w-fit text-[10px] truncate">
                        {isRu ? 'В управлении' : 'Managed'}
                      </Badge>
                    )}
                    {!property.lat && !property.lng && (
                      <Badge variant="secondary" className="w-fit text-[10px] text-muted-foreground bg-muted/90 truncate">
                        <Map className="h-3 w-3 mr-0.5 opacity-70" />
                        {isRu ? 'Нет координат' : 'No coords'}
                      </Badge>
                    )}
                  </div>
                )}
                <PropertyCard
                  property={property as any}
                  variant="list"
                  mode="owner"
                  complexName={property.complex_id ? (isRu ? complexNames[property.complex_id]?.name_ru : null) || complexNames[property.complex_id]?.name : undefined}
                  onView={() => handleView(property.property_id)}
                  onEdit={() => handleEdit(property.property_id)}
                  onDuplicate={() => handleDuplicate(property.property_id)}
                  onToggleActive={(_, activate) => handleToggleActive(property.property_id, activate)}
                  onDelete={() => setDeleteTarget(property.property_id)}
                  showApprovalStatus
                  showInstantBadge
                  showProtectionBadge
                  showMarketplaceBadge
                />
              </div>
            </div>
          ))}

          {/* Inactive / archived — separate section */}
          {inactiveProperties.length > 0 && viewMode === 'list' && (
            <Card className="mt-8 border-dashed border-muted-foreground/30">
              <button
                type="button"
                onClick={() => setShowInactiveSection(!showInactiveSection)}
                className="w-full flex items-center gap-2 p-4 text-left hover:bg-muted/30 transition-colors rounded-t-lg"
              >
                {showInactiveSection ? <ChevronDown className="h-4 w-4 shrink-0" /> : <ChevronRight className="h-4 w-4 shrink-0" />}
                <Archive className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="font-medium text-muted-foreground">
                  {isRu ? `Неактивные объекты (${inactiveProperties.length})` : `Inactive properties (${inactiveProperties.length})`}
                </span>
              </button>
              {showInactiveSection && (
                <CardContent className="pt-0 pb-4 space-y-4">
                  {inactiveProperties.map((property) => (
                    <div key={property.id} className="relative flex items-start gap-2">
                      <div className="flex-1 min-w-0 relative opacity-90">
                        {(property.source === 'managed' || (!property.lat && !property.lng)) && (
                          <div className="absolute top-2 left-2 z-10 flex flex-col gap-1 pointer-events-none">
                            {property.source === 'managed' && (
                              <Badge variant="secondary" className="w-fit text-[10px] truncate">
                                {isRu ? 'В управлении' : 'Managed'}
                              </Badge>
                            )}
                            {!property.lat && !property.lng && (
                              <Badge variant="secondary" className="w-fit text-[10px] text-muted-foreground bg-muted/90 truncate">
                                <Map className="h-3 w-3 mr-0.5 opacity-70" />
                                {isRu ? 'Нет координат' : 'No coords'}
                              </Badge>
                            )}
                          </div>
                        )}
                        <PropertyCard
                          property={property as any}
                          variant="list"
                          mode="owner"
                          complexName={property.complex_id ? (isRu ? complexNames[property.complex_id]?.name_ru : null) || complexNames[property.complex_id]?.name : undefined}
                          onView={() => handleView(property.property_id)}
                          onEdit={() => handleEdit(property.property_id)}
                          onDuplicate={() => handleDuplicate(property.property_id)}
                          onToggleActive={(_, activate) => handleToggleActive(property.property_id, activate)}
                          onDelete={() => setDeleteTarget(property.property_id)}
                          showApprovalStatus
                          showInstantBadge
                          showProtectionBadge
                          showMarketplaceBadge
                        />
                      </div>
                    </div>
                  ))}
                </CardContent>
              )}
            </Card>
          )}
        </div>
      )}

      {/* Floating Bulk Actions Bar */}
      <AnimatePresence>
        {selectionMode && selectedIds.size > 0 && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-card border border-border rounded-2xl shadow-lg px-4 py-3 flex items-center gap-2 max-w-[95vw] overflow-x-auto"
          >
            <span className="text-sm font-medium text-foreground whitespace-nowrap mr-1">
              {selectedIds.size}
            </span>

            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 text-xs whitespace-nowrap"
              onClick={() => handleBulkToggleActive(true)}
              disabled={bulkProcessing}
            >
              <ToggleRight className="h-3.5 w-3.5" />
              {isRu ? 'Вкл' : 'On'}
            </Button>

            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 text-xs whitespace-nowrap"
              onClick={() => handleBulkToggleActive(false)}
              disabled={bulkProcessing}
            >
              <ToggleLeft className="h-3.5 w-3.5" />
              {isRu ? 'Выкл' : 'Off'}
            </Button>

            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 text-xs whitespace-nowrap"
              onClick={() => setBulkReassignOpen(true)}
              disabled={bulkProcessing}
            >
              <FolderSync className="h-3.5 w-3.5" />
              {isRu ? 'Комплекс' : 'Assign'}
            </Button>

            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 text-xs whitespace-nowrap"
              onClick={handleBulkExport}
              disabled={bulkProcessing}
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              {isRu ? 'CSV' : 'CSV'}
            </Button>

            <Button
              size="sm"
              variant="destructive"
              className="gap-1.5 text-xs whitespace-nowrap"
              onClick={() => setBulkDeleteOpen(true)}
              disabled={bulkProcessing}
            >
              <Trash2 className="h-3.5 w-3.5" />
              {isRu ? 'Удалить' : 'Delete'}
            </Button>

            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 shrink-0"
              onClick={exitSelectionMode}
            >
              <XCircle className="h-4 w-4" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete single confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{isRu ? 'Удалить объект?' : 'Delete property?'}</AlertDialogTitle>
            <AlertDialogDescription>
              {isRu
                ? 'Это действие необратимо. Все данные объекта, включая бронирования и финансовую историю, будут удалены.'
                : 'This action cannot be undone. All property data including bookings and financial history will be deleted.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{isRu ? 'Отмена' : 'Cancel'}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {isRu ? 'Удалить' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk delete confirmation */}
      <AlertDialog open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isRu ? `Удалить ${selectedIds.size} объектов?` : `Delete ${selectedIds.size} properties?`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isRu
                ? 'Это действие необратимо. Все данные выбранных объектов будут удалены безвозвратно.'
                : 'This action cannot be undone. All data for selected properties will be permanently deleted.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={bulkProcessing}>{isRu ? 'Отмена' : 'Cancel'}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              disabled={bulkProcessing}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {bulkProcessing ? (isRu ? 'Удаление...' : 'Deleting...') : (isRu ? 'Удалить' : 'Delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reassign complex/project dialog */}
      <BulkReassignDialog
        open={bulkReassignOpen}
        onOpenChange={setBulkReassignOpen}
        isRu={isRu}
        count={selectedIds.size}
        reassignType={reassignType}
        setReassignType={setReassignType}
        reassignTargetId={reassignTargetId}
        setReassignTargetId={setReassignTargetId}
        onConfirm={handleBulkReassign}
        processing={bulkProcessing}
      />
    </PageContainer>
  );
}

// --- Bulk Reassign Dialog ---
function BulkReassignDialog({
  open, onOpenChange, isRu, count, reassignType, setReassignType,
  reassignTargetId, setReassignTargetId, onConfirm, processing,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  isRu: boolean;
  count: number;
  reassignType: 'complex' | 'project';
  setReassignType: (v: 'complex' | 'project') => void;
  reassignTargetId: string;
  setReassignTargetId: (v: string) => void;
  onConfirm: () => void;
  processing: boolean;
}) {
  const { complexes, projects } = useAllComplexesAndProjects();
  const items = reassignType === 'complex' ? complexes : projects;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isRu ? `Назначить ${count} объектов` : `Assign ${count} properties`}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2">
            <Button
              variant={reassignType === 'complex' ? 'default' : 'outline'}
              size="sm"
              onClick={() => { setReassignType('complex'); setReassignTargetId(''); }}
            >
              {isRu ? 'Комплекс' : 'Complex'}
            </Button>
            <Button
              variant={reassignType === 'project' ? 'default' : 'outline'}
              size="sm"
              onClick={() => { setReassignType('project'); setReassignTargetId(''); }}
            >
              {isRu ? 'Проект' : 'Project'}
            </Button>
          </div>

          <Select value={reassignTargetId} onValueChange={setReassignTargetId}>
            <SelectTrigger>
              <SelectValue placeholder={isRu ? 'Выберите...' : 'Select...'} />
            </SelectTrigger>
            <SelectContent>
              {items.map(item => (
                <SelectItem key={item.id} value={item.id}>
                  {reassignType === 'complex'
                    ? (isRu && (item as any).name_ru ? (item as any).name_ru : (item as any).name)
                    : (isRu ? (item as any).name_ru : (item as any).name_en)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={processing}>
            {isRu ? 'Отмена' : 'Cancel'}
          </Button>
          <Button onClick={onConfirm} disabled={!reassignTargetId || processing}>
            {processing ? (isRu ? 'Сохранение...' : 'Saving...') : (isRu ? 'Применить' : 'Apply')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// --- Sub-components ---

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
      <div className="flex flex-wrap gap-1.5">
        {children}
      </div>
    </div>
  );
}

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'px-2.5 py-1 rounded-full text-xs font-medium border transition-all',
        active
          ? 'bg-primary text-primary-foreground border-primary'
          : 'bg-card border-border text-foreground hover:border-primary/50'
      )}
    >
      {label}
    </button>
  );
}
