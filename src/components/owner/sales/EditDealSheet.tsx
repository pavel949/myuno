import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useLanguage } from '@/contexts/LanguageContext';
import { useUpdateDeal, CLIENT_SOURCES, PHUKET_DISTRICTS, PROPERTY_TYPES, CURRENCIES, DEAL_TYPES, DEAL_TYPE_LABELS, AgentDeal, DealType } from '@/hooks/useAgentDeals';
import { usePropertyProjects } from '@/hooks/usePropertyProjects';
import { useLogDealChanges, diffDealFields, TRACKED_DEAL_FIELDS } from '@/hooks/useDealFieldChanges';
import { DealPriorityStars } from '@/components/owner/sales/DealPriorityStars';
import { DealTagsInput } from '@/components/owner/sales/DealTagsInput';
import { cn } from '@/lib/utils';
import { Crown, Pencil } from 'lucide-react';
import { ResponsiveModal } from '@/components/ui/responsive-modal';

import { toast } from 'sonner';
interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deal: AgentDeal;
}

export function EditDealSheet({ open, onOpenChange, deal }: Props) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
const updateDeal = useUpdateDeal();
  const logChanges = useLogDealChanges();
  const { data: catalogProjects = [] } = usePropertyProjects();

  const [form, setForm] = useState({
    client_name: '',
    client_phone: '',
    client_email: '',
    client_source: 'website',
    deal_type: 'sale' as string,
    notes: '',
    budget_min: '',
    budget_max: '',
    currency: 'THB',
    bedrooms_min: '',
    preferred_types: [] as string[],
    preferred_districts: [] as string[],
    next_action: '',
    next_action_date: '',
    priority: 0,
    tags: [] as string[],
    is_vip: false,
    property_project_id: '' as string,
  });
  const [errors, setErrors] = useState<{
    client_name?: string;
    client_email?: string;
    budget?: string;
  }>({});

  useEffect(() => {
    if (deal && open) {
      setForm({
        client_name: deal.client_name || '',
        client_phone: deal.client_phone || '',
        client_email: deal.client_email || '',
        client_source: deal.client_source || 'website',
        deal_type: deal.deal_type || 'sale',
        notes: deal.notes || '',
        budget_min: deal.budget_min?.toString() || '',
        budget_max: deal.budget_max?.toString() || '',
        currency: deal.currency || 'THB',
        bedrooms_min: deal.bedrooms_min?.toString() || '',
        preferred_types: deal.preferred_types || [],
        preferred_districts: deal.preferred_districts || [],
        next_action: deal.next_action || '',
        next_action_date: deal.next_action_date ? deal.next_action_date.slice(0, 10) : '',
        priority: (deal as any).priority || 0,
        tags: (deal as any).tags || [],
        is_vip: (deal as any).is_vip || false,
        property_project_id: deal.property_project_id || '',
      });
    }
  }, [deal, open]);

  const toggleType = (t: string) => {
    setForm(f => ({
      ...f,
      preferred_types: f.preferred_types.includes(t) ? f.preferred_types.filter(x => x !== t) : [...f.preferred_types, t],
    }));
  };

  const toggleDistrict = (d: string) => {
    setForm(f => ({
      ...f,
      preferred_districts: f.preferred_districts.includes(d) ? f.preferred_districts.filter(x => x !== d) : [...f.preferred_districts, d],
    }));
  };

  const validateForm = () => {
    const nextErrors: { client_name?: string; client_email?: string; budget?: string } = {};
    if (!form.client_name.trim()) {
      nextErrors.client_name = isRu ? 'Введите имя клиента' : 'Enter client name';
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
      toast.error(isRu ? 'Проверьте обязательные поля' : 'Please fix required fields');
      return;
    }
    try {
      const updates: Record<string, any> = {
        client_name: form.client_name.trim(),
        client_phone: form.client_phone || null,
        client_email: form.client_email || null,
        client_source: form.client_source,
        deal_type: form.deal_type,
        notes: form.notes || null,
        budget_min: form.budget_min ? Number(form.budget_min) : null,
        budget_max: form.budget_max ? Number(form.budget_max) : null,
        currency: form.currency,
        bedrooms_min: form.bedrooms_min ? Number(form.bedrooms_min) : null,
        preferred_types: form.preferred_types.length ? form.preferred_types : null,
        preferred_districts: form.preferred_districts.length ? form.preferred_districts : null,
        next_action: form.next_action || null,
        next_action_date: form.next_action_date || null,
        priority: form.priority,
        tags: form.tags,
        is_vip: form.is_vip,
        property_project_id: form.property_project_id || null,
      };

      const changes = diffDealFields(deal as any, updates, TRACKED_DEAL_FIELDS);
      if (changes.length > 0) {
        await logChanges.mutateAsync({ dealId: deal.id, changes });
      }

      await updateDeal.mutateAsync({ id: deal.id, ...updates });
      toast(isRu ? 'Сделка обновлена' : 'Deal updated');
      onOpenChange(false);
    } catch (updateError: any) {
      toast.error(isRu ? 'Ошибка сохранения сделки' : 'Failed to save deal', {
        description: updateError?.message || String(updateError),
      });
    }
  };

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={onOpenChange}
      title={isRu ? 'Редактировать сделку' : 'Edit Deal'}
      icon={<Pencil className="w-5 h-5 text-primary" />}
      size="2xl"
      mobileHeight="max-h-[92vh]"
      footer={
        <Button onClick={handleSubmit} disabled={updateDeal.isPending} className="w-full sm:w-auto min-w-[200px]">
          {updateDeal.isPending ? '...' : (isRu ? 'Сохранить' : 'Save')}
        </Button>
      }
    >
      <div className="overflow-y-auto max-h-[calc(100vh-120px)] overscroll-contain space-y-4 pr-1">
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
              {isRu ? DEAL_TYPE_LABELS[dt as DealType].ru : DEAL_TYPE_LABELS[dt as DealType].en}
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label>{isRu ? 'Проект (offplan)' : 'Project (offplan)'}</Label>
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
      <div className="flex items-center justify-between rounded-none border border-warning/30 bg-warning/5 px-3 py-2">
        <div className="flex items-center gap-2">
          <Crown className="h-4 w-4 text-warning" />
          <Label htmlFor="deal-edit-vip" className="cursor-pointer">
            {isRu ? 'VIP клиент (сделка)' : 'VIP client (deal)'}
          </Label>
        </div>
        <Checkbox
          id="deal-edit-vip"
          checked={form.is_vip}
          onCheckedChange={(checked) => setForm(f => ({ ...f, is_vip: Boolean(checked) }))}
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <Label>{isRu ? 'Источник' : 'Source'}</Label>
          <Select value={form.client_source} onValueChange={v => setForm(f => ({ ...f, client_source: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {CLIENT_SOURCES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
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
          <Input type="number" value={form.bedrooms_min} onChange={e => setForm(f => ({ ...f, bedrooms_min: e.target.value }))} />
        </div>
      </div>
      {errors.budget && <p className="text-xs text-destructive -mt-1">{errors.budget}</p>}

      {/* Property Types */}
      <div>
        <Label className="mb-1.5 block">{isRu ? 'Типы недвижимости' : 'Property Types'}</Label>
        <div className="flex flex-wrap gap-1.5">
          {PROPERTY_TYPES.map(t => (
            <button key={t} onClick={() => toggleType(t)} className={cn(
              'px-2.5 py-1 rounded-full text-xs border transition-colors',
              form.preferred_types.includes(t) ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border text-muted-foreground hover:border-primary/50',
            )}>{t}</button>
          ))}
        </div>
      </div>

      {/* Districts */}
      <div>
        <Label className="mb-1.5 block">{isRu ? 'Районы' : 'Districts'}</Label>
        <div className="flex flex-wrap gap-1.5">
          {PHUKET_DISTRICTS.map(d => (
            <button key={d} onClick={() => toggleDistrict(d)} className={cn(
              'px-2.5 py-1 rounded-full text-xs border transition-colors',
              form.preferred_districts.includes(d) ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border text-muted-foreground hover:border-primary/50',
            )}>{d}</button>
          ))}
        </div>
      </div>

      <div>
        <Label>{isRu ? 'Следующий шаг' : 'Next Action'}</Label>
        <Input value={form.next_action} onChange={e => setForm(f => ({ ...f, next_action: e.target.value }))} placeholder={isRu ? 'Напр.: Позвонить...' : 'e.g.: Call...'} />
      </div>
      <div>
        <Label>{isRu ? 'Дата следующего шага' : 'Next Action Date'}</Label>
        <Input type="date" value={form.next_action_date} onChange={e => setForm(f => ({ ...f, next_action_date: e.target.value }))} />
      </div>
      <div>
        <Label>{isRu ? 'Заметки' : 'Notes'}</Label>
        <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={3} />
      </div>
      {/* Priority */}
      <div>
        <Label className="mb-1.5 block">{isRu ? 'Приоритет' : 'Priority'}</Label>
        <DealPriorityStars priority={form.priority} onChange={p => setForm(f => ({ ...f, priority: p }))} size="md" />
      </div>
      {/* Tags */}
      <div>
        <Label className="mb-1.5 block">{isRu ? 'Теги' : 'Tags'}</Label>
        <DealTagsInput tags={form.tags} onChange={tags => setForm(f => ({ ...f, tags }))} />
      </div>
      </div>
    </ResponsiveModal>
  );
}
