import { OperationsModerationTab } from '@/components/admin/operations/OperationsModerationTab';
import { PageShell } from '@/components/page/PageShell';
import { useLanguage } from '@/contexts/LanguageContext';
import { pickLang } from '@/lib/i18n/pickLang';

export default function AdminReview() {
  const { language } = useLanguage();
  return <PageShell width="wide"><header className="mb-6 space-y-2"><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">myUNO · Admin</p><h1 className="font-display text-3xl font-semibold tracking-tight">{pickLang(language, { en: 'Content review', ru: 'Проверка предложений', th: 'ตรวจสอบเนื้อหา' })}</h1><p className="max-w-3xl text-sm text-muted-foreground">{pickLang(language, { en: 'Review submitted listings, manage inactive catalogue items and verify complexes in one workspace.', ru: 'Проверяйте предложения, управляйте неактивными позициями каталога и заявками на комплексы в единой очереди.', th: 'ตรวจสอบรายการที่ส่งมา จัดการรายการที่ไม่ใช้งาน และตรวจสอบโครงการในพื้นที่เดียว' })}</p></header><OperationsModerationTab /></PageShell>;
}
