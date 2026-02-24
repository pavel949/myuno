import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useCrmContact, useUpdateContact, useDeleteContact, CONTACT_TAGS } from '@/hooks/useCrmContacts';
import { useContactNotes, useAddContactNote, useDeleteContactNote } from '@/hooks/useCrmContactNotes';
import { useContactDeals } from '@/hooks/useCrmContacts';
import { useMyCompanyId, DEAL_STAGE_LABELS, DealStage, AgentDeal } from '@/hooks/useAgentDeals';
import { CreateDealSheet } from '@/components/owner/sales/CreateDealSheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Phone, Mail, MessageCircle, Send as TelegramIcon, Clock, Pencil, Trash2, ChevronRight, Plus, Cake, Users, Heart, Briefcase, Globe, Star, SendHorizonal } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow, format, differenceInYears } from 'date-fns';
import { ru, enUS } from 'date-fns/locale';
import { EditContactSheet } from '@/components/owner/contacts/EditContactSheet';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';

const noteTypeIcons: Record<string, string> = {
  note: '📝', call: '📞', meeting: '🤝', email: '📧', whatsapp: '💬',
};

/** Check if birthday is within next 30 days */
function isBirthdaySoon(birthday: string): boolean {
  const today = new Date();
  const bd = new Date(birthday);
  const thisYearBd = new Date(today.getFullYear(), bd.getMonth(), bd.getDate());
  if (thisYearBd < today) thisYearBd.setFullYear(thisYearBd.getFullYear() + 1);
  const diff = thisYearBd.getTime() - today.getTime();
  return diff >= 0 && diff <= 30 * 24 * 60 * 60 * 1000;
}

