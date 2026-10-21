import { OperationsModerationTab } from '@/components/admin/operations/OperationsModerationTab';
import { PageShell } from '@/components/page/PageShell';
import { useLanguage } from '@/contexts/LanguageContext';
import { pickLang } from '@/lib/i18n/pickLang';

export default function AdminReview() {
  const { language } = useLanguage();
  return <PageShell width="wide"><h1 className="mb-4 text-2xl font-semibold">{pickLang(language, { en: 'Review', ru: 'Проверка', th: 'ตรวจสอบ' })}</h1><OperationsModerationTab /></PageShell>;
}
