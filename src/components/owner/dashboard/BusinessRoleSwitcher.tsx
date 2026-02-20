import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { type BusinessRole, BUSINESS_ROLE_LIST } from '@/lib/businessRoles';
import { cn } from '@/lib/utils';

interface BusinessRoleSwitcherProps {
  activeRole: BusinessRole;
  onRoleChange: (role: BusinessRole) => void;
}

export function BusinessRoleSwitcher({ activeRole, onRoleChange }: BusinessRoleSwitcherProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';

  return (
    <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1">
      {BUSINESS_ROLE_LIST.map(r => (
        <button
          key={r.id}
          onClick={() => onRoleChange(r.id)}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all flex-shrink-0',
            activeRole === r.id
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'bg-muted/60 text-muted-foreground hover:bg-muted'
          )}
        >
          <span>{r.icon}</span>
          <span>{isRu ? r.labelRu : r.labelEn}</span>
        </button>
      ))}
    </div>
  );
}
