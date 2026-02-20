import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useAgentDeal, useUpdateDeal, useDeleteDeal, DEAL_STAGE_LABELS, DealStage, daysSince } from '@/hooks/useAgentDeals';
import { useDealActivities, useAddDealActivity } from '@/hooks/useAgentDealActivities';
import { DealStageBar } from '@/components/owner/sales/DealStageBar';
import { EditDealSheet } from '@/components/owner/sales/EditDealSheet';
import { CloseDealDialog } from '@/components/owner/sales/CloseDealDialog';
import { PropertyMatching } from '@/components/owner/sales/PropertyMatching';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Phone, Mail, MessageCircle, Clock, User, FileText, Pencil, Trophy, X, Trash2, ContactRound } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format, formatDistanceToNow } from 'date-fns';
import { ru, enUS } from 'date-fns/locale';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';

const activityIcons: Record<string, React.ElementType> = {
  call: Phone,
  meeting: User,
  showing: FileText,
  message: MessageCircle,
  note: FileText,
  stage_change: Clock,
};

const activityColors: Record<string, string> = {
  call: 'bg-blue-500/10 text-blue-600',
  meeting: 'bg-purple-500/10 text-purple-600',
  showing: 'bg-amber-500/10 text-amber-600',
  message: 'bg-green-500/10 text-green-600',
  note: 'bg-muted text-muted-foreground',
  stage_change: 'bg-primary/10 text-primary',
};

