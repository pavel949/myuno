import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useAgentDeal, useUpdateDeal, DEAL_STAGES, DEAL_STAGE_LABELS, DealStage } from '@/hooks/useAgentDeals';
import { useDealActivities, useAddDealActivity } from '@/hooks/useAgentDealActivities';
import { DealStageBar } from '@/components/owner/sales/DealStageBar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Phone, Mail, MessageCircle, Clock, User, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

const activityIcons: Record<string, React.ElementType> = {
  call: Phone,
  meeting: User,
  showing: FileText,
  message: MessageCircle,
  note: FileText,
  stage_change: Clock,
};

export default function SalesDealDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: deal, isLoading } = useAgentDeal(id);
  const { data: activities = [] } = useDealActivities(id);
  const updateDeal = useUpdateDeal();
  const addActivity = useAddDealActivity();

  const [activityType, setActivityType] = useState('note');
  const [activityText, setActivityText] = useState('');

  if (isLoading) {
    return (
      <div className="p-4 space-y-4 max-w-lg mx-auto">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full rounded-xl" />
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="p-4 text-center pt-20 max-w-lg mx-auto">
        <p className="text-muted-foreground">{isRu ? 'Сделка не найдена' : 'Deal not found'}</p>
        <Button variant="link" onClick={() => navigate('/owner/sales')}>{isRu ? 'Назад' : 'Back'}</Button>
      </div>
    );
  }

  const handleStageChange = async (newStage: DealStage) => {
    if (newStage === deal.stage) return;
    try {
      await updateDeal.mutateAsync({
        id: deal.id,
        stage: newStage,
        ...(newStage === 'closed_won' ? { closed_at: new Date().toISOString() } : {}),
      });
      await addActivity.mutateAsync({
        deal_id: deal.id,
        user_id: user!.id,
        activity_type: 'stage_change',
        description: `${DEAL_STAGE_LABELS[deal.stage].en} → ${DEAL_STAGE_LABELS[newStage].en}`,
        stage_from: deal.stage,
        stage_to: newStage,
      });
      toast({ title: isRu ? 'Этап обновлён' : 'Stage updated' });
    } catch {
      toast({ title: isRu ? 'Ошибка' : 'Error', variant: 'destructive' });
    }
  };

  const handleAddActivity = async () => {
    if (!activityText.trim()) return;
    try {
      await addActivity.mutateAsync({
        deal_id: deal.id,
        user_id: user!.id,
        activity_type: activityType,
        description: activityText.trim(),
        stage_from: null,
        stage_to: null,
      });
      setActivityText('');
      toast({ title: isRu ? 'Добавлено' : 'Added' });
    } catch {
      toast({ title: isRu ? 'Ошибка' : 'Error', variant: 'destructive' });
    }
  };

  return (
    <div className="px-4 pt-4 pb-24 max-w-lg mx-auto space-y-6">
      {/* Back */}
      <button onClick={() => navigate('/owner/sales')} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        {isRu ? 'Назад' : 'Back'}
      </button>

      {/* Client info */}
      <div>
        <h1 className="text-xl font-bold">{deal.client_name}</h1>
        <div className="flex flex-wrap gap-3 mt-2 text-sm text-muted-foreground">
          {deal.client_phone && (
            <a href={`tel:${deal.client_phone}`} className="flex items-center gap-1 hover:text-foreground">
              <Phone className="h-3.5 w-3.5" />{deal.client_phone}
            </a>
          )}
          {deal.client_email && (
            <a href={`mailto:${deal.client_email}`} className="flex items-center gap-1 hover:text-foreground">
              <Mail className="h-3.5 w-3.5" />{deal.client_email}
            </a>
          )}
          {deal.client_source && (
            <Badge variant="secondary" className="text-[10px]">{deal.client_source}</Badge>
          )}
        </div>
        {deal.budget_max && (
          <p className="text-sm mt-2">
            {isRu ? 'Бюджет' : 'Budget'}: {deal.budget_min ? `${Number(deal.budget_min).toLocaleString()}–` : ''}{Number(deal.budget_max).toLocaleString()} {deal.currency}
          </p>
        )}
        {deal.notes && <p className="text-sm text-muted-foreground mt-2">{deal.notes}</p>}
      </div>

      {/* Stage bar */}
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-2">{isRu ? 'Этап сделки' : 'Deal Stage'}</p>
        <DealStageBar currentStage={deal.stage} onStageClick={handleStageChange} />
        {deal.stage === 'closed_lost' && (
          <p className="text-xs text-destructive mt-1">{isRu ? 'Проигрыш' : 'Lost'}{deal.lost_reason ? `: ${deal.lost_reason}` : ''}</p>
        )}
      </div>

      {/* Quick actions: add activity */}
      <div className="space-y-3 border rounded-xl p-4 bg-card">
        <p className="text-sm font-medium">{isRu ? 'Добавить активность' : 'Add Activity'}</p>
        <div className="flex gap-2">
          <Select value={activityType} onValueChange={setActivityType}>
            <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="note">{isRu ? 'Заметка' : 'Note'}</SelectItem>
              <SelectItem value="call">{isRu ? 'Звонок' : 'Call'}</SelectItem>
              <SelectItem value="meeting">{isRu ? 'Встреча' : 'Meeting'}</SelectItem>
              <SelectItem value="showing">{isRu ? 'Показ' : 'Showing'}</SelectItem>
              <SelectItem value="message">{isRu ? 'Сообщение' : 'Message'}</SelectItem>
            </SelectContent>
          </Select>
          <Input
            placeholder={isRu ? 'Описание...' : 'Description...'}
            value={activityText}
            onChange={e => setActivityText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAddActivity()}
          />
          <Button size="sm" onClick={handleAddActivity} disabled={addActivity.isPending || !activityText.trim()}>
            +
          </Button>
        </div>
      </div>

      {/* Activity feed */}
      <div>
        <p className="text-sm font-medium mb-3">{isRu ? 'Лента активности' : 'Activity Feed'} ({activities.length})</p>
        {activities.length === 0 ? (
          <p className="text-xs text-muted-foreground">{isRu ? 'Пока нет записей' : 'No activities yet'}</p>
        ) : (
          <div className="space-y-3">
            {activities.map(a => {
              const Icon = activityIcons[a.activity_type] || FileText;
              return (
                <div key={a.id} className="flex gap-3 text-sm">
                  <div className="mt-0.5">
                    <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center">
                      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p>{a.description}</p>
                    <p className="text-xs text-muted-foreground">{format(new Date(a.created_at), 'dd.MM.yy HH:mm')}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
