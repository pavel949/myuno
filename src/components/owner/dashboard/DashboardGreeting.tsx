import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useProfile } from '@/hooks/useProfile';
import { type BusinessRoleConfig } from '@/lib/businessRoles';

interface DashboardGreetingProps {
  roleConfig: BusinessRoleConfig;
  /** MC company role for display (director, manager, etc.) */
  mcRole?: string | null;
  /** Human-readable MC role label */
  mcRoleLabel?: { en: string; ru: string; icon: string } | null;
}

export function DashboardGreeting({ roleConfig, mcRoleLabel }: DashboardGreetingProps) {
  const { user } = useAuth();
  const { language } = useLanguage();
  const { profile } = useProfile();
  const isRu = language === 'ru';

  const hour = new Date().getHours();
  const greeting = isRu
    ? hour < 12 ? 'Доброе утро' : hour < 18 ? 'Добрый день' : 'Добрый вечер'
    : hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  const firstName = profile?.full_name?.split(' ')[0]
    || user?.email?.split('@')[0]
    || '';

  // Show MC role label if available, otherwise fall back to business role label
  const displayLabel = mcRoleLabel
    ? (isRu ? mcRoleLabel.ru : mcRoleLabel.en)
    : (isRu ? roleConfig.labelRu : roleConfig.labelEn);

  return (
    <div className="space-y-1">
      <h1 className="font-sans text-h3 font-medium tracking-tight text-foreground break-words">
        {greeting}{firstName ? `, ${firstName}` : ''}
      </h1>
      <p className="text-sm text-muted-foreground">
        {displayLabel}
      </p>
    </div>
  );
}
