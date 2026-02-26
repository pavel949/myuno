import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AlertCircle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useCreateDeal, useDuplicateCheck, CLIENT_SOURCES, PHUKET_DISTRICTS, PROPERTY_TYPES, CURRENCIES, DEAL_TYPES, DEAL_TYPE_LABELS } from '@/hooks/useAgentDeals';
import { useCreateContact, CrmContact } from '@/hooks/useCrmContacts';
import { ContactSearchInput } from '@/components/owner/contacts/ContactSearchInput';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  prefilledContact?: CrmContact | null;
}

export function CreateDealSheet({ open, onOpenChange, companyId, prefilledContact }: Props) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const createDeal = useCreateDeal();
  const createContact = useCreateContact();
  const [selectedContact, setSelectedContact] = useState<CrmContact | null>(prefilledContact || null);

  // Pre-fill form when prefilledContact is provided
  useEffect(() => {
    if (prefilledContact && open) {
      setSelectedContact(prefilledContact);
      setForm(f => ({
        ...f,
        client_name: `${prefilledContact.first_name} ${prefilledContact.last_name}`.trim(),
        client_phone: prefilledContact.phone || '',
        client_email: prefilledContact.email || '',
        client_source: prefilledContact.source || 'website',
        budget_min: prefilledContact.budget_min ? String(prefilledContact.budget_min) : '',
        budget_max: prefilledContact.budget_max ? String(prefilledContact.budget_max) : '',
        currency: prefilledContact.currency || 'THB',
        bedrooms_min: prefilledContact.bedrooms_min ? String(prefilledContact.bedrooms_min) : '',
        preferred_types: prefilledContact.preferred_types || [],
        preferred_districts: prefilledContact.preferred_districts || [],
      }));
    }
  }, [prefilledContact, open]);

  const [form, setForm] = useState({
    client_name: '',
    client_phone: '',
    client_email: '',
    client_source: 'website',
    deal_type: 'sale',
    notes: '',
    budget_min: '',
    budget_max: '',
    currency: 'THB',
    bedrooms_min: '',
    preferred_types: [] as string[],
    preferred_districts: [] as string[],
  });

  const { data: duplicates = [] } = useDuplicateCheck(companyId, form.client_phone, form.client_email);

  const toggleType = (t: string) => {
    setForm(f => ({
      ...f,
      preferred_types: f.preferred_types.includes(t)
        ? f.preferred_types.filter(x => x !== t)
        : [...f.preferred_types, t],
    }));
  };

  const toggleDistrict = (d: string) => {
    setForm(f => ({
      ...f,
      preferred_districts: f.preferred_districts.includes(d)
        ? f.preferred_districts.filter(x => x !== d)
        : [...f.preferred_districts, d],
    }));
  };

  const handleSubmit = async () => {
    if (!form.client_name.trim() && !selectedContact) {
      toast({ title: isRu ? 'Введите имя клиента или выберите контакт' : 'Enter client name or select a contact', variant: 'destructive' });
      return;
    }
    try {
      let contactId: string | null = selectedContact?.id || null;
      const clientName = selectedContact ? `${selectedContact.first_name} ${selectedContact.last_name}`.trim() : form.client_name.trim();
      const clientPhone = selectedContact ? selectedContact.phone : (form.client_phone || null);
      const clientEmail = selectedContact ? selectedContact.email : (form.client_email || null);

      // Auto-create contact if not selected
      if (!contactId && (form.client_phone || form.client_email)) {
        try {
          const nameParts = form.client_name.trim().split(' ');
          const newContact = await createContact.mutateAsync({
            company_id: companyId,
            first_name: nameParts[0] || '',
            last_name: nameParts.slice(1).join(' ') || '',
            phone: form.client_phone || null,
            phone2: null, email: form.client_email || null,
            whatsapp: null, telegram: null, line_id: null,
            nationality: null, language: 'en',
            source: form.client_source, contact_type: 'buyer',
            company_name: null,
            budget_min: form.budget_min ? Number(form.budget_min) : null,
            budget_max: form.budget_max ? Number(form.budget_max) : null,
            currency: form.currency,
            preferred_districts: form.preferred_districts.length ? form.preferred_districts : null,
            preferred_types: form.preferred_types.length ? form.preferred_types : null,
            bedrooms_min: form.bedrooms_min ? Number(form.bedrooms_min) : null,
            notes: null, tags: [], avatar_url: null, is_archived: false,
            created_by: user?.id || null,
          });
          contactId = (newContact as any)?.id || null;
        } catch { /* ignore contact creation failure */ }
      }

      await createDeal.mutateAsync({
        company_id: companyId,
        agent_id: user!.id,
        property_id: null,
        client_name: clientName,
        client_phone: clientPhone,
        client_email: clientEmail,
        client_source: form.client_source,
        stage: 'new',
        deal_type: form.deal_type,
        deal_status: 'active',
        budget_min: form.budget_min ? Number(form.budget_min) : null,
        budget_max: form.budget_max ? Number(form.budget_max) : null,
        currency: form.currency,
        preferred_districts: form.preferred_districts.length ? form.preferred_districts : null,
        preferred_types: form.preferred_types.length ? form.preferred_types : null,
        bedrooms_min: form.bedrooms_min ? Number(form.bedrooms_min) : null,
        notes: form.notes || null,
        next_action: null, next_action_date: null, deal_value: null,
        commission_percent: null, commission_amount: null,
        closed_at: null, lost_reason: null,
        ...(contactId ? { contact_id: contactId } : {}),
      } as any);
      toast({ title: isRu ? 'Сделка создана' : 'Deal created' });
      onOpenChange(false);
      setSelectedContact(null);
      setForm({ client_name: '', client_phone: '', client_email: '', client_source: 'website', deal_type: 'sale', notes: '', budget_min: '', budget_max: '', currency: 'THB', bedrooms_min: '', preferred_types: [], preferred_districts: [] });
    } catch {
      toast({ title: isRu ? 'Ошибка при создании' : 'Failed to create deal', variant: 'destructive' });
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>{isRu ? 'Новая сделка' : 'New Deal'}</SheetTitle>
        </SheetHeader>
        <div className="space-y-4 mt-4">
          {/* Duplicate warning */}
          {duplicates.length > 0 && (
            <div className="p-3 rounded-lg border border-warning/50 bg-warning/10 text-sm">
              <div className="flex items-center gap-2 text-warning font-medium mb-1">
                <AlertCircle className="h-4 w-4" />
                {isRu ? 'Возможный дубликат!' : 'Possible duplicate!'}
              </div>
              {duplicates.map(d => (
                <button
                  key={d.id}
                  onClick={() => { onOpenChange(false); navigate(`/owner/sales/${d.id}`); }}
                  className="block text-xs text-primary hover:underline"
                >
                  {d.client_name} — {d.client_phone || d.client_email} ({isRu ? DEAL_STAGE_LABELS_LOOKUP[d.stage]?.ru : DEAL_STAGE_LABELS_LOOKUP[d.stage]?.en})
                </button>
              ))}
            </div>
          )}

          {/* Contact search */}
          <div>
            <Label>{isRu ? 'Привязать контакт' : 'Link Contact'}</Label>
            <ContactSearchInput
              companyId={companyId}
              selectedContact={selectedContact}
              onSelect={(c) => {
                setSelectedContact(c);
                setForm(f => ({
                  ...f,
                  client_name: `${c.first_name} ${c.last_name}`.trim(),
                  client_phone: c.phone || '',
                  client_email: c.email || '',
                }));
              }}
              onClear={() => setSelectedContact(null)}
              isRu={isRu}
            />
          </div>

          {/* Deal Type */}
          <div>
            <Label>{isRu ? 'Тип сделки' : 'Deal Type'}</Label>
            <div className="flex gap-1.5 mt-1">
              {DEAL_TYPES.map(dt => (
                <button
                  key={dt}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, deal_type: dt }))}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
                    form.deal_type === dt
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-card border-border text-muted-foreground hover:border-primary/50',
                  )}
                >
                  {isRu ? DEAL_TYPE_LABELS[dt].ru : DEAL_TYPE_LABELS[dt].en}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label>{isRu ? 'Имя клиента *' : 'Client Name *'}</Label>
            <Input value={form.client_name} onChange={e => setForm(f => ({ ...f, client_name: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>{isRu ? 'Телефон' : 'Phone'}</Label>
              <Input value={form.client_phone} onChange={e => setForm(f => ({ ...f, client_phone: e.target.value }))} />
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" value={form.client_email} onChange={e => setForm(f => ({ ...f, client_email: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>{isRu ? 'Источник' : 'Source'}</Label>
              <Select value={form.client_source} onValueChange={v => setForm(f => ({ ...f, client_source: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CLIENT_SOURCES.map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{isRu ? 'Валюта' : 'Currency'}</Label>
              <Select value={form.currency} onValueChange={v => setForm(f => ({ ...f, currency: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>{isRu ? 'Бюджет от' : 'Budget Min'}</Label>
              <Input type="number" value={form.budget_min} onChange={e => setForm(f => ({ ...f, budget_min: e.target.value }))} />
            </div>
            <div>
              <Label>{isRu ? 'Бюджет до' : 'Budget Max'}</Label>
              <Input type="number" value={form.budget_max} onChange={e => setForm(f => ({ ...f, budget_max: e.target.value }))} />
            </div>
            <div>
              <Label>{isRu ? 'Спален от' : 'Beds Min'}</Label>
              <Input type="number" value={form.bedrooms_min} onChange={e => setForm(f => ({ ...f, bedrooms_min: e.target.value }))} placeholder="1" />
            </div>
          </div>

          {/* Property Types */}
          <div>
            <Label className="mb-1.5 block">{isRu ? 'Типы недвижимости' : 'Property Types'}</Label>
            <div className="flex flex-wrap gap-1.5">
              {PROPERTY_TYPES.map(t => (
                <button
                  key={t}
                  onClick={() => toggleType(t)}
                  className={cn(
                    'px-2.5 py-1 rounded-full text-xs border transition-colors',
                    form.preferred_types.includes(t)
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-card border-border text-muted-foreground hover:border-primary/50',
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Districts */}
          <div>
            <Label className="mb-1.5 block">{isRu ? 'Районы' : 'Districts'}</Label>
            <div className="flex flex-wrap gap-1.5">
              {PHUKET_DISTRICTS.map(d => (
                <button
                  key={d}
                  onClick={() => toggleDistrict(d)}
                  className={cn(
                    'px-2.5 py-1 rounded-full text-xs border transition-colors',
                    form.preferred_districts.includes(d)
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-card border-border text-muted-foreground hover:border-primary/50',
                  )}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label>{isRu ? 'Заметки' : 'Notes'}</Label>
            <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={3} />
          </div>
          <Button onClick={handleSubmit} disabled={createDeal.isPending} className="w-full">
            {createDeal.isPending ? '...' : (isRu ? 'Создать сделку' : 'Create Deal')}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// Helper for displaying stage labels in duplicate warning
const DEAL_STAGE_LABELS_LOOKUP: Record<string, { en: string; ru: string }> = {
  new: { en: 'New', ru: 'Новый' },
  contacted: { en: 'Contacted', ru: 'Контакт' },
  showing: { en: 'Showing', ru: 'Показ' },
  negotiation: { en: 'Negotiation', ru: 'Торг' },
  contract: { en: 'Contract', ru: 'Договор' },
  closed_won: { en: 'Won', ru: 'Успех' },
  closed_lost: { en: 'Lost', ru: 'Проигрыш' },
};
