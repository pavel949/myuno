import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  usePropertyContacts,
  useLinkContactProperty,
  useUnlinkContactProperty,
  useMcContactsForLink,
  RELATIONSHIP_TYPES,
  RELATIONSHIP_LABELS,
  type ContactProperty,
  type RelationshipType,
} from '@/hooks/useContactProperties';
import { Users, Plus, Trash2, ChevronRight } from 'lucide-react';
import { APP_ROUTES } from '@/lib/config/routes';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface Props {
  propertyId: string;
  companyId: string;
}

export function PropertyContactsSection({ propertyId, companyId }: Props) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: links = [], isLoading } = usePropertyContacts(propertyId);
  const { data: contacts = [] } = useMcContactsForLink(companyId);
  const linkMutation = useLinkContactProperty();
  const unlinkMutation = useUnlinkContactProperty();

  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [selectedContactId, setSelectedContactId] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<RelationshipType>('owner');

  const handleLink = async () => {
    if (!selectedContactId) return;
    try {
      await linkMutation.mutateAsync({
        contactId: selectedContactId,
        propertyId,
        relationshipType: selectedRole,
        companyId,
      });
      toast({ title: isRu ? 'Связь добавлена' : 'Link added' });
      setLinkDialogOpen(false);
      setSelectedContactId('');
      setSelectedRole('owner');
    } catch {
      toast({ title: isRu ? 'Ошибка' : 'Error', variant: 'destructive' });
    }
  };

  const handleUnlink = async (linkId: string) => {
    try {
      await unlinkMutation.mutateAsync(linkId);
      toast({ title: isRu ? 'Связь удалена' : 'Link removed' });
    } catch {
      toast({ title: isRu ? 'Ошибка' : 'Error', variant: 'destructive' });
    }
  };

  const alreadyLinkedIds = new Set(links.map((l) => l.contact_id));
  const availableContacts = contacts.filter((c) => !alreadyLinkedIds.has(c.id));

  return (
    <div className="rounded-xl border bg-card p-4 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          {isRu ? 'Контакты' : 'Contacts'}
        </p>
        <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5"
              disabled={availableContacts.length === 0}>
              <Plus className="h-3.5 w-3.5" />
              {isRu ? 'Связать' : 'Link'}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{isRu ? 'Связать с контактом' : 'Link to contact'}</DialogTitle>
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
                <label className="text-sm font-medium mb-1.5 block">{isRu ? 'Роль' : 'Role'}</label>
                <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as RelationshipType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RELATIONSHIP_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {isRu ? RELATIONSHIP_LABELS[t].ru : RELATIONSHIP_LABELS[t].en}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={handleLink}
                disabled={!selectedContactId || linkMutation.isPending}
                className="w-full"
              >
                {isRu ? 'Добавить связь' : 'Add link'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">{isRu ? 'Загрузка...' : 'Loading...'}</div>
      ) : links.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-sm">
          <Users className="h-16 w-16 mx-auto opacity-30 mb-2" />
          {isRu ? 'Нет связанных контактов' : 'No linked contacts'}
        </div>
      ) : (
        <div className="space-y-2">
          {links.map((link) => (
            <ContactLinkRow
              key={link.id}
              link={link}
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

function ContactLinkRow({
  link,
  isRu,
  onUnlink,
  onNavigate,
  unlinkPending,
}: {
  link: ContactProperty;
  isRu: boolean;
  onUnlink: (id: string) => void;
  onNavigate: (path: string) => void;
  unlinkPending: boolean;
}) {
  const [showUnlink, setShowUnlink] = useState(false);
  const c = link.contact;
  const name = c
    ? (`${c.first_name} ${c.last_name}`.trim() || c.company_name || link.contact_id)
    : link.contact_id;
  const label = isRu ? RELATIONSHIP_LABELS[link.relationship_type]?.ru : RELATIONSHIP_LABELS[link.relationship_type]?.en;

  return (
    <div
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg border bg-background/50 hover:bg-muted/30 transition-colors group'
      )}
    >
      <button
        onClick={() => onNavigate(`${APP_ROUTES.MC_CONTACTS}/${link.contact_id}`)}
        className="flex-1 text-left min-w-0"
      >
        <p className="text-sm font-medium truncate">{name}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <Badge variant="secondary" className="text-[10px]">{label}</Badge>
          {c?.company_name && (
            <span className="text-xs text-muted-foreground truncate">{c.company_name}</span>
          )}
        </div>
      </button>
      <ChevronRight className="h-4 w-4 text-muted-foreground/40 shrink-0" />
      <button
        onClick={() => onUnlink(link.id)}
        onMouseEnter={() => setShowUnlink(true)}
        onMouseLeave={() => setShowUnlink(false)}
        disabled={unlinkPending}
        className={cn(
          'p-1.5 rounded-md transition-colors shrink-0',
          showUnlink ? 'text-destructive hover:bg-destructive/10' : 'text-muted-foreground/50 opacity-0 group-hover:opacity-100'
        )}
        title={isRu ? 'Отвязать' : 'Unlink'}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
