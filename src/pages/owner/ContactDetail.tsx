import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useCrmContact, useUpdateContact, useDeleteContact } from '@/hooks/useCrmContacts';
import { APP_ROUTES } from '@/lib/config/routes';
import { useContactNotes, useAddContactNote, useDeleteContactNote } from '@/hooks/useCrmContactNotes';
import { useContactDeals } from '@/hooks/useCrmContacts';
import { useCrmActivities, ACTIVITY_TYPE_CONFIG } from '@/hooks/useCrmActivities';
import { useCrmTasks, useUpdateCrmTask, useCreateCrmTask } from '@/hooks/useCrmTasks';
import { useCrmMeetings } from '@/hooks/useCrmMeetings';
import { InlineTaskCreator } from '@/components/owner/contacts/InlineTaskCreator';
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
import { Separator } from '@/components/ui/separator';
import {
  Phone, Mail, MessageCircle, Send as TelegramIcon,
  Clock, Pencil, Trash2, ChevronRight, ChevronLeft, Plus, Cake, Users, Heart,
  Briefcase, Globe, Star, SendHorizonal, FileText, DollarSign, MapPin,
  ListTodo, CheckCircle, Sparkles, CalendarDays, ShoppingCart, Receipt,
  Building2, User, ExternalLink, Hash, Smartphone,
} from 'lucide-react';
import { BackButton } from '@/components/uno/BackButton';
import { formatDistanceToNow, format, differenceInYears } from 'date-fns';
import { ru, enUS } from 'date-fns/locale';
import { EditContactSheet } from '@/components/owner/contacts/EditContactSheet';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { ContactTagPicker } from '@/components/owner/contacts/ContactTagPicker';
import { ContactPropertiesSection } from '@/components/owner/contacts/ContactPropertiesSection';
import { ContactRelationshipsCard } from '@/components/owner/contacts/ContactRelationshipsCard';
import { KeyDatesCard } from '@/components/owner/contacts/KeyDatesCard';
import { RemindersList } from '@/components/owner/contacts/RemindersList';
import { CRM_ROLES, CRM_ROLE_LABELS } from '@/types/contact';
import { toast } from 'sonner';

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

