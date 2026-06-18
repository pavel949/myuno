import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, ShieldCheck } from 'lucide-react';

export type ClaimablePoi = {
  name: string;
  category?: string | null;
  lat?: number | null;
  lng?: number | null;
  osm_type?: string | null;
  osm_id?: number | null;
  google_place_id?: string | null;
};

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  poi: ClaimablePoi | null;
}

const VERTICALS = [
  { v: 'restaurant', en: 'Restaurant / café', ru: 'Ресторан / кафе' },
  { v: 'hotel', en: 'Hotel / villa / condo', ru: 'Отель / вилла / кондо' },
  { v: 'spa', en: 'Spa / massage / beauty', ru: 'Спа / массаж / красота' },
  { v: 'fitness', en: 'Gym / fitness', ru: 'Зал / фитнес' },
  { v: 'marina', en: 'Marina / yacht', ru: 'Марина / яхты' },
  { v: 'venue', en: 'Event venue', ru: 'Площадка для событий' },
  { v: 'shop', en: 'Shop / retail', ru: 'Магазин' },
  { v: 'clinic', en: 'Clinic / medical', ru: 'Клиника / медицина' },
  { v: 'other', en: 'Other', ru: 'Другое' },
];

export function PoiClaimSheet({ open, onOpenChange, poi }: Props) {
  const { language } = useLanguage();
  const { user } = useAuth();
  const t = (en: string, ru: string) => (language === 'ru' ? ru : en);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    owner_name: '',
    owner_email: user?.email ?? '',
    owner_phone: '',
    business_name: poi?.name ?? '',
    business_website: '',
    target_vertical: 'other',
    message: '',
  });

  if (!poi) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.owner_name.trim() || !form.owner_email.trim()) {
      toast.error(t('Name and email are required', 'Имя и email обязательны'));
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from('poi_claim_requests').insert({
      osm_type: poi.osm_type ?? null,
      osm_id: poi.osm_id ?? null,
      google_place_id: poi.google_place_id ?? null,
      poi_name: poi.name,
      poi_category: poi.category ?? null,
      lat: poi.lat ?? null,
      lng: poi.lng ?? null,
      owner_user_id: user?.id ?? null,
      owner_name: form.owner_name.trim(),
      owner_email: form.owner_email.trim(),
      owner_phone: form.owner_phone.trim() || null,
      business_name: form.business_name.trim() || null,
      business_website: form.business_website.trim() || null,
      target_vertical: form.target_vertical,
      message: form.message.trim() || null,
    });
    setSubmitting(false);
    if (error) {
      console.error('[poi-claim]', error);
      toast.error(t('Could not submit. Please try again.', 'Не удалось отправить. Попробуйте ещё раз.'));
      return;
    }
    toast.success(t('Claim submitted. We will contact you soon.', 'Заявка отправлена. Мы свяжемся с вами.'));
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[92dvh] overflow-y-auto">
        <SheetHeader className="text-left">
          <SheetTitle className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" />
            {t('Claim this place', 'Заявить это место')}
          </SheetTitle>
          <SheetDescription>
            {t(
              'Free verified listing on myUNO. Get leads, bookings and WhatsApp inquiries from users near you.',
              'Бесплатный верифицированный листинг на myUNO. Получайте лиды, брони и WhatsApp-обращения от пользователей рядом.',
            )}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div className="rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
            <div className="font-medium text-foreground">{poi.name}</div>
            {poi.category && <div className="capitalize">{poi.category}</div>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="owner_name">{t('Your name', 'Ваше имя')} *</Label>
              <Input id="owner_name" required value={form.owner_name} onChange={(e) => setForm({ ...form, owner_name: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="owner_phone">{t('Phone / WhatsApp', 'Телефон / WhatsApp')}</Label>
              <Input id="owner_phone" type="tel" value={form.owner_phone} onChange={(e) => setForm({ ...form, owner_phone: e.target.value })} />
            </div>
          </div>

          <div>
            <Label htmlFor="owner_email">{t('Email', 'Email')} *</Label>
            <Input id="owner_email" type="email" required value={form.owner_email} onChange={(e) => setForm({ ...form, owner_email: e.target.value })} />
          </div>

          <div>
            <Label htmlFor="business_name">{t('Business name (if different)', 'Название бизнеса (если отличается)')}</Label>
            <Input id="business_name" value={form.business_name} onChange={(e) => setForm({ ...form, business_name: e.target.value })} />
          </div>

          <div>
            <Label htmlFor="business_website">{t('Website / social', 'Сайт / соцсеть')}</Label>
            <Input id="business_website" type="url" placeholder="https://" value={form.business_website} onChange={(e) => setForm({ ...form, business_website: e.target.value })} />
          </div>

          <div>
            <Label htmlFor="target_vertical">{t('Category', 'Категория')}</Label>
            <select
              id="target_vertical"
              value={form.target_vertical}
              onChange={(e) => setForm({ ...form, target_vertical: e.target.value })}
              className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              {VERTICALS.map((opt) => (
                <option key={opt.v} value={opt.v}>{language === 'ru' ? opt.ru : opt.en}</option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="message">{t('Anything else?', 'Дополнительно')}</Label>
            <Textarea id="message" rows={3} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
          </div>

          <Button type="submit" disabled={submitting} className="w-full">
            {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {t('Send claim', 'Отправить заявку')}
          </Button>
          <p className="text-[11px] text-muted-foreground text-center">
            {t('Our team will verify ownership within 24 hours.', 'Команда подтвердит право собственности в течение 24 часов.')}
          </p>
        </form>
      </SheetContent>
    </Sheet>
  );
}
