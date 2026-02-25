/**
 * LifeOS Mappings Tab - Core Control Module
 * Per LIFE OS Contract: READ-ONLY catalog access, ORCHESTRATION only
 * Now with GOVERNANCE guardrails and change-impact preview
 */
import React, { useState, useMemo, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAdminLifeSituations, type LifeOSRole } from '@/hooks/useLifeOS';
import { 
  useGovernanceConfig, 
  validateMapping, 
  validateDelete, 
  calculateChangeImpact,
  logGovernanceAction,
  type ValidationResult,
  type ChangeImpact,
} from '@/hooks/useLifeOSGovernance';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from '@/components/ui/sheet';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { Plus, Trash2, Search, AlertTriangle, Users, Weight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ChangeImpactModal } from './ChangeImpactModal';
import { ENTITY_TYPES, getEntityType, type EntityTypeDefinition } from '@/lib/config/entityTypes';

// Get entity types from centralized config
const ENTITY_TYPE_OPTIONS = Object.values(ENTITY_TYPES).map((def: EntityTypeDefinition) => ({
  value: def.type,
  label: def.pluralEn,
  labelRu: def.pluralRu,
  icon: def.icon,
}));

const ROLE_SCOPES: { value: LifeOSRole; label: string; color: string }[] = [
  { value: 'guest', label: 'Guest', color: 'bg-info/10 text-info border-info/30' },
  { value: 'resident', label: 'Resident', color: 'bg-success/10 text-success border-success/30' },
  { value: 'owner', label: 'Owner', color: 'bg-accent-purple/10 text-accent-purple border-accent-purple/30' },
  { value: 'investor', label: 'Investor', color: 'bg-warning/10 text-warning border-warning/30' },
];

interface MappingWithMeta {
  id: string;
  entity_type: string;
  entity_id: string;
  life_situation_id: string;
  weight: number;
  role_scope: LifeOSRole[];
  rules: Record<string, unknown>;
  situation_code?: string;
  situation_title?: string;
}

