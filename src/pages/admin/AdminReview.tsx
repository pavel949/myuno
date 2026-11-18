import { PageHeader, PageShell } from '@/components/page';
import { OperationsModerationTab } from '@/components/admin/operations/OperationsModerationTab';
import { useLanguage } from '@/contexts/LanguageContext';
import { pickLang } from '@/lib/i18n/pickLang';

export default function AdminReview() {
  const { language } = useLanguage();
  return (
    <PageShell width="wide">
      <PageHeader title={pickLang(language, {
        en: 'Content review',
        ru: 'Проверка предложений',
        th: 'ตรวจสอบเนื้อหา',
      })} />
      <OperationsModerationTab />
    </PageShell>
  );
}
