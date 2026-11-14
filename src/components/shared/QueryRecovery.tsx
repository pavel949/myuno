import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { pickLang } from '@/lib/i18n/pickLang';

/** Read failures are not empty results. Raw server errors stay out of the UI. */
export function QueryRecovery({ onRetry, isRetrying = false, stale = false }: {
  onRetry: () => unknown;
  isRetrying?: boolean;
  stale?: boolean;
}) {
  const { language } = useLanguage();
  return (
    <div role="alert" className="flex min-w-0 flex-wrap items-center gap-3 border border-destructive/30 bg-destructive/5 p-4">
      <AlertTriangle aria-hidden="true" className="h-5 w-5 shrink-0 text-destructive" />
      <p className="min-w-0 flex-1 text-body-sm text-foreground">
        {pickLang(language, stale ? {
          en: 'Could not refresh data. Previously loaded data is shown.',
          ru: 'Не удалось обновить данные. Показаны ранее загруженные сведения.',
          th: 'อัปเดตข้อมูลไม่ได้ กำลังแสดงข้อมูลที่โหลดไว้ก่อนหน้า',
        } : {
          en: 'Could not load data.', ru: 'Не удалось загрузить данные.', th: 'โหลดข้อมูลไม่ได้',
        })}
      </p>
      <Button type="button" variant="outline" disabled={isRetrying} onClick={() => { void onRetry(); }}>
        {pickLang(language, { en: 'Retry', ru: 'Повторить', th: 'ลองอีกครั้ง' })}
      </Button>
    </div>
  );
}