export function LifeOSMappingsTab() {
  const { language } = useLanguage();
  const isRussian = language === 'ru';
  const queryClient = useQueryClient();

  // Governance config
  const { data: governanceConfig } = useGovernanceConfig();

  // State
  const [selectedSituationId, setSelectedSituationId] = useState<string>('all');
  const [entityTypeFilter, setEntityTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedMappings, setSelectedMappings] = useState<Set<string>>(new Set());

  // Change impact modal state
  const [impactModalOpen, setImpactModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<{
    type: 'create' | 'delete';
    mappingId?: string;
    data?: typeof newMapping;
  } | null>(null);
  const [currentValidation, setCurrentValidation] = useState<ValidationResult | null>(null);
  const [currentImpact, setCurrentImpact] = useState<ChangeImpact | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // New mapping state
  const [newMapping, setNewMapping] = useState({
    life_situation_id: '',
    entity_type: 'service',
    entity_id: '',
    weight: 50,
    role_scope: ['guest', 'resident', 'owner', 'investor'] as LifeOSRole[],
    priority_type: 'secondary' as 'primary' | 'secondary',
  });

  // Fetch all situations
  const { data: situations } = useAdminLifeSituations();

  // Fetch all mappings with situation info
  const { data: allMappings, isLoading } = useQuery({
    queryKey: ['lifeos-all-mappings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('catalog_life_map')
        .select(`
          *,
          life_situations (code, title_en, title_ru)
        `)
        .order('weight', { ascending: false });

      if (error) throw error;
      
      return (data || []).map((m: any) => ({
        ...m,
        situation_code: m.life_situations?.code,
        situation_title: isRussian ? m.life_situations?.title_ru : m.life_situations?.title_en,
      })) as MappingWithMeta[];
    },
  });

  // Filtered mappings
  const filteredMappings = useMemo(() => {
    if (!allMappings) return [];
    
    return allMappings.filter((m) => {
      if (selectedSituationId !== 'all' && m.life_situation_id !== selectedSituationId) return false;
      if (entityTypeFilter !== 'all' && m.entity_type !== entityTypeFilter) return false;
      if (searchQuery && !m.entity_id.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });
  }, [allMappings, selectedSituationId, entityTypeFilter, searchQuery]);

  // Handlers with governance validation
  const handleCreateWithValidation = useCallback(async () => {
    if (!newMapping.life_situation_id || !newMapping.entity_id.trim()) {
      toast.error(isRussian ? 'Заполните обязательные поля' : 'Fill required fields');
      return;
    }

    // Check for duplicates
    const existing = allMappings?.find(
      m => m.life_situation_id === newMapping.life_situation_id && 
           m.entity_id === newMapping.entity_id.trim()
    );
    
    if (existing) {
      toast.error(isRussian ? 'Маппинг уже существует' : 'Mapping already exists');
      return;
    }

    // Validate with governance rules
    if (governanceConfig) {
      const validation = await validateMapping(newMapping, governanceConfig);
      const impact = await calculateChangeImpact('create', {
        life_situation_id: newMapping.life_situation_id,
        priority_type: newMapping.priority_type,
      }, governanceConfig);

      // If blocked or has warnings, show modal
      if (validation.blocked || validation.warnings.length > 0) {
        setCurrentValidation(validation);
        setCurrentImpact(impact);
        setPendingAction({ type: 'create', data: { ...newMapping } });
        setImpactModalOpen(true);
        return;
      }
    }

    // Direct create if no issues
    await executeCreate(newMapping);
  }, [newMapping, allMappings, governanceConfig, isRussian]);

  const executeCreate = async (mapping: typeof newMapping) => {
    setIsSaving(true);
    try {
      const { error } = await supabase.from('catalog_life_map').insert({
        life_situation_id: mapping.life_situation_id,
        entity_type: mapping.entity_type,
        entity_id: mapping.entity_id.trim(),
        weight: mapping.weight,
        role_scope: mapping.role_scope,
        rules: { priority_type: mapping.priority_type },
      });

      if (error) {
        toast.error(isRussian ? 'Ошибка создания' : 'Failed to create');
        return;
      }

      await logGovernanceAction('CREATE', false, null, mapping.entity_id, { mapping });
      toast.success(isRussian ? 'Маппинг создан' : 'Mapping created');
      setIsCreateOpen(false);
      setImpactModalOpen(false);
      resetNewMapping();
      queryClient.invalidateQueries({ queryKey: ['lifeos-all-mappings'] });
      queryClient.invalidateQueries({ queryKey: ['lifeos-health'] });
    } finally {
      setIsSaving(false);
    }
  };

  const resetNewMapping = () => {
    setNewMapping({
      life_situation_id: '',
      entity_type: 'service',
      entity_id: '',
      weight: 50,
      role_scope: ['guest', 'resident', 'owner', 'investor'],
      priority_type: 'secondary',
    });
  };

  const handleUpdateWeight = async (id: string, weight: number) => {
    // Check weight bounds from governance
    if (governanceConfig) {
      if (weight > 85) {
        toast.warning(isRussian ? 'Вес выше 85 требует осторожности' : 'Weight above 85 requires caution');
      }
    }

    const { error } = await supabase
      .from('catalog_life_map')
      .update({ weight })
      .eq('id', id);

    if (error) {
      toast.error(isRussian ? 'Ошибка обновления' : 'Failed to update');
      return;
    }
    queryClient.invalidateQueries({ queryKey: ['lifeos-all-mappings'] });
    queryClient.invalidateQueries({ queryKey: ['lifeos-health'] });
  };

  const handleDeleteWithValidation = useCallback(async (id: string) => {
    if (!governanceConfig) {
      await executeDelete(id);
      return;
    }

    const validation = await validateDelete(id, governanceConfig);
    
    // Find mapping to get situation info
    const mapping = allMappings?.find(m => m.id === id);
    if (mapping) {
      const impact = await calculateChangeImpact('delete', {
        life_situation_id: mapping.life_situation_id,
        priority_type: (mapping.rules as any)?.priority_type,
      }, governanceConfig);

      if (validation.blocked || validation.warnings.length > 0) {
        setCurrentValidation(validation);
        setCurrentImpact(impact);
        setPendingAction({ type: 'delete', mappingId: id });
        setImpactModalOpen(true);
        return;
      }
    }

    await executeDelete(id);
  }, [governanceConfig, allMappings]);

  const executeDelete = async (id: string) => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('catalog_life_map')
        .delete()
        .eq('id', id);

      if (error) {
        toast.error(isRussian ? 'Ошибка удаления' : 'Failed to delete');
        return;
      }

      await logGovernanceAction('DELETE', false, null, id, {});
      toast.success(isRussian ? 'Маппинг удалён' : 'Mapping deleted');
      setImpactModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['lifeos-all-mappings'] });
      queryClient.invalidateQueries({ queryKey: ['lifeos-health'] });
    } finally {
      setIsSaving(false);
    }
  };

  const handleImpactConfirm = async () => {
    if (!pendingAction) return;

    if (pendingAction.type === 'create' && pendingAction.data) {
      await executeCreate(pendingAction.data);
    } else if (pendingAction.type === 'delete' && pendingAction.mappingId) {
      await executeDelete(pendingAction.mappingId);
    }

    setPendingAction(null);
    setCurrentValidation(null);
    setCurrentImpact(null);
  };

  const handleBulkDelete = async () => {
    if (selectedMappings.size === 0) return;

    const { error } = await supabase
      .from('catalog_life_map')
      .delete()
      .in('id', Array.from(selectedMappings));

    if (error) {
      toast.error(isRussian ? 'Ошибка удаления' : 'Failed to delete');
      return;
    }

    toast.success(`${selectedMappings.size} ${isRussian ? 'маппингов удалено' : 'mappings deleted'}`);
    setSelectedMappings(new Set());
    queryClient.invalidateQueries({ queryKey: ['lifeos-all-mappings'] });
  };

  const handleBulkWeightAdjust = async (delta: number) => {
    if (selectedMappings.size === 0) return;

    const updates = Array.from(selectedMappings).map(async (id) => {
      const mapping = allMappings?.find(m => m.id === id);
      if (!mapping) return;
      
      const newWeight = Math.max(0, Math.min(100, mapping.weight + delta));
      return supabase
        .from('catalog_life_map')
        .update({ weight: newWeight })
        .eq('id', id);
    });

    await Promise.all(updates);
    toast.success(isRussian ? 'Веса обновлены' : 'Weights updated');
    setSelectedMappings(new Set());
    queryClient.invalidateQueries({ queryKey: ['lifeos-all-mappings'] });
  };

  const toggleSelectAll = () => {
    if (selectedMappings.size === filteredMappings.length) {
      setSelectedMappings(new Set());
    } else {
      setSelectedMappings(new Set(filteredMappings.map(m => m.id)));
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder={isRussian ? 'Поиск по ID...' : 'Search by ID...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9"
          />
        </div>
        
        <Select value={selectedSituationId} onValueChange={setSelectedSituationId}>
          <SelectTrigger className="w-[200px] h-9">
            <SelectValue placeholder={isRussian ? 'Все ситуации' : 'All situations'} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{isRussian ? 'Все ситуации' : 'All situations'}</SelectItem>
            {situations?.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {isRussian ? s.title_ru : s.title_en}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={entityTypeFilter} onValueChange={setEntityTypeFilter}>
          <SelectTrigger className="w-[160px] h-9">
            <SelectValue placeholder={isRussian ? 'Тип' : 'Type'} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{isRussian ? 'Все типы' : 'All types'}</SelectItem>
            {ENTITY_TYPE_OPTIONS.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {isRussian ? t.labelRu : t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Sheet open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <SheetTrigger asChild>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-2" />
              {isRussian ? 'Добавить' : 'Add Mapping'}
            </Button>
          </SheetTrigger>
          <SheetContent className="overflow-y-auto">
            <SheetHeader>
              <SheetTitle>{isRussian ? 'Новый маппинг' : 'New Mapping'}</SheetTitle>
            </SheetHeader>
            <div className="space-y-4 mt-6">
              <div className="space-y-2">
                <Label>{isRussian ? 'Жизненная ситуация' : 'Life Situation'} *</Label>
                <Select 
                  value={newMapping.life_situation_id} 
                  onValueChange={(v) => setNewMapping(m => ({ ...m, life_situation_id: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={isRussian ? 'Выберите...' : 'Select...'} />
                  </SelectTrigger>
                  <SelectContent>
                    {situations?.filter(s => s.is_active).map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {isRussian ? s.title_ru : s.title_en}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>{isRussian ? 'Тип сущности' : 'Entity Type'}</Label>
                <Select 
                  value={newMapping.entity_type}
                  onValueChange={(v) => setNewMapping(m => ({ ...m, entity_type: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
          <SelectContent>
            {ENTITY_TYPE_OPTIONS.map((t) => (
              <SelectItem key={t.value} value={t.value}>
                {isRussian ? t.labelRu : t.label}
              </SelectItem>
            ))}
          </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Entity ID (UUID) *</Label>
                <Input 
                  placeholder="e.g. 8d45f26a-c87c-4f44-8a6e-..."
                  value={newMapping.entity_id}
                  onChange={(e) => setNewMapping(m => ({ ...m, entity_id: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Weight className="w-4 h-4" />
                  {isRussian ? 'Вес' : 'Weight'}: {newMapping.weight}
                </Label>
                <Slider 
                  value={[newMapping.weight]}
                  onValueChange={([v]) => setNewMapping(m => ({ ...m, weight: v }))}
                  min={0}
                  max={100}
                  step={5}
                />
                {newMapping.weight > 80 && (
                  <div className="flex items-center gap-2 text-warning text-sm">
                    <AlertTriangle className="w-4 h-4" />
                    {isRussian ? 'Высокий приоритет требует подтверждения' : 'High weight requires confirmation'}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>{isRussian ? 'Приоритет' : 'Priority'}</Label>
                <Select 
                  value={newMapping.priority_type}
                  onValueChange={(v: 'primary' | 'secondary') => setNewMapping(m => ({ ...m, priority_type: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="primary">{isRussian ? 'Основной' : 'Primary'}</SelectItem>
                    <SelectItem value="secondary">{isRussian ? 'Дополнительный' : 'Secondary'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  {isRussian ? 'Видимость по ролям' : 'Role Visibility'}
                </Label>
                <div className="flex flex-wrap gap-2">
                  {ROLE_SCOPES.map((role) => (
                    <label key={role.value} className="flex items-center gap-2 cursor-pointer">
                      <Checkbox 
                        checked={newMapping.role_scope.includes(role.value)}
                        onCheckedChange={(checked) => {
                          setNewMapping(m => ({
                            ...m,
                            role_scope: checked 
                              ? [...m.role_scope, role.value]
                              : m.role_scope.filter(r => r !== role.value)
                          }));
                        }}
                      />
                      <span className={cn('text-xs px-2 py-1 rounded border', role.color)}>
                        {role.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <SheetFooter className="mt-6">
              <Button className="w-full" onClick={handleCreateWithValidation}>
                {isRussian ? 'Создать маппинг' : 'Create Mapping'}
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>

      {/* Bulk Actions */}
      {selectedMappings.size > 0 && (
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="py-3 flex items-center gap-4">
            <Badge variant="outline">{selectedMappings.size} {isRussian ? 'выбрано' : 'selected'}</Badge>
            <Button size="sm" variant="outline" onClick={() => handleBulkWeightAdjust(10)}>
              +10 {isRussian ? 'вес' : 'weight'}
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleBulkWeightAdjust(-10)}>
              -10 {isRussian ? 'вес' : 'weight'}
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" variant="destructive">
                  <Trash2 className="w-4 h-4 mr-1" />
                  {isRussian ? 'Удалить' : 'Delete'}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{isRussian ? 'Удалить маппинги?' : 'Delete mappings?'}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {isRussian 
                      ? `Вы уверены, что хотите удалить ${selectedMappings.size} маппингов?`
                      : `Are you sure you want to delete ${selectedMappings.size} mappings?`
                    }
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{isRussian ? 'Отмена' : 'Cancel'}</AlertDialogCancel>
                  <AlertDialogAction onClick={handleBulkDelete}>
                    {isRussian ? 'Удалить' : 'Delete'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button size="sm" variant="ghost" onClick={() => setSelectedMappings(new Set())}>
              {isRussian ? 'Снять выбор' : 'Clear'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Mappings Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox 
                    checked={selectedMappings.size === filteredMappings.length && filteredMappings.length > 0}
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead>{isRussian ? 'Тип' : 'Type'}</TableHead>
                <TableHead>Entity ID</TableHead>
                <TableHead>{isRussian ? 'Ситуация' : 'Situation'}</TableHead>
                <TableHead className="w-32">{isRussian ? 'Вес' : 'Weight'}</TableHead>
                <TableHead>{isRussian ? 'Роли' : 'Roles'}</TableHead>
                <TableHead className="w-16"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">Loading...</TableCell>
                </TableRow>
              ) : filteredMappings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    {isRussian ? 'Нет маппингов' : 'No mappings found'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredMappings.map((mapping) => (
                  <TableRow key={mapping.id}>
                    <TableCell>
                      <Checkbox 
                        checked={selectedMappings.has(mapping.id)}
                        onCheckedChange={(checked) => {
                          const next = new Set(selectedMappings);
                          if (checked) {
                            next.add(mapping.id);
                          } else {
                            next.delete(mapping.id);
                          }
                          setSelectedMappings(next);
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{mapping.entity_type}</Badge>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs">{mapping.entity_id.slice(0, 8)}...</code>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{mapping.situation_title}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Slider 
                          value={[mapping.weight]}
                          onValueChange={([v]) => handleUpdateWeight(mapping.id, v)}
                          min={0}
                          max={100}
                          step={5}
                          className="w-20"
                        />
                        <span className="text-xs w-8">{mapping.weight}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {mapping.role_scope?.map((role) => (
                          <Badge key={role} variant="secondary" className="text-[10px] px-1">
                            {role.charAt(0).toUpperCase()}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button 
                        size="icon" 
                        variant="ghost"
                        onClick={() => handleDeleteWithValidation(mapping.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Change Impact Modal */}
      <ChangeImpactModal
        open={impactModalOpen}
        onOpenChange={setImpactModalOpen}
        onConfirm={handleImpactConfirm}
        action={pendingAction?.type || 'create'}
        impact={currentImpact}
        validation={currentValidation}
        isLoading={isSaving}
      />
    </div>
  );
}
