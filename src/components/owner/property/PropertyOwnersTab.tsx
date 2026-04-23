import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePropertyOwners, useAddPropertyOwner, useRemovePropertyOwner } from '@/hooks/usePropertyOwners';
import { ContactSearchInput } from '@/components/owner/contacts/ContactSearchInput';
import { CrmContact } from '@/hooks/useCrmContacts';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { UserCircle, Plus, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { APP_ROUTES } from '@/lib/config/routes';

const OWNER_ROLES = [
  { value: 'owner', en: 'Owner', ru: 'Собственник' },
  { value: 'co_owner', en: 'Co-owner', ru: 'Совладелец' },
  { value: 'beneficial_owner', en: 'Beneficial Owner', ru: 'Бенефициар' },
  { value: 'nominee', en: 'Nominee', ru: 'Номинал' },
  { value: 'tenant', en: 'Tenant', ru: 'Арендатор' },
  { value: 'investor', en: 'Investor', ru: 'Инвестор' },
];

interface Props {
  propertyId: string;
  companyId: string;
}

export function PropertyOwnersTab({ propertyId, companyId }: Props) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const navigate = useNavigate();
  const { data: owners = [], isLoading } = usePropertyOwners(propertyId);
  const addOwner = useAddPropertyOwner();
  const removeOwner = useRemovePropertyOwner();

  const [showAdd, setShowAdd] = useState(false);
  const [selectedContact, setSelectedContact] = useState<CrmContact | null>(null);
  const [role, setRole] = useState('owner');
  const [ownershipPct, setOwnershipPct] = useState('');

  const handleAdd = async () => {
    if (!selectedContact) return;
    try {
      await addOwner.mutateAsync({
        property_id: propertyId,
        contact_id: selectedContact.id,
        role,
        ownership_pct: ownershipPct ? Number(ownershipPct) : null,
        company_id: companyId,
      });
      toast.success(isRu ? 'Владелец добавлен' : 'Owner added');
      setShowAdd(false);
      setSelectedContact(null);
      setRole('owner');
      setOwnershipPct('');
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleRemove = async (id: string) => {
    try {
      await removeOwner.mutateAsync({ id, propertyId });
      toast.success(isRu ? 'Удалён' : 'Removed');
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  if (isLoading) return <div className="space-y-2">{[1,2].map(i => <Skeleton key={i} className="h-14 w-full" />)}</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">{isRu ? 'Владельцы' : 'Owners'} ({owners.length})</h3>
        <Button variant="outline" size="sm" onClick={() => setShowAdd(!showAdd)}>
          {showAdd ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4 mr-1" />}
          {showAdd ? '' : (isRu ? 'Добавить' : 'Add')}
        </Button>
      </div>

      {showAdd && (
        <div className="rounded-none border p-3 space-y-3 bg-card">
          <ContactSearchInput companyId={companyId} selectedContact={selectedContact} onSelect={setSelectedContact} onClear={() => setSelectedContact(null)} isRu={isRu} />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>{isRu ? 'Роль' : 'Role'}</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {OWNER_ROLES.map(r => <SelectItem key={r.value} value={r.value}>{isRu ? r.ru : r.en}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{isRu ? 'Доля %' : 'Share %'}</Label>
              <Input type="number" min={0} max={100} value={ownershipPct} onChange={e => setOwnershipPct(e.target.value)} placeholder="100" />
            </div>
          </div>
          <Button size="sm" onClick={handleAdd} disabled={!selectedContact || addOwner.isPending}>
            {isRu ? 'Сохранить' : 'Save'}
          </Button>
        </div>
      )}

      {owners.length === 0 && !showAdd && (
        <p className="text-sm text-muted-foreground py-6 text-center">{isRu ? 'Нет привязанных владельцев' : 'No owners linked'}</p>
      )}

      <div className="space-y-2">
        {owners.map(o => {
          const roleLabel = OWNER_ROLES.find(r => r.value === o.role);
          return (
            <div key={o.id} className="flex items-center gap-3 p-3 rounded-none border bg-card hover:bg-accent/50 transition-colors">
              <UserCircle className="h-8 w-8 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <button
                  onClick={() => o.contact && navigate(`${APP_ROUTES.MC_CONTACTS}/${o.contact.id}`)}
                  className="text-sm font-medium hover:text-primary truncate block text-left"
                >
                  {o.contact ? `${o.contact.first_name} ${o.contact.last_name}` : o.contact_id}
                </button>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge variant="outline" className="text-[10px] h-4 px-1.5">{isRu ? roleLabel?.ru : roleLabel?.en}</Badge>
                  {o.ownership_pct && <span className="text-xs text-muted-foreground">{o.ownership_pct}%</span>}
                </div>
              </div>
              <button onClick={() => handleRemove(o.id)} className="p-1 rounded-none hover:bg-destructive/10 text-muted-foreground hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
