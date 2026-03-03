import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useUserContext, type AppRole } from '@/hooks/useUserContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  User,
  Store,
  Building2,
  Shield,
  UserCog,
  Home,
  ChevronRight,
  Check,
  Plus,
} from 'lucide-react';

interface RoleCardConfig {
  key: AppRole;
  labelEn: string;
  labelRu: string;
  descEn: string;
  descRu: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  path: string;
}

const ROLE_CARDS: RoleCardConfig[] = [
  {
    key: 'user',
    labelEn: 'Buyer',
    labelRu: 'Покупатель',
    descEn: 'Orders, bookings & services',
    descRu: 'Заказы, брони и услуги',
    icon: User,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    path: '/account',
  },
  {
    key: 'owner',
    labelEn: 'Property Owner',
    labelRu: 'Собственник',
    descEn: 'My property & services',
    descRu: 'Мой объект и сервисы',
    icon: Building2,
    color: 'text-teal-600',
    bgColor: 'bg-teal-100 dark:bg-teal-900/30',
    path: '/owner',
  },
  {
    key: 'vendor',
    labelEn: 'Service Provider',
    labelRu: 'Поставщик услуг',
    descEn: 'Manage services & orders',
    descRu: 'Управление услугами',
    icon: Store,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    path: '/vendor',
  },
  {
    key: 'admin',
    labelEn: 'Administrator',
    labelRu: 'Администратор',
    descEn: 'Platform management',
    descRu: 'Управление платформой',
    icon: Shield,
    color: 'text-destructive',
    bgColor: 'bg-destructive/10',
    path: '/admin',
  },
  {
    key: 'uno_team',
    labelEn: 'myUNO Team',
    labelRu: 'Команда myUNO',
    descEn: 'Content & operations',
    descRu: 'Контент и операции',
    icon: UserCog,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
    path: '/team',
  },
];

interface AccountRolesBlockProps {
  showCTA?: boolean;
}

export function AccountRolesBlock({ showCTA = true }: AccountRolesBlockProps) {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { availableRoles, activeRole, switchContext, isSwitching } = useUserContext();
  const isRussian = language === 'ru';

  // Filter to only show available roles
  const visibleRoles = ROLE_CARDS.filter(role => availableRoles.includes(role.key));

  const handleRoleSwitch = async (role: RoleCardConfig) => {
    if (role.key === activeRole) {
      // Already active, just navigate
      navigate(role.path);
      return;
    }

    await switchContext({ role: role.key });
    navigate(role.path);
  };

  // Check if user can become owner or vendor
  const canBecomeOwner = !availableRoles.includes('owner');
  const canBecomeVendor = !availableRoles.includes('vendor');
  const showBecomePartner = showCTA && (canBecomeOwner || canBecomeVendor);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center justify-between">
          <span>{isRussian ? 'Мои роли' : 'My Roles'}</span>
          <Badge variant="secondary" className="text-xs font-normal">
            {visibleRoles.length} {isRussian ? 'доступно' : 'available'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {visibleRoles.map((role) => {
          const Icon = role.icon;
          const isActive = role.key === activeRole;

          return (
            <button
              key={role.key}
              onClick={() => handleRoleSwitch(role)}
              disabled={isSwitching}
              className={cn(
                "w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left",
                "hover:bg-muted/50 active:scale-[0.98]",
                isActive && "bg-primary/5 ring-1 ring-primary/20"
              )}
            >
              <div className={cn("p-2.5 rounded-xl", role.bgColor)}>
                <Icon className={cn("h-5 w-5", role.color)} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">
                  {isRussian ? role.labelRu : role.labelEn}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {isRussian ? role.descRu : role.descEn}
                </p>
              </div>
              {isActive ? (
                <div className="flex items-center gap-1.5">
                  <Badge variant="default" className="text-[10px] px-1.5 py-0">
                    {isRussian ? 'Активна' : 'Active'}
                  </Badge>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
          );
        })}

        {showBecomePartner && (
          <Button
            variant="outline"
            className="w-full mt-3 border-dashed"
            onClick={() => navigate('/become-partner')}
          >
            <Plus className="h-4 w-4 mr-2" />
            {isRussian ? 'Стать партнёром' : 'Become a Partner'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
