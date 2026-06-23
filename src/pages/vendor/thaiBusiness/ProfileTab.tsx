/**
 * ProfileTab — owner creates/edits their Thai business profile.
 * On save: TH→RU auto-translation + unique slug (handled in useSaveThaiBusiness),
 * status reset to pending moderation for new businesses.
 */
import { useState } from 'react';
import { toast } from 'sonner';
import { Loader2, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { ImageUpload } from '@/components/upload/ImageUpload';
import { ProjectLocationPicker } from '@/components/property/ProjectLocationPicker';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSaveThaiBusiness } from '@/hooks/thaiServices/useThaiServices';
import {
  THAI_CATEGORIES, THAI_DISTRICTS, THAI_PAYMENT_METHODS, THAI_OWNERSHIP_LABELS,
  type ThaiBusiness, type ThaiCategory, type ThaiDistrict, type ThaiOwnershipType, type ThaiPaymentMethod,
} from '@/types/thaiBusiness';

export function ProfileTab({ business }: { business: ThaiBusiness | null }) {
  const { t, language } = useLanguage();
  const save = useSaveThaiBusiness();

  const [form, setForm] = useState({
    name_th: business?.name_th ?? '',
    name_en: business?.name_en ?? '',
    category: (business?.category ?? 'other_services') as ThaiCategory,
    description_th: business?.description_th ?? '',
    address: business?.address ?? '',
    district: (business?.district ?? 'Other') as ThaiDistrict,
    lat: business?.lat ?? null as number | null,
    lng: business?.lng ?? null as number | null,
    phone: business?.phone ?? '',
    line_id: business?.line_id ?? '',
    ownership_type: (business?.ownership_type ?? 'thai_owned') as ThaiOwnershipType,
    payment_methods: business?.payment_methods ?? ([] as ThaiPaymentMethod[]),
    logo_url: business?.logo_url ?? '',
    gallery_urls: business?.gallery_urls ?? ([] as string[]),
  });

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));

  const togglePayment = (m: ThaiPaymentMethod) =>
    set('payment_methods', form.payment_methods.includes(m)
      ? form.payment_methods.filter((x) => x !== m)
      : [...form.payment_methods, m]);

  const onSave = async () => {
    if (!form.name_th.trim()) { toast.error('Название (тайский) обязательно'); return; }
    try {
      await save.mutateAsync({ id: business?.id, ...form });
      toast.success(t('thai.owner.saved'));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error');
    }
  };

  return (
    <div className="space-y-5 max-w-2xl">
      {business && !business.is_active && (
        <div className="bg-accent/10 text-accent text-sm px-3 py-2">{t('thai.owner.pendingModeration')}</div>
      )}

      <div className="grid sm:grid-cols-2 gap-3">
        <Field label="Название (тайский) *"><Input value={form.name_th} onChange={(e) => set('name_th', e.target.value)} /></Field>
        <Field label="Название (англ.)"><Input value={form.name_en} onChange={(e) => set('name_en', e.target.value)} /></Field>
      </div>

      <Field label="Категория">
        <Select value={form.category} onValueChange={(v) => set('category', v as ThaiCategory)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {THAI_CATEGORIES.map((c) => <SelectItem key={c.id} value={c.id}>{language === 'ru' ? c.ru : c.en}</SelectItem>)}
          </SelectContent>
        </Select>
      </Field>

      <Field label="Описание (тайский)">
        <Textarea rows={4} value={form.description_th} onChange={(e) => set('description_th', e.target.value)} />
      </Field>

      <Field label={t('thai.detail.location')}>
        <ProjectLocationPicker
          value={form.lat != null && form.lng != null ? { lat: form.lat, lng: form.lng, address: form.address } : undefined}
          onChange={(loc) => setForm((f) => ({ ...f, lat: loc.lat, lng: loc.lng, address: loc.address || f.address }))}
        />
      </Field>

      <div className="grid sm:grid-cols-2 gap-3">
        <Field label="Адрес"><Input value={form.address} onChange={(e) => set('address', e.target.value)} /></Field>
        <Field label="Район">
          <Select value={form.district} onValueChange={(v) => set('district', v as ThaiDistrict)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{THAI_DISTRICTS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
          </Select>
        </Field>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <Field label="Телефон"><Input value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+66…" /></Field>
        <Field label="Line ID"><Input value={form.line_id} onChange={(e) => set('line_id', e.target.value)} /></Field>
      </div>

      <Field label="Тип владения">
        <Select value={form.ownership_type} onValueChange={(v) => set('ownership_type', v as ThaiOwnershipType)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {(Object.keys(THAI_OWNERSHIP_LABELS) as ThaiOwnershipType[]).map((k) => (
              <SelectItem key={k} value={k}>{language === 'ru' ? THAI_OWNERSHIP_LABELS[k].ru : THAI_OWNERSHIP_LABELS[k].en}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Field label="Способы оплаты">
        <div className="flex flex-wrap gap-2">
          {THAI_PAYMENT_METHODS.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => togglePayment(m.id)}
              className={`text-sm rounded-full border px-3 py-1.5 ${form.payment_methods.includes(m.id) ? 'border-primary bg-primary/10 text-primary' : 'border-border text-foreground'}`}
            >
              {language === 'ru' ? m.ru : m.en}
            </button>
          ))}
        </div>
      </Field>

      <Field label="Логотип">
        <ImageUpload value={form.logo_url} onChange={(url) => set('logo_url', url)} folder="thai-business" />
      </Field>

      <Field label="Фотографии">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {form.gallery_urls.map((url, i) => (
            <div key={i} className="relative">
              <ImageUpload value={url} onChange={(u) => set('gallery_urls', form.gallery_urls.map((x, idx) => (idx === i ? u : x)))} folder="thai-business" />
              <button
                type="button"
                onClick={() => set('gallery_urls', form.gallery_urls.filter((_, idx) => idx !== i))}
                className="absolute top-1 right-1 bg-background/80 rounded-full p-1"
              ><X className="w-3 h-3" /></button>
            </div>
          ))}
          {form.gallery_urls.length < 8 && (
            <button
              type="button"
              onClick={() => set('gallery_urls', [...form.gallery_urls, ''])}
              className="border border-dashed border-border aspect-square flex items-center justify-center text-muted-foreground"
            ><Plus className="w-5 h-5" /></button>
          )}
        </div>
      </Field>

      <Button onClick={onSave} disabled={save.isPending}>
        {save.isPending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : null}{t('thai.owner.save')}
      </Button>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm">{label}</Label>
      {children}
    </div>
  );
}
