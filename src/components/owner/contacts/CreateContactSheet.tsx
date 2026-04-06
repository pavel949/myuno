import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useCreateContact } from '@/hooks/useCrmContacts';
import { useCrmOptions } from '@/hooks/useCrmSettings';
import { PHUKET_DISTRICTS, PROPERTY_TYPES, CURRENCIES } from '@/hooks/useAgentDeals';

import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { ContactTagPicker } from '@/components/owner/contacts/ContactTagPicker';
import { UserPlus } from 'lucide-react';
import { ResponsiveModal } from '@/components/ui/responsive-modal';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
}

export function CreateContactSheet({ open, onOpenChange, companyId }: Props) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { user } = useAuth();
  const { toast } = useToast();
  const createContact = useCreateContact();
  const { data: contactTypes = [] } = useCrmOptions(companyId, 'contact_type');
  const { data: leadSources = [] } = useCrmOptions(companyId, 'lead_source');

  const [form, setForm] = useState({
    first_name: '', last_name: '', phone: '', email: '', whatsapp: '', telegram: '',
    contact_type: 'buyer', source: 'website', nationality: '', notes: '',
    budget_min: '', budget_max: '', currency: 'THB', bedrooms_min: '',
    preferred_types: [] as string[], preferred_districts: [] as string[], tags: [] as string[],
  });

  const handleSubmit = async () => {
    if (!form.first_name.trim()) {
      toast({ title: isRu ? 'Введите имя' : 'Enter first name', variant: 'destructive' });
      return;
    }
    try {
      await createContact.mutateAsync({
        company_id: companyId, first_name: form.first_name.trim(), last_name: form.last_name.trim(),
        phone: form.phone || null, phone2: null, email: form.email || null,
        whatsapp: form.whatsapp || null, telegram: form.telegram || null, line_id: null,
        nationality: form.nationality || null, language: 'en', source: form.source,
        contact_type: form.contact_type, company_name: null,
        budget_min: form.budget_min ? Number(form.budget_min) : null,
        budget_max: form.budget_max ? Number(form.budget_max) : null, currency: form.currency,
        preferred_districts: form.preferred_districts.length ? form.preferred_districts : null,
        preferred_types: form.preferred_types.length ? form.preferred_types : null,
        bedrooms_min: form.bedrooms_min ? Number(form.bedrooms_min) : null,
        lifecycle_stage: 'lead',
        notes: form.notes || null, tags: form.tags, avatar_url: null, is_archived: false,
        created_by: user?.id || null,
      });
      toast({ title: isRu ? 'Контакт создан' : 'Contact created' });
      onOpenChange(false);
      setForm({ first_name: '', last_name: '', phone: '', email: '', whatsapp: '', telegram: '', contact_type: 'buyer', source: 'website', nationality: '', notes: '', budget_min: '', budget_max: '', currency: 'THB', bedrooms_min: '', preferred_types: [], preferred_districts: [], tags: [] });
    } catch {
      toast({ title: isRu ? 'Ошибка' : 'Failed', variant: 'destructive' });
    }
  };

  const toggleArray = (key: 'preferred_types' | 'preferred_districts', val: string) => {
    setForm(f => ({ ...f, [key]: f[key].includes(val) ? f[key].filter(x => x !== val) : [...f[key], val] }));
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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <Label>{isRu ? 'Тип' : 'Type'}</Label>
          <Select value={form.contact_type} onValueChange={v => setForm(f => ({ ...f, contact_type: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{contactTypes.map(t => <SelectItem key={t.value} value={t.value}>{isRu ? t.label_ru : t.label_en}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <Label>{isRu ? 'Источник' : 'Source'}</Label>
          <Select value={form.source} onValueChange={v => setForm(f => ({ ...f, source: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{leadSources.map(s => <SelectItem key={s.value} value={s.value}>{isRu ? s.label_ru : s.label_en}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div><Label>{isRu ? 'Нац.' : 'Nation.'}</Label><Input value={form.nationality} onChange={e => setForm(f => ({ ...f, nationality: e.target.value }))} placeholder="RU" /></div>
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
            <button key={t} onClick={() => toggleArray('preferred_types', t)}
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
            <button key={d} onClick={() => toggleArray('preferred_districts', d)}
              className={cn('px-2.5 py-1 rounded-full text-xs border transition-colors',
                form.preferred_districts.includes(d) ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border text-muted-foreground hover:border-primary/50'
              )}>{d}</button>
          ))}
        </div>
      </div>
      <div>
        <Label className="mb-1.5 block">{isRu ? 'Теги' : 'Tags'}</Label>
        <ContactTagPicker companyId={companyId} selectedTags={form.tags}
          onToggle={(tag) => setForm(f => ({ ...f, tags: f.tags.includes(tag) ? f.tags.filter(t => t !== tag) : [...f.tags, tag] }))} />
      </div>
      <div><Label>{isRu ? 'Заметки' : 'Notes'}</Label><Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} /></div>
    </ResponsiveModal>
  );
}
