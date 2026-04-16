import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useCreateContact } from '@/hooks/useCrmContacts';
import { useCrmOptions } from '@/hooks/useCrmSettings';
import { PHUKET_DISTRICTS, PROPERTY_TYPES, CURRENCIES } from '@/hooks/useAgentDeals';
import { CRM_ROLES, CRM_ROLE_LABELS, CONTACT_SEGMENTS, CONTACT_SEGMENT_LABELS, type ContactSegment, HNW_TIERS, HNW_TIER_LABELS, type HnwTier, KYC_STATUSES, KYC_STATUS_LABELS, type KycStatus, CONTACT_CATEGORIES, CONTACT_CATEGORY_LABELS, type ContactCategory } from '@/types/contact';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { ContactTagPicker } from '@/components/owner/contacts/ContactTagPicker';
import { LeadSourceField } from '@/components/owner/contacts/LeadSourceField';
import {
  CRM_COMMUNICATION_LANG_PRESETS,
  CRM_LANG_CUSTOM_VALUE,
  COMMON_CONTACT_INTERESTS,
  languageForDb,
  MARITAL_STATUS_LABELS,
  MARITAL_STATUS_VALUES,
} from '@/lib/crmContactFormPresets';
import { UserPlus, X } from 'lucide-react';
import { ResponsiveModal } from '@/components/ui/responsive-modal';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
}

const initialForm = () => ({
  first_name: '',
  last_name: '',
  phone: '',
  email: '',
  whatsapp: '',
  telegram: '',
  contact_type: 'buyer',
  crm_roles: [] as string[],
  source: 'website',
  nationality: '',
  notes: '',
  budget_min: '',
  budget_max: '',
  currency: 'THB',
  bedrooms_min: '',
  preferred_types: [] as string[],
  preferred_districts: [] as string[],
  tags: [] as string[],
  birthday: '',
  family_info: '',
  interests: [] as string[],
  langPreset: 'en',
  langCustom: '',
  marital_status: '' as string,
  is_vip: false,
  // New fields
  contact_category: 'person' as string,
  segment: [] as string[],
  hnw_tier: '' as string,
  passport_country: '',
  tax_residency: '',
  aml_kyc_status: 'not_started' as string,
  pep_flag: false,
  sanctions_flag: false,
});

