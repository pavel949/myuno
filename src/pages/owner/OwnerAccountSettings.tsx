import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { pickLang } from '@/lib/i18n/pickLang';
import { Button } from '@/components/ui/button';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { cn } from '@/lib/utils';
import {
  User, ShieldCheck, Eye, Bell, CreditCard, Globe, Briefcase,
  Accessibility, Building2, Receipt, Award, ChevronRight, ChevronLeft,
} from 'lucide-react';

interface SettingsItem {
  icon: React.ElementType;
  labelEn: string;
  labelRu: string;
  labelTh: string;
  path: string;
  section?: 'main' | 'business';
}

const SETTINGS_ITEMS: SettingsItem[] = [
  { icon: User, labelEn: 'Personal information', labelRu: 'Личная информация', labelTh: 'ข้อมูลส่วนตัว', path: '/profile/edit', section: 'main' },
  { icon: ShieldCheck, labelEn: 'Login & security', labelRu: 'Вход и безопасность', labelTh: 'การเข้าสู่ระบบและความปลอดภัย', path: '/profile/settings', section: 'main' },
  { icon: Eye, labelEn: 'Privacy', labelRu: 'Конфиденциальность', labelTh: 'ความเป็นส่วนตัว', path: '/profile/settings', section: 'main' },
  { icon: Bell, labelEn: 'Notifications', labelRu: 'Уведомления', labelTh: 'การแจ้งเตือน', path: '/profile/notifications', section: 'main' },
  { icon: CreditCard, labelEn: 'Payments', labelRu: 'Платежи', labelTh: 'การชำระเงิน', path: '/wallet', section: 'main' },
  { icon: Globe, labelEn: 'Translation', labelRu: 'Перевод', labelTh: 'การแปลภาษา', path: '/profile/settings', section: 'main' },
  { icon: Briefcase, labelEn: 'Business trips', labelRu: 'Деловые поездки', labelTh: 'การเดินทางเพื่อธุรกิจ', path: '/mc/settings', section: 'main' },
  { icon: Accessibility, labelEn: 'Accessibility', labelRu: 'Доступная среда', labelTh: 'การช่วยการเข้าถึง', path: '/profile/settings', section: 'main' },
  { icon: Building2, labelEn: 'Company information', labelRu: 'Сведения о компании', labelTh: 'ข้อมูลบริษัท', path: '/mc/settings?tab=profile', section: 'business' },
  { icon: Receipt, labelEn: 'Taxes', labelRu: 'Налоги', labelTh: 'ภาษี', path: '/mc/finance/tax-center', section: 'business' },
  { icon: Award, labelEn: 'Path to Superhost', labelRu: 'Путь к статусу «Суперхозяин»', labelTh: 'เส้นทางสู่สถานะเจ้าของที่พักดีเด่น', path: '/mc/superhost', section: 'business' },
];

export default function OwnerAccountSettings() {
  const navigate = useNavigate();
  const { language } = useLanguage();

  const mainItems = SETTINGS_ITEMS.filter(i => i.section === 'main');
  const businessItems = SETTINGS_ITEMS.filter(i => i.section === 'business');

  return (
    <PageContainer>
      <div className="flex min-w-0 items-start gap-3">
        <Button variant="ghost" size="icon" className="shrink-0" onClick={() => navigate('/mc')} aria-label={pickLang(language, { en: 'Back', ru: 'Назад', th: 'ย้อนกลับ' })}>
          <ChevronLeft className="h-5 w-5" aria-hidden />
        </Button>
        <PageHeader title={pickLang(language, { en: 'Account Settings', ru: 'Настройки аккаунта', th: 'การตั้งค่าบัญชี' })} />
      </div>

      <div className="max-w-2xl mx-auto">
        {/* Main settings */}
        <div className="divide-y divide-border">
          {mainItems.map((item) => (
            <button
              key={item.labelEn}
              onClick={() => navigate(item.path)}
              className={cn(
                'flex items-center w-full px-1 py-5 text-left',
                'hover:bg-muted/50 transition-colors rounded-none group'
              )}
            >
              <item.icon className="h-6 w-6 text-muted-foreground mr-4 flex-shrink-0" />
              <span className="min-w-0 flex-1 break-words text-base font-medium">
                {pickLang(language, { en: item.labelEn, ru: item.labelRu, th: item.labelTh })}
              </span>
              <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground group-hover:text-foreground transition-colors" />
            </button>
          ))}
        </div>

        {/* Divider */}
        <div className="my-2 border-t border-border" />

        {/* Business settings */}
        <div className="divide-y divide-border">
          {businessItems.map((item) => (
            <button
              key={item.labelEn}
              onClick={() => navigate(item.path)}
              className={cn(
                'flex items-center w-full px-1 py-5 text-left',
                'hover:bg-muted/50 transition-colors rounded-none group'
              )}
            >
              <item.icon className="h-6 w-6 text-muted-foreground mr-4 flex-shrink-0" />
              <span className="min-w-0 flex-1 break-words text-base font-medium">
                {pickLang(language, { en: item.labelEn, ru: item.labelRu, th: item.labelTh })}
              </span>
              <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground group-hover:text-foreground transition-colors" />
            </button>
          ))}
        </div>
      </div>
    </PageContainer>
  );
}
