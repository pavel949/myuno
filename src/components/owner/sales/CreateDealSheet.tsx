import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertCircle, Crown, Handshake } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useCreateDeal, useDuplicateCheck, CLIENT_SOURCES, PHUKET_DISTRICTS, PROPERTY_TYPES, CURRENCIES, DEAL_TYPES, DEAL_TYPE_LABELS } from '@/hooks/useAgentDeals';
import { usePropertyProjects } from '@/hooks/usePropertyProjects';
import { useCreateContact, CrmContact } from '@/hooks/useCrmContacts';
import { ContactSearchInput } from '@/components/owner/contacts/ContactSearchInput';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { ResponsiveModal } from '@/components/ui/responsive-modal';
import { APP_ROUTES } from '@/lib/config/routes';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  prefilledContact?: CrmContact | null;
  prefilledStage?: string;
}

const CONTACT_TYPE_BY_DEAL_TYPE = {
  sale: 'buyer',
  rent: 'tenant',
  investment: 'investor',
  management: 'landlord',
} as const;

export function CreateDealSheet({ open, onOpenChange, companyId, prefilledContact, prefilledStage = 'new' }: Props) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const createDeal = useCreateDeal();
  const createContact = useCreateContact();
  const { data: catalogProjects = [] } = usePropertyProjects();
  const [selectedContact, setSelectedContact] = useState<CrmContact | null>(prefilledContact || null);

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
        is_vip: f.is_vip || (prefilledContact.tags?.some(tag => tag.toLowerCase() === 'vip') ?? false),
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
    is_vip: false,
    property_project_id: '' as string,
  });
  const [errors, setErrors] = useState<{
    client_name?: string;
    client_email?: string;
    budget?: string;
  }>({});
  const selectedContactIsVip = selectedContact?.tags?.some(tag => tag.toLowerCase() === 'vip') || false;

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

  const validateForm = () => {
    const nextErrors: { client_name?: string; client_email?: string; budget?: string } = {};
    if (!form.client_name.trim() && !selectedContact) {
      nextErrors.client_name = isRu ? 'Введите имя клиента или выберите контакт' : 'Enter client name or select a contact';
    }
    if (form.client_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.client_email.trim())) {
      nextErrors.client_email = isRu ? 'Неверный формат email' : 'Invalid email format';
    }
    const bMin = form.budget_min ? Number(form.budget_min) : null;
    const bMax = form.budget_max ? Number(form.budget_max) : null;
    if (bMin !== null && bMax !== null && bMin > bMax) {
      nextErrors.budget = isRu ? 'Бюджет "от" не может быть больше "до"' : 'Budget min cannot be greater than max';
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast({ title: isRu ? 'Проверьте обязательные поля' : 'Please fix required fields', variant: 'destructive' });
      return;
    }
    try {
      let contactId: string | null = selectedContact?.id || null;
      const clientName = selectedContact ? `${selectedContact.first_name} ${selectedContact.last_name}`.trim() : form.client_name.trim();
      const clientPhone = selectedContact ? selectedContact.phone : (form.client_phone || null);
      const clientEmail = selectedContact ? selectedContact.email : (form.client_email || null);

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
            source: form.client_source, contact_type: CONTACT_TYPE_BY_DEAL_TYPE[form.deal_type as keyof typeof CONTACT_TYPE_BY_DEAL_TYPE],
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
        } catch (contactError: any) {
          toast({
            title: isRu ? 'Не удалось создать контакт' : 'Failed to create contact',
            description: contactError?.message || String(contactError),
            variant: 'destructive',
          });
        }
      }

      const createdDeal = await createDeal.mutateAsync({
        company_id: companyId,
        agent_id: user!.id,
        property_id: null,
        property_project_id: form.property_project_id || null,
        client_name: clientName,
        client_phone: clientPhone,
        client_email: clientEmail,
        client_source: form.client_source,
        stage: prefilledStage as any,
        deal_type: form.deal_type,
        deal_status: 'active',
        budget_min: form.budget_min ? Number(form.budget_min) : null,
        budget_max: form.budget_max ? Number(form.budget_max) : null,
        currency: form.currency,
        preferred_districts: form.preferred_districts.length ? form.preferred_districts : null,
        preferred_types: form.preferred_types.length ? form.preferred_types : null,
        bedrooms_min: form.bedrooms_min ? Number(form.bedrooms_min) : null,
        notes: form.notes || null,
        is_vip: form.is_vip,
        next_action: null, next_action_date: null, deal_value: null,
        commission_percent: null, commission_amount: null,
        closed_at: null, lost_reason: null, won_reason: null,
        ...(contactId ? { contact_id: contactId } : {}),
      } as any);
      toast({
        title: isRu ? 'Сделка создана' : 'Deal created',
        description: isRu ? 'Запись сохранена и открыта в CRM.' : 'The record was saved and opened in CRM.',
      });
      onOpenChange(false);
      setSelectedContact(null);
      setErrors({});
      setForm({ client_name: '', client_phone: '', client_email: '', client_source: 'website', deal_type: 'sale', notes: '', budget_min: '', budget_max: '', currency: 'THB', bedrooms_min: '', preferred_types: [], preferred_districts: [], is_vip: false, property_project_id: '' });
      if (createdDeal?.id) {
        navigate(`${APP_ROUTES.MC_SALES}/${createdDeal.id}`);
      }
    } catch (dealError: any) {
      toast({
        title: isRu ? 'Ошибка при создании сделки' : 'Failed to create deal',
        description: dealError?.message || String(dealError),
        variant: 'destructive',
      });
    }
  };

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={onOpenChange}
      title={isRu ? 'Новая сделка' : 'New Deal'}
      icon={<Handshake className="w-5 h-5 text-primary" />}
      size="2xl"
      mobileHeight="max-h-[92vh]"
      footer={
        <Button onClick={handleSubmit} disabled={createDeal.isPending} className="w-full sm:w-auto min-w-[200px]">
          {createDeal.isPending ? '...' : (isRu ? 'Создать сделку' : 'Create Deal')}
        </Button>
      }
    >
      <div className="space-y-4 pr-1">
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
                onClick={() => { onOpenChange(false); navigate(`${APP_ROUTES.MC_SALES}/${d.id}`); }}
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
              const contactIsVip = c.tags?.some(tag => tag.toLowerCase() === 'vip') || false;
              setSelectedContact(c);
              setErrors((prev) => ({ ...prev, client_name: undefined }));
              setForm(f => ({
                ...f,
                client_name: `${c.first_name} ${c.last_name}`.trim(),
                client_phone: c.phone || '',
                client_email: c.email || '',
                is_vip: f.is_vip || contactIsVip,
              }));
            }}
            onClear={() => setSelectedContact(null)}
            isRu={isRu}
          />
          {selectedContactIsVip && (
            <p className="mt-1 text-xs text-warning flex items-center gap-1">
              <Crown className="h-3.5 w-3.5" />
              {isRu ? 'Контакт отмечен как VIP' : 'Contact is marked as VIP'}
            </p>
          )}
        </div>

      <div className="flex items-center justify-between rounded-lg border border-warning/30 bg-warning/5 px-3 py-2">
        <div className="flex items-center gap-2">
          <Crown className="h-4 w-4 text-warning" />
          <Label htmlFor="deal-vip-toggle" className="cursor-pointer">
            {isRu ? 'VIP клиент (сделка)' : 'VIP client (deal)'}
          </Label>
        </div>
        <Checkbox
          id="deal-vip-toggle"
          checked={form.is_vip}
          onCheckedChange={(checked) => setForm(f => ({ ...f, is_vip: Boolean(checked) }))}
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
        <Label>{isRu ? 'Проект (offplan / новостройка)' : 'Project (offplan / newbuild)'}</Label>
        <Select
          value={form.property_project_id || '__none__'}
          onValueChange={(v) => setForm((f) => ({ ...f, property_project_id: v === '__none__' ? '' : v }))}
        >
          <SelectTrigger>
            <SelectValue placeholder={isRu ? 'Не выбран' : 'None'} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">{isRu ? '— Без проекта —' : '— No project —'}</SelectItem>
            {catalogProjects.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {isRu ? p.name_ru || p.name_en : p.name_en || p.name_ru}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground mt-1">
          {isRu
            ? 'Для целевых продаж по конкретному ЖК / проекту. Волны и отчёты по проекту — в разработке.'
            : 'Link this deal to a catalog project. Campaign waves / project rollups are planned.'}
        </p>
      </div>

      <div>
        <Label>{isRu ? 'Имя клиента *' : 'Client Name *'}</Label>
        <Input value={form.client_name} onChange={e => { setForm(f => ({ ...f, client_name: e.target.value })); setErrors(prev => ({ ...prev, client_name: undefined })); }} />
        {errors.client_name && <p className="text-xs text-destructive mt-1">{errors.client_name}</p>}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <Label>{isRu ? 'Телефон' : 'Phone'}</Label>
          <Input value={form.client_phone} onChange={e => setForm(f => ({ ...f, client_phone: e.target.value }))} />
        </div>
        <div>
          <Label>Email</Label>
          <Input type="email" value={form.client_email} onChange={e => { setForm(f => ({ ...f, client_email: e.target.value })); setErrors(prev => ({ ...prev, client_email: undefined })); }} />
          {errors.client_email && <p className="text-xs text-destructive mt-1">{errors.client_email}</p>}
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
      {errors.budget && <p className="text-xs text-destructive -mt-1">{errors.budget}</p>}

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
      </div>
    </ResponsiveModal>
  );
}

const DEAL_STAGE_LABELS_LOOKUP: Record<string, { en: string; ru: string }> = {
  new: { en: 'New', ru: 'Новый' },
  contacted: { en: 'Contacted', ru: 'Контакт' },
  showing: { en: 'Showing', ru: 'Показ' },
  negotiation: { en: 'Negotiation', ru: 'Торг' },
  contract: { en: 'Contract', ru: 'Договор' },
  closed_won: { en: 'Won', ru: 'Успех' },
  closed_lost: { en: 'Lost', ru: 'Проигрыш' },
};
