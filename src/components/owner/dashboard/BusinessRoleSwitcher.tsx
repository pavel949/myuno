import React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useLanguage } from '@/contexts/LanguageContext';
import { type BusinessRole, BUSINESS_ROLE_LIST } from '@/lib/businessRoles';
import { cn } from '@/lib/utils';

interface BusinessRoleSwitcherProps {
  activeRole: BusinessRole;
  onRoleChange: (role: BusinessRole) => void;
}

export function BusinessRoleSwitcher({ activeRole, onRoleChange }: BusinessRoleSwitcherProps) {
  const { language } = useLanguage();
  const queryClient = useQueryClient();
  const isRu = language === 'ru';

  const handleSwitch = (id: BusinessRole) => {
    if (id === activeRole) return;
    // Bible-v2 audit B2: invalidate role-scoped caches so the new role view
    // refetches instead of rendering data from the previous role's perspective.
    queryClient.invalidateQueries();
    onRoleChange(id);
  };

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1">
      {BUSINESS_ROLE_LIST.map(r => (
        <button
          key={r.id}
          onClick={() => handleSwitch(r.id)}
          className={cn(
            'flex items-center gap-2 px-3.5 py-2 rounded-none text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0',
            'ring-1 shadow-sm',
            activeRole === r.id
              ? 'bg-primary text-primary-foreground ring-primary/30 shadow-md'
              : 'bg-card ring-border/50 text-muted-foreground hover:bg-muted hover:text-foreground'
          )}
        >
          <span className="text-base leading-none">{r.icon}</span>
          <span>{isRu ? r.labelRu : r.labelEn}</span>
        </button>
      ))}
    </div>
  );
}
