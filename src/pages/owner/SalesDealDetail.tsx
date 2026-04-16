import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useAgentDeal, useUpdateDeal, useDeleteDeal, DEAL_STAGE_LABELS, DealStage, daysSince, DEAL_TYPE_LABELS, DealType, DEAL_STATUS_LABELS, DealStatus } from '@/hooks/useAgentDeals';
import { useDealActivities, useAddDealActivity } from '@/hooks/useAgentDealActivities';
import { useDealFieldChanges, useLogDealChanges, diffDealFields, TRACKED_DEAL_FIELDS } from '@/hooks/useDealFieldChanges';
import { useLogStageChange } from '@/hooks/useDealStageHistory';
import { DealStageBar } from '@/components/owner/sales/DealStageBar';
import { EditDealSheet } from '@/components/owner/sales/EditDealSheet';
import { CloseDealDialog } from '@/components/owner/sales/CloseDealDialog';
import { PropertyMatching } from '@/components/owner/sales/PropertyMatching';
import { DealScheduledActivities } from '@/components/owner/sales/DealScheduledActivities';
import { DealPriorityStars } from '@/components/owner/sales/DealPriorityStars';
import { DealTagsDisplay } from '@/components/owner/sales/DealTagsInput';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ArrowLeft, Phone, Mail, MessageCircle, Clock, User, FileText, Pencil, Trophy, X, Trash2, ContactRound, Pause, Archive, Play, History, MoreHorizontal, SendHorizonal, Crown, Sparkles, Building2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format, formatDistanceToNow } from 'date-fns';
import { ru, enUS } from 'date-fns/locale';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { getDealTypeEmptyNote, getDealTypeEyebrow, getDealTypeFacts } from '@/components/owner/sales/dealTypePresentation';
import { DealClosingChecklist } from '@/components/owner/sales/DealClosingChecklist';
import { CommissionSummary } from '@/components/owner/sales/CommissionSummary';
import { OfferGeneratorModal } from '@/components/owner/sales/OfferGeneratorModal';
import { APP_ROUTES } from '@/lib/config/routes';
import { usePropertyProject } from '@/hooks/usePropertyProjects';

const activityIcons: Record<string, React.ElementType> = {
  call: Phone,
  meeting: User,
  showing: FileText,
  message: MessageCircle,
  note: FileText,
  stage_change: Clock,
};

