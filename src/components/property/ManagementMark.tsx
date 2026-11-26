import { useLanguage } from '@/contexts/LanguageContext';
import { pickLang } from '@/lib/i18n/pickLang';
import { cn } from '@/lib/utils';

const labels = {
  listed: { en: 'On myUNO', ru: 'На myUNO', th: 'บน myUNO' },
  partner: { en: 'Operated to myUNO standard', ru: 'Управление по стандарту myUNO', th: 'ดูแลตามมาตรฐาน myUNO' },
  managed: { en: 'Managed by myUNO', ru: 'Под управлением myUNO', th: 'ดูแลโดย myUNO' },
};

export function ManagementMark({ level, className }: { level: keyof typeof labels; className?: string }) {
  const { language } = useLanguage();
  return <span className={cn('ds-management-mark', className)} data-level={level}>{pickLang(language, labels[level])}</span>;
}
