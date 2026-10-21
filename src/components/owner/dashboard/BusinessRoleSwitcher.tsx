import { pickLang } from '@/lib/i18n/pickLang';
import { dashboardBusinessRoleLabel } from './dashboardRoleLabels';
import { useId } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useLanguage } from '@/contexts/LanguageContext';
import { type BusinessRole, BUSINESS_ROLE_LIST } from '@/lib/businessRoles';

interface BusinessRoleSwitcherProps {
  activeRole: BusinessRole;
  onRoleChange: (role: BusinessRole) => void;
}

/** Presentation preference only. Workspace destinations live in DashboardDestinations. */
export function BusinessRoleSwitcher({ activeRole, onRoleChange }: BusinessRoleSwitcherProps) {
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  const id = useId();

  return (
    <label htmlFor={id} className="flex min-w-0 flex-col gap-2 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
      <span>
        <span id={`${id}-label`} className="block text-body-sm font-medium">
          {pickLang(language, { en: 'More dashboard sections', ru: 'Дополнительные блоки', th: 'ส่วนเพิ่มเติมในแดชบอร์ด' })}
        </span>
        <span id={`${id}-hint`} className="block text-caption text-muted-foreground">
          {pickLang(language, { en: 'Choose which sections appear below', ru: 'Выберите, какие блоки показывать ниже', th: 'เลือกส่วนที่ต้องการแสดงด้านล่าง' })}
        </span>
      </span>
      <select
        id={id}
        aria-labelledby={`${id}-label`}
        aria-describedby={`${id}-hint`}
        value={activeRole}
        onChange={(event) => {
          const role = event.target.value as BusinessRole;
          if (role === activeRole) return;
          queryClient.invalidateQueries();
          onRoleChange(role);
        }}
        className="h-11 w-full min-w-0 border border-input bg-background px-3 text-body-sm focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring sm:max-w-xs"
      >
        {BUSINESS_ROLE_LIST.map(role => (
          <option key={role.id} value={role.id}>{dashboardBusinessRoleLabel(language, role)}</option>
        ))}
      </select>
    </label>
  );
}
