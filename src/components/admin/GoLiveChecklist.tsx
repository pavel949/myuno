import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { pickLang, type LangValues } from '@/lib/i18n/pickLang';
import { useAdminPlatformStatus } from '@/hooks/useAdminDashboardEvidence';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { PlatformStatus } from '@/lib/adminDashboardEvidence';
import { useDashboardClock } from '@/components/admin/dashboard/DashboardCount';

const LABELS: Record<string, LangValues> = {
  stripe_mode: { en: 'Card payment configuration', ru: 'Настройка оплаты картой', th: 'การตั้งค่าชำระเงินด้วยบัตร' },
  admin_emails: { en: 'Admin email configuration', ru: 'Почта администраторов', th: 'การตั้งค่าอีเมลผู้ดูแล' },
  admin_whatsapp: { en: 'Admin WhatsApp configuration', ru: 'WhatsApp администраторов', th: 'การตั้งค่า WhatsApp ผู้ดูแล' },
  reconciliation: { en: 'Unresolved reconciliation alerts · last 30 days', ru: 'Открытые ошибки сверки · 30 дней', th: 'การแจ้งเตือนกระทบยอดที่ยังไม่แก้ไข · 30 วัน' },
  verticals: { en: 'Vertical configuration', ru: 'Настройки направлений', th: 'การตั้งค่าหมวดบริการ' },
};
const STATES: Record<PlatformStatus, LangValues> = {
  configured: { en: 'Configured', ru: 'Настроено', th: 'ตั้งค่าแล้ว' },
  not_configured: { en: 'Not configured', ru: 'Не настроено', th: 'ยังไม่ตั้งค่า' },
  verified: { en: 'No alerts found', ru: 'Ошибок не найдено', th: 'ไม่พบการแจ้งเตือน' },
  needs_review: { en: 'Review required', ru: 'Нужна проверка', th: 'ต้องตรวจสอบ' },
  unknown: { en: 'Unavailable', ru: 'Недоступно', th: 'ไม่มีข้อมูล' },
};

/** Existing export retained; configuration is not a launch/readiness certificate. */
export function GoLiveChecklist() {
  const { language } = useLanguage();
  const { data, isLoading, isError, isFetching, dataUpdatedAt, refetch } = useAdminPlatformStatus();
  const now = useDashboardClock();
  const stale = !!dataUpdatedAt && now - dataUpdatedAt > 60_000;
  const rows = data ?? Object.keys(LABELS).map(key => ({ key, status: 'unknown' as const }));
  return <Card data-testid="platform-status">
    <CardHeader className="pb-2"><CardTitle className="text-lg">{pickLang(language, { en: 'Platform status', ru: 'Состояние платформы', th: 'สถานะแพลตฟอร์ม' })}</CardTitle></CardHeader>
    <CardContent className="space-y-3">
      {isLoading && <p role="status" className="text-sm text-muted-foreground">{pickLang(language, { en: 'Checking configuration…', ru: 'Проверяем настройки…', th: 'กำลังตรวจสอบการตั้งค่า…' })}</p>}
      {isError && <p role="alert" className="text-sm">{pickLang(language, { en: 'Status refresh failed. Previous checks may be outdated.', ru: 'Не удалось обновить статус. Предыдущие проверки могли устареть.', th: 'อัปเดตสถานะไม่สำเร็จ ผลเดิมอาจล้าสมัย' })}</p>}
      <dl className="divide-y divide-border">
        {rows.map(item => <div key={item.key} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-2 text-sm">
          <dt className="min-w-0 flex-1">{pickLang(language, LABELS[item.key])}</dt>
          <dd className={item.status === 'needs_review' ? 'text-warning' : 'text-muted-foreground'}>{isLoading ? '—' : pickLang(language, STATES[item.status])}</dd>
        </div>)}
        <div className="flex flex-wrap justify-between gap-2 py-2 text-sm"><dt>{pickLang(language, { en: 'Payment and notification delivery', ru: 'Платежи и доставка уведомлений', th: 'การชำระเงินและการส่งแจ้งเตือน' })}</dt><dd className="text-muted-foreground">{pickLang(language, { en: 'Not verified end to end', ru: 'Полный цикл не проверен', th: 'ยังไม่ตรวจสอบครบวงจร' })}</dd></div>
      </dl>
      <p className="text-xs text-muted-foreground">{pickLang(language, { en: 'Configured channels do not confirm delivery or successful payments.', ru: 'Настроенный канал не подтверждает доставку или успешную оплату.', th: 'การตั้งค่าช่องทางไม่ยืนยันการส่งหรือชำระเงินสำเร็จ' })}</p>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link to="/admin/settings" className="text-sm text-primary underline-offset-4 hover:underline">{pickLang(language, { en: 'Settings and connections', ru: 'Настройки и подключения', th: 'การตั้งค่าและการเชื่อมต่อ' })}</Link>
        <Button variant="ghost" size="sm" disabled={isFetching} onClick={() => void refetch()}>{pickLang(language, { en: 'Check again', ru: 'Проверить', th: 'ตรวจสอบอีกครั้ง' })}</Button>
      </div>
      {!!dataUpdatedAt && <p className="text-xs text-muted-foreground">{stale ? pickLang(language, { en: 'Stale check', ru: 'Проверка устарела', th: 'ผลตรวจสอบล้าสมัย' }) : pickLang(language, { en: 'Checked', ru: 'Проверено', th: 'ตรวจสอบแล้ว' })}: {new Intl.DateTimeFormat(language, { timeZone: 'Asia/Bangkok', hour: '2-digit', minute: '2-digit' }).format(dataUpdatedAt)} · {pickLang(language, { en: 'Phuket time', ru: 'время Пхукета', th: 'เวลาภูเก็ต' })}</p>}
    </CardContent>
  </Card>;
}