export default function SalesDealDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const locale = isRu ? ru : enUS;
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: deal, isLoading } = useAgentDeal(id);
  const { data: activities = [] } = useDealActivities(id);
  const updateDeal = useUpdateDeal();
  const deleteDeal = useDeleteDeal();
  const addActivity = useAddDealActivity();

  const [activityType, setActivityType] = useState('note');
  const [activityText, setActivityText] = useState('');
  const [showEdit, setShowEdit] = useState(false);
  const [closeMode, setCloseMode] = useState<'won' | 'lost' | null>(null);

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

  const dealAge = daysSince(deal.created_at);
  const stageAge = daysSince(deal.updated_at);

  const handleStageChange = async (newStage: DealStage) => {
    if (newStage === deal.stage) return;
    if (newStage === 'closed_won') { setCloseMode('won'); return; }
    if (newStage === 'closed_lost') { setCloseMode('lost'); return; }
    try {
      await updateDeal.mutateAsync({ id: deal.id, stage: newStage });
      await addActivity.mutateAsync({
        deal_id: deal.id, user_id: user!.id, activity_type: 'stage_change',
        description: `${DEAL_STAGE_LABELS[deal.stage].en} → ${DEAL_STAGE_LABELS[newStage].en}`,
        stage_from: deal.stage, stage_to: newStage,
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
        deal_id: deal.id, user_id: user!.id, activity_type: activityType,
        description: activityText.trim(), stage_from: null, stage_to: null,
      });
      setActivityText('');
      toast({ title: isRu ? 'Добавлено' : 'Added' });
    } catch {
      toast({ title: isRu ? 'Ошибка' : 'Error', variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    try {
      await deleteDeal.mutateAsync(deal.id);
      toast({ title: isRu ? 'Сделка удалена' : 'Deal deleted' });
      navigate('/owner/sales');
    } catch {
      toast({ title: isRu ? 'Ошибка' : 'Error', variant: 'destructive' });
    }
  };

  const isClosed = deal.stage === 'closed_won' || deal.stage === 'closed_lost';
  const whatsappUrl = deal.client_phone ? `https://wa.me/${deal.client_phone.replace(/[^0-9]/g, '')}` : null;

  return (
    <div className="px-4 pt-4 pb-24 max-w-lg mx-auto space-y-6">
      {/* Back */}
      <div className="flex items-center justify-between">
        <button onClick={() => navigate('/owner/sales')} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          {isRu ? 'Назад' : 'Back'}
        </button>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowEdit(true)}>
            <Pencil className="h-3.5 w-3.5 mr-1" />
            {isRu ? 'Ред.' : 'Edit'}
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{isRu ? 'Удалить сделку?' : 'Delete deal?'}</AlertDialogTitle>
                <AlertDialogDescription>{isRu ? 'Это действие нельзя отменить' : 'This action cannot be undone'}</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{isRu ? 'Отмена' : 'Cancel'}</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  {isRu ? 'Удалить' : 'Delete'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Client info */}
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold">{deal.client_name}</h1>
          <span className={cn('flex items-center gap-1 text-xs', stageAge > 30 ? 'text-red-500' : stageAge > 14 ? 'text-amber-500' : 'text-muted-foreground')}>
            <Clock className="h-3 w-3" />
            {dealAge}d {isRu ? 'всего' : 'total'} · {stageAge}d {isRu ? 'в этапе' : 'in stage'}
          </span>
        </div>

        {/* Link to contact dossier */}
        {deal.contact_id && (
          <button
            onClick={() => navigate(`/owner/contacts/${deal.contact_id}`)}
            className="flex items-center gap-1.5 mt-2 text-xs text-primary hover:text-primary/80 transition-colors"
          >
            <ContactRound className="h-3.5 w-3.5" />
            {isRu ? 'Открыть досье контакта' : 'Open contact dossier'}
          </button>
        )}

        <div className="flex flex-wrap gap-3 mt-2 text-sm text-muted-foreground">
          {deal.client_phone && (
            <a href={`tel:${deal.client_phone}`} className="flex items-center gap-1 hover:text-foreground">
              <Phone className="h-3.5 w-3.5" />{deal.client_phone}
            </a>
          )}
          {whatsappUrl && (
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-green-600 hover:text-green-500">
              <MessageCircle className="h-3.5 w-3.5" />WhatsApp
            </a>
          )}
          {deal.client_email && (
            <a href={`mailto:${deal.client_email}`} className="flex items-center gap-1 hover:text-foreground">
              <Mail className="h-3.5 w-3.5" />{deal.client_email}
            </a>
          )}
          {deal.client_source && <Badge variant="secondary" className="text-[10px]">{deal.client_source}</Badge>}
        </div>
        {deal.budget_max && (
          <p className="text-sm mt-2">
            {isRu ? 'Бюджет' : 'Budget'}: {deal.budget_min ? `${Number(deal.budget_min).toLocaleString()}–` : ''}{Number(deal.budget_max).toLocaleString()} {deal.currency}
          </p>
        )}
        {(deal.preferred_types?.length || deal.preferred_districts?.length) && (
          <div className="flex flex-wrap gap-1 mt-2">
            {deal.preferred_types?.map(t => <Badge key={t} variant="outline" className="text-[10px]">{t}</Badge>)}
            {deal.preferred_districts?.map(d => <Badge key={d} variant="secondary" className="text-[10px]">{d}</Badge>)}
            {deal.bedrooms_min && <Badge variant="secondary" className="text-[10px]">{deal.bedrooms_min}+ {isRu ? 'спален' : 'beds'}</Badge>}
          </div>
        )}
        {deal.next_action && (
          <p className="text-sm mt-1 text-primary">
            {isRu ? 'Следующий шаг' : 'Next'}: {deal.next_action}
            {deal.next_action_date && ` — ${format(new Date(deal.next_action_date), 'dd.MM.yy')}`}
          </p>
        )}
        {deal.notes && <p className="text-sm text-muted-foreground mt-2">{deal.notes}</p>}
        {deal.deal_value && (
          <div className="mt-2 p-2 rounded-lg bg-green-500/10 text-green-700 dark:text-green-400 text-sm">
            {isRu ? 'Сумма' : 'Value'}: {Number(deal.deal_value).toLocaleString()} {deal.currency || 'THB'}
            {deal.commission_amount && ` · ${isRu ? 'Комиссия' : 'Commission'}: ${Number(deal.commission_amount).toLocaleString()} ${deal.currency || 'THB'}`}
          </div>
        )}
      </div>

      {/* Stage bar */}
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-2">{isRu ? 'Этап сделки' : 'Deal Stage'}</p>
        <DealStageBar currentStage={deal.stage} onStageClick={!isClosed ? handleStageChange : undefined} />
        {deal.stage === 'closed_lost' && (
          <p className="text-xs text-destructive mt-1">{isRu ? 'Проигрыш' : 'Lost'}{deal.lost_reason ? `: ${deal.lost_reason}` : ''}</p>
        )}
      </div>

      {/* Close buttons */}
      {!isClosed && (
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1 text-green-600 border-green-600/30 hover:bg-green-500/10" onClick={() => setCloseMode('won')}>
            <Trophy className="h-4 w-4 mr-1" />
            {isRu ? 'Успех' : 'Won'}
          </Button>
          <Button variant="outline" size="sm" className="flex-1 text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => setCloseMode('lost')}>
            <X className="h-4 w-4 mr-1" />
            {isRu ? 'Проигрыш' : 'Lost'}
          </Button>
        </div>
      )}

      {/* Property matching */}
      <div className="border rounded-xl p-4 bg-card">
        <p className="text-sm font-medium mb-3">{isRu ? 'Подходящие объекты' : 'Matching Properties'}</p>
        <PropertyMatching deal={deal} />
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
          <Button size="sm" onClick={handleAddActivity} disabled={addActivity.isPending || !activityText.trim()}>+</Button>
        </div>
      </div>

      {/* Activity feed with relative timestamps */}
      <div>
        <p className="text-sm font-medium mb-3">{isRu ? 'Лента активности' : 'Activity Feed'} ({activities.length})</p>
        {activities.length === 0 ? (
          <p className="text-xs text-muted-foreground">{isRu ? 'Пока нет записей' : 'No activities yet'}</p>
        ) : (
          <div className="space-y-3">
            {activities.map(a => {
              const Icon = activityIcons[a.activity_type] || FileText;
              const colorClass = activityColors[a.activity_type] || 'bg-muted text-muted-foreground';
              return (
                <div key={a.id} className="flex gap-3 text-sm">
                  <div className="mt-0.5">
                    <div className={cn('h-7 w-7 rounded-full flex items-center justify-center', colorClass)}>
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p>{a.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(a.created_at), { addSuffix: true, locale })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Sheets & Dialogs */}
      <EditDealSheet open={showEdit} onOpenChange={setShowEdit} deal={deal} />
      {closeMode && (
        <CloseDealDialog
          open={!!closeMode}
          onOpenChange={open => !open && setCloseMode(null)}
          dealId={deal.id}
          currentStage={deal.stage}
          mode={closeMode}
        />
      )}
    </div>
  );
}
