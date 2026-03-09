/**
 * AdminLifeSituations - LIFE OS Admin Control Panel
 * Per LIFE OS Contract §Admin UX Contract:
 * - Map entities to life situations
 * - Adjust weight (priority)
 * - Toggle visibility
 * - Manage role_scope (guest/resident/owner/investor)
 */
import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAdminLifeSituations, useAdminCatalogMappings, LifeSituation, CatalogLifeMap, type LifeOSRole } from '@/hooks/useLifeOS';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, Trash2, Link2, Settings2, Sparkles, Users } from 'lucide-react';
import { DynamicIcon } from '@/components/ui/dynamic-icon';
import { cn } from '@/lib/utils';

const ENTITY_TYPES = [
  { value: 'property', label: 'Properties' },
  { value: 'service', label: 'Services' },
  { value: 'yacht', label: 'Yachts' },
  { value: 'transport', label: 'Transport' },
  { value: 'restaurant', label: 'Restaurants' },
  { value: 'tour', label: 'Tours' },
  { value: 'experience', label: 'Experiences' },
];

const ROLE_SCOPES: { value: LifeOSRole; label: string; color: string }[] = [
  { value: 'guest', label: 'Guest', color: 'bg-info/10 text-info' },
  { value: 'resident', label: 'Resident', color: 'bg-success/10 text-success' },
  { value: 'owner', label: 'Owner', color: 'bg-accent-purple/10 text-accent-purple' },
  { value: 'investor', label: 'Investor', color: 'bg-warning/10 text-warning' },
];

