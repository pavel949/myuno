import { useState } from 'react';
import { useCapitalPipeline } from '@/hooks/capital/useCapitalPipeline';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { GripVertical, Plus } from 'lucide-react';
import {
  PIPELINE_STAGES_ORDER, PIPELINE_STAGE_LABELS, PIPELINE_STAGE_COLORS,
  type PipelineStage,
} from '@/types/capital';
import { useCapitalContacts } from '@/hooks/capital/useCapitalContacts';
import { useCapitalProjects } from '@/hooks/capital/useCapitalProjects';

function DraggableCard({ deal, onEdit }: { deal: Record<string, unknown>; onEdit: () => void }) {
  const contact = deal.capital_contacts as Record<string, string> | null;
  const project = deal.capital_projects as Record<string, string> | null;

  return (
    <div
      className="rounded-none border border-border/30 p-3 bg-background hover:border-success/40 transition-colors cursor-grab active:cursor-grabbing"
      onClick={onEdit}
    >
      <div className="flex items-start gap-2">
        <GripVertical className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{contact?.name || 'Контакт'}</p>
          {project?.name && <p className="text-xs text-muted-foreground truncate">{project.name}</p>}
          {deal.commission_expected && (
            <p className="text-xs text-success mt-1">
              {(deal.commission_expected as number).toLocaleString()} {deal.price_currency as string}
            </p>
          )}
          {deal.unit_number && <p className="text-xs text-muted-foreground">Юнит: {deal.unit_number as string}</p>}
        </div>
      </div>
    </div>
  );
}

