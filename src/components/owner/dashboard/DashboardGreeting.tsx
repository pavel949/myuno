import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { type BusinessRoleConfig, type MCCompanyRole, MC_ROLE_LABELS } from '@/lib/businessRoles';

interface DashboardGreetingProps {
  roleConfig: BusinessRoleConfig;
  /** MC company role for display (director, manager, etc.) */
  mcRole?: string | null;
  /** Human-readable MC role label */
  mcRoleLabel?: { en: string; ru: string; icon: string } | null;
}

export function DashboardGreeting({ roleConfig, mcRole, mcRoleLabel }: DashboardGreetingProps) {
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

  // Show MC role label if available, otherwise fall back to business role label
  const displayIcon = mcRoleLabel?.icon || roleConfig.icon;
  const displayLabel = mcRoleLabel
    ? (isRu ? mcRoleLabel.ru : mcRoleLabel.en)
    : (isRu ? roleConfig.labelRu : roleConfig.labelEn);

  return (
    <div className="space-y-1">
      <h1 className="text-xl font-semibold tracking-tight text-foreground">
        {greeting}{firstName ? `, ${firstName}` : ''} {displayIcon}
      </h1>
      <p className="text-sm text-muted-foreground">
        {displayLabel}
        {mcRoleLabel && (
          <span className="text-xs ml-2 opacity-60">
            • {isRu ? roleConfig.labelRu : roleConfig.labelEn}
          </span>
        )}
      </p>
    </div>
  );
}
