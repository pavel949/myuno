/**
 * LandingTab — manage the public Russian landing (`/ts/:slug`): preview link,
 * copy, QR code, and editable RU title/subtitle.
 */
import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';
import { Copy, Check, ExternalLink, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/contexts/LanguageContext';
import { APP_ROUTES } from '@/lib/config/routes';
import { useSaveThaiBusiness } from '@/hooks/thaiServices/useThaiServices';
import type { ThaiBusiness } from '@/types/thaiBusiness';

export function LandingTab({ business }: { business: ThaiBusiness }) {
  const { t } = useLanguage();
  const save = useSaveThaiBusiness();
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://myuno.app';
  const url = `${origin}${APP_ROUTES.THAI_LANDING(business.slug)}`;
  const [copied, setCopied] = useState(false);
  const [title, setTitle] = useState(business.landing_title_ru ?? '');
  const [subtitle, setSubtitle] = useState(business.landing_subtitle_ru ?? '');

  const copy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const onSave = async () => {
    try {
      await save.mutateAsync({ id: business.id, name_th: business.name_th, landing_title_ru: title, landing_subtitle_ru: subtitle });
      toast.success(t('thai.owner.saved'));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Error');
    }
  };

  return (
    <div className="space-y-6 max-w-xl">
      <div className="space-y-2">
        <Label>{t('thai.owner.landing.url')}</Label>
        <div className="flex gap-2">
          <Input readOnly value={url} className="font-mono text-sm" />
          <Button variant="outline" size="icon" onClick={copy}>{copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}</Button>
          <Button variant="outline" size="icon" asChild><a href={url} target="_blank" rel="noreferrer"><ExternalLink className="w-4 h-4" /></a></Button>
        </div>
        {!business.is_active && <p className="text-xs text-accent">{t('thai.owner.pendingModeration')}</p>}
      </div>

      <div className="space-y-2">
        <Label>{t('thai.owner.landing.qr')}</Label>
        <div className="inline-block bg-white p-3 border border-border">
          <QRCodeSVG value={url} size={160} />
        </div>
      </div>

      <div className="space-y-3">
        <div className="space-y-1.5"><Label>{t('thai.owner.landing.titleRu')}</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} /></div>
        <div className="space-y-1.5"><Label>{t('thai.owner.landing.subtitleRu')}</Label><Input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} /></div>
        <Button onClick={onSave} disabled={save.isPending}>
          {save.isPending ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : null}{t('thai.owner.save')}
        </Button>
      </div>
    </div>
  );
}
