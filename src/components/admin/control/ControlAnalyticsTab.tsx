import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { pickLang } from '@/lib/i18n/pickLang';
import { AdminRevenueBlock } from '@/components/admin/dashboard/AdminRevenueBlock';
import { Button } from '@/components/ui/button';

export function ControlAnalyticsTab() {
  const { language } = useLanguage();
  // Reuse the admitted snapshot evidence instead of maintaining parallel totals.
  return <section className="min-w-0 space-y-4">
    <AdminRevenueBlock />
    <div className="flex flex-wrap gap-3">
      <Button asChild variant="outline" className="min-h-11"><Link to="/admin/analytics?tab=visits">{pickLang(language, { en: 'Visits and activity', ru: 'Посещения и активность', th: 'การเข้าชมและกิจกรรม' })}</Link></Button>
      <Button asChild variant="outline" className="min-h-11"><Link to="/admin/analytics?tab=acquisition">{pickLang(language, { en: 'Recorded acquisition metrics', ru: 'Показатели привлечения', th: 'ตัวชี้วัดการหาลูกค้าที่บันทึกไว้' })}</Link></Button>
      <Button asChild variant="outline" className="min-h-11"><Link to="/admin/analytics?tab=revenue">{pickLang(language, { en: 'Commercial indicators', ru: 'Коммерческие показатели', th: 'ตัวชี้วัดเชิงพาณิชย์' })}</Link></Button>
    </div>
  </section>;
}
