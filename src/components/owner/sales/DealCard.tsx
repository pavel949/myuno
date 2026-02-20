import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { AgentDeal, DEAL_STAGE_LABELS, DealStage, daysSince } from '@/hooks/useAgentDeals';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Phone, Mail, ChevronRight, Calendar, AlertCircle, MessageCircle, Clock } from 'lucide-react';
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
        age > 30 && !isOverdue && !isDueToday && 'border-l-2 border-l-red-500',
        age > 14 && age <= 30 && !isOverdue && !isDueToday && 'border-l-2 border-l-amber-500',
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
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-[15px] truncate">{deal.client_name}</span>
              <Badge variant={stageBadgeVariant[deal.stage]} className="text-[10px] shrink-0">
                {stageLabel}
              </Badge>
              {age > 14 && (
                <span className={cn('flex items-center gap-0.5 text-[10px]', age > 30 ? 'text-red-500' : 'text-amber-500')}>
                  <Clock className="h-2.5 w-2.5" />{age}d
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              {deal.client_phone && (
                <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{deal.client_phone}</span>
              )}
              {deal.client_phone && (
                <a
                  href={`https://wa.me/${deal.client_phone.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={e => e.stopPropagation()}
                  className="text-green-600 hover:text-green-500"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                </a>
              )}
              {deal.client_phone && (
                <a
                  href={`tel:${deal.client_phone}`}
                  onClick={e => e.stopPropagation()}
                  className="text-primary hover:text-primary/80"
                >
                  <Phone className="h-3.5 w-3.5" />
                </a>
              )}
              {deal.client_email && (
                <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{deal.client_email}</span>
              )}
            </div>
            {deal.budget_max && (
              <p className="text-xs text-muted-foreground mt-1">
                {isRu ? 'Бюджет' : 'Budget'}: {deal.budget_min ? `${Number(deal.budget_min).toLocaleString()}–` : ''}{Number(deal.budget_max).toLocaleString()} {deal.currency}
              </p>
            )}
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
