import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { MODULES, useMemberPermissions, useUpdateMemberPermission, useCanManagePermissions, type TeamPermission } from '@/hooks/useTeamPermissions';
import { SUB_PERMISSIONS, PERMISSION_PRESETS, type SubPermissionsMap } from '@/lib/permissionPresets';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ResponsiveModal } from '@/components/ui/responsive-modal';
import { ShieldCheck, ChevronDown, Briefcase, Zap } from 'lucide-react';
import { useUpdateStaffMember } from '@/hooks/useStaffMembers';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string | null;
  userName: string;
  customTitle?: string;
  staffId?: string;
}

export function MemberPermissionsSheet({ open, onOpenChange, userId, userName, customTitle, staffId }: Props) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const t = (en: string, ru: string) => (isRu ? ru : en);
  const canManage = useCanManagePermissions();

  const { data: permissions = [], isLoading } = useMemberPermissions(userId);
  const updatePermission = useUpdateMemberPermission();
  const updateStaff = useUpdateStaffMember();

  const [titleValue, setTitleValue] = useState(customTitle ?? '');
  const [openModules, setOpenModules] = useState<Record<string, boolean>>({});

  const getPerm = (moduleKey: string): TeamPermission | undefined =>
    permissions.find((p) => p.module === moduleKey);

  const handleModuleToggle = (moduleKey: string, enabled: boolean) => {
    if (!userId) return;
    const current = getPerm(moduleKey);
    const modSubs = SUB_PERMISSIONS.find(m => m.moduleKey === moduleKey);
    const subPerms: SubPermissionsMap = {};
    if (modSubs) {
      modSubs.subs.forEach(s => {
        subPerms[s.key] = enabled;
      });
    }
    updatePermission.mutate({
      userId,
      module: moduleKey,
      can_view: enabled,
      can_edit: enabled ? (current?.can_edit ?? false) : false,
      can_export: enabled ? (current?.can_export ?? false) : false,
      sub_permissions: enabled ? (current?.sub_permissions ?? subPerms) : subPerms,
    });
  };

  const handleSubToggle = (moduleKey: string, subKey: string, value: boolean) => {
    if (!userId) return;
    const current = getPerm(moduleKey);
    const currentSubs = (current?.sub_permissions ?? {}) as SubPermissionsMap;
    const newSubs = { ...currentSubs, [subKey]: value };
    const anyEnabled = Object.values(newSubs).some(v => v);
    updatePermission.mutate({
      userId,
      module: moduleKey,
      can_view: anyEnabled ? true : (current?.can_view ?? false),
      can_edit: current?.can_edit ?? false,
      can_export: current?.can_export ?? false,
      sub_permissions: newSubs,
    });
  };

  const handleEditToggle = (moduleKey: string, value: boolean) => {
    if (!userId) return;
    const current = getPerm(moduleKey);
    updatePermission.mutate({
      userId,
      module: moduleKey,
      can_view: current?.can_view ?? true,
      can_edit: value,
      can_export: current?.can_export ?? false,
      sub_permissions: (current?.sub_permissions ?? {}) as SubPermissionsMap,
    });
  };

  const handleExportToggle = (moduleKey: string, value: boolean) => {
    if (!userId) return;
    const current = getPerm(moduleKey);
    updatePermission.mutate({
      userId,
      module: moduleKey,
      can_view: current?.can_view ?? true,
      can_edit: current?.can_edit ?? false,
      can_export: value,
      sub_permissions: (current?.sub_permissions ?? {}) as SubPermissionsMap,
    });
  };

  const applyPreset = (presetKey: string) => {
    if (!userId) return;
    const preset = PERMISSION_PRESETS.find(p => p.key === presetKey);
    if (!preset) return;
    for (const mod of MODULES) {
      const mp = preset.modules[mod.key];
      if (mp) {
        updatePermission.mutate({
          userId,
          module: mod.key,
          can_view: mp.can_view,
          can_edit: mp.can_edit,
          can_export: mp.can_export,
          sub_permissions: mp.sub_permissions,
        });
      }
    }
  };

  const saveTitle = () => {
    if (!staffId) return;
    updateStaff.mutate({ id: staffId, custom_title: titleValue || undefined } as any);
  };

  const toggleModule = (key: string) => {
    setOpenModules(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={onOpenChange}
      title={t('Permissions', 'Права доступа')}
      description={userName}
      icon={<ShieldCheck className="h-5 w-5 text-primary" />}
      size="lg"
    >

        {/* Read-only notice for non-directors */}
        {!canManage && (
          <div className="mb-4 p-3 rounded-none bg-warning/10 border border-warning/30 text-sm text-warning-foreground">
            <p className="font-medium">{t('View Only', 'Только просмотр')}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t('Only directors can change permissions', 'Только директор может изменять права доступа')}
            </p>
          </div>
        )}

        {/* Custom title */}
        {staffId && canManage && (
          <div className="mb-5 space-y-2">
            <Label className="flex items-center gap-1.5 text-sm">
              <Briefcase className="h-3.5 w-3.5" />
              {t('Job Title', 'Должность')}
            </Label>
            <div className="flex gap-2">
              <Input
                value={titleValue}
                onChange={(e) => setTitleValue(e.target.value)}
                placeholder={t('e.g. Booking Coordinator', 'напр. Координатор бронирований')}
                className="flex-1"
              />
              <Button size="sm" variant="outline" onClick={saveTitle} disabled={updateStaff.isPending}>
                {t('Save', 'Сохр.')}
              </Button>
            </div>
          </div>
        )}

        {/* Presets — only for directors */}
        {canManage && (
          <div className="mb-5">
            <Label className="flex items-center gap-1.5 text-sm mb-2">
              <Zap className="h-3.5 w-3.5" />
              {t('Quick Presets', 'Быстрые шаблоны')}
            </Label>
            <div className="flex flex-wrap gap-1.5">
              {PERMISSION_PRESETS.map(preset => (
                <Button
                  key={preset.key}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => applyPreset(preset.key)}
                  title={isRu ? preset.descRu : preset.descEn}
                >
                  {isRu ? preset.labelRu : preset.labelEn}
                </Button>
              ))}
            </div>
          </div>
        )}


        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-14 w-full rounded-none" />
            ))}
          </div>
        ) : (
          <div className="space-y-1.5">
            {MODULES.map((mod) => {
              const perm = getPerm(mod.key);
              const canView = perm?.can_view ?? false;
              const canEdit = perm?.can_edit ?? false;
              const canExport = perm?.can_export ?? false;
              const subPerms = (perm?.sub_permissions ?? {}) as SubPermissionsMap;
              const moduleSubs = SUB_PERMISSIONS.find(m => m.moduleKey === mod.key);
              const isOpen = openModules[mod.key] ?? false;

              return (
                <Collapsible key={mod.key} open={isOpen} onOpenChange={() => toggleModule(mod.key)}>
                  <div className="rounded-none border border-border/60 overflow-hidden">
                    {/* Module header */}
                    <div className="flex items-center gap-2 px-3 py-2.5 bg-muted/30">
                      <Switch
                        checked={canView}
                        onCheckedChange={(v) => handleModuleToggle(mod.key, v)}
                        className="scale-90"
                      />
                      <CollapsibleTrigger className="flex-1 flex items-center justify-between min-w-0">
                        <span className="text-sm font-medium">
                          {isRu ? mod.labelRu : mod.labelEn}
                        </span>
                        <div className="flex items-center gap-2">
                          {canView && (
                            <div className="flex gap-1">
                              {canEdit && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{t('Edit', 'Ред.')}</Badge>}
                              {canExport && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{t('Exp', 'Экс.')}</Badge>}
                            </div>
                          )}
                          <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                        </div>
                      </CollapsibleTrigger>
                    </div>

                    {/* Sub-permissions */}
                    <CollapsibleContent>
                      <div className="px-3 py-2.5 space-y-2.5 border-t border-border/40">
                        {/* Edit / Export toggles */}
                        <div className="flex gap-4 pb-2 border-b border-border/30">
                          <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                            <Checkbox
                              checked={canEdit}
                              onCheckedChange={(v) => handleEditToggle(mod.key, !!v)}
                              disabled={!canView || !canManage}
                            />
                            {t('Can Edit', 'Редактирование')}
                          </label>
                          <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                            <Checkbox
                              checked={canExport}
                              onCheckedChange={(v) => handleExportToggle(mod.key, !!v)}
                              disabled={!canView || !canManage}
                            />
                            {t('Can Export', 'Экспорт')}
                          </label>
                        </div>

                        {/* Granular sub-permissions */}
                        {moduleSubs?.subs.map(sub => (
                          <label key={sub.key} className="flex items-center gap-2 text-sm cursor-pointer">
                            <Checkbox
                              checked={subPerms[sub.key] ?? false}
                              onCheckedChange={(v) => handleSubToggle(mod.key, sub.key, !!v)}
                              disabled={!canView || !canManage}
                            />
                            <span className={!canView ? 'text-muted-foreground/50' : ''}>
                              {isRu ? sub.labelRu : sub.labelEn}
                            </span>
                          </label>
                        ))}

                        {!moduleSubs && (
                          <p className="text-xs text-muted-foreground italic">
                            {t('No granular settings for this module', 'Нет детальных настроек для этого модуля')}
                          </p>
                        )}
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              );
            })}
          </div>
        )}
    </ResponsiveModal>
  );
}
