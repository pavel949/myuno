import { useMemo, useRef, useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { AgentDeal, DEAL_STAGES, DEAL_STAGE_LABELS, DealStage, DEAL_TYPE_LABELS, DealType, STAGE_PROBABILITIES, useUpdateDeal, daysSince, formatValue } from '@/hooks/useAgentDeals';
import { useAddDealActivity } from '@/hooks/useAgentDealActivities';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { DealTagsDisplay } from '@/components/owner/sales/DealTagsInput';
import { Phone, Calendar, MessageCircle, Clock, Star, User } from 'lucide-react';
import { format, isPast, isToday } from 'date-fns';
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

const stageBarColors: Record<DealStage, string> = {
  new: 'bg-primary',
  contacted: 'bg-info',
  showing: 'bg-warning',
  negotiation: 'bg-warning/70',
  contract: 'bg-accent-foreground',
  closed_won: 'bg-success',
  closed_lost: 'bg-destructive',
};

const dealTypeBadgeColors: Record<string, string> = {
  sale: 'bg-primary/15 text-primary border-primary/30',
  rent: 'bg-info/15 text-info border-info/30',
  investment: 'bg-warning/15 text-warning border-warning/30',
  management: 'bg-accent/15 text-accent-foreground border-accent/30',
};

function KanbanCard({ deal, agentName }: { deal: AgentDeal; agentName?: string }) {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const dragRef = useRef(false);
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: deal.id });
  const age = daysSince(deal.updated_at);

  const nextDate = deal.next_action_date ? new Date(deal.next_action_date) : null;
  const isOverdue = nextDate ? isPast(nextDate) && !isToday(nextDate) : false;

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
        'p-3 rounded-lg border bg-card cursor-grab active:cursor-grabbing touch-none transition-shadow hover:shadow-md',
        isDragging && 'opacity-50 shadow-lg z-50',
        isOverdue && 'border-l-2 border-l-destructive',
        !isOverdue && age > 30 && 'border-l-2 border-l-destructive',
        !isOverdue && age > 14 && age <= 30 && 'border-l-2 border-l-warning',
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
      {/* Title */}
      <p className="font-medium text-sm leading-snug line-clamp-2">{deal.client_name}</p>

      {/* Value */}
      {deal.deal_value ? (
        <p className="text-xs font-semibold text-foreground mt-1">{formatValue(deal.deal_value, deal.currency)}</p>
      ) : deal.budget_max ? (
        <p className="text-xs text-muted-foreground mt-1">
          {deal.budget_min ? `${Number(deal.budget_min).toLocaleString()}–` : ''}{Number(deal.budget_max).toLocaleString()} {deal.currency}
        </p>
      ) : null}

      {/* Agent name */}
      {agentName && (
        <p className="text-[11px] text-muted-foreground mt-1 truncate flex items-center gap-1">
          <User className="h-3 w-3 shrink-0" />{agentName}
        </p>
      )}

      {/* Deal type badges */}
      <div className="flex flex-wrap gap-1 mt-2">
        {deal.deal_type && (
          <Badge variant="outline" className={cn('text-[9px] h-4 px-1.5 border uppercase font-bold', dealTypeBadgeColors[deal.deal_type] || '')}>
            {isRu ? DEAL_TYPE_LABELS[deal.deal_type]?.ru : DEAL_TYPE_LABELS[deal.deal_type]?.en}
          </Badge>
        )}
        {deal.tags?.length > 0 && <DealTagsDisplay tags={deal.tags} />}
      </div>

      {/* Bottom row: priority stars + phone + date + age */}
      <div className="flex items-center justify-between mt-2 gap-1">
        <div className="flex items-center gap-1.5">
          {/* Priority stars */}
          <div className="flex">
            {[1, 2, 3].map(i => (
              <Star
                key={i}
                className={cn('h-3 w-3', i <= deal.priority ? 'fill-warning text-warning' : 'text-muted-foreground/30')}
              />
            ))}
          </div>
          {deal.client_phone && (
            <a
              href={`https://wa.me/${deal.client_phone.replace(/[^0-9]/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="text-success hover:text-success/80"
            >
              <MessageCircle className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {deal.next_action_date && (
            <p className={cn('flex items-center gap-0.5 text-[10px]', isOverdue ? 'text-destructive font-medium' : 'text-primary')}>
              <Calendar className="h-3 w-3" />
              {format(new Date(deal.next_action_date), 'dd.MM')}
            </p>
          )}
          {isOverdue && <span className="text-destructive">✓</span>}
          {age > 7 && (
            <p className={cn('flex items-center gap-0.5 text-[10px]', age > 30 ? 'text-destructive' : age > 14 ? 'text-warning' : 'text-muted-foreground')}>
              <Clock className="h-2.5 w-2.5" />{age}d
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function KanbanColumn({ stage, deals, maxValue, agentMap }: { stage: DealStage; deals: AgentDeal[]; maxValue: number; agentMap: Map<string, string> }) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { setNodeRef, isOver } = useDroppable({ id: stage });
  const label = isRu ? DEAL_STAGE_LABELS[stage].ru : DEAL_STAGE_LABELS[stage].en;

  const totalValue = deals.reduce((s, d) => s + (Number(d.deal_value || d.budget_max || 0)), 0);
  const barWidth = maxValue > 0 ? Math.max((totalValue / maxValue) * 100, 2) : 0;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex-shrink-0 w-[220px] lg:w-[260px] xl:min-w-[240px] xl:flex-1 rounded-xl border border-t-4 bg-muted/30 flex flex-col',
        stageColors[stage],
        isOver && 'ring-2 ring-primary/50',
      )}
    >
      {/* Column header */}
      <div className="p-3 pb-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold">{label}</span>
          <Badge variant="secondary" className="text-[10px] h-5">{deals.length}</Badge>
        </div>
        {/* Odoo-style value bar */}
        <div className="mt-1.5">
          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all', stageBarColors[stage])}
              style={{ width: `${barWidth}%` }}
            />
          </div>
          <p className="text-[10px] text-muted-foreground mt-0.5 text-right">
            {formatValue(totalValue)}
          </p>
        </div>
      </div>
      {/* Cards */}
      <div className="p-2 pt-0 space-y-2 flex-1 min-h-[100px] overflow-y-auto max-h-[calc(100vh-280px)]">
        {deals.map(deal => (
          <KanbanCard key={deal.id} deal={deal} agentName={agentMap.get(deal.agent_id)} />
        ))}
      </div>
    </div>
  );
}

interface Props {
  deals: AgentDeal[];
  members?: { user_id: string; name: string }[];
}

export function KanbanBoard({ deals, members = [] }: Props) {
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

  const agentMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const member of members) m.set(member.user_id, member.name);
    return m;
  }, [members]);

  const dealsByStage = useMemo(() => {
    const map: Record<DealStage, AgentDeal[]> = {} as any;
    for (const s of DEAL_STAGES) map[s] = [];
    for (const d of deals) {
      if (map[d.stage as DealStage]) map[d.stage as DealStage].push(d);
    }
    return map;
  }, [deals]);

  // Max column value for proportional bars
  const maxValue = useMemo(() => {
    let max = 0;
    for (const s of DEAL_STAGES) {
      const total = dealsByStage[s].reduce((sum, d) => sum + Number(d.deal_value || d.budget_max || 0), 0);
      if (total > max) max = total;
    }
    return max;
  }, [dealsByStage]);

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
      <div className="flex gap-3 overflow-x-auto pb-4 -mx-4 px-4 xl:mx-0 xl:px-0">
        {DEAL_STAGES.filter(s => s !== 'closed_lost').map(stage => (
          <KanbanColumn key={stage} stage={stage} deals={dealsByStage[stage]} maxValue={maxValue} agentMap={agentMap} />
        ))}
      </div>
      <DragOverlay>
        {activeDeal && (
          <div className="p-3 rounded-lg border bg-card shadow-xl w-[240px]">
            <p className="font-medium text-sm">{activeDeal.client_name}</p>
            {activeDeal.deal_value && (
              <p className="text-xs text-muted-foreground mt-1">{formatValue(activeDeal.deal_value, activeDeal.currency)}</p>
            )}
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
