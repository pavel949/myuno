import { useLanguage } from '@/contexts/LanguageContext';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '@/hooks/usePropertyFinancials';
import { useCompanyCategorySettings, useToggleCategorySetting, useInitCategorySettings, useUpdateCategoryOverrides, useBulkToggleCategorySettings } from '@/hooks/useCompanyCategorySettings';
import { useFinancialCategories, useCreateFinancialCategory } from '@/hooks/useFinancialCategories';
import {
  getCategoryDefaults, CLASS_LABELS, GROUP_LABELS, ALLOCATION_LABELS, CLASS_COLORS, GROUP_ORDER,
  type CategoryClass, type CategoryGroup, type AllocationMethod,
} from '@/lib/categoryDefaults';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Loader2, Plus, Check, X, ChevronDown, ChevronRight, Settings2, Pencil } from 'lucide-react';
import { useState, useMemo, useCallback, memo } from 'react';
import { cn } from '@/lib/utils';
import type { CategorySetting } from '@/hooks/useCompanyCategorySettings';

// ─── Category Row (memoized) ─────────────────────────────────────────────
const CategoryRow = memo(function CategoryRow({
  code, labelEn, labelRu, isEnabled, type, isRu, isPending,
  onToggle, overrides, onOverride,
}: {
  code: string; labelEn: string; labelRu: string;
  isEnabled: boolean; type: 'expense' | 'income';
  isRu: boolean; isPending: boolean;
  onToggle: () => void;
  overrides: CategorySetting | undefined;
  onOverride: (code: string, field: string, value: unknown) => void;
}) {
  const [open, setOpen] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [editNameEn, setEditNameEn] = useState('');
  const [editNameRu, setEditNameRu] = useState('');
  const defaults = getCategoryDefaults(code, type);

  const effectiveClass = overrides?.category_class || defaults.class;
  const effectiveGroup = overrides?.category_group || defaults.group;
  const effectiveProfit = overrides?.affects_net_profit ?? defaults.affectsProfit;
  const effectiveTax = overrides?.is_tax_deductible ?? defaults.taxDeductible;
  const effectiveAlloc = overrides?.allocation_method || defaults.allocation;

  const displayEn = overrides?.custom_name_en || labelEn;
  const displayRu = overrides?.custom_name_ru || labelRu;

  const startEditName = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditNameEn(displayEn);
    setEditNameRu(displayRu);
    setEditingName(true);
  };

  const saveName = () => {
    if (editNameEn.trim()) {
      onOverride(code, 'custom_name_en', editNameEn.trim() === labelEn ? null : editNameEn.trim());
      onOverride(code, 'custom_name_ru', editNameRu.trim() === labelRu ? null : editNameRu.trim());
    }
    setEditingName(false);
  };

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className={cn(
        'rounded-none transition-colors border border-transparent',
        open && 'border-border bg-muted/30',
        !isEnabled && 'opacity-40',
      )}>
        <div className="flex items-center gap-2 py-1.5 px-2.5 hover:bg-muted/50 rounded-none">
          <CollapsibleTrigger asChild>
            <button type="button" className="shrink-0 p-0.5 text-muted-foreground hover:text-foreground transition-colors">
              {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
            </button>
          </CollapsibleTrigger>

          {editingName ? (
            <div className="flex items-center gap-1.5 flex-1 mr-1" onClick={e => e.stopPropagation()}>
              <Input
                value={isRu ? editNameRu : editNameEn}
                onChange={e => isRu ? setEditNameRu(e.target.value) : setEditNameEn(e.target.value)}
                className="h-7 text-sm px-2 flex-1"
                autoFocus
                onKeyDown={e => { if (e.key === 'Enter') saveName(); if (e.key === 'Escape') setEditingName(false); }}
              />
              <button type="button" onClick={saveName} className="p-0.5 text-primary hover:text-primary/80">
                <Check className="h-3.5 w-3.5" />
              </button>
              <button type="button" onClick={() => setEditingName(false)} className="p-0.5 text-muted-foreground hover:text-foreground">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1 flex-1 mr-1 group/name">
              <span className="text-sm text-foreground truncate">
                {isRu ? displayRu : displayEn}
              </span>
              <button
                type="button"
                onClick={startEditName}
                className="p-0.5 opacity-0 group-hover/name:opacity-100 text-muted-foreground hover:text-foreground transition-opacity shrink-0"
              >
                <Pencil className="h-3 w-3" />
              </button>
            </div>
          )}

          <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0 h-5 font-normal border', CLASS_COLORS[effectiveClass as CategoryClass] || '')}>
            {isRu ? CLASS_LABELS[effectiveClass as CategoryClass]?.ru : CLASS_LABELS[effectiveClass as CategoryClass]?.en}
          </Badge>
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 font-normal text-muted-foreground">
            {isRu ? GROUP_LABELS[effectiveGroup as CategoryGroup]?.ru : GROUP_LABELS[effectiveGroup as CategoryGroup]?.en}
          </Badge>

          <Switch
            checked={isEnabled}
            onCheckedChange={onToggle}
            disabled={isPending}
            className="shrink-0"
          />
        </div>

        <CollapsibleContent>
          <div className="px-3 pb-3 pt-1 space-y-3">
            {/* Inline name edit for both languages */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-[11px] text-muted-foreground">Name (EN)</Label>
                <Input
                  value={overrides?.custom_name_en || labelEn}
                  onChange={e => onOverride(code, 'custom_name_en', e.target.value === labelEn ? null : e.target.value)}
                  className="h-8 text-xs mt-1"
                />
              </div>
              <div>
                <Label className="text-[11px] text-muted-foreground">Название (RU)</Label>
                <Input
                  value={overrides?.custom_name_ru || labelRu}
                  onChange={e => onOverride(code, 'custom_name_ru', e.target.value === labelRu ? null : e.target.value)}
                  className="h-8 text-xs mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-[11px] text-muted-foreground">{isRu ? 'Тип затрат' : 'Cost type'}</Label>
                <Select value={effectiveClass} onValueChange={v => onOverride(code, 'category_class', v)}>
                  <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(CLASS_LABELS) as CategoryClass[]).map(k => (
                      <SelectItem key={k} value={k} className="text-xs">{isRu ? CLASS_LABELS[k].ru : CLASS_LABELS[k].en}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-[11px] text-muted-foreground">{isRu ? 'Группа' : 'Group'}</Label>
                <Select value={effectiveGroup} onValueChange={v => onOverride(code, 'category_group', v)}>
                  <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {GROUP_ORDER.map(k => (
                      <SelectItem key={k} value={k} className="text-xs">{isRu ? GROUP_LABELS[k].ru : GROUP_LABELS[k].en}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-[11px] text-muted-foreground">{isRu ? 'Распределение' : 'Allocation'}</Label>
                <Select value={effectiveAlloc} onValueChange={v => onOverride(code, 'allocation_method', v)}>
                  <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(ALLOCATION_LABELS) as AllocationMethod[]).map(k => (
                      <SelectItem key={k} value={k} className="text-xs">{isRu ? ALLOCATION_LABELS[k].ru : ALLOCATION_LABELS[k].en}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <Label className="text-[11px] text-muted-foreground">{isRu ? 'Влияет на P&L' : 'Affects P&L'}</Label>
                  <Switch checked={effectiveProfit} onCheckedChange={v => onOverride(code, 'affects_net_profit', v)} className="scale-75" />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-[11px] text-muted-foreground">{isRu ? 'Налоговый вычет' : 'Tax deductible'}</Label>
                  <Switch checked={effectiveTax} onCheckedChange={v => onOverride(code, 'is_tax_deductible', v)} className="scale-75" />
                </div>
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
});

// ─── Custom Category Row with edit ───────────────────────────────────────
const CustomCategoryRow = memo(function CustomCategoryRow({
  cat, isRu, onEdit,
}: {
  cat: { code: string; name_en: string; name_ru: string; category_class: string };
  isRu: boolean;
  onEdit: (cat: { code: string; name_en: string; name_ru: string }) => void;
}) {
  return (
    <div className="flex items-center justify-between py-1.5 px-2.5 rounded-none hover:bg-muted/50 group/custom">
      <div className="flex items-center gap-1 flex-1 truncate">
        <span className="text-sm text-foreground truncate">{isRu ? cat.name_ru : cat.name_en}</span>
        <button
          type="button"
          onClick={() => onEdit(cat)}
          className="p-0.5 opacity-0 group-hover/custom:opacity-100 text-muted-foreground hover:text-foreground transition-opacity shrink-0"
        >
          <Pencil className="h-3 w-3" />
        </button>
      </div>
      <div className="flex items-center gap-1.5">
        <Badge variant="outline" className={cn('text-[10px] px-1.5 py-0 h-5 font-normal border', CLASS_COLORS[cat.category_class as CategoryClass] || '')}>
          {isRu ? CLASS_LABELS[cat.category_class as CategoryClass]?.ru : CLASS_LABELS[cat.category_class as CategoryClass]?.en}
        </Badge>
        <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
      </div>
    </div>
  );
});

// ─── Group header (memoized) ─────────────────────────────────────────────
const GroupSection = memo(function GroupSection({
  group, cats, type, isRu, enabledCodes, settingsMap, isPending, onToggle, onBulkToggle, onOverride,
}: {
  group: CategoryGroup;
  cats: { value: string; labelEn: string; labelRu: string }[];
  type: 'expense' | 'income';
  isRu: boolean;
  enabledCodes: Set<string> | null;
  settingsMap: Map<string, CategorySetting>;
  isPending: boolean;
  onToggle: (code: string, enabled: boolean) => void;
  onBulkToggle: (codes: string[], enable: boolean) => void;
  onOverride: (code: string, field: string, value: unknown) => void;
}) {
  const enabledInGroup = cats.filter(c => enabledCodes ? enabledCodes.has(c.value) : true).length;

  return (
    <div className="space-y-0.5">
      <div className="flex items-center justify-between py-1.5 px-1">
        <div className="flex items-center gap-2">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            {isRu ? GROUP_LABELS[group].ru : GROUP_LABELS[group].en}
          </h4>
          <span className="text-[10px] text-muted-foreground/60">{enabledInGroup}/{cats.length}</span>
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" className="h-6 text-[10px] px-1.5 text-muted-foreground"
            onClick={() => onBulkToggle(cats.map(c => c.value), true)} disabled={isPending}>
            <Check className="h-2.5 w-2.5 mr-0.5" />{isRu ? 'Все' : 'All'}
          </Button>
          <Button variant="ghost" size="sm" className="h-6 text-[10px] px-1.5 text-muted-foreground"
            onClick={() => onBulkToggle(cats.map(c => c.value), false)} disabled={isPending}>
            <X className="h-2.5 w-2.5 mr-0.5" />{isRu ? 'Нет' : 'None'}
          </Button>
        </div>
      </div>
      {cats.map(cat => {
        const isEnabled = enabledCodes ? enabledCodes.has(cat.value) : true;
        return (
          <CategoryRow
            key={cat.value}
            code={cat.value}
            labelEn={cat.labelEn}
            labelRu={cat.labelRu}
            isEnabled={isEnabled}
            type={type}
            isRu={isRu}
            isPending={isPending}
            onToggle={() => onToggle(cat.value, isEnabled)}
            overrides={settingsMap.get(cat.value)}
            onOverride={onOverride}
          />
        );
      })}
    </div>
  );
});

// ─── Main section per type ──────────────────────────────────────────────
function CategorySection({ type }: { type: 'expense' | 'income' }) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const standardCategories = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
  const { enabledCodes, hasSettings, isLoading, settings } = useCompanyCategorySettings(type);
  const toggleMutation = useToggleCategorySetting();
  const bulkToggleMutation = useBulkToggleCategorySettings();
  const updateOverrides = useUpdateCategoryOverrides();
  const initMutation = useInitCategorySettings();
  const { categories } = useFinancialCategories(type);
  const createCategory = useCreateFinancialCategory();

  const [showAdd, setShowAdd] = useState(false);
  const [newNameEn, setNewNameEn] = useState('');
  const [newNameRu, setNewNameRu] = useState('');
  const [newClass, setNewClass] = useState<CategoryClass>('variable');
  const [newGroup, setNewGroup] = useState<CategoryGroup>('operations');
  const [newAffectsProfit, setNewAffectsProfit] = useState(true);
  const [newTaxDeductible, setNewTaxDeductible] = useState(false);

  // Edit custom category dialog
  const [editCustom, setEditCustom] = useState<{ code: string; name_en: string; name_ru: string } | null>(null);
  const [editCustomNameEn, setEditCustomNameEn] = useState('');
  const [editCustomNameRu, setEditCustomNameRu] = useState('');

  const handleInit = useCallback(() => initMutation.mutate(type), [initMutation, type]);

  const handleToggle = useCallback((code: string, currentEnabled: boolean) => {
    toggleMutation.mutate({ category_type: type, category_code: code, is_enabled: !currentEnabled });
  }, [toggleMutation, type]);

  const handleBulkToggle = useCallback((codes: string[], enable: boolean) => {
    const codesToChange = codes.filter(code => {
      const isEnabled = enabledCodes ? enabledCodes.has(code) : true;
      return isEnabled !== enable;
    });
    if (codesToChange.length === 0) return;
    bulkToggleMutation.mutate({ category_type: type, codes: codesToChange, is_enabled: enable });
  }, [bulkToggleMutation, type, enabledCodes]);

  const handleOverride = useCallback((code: string, field: string, value: unknown) => {
    updateOverrides.mutate({
      category_type: type,
      category_code: code,
      [field]: value,
    });
  }, [updateOverrides, type]);

  const handleAddCustom = useCallback(async () => {
    if (!newNameEn.trim()) return;
    const code = newNameEn.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_');
    await createCategory.mutateAsync({
      category_type: type,
      code,
      name_en: newNameEn.trim(),
      name_ru: newNameRu.trim() || newNameEn.trim(),
      category_class: newClass,
      category_group: newGroup,
      affects_net_profit: newAffectsProfit,
      is_tax_deductible: newTaxDeductible,
    });
    setShowAdd(false);
    setNewNameEn('');
    setNewNameRu('');
    setNewClass('variable');
    setNewGroup('operations');
    setNewAffectsProfit(true);
    setNewTaxDeductible(false);
  }, [newNameEn, newNameRu, newClass, newGroup, newAffectsProfit, newTaxDeductible, createCategory, type]);

  const handleEditCustom = useCallback((cat: { code: string; name_en: string; name_ru: string }) => {
    setEditCustom(cat);
    setEditCustomNameEn(cat.name_en);
    setEditCustomNameRu(cat.name_ru);
  }, []);

  const handleSaveCustomEdit = useCallback(async () => {
    if (!editCustom || !editCustomNameEn.trim()) return;
    // Use the overrides mechanism for custom categories too
    handleOverride(editCustom.code, 'custom_name_en', editCustomNameEn.trim());
    handleOverride(editCustom.code, 'custom_name_ru', editCustomNameRu.trim());
    setEditCustom(null);
  }, [editCustom, editCustomNameEn, editCustomNameRu, handleOverride]);

  const groupedCategories = useMemo(() => {
    const map = new Map<CategoryGroup, typeof standardCategories>();
    for (const cat of standardCategories) {
      const defaults = getCategoryDefaults(cat.value, type);
      const grp = defaults.group;
      if (!map.has(grp)) map.set(grp, []);
      map.get(grp)!.push(cat);
    }
    return map;
  }, [standardCategories, type]);

  const settingsMap = useMemo(() => {
    return new Map((settings || []).map(s => [s.category_code, s]));
  }, [settings]);

  const customCats = useMemo(() => categories.filter(c => c.isCustom), [categories]);

  const { enabledCount, classCount } = useMemo(() => {
    const count = enabledCodes ? enabledCodes.size : standardCategories.length;
    const cc: Record<string, number> = {};
    for (const cat of standardCategories) {
      const d = getCategoryDefaults(cat.value, type);
      const isOn = enabledCodes ? enabledCodes.has(cat.value) : true;
      if (isOn) cc[d.class] = (cc[d.class] || 0) + 1;
    }
    return { enabledCount: count, classCount: cc };
  }, [standardCategories, enabledCodes, type]);

  if (isLoading) {
    return <div className="flex items-center gap-2 py-4 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> {isRu ? 'Загрузка...' : 'Loading...'}</div>;
  }

  const isMutating = toggleMutation.isPending || bulkToggleMutation.isPending;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Settings2 className="h-4 w-4 text-muted-foreground" />
            {type === 'expense'
              ? (isRu ? 'Статьи расходов' : 'Expense Categories')
              : (isRu ? 'Статьи доходов' : 'Income Categories')
            }
          </h3>
          {hasSettings && (
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-xs text-muted-foreground">
                {isRu ? `${enabledCount} из ${standardCategories.length} активных` : `${enabledCount} of ${standardCategories.length} active`}
              </span>
              <span className="text-muted-foreground/30">•</span>
              {Object.entries(classCount).map(([cls, count]) => (
                <Badge key={cls} variant="outline" className={cn('text-[10px] px-1.5 py-0 h-4 font-normal border', CLASS_COLORS[cls as CategoryClass] || '')}>
                  {count} {isRu ? CLASS_LABELS[cls as CategoryClass]?.ru?.toLowerCase() : CLASS_LABELS[cls as CategoryClass]?.en?.toLowerCase()}
                </Badge>
              ))}
            </div>
          )}
        </div>
        {!hasSettings && (
          <Button variant="outline" size="sm" onClick={handleInit} disabled={initMutation.isPending}>
            {initMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : (isRu ? 'Настроить' : 'Configure')}
          </Button>
        )}
      </div>

      {!hasSettings && (
        <p className="text-xs text-muted-foreground">
          {isRu
            ? 'Все категории активны по умолчанию. Нажмите "Настроить", чтобы выбрать нужные и настроить классификацию.'
            : 'All categories are active by default. Click "Configure" to customize selection and classification.'}
        </p>
      )}

      {hasSettings && (
        <div className="space-y-4">
          {GROUP_ORDER.filter(g => groupedCategories.has(g)).map(group => (
            <GroupSection
              key={group}
              group={group}
              cats={groupedCategories.get(group)!}
              type={type}
              isRu={isRu}
              enabledCodes={enabledCodes}
              settingsMap={settingsMap}
              isPending={isMutating}
              onToggle={handleToggle}
              onBulkToggle={handleBulkToggle}
              onOverride={handleOverride}
            />
          ))}
        </div>
      )}

      {customCats.length > 0 && (
        <div className="pt-2 border-t border-border">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
            {isRu ? 'Кастомные категории' : 'Custom Categories'}
          </h4>
          <div className="space-y-0.5">
            {customCats.map(cat => (
              <CustomCategoryRow
                key={cat.code}
                cat={cat}
                isRu={isRu}
                onEdit={handleEditCustom}
              />
            ))}
          </div>
        </div>
      )}

      <Button variant="outline" size="sm" onClick={() => setShowAdd(true)} className="gap-1.5 h-8">
        <Plus className="h-3.5 w-3.5" />
        {isRu ? 'Добавить свою' : 'Add custom'}
      </Button>

      {/* Add custom category dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>
              {isRu
                ? type === 'expense' ? 'Новая статья расхода' : 'Новая статья дохода'
                : type === 'expense' ? 'New expense category' : 'New income category'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">{isRu ? 'Название (EN)' : 'Name (EN)'}</Label>
                <Input value={newNameEn} onChange={e => setNewNameEn(e.target.value)} placeholder="e.g. Pool Maintenance" className="h-9 mt-1" />
              </div>
              <div>
                <Label className="text-xs">{isRu ? 'Название (RU)' : 'Name (RU)'}</Label>
                <Input value={newNameRu} onChange={e => setNewNameRu(e.target.value)} placeholder="напр. Обслуживание бассейна" className="h-9 mt-1" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">{isRu ? 'Тип затрат' : 'Cost type'}</Label>
                <Select value={newClass} onValueChange={v => setNewClass(v as CategoryClass)}>
                  <SelectTrigger className="h-9 text-xs mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(CLASS_LABELS) as CategoryClass[]).map(k => (
                      <SelectItem key={k} value={k} className="text-xs">{isRu ? CLASS_LABELS[k].ru : CLASS_LABELS[k].en}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">{isRu ? 'Группа' : 'Group'}</Label>
                <Select value={newGroup} onValueChange={v => setNewGroup(v as CategoryGroup)}>
                  <SelectTrigger className="h-9 text-xs mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {GROUP_ORDER.map(k => (
                      <SelectItem key={k} value={k} className="text-xs">{isRu ? GROUP_LABELS[k].ru : GROUP_LABELS[k].en}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center justify-between py-1">
              <Label className="text-xs">{isRu ? 'Влияет на P&L' : 'Affects P&L'}</Label>
              <Switch checked={newAffectsProfit} onCheckedChange={setNewAffectsProfit} />
            </div>
            <div className="flex items-center justify-between py-1">
              <Label className="text-xs">{isRu ? 'Налоговый вычет' : 'Tax deductible'}</Label>
              <Switch checked={newTaxDeductible} onCheckedChange={setNewTaxDeductible} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowAdd(false)}>{isRu ? 'Отмена' : 'Cancel'}</Button>
            <Button size="sm" disabled={!newNameEn.trim() || createCategory.isPending} onClick={handleAddCustom}>
              {createCategory.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : (isRu ? 'Добавить' : 'Add')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit custom category dialog */}
      <Dialog open={!!editCustom} onOpenChange={open => !open && setEditCustom(null)}>
        <DialogContent className="sm:max-w-[380px]">
          <DialogHeader>
            <DialogTitle>{isRu ? 'Редактировать категорию' : 'Edit category'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label className="text-xs">Name (EN)</Label>
              <Input value={editCustomNameEn} onChange={e => setEditCustomNameEn(e.target.value)} className="h-9 mt-1" />
            </div>
            <div>
              <Label className="text-xs">Название (RU)</Label>
              <Input value={editCustomNameRu} onChange={e => setEditCustomNameRu(e.target.value)} className="h-9 mt-1" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setEditCustom(null)}>{isRu ? 'Отмена' : 'Cancel'}</Button>
            <Button size="sm" disabled={!editCustomNameEn.trim()} onClick={handleSaveCustomEdit}>
              {isRu ? 'Сохранить' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function FinanceCategorySettings() {
  return (
    <div className="space-y-8">
      <CategorySection type="expense" />
      <CategorySection type="income" />
    </div>
  );
}