const activityColors: Record<string, string> = {
  call: 'bg-info/10 text-info',
  meeting: 'bg-primary/10 text-primary',
  showing: 'bg-warning/10 text-warning',
  message: 'bg-success/10 text-success',
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

  const { data: deal, isLoading, isError: dealError, refetch: refetchDeal } = useAgentDeal(id);
  const { data: linkedProject } = usePropertyProject(deal?.property_project_id ?? undefined);
  const { data: activities = [] } = useDealActivities(id);
  const { data: fieldChanges = [] } = useDealFieldChanges(id);
  const updateDeal = useUpdateDeal();
  const deleteDeal = useDeleteDeal();
  const addActivity = useAddDealActivity();
  const logChanges = useLogDealChanges();
  const logStageChange = useLogStageChange();

  const [activityType, setActivityType] = useState('note');
  const [activityText, setActivityText] = useState('');
  const [showEdit, setShowEdit] = useState(false);
  const [closeMode, setCloseMode] = useState<'won' | 'lost' | null>(null);
  const [showOfferGenerator, setShowOfferGenerator] = useState(false);

  if (isLoading) {
    return (
      <div className="p-4 space-y-4 max-w-lg mx-auto">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-full rounded-xl" />
      </div>
    );
  }

  if (dealError) {
    return (
      <div className="p-4 text-center pt-20 max-w-lg mx-auto">
        <p className="text-destructive font-medium">{isRu ? 'Ошибка загрузки сделки' : 'Failed to load deal'}</p>
        <Button variant="outline" size="sm" className="mt-3" onClick={() => refetchDeal()}>
          {isRu ? 'Повторить' : 'Retry'}
        </Button>
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="p-4 text-center pt-20 max-w-lg mx-auto">
        <p className="text-muted-foreground">{isRu ? 'Сделка не найдена' : 'Deal not found'}</p>
        <Button variant="link" onClick={() => navigate(APP_ROUTES.MC_SALES)}>{isRu ? 'Назад' : 'Back'}</Button>
      </div>
    );
  }

  const dealAge = daysSince(deal.created_at);
  const lastStageChange = activities.find(a => a.activity_type === 'stage_change');
  const stageAge = daysSince(lastStageChange?.created_at || deal.created_at);

  const handleStageChange = async (newStage: DealStage) => {
    if (newStage === deal.stage) return;
    if (newStage === 'closed_won') { setCloseMode('won'); return; }
    if (newStage === 'closed_lost') { setCloseMode('lost'); return; }
    try {
      await logChanges.mutateAsync({ dealId: deal.id, changes: [{ field_name: 'stage', old_value: deal.stage, new_value: newStage }] });
      await updateDeal.mutateAsync({ id: deal.id, stage: newStage });
      await addActivity.mutateAsync({
        deal_id: deal.id, user_id: user!.id, activity_type: 'stage_change',
        description: `${DEAL_STAGE_LABELS[deal.stage].en} → ${DEAL_STAGE_LABELS[newStage].en}`,
        stage_from: deal.stage, stage_to: newStage,
      });
      logStageChange.mutate({ dealId: deal.id, fromStageId: deal.stage, toStageId: newStage });
      toast({ title: isRu ? 'Этап обновлён' : 'Stage updated' });
    } catch {
      toast({ title: isRu ? 'Ошибка' : 'Error', variant: 'destructive' });
    }
  };

  const handleStatusChange = async (newStatus: DealStatus) => {
    if (deal.deal_status === newStatus) return;
    try {
      const oldStatus = deal.deal_status || 'active';
      await logChanges.mutateAsync({ dealId: deal.id, changes: [{ field_name: 'deal_status', old_value: oldStatus, new_value: newStatus }] });
      await updateDeal.mutateAsync({ id: deal.id, deal_status: newStatus });
      await addActivity.mutateAsync({
        deal_id: deal.id, user_id: user!.id, activity_type: 'status_change',
        description: `${DEAL_STATUS_LABELS[oldStatus as DealStatus]?.en || oldStatus} → ${DEAL_STATUS_LABELS[newStatus].en}`,
        stage_from: null, stage_to: null,
      });
      toast({ title: isRu ? 'Статус обновлён' : 'Status updated' });
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
      navigate(APP_ROUTES.MC_SALES);
    } catch {
      toast({ title: isRu ? 'Ошибка' : 'Error', variant: 'destructive' });
    }
  };

  const isClosed = deal.stage === 'closed_won' || deal.stage === 'closed_lost';
  const dealStatus = deal.deal_status || 'active';
  const dealType = deal.deal_type || 'sale';
  const whatsappUrl = deal.client_phone ? `https://wa.me/${deal.client_phone.replace(/[^0-9]/g, '')}` : null;
  const typeFacts = getDealTypeFacts(deal, isRu);
  const typeEyebrow = getDealTypeEyebrow(dealType, isRu);
  const typeNote = deal.notes?.trim() || getDealTypeEmptyNote(dealType, isRu);

  return (
    <div className="px-4 pt-4 pb-24 max-w-lg mx-auto space-y-4">
      {/* Back */}
      <div className="flex items-center justify-between">
        <button onClick={() => navigate(APP_ROUTES.MC_SALES)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          {isRu ? 'Назад' : 'Back'}
        </button>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowOfferGenerator(true)} className="text-primary border-primary/30 hover:bg-primary/10">
            <Sparkles className="h-3.5 w-3.5 mr-1" />
            {isRu ? 'Оффер' : 'Offer'}
          </Button>
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
      <div className="border rounded-xl p-4 bg-card space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-lg font-bold">{deal.client_name}</h1>
          {deal.priority > 0 && <DealPriorityStars priority={deal.priority} size="md" />}
          <Badge variant="outline" className="text-[10px]">
            {isRu ? DEAL_TYPE_LABELS[dealType as DealType]?.ru : DEAL_TYPE_LABELS[dealType as DealType]?.en}
          </Badge>
          {dealStatus !== 'active' && (
            <Badge variant={dealStatus === 'on_hold' ? 'secondary' : 'outline'} className="text-[10px]">
              {isRu ? DEAL_STATUS_LABELS[dealStatus as DealStatus]?.ru : DEAL_STATUS_LABELS[dealStatus as DealStatus]?.en}
            </Badge>
          )}
          {deal.is_vip && (
            <Badge variant="outline" className="text-[10px] border-warning/40 text-warning">
              <Crown className="h-3 w-3 mr-1" />
              VIP
            </Badge>
          )}
          <span className={cn('flex items-center gap-1 text-xs', stageAge > 30 ? 'text-destructive' : stageAge > 14 ? 'text-warning' : 'text-muted-foreground')}>
            <Clock className="h-3 w-3" />
            {dealAge}d {isRu ? 'всего' : 'total'} · {stageAge}d {isRu ? 'в этапе' : 'in stage'}
          </span>
        </div>

        {deal.property_project_id && linkedProject && (
          <div className="flex items-start gap-2 mt-2 rounded-lg border bg-muted/40 px-3 py-2 text-sm">
            <Building2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                {isRu ? 'Проект' : 'Project'}
              </p>
              <p className="font-medium">{isRu ? linkedProject.name_ru || linkedProject.name_en : linkedProject.name_en || linkedProject.name_ru}</p>
            </div>
          </div>
        )}

        {deal.contact_id && (
          <button
            onClick={() => navigate(APP_ROUTES.MC_CONTACT_DETAIL(deal.contact_id!))}
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
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-success hover:text-success/80">
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
        {deal.tags?.length > 0 && (
          <div className="mt-2">
            <DealTagsDisplay tags={deal.tags} />
          </div>
        )}
      </div>

      {/* Deal-type brief */}
      <div className="border rounded-xl p-4 bg-card space-y-3">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{typeEyebrow}</p>
          <p className="text-sm text-muted-foreground mt-1">
            {isRu ? 'Ключевые поля для этого типа сделки' : 'Key fields for this deal type'}
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {typeFacts.map((fact) => (
            <div key={fact.key} className="rounded-lg border bg-background/70 px-3 py-2">
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{fact.label}</p>
              <p className="text-sm font-medium mt-1 break-words">{fact.value}</p>
            </div>
          ))}
        </div>
        <div className="rounded-lg border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{isRu ? 'Контекст:' : 'Context:'}</span> {typeNote}
          {deal.deal_value && (
            <span className="block mt-1 text-success">
              {isRu ? 'Сумма' : 'Value'}: {Number(deal.deal_value).toLocaleString()} {deal.currency || 'THB'}
              {deal.commission_amount && ` · ${isRu ? 'Комиссия' : 'Commission'}: ${Number(deal.commission_amount).toLocaleString()} ${deal.currency || 'THB'}`}
            </span>
          )}
          {(deal.preferred_types?.length || deal.preferred_districts?.length || deal.bedrooms_min) && (
            <div className="flex flex-wrap gap-1 mt-2">
              {deal.preferred_types?.map(t => <Badge key={t} variant="outline" className="text-[10px]">{t}</Badge>)}
              {deal.preferred_districts?.map(d => <Badge key={d} variant="secondary" className="text-[10px]">{d}</Badge>)}
              {deal.bedrooms_min && <Badge variant="secondary" className="text-[10px]">{deal.bedrooms_min}+ {isRu ? 'спален' : 'beds'}</Badge>}
            </div>
          )}
        </div>
      </div>

      {/* Stage bar */}
      <div className="border rounded-xl p-4 bg-card">
        <p className="text-xs font-medium text-muted-foreground mb-2">{isRu ? 'Этап сделки' : 'Deal Stage'}</p>
        <DealStageBar currentStage={deal.stage} onStageClick={!isClosed ? handleStageChange : undefined} />
        {deal.stage === 'closed_won' && deal.won_reason && (
          <p className="text-xs text-success mt-1">{isRu ? 'Успех' : 'Won'}: {deal.won_reason}</p>
        )}
        {deal.stage === 'closed_lost' && (
          <p className="text-xs text-destructive mt-1">{isRu ? 'Проигрыш' : 'Lost'}{deal.lost_reason ? `: ${deal.lost_reason}` : ''}</p>
        )}
      </div>

      {/* Close / Status buttons — Won/Lost prominent, Pause/Archive in dropdown */}
      {!isClosed && (
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1 text-success border-success/30 hover:bg-success/10" onClick={() => setCloseMode('won')}>
            <Trophy className="h-4 w-4 mr-1" />
            {isRu ? 'Успех' : 'Won'}
          </Button>
          <Button variant="outline" size="sm" className="flex-1 text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => setCloseMode('lost')}>
            <X className="h-4 w-4 mr-1" />
            {isRu ? 'Проигрыш' : 'Lost'}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {dealStatus === 'active' ? (
                <>
                  <DropdownMenuItem onClick={() => handleStatusChange('on_hold')}>
                    <Pause className="h-4 w-4 mr-2" />{isRu ? 'На паузу' : 'Put on hold'}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleStatusChange('archived')}>
                    <Archive className="h-4 w-4 mr-2" />{isRu ? 'В архив' : 'Archive'}
                  </DropdownMenuItem>
                </>
              ) : (
                <DropdownMenuItem onClick={() => handleStatusChange('active')}>
                  <Play className="h-4 w-4 mr-2" />{isRu ? 'Активировать' : 'Activate'}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* Scheduled Activities */}
      <DealScheduledActivities dealId={deal.id} companyId={deal.company_id} />

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
          <Button size="sm" onClick={handleAddActivity} disabled={addActivity.isPending || !activityText.trim()}>
            <SendHorizonal className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Commission + Checklist */}
      <CommissionSummary deal={deal} />
      <DealClosingChecklist dealId={deal.id} dealType={dealType} companyId={deal.company_id} />

      {/* Activity feed & Change history tabs */}
      <Tabs defaultValue="activities" className="w-full">
        <TabsList className="w-full">
          <TabsTrigger value="activities" className="flex-1 text-xs">
            {isRu ? 'Активность' : 'Activity'} ({activities.length})
          </TabsTrigger>
          <TabsTrigger value="history" className="flex-1 text-xs">
            <History className="h-3 w-3 mr-1" />
            {isRu ? 'История' : 'History'} ({fieldChanges.length})
          </TabsTrigger>
        </TabsList>
        <TabsContent value="activities" className="mt-3">
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
        </TabsContent>
        <TabsContent value="history" className="mt-3">
          {fieldChanges.length === 0 ? (
            <p className="text-xs text-muted-foreground">{isRu ? 'Нет изменений' : 'No changes recorded'}</p>
          ) : (
            <div className="space-y-2">
              {fieldChanges.map(ch => {
                const fieldLabel = ch.field_name.replace(/_/g, ' ');
                const oldDisplay = ch.old_value ? ch.old_value.replace(/"/g, '') : '—';
                const newDisplay = ch.new_value ? ch.new_value.replace(/"/g, '') : '—';
                return (
                  <div key={ch.id} className="flex gap-3 text-sm border-b border-border/50 pb-2">
                    <div className="mt-0.5">
                      <div className="h-7 w-7 rounded-full flex items-center justify-center bg-muted text-muted-foreground">
                        <History className="h-3.5 w-3.5" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs">
                        <span className="font-medium capitalize">{fieldLabel}</span>
                        {': '}
                        <span className="text-destructive line-through">{oldDisplay}</span>
                        {' → '}
                        <span className="text-primary">{newDisplay}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(ch.created_at), { addSuffix: true, locale })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Sheets & Dialogs */}
      <EditDealSheet open={showEdit} onOpenChange={setShowEdit} deal={deal} />
      <OfferGeneratorModal open={showOfferGenerator} onOpenChange={setShowOfferGenerator} deal={deal} />
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
