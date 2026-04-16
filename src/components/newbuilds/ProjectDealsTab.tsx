import { useLanguage } from '@/contexts/LanguageContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DEAL_TYPE_LABELS, DEAL_STAGE_LABELS } from '@/hooks/useAgentDeals';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';
import { APP_ROUTES } from '@/lib/config/routes';
import { Handshake, DollarSign } from 'lucide-react';

interface Props {
  projectId: string;
}

function useProjectDeals(projectId: string | undefined) {
  return useQuery({
    queryKey: ['project-deals', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from('agent_deals')
        .select('id, client_name, deal_type, stage, deal_value, currency, created_at, deal_status')
        .eq('property_project_id', projectId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!projectId,
  });
}

export function ProjectDealsTab({ projectId }: Props) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const navigate = useNavigate();
  const { data: deals = [], isLoading } = useProjectDeals(projectId);

  if (isLoading) return <div className="space-y-2">{[1,2].map(i => <Skeleton key={i} className="h-14 w-full" />)}</div>;

  if (deals.length === 0) {
    return <p className="text-sm text-muted-foreground py-6 text-center">{isRu ? 'Нет сделок по этому проекту' : 'No deals for this project'}</p>;
  }

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold">{isRu ? 'Сделки' : 'Deals'} ({deals.length})</h3>
      {deals.map(d => {
        const stageLabel = DEAL_STAGE_LABELS[d.stage as keyof typeof DEAL_STAGE_LABELS];
        const typeLabel = DEAL_TYPE_LABELS[d.deal_type as keyof typeof DEAL_TYPE_LABELS];
        return (
          <button
            key={d.id}
            onClick={() => navigate(`${APP_ROUTES.MC_SALES}/${d.id}`)}
            className="w-full text-left flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Handshake className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium truncate">{d.client_name}</span>
                {stageLabel && <Badge variant="outline" className="text-[9px] h-4 px-1.5">{isRu ? stageLabel.ru : stageLabel.en}</Badge>}
              </div>
              <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                {typeLabel && <span>{isRu ? typeLabel.ru : typeLabel.en}</span>}
                {d.deal_value && <span className="flex items-center gap-0.5"><DollarSign className="h-3 w-3" />{Number(d.deal_value).toLocaleString()} {d.currency}</span>}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
