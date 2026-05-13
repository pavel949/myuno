import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertCircle, Crown, Handshake, Lock } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useCreateDeal, useDuplicateCheck, CLIENT_SOURCES, PHUKET_DISTRICTS, PROPERTY_TYPES, CURRENCIES, DEAL_TYPES, DEAL_TYPE_LABELS } from '@/hooks/useAgentDeals';
import { useCreateContact, useUpdateContact, CrmContact } from '@/hooks/useCrmContacts';
import { ContactSearchInput } from '@/components/owner/contacts/ContactSearchInput';
import { PropertySearchInput, PropertySearchResult } from '@/components/owner/sales/PropertySearchInput';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { ResponsiveModal } from '@/components/ui/responsive-modal';
import { APP_ROUTES } from '@/lib/config/routes';
import { normalizePhone, isLikelyPhone } from '@/lib/phone';

import { toast } from 'sonner';
interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
  prefilledContact?: CrmContact | null;
  prefilledStage?: string;
}

const CONTACT_TYPE_BY_DEAL_TYPE: Record<string, string> = {
  sale: 'buyer',
  rent_short: 'tenant',
  rent_long: 'tenant',
  investment: 'investor',
  management: 'landlord',
  club_deal: 'investor',
  resale: 'buyer',
  offplan: 'buyer',
};

