import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useMyCompanyId, DEAL_TYPES, DEAL_TYPE_LABELS, DealType } from '@/hooks/useAgentDeals';
import { useAllPipelineStages, useCreatePipelineStage, useUpdatePipelineStage, useDeletePipelineStage, PipelineStage, getDefaultStagesForDealType } from '@/hooks/useDealPipelineStages';
import { useCrmOptions, useCreateCrmOption, useUpdateCrmOption, useDeleteCrmOption, CrmCustomOption, CrmOptionCategory } from '@/hooks/useCrmSettings';
import { OdooCrmSettingsImportModal } from '@/components/owner/crm/OdooCrmSettingsImportModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Plus, GripVertical, Trash2, Save, Pencil, X, Check, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TAG_COLOR_PALETTE } from '@/hooks/useContactTags';

import { toast } from 'sonner';
// ─── Reusable option list editor ───

function OptionListEditor({
  companyId,
  category,
  isRu,
}: {
  companyId: string;
  category: CrmOptionCategory;
  isRu: boolean;
}) {
  const { data: options = [], isLoading } = useCrmOptions(companyId, category);
  const createOption = useCreateCrmOption();
  const updateOption = useUpdateCrmOption();
  const deleteOption = useDeleteCrmOption();
const [showAdd, setShowAdd] = useState(false);
  const [newItem, setNewItem] = useState({ value: '', label_en: '', label_ru: '', color: '#3b82f6' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState({ label_en: '', label_ru: '', color: '' });

  const handleAdd = async () => {
    const value = newItem.value.trim().toLowerCase().replace(/\s+/g, '_');
    if (!value || !newItem.label_en.trim() || !newItem.label_ru.trim()) {
      toast.error(isRu ? 'Заполните все поля' : 'Fill all fields');
      return;
    }
    try {
      await createOption.mutateAsync({
        company_id: companyId,
        category,
        value,
        label_en: newItem.label_en.trim(),
        label_ru: newItem.label_ru.trim(),
        color: newItem.color,
        icon: null,
        short_en: null,
        short_ru: null,
        probability: null,
        is_system: false,
        is_active: true,
        sort_order: options.length + 1,
      });
      toast(isRu ? 'Добавлено' : 'Added');
      setNewItem({ value: '', label_en: '', label_ru: '', color: '#3b82f6' });
      setShowAdd(false);
    } catch {
      toast.error(isRu ? 'Ошибка (возможно дубликат)' : 'Error (possibly duplicate)');
    }
  };

  const handleDelete = async (opt: CrmCustomOption) => {
    if (opt.is_system) {
      toast.error(isRu ? 'Системный элемент нельзя удалить' : 'Cannot delete system item');
      return;
    }
    try {
      await deleteOption.mutateAsync(opt.id);
      toast(isRu ? 'Удалено' : 'Deleted');
    } catch {
      toast.error(isRu ? 'Ошибка' : 'Error');
    }
  };

  const startEdit = (opt: CrmCustomOption) => {
    setEditingId(opt.id);
    setEditData({ label_en: opt.label_en, label_ru: opt.label_ru, color: opt.color || '#78716c' });
  };

  const handleSaveEdit = async (id: string) => {
    try {
      await updateOption.mutateAsync({ id, label_en: editData.label_en, label_ru: editData.label_ru, color: editData.color });
      setEditingId(null);
      toast(isRu ? 'Сохранено' : 'Saved');
    } catch {
      toast.error(isRu ? 'Ошибка' : 'Error');
    }
  };

  if (isLoading) return <Skeleton className="h-40 w-full rounded-none" />;

  return (
    <div className="space-y-3">
      {options.filter(o => o.is_active).map(opt => (
        <div key={opt.id} className="flex items-center gap-3 p-3 rounded-none border bg-card group">
          <GripVertical className="h-4 w-4 text-muted-foreground shrink-0 opacity-30" />
          <div
            className="h-4 w-4 rounded-full shrink-0 border"
            style={{ backgroundColor: editingId === opt.id ? editData.color : (opt.color || '#78716c') }}
          />
          {editingId === opt.id ? (
            <div className="flex-1 flex items-center gap-2">
              <Input className="h-7 text-xs" value={editData.label_en} onChange={e => setEditData(d => ({ ...d, label_en: e.target.value }))} />
              <Input className="h-7 text-xs" value={editData.label_ru} onChange={e => setEditData(d => ({ ...d, label_ru: e.target.value }))} />
              <Input type="color" className="h-7 w-10 p-0.5" value={editData.color} onChange={e => setEditData(d => ({ ...d, color: e.target.value }))} />
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => handleSaveEdit(opt.id)}>
                <Check className="h-3.5 w-3.5 text-primary" />
              </Button>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setEditingId(null)}>
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          ) : (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{isRu ? opt.label_ru : opt.label_en}</p>
                <p className="text-xs text-muted-foreground">
                  {opt.value}
                  {opt.is_system && <span className="ml-1 text-primary">(system)</span>}
                </p>
              </div>
              <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 h-7 w-7 p-0" onClick={() => startEdit(opt)}>
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              {!opt.is_system && (
                <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 text-destructive h-7 w-7 p-0" onClick={() => handleDelete(opt)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </>
          )}
        </div>
      ))}

      {showAdd ? (
        <div className="border rounded-none p-4 bg-card space-y-3">
          <p className="text-sm font-medium">{isRu ? 'Новый элемент' : 'New Item'}</p>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Key</Label>
              <Input value={newItem.value} onChange={e => setNewItem(s => ({ ...s, value: e.target.value }))} placeholder="e.g. partner" className="h-8 text-xs" />
            </div>
            <div>
              <Label>EN</Label>
              <Input value={newItem.label_en} onChange={e => setNewItem(s => ({ ...s, label_en: e.target.value }))} className="h-8 text-xs" />
            </div>
            <div>
              <Label>RU</Label>
              <Input value={newItem.label_ru} onChange={e => setNewItem(s => ({ ...s, label_ru: e.target.value }))} className="h-8 text-xs" />
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {TAG_COLOR_PALETTE.map(c => (
              <button key={c} onClick={() => setNewItem(s => ({ ...s, color: c }))}
                className={cn('w-6 h-6 rounded-full border-2 transition-transform', newItem.color === c ? 'border-foreground scale-110' : 'border-transparent')}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleAdd} disabled={createOption.isPending}>
              <Save className="h-3.5 w-3.5 mr-1" />
              {isRu ? 'Сохранить' : 'Save'}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setShowAdd(false)}>{isRu ? 'Отмена' : 'Cancel'}</Button>
          </div>
        </div>
      ) : (
        <Button variant="outline" size="sm" onClick={() => setShowAdd(true)} className="w-full">
          <Plus className="h-4 w-4 mr-1" />
          {isRu ? 'Добавить' : 'Add'}
        </Button>
      )}
    </div>
  );
}

// ─── Pipeline stages editor (preserved from original) ───

function StagesEditor({ companyId, isRu }: { companyId: string; isRu: boolean }) {
  const { data: stages = [], isLoading } = useAllPipelineStages(companyId);
  const createStage = useCreatePipelineStage();
  const deleteStage = useDeletePipelineStage();
const [selectedType, setSelectedType] = useState<DealType>('sale');
  const [showAdd, setShowAdd] = useState(false);
  const [newStage, setNewStage] = useState({ stage_key: '', name_en: '', name_ru: '', short_label: '', color: '#6366f1', probability: '0.5' });

  const typeStages = stages.filter(s => s.deal_type === selectedType).sort((a, b) => a.sort_order - b.sort_order);

  const handleAdd = async () => {
    if (!newStage.stage_key || !newStage.name_en || !newStage.name_ru) {
      toast.error(isRu ? 'Заполните все поля' : 'Fill all fields');
      return;
    }
    try {
      await createStage.mutateAsync({
        company_id: companyId,
        deal_type: selectedType,
        stage_key: newStage.stage_key.toLowerCase().replace(/\s+/g, '_'),
        name_en: newStage.name_en,
        name_ru: newStage.name_ru,
        short_label: newStage.short_label || newStage.name_en.slice(0, 4),
        color: newStage.color,
        probability: parseFloat(newStage.probability) || 0,
        sort_order: typeStages.length + 1,
        is_system: false,
        is_active: true,
      });
      toast(isRu ? 'Этап добавлен' : 'Stage added');
      setNewStage({ stage_key: '', name_en: '', name_ru: '', short_label: '', color: '#6366f1', probability: '0.5' });
      setShowAdd(false);
    } catch {
      toast.error(isRu ? 'Ошибка' : 'Error');
    }
  };

  const handleDelete = async (stage: PipelineStage) => {
    if (stage.is_system) {
      toast.error(isRu ? 'Системный этап нельзя удалить' : 'Cannot delete system stage');
      return;
    }
    try {
      await deleteStage.mutateAsync(stage.id);
      toast(isRu ? 'Этап удалён' : 'Stage deleted');
    } catch {
      toast.error(isRu ? 'Ошибка' : 'Error');
    }
  };

  const handleSeedForType = async (dealType: DealType) => {
    try {
      for (const s of getDefaultStagesForDealType(dealType).map((row) => ({ ...row, company_id: companyId }))) {
        await createStage.mutateAsync(s);
      }
      toast(isRu ? 'Стандартные этапы созданы' : 'Default stages created');
    } catch {
      toast.error(isRu ? 'Ошибка' : 'Error');
    }
  };

  if (isLoading) return <Skeleton className="h-40 w-full rounded-none" />;

  return (
    <div className="space-y-4">
      {/* Type tabs */}
      <div className="flex gap-2 overflow-x-auto">
        {DEAL_TYPES.map(dt => (
          <button
            key={dt}
            onClick={() => setSelectedType(dt)}
            className={cn(
              'shrink-0 px-4 py-2 rounded-full text-xs font-medium border transition-colors',
              selectedType === dt ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border text-muted-foreground',
            )}
          >
            {isRu ? DEAL_TYPE_LABELS[dt].ru : DEAL_TYPE_LABELS[dt].en}
          </button>
        ))}
      </div>

      {typeStages.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm text-muted-foreground mb-3">
            {isRu ? `Нет этапов для "${DEAL_TYPE_LABELS[selectedType].ru}"` : `No stages for "${DEAL_TYPE_LABELS[selectedType].en}"`}
          </p>
          <Button variant="outline" size="sm" onClick={() => handleSeedForType(selectedType)}>
            {isRu ? 'Создать стандартные' : 'Create defaults'}
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {typeStages.map(stage => (
            <div key={stage.id} className="flex items-center gap-3 p-3 rounded-none border bg-card group">
              <GripVertical className="h-4 w-4 text-muted-foreground shrink-0 opacity-30" />
              <div className="h-4 w-4 rounded-full shrink-0" style={{ backgroundColor: stage.color }} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{isRu ? stage.name_ru : stage.name_en}</p>
                <p className="text-xs text-muted-foreground">
                  {stage.stage_key} · {Math.round(Number(stage.probability) * 100)}%
                  {stage.is_system && <span className="ml-1 text-primary">(system)</span>}
                </p>
              </div>
              {!stage.is_system && (
                <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 text-destructive h-7 w-7 p-0" onClick={() => handleDelete(stage)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {showAdd ? (
        <div className="border rounded-none p-4 bg-card space-y-3">
          <p className="text-sm font-medium">{isRu ? 'Новый этап' : 'New Stage'}</p>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Key</Label><Input value={newStage.stage_key} onChange={e => setNewStage(s => ({ ...s, stage_key: e.target.value }))} placeholder="proposal" className="h-8 text-xs" /></div>
            <div><Label>{isRu ? 'Цвет' : 'Color'}</Label><Input type="color" value={newStage.color} onChange={e => setNewStage(s => ({ ...s, color: e.target.value }))} className="h-8" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>EN</Label><Input value={newStage.name_en} onChange={e => setNewStage(s => ({ ...s, name_en: e.target.value }))} className="h-8 text-xs" /></div>
            <div><Label>RU</Label><Input value={newStage.name_ru} onChange={e => setNewStage(s => ({ ...s, name_ru: e.target.value }))} className="h-8 text-xs" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>{isRu ? 'Короткое' : 'Short'}</Label><Input value={newStage.short_label} onChange={e => setNewStage(s => ({ ...s, short_label: e.target.value }))} placeholder="4 chars" className="h-8 text-xs" /></div>
            <div><Label>{isRu ? 'Вероятность' : 'Probability'}</Label><Input type="number" step="0.1" min="0" max="1" value={newStage.probability} onChange={e => setNewStage(s => ({ ...s, probability: e.target.value }))} className="h-8 text-xs" /></div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleAdd} disabled={createStage.isPending}><Save className="h-3.5 w-3.5 mr-1" />{isRu ? 'Сохранить' : 'Save'}</Button>
            <Button size="sm" variant="ghost" onClick={() => setShowAdd(false)}>{isRu ? 'Отмена' : 'Cancel'}</Button>
          </div>
        </div>
      ) : (
        <Button variant="outline" size="sm" onClick={() => setShowAdd(true)} className="w-full">
          <Plus className="h-4 w-4 mr-1" />{isRu ? 'Добавить этап' : 'Add Stage'}
        </Button>
      )}
    </div>
  );
}

// ─── Main Page ───

export default function PipelineSettingsPage() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { data: membership, isLoading: membershipLoading } = useMyCompanyId();
  const [showOdooImport, setShowOdooImport] = useState(false);

  if (membershipLoading) {
    return <div className="p-4 space-y-4 max-w-2xl mx-auto"><Skeleton className="h-8 w-48" /><Skeleton className="h-40 w-full rounded-none" /></div>;
  }

  if (!membership || !['owner', 'admin', 'director', 'manager'].includes(membership.role)) {
    return (
      <div className="p-4 text-center text-muted-foreground pt-20 max-w-2xl mx-auto">
        <p>{isRu ? 'Нет доступа. Только владельцы и админы УК.' : 'No access. Owners/admins only.'}</p>
      </div>
    );
  }

  const tabs = [
    { value: 'stages', label: isRu ? 'Этапы сделок' : 'Deal Stages' },
    { value: 'contact_type', label: isRu ? 'Типы контактов' : 'Contact Types' },
    { value: 'lead_source', label: isRu ? 'Источники лидов' : 'Lead Sources' },
    { value: 'deal_type', label: isRu ? 'Типы сделок' : 'Deal Types' },
    { value: 'task_type', label: isRu ? 'Типы задач' : 'Task Types' },
    { value: 'lost_reason', label: isRu ? 'Причины проигрыша' : 'Lost Reasons' },
    { value: 'win_reason', label: isRu ? 'Причины успеха' : 'Win Reasons' },
  ];

  return (
    <div className="px-4 md:px-6 lg:px-8 pt-6 pb-24 md:pb-8 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/mc/sales')} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            {isRu ? 'Назад' : 'Back'}
          </button>
          <h1 className="text-lg font-bold">{isRu ? 'Настройки CRM' : 'CRM Settings'}</h1>
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowOdooImport(true)}>
          <Upload className="h-4 w-4 mr-1" />
          {isRu ? 'Импорт ODOO' : 'Import ODOO'}
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">
        {isRu
          ? 'Настройте этапы воронки, типы контактов, источники лидов и другие параметры CRM под процессы вашей компании.'
          : 'Customize pipeline stages, contact types, lead sources and other CRM parameters for your company processes.'}
      </p>

      <Tabs defaultValue="stages">
        <TabsList className="w-full flex overflow-x-auto h-auto flex-wrap gap-1 bg-muted/50 p-1 rounded-none">
          {tabs.map(tab => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="text-xs flex-1 min-w-fit data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-none"
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="stages" className="mt-4">
          <StagesEditor companyId={membership.company_id} isRu={isRu} />
        </TabsContent>

        <TabsContent value="contact_type" className="mt-4">
          <OptionListEditor companyId={membership.company_id} category="contact_type" isRu={isRu} />
        </TabsContent>

        <TabsContent value="lead_source" className="mt-4">
          <OptionListEditor companyId={membership.company_id} category="lead_source" isRu={isRu} />
        </TabsContent>

        <TabsContent value="deal_type" className="mt-4">
          <OptionListEditor companyId={membership.company_id} category="deal_type" isRu={isRu} />
        </TabsContent>

        <TabsContent value="task_type" className="mt-4">
          <OptionListEditor companyId={membership.company_id} category="task_type" isRu={isRu} />
        </TabsContent>

        <TabsContent value="lost_reason" className="mt-4">
          <OptionListEditor companyId={membership.company_id} category="lost_reason" isRu={isRu} />
        </TabsContent>

        <TabsContent value="win_reason" className="mt-4">
          <OptionListEditor companyId={membership.company_id} category="win_reason" isRu={isRu} />
        </TabsContent>
      </Tabs>

      <OdooCrmSettingsImportModal
        open={showOdooImport}
        onOpenChange={setShowOdooImport}
        companyId={membership.company_id}
        isRu={isRu}
      />
    </div>
  );
}