// ─── Odoo-style labeled field row ───
function FieldRow({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  if (!children) return null;
  return (
    <div className={cn("flex items-start gap-3 py-1.5 text-sm", className)}>
      <span className="w-24 shrink-0 text-muted-foreground font-medium text-right">{label}</span>
      <span className="flex-1 min-w-0">{children}</span>
    </div>
  );
}

export default function ContactDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const locale = isRu ? ru : enUS;
  const { user } = useAuth();

  const { data: contact, isLoading, isError } = useCrmContact(id);
  const { data: notes = [] } = useContactNotes(id);
  const { data: deals = [] } = useContactDeals(id);
  const { data: activities = [] } = useCrmActivities(id);
  const { data: allTasks = [] } = useCrmTasks({ status: 'pending' });
  const { data: membership } = useMyCompanyId();
  const { data: meetings = [] } = useCrmMeetings(membership?.company_id, { contactId: id });
  const updateContact = useUpdateContact();
  const deleteContact = useDeleteContact();
  const addNote = useAddContactNote();
  const deleteNote = useDeleteContactNote();
  const updateTask = useUpdateCrmTask();

  const [activeTab, setActiveTab] = useState('overview');
  const [showEdit, setShowEdit] = useState(false);
  const [showCreateDeal, setShowCreateDeal] = useState(false);
  const [noteType, setNoteType] = useState('note');
  const [noteText, setNoteText] = useState('');
  const [chatterTab, setChatterTab] = useState<'message' | 'note' | 'activities'>('note');

  const contactTasks = allTasks.filter(t => t.contact_id === id);

  // Unified timeline
  const timelineItems = useMemo(() => [
    ...notes.map(n => ({ type: 'note' as const, date: n.created_at, data: n })),
    ...activities.map(a => ({ type: 'activity' as const, date: a.activity_date, data: a })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()), [notes, activities]);

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-4 max-w-[1536px] mx-auto">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-4 md:p-6 lg:p-8 text-center pt-20 max-w-[1536px] mx-auto">
        <p className="text-destructive font-medium">{isRu ? 'Ошибка загрузки контакта' : 'Failed to load contact'}</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate(APP_ROUTES.MC_CONTACTS)}>
          {isRu ? 'К списку контактов' : 'Back to contacts'}
        </Button>
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="p-4 md:p-6 lg:p-8 text-center pt-20 max-w-[1536px] mx-auto">
        <p className="text-muted-foreground">{isRu ? 'Контакт не найден' : 'Contact not found'}</p>
        <Button variant="link" onClick={() => navigate(APP_ROUTES.MC_CONTACTS)}>{isRu ? 'Назад' : 'Back'}</Button>
      </div>
    );
  }

  const whatsappUrl = (contact.whatsapp || contact.phone)
    ? `https://wa.me/${(contact.whatsapp || contact.phone)!.replace(/[^0-9]/g, '')}`
    : null;
  const birthdaySoon = contact.birthday ? isBirthdaySoon(contact.birthday) : false;
  const age = contact.birthday ? differenceInYears(new Date(), new Date(contact.birthday)) : null;
  const scoringColor = (contact.scoring ?? 0) >= 70 ? 'text-success' : (contact.scoring ?? 0) >= 40 ? 'text-warning' : 'text-muted-foreground';

  const handleAddNote = async () => {
    if (!noteText.trim() || !user) return;
    try {
      await addNote.mutateAsync({
        contact_id: contact.id,
        user_id: user.id,
        note_type: chatterTab === 'message' ? 'email' : noteType,
        content: noteText.trim(),
      });
      setNoteText('');
      toast(isRu);
      // Error handled` : ''}`, icon: DollarSign },
                { value: 'tasks', label: `${isRu ? 'Задачи' : 'Tasks'}${contactTasks.length > 0 ? ` (${contactTasks.length})` : ''}`, icon: ListTodo },
                { value: 'documents', label: isRu ? 'Документы' : 'Documents', icon: FileText },
                { value: 'ai', label: 'AI', icon: Sparkles },
              ].map(tab => (
                <TabsTrigger key={tab.value} value={tab.value} className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2.5 text-sm">
                  {tab.icon && <tab.icon className="h-3.5 w-3.5 mr-1.5" />}
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* Overview */}
            <TabsContent value="overview" className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                {contact.notes && (
                  <div className="rounded-xl border bg-card p-4 space-y-2 md:col-span-2">
                    <p className="text-sm font-semibold">{isRu ? 'Заметки' : 'Notes'}</p>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{contact.notes}</p>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Properties */}
            <TabsContent value="properties" className="mt-4">
              <ContactPropertiesSection contactId={contact.id} companyId={contact.company_id} />
            </TabsContent>

            {/* Relationships */}
            <TabsContent value="relationships" className="mt-4">
              <ContactRelationshipsCard contactId={contact.id} companyId={contact.company_id} />
            </TabsContent>

            {/* Timeline */}
            <TabsContent value="timeline" className="mt-4">
              <div className="space-y-4">
                <p className="text-sm font-medium">{isRu ? 'Активность' : 'Activity'}</p>
                {timelineItems.length === 0 ? (
                  <div className="text-center py-12 rounded-xl border bg-card">
                    <Clock className="h-10 w-10 mx-auto text-muted-foreground/30 mb-2" />
                    <p className="text-sm text-muted-foreground">{isRu ? 'Нет активности' : 'No activity yet'}</p>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="absolute left-[13px] top-4 bottom-4 w-0.5 bg-border" />
                    {timelineItems.slice(0, 50).map((item, idx) => {
                      if (item.type === 'note') {
                        const note = item.data as { id: string; note_type: string; content: string; created_at: string };
                        return (
                          <div key={`note-${note.id}`} className="flex gap-2.5 p-2 rounded-lg hover:bg-muted/30 relative">
                            <span className="flex h-[26px] w-[26px] items-center justify-center rounded-full bg-card border-2 border-border text-xs shrink-0 z-10">
                              {noteTypeIcons[note.note_type] || '📝'}
                            </span>
                            <div className="flex-1 min-w-0 pt-0.5">
                              <p className="text-sm">{note.content}</p>
                              <p className="text-[11px] text-muted-foreground mt-0.5">
                                {formatDistanceToNow(new Date(note.created_at), { addSuffix: true, locale })}
                              </p>
                            </div>
                            <button
                              onClick={() => deleteNote.mutate({ id: note.id, contactId: contact.id })}
                              className="opacity-0 hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive shrink-0"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        );
                      } else {
                        const activity = item.data as { id: string; activity_type: string; subject?: string; description?: string; activity_date: string };
                        const config = ACTIVITY_TYPE_CONFIG[activity.activity_type];
                        const activityIcon = activity.activity_type === 'stage_change' ? '🔄' :
                          activity.activity_type === 'workflow_executed' ? '⚡' :
                          activity.activity_type === 'notification' ? '🔔' : '📋';
                        return (
                          <div key={`act-${activity.id}`} className="flex gap-2.5 p-2 rounded-lg hover:bg-muted/30 relative">
                            <span className={cn(
                              'flex h-[26px] w-[26px] items-center justify-center rounded-full bg-card border-2 text-xs shrink-0 z-10',
                              config?.color ? 'border-primary' : 'border-border'
                            )}>
                              {activityIcon}
                            </span>
                            <div className="flex-1 min-w-0 pt-0.5">
                              <span className={cn('text-xs font-medium', config?.color || 'text-muted-foreground')}>
                                {config ? (isRu ? config.labelRu : config.labelEn) : activity.activity_type}
                              </span>
                              {activity.subject && <p className="text-sm font-medium mt-0.5">{activity.subject}</p>}
                              {activity.description && <p className="text-xs text-muted-foreground mt-0.5">{activity.description}</p>}
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
              </div>
            </TabsContent>

            {/* Dates & Reminders */}
            <TabsContent value="dates" className="mt-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <KeyDatesCard
                  contactId={contact.id}
                  keyDates={(contact as { key_dates?: Array<{ label: string; date: string }> }).key_dates || []}
                />
                <RemindersList contactId={contact.id} companyId={contact.company_id} />
              </div>
            </TabsContent>

            {/* Deals */}
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
                        onClick={() => navigate(APP_ROUTES.MC_SALES_DEAL(d.id))}
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

            {/* Tasks */}
            <TabsContent value="tasks" className="mt-4 space-y-4">
              {membership?.company_id && (
                <InlineTaskCreator companyId={membership.company_id} contactId={contact.id} />
              )}
              {contactTasks.length === 0 ? (
                <div className="text-center py-12 rounded-xl border bg-card">
                  <ListTodo className="h-10 w-10 mx-auto text-muted-foreground/30 mb-2" />
                  <p className="text-sm text-muted-foreground">{isRu ? 'Нет задач' : 'No tasks'}</p>
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

            {/* Documents */}
            <TabsContent value="documents" className="mt-4">
              {membership?.company_id ? (
                <div className="rounded-xl border bg-card p-5">
                  <CrmDocumentsSection companyId={membership.company_id} contactId={contact.id} />
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground text-sm">
                  {isRu ? 'Документы доступны только для УК' : 'Documents available for management companies'}
                </div>
              )}
            </TabsContent>

            {/* AI */}
            <TabsContent value="ai" className="mt-4">
              <CrmAiAssistantPanel contactId={contact.id} companyId={contact.company_id} />
            </TabsContent>
          </Tabs>
        </div>

        {/* ═══ RIGHT PANEL: Chatter (Odoo-style) ═══ */}
        <div className="space-y-4">
          {/* Action buttons */}
          <div className="flex gap-1 border rounded-xl bg-card p-1">
            {[
              { key: 'message' as const, label: isRu ? 'Сообщение' : 'Send message', color: 'bg-primary text-primary-foreground' },
              { key: 'note' as const, label: isRu ? 'Заметка' : 'Log note', color: 'bg-warning/10 text-warning' },
              { key: 'activities' as const, label: isRu ? 'Действия' : 'Activities', color: '' },
            ].map(btn => (
              <button
                key={btn.key}
                onClick={() => setChatterTab(btn.key)}
                className={cn(
                  'flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors',
                  chatterTab === btn.key ? btn.color || 'bg-muted' : 'hover:bg-muted/50'
                )}
              >
                {btn.label}
              </button>
            ))}
          </div>

          {/* Input area */}
          {(chatterTab === 'message' || chatterTab === 'note') && (
            <div className="space-y-2">
              {chatterTab === 'note' && (
                <Select value={noteType} onValueChange={setNoteType}>
                  <SelectTrigger className="h-8 text-xs w-[130px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="note">{isRu ? 'Заметка' : 'Note'}</SelectItem>
                    <SelectItem value="call">{isRu ? 'Звонок' : 'Call'}</SelectItem>
                    <SelectItem value="meeting">{isRu ? 'Встреча' : 'Meeting'}</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  </SelectContent>
                </Select>
              )}
              <div className="flex gap-2">
                <Input
                  placeholder={chatterTab === 'message'
                    ? (isRu ? 'Написать сообщение...' : 'Write a message...')
                    : (isRu ? 'Записать заметку...' : 'Log a note...')
                  }
                  value={noteText}
                  onChange={e => setNoteText(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddNote()}
                  className="h-9"
                />
                <Button size="sm" className="h-9 shrink-0" onClick={handleAddNote} disabled={addNote.isPending || !noteText.trim()}>
                  <SendHorizonal className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Quick contacts */}
          <div className="flex flex-wrap gap-2">
            {contact.phone && (
              <a href={`tel:${contact.phone}`} className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-xl bg-muted hover:bg-muted/80 transition-colors">
                <Phone className="h-3.5 w-3.5 text-primary" />{isRu ? 'Позвонить' : 'Call'}
              </a>
            )}
            {whatsappUrl && (
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-xl bg-success/10 text-success hover:bg-success/20 transition-colors">
                <MessageCircle className="h-3.5 w-3.5" />WhatsApp
              </a>
            )}
            {contact.email && (
              <a href={`mailto:${contact.email}`} className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-xl bg-muted hover:bg-muted/80 transition-colors">
                <Mail className="h-3.5 w-3.5 text-primary" />Email
              </a>
            )}
            {contact.telegram && (
              <a href={`https://t.me/${contact.telegram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-xl bg-info/10 text-info hover:bg-info/20 transition-colors">
                <TelegramIcon className="h-3.5 w-3.5" />Telegram
              </a>
            )}
          </div>

          <Separator />

          {/* Timeline / Activity feed */}
          <div className="space-y-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
              {isRu ? 'Хронология' : 'Timeline'}
            </p>

            {timelineItems.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="h-8 w-8 mx-auto text-muted-foreground/20 mb-2" />
                <p className="text-xs text-muted-foreground">{isRu ? 'Нет активности' : 'No activity yet'}</p>
              </div>
            ) : (
              <div className="relative max-h-[500px] overflow-y-auto pr-1">
                <div className="absolute left-[13px] top-4 bottom-4 w-0.5 bg-border" />
                {timelineItems.slice(0, 30).map((item, idx) => {
                  if (item.type === 'note') {
                    const note = item.data as any;
                    return (
                      <div key={`note-${note.id}`} className="flex gap-2.5 p-2 rounded-lg hover:bg-muted/30 transition-colors group relative">
                        <div className="relative z-10 shrink-0 mt-1">
                          <span className="flex h-[26px] w-[26px] items-center justify-center rounded-full bg-card border-2 border-border text-xs">
                            {noteTypeIcons[note.note_type] || '📝'}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0 pt-0.5">
                          <p className="text-sm">{note.content}</p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            {formatDistanceToNow(new Date(note.created_at), { addSuffix: true, locale })}
                          </p>
                        </div>
                        <button
                          onClick={() => deleteNote.mutate({ id: note.id, contactId: contact.id })}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive shrink-0 self-center"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    );
                  } else {
                    const activity = item.data as any;
                    const config = ACTIVITY_TYPE_CONFIG[activity.activity_type];
                    const activityIcon = activity.activity_type === 'stage_change' ? '🔄' :
                      activity.activity_type === 'workflow_executed' ? '⚡' :
                      activity.activity_type === 'notification' ? '🔔' : '📋';
                    return (
                      <div key={`act-${activity.id}`} className="flex gap-2.5 p-2 rounded-lg hover:bg-muted/30 transition-colors relative">
                        <div className="relative z-10 shrink-0 mt-1">
                          <span className={cn(
                            'flex h-[26px] w-[26px] items-center justify-center rounded-full bg-card border-2 text-xs',
                            config?.color ? 'border-primary' : 'border-border'
                          )}>
                            {activityIcon}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0 pt-0.5">
                          <span className={cn('text-xs font-medium', config?.color || 'text-muted-foreground')}>
                            {config ? (isRu ? config.labelRu : config.labelEn) : activity.activity_type}
                          </span>
                          {activity.subject && <p className="text-sm font-medium mt-0.5">{activity.subject}</p>}
                          {activity.description && <p className="text-xs text-muted-foreground mt-0.5">{activity.description}</p>}
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
          </div>
        </div>
      </div>

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
