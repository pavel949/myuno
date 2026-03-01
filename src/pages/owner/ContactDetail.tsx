import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useCrmContact, useUpdateContact, useDeleteContact } from '@/hooks/useCrmContacts';
import { useContactNotes, useAddContactNote, useDeleteContactNote } from '@/hooks/useCrmContactNotes';
import { useContactDeals } from '@/hooks/useCrmContacts';
import { useCrmActivities, ACTIVITY_TYPE_CONFIG } from '@/hooks/useCrmActivities';
import { useCrmTasks, useUpdateCrmTask } from '@/hooks/useCrmTasks';
import { useMyCompanyId, DEAL_STAGE_LABELS, DealStage } from '@/hooks/useAgentDeals';
import { CreateDealSheet } from '@/components/owner/sales/CreateDealSheet';
import { CrmDocumentsSection } from '@/components/owner/contacts/CrmDocumentsSection';
import { LifecycleStageBar } from '@/components/owner/contacts/LifecycleStageBar';
import { CrmAiAssistantPanel } from '@/components/owner/contacts/CrmAiAssistantPanel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  ArrowLeft, Phone, Mail, MessageCircle, Send as TelegramIcon,
  Clock, Pencil, Trash2, ChevronRight, Plus, Cake, Users, Heart,
  Briefcase, Globe, Star, SendHorizonal, FileText, DollarSign, MapPin,
  ListTodo, CheckCircle, Sparkles,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow, format, differenceInYears } from 'date-fns';
import { ru, enUS } from 'date-fns/locale';
import { EditContactSheet } from '@/components/owner/contacts/EditContactSheet';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { ContactTagPicker } from '@/components/owner/contacts/ContactTagPicker';

const noteTypeIcons: Record<string, string> = {
  note: '📝', call: '📞', meeting: '🤝', email: '📧', whatsapp: '💬',
};

function isBirthdaySoon(birthday: string): boolean {
  const today = new Date();
  const bd = new Date(birthday);
  const thisYearBd = new Date(today.getFullYear(), bd.getMonth(), bd.getDate());
  if (thisYearBd < today) thisYearBd.setFullYear(thisYearBd.getFullYear() + 1);
  const diff = thisYearBd.getTime() - today.getTime();
  return diff >= 0 && diff <= 30 * 24 * 60 * 60 * 1000;
}

const stageDotColors: Record<DealStage, string> = {
  new: 'bg-info',
  contacted: 'bg-info/70',
  showing: 'bg-warning',
  negotiation: 'bg-warning/70',
  contract: 'bg-primary',
  closed_won: 'bg-success',
  closed_lost: 'bg-destructive',
};

