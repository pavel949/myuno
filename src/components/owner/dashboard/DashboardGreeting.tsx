import { pickLang } from '@/lib/i18n/pickLang';
import { MC_ROLE_LABELS, type MCCompanyRole } from '@/lib/businessRoles';
import { dashboardBusinessRoleLabel, dashboardCompanyRoleThai } from './dashboardRoleLabels';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useProfile } from '@/hooks/useProfile';
import { type BusinessRoleConfig } from '@/lib/businessRoles';

interface DashboardGreetingProps {
  roleConfig: BusinessRoleConfig;
  /** MC company role for display (director, manager, etc.) */
  mcRole?: string | null;
  /** Human-readable MC role label */
  mcRoleLabel?: { en: string; ru: string; th?: string; icon: string } | null;
}

export function DashboardGreeting({ roleConfig, mcRole, mcRoleLabel }: DashboardGreetingProps) {
  const { user } = useAuth();
  const { language } = useLanguage();
  const { profile } = useProfile();

  const hour = new Date().getHours();
  const greeting = pickLang(language, {
    en: hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening',
    ru: hour < 12 ? 'Доброе утро' : hour < 18 ? 'Добрый день' : 'Добрый вечер',
    th: hour < 12 ? 'สวัสดีตอนเช้า' : hour < 18 ? 'สวัสดีตอนบ่าย' : 'สวัสดีตอนเย็น',
  });

  const firstName = profile?.full_name?.split(' ')[0]
    || user?.email?.split('@')[0]
    || '';

  const knownRole = mcRole && Object.prototype.hasOwnProperty.call(MC_ROLE_LABELS, mcRole)
    ? MC_ROLE_LABELS[mcRole as MCCompanyRole]
    : undefined;
  const displayLabel = mcRole
    ? knownRole
      ? pickLang(language, { ...knownRole, th: dashboardCompanyRoleThai(mcRole) })
      : pickLang(language, { en: `Role: ${mcRole}`, ru: `Роль: ${mcRole}`, th: `บทบาท: ${mcRole}` })
    : mcRoleLabel
      ? pickLang(language, { ...mcRoleLabel, th: mcRoleLabel.th ?? `บทบาท: ${mcRoleLabel.en}` })
      : dashboardBusinessRoleLabel(language, roleConfig);

  return (
    <div className="space-y-1">
      <h1 className="font-sans text-h3 font-medium tracking-tight text-foreground break-words">
        {greeting}{firstName ? `, ${firstName}` : ''}
      </h1>
      <p className="text-sm text-muted-foreground break-words">
        {displayLabel}
      </p>
    </div>
  );
}
