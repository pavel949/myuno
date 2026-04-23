import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { PageContainer } from '@/components/uno/PageContainer';
import { PageHeader } from '@/components/uno/PageHeader';
import { cn } from '@/lib/utils';
import {
  User, ShieldCheck, Eye, Bell, CreditCard, Globe, Briefcase,
  Accessibility, Building2, Receipt, Award, ChevronRight,
} from 'lucide-react';

interface SettingsItem {
  icon: React.ElementType;
  labelEn: string;
  labelRu: string;
  path: string;
  section?: 'main' | 'business';
}

const SETTINGS_ITEMS: SettingsItem[] = [
  { icon: User, labelEn: 'Personal information', labelRu: 'Личная информация', path: '/profile/edit', section: 'main' },
  { icon: ShieldCheck, labelEn: 'Login & security', labelRu: 'Вход и безопасность', path: '/profile/settings', section: 'main' },
  { icon: Eye, labelEn: 'Privacy', labelRu: 'Конфиденциальность', path: '/profile/settings', section: 'main' },
  { icon: Bell, labelEn: 'Notifications', labelRu: 'Уведомления', path: '/profile/notifications', section: 'main' },
  { icon: CreditCard, labelEn: 'Payments', labelRu: 'Платежи', path: '/wallet', section: 'main' },
  { icon: Globe, labelEn: 'Translation', labelRu: 'Перевод', path: '/profile/settings', section: 'main' },
  { icon: Briefcase, labelEn: 'Business trips', labelRu: 'Деловые поездки', path: '/mc/settings', section: 'main' },
  { icon: Accessibility, labelEn: 'Accessibility', labelRu: 'Доступная среда', path: '/profile/settings', section: 'main' },
  { icon: Building2, labelEn: 'Company information', labelRu: 'Сведения о компании', path: '/mc/settings', section: 'business' },
  { icon: Receipt, labelEn: 'Taxes', labelRu: 'Налоги', path: '/mc/finance', section: 'business' },
  { icon: Award, labelEn: 'Path to Superhost', labelRu: 'Путь к статусу «Суперхозяин»', path: '/mc/superhost', section: 'business' },
];

export default function OwnerAccountSettings() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { user } = useAuth();
  const isRu = language === 'ru';

  const mainItems = SETTINGS_ITEMS.filter(i => i.section === 'main');
  const businessItems = SETTINGS_ITEMS.filter(i => i.section === 'business');

  return (
    <PageContainer>
      <PageHeader
        title={isRu ? 'Настройки аккаунта' : 'Account Settings'}
        showBack
        fallbackPath="/mc"
      />

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
              <span className="flex-1 text-base font-medium">
                {isRu ? item.labelRu : item.labelEn}
              </span>
              <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
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
              <span className="flex-1 text-base font-medium">
                {isRu ? item.labelRu : item.labelEn}
              </span>
              <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
            </button>
          ))}
        </div>
      </div>
    </PageContainer>
  );
}
