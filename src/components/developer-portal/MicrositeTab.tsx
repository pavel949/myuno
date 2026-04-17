/**
 * MicrositeTab — per-project landing page configuration for /p/:slug.
 * Toggle landing_enabled, edit SEO meta, copy public URL.
 */
import { useEffect, useState } from 'react';
import { Copy, ExternalLink, Globe, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { ImageUpload } from '@/components/upload/ImageUpload';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { APP_ROUTES } from '@/lib/config/routes';

interface MicrositeTabProps {
  projectId: string;
  slug: string | null;
  initial: {
    landing_enabled?: boolean | null;
    meta_title?: string | null;
    meta_description?: string | null;
    og_image_url?: string | null;
    social_share_text?: string | null;
    tagline?: string | null;
    name_en: string;
    cover_image?: string | null;
  };
}

export function MicrositeTab({ projectId, slug, initial }: MicrositeTabProps) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    landing_enabled: initial.landing_enabled ?? false,
    meta_title: initial.meta_title ?? '',
    meta_description: initial.meta_description ?? '',
    og_image_url: initial.og_image_url ?? '',
    social_share_text: initial.social_share_text ?? '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm({
      landing_enabled: initial.landing_enabled ?? false,
      meta_title: initial.meta_title ?? '',
      meta_description: initial.meta_description ?? '',
      og_image_url: initial.og_image_url ?? '',
      social_share_text: initial.social_share_text ?? '',
    });
  }, [initial.landing_enabled, initial.meta_title, initial.meta_description, initial.og_image_url, initial.social_share_text]);

  const url = slug ? `${typeof window !== 'undefined' ? window.location.origin : ''}${APP_ROUTES.PROJECT_MICROSITE(slug)}` : null;

  const update = (k: keyof typeof form, v: unknown) => setForm(p => ({ ...p, [k]: v }));

  const save = async () => {
    setSaving(true);
    try {
      const { error } = await supabase.from('property_projects').update({
        landing_enabled: form.landing_enabled,
        meta_title: form.meta_title || null,
        meta_description: form.meta_description || null,
        og_image_url: form.og_image_url || null,
        social_share_text: form.social_share_text || null,
      }).eq('id', projectId);
      if (error) throw error;
      toast.success('Настройки микросайта сохранены');
      qc.invalidateQueries({ queryKey: ['newbuild-project'] });
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  const copy = async () => {
    if (!url) return;
    await navigator.clipboard.writeText(url);
    toast.success('Ссылка скопирована');
  };

  const autofill = () => {
    setForm(p => ({
      ...p,
      meta_title: p.meta_title || `${initial.name_en} — Phuket new development`,
      meta_description: p.meta_description || (initial.tagline ?? '').slice(0, 160),
      og_image_url: p.og_image_url || initial.cover_image || '',
      social_share_text: p.social_share_text || `${initial.name_en}: ${initial.tagline ?? 'New project on Phuket'}`,
    }));
  };

  return (
    <div className="nb-glass p-6 space-y-6">
      {/* Toggle */}
      <div className="flex items-start justify-between gap-4 p-4 rounded-xl bg-[hsl(var(--nb-glass-bg))] border border-[hsl(var(--nb-glass-border))]">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-[hsl(var(--nb-gold)/0.15)] flex items-center justify-center shrink-0">
            <Globe className="w-4 h-4 text-[hsl(var(--nb-gold))]" />
          </div>
          <div>
            <h3 className="font-semibold text-[hsl(var(--nb-text))]">Публичный микросайт</h3>
            <p className="text-xs text-[hsl(var(--nb-muted))] mt-0.5">
              Отдельная посадочная страница проекта по адресу <code className="text-[hsl(var(--nb-gold))]">/p/{slug ?? '…'}</code>
            </p>
          </div>
        </div>
        <Switch
          checked={form.landing_enabled}
          onCheckedChange={v => update('landing_enabled', v)}
        />
      </div>

      {/* URL */}
      {url && (
        <div className="p-4 rounded-xl bg-[hsl(var(--nb-glass-bg))] border border-[hsl(var(--nb-glass-border))] space-y-2">
          <label className="text-xs text-[hsl(var(--nb-muted))]">Публичный URL</label>
          <div className="flex gap-2">
            <Input value={url} readOnly className="font-mono text-xs bg-[hsl(var(--nb-bg))] border-[hsl(var(--nb-glass-border))] text-[hsl(var(--nb-text))]" />
            <Button variant="outline" size="icon" onClick={copy} className="border-[hsl(var(--nb-glass-border))] text-[hsl(var(--nb-text-secondary))]">
              <Copy className="w-4 h-4" />
            </Button>
            <a href={url} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="icon" className="border-[hsl(var(--nb-glass-border))] text-[hsl(var(--nb-text-secondary))]">
                <ExternalLink className="w-4 h-4" />
              </Button>
            </a>
          </div>
          {!form.landing_enabled && (
            <p className="text-xs text-amber-400">⚠ Включите тумблер выше, иначе страница вернёт 404</p>
          )}
        </div>
      )}

      {/* SEO fields */}
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-[hsl(var(--nb-text))]">SEO и соцсети</h3>
          <button onClick={autofill} className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md bg-[hsl(var(--nb-gold)/0.1)] text-[hsl(var(--nb-gold))] hover:bg-[hsl(var(--nb-gold)/0.2)] transition-colors">
            <Sparkles className="w-3.5 h-3.5" />
            Автозаполнить
          </button>
        </div>

        <div>
          <label className="nb-label mb-1.5 block">Meta Title</label>
          <Input
            value={form.meta_title}
            onChange={e => update('meta_title', e.target.value)}
            maxLength={70}
            placeholder={`${initial.name_en} — Phuket new development`}
            className="bg-[hsl(var(--nb-bg))] border-[hsl(var(--nb-glass-border))] text-[hsl(var(--nb-text))]"
          />
          <p className="text-xs text-[hsl(var(--nb-muted))] mt-1">{form.meta_title.length}/70 — для вкладки браузера и Google</p>
        </div>

        <div>
          <label className="nb-label mb-1.5 block">Meta Description</label>
          <textarea
            value={form.meta_description}
            onChange={e => update('meta_description', e.target.value)}
            maxLength={170}
            rows={3}
            placeholder="Краткое описание проекта, до 160 символов"
            className="w-full rounded-md bg-[hsl(var(--nb-bg))] border border-[hsl(var(--nb-glass-border))] px-3 py-2 text-sm text-[hsl(var(--nb-text))]"
          />
          <p className="text-xs text-[hsl(var(--nb-muted))] mt-1">{form.meta_description.length}/160 — сниппет в поиске и превью ссылки</p>
        </div>

        <div>
          <label className="nb-label mb-1.5 block">OG-изображение (1200x630)</label>
          <ImageUpload
            value={form.og_image_url}
            onChange={url => update('og_image_url', url)}
            folder="developer-uploads/og"
          />
          <p className="text-xs text-[hsl(var(--nb-muted))] mt-1">Превью при шаринге в соцсетях. Если не задано — используется обложка проекта.</p>
        </div>

        <div>
          <label className="nb-label mb-1.5 block">Текст для соцсетей</label>
          <textarea
            value={form.social_share_text}
            onChange={e => update('social_share_text', e.target.value)}
            rows={2}
            placeholder="Yes — это будет вставлено при шаринге в WhatsApp, Telegram, Twitter"
            className="w-full rounded-md bg-[hsl(var(--nb-bg))] border border-[hsl(var(--nb-glass-border))] px-3 py-2 text-sm text-[hsl(var(--nb-text))]"
          />
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <button className="nb-btn-gold" disabled={saving} onClick={save}>
          {saving ? 'Сохранение…' : 'Сохранить настройки микросайта'}
        </button>
      </div>
    </div>
  );
}