export default function AdminLifeSituations() {
  const { language } = useLanguage();
  const isRussian = language === 'ru';
  const queryClient = useQueryClient();

  const { data: situations, isLoading } = useAdminLifeSituations();
  const [selectedSituation, setSelectedSituation] = useState<LifeSituation | null>(null);
  const { data: mappings } = useAdminCatalogMappings(selectedSituation?.id || null);

  // Add mapping dialog state
  const [isAddMappingOpen, setIsAddMappingOpen] = useState(false);
  const [newMapping, setNewMapping] = useState({
    entity_type: 'service',
    entity_id: '',
    weight: 50,
    role_scope: ['guest', 'resident', 'owner', 'investor'] as LifeOSRole[],
  });


  const handleToggleActive = async (situation: LifeSituation) => {
    const { error } = await supabase
      .from('life_situations')
      .update({ is_active: !situation.is_active })
      .eq('id', situation.id);

    if (error) {
      toast.error('Failed to update status');
      return;
    }

    toast.success('Status updated');
    queryClient.invalidateQueries({ queryKey: ['admin-life-situations'] });
  };

  const handleAddMapping = async () => {
    if (!selectedSituation || !newMapping.entity_id.trim()) {
      toast.error('Please enter entity ID');
      return;
    }

    const { error } = await supabase.from('catalog_life_map').insert({
      life_situation_id: selectedSituation.id,
      entity_type: newMapping.entity_type,
      entity_id: newMapping.entity_id.trim(),
      weight: newMapping.weight,
      role_scope: newMapping.role_scope,
    });

    if (error) {
      if (error.code === '23505') {
        toast.error('This mapping already exists');
      } else {
        toast.error('Failed to add mapping');
      }
      return;
    }

    toast.success('Mapping added');
    setIsAddMappingOpen(false);
    setNewMapping({ entity_type: 'service', entity_id: '', weight: 50, role_scope: ['guest', 'resident', 'owner', 'investor'] });
    queryClient.invalidateQueries({ queryKey: ['admin-catalog-mappings', selectedSituation.id] });
  };

  const handleUpdateRoleScope = async (mappingId: string, roleScope: LifeOSRole[]) => {
    const { error } = await supabase
      .from('catalog_life_map')
      .update({ role_scope: roleScope })
      .eq('id', mappingId);

    if (error) {
      toast.error('Failed to update role scope');
      return;
    }

    queryClient.invalidateQueries({ queryKey: ['admin-catalog-mappings', selectedSituation?.id] });
  };

  const handleDeleteMapping = async (mappingId: string) => {
    const { error } = await supabase
      .from('catalog_life_map')
      .delete()
      .eq('id', mappingId);

    if (error) {
      toast.error('Failed to delete mapping');
      return;
    }

    toast.success('Mapping removed');
    queryClient.invalidateQueries({ queryKey: ['admin-catalog-mappings', selectedSituation?.id] });
  };

  const handleUpdateWeight = async (mappingId: string, weight: number) => {
    const { error } = await supabase
      .from('catalog_life_map')
      .update({ weight })
      .eq('id', mappingId);

    if (error) {
      toast.error('Failed to update weight');
      return;
    }

    queryClient.invalidateQueries({ queryKey: ['admin-catalog-mappings', selectedSituation?.id] });
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Sparkles className="w-6 h-6 text-primary" />
          <div>
            <h1 className="text-xl font-bold">
              {isRussian ? 'Жизненные ситуации' : 'Life Situations'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isRussian
                ? 'Управление контекстной навигацией'
                : 'Manage contextual navigation layer'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Situations List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">
              {isRussian ? 'Ситуации' : 'Situations'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : (
              situations?.map((situation) => {
                const Icon = getIcon(situation.icon);
                const isSelected = selectedSituation?.id === situation.id;

                return (
                  <button
                    key={situation.id}
                    onClick={() => setSelectedSituation(situation)}
                    className={cn(
                      "w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all",
                      isSelected
                        ? "bg-primary/10 border border-primary/30"
                        : "hover:bg-accent border border-transparent"
                    )}
                  >
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${situation.color}15` }}
                    >
                      <Icon className="w-5 h-5" style={{ color: situation.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {isRussian ? situation.title_ru : situation.title_en}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {situation.code}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={situation.is_active ? 'default' : 'secondary'}>
                        {situation.is_active ? 'Active' : 'Off'}
                      </Badge>
                    </div>
                  </button>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Selected Situation Details */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">
              {selectedSituation
                ? isRussian
                  ? selectedSituation.title_ru
                  : selectedSituation.title_en
                : isRussian
                ? 'Выберите ситуацию'
                : 'Select a situation'}
            </CardTitle>
            {selectedSituation && (
              <div className="flex items-center gap-2">
                <Label htmlFor="active-toggle" className="text-sm">
                  Active
                </Label>
                <Switch
                  id="active-toggle"
                  checked={selectedSituation.is_active}
                  onCheckedChange={() => handleToggleActive(selectedSituation)}
                />
              </div>
            )}
          </CardHeader>
          <CardContent>
            {selectedSituation ? (
              <div className="space-y-6">
                {/* Info */}
                <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                  <div className="flex items-center gap-2">
                    <Settings2 className="w-4 h-4" />
                    <span className="text-sm font-medium">Configuration</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Code:</span>{' '}
                      <code className="bg-background px-1 rounded">{selectedSituation.code}</code>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Priority:</span>{' '}
                      {selectedSituation.priority}
                    </div>
                  </div>
                </div>

                {/* Mappings */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Link2 className="w-4 h-4" />
                      <span className="font-medium">
                        {isRussian ? 'Привязанные элементы' : 'Linked Items'}
                      </span>
                      <Badge variant="outline">{mappings?.length || 0}</Badge>
                    </div>

                    <Dialog open={isAddMappingOpen} onOpenChange={setIsAddMappingOpen}>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline">
                          <Plus className="w-4 h-4 mr-1" />
                          Add
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add Entity Mapping</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 pt-4">
                          <div className="space-y-2">
                            <Label>Entity Type</Label>
                            <Select
                              value={newMapping.entity_type}
                              onValueChange={(v) =>
                                setNewMapping((m) => ({ ...m, entity_type: v }))
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {ENTITY_TYPES.map((type) => (
                                  <SelectItem key={type.value} value={type.value}>
                                    {type.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Entity ID (UUID)</Label>
                            <Input
                              placeholder="e.g. 8d45f26a-c87c-4f44-8a6e-..."
                              value={newMapping.entity_id}
                              onChange={(e) =>
                                setNewMapping((m) => ({ ...m, entity_id: e.target.value }))
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Weight: {newMapping.weight}%</Label>
                            <Slider
                              value={[newMapping.weight]}
                              onValueChange={([v]) =>
                                setNewMapping((m) => ({ ...m, weight: v }))
                              }
                              min={0}
                              max={100}
                              step={5}
                            />
                          </div>
                          {/* Role Scope Selection */}
                          <div className="space-y-2">
                            <Label className="flex items-center gap-2">
                              <Users className="w-4 h-4" />
                              Visible to Roles
                            </Label>
                            <div className="flex flex-wrap gap-2">
                              {ROLE_SCOPES.map((role) => (
                                <label
                                  key={role.value}
                                  className="flex items-center gap-2 cursor-pointer"
                                >
                                  <Checkbox
                                    checked={newMapping.role_scope.includes(role.value)}
                                    onCheckedChange={(checked) => {
                                      setNewMapping((m) => ({
                                        ...m,
                                        role_scope: checked
                                          ? [...m.role_scope, role.value]
                                          : m.role_scope.filter((r) => r !== role.value),
                                      }));
                                    }}
                                  />
                                  <span className={cn('text-xs px-2 py-0.5 rounded', role.color)}>
                                    {role.label}
                                  </span>
                                </label>
                              ))}
                            </div>
                          </div>
                          <Button className="w-full" onClick={handleAddMapping}>
                            Add Mapping
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>

                  {/* Mappings list */}
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {mappings?.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        {isRussian
                          ? 'Нет привязанных элементов'
                          : 'No linked items yet'}
                      </p>
                    ) : (
                      mappings?.map((mapping) => (
                        <div
                          key={mapping.id}
                          className="flex flex-col gap-2 p-3 rounded-lg border bg-card"
                        >
                          <div className="flex items-center gap-3">
                            <Badge variant="outline">{mapping.entity_type}</Badge>
                            <code className="text-xs flex-1 truncate">
                              {mapping.entity_id}
                            </code>
                            <div className="flex items-center gap-2 w-32">
                              <Slider
                                value={[mapping.weight]}
                                onValueChange={([v]) =>
                                  handleUpdateWeight(mapping.id, v)
                                }
                                min={0}
                                max={100}
                                step={5}
                                className="flex-1"
                              />
                              <span className="text-xs w-8">{mapping.weight}%</span>
                            </div>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleDeleteMapping(mapping.id)}
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                          {/* Role Scope Display & Edit */}
                          <div className="flex items-center gap-2 pl-2">
                            <Users className="w-3 h-3 text-muted-foreground" />
                            <div className="flex flex-wrap gap-1">
                              {ROLE_SCOPES.map((role) => {
                                const isActive = mapping.role_scope?.includes(role.value) ?? true;
                                return (
                                  <button
                                    key={role.value}
                                    onClick={() => {
                                      const currentScope = mapping.role_scope || ['guest', 'resident', 'owner', 'investor'];
                                      const newScope = isActive
                                        ? currentScope.filter((r) => r !== role.value)
                                        : [...currentScope, role.value];
                                      if (newScope.length > 0) {
                                        handleUpdateRoleScope(mapping.id, newScope as LifeOSRole[]);
                                      }
                                    }}
                                    className={cn(
                                      'text-[10px] px-1.5 py-0.5 rounded transition-opacity',
                                      role.color,
                                      !isActive && 'opacity-30'
                                    )}
                                  >
                                    {role.label}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-12">
                {isRussian
                  ? 'Выберите ситуацию слева для управления'
                  : 'Select a situation from the left to manage'}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