export function CreateContactSheet({ open, onOpenChange, companyId }: Props) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { user } = useAuth();
  const { toast } = useToast();
  const createContact = useCreateContact();
  const { data: contactTypes = [] } = useCrmOptions(companyId, 'contact_type');
  const { data: leadSources = [] } = useCrmOptions(companyId, 'lead_source');

  const [form, setForm] = useState(initialForm);
  const [customInterest, setCustomInterest] = useState('');

  useEffect(() => {
    if (contactTypes.length === 0 && leadSources.length === 0) return;
    setForm((f) => {
      const next = { ...f };
      if (contactTypes.length > 0 && !contactTypes.some((o) => o.value === f.contact_type)) {
        next.contact_type = contactTypes[0].value;
      }
      if (leadSources.length > 0 && !leadSources.some((o) => o.value === f.source)) {
        next.source = leadSources[0].value;
      }
      return next;
    });
  }, [contactTypes, leadSources]);

  const syncVipTag = (nextTags: string[], isVip: boolean): string[] => {
    const hasVipTag = nextTags.some((t) => t.toUpperCase() === 'VIP');
    if (isVip && !hasVipTag) return [...nextTags, 'VIP'];
    if (!isVip && hasVipTag) return nextTags.filter((t) => t.toUpperCase() !== 'VIP');
    return nextTags;
  };

  const handleSubmit = async () => {
    if (!form.first_name.trim()) {
      toast({ title: isRu ? 'Введите имя' : 'Enter first name', variant: 'destructive' });
      return;
    }
    const langDb = languageForDb(form.langPreset, form.langCustom);
    const tags = syncVipTag(form.tags, form.is_vip);
    try {
      await createContact.mutateAsync({
        company_id: companyId,
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        phone: form.phone || null,
        phone2: null,
        email: form.email || null,
        whatsapp: form.whatsapp || null,
        telegram: form.telegram || null,
        line_id: null,
        nationality: form.nationality || null,
        language: langDb,
        source: form.source,
        contact_type: form.contact_type,
        company_name: null,
        budget_min: form.budget_min ? Number(form.budget_min) : null,
        budget_max: form.budget_max ? Number(form.budget_max) : null,
        currency: form.currency,
        preferred_districts: form.preferred_districts.length ? form.preferred_districts : null,
        preferred_types: form.preferred_types.length ? form.preferred_types : null,
        bedrooms_min: form.bedrooms_min ? Number(form.bedrooms_min) : null,
        lifecycle_stage: 'lead',
        notes: form.notes || null,
        tags,
        avatar_url: null,
        is_archived: false,
        created_by: user?.id || null,
        crm_roles: form.crm_roles,
        birthday: form.birthday || null,
        family_info: form.family_info || null,
        interests: form.interests.length ? form.interests : null,
        is_vip: form.is_vip,
        marital_status: form.marital_status || null,
        // New fields
        contact_category: form.contact_category || 'person',
        segment: form.segment.length ? form.segment : null,
        hnw_tier: form.hnw_tier || null,
        passport_country: form.passport_country || null,
        tax_residency: form.tax_residency || null,
        aml_kyc_status: form.aml_kyc_status || 'not_started',
        pep_flag: form.pep_flag,
        sanctions_flag: form.sanctions_flag,
      });
      toast({ title: isRu ? 'Контакт создан' : 'Contact created' });
      onOpenChange(false);
      setForm(initialForm());
      setCustomInterest('');
    } catch {
      /* Error toast from useCreateContact (sonner) with formatPostgrestError */
    }
  };

  const toggleArray = (key: 'preferred_types' | 'preferred_districts' | 'interests', val: string) => {
    setForm((f) => ({
      ...f,
      [key]: f[key].includes(val) ? f[key].filter((x) => x !== val) : [...f[key], val],
    }));
  };

  const toggleCrmRole = (role: (typeof CRM_ROLES)[number]) => {
    setForm((f) => ({
      ...f,
      crm_roles: f.crm_roles.includes(role) ? f.crm_roles.filter((x) => x !== role) : [...f.crm_roles, role],
    }));
  };

  const addCustomInterest = () => {
    const val = customInterest.trim().toLowerCase();
    if (val && !form.interests.includes(val)) {
      setForm((f) => ({ ...f, interests: [...f.interests, val] }));
    }
    setCustomInterest('');
  };

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={onOpenChange}
      title={isRu ? 'Новый контакт' : 'New Contact'}
      icon={<UserPlus className="w-5 h-5 text-primary" />}
      size="lg"
      footer={
        <Button onClick={handleSubmit} disabled={createContact.isPending} className="w-full sm:w-auto min-w-[200px]">
          {createContact.isPending ? '...' : (isRu ? 'Создать контакт' : 'Create Contact')}
        </Button>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div><Label>{isRu ? 'Имя *' : 'First Name *'}</Label><Input value={form.first_name} onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))} /></div>
        <div><Label>{isRu ? 'Фамилия' : 'Last Name'}</Label><Input value={form.last_name} onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))} /></div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div><Label>{isRu ? 'Телефон' : 'Phone'}</Label><Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></div>
        <div><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div><Label>WhatsApp</Label><Input value={form.whatsapp} onChange={e => setForm(f => ({ ...f, whatsapp: e.target.value }))} placeholder={isRu ? 'Если отличается' : 'If different'} /></div>
        <div><Label>Telegram</Label><Input value={form.telegram} onChange={e => setForm(f => ({ ...f, telegram: e.target.value }))} placeholder="@username" /></div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <div>
          <Label>{isRu ? 'Тип' : 'Type'}</Label>
          <Select value={form.contact_type} onValueChange={v => setForm(f => ({ ...f, contact_type: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{contactTypes.map(t => <SelectItem key={t.value} value={t.value}>{isRu ? t.label_ru : t.label_en}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <LeadSourceField
          companyId={companyId}
          isRu={isRu}
          leadSources={leadSources}
          value={form.source}
          onValueChange={(v) => setForm((f) => ({ ...f, source: v }))}
        />
        <div><Label>{isRu ? 'Нац.' : 'Nation.'}</Label><Input value={form.nationality} onChange={e => setForm(f => ({ ...f, nationality: e.target.value }))} placeholder="RU" /></div>
      </div>
      <div>
        <Label className="mb-1.5 block">{isRu ? 'Роли CRM' : 'CRM roles'}</Label>
        <p className="text-xs text-muted-foreground mb-2">{isRu ? 'Можно выбрать несколько' : 'Select one or more'}</p>
        <div className="flex flex-wrap gap-1.5">
          {CRM_ROLES.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => toggleCrmRole(r)}
              className={cn(
                'px-2.5 py-1 rounded-full text-xs border transition-colors',
                form.crm_roles.includes(r)
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-card border-border text-muted-foreground hover:border-primary/50'
              )}
            >
              {isRu ? CRM_ROLE_LABELS[r].ru : CRM_ROLE_LABELS[r].en}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <Label>{isRu ? 'День рождения' : 'Birthday'}</Label>
          <Input type="date" value={form.birthday} onChange={e => setForm(f => ({ ...f, birthday: e.target.value }))} />
        </div>
        <div>
          <Label>{isRu ? 'Язык общения' : 'Language'}</Label>
          <Select
            value={form.langPreset}
            onValueChange={(v) => setForm((f) => ({ ...f, langPreset: v, langCustom: v === CRM_LANG_CUSTOM_VALUE ? f.langCustom : '' }))}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {CRM_COMMUNICATION_LANG_PRESETS.map((p) => (
                <SelectItem key={p.code} value={p.code}>{isRu ? p.labelRu : p.labelEn}</SelectItem>
              ))}
              <SelectItem value={CRM_LANG_CUSTOM_VALUE}>{isRu ? 'Другое' : 'Other'}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      {form.langPreset === CRM_LANG_CUSTOM_VALUE && (
        <div>
          <Label>{isRu ? 'Укажите язык' : 'Specify language'}</Label>
          <Input value={form.langCustom} onChange={(e) => setForm((f) => ({ ...f, langCustom: e.target.value }))} placeholder={isRu ? 'Например: японский' : 'e.g. Japanese'} />
        </div>
      )}
      <div>
        <Label>{isRu ? 'Семья' : 'Family'}</Label>
        <Textarea
          placeholder={isRu ? 'Жена Анна, дочь 5 лет...' : 'Wife Anna, daughter 5 y.o...'}
          value={form.family_info}
          onChange={e => setForm(f => ({ ...f, family_info: e.target.value }))}
          rows={2}
        />
      </div>
      <div>
        <Label>{isRu ? 'Семейное положение' : 'Marital status'}</Label>
        <Select value={form.marital_status || '__none__'} onValueChange={(v) => setForm((f) => ({ ...f, marital_status: v === '__none__' ? '' : v }))}>
          <SelectTrigger><SelectValue placeholder={isRu ? 'Не указано' : 'Not set'} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">{isRu ? 'Не указано' : 'Not set'}</SelectItem>
            {MARITAL_STATUS_VALUES.map((ms) => (
              <SelectItem key={ms} value={ms}>{isRu ? MARITAL_STATUS_LABELS[ms].ru : MARITAL_STATUS_LABELS[ms].en}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label className="mb-1.5 block">{isRu ? 'Интересы' : 'Interests'}</Label>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {COMMON_CONTACT_INTERESTS.map((i) => (
            <button
              key={i}
              type="button"
              onClick={() => toggleArray('interests', i)}
              className={cn(
                'px-2.5 py-1 rounded-full text-xs border transition-colors',
                form.interests.includes(i) ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border text-muted-foreground'
              )}
            >
              {i}
            </button>
          ))}
        </div>
        {form.interests.filter((i) => !(COMMON_CONTACT_INTERESTS as readonly string[]).includes(i)).length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {form.interests.filter((i) => !(COMMON_CONTACT_INTERESTS as readonly string[]).includes(i)).map((i) => (
              <Badge key={i} variant="secondary" className="gap-1 text-xs">
                {i}
                <button type="button" onClick={() => toggleArray('interests', i)}><X className="h-3 w-3" /></button>
              </Badge>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <Input
            placeholder={isRu ? 'Добавить свой...' : 'Add custom...'}
            value={customInterest}
            onChange={(e) => setCustomInterest(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomInterest())}
            className="flex-1"
          />
          <Button variant="outline" size="sm" type="button" onClick={addCustomInterest} disabled={!customInterest.trim()}>+</Button>
        </div>
      </div>
      <div className="flex items-center justify-between rounded-lg border p-3">
        <div>
          <p className="text-sm font-medium">{isRu ? 'VIP' : 'VIP'}</p>
          <p className="text-xs text-muted-foreground">{isRu ? 'Приоритетный клиент' : 'Priority client'}</p>
        </div>
        <Switch
          checked={form.is_vip}
          onCheckedChange={(checked) =>
            setForm((f) => ({
              ...f,
              is_vip: checked,
              tags: syncVipTag(f.tags, checked),
            }))
          }
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div><Label>{isRu ? 'Бюджет от' : 'Budget Min'}</Label><Input type="number" value={form.budget_min} onChange={e => setForm(f => ({ ...f, budget_min: e.target.value }))} /></div>
        <div><Label>{isRu ? 'Бюджет до' : 'Budget Max'}</Label><Input type="number" value={form.budget_max} onChange={e => setForm(f => ({ ...f, budget_max: e.target.value }))} /></div>
        <div>
          <Label>{isRu ? 'Валюта' : 'Currency'}</Label>
          <Select value={form.currency} onValueChange={v => setForm(f => ({ ...f, currency: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{CURRENCIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <Label className="mb-1.5 block">{isRu ? 'Типы недвижимости' : 'Property Types'}</Label>
        <div className="flex flex-wrap gap-1.5">
          {PROPERTY_TYPES.map(t => (
            <button key={t} type="button" onClick={() => toggleArray('preferred_types', t)}
              className={cn('px-2.5 py-1 rounded-full text-xs border transition-colors',
                form.preferred_types.includes(t) ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border text-muted-foreground hover:border-primary/50'
              )}>{t}</button>
          ))}
        </div>
      </div>
      <div>
        <Label className="mb-1.5 block">{isRu ? 'Районы' : 'Districts'}</Label>
        <div className="flex flex-wrap gap-1.5">
          {PHUKET_DISTRICTS.map(d => (
            <button key={d} type="button" onClick={() => toggleArray('preferred_districts', d)}
              className={cn('px-2.5 py-1 rounded-full text-xs border transition-colors',
                form.preferred_districts.includes(d) ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border text-muted-foreground hover:border-primary/50'
              )}>{d}</button>
          ))}
        </div>
      </div>
      <div>
        <Label className="mb-1.5 block">{isRu ? 'Теги' : 'Tags'}</Label>
        <ContactTagPicker
          companyId={companyId}
          selectedTags={form.tags}
          onToggle={(tag) =>
            setForm((f) => {
              const nextTags = f.tags.includes(tag) ? f.tags.filter((t) => t !== tag) : [...f.tags, tag];
              const isVip = nextTags.some((t) => t.toUpperCase() === 'VIP');
              return { ...f, tags: nextTags, is_vip: isVip };
            })
          }
        />
      </div>
      <div><Label>{isRu ? 'Заметки' : 'Notes'}</Label><Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} /></div>
    </ResponsiveModal>
  );
}
