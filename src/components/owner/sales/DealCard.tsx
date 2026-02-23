import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { AgentDeal, DEAL_STAGE_LABELS, DealStage, DEAL_TYPE_LABELS, DealType, daysSince } from '@/hooks/useAgentDeals';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ChevronRight, Calendar, AlertCircle, Clock } from 'lucide-react';
import { DealPriorityStars } from '@/components/owner/sales/DealPriorityStars';
import { format, isPast, isToday } from 'date-fns';
import { cn } from '@/lib/utils';

const stageBadgeVariant: Record<DealStage, 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning'> = {
  new: 'default',
  contacted: 'secondary',
  showing: 'warning',
  negotiation: 'warning',
  contract: 'outline',
  closed_won: 'success',
  closed_lost: 'destructive',
};

interface Props {
  deal: AgentDeal;
  selectable?: boolean;
  selected?: boolean;
  onToggleSelect?: (id: string) => void;
}

export function DealCard({ deal, selectable, selected, onToggleSelect }: Props) {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const stageLabel = isRu ? DEAL_STAGE_LABELS[deal.stage].ru : DEAL_STAGE_LABELS[deal.stage].en;

  const nextDate = deal.next_action_date ? new Date(deal.next_action_date) : null;
  const isOverdue = nextDate ? isPast(nextDate) && !isToday(nextDate) : false;
  const isDueToday = nextDate ? isToday(nextDate) : false;
  const age = daysSince(deal.updated_at);

  return (
    <div
      className={cn(
        'w-full text-left p-4 rounded-xl border bg-card hover:bg-accent/50 transition-colors flex items-start gap-3',
        isOverdue && 'border-destructive/50 bg-destructive/5',
        isDueToday && 'border-primary/50 bg-primary/5',
        age > 30 && !isOverdue && !isDueToday && 'border-l-2 border-l-destructive',
        age > 14 && age <= 30 && !isOverdue && !isDueToday && 'border-l-2 border-l-warning',
      )}
    >
      {selectable && (
        <Checkbox
          checked={selected}
          onCheckedChange={() => onToggleSelect?.(deal.id)}
          className="mt-1 shrink-0"
        />
      )}
      <button
        onClick={() => navigate(`/owner/sales/${deal.id}`)}
        className="flex-1 text-left min-w-0"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            {/* Row 1: Name + Stage */}
            <div className="flex items-center gap-2 mb-1">
              {deal.priority > 0 && <DealPriorityStars priority={deal.priority} size="sm" />}
              <span className="font-semibold text-[15px] truncate">{deal.client_name}</span>
              <Badge variant={stageBadgeVariant[deal.stage]} className="text-[10px] shrink-0">
                {stageLabel}
              </Badge>
              {deal.deal_type && deal.deal_type !== 'sale' && (
                <Badge variant="outline" className="text-[10px] shrink-0">
                  {isRu ? DEAL_TYPE_LABELS[deal.deal_type]?.ru : DEAL_TYPE_LABELS[deal.deal_type]?.en}
                </Badge>
              )}
              {age > 14 && (
                <span className={cn('flex items-center gap-0.5 text-[10px]', age > 30 ? 'text-destructive' : 'text-warning')}>
                  <Clock className="h-2.5 w-2.5" />{age}d
                </span>
              )}
            </div>

            {/* Row 2: Budget */}
            {deal.budget_max && (
              <p className="text-xs text-muted-foreground">
                {deal.budget_min ? `${Number(deal.budget_min).toLocaleString()}–` : ''}{Number(deal.budget_max).toLocaleString()} {deal.currency}
              </p>
            )}

            {/* Row 3: Next action */}
            {nextDate && (
              <p className={cn(
                'flex items-center gap-1 text-xs mt-1',
                isOverdue ? 'text-destructive font-medium' : isDueToday ? 'text-primary font-medium' : 'text-muted-foreground',
              )}>
                {isOverdue ? <AlertCircle className="h-3 w-3" /> : <Calendar className="h-3 w-3" />}
                {deal.next_action}{deal.next_action ? ': ' : ''}{format(nextDate, 'dd.MM')}
                {isOverdue && ` (${isRu ? 'просрочено' : 'overdue'})`}
                {isDueToday && ` (${isRu ? 'сегодня' : 'today'})`}
              </p>
            )}
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground/50 shrink-0 mt-1" />
        </div>
      </button>
    </div>
  );
}
