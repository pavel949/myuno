import { useLanguage } from '@/contexts/LanguageContext';
import type { FieldSpec, LocalizedText } from '@/lib/vertical-specs/types';
import { getPath, setPath } from '@/lib/vertical-specs/pathUtils';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UnifiedMediaUploader } from '@/components/upload/UnifiedMediaUploader';
import { GooglePlacesAutocomplete } from '@/components/shared/GooglePlacesAutocomplete';
import { WeeklyHoursEditor } from './WeeklyHoursEditor';

interface Props {
  field: FieldSpec;
  row: Record<string, unknown>;
  onChange: (next: Record<string, unknown>) => void;
}

const t = (l: LocalizedText, lang: 'en' | 'ru') => l[lang] ?? l.en;

/**
 * Universal renderer for VerticalSpec FieldSpec.
 * Covers core types; complex types (address, hours, media_*, license_upload)
 * currently render as simplified inputs — to be upgraded to dedicated widgets
 * (UnifiedMediaUploader, GooglePlacesAddressInput, WeeklyHoursEditor) in next pass.
 */
export const FieldRenderer = ({ field, row, onChange }: Props) => {
  const { language } = useLanguage();
  const lang = (language === 'ru' ? 'ru' : 'en') as 'en' | 'ru';
  const value = getPath(row, field.path);

  const set = (v: unknown) => onChange(setPath(row, field.path, v));

  const label = (
    <Label className="text-sm font-medium flex items-center gap-2">
      {t(field.label, lang)}
      {field.required && <span className="text-destructive">*</span>}
    </Label>
  );
  const hint = field.hint && (
    <p className="text-xs text-muted-foreground">{t(field.hint, lang)}</p>
  );

  switch (field.type) {
    case 'text':
    case 'url':
    case 'phone':
    case 'email':
      return (
        <div className="space-y-1.5">
          {label}
          <Input
            type={field.type === 'email' ? 'email' : field.type === 'url' ? 'url' : 'text'}
            value={(value as string) ?? ''}
            onChange={(e) => set(e.target.value)}
            placeholder={field.placeholder ? t(field.placeholder, lang) : undefined}
          />
          {hint}
        </div>
      );

    case 'textarea':
      return (
        <div className="space-y-1.5">
          {label}
          <Textarea value={(value as string) ?? ''} onChange={(e) => set(e.target.value)} rows={4} />
          {hint}
        </div>
      );

    case 'i18n_text':
    case 'i18n_textarea': {
      const v = (value as { en?: string; ru?: string }) ?? { en: '', ru: '' };
      const Input1 = field.type === 'i18n_textarea' ? Textarea : Input;
      return (
        <div className="space-y-2">
          {label}
          <div className="grid gap-2 md:grid-cols-2">
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">EN</span>
              <Input1 value={v.en ?? ''} onChange={(e) => set({ ...v, en: e.target.value })} />
            </div>
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">RU</span>
              <Input1 value={v.ru ?? ''} onChange={(e) => set({ ...v, ru: e.target.value })} />
            </div>
          </div>
          {hint}
        </div>
      );
    }

    case 'number':
    case 'currency_thb':
      return (
        <div className="space-y-1.5">
          {label}
          <div className="relative">
            <Input
              type="number"
              value={(value as number | string) ?? ''}
              min={field.min}
              max={field.max}
              step={field.step ?? 1}
              onChange={(e) => set(e.target.value === '' ? null : Number(e.target.value))}
            />
            {field.type === 'currency_thb' && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">฿</span>
            )}
          </div>
          {hint}
        </div>
      );

    case 'select':
      return (
        <div className="space-y-1.5">
          {label}
          <Select value={(value as string) ?? ''} onValueChange={(v) => set(v)}>
            <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
            <SelectContent>
              {field.options?.map((o) => (
                <SelectItem key={o.value} value={o.value}>{t(o.label, lang)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {hint}
        </div>
      );

    case 'multiselect':
    case 'tags': {
      const selected = Array.isArray(value) ? (value as string[]) : [];
      const toggle = (v: string) =>
        set(selected.includes(v) ? selected.filter((x) => x !== v) : [...selected, v]);
      return (
        <div className="space-y-1.5">
          {label}
          <div className="flex flex-wrap gap-2">
            {field.options?.map((o) => {
              const on = selected.includes(o.value);
              return (
                <Badge
                  key={o.value}
                  variant={on ? 'default' : 'outline'}
                  className="cursor-pointer select-none"
                  onClick={() => toggle(o.value)}
                >
                  {t(o.label, lang)}
                </Badge>
              );
            })}
          </div>
          {hint}
        </div>
      );
    }

    case 'boolean':
      return (
        <div className="flex items-center justify-between gap-3 rounded-md border border-border p-3">
          <div>
            {label}
            {hint}
          </div>
          <Switch checked={!!value} onCheckedChange={(v) => set(v)} />
        </div>
      );

    case 'date':
      return (
        <div className="space-y-1.5">
          {label}
          <Input type="date" value={(value as string) ?? ''} onChange={(e) => set(e.target.value)} />
          {hint}
        </div>
      );

    case 'address': {
      const addr = (value as { line?: string; lat?: number; lng?: number; district?: string }) ?? {};
      return (
        <div className="space-y-1.5">
          {label}
          <GooglePlacesAutocomplete
            value={addr.line ?? ''}
            onChange={(line) => set({ ...addr, line })}
            onPlaceSelect={(p) => set({ line: p.address, lat: p.lat, lng: p.lng, district: p.district })}
            placeholder={field.placeholder ? t(field.placeholder, lang) : (lang === 'ru' ? 'Начните вводить адрес…' : 'Start typing address…')}
          />
          {typeof addr.lat === 'number' && typeof addr.lng === 'number' && (
            <p className="text-[11px] text-muted-foreground font-mono">
              {addr.lat.toFixed(5)}, {addr.lng.toFixed(5)}
            </p>
          )}
          {hint}
        </div>
      );
    }

    case 'hours':
      return (
        <div className="space-y-1.5">
          {label}
          <WeeklyHoursEditor
            value={value as Record<string, { open?: string; close?: string; closed?: boolean } | undefined> | undefined}
            onChange={(v) => set(v)}
          />
          {hint}
        </div>
      );

    case 'media_single':
      return (
        <div className="space-y-1.5">
          {label}
          <UnifiedMediaUploader
            mode="single"
            value={(value as string) ?? ''}
            onChange={(v) => set(typeof v === 'string' ? v : (v[0] ?? ''))}
            folder={`vertical/${field.key}`}
          />
          {hint}
        </div>
      );

    case 'media_gallery':
      return (
        <div className="space-y-1.5">
          {label}
          <UnifiedMediaUploader
            mode="gallery"
            value={Array.isArray(value) ? (value as string[]) : []}
            onChange={(v) => set(Array.isArray(v) ? v : [v])}
            folder={`vertical/${field.key}`}
            maxItems={30}
          />
          {hint}
        </div>
      );

    case 'license_upload':
      return (
        <div className="space-y-1.5">
          {label}
          <UnifiedMediaUploader
            mode="document"
            value={(value as string) ?? ''}
            onChange={(v) => set(typeof v === 'string' ? v : (v[0] ?? ''))}
            folder={`vertical/license/${field.key}`}
            documentType="other"
          />
          {hint}
        </div>
      );

    case 'video_url':
      return (
        <div className="space-y-1.5">
          {label}
          <Input
            type="url"
            value={(value as string) ?? ''}
            onChange={(e) => set(e.target.value)}
            placeholder="https://youtube.com/..."
          />
          {hint}
        </div>
      );

    case 'daterange': {
      const v = (value as { from?: string; to?: string }) ?? {};
      return (
        <div className="space-y-1.5">
          {label}
          <div className="grid grid-cols-2 gap-2">
            <Input type="date" value={v.from ?? ''} onChange={(e) => set({ ...v, from: e.target.value })} />
            <Input type="date" value={v.to ?? ''} onChange={(e) => set({ ...v, to: e.target.value })} />
          </div>
        </div>
      );
    }

    default:
      return null;
  }
};
