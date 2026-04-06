import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  useContactRelationships,
  useLinkContactRelationship,
  useUnlinkContactRelationship,
} from '@/hooks/useContactRelationships';
import { useMcContactsForLink } from '@/hooks/useContactProperties';
import { CONTACT_RELATIONSHIP_TYPES, CONTACT_RELATIONSHIP_LABELS } from '@/types/contact';
import { Users, Plus, Trash2, ChevronRight } from 'lucide-react';
import { APP_ROUTES } from '@/lib/config/routes';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Props {
  contactId: string;
  companyId: string;
}

export function ContactRelationshipsCard({ contactId, companyId }: Props) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const navigate = useNavigate();

  const { data: relationships = [], isLoading } = useContactRelationships(contactId);
  const { data: contacts = [] } = useMcContactsForLink(companyId);
  const linkMutation = useLinkContactRelationship();
  const unlinkMutation = useUnlinkContactRelationship();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedContactId, setSelectedContactId] = useState('');
  const [selectedType, setSelectedType] = useState<(typeof CONTACT_RELATIONSHIP_TYPES)[number]>('friend');

  const alreadyLinkedIds = new Set(relationships.map((r) => r.related_contact_id));
  const availableContacts = contacts.filter((c) => c.id !== contactId && !alreadyLinkedIds.has(c.id));

  const handleLink = async () => {
    if (!selectedContactId) return;
    try {
      await linkMutation.mutateAsync({
        contactId,
        relatedContactId: selectedContactId,
        relationshipType: selectedType,
        companyId,
      });
      toast(isRu ? 'Готово' : 'Done');
      setDialogOpen(false);
      setSelectedContactId('');
      setSelectedType('friend');
    } catch {
      toast.error(isRu ? 'Ошибка' : 'Error');
    }
  };

  const handleUnlink = async (linkId: string) => {
    try {
      await unlinkMutation.mutateAsync(linkId);
      toast(isRu ? 'Готово' : 'Done');
    } catch {
      toast.error(isRu ? 'Ошибка' : 'Error');
    }
  };

  return (
    <div className="rounded-xl border bg-card p-4 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          {isRu ? 'Связи' : 'Relationships'}
        </p>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5" disabled={availableContacts.length === 0}>
              <Plus className="h-3.5 w-3.5" />
              {isRu ? 'Добавить' : 'Add'}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{isRu ? 'Связать контакт' : 'Link contact'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div>
                <label className="text-sm font-medium mb-1.5 block">{isRu ? 'Контакт' : 'Contact'}</label>
                <Select value={selectedContactId} onValueChange={setSelectedContactId}>
                  <SelectTrigger>
                    <SelectValue placeholder={isRu ? 'Выберите контакт' : 'Select contact'} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableContacts.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.first_name} {c.last_name}
                        {c.company_name && ` · ${c.company_name}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">{isRu ? 'Тип связи' : 'Relationship type'}</label>
                <Select value={selectedType} onValueChange={(v) => setSelectedType(v as typeof selectedType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CONTACT_RELATIONSHIP_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {isRu ? CONTACT_RELATIONSHIP_LABELS[t].ru : CONTACT_RELATIONSHIP_LABELS[t].en}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleLink} disabled={!selectedContactId || linkMutation.isPending} className="w-full">
                {isRu ? 'Добавить связь' : 'Add relationship'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">{isRu ? 'Загрузка...' : 'Loading...'}</div>
      ) : relationships.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-sm">
          <Users className="h-16 w-16 mx-auto opacity-30 mb-2" />
          {isRu ? 'Нет связанных контактов' : 'No linked contacts'}
        </div>
      ) : (
        <div className="space-y-2">
          {relationships.map((rel) => (
            <RelationshipRow
              key={rel.id}
              relationship={rel}
              isRu={isRu}
              onUnlink={handleUnlink}
              onNavigate={navigate}
              unlinkPending={unlinkMutation.isPending}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function RelationshipRow({
  relationship,
  isRu,
  onUnlink,
  onNavigate,
  unlinkPending,
}: {
  relationship: { id: string; related_contact?: { id: string; first_name: string; last_name: string; company_name?: string | null; avatar_url?: string | null } | null; relationship_type: string };
  isRu: boolean;
  onUnlink: (id: string) => void;
  onNavigate: (path: string) => void;
  unlinkPending: boolean;
}) {
  const [showUnlink, setShowUnlink] = useState(false);
  const rc = relationship.related_contact;
  const type = relationship.relationship_type as keyof typeof CONTACT_RELATIONSHIP_LABELS;
  const label = rc ? (isRu ? CONTACT_RELATIONSHIP_LABELS[type]?.ru : CONTACT_RELATIONSHIP_LABELS[type]?.en) : '—';

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border bg-background/50 hover:bg-muted/30 transition-colors group">
      <button
        onClick={() => rc && onNavigate(`${APP_ROUTES.MC_CONTACTS}/${rc.id}`)}
        className="flex-1 text-left min-w-0 flex items-center gap-3"
      >
        {rc?.avatar_url ? (
          <img src={rc.avatar_url} alt="" className="h-10 w-10 rounded-full object-cover shrink-0" />
        ) : (
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-sm font-semibold text-primary">
            {rc?.first_name?.charAt(0) || '?'}{rc?.last_name?.charAt(0) || '?'}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium truncate">
            {rc ? `${rc.first_name} ${rc.last_name}` : '—'}
          </p>
          <Badge variant="secondary" className="text-[10px] mt-0.5">
            {label}
          </Badge>
        </div>
      </button>
      <ChevronRight className="h-4 w-4 text-muted-foreground/40 shrink-0" />
      <button
        onClick={() => onUnlink(relationship.id)}
        onMouseEnter={() => setShowUnlink(true)}
        onMouseLeave={() => setShowUnlink(false)}
        disabled={unlinkPending}
        className={cn(
          'p-1.5 rounded-md transition-colors shrink-0',
          showUnlink ? 'text-destructive hover:bg-destructive/10' : 'text-muted-foreground/50 opacity-0 group-hover:opacity-100'
        )}
        title={isRu ? 'Удалить связь' : 'Remove'}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
