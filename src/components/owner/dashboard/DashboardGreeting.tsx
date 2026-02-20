import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { type BusinessRoleConfig } from '@/lib/businessRoles';

interface DashboardGreetingProps {
  roleConfig: BusinessRoleConfig;
}

export function DashboardGreeting({ roleConfig }: DashboardGreetingProps) {
  const { user } = useAuth();
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const hour = new Date().getHours();
  const greeting = isRu
    ? hour < 12 ? 'Доброе утро' : hour < 18 ? 'Добрый день' : 'Добрый вечер'
    : hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  const firstName = user?.user_metadata?.full_name?.split(' ')[0]
    || user?.email?.split('@')[0]
    || '';

  return (
    <div className="space-y-1">
      <h1 className="text-xl font-semibold tracking-tight text-foreground">
        {greeting}{firstName ? `, ${firstName}` : ''} {roleConfig.icon}
      </h1>
      <p className="text-sm text-muted-foreground">
        {isRu ? roleConfig.labelRu : roleConfig.labelEn}
      </p>
    </div>
  );
}
