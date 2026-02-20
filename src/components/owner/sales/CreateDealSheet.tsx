import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useCreateDeal, CLIENT_SOURCES } from '@/hooks/useAgentDeals';
import { useToast } from '@/hooks/use-toast';

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
  const createDeal = useCreateDeal();

  const [form, setForm] = useState({
    client_name: '',
    client_phone: '',
    client_email: '',
    client_source: 'website',
    notes: '',
    budget_min: '',
    budget_max: '',
  });

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
        currency: 'THB',
        preferred_districts: null,
        preferred_types: null,
        bedrooms_min: null,
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
      setForm({ client_name: '', client_phone: '', client_email: '', client_source: 'website', notes: '', budget_min: '', budget_max: '' });
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
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>{isRu ? 'Бюджет от' : 'Budget Min'}</Label>
              <Input type="number" value={form.budget_min} onChange={e => setForm(f => ({ ...f, budget_min: e.target.value }))} />
            </div>
            <div>
              <Label>{isRu ? 'Бюджет до' : 'Budget Max'}</Label>
              <Input type="number" value={form.budget_max} onChange={e => setForm(f => ({ ...f, budget_max: e.target.value }))} />
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
