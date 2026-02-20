import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { AgentDeal, DEAL_STAGE_LABELS, DealStage } from '@/hooks/useAgentDeals';
import { Badge } from '@/components/ui/badge';
import { Phone, Mail, ChevronRight, Calendar } from 'lucide-react';
import { format } from 'date-fns';

const stageBadgeVariant: Record<DealStage, 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning'> = {
  new: 'default',
  contacted: 'secondary',
  showing: 'warning',
  negotiation: 'warning',
  contract: 'outline',
  closed_won: 'success',
  closed_lost: 'destructive',
};

export function DealCard({ deal }: { deal: AgentDeal }) {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const stageLabel = isRu ? DEAL_STAGE_LABELS[deal.stage].ru : DEAL_STAGE_LABELS[deal.stage].en;

  return (
    <button
      onClick={() => navigate(`/owner/sales/${deal.id}`)}
      className="w-full text-left p-4 rounded-xl border border-border bg-card hover:bg-accent/50 transition-colors"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-[15px] truncate">{deal.client_name}</span>
            <Badge variant={stageBadgeVariant[deal.stage]} className="text-[10px] shrink-0">
              {stageLabel}
            </Badge>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            {deal.client_phone && (
              <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{deal.client_phone}</span>
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
          {deal.next_action_date && (
            <p className="flex items-center gap-1 text-xs text-primary mt-1">
              <Calendar className="h-3 w-3" />
              {deal.next_action}: {format(new Date(deal.next_action_date), 'dd.MM')}
            </p>
          )}
        </div>
        <ChevronRight className="h-5 w-5 text-muted-foreground/50 shrink-0 mt-1" />
      </div>
    </button>
  );
}
