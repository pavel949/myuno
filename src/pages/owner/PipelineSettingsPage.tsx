import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useMyCompanyId, DEAL_TYPES, DEAL_TYPE_LABELS, DealType } from '@/hooks/useAgentDeals';
import { useAllPipelineStages, useCreatePipelineStage, useUpdatePipelineStage, useDeletePipelineStage, PipelineStage, DEFAULT_STAGES } from '@/hooks/useDealPipelineStages';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus, GripVertical, Trash2, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function PipelineSettingsPage() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { toast } = useToast();
  const { data: membership, isLoading: membershipLoading } = useMyCompanyId();
  const { data: stages = [], isLoading } = useAllPipelineStages(membership?.company_id);
  const createStage = useCreatePipelineStage();
  const updateStage = useUpdatePipelineStage();
  const deleteStage = useDeletePipelineStage();

  const [selectedType, setSelectedType] = useState<DealType>('sale');
  const [showAdd, setShowAdd] = useState(false);
  const [newStage, setNewStage] = useState({ stage_key: '', name_en: '', name_ru: '', short_label: '', color: '#6366f1', probability: '0.5' });

  const typeStages = stages.filter(s => s.deal_type === selectedType).sort((a, b) => a.sort_order - b.sort_order);

  const handleAdd = async () => {
    if (!newStage.stage_key || !newStage.name_en || !newStage.name_ru) {
      toast({ title: isRu ? 'Заполните все поля' : 'Fill all fields', variant: 'destructive' });
      return;
    }
    try {
      await createStage.mutateAsync({
        company_id: membership!.company_id,
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
      toast({ title: isRu ? 'Этап добавлен' : 'Stage added' });
      setNewStage({ stage_key: '', name_en: '', name_ru: '', short_label: '', color: '#6366f1', probability: '0.5' });
      setShowAdd(false);
    } catch {
      toast({ title: isRu ? 'Ошибка' : 'Error', variant: 'destructive' });
    }
  };

  const handleDelete = async (stage: PipelineStage) => {
    if (stage.is_system) {
      toast({ title: isRu ? 'Системный этап нельзя удалить' : 'Cannot delete system stage', variant: 'destructive' });
      return;
    }
    try {
      await deleteStage.mutateAsync(stage.id);
      toast({ title: isRu ? 'Этап удалён' : 'Stage deleted' });
    } catch {
      toast({ title: isRu ? 'Ошибка' : 'Error', variant: 'destructive' });
    }
  };

  const handleSeedForType = async (dealType: DealType) => {
    const defaultForType = DEFAULT_STAGES.map(s => ({
      ...s,
      deal_type: dealType,
      company_id: membership!.company_id,
    }));
    try {
      for (const s of defaultForType) {
        await createStage.mutateAsync(s);
      }
      toast({ title: isRu ? 'Стандартные этапы созданы' : 'Default stages created' });
    } catch {
      toast({ title: isRu ? 'Ошибка' : 'Error', variant: 'destructive' });
    }
  };

  if (membershipLoading || isLoading) {
    return (
      <div className="p-4 space-y-4 max-w-lg mx-auto">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-20 w-full rounded-xl" />
      </div>
    );
  }

  if (!membership || !['owner', 'admin'].includes(membership.role)) {
    return (
      <div className="p-4 text-center text-muted-foreground pt-20 max-w-lg mx-auto">
        <p>{isRu ? 'Нет доступа. Только владельцы и админы УК могут настраивать воронку.' : 'No access. Only company owners/admins can configure the pipeline.'}</p>
      </div>
    );
  }

  return (
    <div className="px-4 pt-6 pb-24 max-w-lg mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate('/owner/sales')} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          {isRu ? 'Назад' : 'Back'}
        </button>
        <h1 className="text-lg font-bold">{isRu ? 'Настройка воронки' : 'Pipeline Settings'}</h1>
      </div>

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

      {/* Stages list */}
      {typeStages.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm text-muted-foreground mb-3">
            {isRu ? `Нет этапов для типа "${DEAL_TYPE_LABELS[selectedType].ru}"` : `No stages for "${DEAL_TYPE_LABELS[selectedType].en}" deals`}
          </p>
          <Button variant="outline" size="sm" onClick={() => handleSeedForType(selectedType)}>
            {isRu ? 'Создать стандартные этапы' : 'Create default stages'}
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {typeStages.map((stage, idx) => (
            <div
              key={stage.id}
              className="flex items-center gap-3 p-3 rounded-xl border bg-card"
            >
              <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
              <div
                className="h-4 w-4 rounded-full shrink-0"
                style={{ backgroundColor: stage.color }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{isRu ? stage.name_ru : stage.name_en}</p>
                <p className="text-xs text-muted-foreground">
                  {stage.stage_key} · {Math.round(Number(stage.probability) * 100)}%
                  {stage.is_system && <span className="ml-1 text-primary">(system)</span>}
                </p>
              </div>
              {!stage.is_system && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive shrink-0"
                  onClick={() => handleDelete(stage)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add new stage */}
      {showAdd ? (
        <div className="border rounded-xl p-4 bg-card space-y-3">
          <p className="text-sm font-medium">{isRu ? 'Новый этап' : 'New Stage'}</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Key (eng)</Label>
              <Input value={newStage.stage_key} onChange={e => setNewStage(s => ({ ...s, stage_key: e.target.value }))} placeholder="e.g. proposal" />
            </div>
            <div>
              <Label>{isRu ? 'Цвет' : 'Color'}</Label>
              <Input type="color" value={newStage.color} onChange={e => setNewStage(s => ({ ...s, color: e.target.value }))} className="h-9" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Name EN</Label>
              <Input value={newStage.name_en} onChange={e => setNewStage(s => ({ ...s, name_en: e.target.value }))} />
            </div>
            <div>
              <Label>Название RU</Label>
              <Input value={newStage.name_ru} onChange={e => setNewStage(s => ({ ...s, name_ru: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>{isRu ? 'Короткое' : 'Short label'}</Label>
              <Input value={newStage.short_label} onChange={e => setNewStage(s => ({ ...s, short_label: e.target.value }))} placeholder="4 chars" />
            </div>
            <div>
              <Label>{isRu ? 'Вероятность (0-1)' : 'Probability (0-1)'}</Label>
              <Input type="number" step="0.1" min="0" max="1" value={newStage.probability} onChange={e => setNewStage(s => ({ ...s, probability: e.target.value }))} />
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleAdd} disabled={createStage.isPending}>
              <Save className="h-3.5 w-3.5 mr-1" />
              {isRu ? 'Сохранить' : 'Save'}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setShowAdd(false)}>
              {isRu ? 'Отмена' : 'Cancel'}
            </Button>
          </div>
        </div>
      ) : (
        <Button variant="outline" size="sm" onClick={() => setShowAdd(true)} className="w-full">
          <Plus className="h-4 w-4 mr-1" />
          {isRu ? 'Добавить этап' : 'Add Stage'}
        </Button>
      )}
    </div>
  );
}
