import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { INVESTOR_TYPES, type InvestorType } from '@/lib/investment/dealTaxonomy';
import { useSubmitInquiry } from '@/hooks/investment-hub/useInvestmentDeals';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  dealId: string;
  dealTitle?: string;
}

export function InvestorInterestModal({ open, onOpenChange, dealId, dealTitle }: Props) {
  const [form, setForm] = useState({
    investor_name: '',
    investor_email: '',
    investor_whatsapp: '',
    investor_type: 'individual' as InvestorType,
    investment_capacity_usd: '',
    message: '',
  });
  const submit = useSubmitInquiry();

  const set = <K extends keyof typeof form>(k: K, v: typeof form[K]) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    if (!form.investor_name || !form.investor_email) {
      toast.error('Укажите имя и email');
      return;
    }
    try {
      await submit.mutateAsync({
        deal_id: dealId,
        investor_name: form.investor_name,
        investor_email: form.investor_email,
        investor_whatsapp: form.investor_whatsapp || undefined,
        investor_type: form.investor_type,
        investment_capacity_usd: form.investment_capacity_usd ? Number(form.investment_capacity_usd) : undefined,
        message: form.message || undefined,
      });
      toast.success('Заявка отправлена. Мы свяжемся с вами в течение 24ч.');
      onOpenChange(false);
      setForm({ investor_name: '', investor_email: '', investor_whatsapp: '', investor_type: 'individual', investment_capacity_usd: '', message: '' });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Ошибка: ${msg}`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Express interest</DialogTitle>
          <DialogDescription>
            {dealTitle ? `Заявка на: ${dealTitle}` : 'Все коммуникации проходят через myUNO. Подробности раскрываются после квалификации.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div>
            <Label htmlFor="iim-name">Имя *</Label>
            <Input id="iim-name" value={form.investor_name} onChange={(e) => set('investor_name', e.target.value)} />
          </div>
          <div>
            <Label htmlFor="iim-email">Email *</Label>
            <Input id="iim-email" type="email" value={form.investor_email} onChange={(e) => set('investor_email', e.target.value)} />
          </div>
          <div>
            <Label htmlFor="iim-whatsapp">WhatsApp</Label>
            <Input id="iim-whatsapp" value={form.investor_whatsapp} onChange={(e) => set('investor_whatsapp', e.target.value)} placeholder="+66..." />
          </div>
          <div>
            <Label id="iim-type-label">I am a...</Label>
            <Select value={form.investor_type} onValueChange={(v) => set('investor_type', v as InvestorType)}>
              <SelectTrigger aria-labelledby="iim-type-label"><SelectValue /></SelectTrigger>
              <SelectContent>
                {INVESTOR_TYPES.map((t) => <SelectItem key={t.key} value={t.key}>{t.labelEn}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="iim-capacity">Approximate capacity (USD)</Label>
            <Input id="iim-capacity" type="number" value={form.investment_capacity_usd} onChange={(e) => set('investment_capacity_usd', e.target.value)} placeholder="500000" />
          </div>
          <div>
            <Label htmlFor="iim-message">Message (optional)</Label>
            <Textarea id="iim-message" value={form.message} onChange={(e) => set('message', e.target.value)} rows={3} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={submit.isPending} className="bg-success hover:bg-success">
            {submit.isPending && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
            Send request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
