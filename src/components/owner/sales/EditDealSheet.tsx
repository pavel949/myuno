import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/contexts/LanguageContext';
import { useUpdateDeal, CLIENT_SOURCES, AgentDeal } from '@/hooks/useAgentDeals';
import { useToast } from '@/hooks/use-toast';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deal: AgentDeal;
}

export function EditDealSheet({ open, onOpenChange, deal }: Props) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { toast } = useToast();
  const updateDeal = useUpdateDeal();

  const [form, setForm] = useState({
    client_name: '',
    client_phone: '',
    client_email: '',
    client_source: 'website',
    notes: '',
    budget_min: '',
    budget_max: '',
    next_action: '',
    next_action_date: '',
  });

  useEffect(() => {
    if (deal && open) {
      setForm({
        client_name: deal.client_name || '',
        client_phone: deal.client_phone || '',
        client_email: deal.client_email || '',
        client_source: deal.client_source || 'website',
        notes: deal.notes || '',
        budget_min: deal.budget_min?.toString() || '',
        budget_max: deal.budget_max?.toString() || '',
        next_action: deal.next_action || '',
        next_action_date: deal.next_action_date ? deal.next_action_date.slice(0, 10) : '',
      });
    }
  }, [deal, open]);

  const handleSubmit = async () => {
    if (!form.client_name.trim()) {
      toast({ title: isRu ? 'Введите имя клиента' : 'Enter client name', variant: 'destructive' });
      return;
    }
    try {
      await updateDeal.mutateAsync({
        id: deal.id,
        client_name: form.client_name.trim(),
        client_phone: form.client_phone || null,
        client_email: form.client_email || null,
        client_source: form.client_source,
        notes: form.notes || null,
        budget_min: form.budget_min ? Number(form.budget_min) : null,
        budget_max: form.budget_max ? Number(form.budget_max) : null,
        next_action: form.next_action || null,
        next_action_date: form.next_action_date || null,
      });
      toast({ title: isRu ? 'Сделка обновлена' : 'Deal updated' });
      onOpenChange(false);
    } catch {
      toast({ title: isRu ? 'Ошибка' : 'Error', variant: 'destructive' });
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>{isRu ? 'Редактировать сделку' : 'Edit Deal'}</SheetTitle>
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
            <Label>{isRu ? 'Следующий шаг' : 'Next Action'}</Label>
            <Input value={form.next_action} onChange={e => setForm(f => ({ ...f, next_action: e.target.value }))} placeholder={isRu ? 'Напр.: Позвонить, Показ...' : 'e.g.: Call, Showing...'} />
          </div>
          <div>
            <Label>{isRu ? 'Дата следующего шага' : 'Next Action Date'}</Label>
            <Input type="date" value={form.next_action_date} onChange={e => setForm(f => ({ ...f, next_action_date: e.target.value }))} />
          </div>
          <div>
            <Label>{isRu ? 'Заметки' : 'Notes'}</Label>
            <Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={3} />
          </div>
          <Button onClick={handleSubmit} disabled={updateDeal.isPending} className="w-full">
            {updateDeal.isPending ? '...' : (isRu ? 'Сохранить' : 'Save')}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