export default function ContactDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const locale = isRu ? ru : enUS;
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: contact, isLoading } = useCrmContact(id);
  const { data: notes = [] } = useContactNotes(id);
  const { data: deals = [] } = useContactDeals(id);
  const { data: activities = [] } = useCrmActivities(id);
  const { data: allTasks = [] } = useCrmTasks({ status: 'pending' });
  const updateContact = useUpdateContact();
  const deleteContact = useDeleteContact();
  const addNote = useAddContactNote();
  const deleteNote = useDeleteContactNote();
  const updateTask = useUpdateCrmTask();
  const { data: membership } = useMyCompanyId();

  const [showEdit, setShowEdit] = useState(false);
  const [showCreateDeal, setShowCreateDeal] = useState(false);
  const [noteType, setNoteType] = useState('note');
  const [noteText, setNoteText] = useState('');

  // Filter tasks for this contact
  const contactTasks = allTasks.filter(t => t.contact_id === id);

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-4 max-w-[1536px] mx-auto">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="p-4 md:p-6 lg:p-8 text-center pt-20 max-w-[1536px] mx-auto">
        <p className="text-muted-foreground">{isRu ? 'Контакт не найден' : 'Contact not found'}</p>
        <Button variant="link" onClick={() => navigate('/owner/contacts')}>{isRu ? 'Назад' : 'Back'}</Button>
      </div>
    );
  }

  const whatsappUrl = (contact.whatsapp || contact.phone)
    ? `https://wa.me/${(contact.whatsapp || contact.phone)!.replace(/[^0-9]/g, '')}`
    : null;
  const birthdaySoon = contact.birthday ? isBirthdaySoon(contact.birthday) : false;
  const age = contact.birthday ? differenceInYears(new Date(), new Date(contact.birthday)) : null;
  const lastContactedAt = notes.length > 0 ? notes[0].created_at : null;
  const scoringColor = (contact.scoring ?? 0) >= 70 ? 'text-success' : (contact.scoring ?? 0) >= 40 ? 'text-warning' : 'text-muted-foreground';

  const handleAddNote = async () => {
    if (!noteText.trim() || !user) return;
    try {
      await addNote.mutateAsync({
        contact_id: contact.id,
        user_id: user.id,
        note_type: noteType,
        content: noteText.trim(),
      });
      setNoteText('');
      toast({ title: isRu ? 'Заметка добавлена' : 'Note added' });
    } catch {
      toast({ title: isRu ? 'Ошибка' : 'Error', variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    try {
      await deleteContact.mutateAsync(contact.id);
      toast({ title: isRu ? 'Контакт удалён' : 'Contact deleted' });
      navigate('/owner/contacts');
    } catch {
      toast({ title: isRu ? 'Ошибка' : 'Error', variant: 'destructive' });
    }
  };

  const toggleTag = async (tag: string) => {
    const newTags = contact.tags.includes(tag)
      ? contact.tags.filter(t => t !== tag)
      : [...contact.tags, tag];
    await updateContact.mutateAsync({ id: contact.id, tags: newTags });
  };

  const handleLifecycleChange = async (stage: string) => {
    await updateContact.mutateAsync({ id: contact.id, lifecycle_stage: stage } as any);
  };

  const handleCompleteTask = async (taskId: string) => {
    await updateTask.mutateAsync({ id: taskId, status: 'completed', completed_at: new Date().toISOString() });
  };

  // Merge activities and notes into a unified timeline
  const timelineItems = [
    ...notes.map(n => ({ type: 'note' as const, date: n.created_at, data: n })),
    ...activities.map(a => ({ type: 'activity' as const, date: a.activity_date, data: a })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="px-4 md:px-6 lg:px-8 pt-4 pb-24 md:pb-8 max-w-[1536px] mx-auto space-y-6">
      {/* Back */}
      <button onClick={() => navigate('/owner/contacts')} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="h-4 w-4" />
        {isRu ? 'Контакты' : 'Contacts'}
      </button>

      {/* Hero Profile Card */}
      <div className="rounded-2xl border bg-card overflow-hidden">
        {/* Gradient header strip */}
        <div className="h-20 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent" />
        <div className="px-5 pb-5 -mt-10">
          <div className="flex items-end gap-4 flex-wrap">
            {/* Avatar */}
            {contact.avatar_url ? (
              <img src={contact.avatar_url} alt="" className="h-20 w-20 rounded-2xl object-cover border-4 border-card shadow-lg" />
            ) : (
              <div className="h-20 w-20 rounded-2xl bg-primary/10 border-4 border-card shadow-lg flex items-center justify-center">
                <span className="text-2xl font-bold text-primary">
                  {contact.first_name.charAt(0)}{contact.last_name.charAt(0)}
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0 pb-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold tracking-tight">{contact.first_name} {contact.last_name}</h1>
                {(contact.scoring ?? 0) > 0 && (
                  <span className={cn('text-sm font-semibold flex items-center gap-0.5', scoringColor)}>
                    <Star className="h-3.5 w-3.5" />{contact.scoring}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {contact.contact_type && <Badge variant="secondary" className="text-[11px]">{contact.contact_type}</Badge>}
                {contact.source && <Badge variant="outline" className="text-[11px]">{contact.source}</Badge>}
                {contact.nationality && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Globe className="h-3 w-3" />{contact.nationality}
                  </span>
                )}
                {contact.language && (
                  <span className="text-xs text-muted-foreground">{contact.language}</span>
                )}
              </div>
              {lastContactedAt && (
                <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {isRu ? 'Последний контакт' : 'Last contact'}: {formatDistanceToNow(new Date(lastContactedAt), { addSuffix: true, locale })}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 pb-1">
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
                    <AlertDialogTitle>{isRu ? 'Удалить контакт?' : 'Delete contact?'}</AlertDialogTitle>
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

          {/* Lifecycle Stage Bar */}
          <div className="mt-4">
            <LifecycleStageBar
              currentStage={(contact as any).lifecycle_stage || 'lead'}
              onChange={handleLifecycleChange}
            />
          </div>

          {/* Quick action chips */}
          <div className="flex flex-wrap gap-2 mt-3">
            {contact.phone && (
              <a href={`tel:${contact.phone}`} className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-xl bg-muted hover:bg-muted/80 transition-colors">
                <Phone className="h-3.5 w-3.5 text-primary" />{contact.phone}
              </a>
            )}
            {whatsappUrl && (
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-xl bg-success/10 text-success hover:bg-success/20 transition-colors">
                <MessageCircle className="h-3.5 w-3.5" />WhatsApp
              </a>
            )}
            {contact.email && (
              <a href={`mailto:${contact.email}`} className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-xl bg-muted hover:bg-muted/80 transition-colors">
                <Mail className="h-3.5 w-3.5 text-primary" />{contact.email}
              </a>
            )}
            {contact.telegram && (
              <a href={`https://t.me/${contact.telegram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-xl bg-info/10 text-info hover:bg-info/20 transition-colors">
                <TelegramIcon className="h-3.5 w-3.5" />{contact.telegram}
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Tabs layout */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="w-full justify-start bg-transparent border-b rounded-none h-auto p-0 gap-0 overflow-x-auto">
          <TabsTrigger value="overview" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2.5 text-sm">
            {isRu ? 'Обзор' : 'Overview'}
          </TabsTrigger>
          <TabsTrigger value="deals" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2.5 text-sm">
            {isRu ? 'Сделки' : 'Deals'} {deals.length > 0 && `(${deals.length})`}
          </TabsTrigger>
          <TabsTrigger value="tasks" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2.5 text-sm">
            <ListTodo className="h-3.5 w-3.5 mr-1.5" />
            {isRu ? 'Задачи' : 'Tasks'} {contactTasks.length > 0 && `(${contactTasks.length})`}
          </TabsTrigger>
          <TabsTrigger value="documents" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2.5 text-sm">
            <FileText className="h-3.5 w-3.5 mr-1.5" />
            {isRu ? 'Документы' : 'Documents'}
          </TabsTrigger>
          <TabsTrigger value="timeline" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2.5 text-sm">
            {isRu ? 'Хронология' : 'Timeline'}
          </TabsTrigger>
          <TabsTrigger value="ai" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2.5 text-sm">
            <Sparkles className="h-3.5 w-3.5 mr-1.5" />
            AI
          </TabsTrigger>
        </TabsList>

        {/* ===== OVERVIEW ===== */}
        <TabsContent value="overview" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {/* Personal */}
            {(contact.birthday || contact.family_info || contact.interests?.length) && (
              <div className="rounded-xl border bg-card p-4 space-y-3">
                <p className="text-sm font-semibold flex items-center gap-2">
                  <Heart className="h-4 w-4 text-muted-foreground" />
                  {isRu ? 'Персональное' : 'Personal'}
                </p>
                {contact.birthday && (
                  <div className="flex items-center gap-2 text-sm">
                    <Cake className={cn('h-4 w-4', birthdaySoon ? 'text-warning' : 'text-muted-foreground')} />
                    <span>
                      {format(new Date(contact.birthday), 'd MMMM', { locale })}
                      {age !== null && <span className="text-muted-foreground ml-1">({age})</span>}
                    </span>
                    {birthdaySoon && (
                      <Badge variant="secondary" className="text-[10px] bg-warning/10 text-warning border-warning/20">
                        🎂 {isRu ? 'Скоро!' : 'Soon!'}
                      </Badge>
                    )}
                  </div>
                )}
                {contact.family_info && (
                  <div className="flex items-start gap-2 text-sm">
                    <Users className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <span className="text-muted-foreground">{contact.family_info}</span>
                  </div>
                )}
                {contact.interests && contact.interests.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {contact.interests.map(i => <Badge key={i} variant="outline" className="text-[10px]">{i}</Badge>)}
                  </div>
                )}
              </div>
            )}

            {/* Professional */}
            {(contact.job_title || contact.company_name) && (
              <div className="rounded-xl border bg-card p-4 space-y-3">
                <p className="text-sm font-semibold flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  {isRu ? 'Профессиональное' : 'Professional'}
                </p>
                <div className="text-sm">
                  {contact.job_title && <span className="font-medium">{contact.job_title}</span>}
                  {contact.job_title && contact.company_name && <span className="text-muted-foreground"> · </span>}
                  {contact.company_name && <span className="text-muted-foreground">{contact.company_name}</span>}
                </div>
              </div>
            )}

            {/* Preferences */}
            {(contact.budget_max || contact.preferred_types?.length || contact.preferred_districts?.length) && (
              <div className="rounded-xl border bg-card p-4 space-y-3">
                <p className="text-sm font-semibold flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  {isRu ? 'Предпочтения' : 'Preferences'}
                </p>
                {contact.budget_max && (
                  <p className="text-sm flex items-center gap-1.5">
                    <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                    {contact.budget_min ? `${Number(contact.budget_min).toLocaleString()}–` : ''}{Number(contact.budget_max).toLocaleString()} {contact.currency}
                  </p>
                )}
                {contact.bedrooms_min && (
                  <p className="text-sm text-muted-foreground">{contact.bedrooms_min}+ {isRu ? 'спален' : 'bedrooms'}</p>
                )}
                <div className="flex flex-wrap gap-1">
                  {contact.preferred_types?.map(t => <Badge key={t} variant="outline" className="text-[10px]">{t}</Badge>)}
                  {contact.preferred_districts?.map(d => <Badge key={d} variant="secondary" className="text-[10px]">{d}</Badge>)}
                </div>
              </div>
            )}

            {/* Tags */}
            <div className="rounded-xl border bg-card p-4 space-y-3">
              <p className="text-sm font-semibold">{isRu ? 'Теги' : 'Tags'}</p>
              <ContactTagPicker
                companyId={contact.company_id}
                selectedTags={contact.tags || []}
                onToggle={toggleTag}
              />
            </div>

            {/* Notes */}
            {contact.notes && (
              <div className="rounded-xl border bg-card p-4 space-y-2 md:col-span-2">
                <p className="text-sm font-semibold">{isRu ? 'Заметки' : 'Notes'}</p>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{contact.notes}</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* ===== DEALS ===== */}
        <TabsContent value="deals" className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">{isRu ? 'Связанные сделки' : 'Linked Deals'}</p>
            <Button variant="outline" size="sm" onClick={() => setShowCreateDeal(true)}>
              <Plus className="h-3.5 w-3.5 mr-1" />
              {isRu ? 'Новая сделка' : 'New Deal'}
            </Button>
          </div>
          {deals.length === 0 ? (
            <div className="text-center py-12 rounded-xl border bg-card">
              <DollarSign className="h-10 w-10 mx-auto text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">{isRu ? 'Нет связанных сделок' : 'No linked deals'}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {deals.map((d) => {
                const stage = d.stage as DealStage;
                const label = isRu ? DEAL_STAGE_LABELS[stage]?.ru : DEAL_STAGE_LABELS[stage]?.en;
                return (
                  <button
                    key={d.id}
                    onClick={() => navigate(`/owner/sales/${d.id}`)}
                    className="w-full text-left p-4 rounded-xl border bg-card hover:bg-accent/50 transition-colors flex items-center gap-3"
                  >
                    <div className={cn('h-3 w-3 rounded-full shrink-0', stageDotColors[stage] || 'bg-muted')} />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium">{d.client_name}</span>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-[10px]">{label || stage}</Badge>
                        {d.budget_max && <span className="text-xs text-muted-foreground">{Number(d.budget_max).toLocaleString()} {d.currency}</span>}
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                  </button>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ===== TASKS ===== */}
        <TabsContent value="tasks" className="mt-4 space-y-4">
          {contactTasks.length === 0 ? (
            <div className="text-center py-12 rounded-xl border bg-card">
              <ListTodo className="h-10 w-10 mx-auto text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">{isRu ? 'Нет задач для этого контакта' : 'No tasks for this contact'}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {contactTasks.map(task => (
                <div key={task.id} className="flex items-center gap-3 p-3 rounded-xl border bg-card">
                  <button onClick={() => handleCompleteTask(task.id)} className="shrink-0">
                    <CheckCircle className={cn('h-5 w-5', task.status === 'completed' ? 'text-success' : 'text-muted-foreground/30 hover:text-success/60')} />
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{task.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant="outline" className="text-[10px]">{task.task_type}</Badge>
                      {task.due_date && (
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(task.due_date), 'd MMM', { locale })}
                        </span>
                      )}
                      <Badge variant={task.priority === 'high' ? 'destructive' : 'secondary'} className="text-[10px]">
                        {task.priority}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ===== DOCUMENTS ===== */}
        <TabsContent value="documents" className="mt-4">
          {membership?.company_id ? (
            <div className="rounded-xl border bg-card p-5">
              <CrmDocumentsSection
                companyId={membership.company_id}
                contactId={contact.id}
              />
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground text-sm">
              {isRu ? 'Документы доступны только для УК' : 'Documents available for management companies'}
            </div>
          )}
        </TabsContent>

        {/* ===== TIMELINE (unified: notes + activities) ===== */}
        <TabsContent value="timeline" className="mt-4 space-y-4">
          {/* Add note */}
          <div className="flex gap-2">
            <Select value={noteType} onValueChange={setNoteType}>
              <SelectTrigger className="w-[110px] h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="note">{isRu ? 'Заметка' : 'Note'}</SelectItem>
                <SelectItem value="call">{isRu ? 'Звонок' : 'Call'}</SelectItem>
                <SelectItem value="meeting">{isRu ? 'Встреча' : 'Meeting'}</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
              </SelectContent>
            </Select>
            <Input
              placeholder={isRu ? 'Добавить заметку...' : 'Add a note...'}
              value={noteText}
              onChange={e => setNoteText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddNote()}
              className="h-9"
            />
            <Button size="sm" className="h-9" onClick={handleAddNote} disabled={addNote.isPending || !noteText.trim()}>
              <SendHorizonal className="h-4 w-4" />
            </Button>
          </div>

          {timelineItems.length === 0 ? (
            <div className="text-center py-12 rounded-xl border bg-card">
              <Clock className="h-10 w-10 mx-auto text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">{isRu ? 'Нет активности' : 'No activity yet'}</p>
            </div>
          ) : (
            <div className="space-y-1">
              {timelineItems.map((item, idx) => {
                if (item.type === 'note') {
                  const note = item.data as any;
                  return (
                    <div key={`note-${note.id}`} className="flex gap-3 p-3 rounded-lg hover:bg-muted/30 transition-colors group">
                      <span className="text-lg mt-0.5 shrink-0">{noteTypeIcons[note.note_type] || '📝'}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm">{note.content}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {formatDistanceToNow(new Date(note.created_at), { addSuffix: true, locale })}
                        </p>
                      </div>
                      <button
                        onClick={() => deleteNote.mutate({ id: note.id, contactId: contact.id })}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive shrink-0 self-center"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  );
                } else {
                  const activity = item.data as any;
                  const config = ACTIVITY_TYPE_CONFIG[activity.activity_type];
                  return (
                    <div key={`act-${activity.id}`} className="flex gap-3 p-3 rounded-lg hover:bg-muted/30 transition-colors">
                      <span className={cn('text-sm mt-0.5 shrink-0 font-medium', config?.color || 'text-muted-foreground')}>
                        {config ? (isRu ? config.labelRu : config.labelEn) : activity.activity_type}
                      </span>
                      <div className="flex-1 min-w-0">
                        {activity.subject && <p className="text-sm font-medium">{activity.subject}</p>}
                        {activity.description && <p className="text-xs text-muted-foreground">{activity.description}</p>}
                        {activity.outcome && <Badge variant="outline" className="text-[10px] mt-1">{activity.outcome}</Badge>}
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {formatDistanceToNow(new Date(activity.activity_date), { addSuffix: true, locale })}
                        </p>
                      </div>
                    </div>
                  );
                }
              })}
            </div>
          )}
        </TabsContent>

        {/* ===== AI ASSISTANT ===== */}
        <TabsContent value="ai" className="mt-4">
          <CrmAiAssistantPanel contactId={contact.id} companyId={contact.company_id} />
        </TabsContent>
      </Tabs>

      {/* Sheets */}
      {contact && <EditContactSheet open={showEdit} onOpenChange={setShowEdit} contact={contact} />}
      {contact && membership?.company_id && (
        <CreateDealSheet
          open={showCreateDeal}
          onOpenChange={setShowCreateDeal}
          companyId={membership.company_id}
          prefilledContact={contact}
        />
      )}
    </div>
  );
}
