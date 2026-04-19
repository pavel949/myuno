/**
 * HotelManagementLeadSheet — capture HMA inquiry from hotel owners
 * looking to hand over operations to a brand / management company.
 *
 * Writes to `crm_contacts` with source='hotel_hma_inquiry'.
 */
import { useState } from 'react';
import { Handshake, Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function HotelManagementLeadSheet({ open, onOpenChange }: Props) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const isRu = language === 'ru';

  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: user?.email ?? '',
    phone: '',
    keys: '',
    location: '',
    notes: '',
  });

  const update = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [k]: e.target.value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email) {
      toast.error(isRu ? 'Заполните имя и email' : 'Please fill in name and email');
      return;
    }
    setSubmitting(true);
    try {
      const nameParts = form.name.trim().split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ') || null;

      const { error } = await supabase.from('crm_contacts').insert({
        first_name: firstName,
        last_name: lastName,
        email: form.email,
        phone: form.phone || null,
        contact_type: 'lead',
        source: 'hotel_hma_inquiry',
        owner_id: user?.id ?? null,
        notes: [
          form.keys ? `Keys: ${form.keys}` : null,
          form.location ? `Location: ${form.location}` : null,
          form.notes || null,
        ]
          .filter(Boolean)
          .join('\n'),
        tags: ['hotel', 'hma'],
      } as never);

      if (error) throw error;

      // Fire-and-forget Telegram alert via existing edge function (if available)
      try {
        await supabase.functions.invoke('telegram-notify', {
          body: {
            type: 'hotel_hma_inquiry',
            text:
              `🏨 New HMA inquiry\n` +
              `Owner: ${form.name}\n` +
              `Email: ${form.email}\n` +
              (form.phone ? `Phone: ${form.phone}\n` : '') +
              (form.keys ? `Keys: ${form.keys}\n` : '') +
              (form.location ? `Location: ${form.location}\n` : '') +
              (form.notes ? `Notes: ${form.notes}` : ''),
          },
        });
      } catch {
        /* non-blocking */
      }

      toast.success(
        isRu
          ? 'Заявка отправлена. Мы свяжемся в течение 24 часов.'
          : 'Request submitted. We will contact you within 24 hours.',
      );
      onOpenChange(false);
      setForm({ name: '', email: user?.email ?? '', phone: '', keys: '', location: '', notes: '' });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Submission failed';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[90vh] overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-violet-500/15 text-violet-600 dark:text-violet-400 flex items-center justify-center">
              <Handshake className="h-4 w-4" />
            </div>
            <SheetTitle>
              {isRu ? 'Передать отель в управление' : 'Hand over hotel to operator'}
            </SheetTitle>
          </div>
          <SheetDescription>
            {isRu
              ? 'Подберём бренд или независимую управляющую компанию под ваш объект.'
              : 'We will match a brand or independent operator for your asset.'}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-3 py-4">
          <div className="space-y-1.5">
            <Label className="text-xs">{isRu ? 'Ваше имя' : 'Your name'} *</Label>
            <Input value={form.name} onChange={update('name')} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Email *</Label>
              <Input type="email" value={form.email} onChange={update('email')} required />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{isRu ? 'Телефон / WhatsApp' : 'Phone / WhatsApp'}</Label>
              <Input value={form.phone} onChange={update('phone')} placeholder="+66..." />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">{isRu ? 'Кол-во ключей' : 'Number of keys'}</Label>
              <Input type="number" min={0} value={form.keys} onChange={update('keys')} placeholder="80" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{isRu ? 'Локация' : 'Location'}</Label>
              <Input value={form.location} onChange={update('location')} placeholder="Patong, Phuket" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{isRu ? 'Состояние объекта, цель' : 'Asset state and goal'}</Label>
            <Textarea
              rows={4}
              value={form.notes}
              onChange={update('notes')}
              placeholder={
                isRu
                  ? 'Текущая загрузка, наличие лицензии, предпочтения по бренду / стилю управления...'
                  : 'Current occupancy, license status, brand preferences...'
              }
            />
          </div>

          <SheetFooter>
            <Button type="submit" disabled={submitting} className="w-full">
              {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {isRu ? 'Отправить заявку' : 'Submit request'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