export default function CapitalPipeline() {
  const { deals, isLoading, moveStage, createDeal, updateDeal } = useCapitalPipeline();
  const { contacts } = useCapitalContacts();
  const { projects } = useCapitalProjects(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({
    contact_id: '', project_id: '', stage: 'lead' as PipelineStage,
    unit_number: '', price_agreed: '', price_currency: 'THB',
    commission_expected: '', notes: '',
  });

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const dealsByStage = PIPELINE_STAGES_ORDER.reduce((acc, stage) => {
    acc[stage] = deals.filter((d: Record<string, unknown>) => d.stage === stage);
    return acc;
  }, {} as Record<PipelineStage, typeof deals>);

  const totalCommission = deals
    .filter((d: Record<string, unknown>) => d.stage !== 'closed_lost')
    .reduce((sum: number, d: Record<string, unknown>) => sum + ((d.commission_expected as number) || 0), 0);

  const handleDragStart = (event: DragStartEvent) => setActiveId(event.active.id as string);

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const targetStage = over.id as PipelineStage;
    const deal = deals.find((d: Record<string, unknown>) => d.id === active.id);
    if (!deal || (deal as Record<string, unknown>).stage === targetStage) return;

    try {
      await moveStage.mutateAsync({ id: active.id as string, stage: targetStage });
    } catch {
      toast.error('Ошибка перемещения');
    }
  };

  const openCreate = () => {
    setEditId(null);
    setForm({ contact_id: '', project_id: '', stage: 'lead', unit_number: '', price_agreed: '', price_currency: 'THB', commission_expected: '', notes: '' });
    setDialogOpen(true);
  };

  const openEdit = (deal: Record<string, unknown>) => {
    setEditId(deal.id as string);
    setForm({
      contact_id: deal.contact_id as string,
      project_id: (deal.project_id as string) || '',
      stage: deal.stage as PipelineStage,
      unit_number: (deal.unit_number as string) || '',
      price_agreed: deal.price_agreed ? String(deal.price_agreed) : '',
      price_currency: (deal.price_currency as string) || 'THB',
      commission_expected: deal.commission_expected ? String(deal.commission_expected) : '',
      notes: (deal.notes as string) || '',
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.contact_id) { toast.error('Выберите контакт'); return; }
    const payload = {
      contact_id: form.contact_id,
      project_id: form.project_id || null,
      campaign_id: null,
      stage: form.stage,
      unit_number: form.unit_number || null,
      price_agreed: form.price_agreed ? Number(form.price_agreed) : null,
      price_currency: form.price_currency,
      commission_expected: form.commission_expected ? Number(form.commission_expected) : null,
      commission_received: null,
      stage_changed_at: new Date().toISOString(),
      lost_reason: null,
      notes: form.notes || null,
    };

    try {
      if (editId) {
        await updateDeal.mutateAsync({ id: editId, ...payload });
        toast.success('Сделка обновлена');
      } else {
        await createDeal.mutateAsync(payload);
        toast.success('Сделка создана');
      }
      setDialogOpen(false);
    } catch {
      toast.error('Ошибка сохранения');
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="flex gap-4 overflow-x-auto">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-64 w-64 flex-shrink-0" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <h1 className="text-xl font-bold">Воронка</h1>
        <div className="flex items-center gap-3">
          <Badge className="bg-success/20 text-success">
            Ожидаемая комиссия: {totalCommission.toLocaleString()} THB
          </Badge>
          <Button size="sm" className="bg-success hover:bg-success" onClick={openCreate}>
            <Plus className="w-4 h-4 mr-1" /> Сделка
          </Button>
        </div>
      </div>

      {/* Summary bar */}
      <div className="flex gap-2 flex-wrap">
        {PIPELINE_STAGES_ORDER.map((stage) => (
          <Badge key={stage} variant="outline" className={PIPELINE_STAGE_COLORS[stage] + ' text-xs'}>
            {PIPELINE_STAGE_LABELS[stage]}: {dealsByStage[stage]?.length || 0}
          </Badge>
        ))}
      </div>

      {/* Kanban Board */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex gap-3 overflow-x-auto pb-4" style={{ minHeight: '50vh' }}>
          {PIPELINE_STAGES_ORDER.map((stage) => (
            <KanbanColumn
              key={stage}
              stage={stage}
              deals={dealsByStage[stage] || []}
              onEdit={openEdit}
            />
          ))}
        </div>
        <DragOverlay>
          {activeId ? (() => {
            const d = deals.find((d: Record<string, unknown>) => d.id === activeId);
            return d ? <DraggableCard deal={d as Record<string, unknown>} onEdit={() => {}} /> : null;
          })() : null}
        </DragOverlay>
      </DndContext>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editId ? 'Редактировать сделку' : 'Новая сделка'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div>
              <Label>Контакт *</Label>
              <Select value={form.contact_id} onValueChange={(v) => setForm({ ...form, contact_id: v })}>
                <SelectTrigger><SelectValue placeholder="Выберите контакт" /></SelectTrigger>
                <SelectContent>
                  {contacts.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Проект</Label>
              <Select value={form.project_id} onValueChange={(v) => setForm({ ...form, project_id: v })}>
                <SelectTrigger><SelectValue placeholder="Выберите проект" /></SelectTrigger>
                <SelectContent>
                  {projects.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Стадия</Label>
              <Select value={form.stage} onValueChange={(v) => setForm({ ...form, stage: v as PipelineStage })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PIPELINE_STAGES_ORDER.map((s) => <SelectItem key={s} value={s}>{PIPELINE_STAGE_LABELS[s]}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Юнит</Label><Input value={form.unit_number} onChange={(e) => setForm({ ...form, unit_number: e.target.value })} /></div>
              <div><Label>Цена</Label><Input type="number" value={form.price_agreed} onChange={(e) => setForm({ ...form, price_agreed: e.target.value })} /></div>
            </div>
            <div><Label>Ожидаемая комиссия</Label><Input type="number" value={form.commission_expected} onChange={(e) => setForm({ ...form, commission_expected: e.target.value })} /></div>
            <div><Label>Заметки</Label><Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
            <Button onClick={handleSave} className="bg-success hover:bg-success">{editId ? 'Сохранить' : 'Создать'}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function KanbanColumn({ stage, deals, onEdit }: { stage: PipelineStage; deals: Record<string, unknown>[]; onEdit: (d: Record<string, unknown>) => void }) {
  const { setNodeRef } = useDroppable(stage);

  return (
    <div
      ref={setNodeRef}
      className="flex-shrink-0 w-64 md:w-72 rounded-none border border-border/30 bg-muted/10"
    >
      <div className={`p-3 border-b border-border/30 ${PIPELINE_STAGE_COLORS[stage]} rounded-none`}>
        <div className="flex items-center justify-between">
          <span className="font-medium text-sm">{PIPELINE_STAGE_LABELS[stage]}</span>
          <Badge variant="outline" className="text-xs">{deals.length}</Badge>
        </div>
      </div>
      <div className="p-2 space-y-2 min-h-[200px]">
        {deals.map((d) => (
          <DraggableCard key={d.id as string} deal={d} onEdit={() => onEdit(d)} />
        ))}
      </div>
    </div>
  );
}

function useDroppable(id: string) {
  const ref = { current: null as HTMLDivElement | null };
  return {
    setNodeRef: (node: HTMLDivElement | null) => {
      ref.current = node;
      if (node) {
        node.setAttribute('data-droppable-id', id);
      }
    },
  };
}
