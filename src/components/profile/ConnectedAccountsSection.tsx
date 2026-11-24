import { SectionCard } from '@/components/uno/SectionCard';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { pickLang } from '@/lib/i18n/pickLang';

const providers = [
  { id: 'google', label: 'Google' },
  { id: 'apple', label: 'Apple' },
] as const;

export function ConnectedAccountsSection() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const reportedProviders: unknown = user?.app_metadata?.providers;
  const connectedProviders = Array.isArray(reportedProviders) ? reportedProviders : null;
  const t = (ru: string, en: string, th: string) => pickLang(language, { ru, en, th });

  return (
    <SectionCard className="space-y-3">
      <h3 className="text-base font-semibold">{t('Подключённые аккаунты', 'Connected accounts', 'บัญชีที่เชื่อมต่อ')}</h3>
      <p className="text-sm text-muted-foreground">
        {t('Способы входа, указанные для вашего аккаунта.', 'Sign-in providers reported for your account.', 'ผู้ให้บริการเข้าสู่ระบบที่ระบุไว้สำหรับบัญชีของคุณ')}
      </p>
      <dl className="divide-y divide-border">
        {providers.map(({ id, label }) => (
          <div key={id} className="flex min-h-11 flex-wrap items-center justify-between gap-2">
            <dt className="font-medium">{label}</dt>
            <dd className="text-sm text-muted-foreground">
              {connectedProviders?.includes(id)
                ? t('Подключён', 'Connected', 'เชื่อมต่อแล้ว')
                : connectedProviders
                  ? t('Не подключён', 'Not connected', 'ไม่ได้เชื่อมต่อ')
                  : t('Статус неизвестен', 'Status unavailable', 'ไม่ทราบสถานะ')}
            </dd>
          </div>
        ))}
      </dl>
    </SectionCard>
  );
}
