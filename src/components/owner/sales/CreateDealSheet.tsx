import { useState } from 'react';
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
import { useCreateDeal, useDuplicateCheck, CLIENT_SOURCES, PHUKET_DISTRICTS, PROPERTY_TYPES, CURRENCIES } from '@/hooks/useAgentDeals';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string;
}

export function CreateDealSheet({ open, onOpenChange, companyId }: Props) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const createDeal = useCreateDeal();

  const [form, setForm] = useState({
    client_name: '',
    client_phone: '',
    client_email: '',
    client_source: 'website',
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
    if (!form.client_name.trim()) {
      toast({ title: isRu ? 'Введите имя клиента' : 'Enter client name', variant: 'destructive' });
      return;
    }
    try {
      await createDeal.mutateAsync({
        company_id: companyId,
        agent_id: user!.id,
        property_id: null,
        client_name: form.client_name.trim(),
        client_phone: form.client_phone || null,
        client_email: form.client_email || null,
        client_source: form.client_source,
        stage: 'new',
        budget_min: form.budget_min ? Number(form.budget_min) : null,
        budget_max: form.budget_max ? Number(form.budget_max) : null,
        currency: form.currency,
        preferred_districts: form.preferred_districts.length ? form.preferred_districts : null,
        preferred_types: form.preferred_types.length ? form.preferred_types : null,
        bedrooms_min: form.bedrooms_min ? Number(form.bedrooms_min) : null,
        notes: form.notes || null,
        next_action: null,
        next_action_date: null,
        deal_value: null,
        commission_percent: null,
        commission_amount: null,
        closed_at: null,
        lost_reason: null,
      });
      toast({ title: isRu ? 'Сделка создана' : 'Deal created' });
      onOpenChange(false);
      setForm({ client_name: '', client_phone: '', client_email: '', client_source: 'website', notes: '', budget_min: '', budget_max: '', currency: 'THB', bedrooms_min: '', preferred_types: [], preferred_districts: [] });
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
            <div className="p-3 rounded-lg border border-amber-500/50 bg-amber-500/10 text-sm">
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-medium mb-1">
                <AlertCircle className="h-4 w-4" />
                {isRu ? 'Возможный дубликат!' : 'Possible duplicate!'}
              </div>
              {duplicates.map(d => (
                <button
                  key={d.id}
                  onClick={() => { onOpenChange(false); navigate(`/owner/sales/${d.id}`); }}
                  className="block text-xs text-primary hover:underline"
                >
                  {d.client_name} — {d.client_phone || d.client_email} ({isRu ? DEAL_STAGE_LABELS_LOOKUP[d.stage] : d.stage})
                </button>
              ))}
            </div>
          )}

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
const DEAL_STAGE_LABELS_LOOKUP: Record<string, string> = {
  new: 'Новый', contacted: 'Контакт', showing: 'Показ', negotiation: 'Торг',
  contract: 'Договор', closed_won: 'Успех', closed_lost: 'Проигрыш',
};
