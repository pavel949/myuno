import { useNavigate } from 'react-router-dom';
import { useCapitalCampaigns } from '@/hooks/capital';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Megaphone } from 'lucide-react';
import { CAMPAIGN_STATUS_LABELS, type CampaignStatus } from '@/types/capital';
import { toast } from 'sonner';

const STATUS_COLORS: Record<CampaignStatus, string> = {
  draft: 'bg-slate-500/20 text-slate-400',
  active: 'bg-emerald-500/20 text-emerald-400',
  paused: 'bg-amber-500/20 text-amber-400',
  completed: 'bg-blue-500/20 text-blue-400',
};

export default function CapitalCampaigns() {
  const navigate = useNavigate();
  const { campaigns, isLoading, updateCampaign, deleteCampaign } = useCapitalCampaigns();

  const handleStatusChange = async (id: string, status: CampaignStatus) => {
    try {
      const updates: Record<string, unknown> = { status };
      if (status === 'active') updates.started_at = new Date().toISOString();
      if (status === 'completed') updates.ended_at = new Date().toISOString();
      await updateCampaign.mutateAsync({ id, ...updates });
      toast.success(`Статус: ${CAMPAIGN_STATUS_LABELS[status]}`);
    } catch {
      toast.error('Ошибка обновления');
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Кампании</h1>
        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => navigate('/capital/campaigns/launch')}>
          <Plus className="w-4 h-4 mr-1" /> Новая кампания
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
      ) : campaigns.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Megaphone className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Кампаний пока нет. Создайте первую!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {campaigns.map((c) => (
            <div key={c.id} className="rounded-lg border border-border/50 p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-medium">{c.name}</h3>
                    <Badge className={STATUS_COLORS[c.status as CampaignStatus]}>
                      {CAMPAIGN_STATUS_LABELS[c.status as CampaignStatus]}
                    </Badge>
                  </div>
                  {c.capital_projects?.name && (
                    <p className="text-sm text-muted-foreground mt-1">Проект: {c.capital_projects.name}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    Создана: {new Date(c.created_at).toLocaleDateString('ru-RU')}
                    {c.started_at && ` | Запущена: ${new Date(c.started_at).toLocaleDateString('ru-RU')}`}
                  </p>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {c.status === 'draft' && (
                    <Button size="sm" variant="outline" onClick={() => handleStatusChange(c.id, 'active')}>
                      Запустить
                    </Button>
                  )}
                  {c.status === 'active' && (
                    <>
                      <Button size="sm" variant="outline" onClick={() => handleStatusChange(c.id, 'paused')}>Пауза</Button>
                      <Button size="sm" variant="outline" onClick={() => handleStatusChange(c.id, 'completed')}>Завершить</Button>
                    </>
                  )}
                  {c.status === 'paused' && (
                    <Button size="sm" variant="outline" onClick={() => handleStatusChange(c.id, 'active')}>Продолжить</Button>
                  )}
                  <Button size="sm" variant="ghost" className="text-red-400" onClick={() => deleteCampaign.mutate(c.id)}>
                    Удалить
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
