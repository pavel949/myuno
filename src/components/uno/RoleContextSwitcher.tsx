import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useUserContext } from '@/hooks/useUserContext';
import type { AppRole } from '@/types/auth';
import { ROLE_METADATA } from '@/types/auth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Store, 
  Building2, 
  Shield, 
  UserCog,
  ChevronDown,
  Check,
  Headphones,
  Users,
} from 'lucide-react';

// Icon mapping for roles
const ROLE_ICONS: Partial<Record<AppRole, React.ComponentType<{ className?: string }>>> = {
  guest: User,
  user: User,
  vendor: Store,
  owner: Building2,
  property_owner: Building2,
  admin: Shield,
  staff: UserCog,
  uno_team: Headphones,
  partner: Users,
};

// Local role config for the switcher UI (only switchable roles need styling)
const ROLE_SWITCHER_CONFIG: Partial<Record<AppRole, {
  labelEn: string;
  labelRu: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  path: string;
}>> = {
  user: {
    labelEn: 'Client',
    labelRu: 'Клиент',
    icon: User,
    color: 'bg-info',
    path: '/',
  },
  vendor: {
    labelEn: 'Service Provider',
    labelRu: 'Поставщик услуг',
    icon: Store,
    color: 'bg-accent-purple',
    path: '/vendor',
  },
  owner: {
    labelEn: 'Owner / MC',
    labelRu: 'Владелец / УК',
    icon: Building2,
    color: 'bg-teal',
    path: '/owner',
  },
  admin: {
    labelEn: 'Admin',
    labelRu: 'Администратор',
    icon: Shield,
    color: 'bg-destructive',
    path: '/admin',
  },
  staff: {
    labelEn: 'Staff',
    labelRu: 'Сотрудник',
    icon: UserCog,
    color: 'bg-warning',
    path: '/admin',
  },
  uno_team: {
    labelEn: 'myUNO Team',
    labelRu: 'Команда myUNO',
    icon: Headphones,
    color: 'bg-success',
    path: '/team',
  },
};

// Default config fallback
const DEFAULT_ROLE_CONFIG = {
  labelEn: 'User',
  labelRu: 'Пользователь',
  icon: User,
  color: 'bg-info',
  path: '/',
};

interface RoleContextSwitcherProps {
  compact?: boolean;
}

/**
 * Role switcher component that uses database-backed context
 * instead of localStorage
 */
export function RoleContextSwitcher({ compact = false }: RoleContextSwitcherProps) {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { 
    activeRole, 
    availableRoles, 
    vendorOrgs,
    ownerOrgs,
    switchContext, 
    isSwitching,
    isLoading 
  } = useUserContext();

  const isRussian = language === 'ru';

  if (isLoading || availableRoles.length <= 1) {
    return null;
  }

  const currentConfig = ROLE_SWITCHER_CONFIG[activeRole] || DEFAULT_ROLE_CONFIG;
  const CurrentIcon = currentConfig.icon;

  const handleRoleSwitch = async (role: AppRole) => {
    // Get default org for the role
    let orgId: string | undefined;
    
    if (role === 'vendor' && vendorOrgs.length > 0) {
      orgId = vendorOrgs[0].org_id;
    } else if (role === 'owner' && ownerOrgs.length > 0) {
      orgId = ownerOrgs[0].org_id;
    }

    await switchContext({ role, orgId });
    
    // Navigate to role's default path
    const config = ROLE_SWITCHER_CONFIG[role];
    if (config) {
      navigate(config.path);
    } else {
      // Fallback to ROLE_METADATA
      const meta = ROLE_METADATA[role];
      if (meta) {
        navigate(meta.defaultPath);
      }
    }
  };

  if (compact) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="relative inline-flex items-center justify-center h-9 w-9 rounded-md hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-50 transition-colors"
            disabled={isSwitching}
          >
            <CurrentIcon className="h-5 w-5" />
            <span className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full ${currentConfig.color}`} />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>
            {isRussian ? 'Переключить роль' : 'Switch Role'}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {availableRoles.map((role) => {
            const config = ROLE_SWITCHER_CONFIG[role];
            if (!config) return null;
            const Icon = config.icon;
            const isActive = role === activeRole;
            
            return (
              <DropdownMenuItem
                key={role}
                onClick={() => handleRoleSwitch(role)}
                className="flex items-center gap-3"
                disabled={isSwitching}
              >
                <div className={`p-1.5 rounded-md ${config.color}`}>
                  <Icon className="h-4 w-4 text-white" />
                </div>
                <span className="flex-1">
                  {isRussian ? config.labelRu : config.labelEn}
                </span>
                {isActive && <Check className="h-4 w-4 text-primary" />}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button 
          className="flex items-center gap-2 h-10 px-3 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50"
          disabled={isSwitching}
        >
          <div className={`p-1 rounded ${currentConfig.color}`}>
            <CurrentIcon className="h-4 w-4 text-white" />
          </div>
          <span className="text-sm font-medium">
            {isRussian ? currentConfig.labelRu : currentConfig.labelEn}
          </span>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>{isRussian ? 'Активная роль' : 'Active Role'}</span>
          <Badge variant="secondary" className="text-xs">
            {availableRoles.length} {isRussian ? 'доступно' : 'available'}
          </Badge>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {availableRoles.map((role) => {
          const config = ROLE_SWITCHER_CONFIG[role];
          if (!config) return null;
          const Icon = config.icon;
          const isActive = role === activeRole;
          
          return (
            <DropdownMenuItem
              key={role}
              onClick={() => handleRoleSwitch(role)}
              className={`flex items-center gap-3 py-2.5 ${isActive ? 'bg-muted' : ''}`}
              disabled={isSwitching}
            >
              <div className={`p-2 rounded-lg ${config.color}`}>
                <Icon className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">
                  {isRussian ? config.labelRu : config.labelEn}
                </p>
              </div>
              {isActive && <Check className="h-4 w-4 text-primary" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
