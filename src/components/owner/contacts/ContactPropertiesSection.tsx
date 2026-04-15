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
  useContactProperties,
  useLinkContactProperty,
  useUnlinkContactProperty,
  useMcPropertiesForLink,
  RELATIONSHIP_TYPES,
  RELATIONSHIP_LABELS,
  type ContactProperty,
  type RelationshipType,
} from '@/hooks/useContactProperties';
import { Home, Plus, Trash2, ChevronRight } from 'lucide-react';
import { APP_ROUTES } from '@/lib/config/routes';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface Props {
  contactId: string;
  companyId: string;
}

export function ContactPropertiesSection({ contactId, companyId }: Props) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: links = [], isLoading } = useContactProperties(contactId);
  const { data: properties = [] } = useMcPropertiesForLink(companyId);
  const linkMutation = useLinkContactProperty();
  const unlinkMutation = useUnlinkContactProperty();

  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<RelationshipType>('owner');

  const handleLink = async () => {
    if (!selectedPropertyId) return;
    try {
      await linkMutation.mutateAsync({
        contactId,
        propertyId: selectedPropertyId,
        relationshipType: selectedRole,
        companyId,
      });
      toast({ title: isRu ? 'Связь добавлена' : 'Link added' });
      setLinkDialogOpen(false);
      setSelectedPropertyId('');
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

  const alreadyLinkedIds = new Set(links.map((l) => l.property_id));
  const availableProperties = properties.filter((p) => !alreadyLinkedIds.has(p.id));

  return (
    <div className="rounded-xl border bg-card p-4 space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <p className="text-sm font-semibold flex items-center gap-2">
          <Home className="h-4 w-4 text-muted-foreground" />
          {isRu ? 'Объекты' : 'Properties'}
        </p>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="default"
            size="sm"
            className="gap-1.5"
            onClick={() =>
              navigate(`${APP_ROUTES.MC_PROPERTY_NEW}?owner_contact_id=${encodeURIComponent(contactId)}`)
            }
          >
            <Plus className="h-3.5 w-3.5" />
            {isRu ? 'Создать объект' : 'Create property'}
          </Button>
        <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5"
              disabled={availableProperties.length === 0}>
              <Plus className="h-3.5 w-3.5" />
              {isRu ? 'Связать' : 'Link'}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{isRu ? 'Связать с объектом' : 'Link to property'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div>
                <label className="text-sm font-medium mb-1.5 block">{isRu ? 'Объект' : 'Property'}</label>
                <Select value={selectedPropertyId} onValueChange={setSelectedPropertyId}>
                  <SelectTrigger>
                    <SelectValue placeholder={isRu ? 'Выберите объект' : 'Select property'} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableProperties.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {isRu ? p.title_ru || p.title_en : p.title_en || p.title_ru}
                        {p.district && ` · ${p.district}`}
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
                disabled={!selectedPropertyId || linkMutation.isPending}
                className="w-full"
              >
                {isRu ? 'Добавить связь' : 'Add link'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">{isRu ? 'Загрузка...' : 'Loading...'}</div>
      ) : links.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-sm">
          <Home className="h-16 w-16 mx-auto opacity-30 mb-2" />
          {isRu ? 'Нет связанных объектов' : 'No linked properties'}
        </div>
      ) : (
        <div className="space-y-2">
          {links.map((link) => (
            <PropertyLinkRow
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

function PropertyLinkRow({
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
  const prop = link.property;
  const label = isRu ? RELATIONSHIP_LABELS[link.relationship_type]?.ru : RELATIONSHIP_LABELS[link.relationship_type]?.en;

  return (
    <div
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg border bg-background/50 hover:bg-muted/30 transition-colors group'
      )}
    >
      <button
        onClick={() => prop && onNavigate(`${APP_ROUTES.MC_PROPERTIES}/${link.property_id}`)}
        className="flex-1 text-left min-w-0"
      >
        <p className="text-sm font-medium truncate">
          {prop ? (isRu ? prop.title_ru || prop.title_en : prop.title_en || prop.title_ru) : link.property_id}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <Badge variant="secondary" className="text-[10px]">{label}</Badge>
          {prop?.district && (
            <span className="text-xs text-muted-foreground">{prop.district}</span>
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
