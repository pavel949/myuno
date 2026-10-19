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
  const isRu = language === 'ru';

  return (
    <label htmlFor={id} className="flex min-w-0 flex-col gap-2 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
      <span>
        <span id={`${id}-label`} className="block text-body-sm font-medium">
          {isRu ? 'Дополнительные блоки' : 'More dashboard sections'}
        </span>
        <span id={`${id}-hint`} className="block text-caption text-muted-foreground">
          {isRu ? 'Выберите, какие блоки показывать ниже' : 'Choose which sections appear below'}
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
        className="h-11 w-full min-w-0 border border-input bg-background px-3 text-body-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:max-w-xs"
      >
        {BUSINESS_ROLE_LIST.map(role => (
          <option key={role.id} value={role.id}>{isRu ? role.labelRu : role.labelEn}</option>
        ))}
      </select>
    </label>
  );
}
