import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Link as LinkIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/contexts/LanguageContext';
import { pickLang } from '@/lib/i18n/pickLang';

/** A URL preserves every catalogue criterion without creating notification jobs. */
export function CopyPublicSearchLink() {
  const location = useLocation();
  const { language } = useLanguage();
  const [status, setStatus] = useState<'idle' | 'copied' | 'manual'>('idle');
  const href = `${window.location.origin}${location.pathname}${location.search}${location.hash}`;
  useEffect(() => setStatus('idle'), [href]);
  const copy = async () => {
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(href);
      setStatus('copied');
    } catch { setStatus('manual'); }
  };
  return <div className="min-w-0 shrink-0 space-y-2">
    <Button variant="outline" size="sm" className="gap-2" onClick={() => { void copy(); }}>
      <LinkIcon className="h-4 w-4" aria-hidden="true" />
      {pickLang(language, { ru: 'Ссылка на поиск', en: 'Search link', th: 'ลิงก์การค้นหา' })}
    </Button>
    {status === 'copied' && <p role="status" className="text-xs">{pickLang(language, { ru: 'Ссылка скопирована', en: 'Link copied', th: 'คัดลอกลิงก์แล้ว' })}</p>}
    {status === 'manual' && <Input readOnly value={href} onFocus={event => event.currentTarget.select()} aria-label={pickLang(language, { ru: 'Скопируйте ссылку на поиск', en: 'Copy this search URL', th: 'คัดลอก URL การค้นหานี้' })} />}
  </div>;
}