// Stage dot colors
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
  const updateContact = useUpdateContact();
  const deleteContact = useDeleteContact();
  const addNote = useAddContactNote();
  const deleteNote = useDeleteContactNote();
  const { data: membership } = useMyCompanyId();

  const [showEdit, setShowEdit] = useState(false);
  const [showCreateDeal, setShowCreateDeal] = useState(false);
  const [noteType, setNoteType] = useState('note');
  const [noteText, setNoteText] = useState('');

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-4 max-w-[1536px] mx-auto">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full rounded-xl" />
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

  // Last contacted from notes
  const lastContactedAt = notes.length > 0 ? notes[0].created_at : null;

  // Scoring display
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

  return (
    <div className="px-4 md:px-6 lg:px-8 pt-4 pb-24 md:pb-8 max-w-[1536px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button onClick={() => navigate('/owner/contacts')} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          {isRu ? 'Контакты' : 'Contacts'}
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

      {/* Two-column layout on desktop */}
      <div className="lg:grid lg:grid-cols-[1fr,1fr] xl:grid-cols-[2fr,3fr] lg:gap-8">
        {/* Left column: Profile info */}
        <div className="space-y-6">
          {/* Profile card */}
          <div className="border rounded-xl p-4 bg-card space-y-3">
            <div className="flex items-center gap-3">
              {contact.avatar_url ? (
                <img src={contact.avatar_url} alt="" className="h-14 w-14 rounded-full object-cover" />
              ) : (
                <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-lg font-bold text-primary">
                    {contact.first_name.charAt(0)}{contact.last_name.charAt(0)}
                  </span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold truncate">{contact.first_name} {contact.last_name}</h1>
                  {(contact.scoring ?? 0) > 0 && (
                    <span className={cn('text-sm font-semibold', scoringColor)}>
                      <Star className="h-3.5 w-3.5 inline mr-0.5" />{contact.scoring}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  {contact.contact_type && <Badge variant="secondary" className="text-[10px]">{contact.contact_type}</Badge>}
                  {contact.source && <Badge variant="outline" className="text-[10px]">{contact.source}</Badge>}
                  {contact.nationality && <span className="text-xs text-muted-foreground">{contact.nationality}</span>}
                  {contact.language && (
                    <span className="inline-flex items-center gap-0.5 text-xs text-muted-foreground">
                      <Globe className="h-3 w-3" />{contact.language}
                    </span>
                  )}
                </div>
                {lastContactedAt && (
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {isRu ? 'Последний контакт' : 'Last contact'}: {formatDistanceToNow(new Date(lastContactedAt), { addSuffix: true, locale })}
                  </p>
                )}
              </div>
            </div>

            {/* Contact methods */}
            <div className="flex flex-wrap gap-2">
              {contact.phone && (
                <a href={`tel:${contact.phone}`} className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-full bg-muted hover:bg-muted/80 transition-colors">
                  <Phone className="h-3 w-3" />{contact.phone}
                </a>
              )}
              {whatsappUrl && (
                <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-full bg-success/10 text-success hover:bg-success/20 transition-colors">
                  <MessageCircle className="h-3 w-3" />WhatsApp
                </a>
              )}
              {contact.email && (
                <a href={`mailto:${contact.email}`} className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-full bg-muted hover:bg-muted/80 transition-colors">
                  <Mail className="h-3 w-3" />{contact.email}
                </a>
              )}
              {contact.telegram && (
                <a href={`https://t.me/${contact.telegram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-full bg-info/10 text-info hover:bg-info/20 transition-colors">
                  <TelegramIcon className="h-3 w-3" />{contact.telegram}
                </a>
              )}
            </div>
          </div>

          {/* Personal section */}
          {(contact.birthday || contact.family_info || contact.interests?.length) && (
            <div className="border rounded-xl p-4 bg-card space-y-3">
              <p className="text-sm font-medium">{isRu ? 'Персональное' : 'Personal'}</p>
              {contact.birthday && (
                <div className="flex items-center gap-2 text-sm">
                  <Cake className={cn('h-4 w-4', birthdaySoon ? 'text-warning' : 'text-muted-foreground')} />
                  <span>
                    {format(new Date(contact.birthday), 'd MMMM', { locale })}
                    {age !== null && <span className="text-muted-foreground ml-1">({age} {isRu ? 'лет' : 'y.o.'})</span>}
                  </span>
                  {birthdaySoon && (
                    <Badge variant="secondary" className="text-[10px] bg-warning/10 text-warning border-warning/20">
                      🎂 {isRu ? 'Скоро ДР!' : 'Birthday soon!'}
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
                <div className="flex items-start gap-2">
                  <Heart className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div className="flex flex-wrap gap-1">
                    {contact.interests.map(interest => (
                      <Badge key={interest} variant="outline" className="text-[10px]">{interest}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Professional section */}
          {(contact.job_title || contact.company_name) && (
            <div className="border rounded-xl p-4 bg-card space-y-3">
              <p className="text-sm font-medium">{isRu ? 'Профессиональное' : 'Professional'}</p>
              <div className="flex items-center gap-2 text-sm">
                <Briefcase className="h-4 w-4 text-muted-foreground" />
                <span>
                  {contact.job_title && <span className="font-medium">{contact.job_title}</span>}
                  {contact.job_title && contact.company_name && <span className="text-muted-foreground"> · </span>}
                  {contact.company_name && <span className="text-muted-foreground">{contact.company_name}</span>}
                </span>
              </div>
            </div>
          )}

          {/* Tags */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">{isRu ? 'Теги' : 'Tags'}</p>
            <div className="flex flex-wrap gap-1.5">
              {CONTACT_TAGS.map(tag => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={cn(
                    'px-2.5 py-1 rounded-full text-xs border transition-colors',
                    contact.tags.includes(tag)
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-card border-border text-muted-foreground hover:border-primary/50',
                  )}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Preferences */}
          {(contact.budget_max || contact.preferred_types?.length || contact.preferred_districts?.length) && (
            <div className="border rounded-xl p-4 bg-card space-y-2">
              <p className="text-sm font-medium">{isRu ? 'Предпочтения' : 'Preferences'}</p>
              {contact.budget_max && (
                <p className="text-sm text-muted-foreground">
                  {isRu ? 'Бюджет' : 'Budget'}: {contact.budget_min ? `${Number(contact.budget_min).toLocaleString()}–` : ''}{Number(contact.budget_max).toLocaleString()} {contact.currency}
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

          {/* Notes */}
          {contact.notes && (
            <div className="text-sm text-muted-foreground border rounded-xl p-4 bg-card">
              <p className="font-medium text-foreground mb-1">{isRu ? 'Заметки' : 'Notes'}</p>
              {contact.notes}
            </div>
          )}
        </div>

        {/* Right column: Deals & Timeline */}
        <div className="space-y-6 mt-6 lg:mt-0">
          {/* Linked deals */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium">{isRu ? 'Сделки' : 'Deals'} ({deals.length})</p>
              <Button variant="ghost" size="sm" className="text-xs" onClick={() => setShowCreateDeal(true)}>
                <Plus className="h-3 w-3 mr-1" />
                {isRu ? 'Новая' : 'New'}
              </Button>
            </div>
            {deals.length === 0 ? (
              <p className="text-xs text-muted-foreground">{isRu ? 'Нет связанных сделок' : 'No linked deals'}</p>
            ) : (
              <div className="space-y-2">
                {deals.map((d) => {
                  const stage = d.stage as DealStage;
                  const label = isRu ? DEAL_STAGE_LABELS[stage]?.ru : DEAL_STAGE_LABELS[stage]?.en;
                  return (
                    <button
                      key={d.id}
                      onClick={() => navigate(`/owner/sales/${d.id}`)}
                      className="w-full text-left p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors flex items-center gap-3"
                    >
                      <div className={cn('h-2.5 w-2.5 rounded-full shrink-0', stageDotColors[stage] || 'bg-muted')} />
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium">{d.client_name}</span>
                        <div className="flex items-center gap-2 mt-0.5">
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
          </div>

          <Separator />

          {/* Activity timeline */}
          <div className="space-y-3">
            <p className="text-sm font-medium">{isRu ? 'Хронология' : 'Timeline'}</p>

            {/* Add note */}
            <div className="flex gap-2">
              <Select value={noteType} onValueChange={setNoteType}>
                <SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger>
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
              />
              <Button size="sm" onClick={handleAddNote} disabled={addNote.isPending || !noteText.trim()}>
                <SendHorizonal className="h-4 w-4" />
              </Button>
            </div>

            {notes.length === 0 ? (
              <p className="text-xs text-muted-foreground">{isRu ? 'Нет заметок' : 'No notes yet'}</p>
            ) : (
              <div className="space-y-3">
                {notes.map(note => (
                  <div key={note.id} className="flex gap-3 text-sm group">
                    <span className="text-lg mt-0.5">{noteTypeIcons[note.note_type] || '📝'}</span>
                    <div className="flex-1 min-w-0">
                      <p>{note.content}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(note.created_at), { addSuffix: true, locale })}
                      </p>
                    </div>
                    <button
                      onClick={() => deleteNote.mutate({ id: note.id, contactId: contact.id })}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive shrink-0"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit sheet */}
      {contact && <EditContactSheet open={showEdit} onOpenChange={setShowEdit} contact={contact} />}

      {/* Create deal sheet with prefilled contact */}
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