export function CreateDealSheet({ open, onOpenChange, companyId, prefilledContact, prefilledStage = 'new' }: Props) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { user } = useAuth();
  const navigate = useNavigate();
  const createDeal = useCreateDeal();
  const createContact = useCreateContact();
  const updateContact = useUpdateContact();
  const [selectedContact, setSelectedContact] = useState<CrmContact | null>(prefilledContact || null);
  const [selectedProperty, setSelectedProperty] = useState<PropertySearchResult | null>(null);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [syncBackToContact, setSyncBackToContact] = useState(false);

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
    also_mark_contact_vip: false,
  });
  const [errors, setErrors] = useState<{
    client_name?: string;
    client_email?: string;
    client_phone?: string;
    budget?: string;
  }>({});

  // Initialize form from prefilledContact ONCE per open cycle (no longer overwrites user edits).
  useEffect(() => {
    if (!open) {
      setHasInitialized(false);
      return;
    }
    if (hasInitialized) return;
    if (prefilledContact) {
      setSelectedContact(prefilledContact);
      const contactIsVip = prefilledContact.is_vip || (prefilledContact.tags?.some(tag => tag.toLowerCase() === 'vip') ?? false);
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
        is_vip: contactIsVip,
      }));
    }
    setHasInitialized(true);
  }, [open, prefilledContact, hasInitialized]);

  const { data: duplicates = [] } = useDuplicateCheck(companyId, form.client_phone, form.client_email);

  const contactLocked = !!selectedContact;

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
    const nextErrors: typeof errors = {};
    if (!selectedContact && !form.client_name.trim()) {
      nextErrors.client_name = isRu ? 'Введите имя клиента или выберите контакт' : 'Enter client name or select a contact';
    }
    if (!selectedContact && form.client_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.client_email.trim())) {
      nextErrors.client_email = isRu ? 'Неверный формат email' : 'Invalid email format';
    }
    if (!selectedContact && form.client_phone && !isLikelyPhone(form.client_phone)) {
      nextErrors.client_phone = isRu ? 'Телефон должен содержать ≥7 цифр' : 'Phone must contain ≥7 digits';
    }
    const bMin = form.budget_min ? Number(form.budget_min) : null;
    const bMax = form.budget_max ? Number(form.budget_max) : null;
    if (bMin !== null && bMax !== null && bMin > bMax) {
      nextErrors.budget = isRu ? 'Бюджет "от" не может быть больше "до"' : 'Budget min cannot be greater than max';
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const resetForm = () => {
    setSelectedContact(null);
    setSelectedProperty(null);
    setErrors({});
    setHasInitialized(false);
    setSyncBackToContact(false);
    setForm({
      client_name: '', client_phone: '', client_email: '', client_source: 'website',
      deal_type: 'sale', notes: '', budget_min: '', budget_max: '', currency: 'THB',
      bedrooms_min: '', preferred_types: [], preferred_districts: [],
      is_vip: false, also_mark_contact_vip: false,
    });
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      toast.error(isRu ? 'Проверьте обязательные поля' : 'Please fix required fields');
      return;
    }
    try {
      let contactId: string | null = selectedContact?.id || null;
      const normalizedPhone = selectedContact ? selectedContact.phone : normalizePhone(form.client_phone);
      const normalizedEmail = selectedContact ? selectedContact.email : (form.client_email.trim().toLowerCase() || null);
      const clientName = selectedContact
        ? `${selectedContact.first_name} ${selectedContact.last_name}`.trim()
        : form.client_name.trim();

      // ALWAYS create a contact when none is linked (no orphan deals).
      if (!contactId) {
        try {
          const nameParts = form.client_name.trim().split(' ');
          const newContact = await createContact.mutateAsync({
            company_id: companyId,
            first_name: nameParts[0] || '',
            last_name: nameParts.slice(1).join(' ') || '',
            phone: normalizedPhone,
            phone2: null,
            email: normalizedEmail,
            whatsapp: null, telegram: null, line_id: null,
            nationality: null, language: 'en',
            source: form.client_source,
            contact_type: CONTACT_TYPE_BY_DEAL_TYPE[form.deal_type as keyof typeof CONTACT_TYPE_BY_DEAL_TYPE],
            company_name: null,
            budget_min: form.budget_min ? Number(form.budget_min) : null,
            budget_max: form.budget_max ? Number(form.budget_max) : null,
            currency: form.currency,
            preferred_districts: form.preferred_districts.length ? form.preferred_districts : null,
            preferred_types: form.preferred_types.length ? form.preferred_types : null,
            bedrooms_min: form.bedrooms_min ? Number(form.bedrooms_min) : null,
            notes: null,
            tags: form.also_mark_contact_vip || form.is_vip ? ['VIP'] : [],
            avatar_url: null,
            is_archived: false,
            is_vip: form.also_mark_contact_vip,
            created_by: user?.id || null,
          } as any);
          contactId = (newContact as any)?.id || null;
        } catch (contactError: any) {
          toast.error(isRu ? 'Не удалось создать контакт' : 'Failed to create contact', {
            description: contactError?.message || String(contactError),
          });
          return; // Hard stop — no orphan deals.
        }
      } else if (syncBackToContact) {
        // Push deal-level preferences/budget back into the linked contact.
        try {
          await updateContact.mutateAsync({
            id: contactId,
            budget_min: form.budget_min ? Number(form.budget_min) : null,
            budget_max: form.budget_max ? Number(form.budget_max) : null,
            currency: form.currency,
            preferred_districts: form.preferred_districts.length ? form.preferred_districts : null,
            preferred_types: form.preferred_types.length ? form.preferred_types : null,
            bedrooms_min: form.bedrooms_min ? Number(form.bedrooms_min) : null,
            ...(form.also_mark_contact_vip ? { is_vip: true } : {}),
          } as any);
        } catch {
          /* non-fatal — toast handled inside hook */
        }
      }

      const createdDeal = await createDeal.mutateAsync({
        company_id: companyId,
        agent_id: user!.id,
        property_id: selectedProperty && !selectedProperty.is_project ? selectedProperty.id : null,
        property_project_id: selectedProperty?.is_project ? selectedProperty.id : null,
        client_name: clientName,
        client_phone: normalizedPhone,
        client_email: normalizedEmail,
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
      toast(isRu ? 'Сделка создана' : 'Deal created', {
        description: isRu ? 'Запись сохранена и открыта в CRM.' : 'The record was saved and opened in CRM.',
      });
      onOpenChange(false);
      resetForm();
      if (createdDeal?.id) {
        navigate(`${APP_ROUTES.MC_SALES}/${createdDeal.id}`);
      }
    } catch (dealError: any) {
      toast.error(isRu ? 'Ошибка при создании сделки' : 'Failed to create deal', {
        description: dealError?.message || String(dealError),
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
          <div className="p-3 rounded-none border border-warning/50 bg-warning/10 text-sm">
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
              const contactIsVip = c.is_vip || (c.tags?.some(tag => tag.toLowerCase() === 'vip') || false);
              setSelectedContact(c);
              setErrors({});
              setForm(f => ({
                ...f,
                client_name: `${c.first_name} ${c.last_name}`.trim(),
                client_phone: c.phone || '',
                client_email: c.email || '',
                client_source: c.source || f.client_source,
                budget_min: c.budget_min ? String(c.budget_min) : f.budget_min,
                budget_max: c.budget_max ? String(c.budget_max) : f.budget_max,
                currency: c.currency || f.currency,
                bedrooms_min: c.bedrooms_min ? String(c.bedrooms_min) : f.bedrooms_min,
                preferred_types: c.preferred_types?.length ? c.preferred_types : f.preferred_types,
                preferred_districts: c.preferred_districts?.length ? c.preferred_districts : f.preferred_districts,
                is_vip: contactIsVip,
              }));
            }}
            onClear={() => setSelectedContact(null)}
            isRu={isRu}
          />
          {contactLocked && (
            <p className="mt-1 text-xs text-muted-foreground flex items-center gap-1">
              <Lock className="h-3 w-3" />
              {isRu
                ? 'Контактные данные взяты из карточки. Чтобы изменить — откройте контакт.'
                : 'Contact data is read-only. Edit the contact card to change it.'}
            </p>
          )}
        </div>

        {/* VIP — single source of truth + optional contact-VIP propagation */}
        <div className="rounded-none border border-warning/30 bg-warning/5 p-3 space-y-2">
          <label className="flex items-center justify-between cursor-pointer">
            <span className="flex items-center gap-2 text-sm">
              <Crown className="h-4 w-4 text-warning" />
              {isRu ? 'VIP сделка' : 'VIP deal'}
            </span>
            <Checkbox
              checked={form.is_vip}
              onCheckedChange={(checked) => setForm(f => ({ ...f, is_vip: Boolean(checked) }))}
            />
          </label>
          {!contactLocked && (
            <label className="flex items-center justify-between cursor-pointer pl-6">
              <span className="text-xs text-muted-foreground">
                {isRu ? 'Также пометить контакт как VIP' : 'Also mark the contact as VIP'}
              </span>
              <Checkbox
                checked={form.also_mark_contact_vip}
                onCheckedChange={(checked) => setForm(f => ({ ...f, also_mark_contact_vip: Boolean(checked) }))}
              />
            </label>
          )}
        </div>

        {/* Deal Type — wraps on mobile */}
        <div>
          <Label>{isRu ? 'Тип сделки' : 'Deal Type'}</Label>
          <div className="flex flex-wrap gap-1.5 mt-1">
            {DEAL_TYPES.map(dt => (
              <button
                key={dt}
                type="button"
                onClick={() => setForm(f => ({ ...f, deal_type: dt }))}
                className={cn(
                  'px-3 py-1.5 rounded-full text-xs font-medium border transition-colors whitespace-nowrap',
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

        {/* Property / project search (handles both real estate AND offplan projects) */}
        <div>
          <Label>{isRu ? 'Привязать объект / проект' : 'Link Property / Project'}</Label>
          <PropertySearchInput
            companyId={companyId}
            selectedProperty={selectedProperty}
            onSelect={(p) => {
              setSelectedProperty(p);
              setForm(f => ({
                ...f,
                preferred_districts: p.district ? [p.district] : f.preferred_districts,
                preferred_types: p.property_type ? [p.property_type] : f.preferred_types,
                budget_min: p.price ? String(p.price) : f.budget_min,
                budget_max: p.price ? String(p.price) : f.budget_max,
                bedrooms_min: p.bedrooms ? String(p.bedrooms) : f.bedrooms_min,
              }));
            }}
            onClear={() => setSelectedProperty(null)}
            isRu={isRu}
            includeProjects
          />
          <p className="text-xs text-muted-foreground mt-1">
            {isRu ? 'Поиск работает по готовым объектам и проектам (offplan / новостройки).' : 'Searches both built properties and projects (offplan / newbuild).'}
          </p>
        </div>

        {/* Client name (read-only when contact linked) */}
        <div>
          <Label>{isRu ? 'Имя клиента *' : 'Client Name *'}</Label>
          <Input
            value={form.client_name}
            disabled={contactLocked}
            onChange={e => { setForm(f => ({ ...f, client_name: e.target.value })); setErrors(prev => ({ ...prev, client_name: undefined })); }}
          />
          {errors.client_name && <p className="text-xs text-destructive mt-1">{errors.client_name}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label>{isRu ? 'Телефон' : 'Phone'}</Label>
            <Input
              value={form.client_phone}
              disabled={contactLocked}
              inputMode="tel"
              placeholder="+66 81 234 5678"
              onChange={e => { setForm(f => ({ ...f, client_phone: e.target.value })); setErrors(prev => ({ ...prev, client_phone: undefined })); }}
            />
            {errors.client_phone && <p className="text-xs text-destructive mt-1">{errors.client_phone}</p>}
          </div>
          <div>
            <Label>Email</Label>
            <Input
              type="email"
              value={form.client_email}
              disabled={contactLocked}
              onChange={e => { setForm(f => ({ ...f, client_email: e.target.value })); setErrors(prev => ({ ...prev, client_email: undefined })); }}
            />
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

        {/* Sync-back toggle (only when editing on top of an existing contact) */}
        {contactLocked && (
          <label className="flex items-center justify-between rounded-none border border-info/30 bg-info/5 p-3 cursor-pointer">
            <span className="text-xs text-muted-foreground pr-3">
              {isRu
                ? 'Обновить бюджет / районы / типы и в карточке контакта'
                : 'Also update budget / districts / types on the contact card'}
            </span>
            <Checkbox
              checked={syncBackToContact}
              onCheckedChange={(checked) => setSyncBackToContact(Boolean(checked))}
            />
          </label>
        )}
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
