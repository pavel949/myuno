import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAgentDeals, useMyCompanyId, DEAL_STAGE_LABELS, DealStage } from '@/hooks/useAgentDeals';
import { TrendingUp, ChevronRight } from 'lucide-react';

export function ActiveDealsWidget() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { data: membership } = useMyCompanyId();
  const { data: deals = [] } = useAgentDeals(membership?.company_id);

  // Don't render if user is not a company member or has no deals
  if (!membership) return null;

  const activeDeals = deals.filter(d => d.stage !== 'closed_won' && d.stage !== 'closed_lost');
  const stageCounts: Partial<Record<DealStage, number>> = {};
  for (const d of activeDeals) {
    stageCounts[d.stage] = (stageCounts[d.stage] || 0) + 1;
  }

  return (
    <div>
      <button
        onClick={() => navigate('/owner/sales')}
        className="w-full text-left"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-[15px]">{isRu ? 'Сделки' : 'Sales Deals'}</h3>
          </div>
          <div className="flex items-center gap-1 text-sm text-primary">
            <span>{activeDeals.length} {isRu ? 'активных' : 'active'}</span>
            <ChevronRight className="h-4 w-4" />
          </div>
        </div>
      </button>

      {activeDeals.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {(Object.entries(stageCounts) as [DealStage, number][]).map(([stage, count]) => (
            <div
              key={stage}
              className="shrink-0 px-3 py-2 rounded-lg bg-muted/50 text-center min-w-[70px]"
            >
              <p className="text-lg font-bold">{count}</p>
              <p className="text-[10px] text-muted-foreground">{isRu ? DEAL_STAGE_LABELS[stage].ru : DEAL_STAGE_LABELS[stage].en}</p>
            </div>
          ))}
        </div>
      )}

      {activeDeals.length === 0 && deals.length === 0 && (
        <p className="text-xs text-muted-foreground">
          {isRu ? 'Нажмите, чтобы создать первую сделку' : 'Tap to create your first deal'}
        </p>
      )}
    </div>
  );
}
