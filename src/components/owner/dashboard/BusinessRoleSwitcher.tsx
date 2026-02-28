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
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1">
      {BUSINESS_ROLE_LIST.map(r => (
        <button
          key={r.id}
          onClick={() => onRoleChange(r.id)}
          className={cn(
            'flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0',
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
