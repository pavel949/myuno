import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useLanguage } from '@/contexts/LanguageContext';
import { useUpdateContact, CrmContact } from '@/hooks/useCrmContacts';
import { useCrmOptions } from '@/hooks/useCrmSettings';
import { useOwnerManagementSettings, useUpsertOwnerManagementSettings, DEFAULT_FEE_PERCENT } from '@/hooks/useOwnerManagementSettings';
import { PHUKET_DISTRICTS, PROPERTY_TYPES, CURRENCIES } from '@/hooks/useAgentDeals';
import { CRM_ROLES, CRM_ROLE_LABELS } from '@/types/contact';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { X, UserCog } from 'lucide-react';
import { ContactTagPicker } from '@/components/owner/contacts/ContactTagPicker';
import { ResponsiveModal } from '@/components/ui/responsive-modal';

const COMMON_INTERESTS = [
  'golf', 'diving', 'yoga', 'fitness', 'sailing', 'travel', 'wine', 'cooking',
  'art', 'photography', 'crypto', 'business', 'kids activities', 'spa',
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact: CrmContact;
}

export function EditContactSheet({ open, onOpenChange, contact }: Props) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { toast } = useToast();
  const updateContact = useUpdateContact();
  const upsertOwnerSettings = useUpsertOwnerManagementSettings();
  const { data: contactTypes = [] } = useCrmOptions(contact.company_id, 'contact_type');
  const { data: leadSources = [] } = useCrmOptions(contact.company_id, 'lead_source');
  const { data: ownerSettings } = useOwnerManagementSettings(contact.id, contact.company_id);

  const [form, setForm] = useState({
    first_name: contact.first_name,
    last_name: contact.last_name,
    phone: contact.phone || '',
    email: contact.email || '',
    whatsapp: contact.whatsapp || '',
    telegram: contact.telegram || '',
    instagram: contact.instagram || '',
    facebook: contact.facebook || '',
    linkedin: contact.linkedin || '',
    contact_type: contact.contact_type || 'buyer',
    crm_role: (contact as { crm_role?: string }).crm_role || 'other',
    source: contact.source || 'website',
    nationality: contact.nationality || '',
    language: contact.language || '',
    company_name: contact.company_name || '',
    job_title: contact.job_title || '',
    notes: contact.notes || '',
    budget_min: contact.budget_min?.toString() || '',
    budget_max: contact.budget_max?.toString() || '',
    currency: contact.currency || 'THB',
    bedrooms_min: contact.bedrooms_min?.toString() || '',
    preferred_types: contact.preferred_types || [],
    preferred_districts: contact.preferred_districts || [],
    birthday: contact.birthday || '',
    family_info: contact.family_info || '',
    interests: contact.interests || [],
    scoring: contact.scoring?.toString() || '0',
    tags: contact.tags || [],
    mobile: contact.mobile || '',
    address_street: contact.address_street || '',
    address_street2: contact.address_street2 || '',
    address_city: contact.address_city || '',
    address_state: contact.address_state || '',
    address_zip: contact.address_zip || '',
    address_country: contact.address_country || '',
    tax_id: contact.tax_id || '',
    website: contact.website || '',
    management_fee_percent: String(DEFAULT_FEE_PERCENT),
  });

  const [customInterest, setCustomInterest] = useState('');

  useEffect(() => {
    setForm({
      first_name: contact.first_name,
      last_name: contact.last_name,
      phone: contact.phone || '',
      email: contact.email || '',
      whatsapp: contact.whatsapp || '',
      telegram: contact.telegram || '',
      instagram: contact.instagram || '',
      facebook: contact.facebook || '',
      linkedin: contact.linkedin || '',
      contact_type: contact.contact_type || 'buyer',
      crm_role: (contact as { crm_role?: string }).crm_role || 'other',
      source: contact.source || 'website',
      nationality: contact.nationality || '',
      language: contact.language || '',
      company_name: contact.company_name || '',
      job_title: contact.job_title || '',
      notes: contact.notes || '',
      budget_min: contact.budget_min?.toString() || '',
      budget_max: contact.budget_max?.toString() || '',
      currency: contact.currency || 'THB',
      bedrooms_min: contact.bedrooms_min?.toString() || '',
      preferred_types: contact.preferred_types || [],
      preferred_districts: contact.preferred_districts || [],
      birthday: contact.birthday || '',
      family_info: contact.family_info || '',
      interests: contact.interests || [],
      scoring: contact.scoring?.toString() || '0',
      tags: contact.tags || [],
      mobile: contact.mobile || '',
      address_street: contact.address_street || '',
      address_street2: contact.address_street2 || '',
      address_city: contact.address_city || '',
      address_state: contact.address_state || '',
      address_zip: contact.address_zip || '',
      address_country: contact.address_country || '',
    tax_id: contact.tax_id || '',
    website: contact.website || '',
    management_fee_percent: String(ownerSettings?.management_fee_percent ?? DEFAULT_FEE_PERCENT),
  });
  }, [contact, ownerSettings]);

  const handleSubmit = async () => {
    if (!form.first_name.trim()) {
      toast({ title: isRu ? 'Введите имя' : 'Enter first name', variant: 'destructive' });
      return;
    }
    const feeNum = parseFloat(form.management_fee_percent);
    if (
      (form.crm_role === 'owner' || form.crm_role === 'investor') &&
      (isNaN(feeNum) || feeNum < 0 || feeNum > 100)
    ) {
      toast({ title: isRu ? 'Некорректный процент' : 'Invalid fee percent', variant: 'destructive' });
      return;
    }
    try {
      await updateContact.mutateAsync({
        id: contact.id,
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        phone: form.phone || null,
        email: form.email || null,
        whatsapp: form.whatsapp || null,
        telegram: form.telegram || null,
        instagram: form.instagram || null,
        facebook: form.facebook || null,
        linkedin: form.linkedin || null,
        contact_type: form.contact_type,
        crm_role: form.crm_role,
        source: form.source,
        nationality: form.nationality || null,
        language: form.language || null,
        company_name: form.company_name || null,
        job_title: form.job_title || null,
        notes: form.notes || null,
        budget_min: form.budget_min ? Number(form.budget_min) : null,
        budget_max: form.budget_max ? Number(form.budget_max) : null,
        currency: form.currency,
        bedrooms_min: form.bedrooms_min ? Number(form.bedrooms_min) : null,
        preferred_types: form.preferred_types.length ? form.preferred_types : null,
        preferred_districts: form.preferred_districts.length ? form.preferred_districts : null,
        birthday: form.birthday || null,
        family_info: form.family_info || null,
        interests: form.interests.length ? form.interests : null,
        scoring: form.scoring ? Number(form.scoring) : 0,
        tags: form.tags,
        mobile: form.mobile || null,
        address_street: form.address_street || null,
        address_street2: form.address_street2 || null,
        address_city: form.address_city || null,
        address_state: form.address_state || null,
        address_zip: form.address_zip || null,
        address_country: form.address_country || null,
        tax_id: form.tax_id || null,
        website: form.website || null,
      });
      if (form.crm_role === 'owner' || form.crm_role === 'investor') {
        const feeNum = parseFloat(form.management_fee_percent);
        if (!isNaN(feeNum) && contact.company_id) {
          await upsertOwnerSettings.mutateAsync({
            contactId: contact.id,
            companyId: contact.company_id,
            management_fee_percent: feeNum,
          });
        }
      }
      toast({ title: isRu ? 'Контакт обновлён' : 'Contact updated' });
      onOpenChange(false);
    } catch {
      toast({ title: isRu ? 'Ошибка' : 'Error', variant: 'destructive' });
    }
  };

  const toggleArray = (key: 'preferred_types' | 'preferred_districts' | 'interests', val: string) => {
    setForm(f => ({
      ...f,
      [key]: f[key].includes(val) ? f[key].filter((x: string) => x !== val) : [...f[key], val],
    }));
  };

  const addCustomInterest = () => {
    const val = customInterest.trim().toLowerCase();
    if (val && !form.interests.includes(val)) {
      setForm(f => ({ ...f, interests: [...f.interests, val] }));
    }
    setCustomInterest('');
  };

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={onOpenChange}
      title={isRu ? 'Редактировать контакт' : 'Edit Contact'}
      icon={<UserCog className="w-5 h-5 text-primary" />}
      size="lg"
      footer={
        <Button onClick={handleSubmit} disabled={updateContact.isPending} className="w-full sm:w-auto min-w-[200px]">
          {updateContact.isPending ? '...' : (isRu ? 'Сохранить' : 'Save')}
        </Button>
      }
    >
      {/* Basic info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <Label>{isRu ? 'Имя *' : 'First Name *'}</Label>
          <Input value={form.first_name} onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))} />
        </div>
        <div>
          <Label>{isRu ? 'Фамилия' : 'Last Name'}</Label>
          <Input value={form.last_name} onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))} />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div><Label>{isRu ? 'Телефон' : 'Phone'}</Label><Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></div>
        <div><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div><Label>WhatsApp</Label><Input value={form.whatsapp} onChange={e => setForm(f => ({ ...f, whatsapp: e.target.value }))} /></div>
        <div><Label>Telegram</Label><Input value={form.telegram} onChange={e => setForm(f => ({ ...f, telegram: e.target.value }))} /></div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div><Label>Instagram</Label><Input value={form.instagram} onChange={e => setForm(f => ({ ...f, instagram: e.target.value }))} placeholder="@username" /></div>
        <div><Label>Facebook</Label><Input value={form.facebook} onChange={e => setForm(f => ({ ...f, facebook: e.target.value }))} placeholder="URL or username" /></div>
        <div><Label>LinkedIn</Label><Input value={form.linkedin} onChange={e => setForm(f => ({ ...f, linkedin: e.target.value }))} placeholder="URL or username" /></div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div>
          <Label>{isRu ? 'Тип' : 'Type'}</Label>
          <Select value={form.contact_type} onValueChange={v => setForm(f => ({ ...f, contact_type: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{contactTypes.map(t => <SelectItem key={t.value} value={t.value}>{isRu ? t.label_ru : t.label_en}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <Label>{isRu ? 'Роль' : 'Role'}</Label>
          <Select value={form.crm_role} onValueChange={v => setForm(f => ({ ...f, crm_role: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {CRM_ROLES.map(r => (
                <SelectItem key={r} value={r}>{isRu ? CRM_ROLE_LABELS[r].ru : CRM_ROLE_LABELS[r].en}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>{isRu ? 'Источник' : 'Source'}</Label>
          <Select value={form.source} onValueChange={v => setForm(f => ({ ...f, source: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{leadSources.map(s => <SelectItem key={s.value} value={s.value}>{isRu ? s.label_ru : s.label_en}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div><Label>{isRu ? 'Нац.' : 'Nation.'}</Label><Input value={form.nationality} onChange={e => setForm(f => ({ ...f, nationality: e.target.value }))} /></div>
      </div>

      {(form.crm_role === 'owner' || form.crm_role === 'investor') && (
        <div className="space-y-2">
          <Label htmlFor="management_fee_percent">
            {isRu ? 'Процент управления (%)' : 'Management Fee (%)'}
          </Label>
          <Input
            id="management_fee_percent"
            type="number"
            min={0}
            max={100}
            step={0.5}
            value={form.management_fee_percent}
            onChange={e => setForm(f => ({ ...f, management_fee_percent: e.target.value }))}
          />
          <p className="text-xs text-muted-foreground">
            {isRu ? 'По умолчанию 15%. Указывается индивидуально.' : 'Default 15%. Set per owner.'}
          </p>
        </div>
      )}

      <Separator />

      {/* Address & Business (Odoo-style) */}
      <p className="text-sm font-semibold text-muted-foreground">{isRu ? 'Адрес и бизнес' : 'Address & Business'}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div><Label>{isRu ? 'Улица' : 'Street'}</Label><Input value={form.address_street} onChange={e => setForm(f => ({ ...f, address_street: e.target.value }))} /></div>
        <div><Label>{isRu ? 'Улица 2' : 'Street 2'}</Label><Input value={form.address_street2} onChange={e => setForm(f => ({ ...f, address_street2: e.target.value }))} /></div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div><Label>{isRu ? 'Город' : 'City'}</Label><Input value={form.address_city} onChange={e => setForm(f => ({ ...f, address_city: e.target.value }))} /></div>
        <div><Label>{isRu ? 'Регион' : 'State'}</Label><Input value={form.address_state} onChange={e => setForm(f => ({ ...f, address_state: e.target.value }))} /></div>
        <div><Label>{isRu ? 'Индекс' : 'ZIP'}</Label><Input value={form.address_zip} onChange={e => setForm(f => ({ ...f, address_zip: e.target.value }))} /></div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div><Label>{isRu ? 'Страна' : 'Country'}</Label><Input value={form.address_country} onChange={e => setForm(f => ({ ...f, address_country: e.target.value }))} /></div>
        <div><Label>Tax ID</Label><Input value={form.tax_id} onChange={e => setForm(f => ({ ...f, tax_id: e.target.value }))} /></div>
        <div><Label>Website</Label><Input value={form.website} onChange={e => setForm(f => ({ ...f, website: e.target.value }))} placeholder="https://" /></div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div><Label>{isRu ? 'Мобильный' : 'Mobile'}</Label><Input value={form.mobile} onChange={e => setForm(f => ({ ...f, mobile: e.target.value }))} /></div>
      </div>

      <Separator />

      {/* Personal section */}
      <p className="text-sm font-semibold text-muted-foreground">{isRu ? 'Персональное' : 'Personal'}</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <Label>{isRu ? 'День рождения' : 'Birthday'}</Label>
          <Input type="date" value={form.birthday} onChange={e => setForm(f => ({ ...f, birthday: e.target.value }))} />
        </div>
        <div>
          <Label>{isRu ? 'Язык' : 'Language'}</Label>
          <Input placeholder={isRu ? 'RU, EN, TH...' : 'EN, RU, TH...'} value={form.language} onChange={e => setForm(f => ({ ...f, language: e.target.value }))} />
        </div>
      </div>

      <div>
        <Label>{isRu ? 'Семья' : 'Family'}</Label>
        <Textarea
          placeholder={isRu ? 'Жена Анна, дочь 5 лет, сын 3 года...' : 'Wife Anna, daughter 5 y.o., son 3 y.o...'}
          value={form.family_info}
          onChange={e => setForm(f => ({ ...f, family_info: e.target.value }))}
          rows={2}
        />
      </div>

      <div>
        <Label className="mb-1.5 block">{isRu ? 'Интересы' : 'Interests'}</Label>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {COMMON_INTERESTS.map(i => (
            <button key={i} onClick={() => toggleArray('interests', i)}
              className={cn('px-2.5 py-1 rounded-full text-xs border transition-colors',
                form.interests.includes(i) ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border text-muted-foreground'
              )}>{i}</button>
          ))}
        </div>
        {form.interests.filter(i => !COMMON_INTERESTS.includes(i)).length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {form.interests.filter(i => !COMMON_INTERESTS.includes(i)).map(i => (
              <Badge key={i} variant="secondary" className="gap-1 text-xs">
                {i}
                <button onClick={() => toggleArray('interests', i)}><X className="h-3 w-3" /></button>
              </Badge>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <Input
            placeholder={isRu ? 'Добавить свой...' : 'Add custom...'}
            value={customInterest}
            onChange={e => setCustomInterest(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCustomInterest())}
            className="flex-1"
          />
          <Button variant="outline" size="sm" onClick={addCustomInterest} disabled={!customInterest.trim()}>+</Button>
        </div>
      </div>

      <div>
        <Label>{isRu ? 'Скоринг (0-100)' : 'Scoring (0-100)'}</Label>
        <Input type="number" min={0} max={100} value={form.scoring} onChange={e => setForm(f => ({ ...f, scoring: e.target.value }))} />
      </div>

      <Separator />

      {/* Professional section */}
      <p className="text-sm font-semibold text-muted-foreground">{isRu ? 'Профессиональное' : 'Professional'}</p>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>{isRu ? 'Должность' : 'Job Title'}</Label>
          <Input placeholder="CEO, Manager..." value={form.job_title} onChange={e => setForm(f => ({ ...f, job_title: e.target.value }))} />
        </div>
        <div>
          <Label>{isRu ? 'Компания' : 'Company'}</Label>
          <Input value={form.company_name} onChange={e => setForm(f => ({ ...f, company_name: e.target.value }))} />
        </div>
      </div>

      <Separator />

      {/* Preferences */}
      <p className="text-sm font-semibold text-muted-foreground">{isRu ? 'Предпочтения' : 'Preferences'}</p>

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
        <Label className="mb-1.5 block">{isRu ? 'Типы' : 'Types'}</Label>
        <div className="flex flex-wrap gap-1.5">
          {PROPERTY_TYPES.map(t => (
            <button key={t} onClick={() => toggleArray('preferred_types', t)}
              className={cn('px-2.5 py-1 rounded-full text-xs border transition-colors',
                form.preferred_types.includes(t) ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border text-muted-foreground'
              )}>{t}</button>
          ))}
        </div>
      </div>

      <div>
        <Label className="mb-1.5 block">{isRu ? 'Районы' : 'Districts'}</Label>
        <div className="flex flex-wrap gap-1.5">
          {PHUKET_DISTRICTS.map(d => (
            <button key={d} onClick={() => toggleArray('preferred_districts', d)}
              className={cn('px-2.5 py-1 rounded-full text-xs border transition-colors',
                form.preferred_districts.includes(d) ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border text-muted-foreground'
              )}>{d}</button>
          ))}
        </div>
      </div>

      {/* Tags */}
      <div>
        <Label className="mb-1.5 block">{isRu ? 'Теги' : 'Tags'}</Label>
        <ContactTagPicker
          companyId={contact.company_id}
          selectedTags={form.tags}
          onToggle={(tag) => setForm(f => ({
            ...f,
            tags: f.tags.includes(tag) ? f.tags.filter(t => t !== tag) : [...f.tags, tag],
          }))}
        />
      </div>

      <div><Label>{isRu ? 'Заметки' : 'Notes'}</Label><Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} /></div>
    </ResponsiveModal>
  );
}
