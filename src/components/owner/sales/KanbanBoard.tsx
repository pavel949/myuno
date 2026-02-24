import { useMemo, useRef, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { AgentDeal, DEAL_STAGES, DEAL_STAGE_LABELS, DealStage, STAGE_PROBABILITIES, useUpdateDeal, daysSince, formatValue } from '@/hooks/useAgentDeals';
import { useAddDealActivity } from '@/hooks/useAgentDealActivities';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { DealTagsDisplay } from '@/components/owner/sales/DealTagsInput';
import { Phone, Calendar, MessageCircle, Clock, Star } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
} from '@dnd-kit/core';
import { useDraggable } from '@dnd-kit/core';

const stageColors: Record<DealStage, string> = {
  new: 'border-t-primary',
  contacted: 'border-t-info',
  showing: 'border-t-warning',
  negotiation: 'border-t-warning/70',
  contract: 'border-t-accent-foreground',
  closed_won: 'border-t-success',
  closed_lost: 'border-t-destructive',
};

function KanbanCard({ deal }: { deal: AgentDeal }) {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const dragRef = useRef(false);
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: deal.id });
  const age = daysSince(deal.updated_at);

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        'p-3 rounded-lg border bg-card cursor-grab active:cursor-grabbing touch-none',
        isDragging && 'opacity-50 shadow-lg z-50',
        age > 30 && 'border-l-2 border-l-destructive',
        age > 14 && age <= 30 && 'border-l-2 border-l-warning',
      )}
      onPointerDown={() => { dragRef.current = false; }}
      onPointerMove={() => { dragRef.current = true; }}
      onPointerUp={(e) => {
        if (!dragRef.current) {
          e.stopPropagation();
          navigate(`/owner/sales/${deal.id}`);
        }
      }}
    >
      <div className="flex items-center gap-1">
        {deal.priority > 0 && (
          <div className="flex">
            {Array.from({ length: deal.priority }).map((_, i) => (
              <Star key={i} className="h-3 w-3 fill-warning text-warning" />
            ))}
          </div>
        )}
        <p className="font-medium text-sm truncate">{deal.client_name}</p>
      </div>
      {deal.client_phone && (
        <div className="flex items-center gap-2 mt-1">
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Phone className="h-3 w-3" />{deal.client_phone}
          </p>
          <a
            href={`https://wa.me/${deal.client_phone.replace(/[^0-9]/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            className="text-success hover:text-success/80"
          >
            <MessageCircle className="h-3 w-3" />
          </a>
        </div>
      )}
      {deal.deal_value ? (
        <p className="text-xs font-medium text-foreground mt-1">{formatValue(deal.deal_value, deal.currency)}</p>
      ) : deal.budget_max ? (
        <p className="text-xs text-muted-foreground mt-1">
          {deal.budget_min ? `${(Number(deal.budget_min)/1e6).toFixed(1)}–` : ''}{(Number(deal.budget_max)/1e6).toFixed(1)}M {deal.currency}
        </p>
      ) : null}
      {deal.tags?.length > 0 && (
        <div className="mt-1">
          <DealTagsDisplay tags={deal.tags} />
        </div>
      )}
      <div className="flex items-center justify-between mt-1">
        {deal.next_action_date && (
          <p className="flex items-center gap-1 text-xs text-primary">
            <Calendar className="h-3 w-3" />
            {format(new Date(deal.next_action_date), 'dd.MM')}
          </p>
        )}
        {age > 7 && (
          <p className={cn('flex items-center gap-0.5 text-[10px]', age > 30 ? 'text-destructive' : age > 14 ? 'text-warning' : 'text-muted-foreground')}>
            <Clock className="h-2.5 w-2.5" />{age}d
          </p>
        )}
      </div>
    </div>
  );
}

function KanbanColumn({ stage, deals }: { stage: DealStage; deals: AgentDeal[] }) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { setNodeRef, isOver } = useDroppable({ id: stage });
  const label = isRu ? DEAL_STAGE_LABELS[stage].ru : DEAL_STAGE_LABELS[stage].en;

  const totalValue = deals.reduce((s, d) => s + (Number(d.deal_value || d.budget_max || 0)), 0);
  const prob = STAGE_PROBABILITIES[stage];

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex-shrink-0 w-[200px] rounded-xl border border-t-4 bg-muted/30 flex flex-col',
        stageColors[stage],
        isOver && 'ring-2 ring-primary/50',
      )}
    >
      <div className="p-3 pb-1">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold">{label}</span>
          <Badge variant="secondary" className="text-[10px] h-5">{deals.length}</Badge>
        </div>
        {totalValue > 0 && (
          <p className="text-[10px] text-muted-foreground mt-0.5">
            {formatValue(totalValue)} · {Math.round(prob * 100)}%
          </p>
        )}
      </div>
      <div className="p-2 pt-1 space-y-2 flex-1 min-h-[100px] overflow-y-auto max-h-[60vh]">
        {deals.map(deal => (
          <KanbanCard key={deal.id} deal={deal} />
        ))}
      </div>
    </div>
  );
}

interface Props {
  deals: AgentDeal[];
}

export function KanbanBoard({ deals }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const updateDeal = useUpdateDeal();
  const addActivity = useAddDealActivity();
  const [activeDeal, setActiveDeal] = useState<AgentDeal | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const dealsByStage = useMemo(() => {
    const map: Record<DealStage, AgentDeal[]> = {} as any;
    for (const s of DEAL_STAGES) map[s] = [];
    for (const d of deals) {
      if (map[d.stage as DealStage]) map[d.stage as DealStage].push(d);
    }
    return map;
  }, [deals]);

  const handleDragStart = (event: DragStartEvent) => {
    const deal = deals.find(d => d.id === event.active.id);
    setActiveDeal(deal || null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveDeal(null);
    const { active, over } = event;
    if (!over) return;

    const dealId = active.id as string;
    const newStage = over.id as DealStage;
    const deal = deals.find(d => d.id === dealId);
    if (!deal || deal.stage === newStage) return;

    try {
      await updateDeal.mutateAsync({
        id: dealId,
        stage: newStage,
        ...(newStage === 'closed_won' ? { closed_at: new Date().toISOString() } : {}),
      });
      await addActivity.mutateAsync({
        deal_id: dealId,
        user_id: user!.id,
        activity_type: 'stage_change',
        description: `${DEAL_STAGE_LABELS[deal.stage].en} → ${DEAL_STAGE_LABELS[newStage].en}`,
        stage_from: deal.stage,
        stage_to: newStage,
      });
    } catch {
      toast({ title: isRu ? 'Ошибка' : 'Error', variant: 'destructive' });
    }
  };

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex gap-3 overflow-x-auto pb-4 -mx-4 px-4">
        {DEAL_STAGES.filter(s => s !== 'closed_lost').map(stage => (
          <KanbanColumn key={stage} stage={stage} deals={dealsByStage[stage]} />
        ))}
      </div>
      <DragOverlay>
        {activeDeal && (
          <div className="p-3 rounded-lg border bg-card shadow-xl w-[200px]">
            <p className="font-medium text-sm">{activeDeal.client_name}</p>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
