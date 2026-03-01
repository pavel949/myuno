import { useState, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { useMyProperties } from '@/hooks/useMyProperties';
import { useUserRoles } from '@/hooks/useUserRoles';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { BackButton } from '@/components/uno/BackButton';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { PropertyCard, PropertyCardSkeleton } from '@/components/property/PropertyCard';
import { Home, Plus, Download, Building2, Users, Search, X, Filter } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

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

export default function OwnerProperties() {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const isRu = language === 'ru';
  const { roles } = useUserRoles();
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

  const isPropertyManager = roles?.some(r => r.role === 'property_manager');
  const RoleIcon = isPropertyManager ? Users : Building2;
  const roleBadge = isPropertyManager
    ? (isRu ? 'Управляющая компания' : 'Property Manager')
    : (isRu ? 'Собственник' : 'Owner');

  const { allProperties, isLoading } = useMyProperties();

  // Extract unique filter values
  const { districts, complexIds, projectIds, propertyTypes } = useMemo(() => {
    const dists = new Set<string>();
    const compIds = new Set<string>();
    const projIds = new Set<string>();
    const types = new Set<string>();
    (allProperties || []).forEach(p => {
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
  }, [allProperties]);

  const { complexNames, projectNames } = usePropertyLookups(complexIds, projectIds);

  // Apply filters
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

  const hasActiveFilters = !!(searchId || selectedDistrict || selectedComplex || selectedProject || selectedType);

  const clearFilters = () => {
    setSearchId('');
    setSelectedDistrict(null);
    setSelectedComplex(null);
    setSelectedProject(null);
    setSelectedType(null);
  };

  // --- handlers ---
  const handleView = (id: string) => navigate(`/mc/properties/${id}`);
  const handleEdit = (id: string) => navigate(`/mc/properties/${id}/editor`);
  const handleDuplicate = (id: string) => navigate(`/mc/properties/new?cloneFrom=${id}`);

  const handleToggleActive = async (id: string, activate: boolean) => {
    const { error } = await supabase.from('properties').update({ is_active: activate }).eq('id', id);
    if (error) {
      toast({ title: isRu ? 'Ошибка' : 'Error', variant: 'destructive' });
    } else {
      toast({ title: activate ? (isRu ? 'Объект активирован' : 'Property activated') : (isRu ? 'Объект деактивирован' : 'Property deactivated') });
      queryClient.invalidateQueries({ queryKey: ['owner-properties'] });
      queryClient.invalidateQueries({ queryKey: ['assigned-properties'] });
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const { error } = await supabase.from('properties').delete().eq('id', deleteTarget);
    if (error) {
      toast({ title: isRu ? 'Ошибка удаления' : 'Delete failed', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: isRu ? 'Объект удалён' : 'Property deleted' });
      queryClient.invalidateQueries({ queryKey: ['owner-properties'] });
      queryClient.invalidateQueries({ queryKey: ['assigned-properties'] });
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

      {/* Role badge */}
      <div className="flex items-center gap-2 mb-4">
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/8 text-primary">
          <RoleIcon className="h-4 w-4" />
          <span className="text-sm font-medium">{roleBadge}</span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 mb-4">
        <Button className="flex-1" onClick={() => navigate('/mc/properties/new')}>
          <Plus className="h-4 w-4 mr-2" />
          {isRu ? 'Добавить объект' : 'Add Property'}
        </Button>
        <Button variant="outline" onClick={() => navigate('/mc/properties/import')}>
          <Download className="h-4 w-4 mr-2" />
          {isRu ? 'Импорт' : 'Import'}
        </Button>
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
              {/* Districts */}
              {districts.length > 0 && (
                <FilterRow label={isRu ? 'Район' : 'District'}>
                  {districts.map(d => (
                    <FilterChip key={d} label={d} active={selectedDistrict === d} onClick={() => setSelectedDistrict(selectedDistrict === d ? null : d)} />
                  ))}
                </FilterRow>
              )}

              {/* Property Types */}
              {propertyTypes.length > 0 && (
                <FilterRow label={isRu ? 'Тип' : 'Type'}>
                  {propertyTypes.map(t => (
                    <FilterChip key={t} label={t} active={selectedType === t} onClick={() => setSelectedType(selectedType === t ? null : t)} />
                  ))}
                </FilterRow>
              )}

              {/* Complexes */}
              {complexIds.length > 0 && (
                <FilterRow label={isRu ? 'Комплекс' : 'Complex'}>
                  {complexIds.map(id => {
                    const info = complexNames[id];
                    const label = info ? (isRu && info.name_ru ? info.name_ru : info.name) : id.slice(0, 8);
                    return <FilterChip key={id} label={label} active={selectedComplex === id} onClick={() => setSelectedComplex(selectedComplex === id ? null : id)} />;
                  })}
                </FilterRow>
              )}

              {/* Projects */}
              {projectIds.length > 0 && (
                <FilterRow label={isRu ? 'Проект' : 'Project'}>
                  {projectIds.map(id => {
                    const info = projectNames[id];
                    const label = info ? (isRu ? info.name_ru : info.name_en) : id.slice(0, 8);
                    return <FilterChip key={id} label={label} active={selectedProject === id} onClick={() => setSelectedProject(selectedProject === id ? null : id)} />;
                  })}
                </FilterRow>
              )}

              {/* Clear all */}
              {hasActiveFilters && (
                <button onClick={clearFilters} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                  <X className="h-3 w-3" />
                  {isRu ? 'Сбросить фильтры' : 'Clear filters'}
                </button>
              )}
            </div>
          )}

          {/* Results count */}
          {hasActiveFilters && (
            <p className="text-xs text-muted-foreground">
              {isRu ? `Найдено: ${filteredProperties.length} из ${allProperties.length}` : `Found: ${filteredProperties.length} of ${allProperties.length}`}
            </p>
          )}
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
      ) : (
        <div className="space-y-4">
          {filteredProperties.map((property) => (
            <div key={property.id} className="relative">
              {property.source === 'managed' && (
                <Badge variant="secondary" className="absolute top-2 right-2 z-10 text-[10px]">
                  {isRu ? 'В управлении' : 'Managed'}
                </Badge>
              )}
              <PropertyCard
                property={property as any}
                variant="list"
                mode="owner"
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
          ))}
        </div>
      )}

      {/* Delete confirmation */}
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
    </PageContainer>
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
