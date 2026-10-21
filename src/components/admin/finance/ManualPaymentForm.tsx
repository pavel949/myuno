import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const VERTICALS = [
  'property',
  'property_sale',
  'yacht',
  'tour',
  'transport',
  'restaurant',
  'flower',
  'spa',
  'cleaning',
  'event',
  'legal',
] as const;

const PAYMENT_METHODS = ['cash', 'bank_transfer', 'promptpay'] as const;

export function ManualPaymentForm() {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const [vertical, setVertical] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [commissionRate, setCommissionRate] = useState('10');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');

  const resetForm = () => {
    setVertical('');
    setAmount('');
    setPaymentMethod('cash');
    setCommissionRate('10');
    setReference('');
    setNotes('');
  };

  const mutation = useMutation({
    mutationFn: async () => {
      const totalAmount = parseFloat(amount);
      if (!totalAmount || totalAmount <= 0) throw new Error('Invalid amount');
      if (!vertical) throw new Error('Select a vertical');

      const rate = parseFloat(commissionRate) || 0;
      const platformFee = Math.round(totalAmount * (rate / 100));
      const vendorPayout = totalAmount - platformFee;

      const { error } = await supabase.from('orders').insert({
        order_type: vertical === 'property' || vertical === 'property_sale' ? 'property' : 'service',
        total_amount: totalAmount,
        currency: 'THB',
        status: 'confirmed' as any,
        paid_at: new Date().toISOString(),
        vertical,
        platform_fee_amount: platformFee,
        vendor_payout_amount: vendorPayout,
        commission_rate_applied: rate,
        notes: [
          paymentMethod === 'cash' ? 'Cash payment' : paymentMethod === 'bank_transfer' ? 'Bank transfer' : 'PromptPay',
          reference ? `Ref: ${reference}` : '',
          notes,
        ].filter(Boolean).join(' | '),
        metadata: { manual_entry: true, payment_method: paymentMethod, reference } as any,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(t('admin.finance.toast.recorded'));
      queryClient.invalidateQueries({ queryKey: ['admin-finance-summary'] });
      queryClient.invalidateQueries({ queryKey: ['admin-finance-by-vertical'] });
      queryClient.invalidateQueries({ queryKey: ['ledger-reconciliation'] });
      resetForm();
      setOpen(false);
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button size="sm" className="gap-1.5">
          <Plus className="h-4 w-4" />
          {t('admin.finance.recordPayment')}
        </Button>
      </SheetTrigger>
      <SheetContent className="sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{t('admin.finance.recordPaymentTitle')}</SheetTitle>
        </SheetHeader>

        <div className="space-y-4 mt-6">
          <div className="space-y-2">
            <Label>{t('admin.finance.form.vertical')}</Label>
            <Select value={vertical} onValueChange={setVertical}>
              <SelectTrigger>
                <SelectValue placeholder={t('admin.finance.form.verticalPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {VERTICALS.map(v => (
                  <SelectItem key={v} value={v}>
                    {t(`admin.finance.vertical.${v}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{t('admin.finance.form.amount')}</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="0.00"
            />
          </div>

          <div className="space-y-2">
            <Label>{t('admin.finance.form.paymentMethod')}</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_METHODS.map(m => (
                  <SelectItem key={m} value={m}>
                    {t(`admin.finance.method.${m}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>{t('admin.finance.form.commission')}</Label>
            <Input
              type="number"
              min="0"
              max="100"
              step="0.5"
              value={commissionRate}
              onChange={e => setCommissionRate(e.target.value)}
            />
            {amount && (
              <p className="text-xs text-muted-foreground">
                {t('admin.finance.form.fee')}: ฿{Math.round(parseFloat(amount || '0') * (parseFloat(commissionRate || '0') / 100)).toLocaleString()}
                {' → '}
                {t('admin.finance.form.vendor')}: ฿{Math.round(parseFloat(amount || '0') * (1 - parseFloat(commissionRate || '0') / 100)).toLocaleString()}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>{t('admin.finance.form.reference')}</Label>
            <Input
              value={reference}
              onChange={e => setReference(e.target.value)}
              placeholder={t('admin.finance.form.referencePlaceholder')}
            />
          </div>

          <div className="space-y-2">
            <Label>{t('admin.finance.form.notes')}</Label>
            <Textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder={t('admin.finance.form.notesPlaceholder')}
              rows={3}
            />
          </div>

          <Button
            onClick={() => mutation.mutate()}
            disabled={!vertical || !amount || mutation.isPending}
            className="w-full"
          >
            {mutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {t('admin.finance.form.save')}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
