/**
 * SellSignalWidget — surfaces auto-created STAYS→DEALS leads on the MC dashboard.
 *
 * Reads `agent_deals` rows tagged `stays_signal` from the active company so
 * Capital can act on every guest the database trigger has flagged as a
 * potential buyer / long-term renter. One-tap → CRM contact for follow-up.
 */
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useActiveCompany } from '@/hooks/useActiveCompany';
import { useLanguage } from '@/contexts/LanguageContext';
import { CACHE_PROFILES } from '@/lib/queryConfig';

interface SellSignalDeal {
  id: string;
  client_name: string;
  client_email: string | null;
  client_phone: string | null;
  property_id: string | null;
  next_action: string | null;
  next_action_date: string | null;
  created_at: string;
}

export function SellSignalWidget() {
  const navigate = useNavigate();
  const { activeCompany } = useActiveCompany();
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const companyId = activeCompany?.company_id;

  const { data, isLoading } = useQuery({
    queryKey: ['sell-signal-deals', companyId],
    queryFn: async (): Promise<SellSignalDeal[]> => {
      if (!companyId) return [];
      const { data, error } = await supabase
        .from('agent_deals')
        .select('id, client_name, client_email, client_phone, property_id, next_action, next_action_date, created_at')
        .eq('company_id', companyId)
        .eq('deal_status', 'active')
        .eq('stage', 'new')
        .contains('tags', ['stays_signal'])
        .order('created_at', { ascending: false })
        .limit(5);
      if (error) throw error;
      return (data ?? []) as SellSignalDeal[];
    },
    enabled: !!companyId,
    ...CACHE_PROFILES.MEDIUM,
  });

  if (isLoading) {
    return (
      <div className="rounded-none border bg-card p-4 space-y-2">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  const deals = data ?? [];

  return (
    <div className="rounded-none border bg-card text-card-foreground shadow-sm">
      <div className="flex items-center justify-between p-4 pb-2">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">
            {isRu ? 'Сигналы продажи' : 'Sell signals'}
          </h3>
          {deals.length > 0 && (
            <Badge variant="secondary" className="rounded-none">
              {deals.length}
            </Badge>
          )}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 text-xs"
          onClick={() => navigate('/mc/contacts?source=stays')}
        >
          {isRu ? 'Все' : 'All'}
          <ArrowRight className="h-3 w-3 ml-1" />
        </Button>
      </div>

      {deals.length === 0 ? (
        <div className="px-4 pb-4 text-xs text-muted-foreground">
          {isRu
            ? 'Гости из STAYS появятся здесь как лиды на покупку или долгую аренду.'
            : 'STAYS guests will appear here as buyer / long-term-rent leads.'}
        </div>
      ) : (
        <ul className="divide-y border-t">
          {deals.map((deal) => (
            <li key={deal.id}>
              <button
                type="button"
                onClick={() => navigate(`/mc/contacts?dealId=${deal.id}`)}
                className="w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{deal.client_name}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {deal.client_email || deal.client_phone || (isRu ? 'без контактов' : 'no contact')}
                    </div>
                  </div>
                  <Badge variant="outline" className="rounded-none text-[10px] uppercase shrink-0">
                    {isRu ? 'Stays' : 'Stays'}
                  </Badge>
                </div>
                {deal.next_action && (
                  <p className="text-xs text-muted-foreground mt-1 truncate">
                    → {deal.next_action}
                  </p>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default SellSignalWidget;
