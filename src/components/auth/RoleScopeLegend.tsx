import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { type AppRole, ROLE_METADATA } from '@/types/auth';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { 
  HelpCircle, 
  User, 
  Plane, 
  Home, 
  Store, 
  Building2, 
  Shield,
  UserCog,
  Headphones,
  Scale,
  Wallet,
  TrendingUp,
  LineChart,
  Handshake,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Short codes for role scopes used in admin interfaces
export const ROLE_SCOPE_CODES: Record<string, { 
  roles: AppRole[]; 
  labelEn: string; 
  labelRu: string;
  descriptionEn: string;
  descriptionRu: string;
  color: string;
}> = {
  G: {
    roles: ['guest'],
    labelEn: 'Guest',
    labelRu: 'Гость',
    descriptionEn: 'Unauthenticated visitors',
    descriptionRu: 'Неавторизованные посетители',
    color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  },
  U: {
    roles: ['user'],
    labelEn: 'User',
    labelRu: 'Пользователь',
    descriptionEn: 'Authenticated users (clients)',
    descriptionRu: 'Авторизованные пользователи (клиенты)',
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  },
  T: {
    roles: ['tourist'],
    labelEn: 'Tourist',
    labelRu: 'Турист',
    descriptionEn: 'Short-term visitors',
    descriptionRu: 'Краткосрочные посетители',
    color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300',
  },
  R: {
    roles: ['resident'],
    labelEn: 'Resident',
    labelRu: 'Резидент',
    descriptionEn: 'Long-term residents',
    descriptionRu: 'Постоянные жители',
    color: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  },
  V: {
    roles: ['vendor', 'partner'],
    labelEn: 'Vendor',
    labelRu: 'Вендор',
    descriptionEn: 'Service providers and partners',
    descriptionRu: 'Поставщики услуг и партнёры',
    color: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
  },
  O: {
    roles: ['owner', 'property_owner'],
    labelEn: 'Owner',
    labelRu: 'Владелец',
    descriptionEn: 'Property owners and managers',
    descriptionRu: 'Владельцы и управляющие недвижимостью',
    color: 'bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300',
  },
  S: {
    roles: ['staff'],
    labelEn: 'Staff',
    labelRu: 'Персонал',
    descriptionEn: 'Platform staff members',
    descriptionRu: 'Сотрудники платформы',
    color: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
  },
  M: {
    roles: ['uno_team'],
    labelEn: 'Team',
    labelRu: 'Команда',
    descriptionEn: 'myUNO operations team',
    descriptionRu: 'Операционная команда myUNO',
    color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
  },
  A: {
    roles: ['admin', 'ombudsman'],
    labelEn: 'Admin',
    labelRu: 'Админ',
    descriptionEn: 'Administrators and oversight',
    descriptionRu: 'Администраторы и контроль',
    color: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  },
  I: {
    roles: ['investor'],
    labelEn: 'Investor',
    labelRu: 'Инвестор',
    descriptionEn: 'Investment stakeholders',
    descriptionRu: 'Инвестиционные стейкхолдеры',
    color: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
  },
};

/**
 * Single role scope badge with tooltip
 */
interface RoleScopeBadgeProps {
  code: string;
  className?: string;
}

export function RoleScopeBadge({ code, className }: RoleScopeBadgeProps) {
  const { language } = useLanguage();
  const isRussian = language === 'ru';
  
  const scope = ROLE_SCOPE_CODES[code];
  
  if (!scope) {
    return (
      <Badge variant="outline" className={cn("text-xs", className)}>
        {code}
      </Badge>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge 
          variant="secondary" 
          className={cn("text-xs font-mono cursor-help", scope.color, className)}
        >
          {code}
        </Badge>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs">
        <p className="font-medium">{isRussian ? scope.labelRu : scope.labelEn}</p>
        <p className="text-xs text-muted-foreground">
          {isRussian ? scope.descriptionRu : scope.descriptionEn}
        </p>
      </TooltipContent>
    </Tooltip>
  );
}

/**
 * Multiple role scope badges
 */
interface RoleScopeDisplayProps {
  scopes: string[];
  className?: string;
}

export function RoleScopeDisplay({ scopes, className }: RoleScopeDisplayProps) {
  if (!scopes || scopes.length === 0) {
    return null;
  }

  return (
    <div className={cn("flex flex-wrap gap-1", className)}>
      {scopes.map((code) => (
        <RoleScopeBadge key={code} code={code} />
      ))}
    </div>
  );
}

/**
 * Full legend popover explaining all role scopes
 */
interface RoleScopeLegendProps {
  className?: string;
}

export function RoleScopeLegend({ className }: RoleScopeLegendProps) {
  const { language } = useLanguage();
  const isRussian = language === 'ru';

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className={cn("gap-1.5 text-muted-foreground", className)}
        >
          <HelpCircle className="w-4 h-4" />
          <span className="text-xs">
            {isRussian ? 'Роли' : 'Roles'}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-3">
          <h4 className="font-medium text-sm">
            {isRussian ? 'Обозначения ролей' : 'Role Scope Legend'}
          </h4>
          <p className="text-xs text-muted-foreground">
            {isRussian 
              ? 'Эти коды обозначают, для каких ролей доступен контент'
              : 'These codes indicate which roles can access the content'
            }
          </p>
          
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(ROLE_SCOPE_CODES).map(([code, scope]) => (
              <div 
                key={code}
                className="flex items-center gap-2 p-1.5 rounded-md hover:bg-muted/50"
              >
                <Badge 
                  variant="secondary" 
                  className={cn("text-xs font-mono w-6 justify-center", scope.color)}
                >
                  {code}
                </Badge>
                <span className="text-xs">
                  {isRussian ? scope.labelRu : scope.labelEn}
                </span>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground">
              {isRussian 
                ? 'Несколько кодов = доступно для всех указанных ролей'
                : 'Multiple codes = accessible to all listed roles'
              }
            </p>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

/**
 * Compact inline legend for headers
 */
export function RoleScopeLegendInline({ className }: { className?: string }) {
  const { language } = useLanguage();
  const isRussian = language === 'ru';

  return (
    <div className={cn("flex items-center gap-2 text-xs text-muted-foreground", className)}>
      <span>{isRussian ? 'Роли:' : 'Scopes:'}</span>
      <div className="flex gap-1">
        {['G', 'U', 'V', 'O', 'A'].map((code) => (
          <RoleScopeBadge key={code} code={code} />
        ))}
      </div>
      <RoleScopeLegend />
    </div>
  );
}
