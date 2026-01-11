import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useUserRoles, useActiveRole, ROLE_CONFIG, AppRole, ACTIVATABLE_ROLES } from '@/hooks/useUserRoles';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { User, Building2, Store, ChevronRight, Plus, Check, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const ROLE_ICONS: Record<string, React.ElementType> = {
  User: User,
  Building2: Building2,
  Store: Store,
};

interface RoleSwitcherProps {
  compact?: boolean;
}

export function RoleSwitcher({ compact = false }: RoleSwitcherProps) {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { activeRoles, switchableRoles, hasRole, addRole, isAddingRole } = useUserRoles();
  const { activeRole, setActiveRole } = useActiveRole();
  const [open, setOpen] = useState(false);
  const [_, forceUpdate] = useState(0);
  
  const isRu = language === 'ru';

  // Listen for role changes
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'uno-active-role') {
        forceUpdate(n => n + 1);
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const handleSwitchRole = (role: AppRole) => {
    setActiveRole(role);
    setOpen(false);
    
    const config = ROLE_CONFIG[role];
    toast.success(isRu ? `Режим: ${config.labelRu}` : `Mode: ${config.labelEn}`);
    navigate(config.path);
  };

  const handleActivateRole = async (role: AppRole) => {
    try {
      await addRole(role);
      toast.success(isRu ? 'Роль активирована!' : 'Role activated!');
      handleSwitchRole(role);
    } catch (error) {
      toast.error(isRu ? 'Ошибка активации роли' : 'Error activating role');
    }
  };

  const currentConfig = ROLE_CONFIG[activeRole] || ROLE_CONFIG.user;
  const CurrentIcon = ROLE_ICONS[currentConfig.icon] || User;

  // Compact version for header
  if (compact) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-2 h-8 px-2">
            <div className={cn(
              "w-6 h-6 rounded-md flex items-center justify-center bg-gradient-to-br",
              currentConfig.color
            )}>
              <CurrentIcon className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-xs font-medium hidden sm:inline">
              {isRu ? currentConfig.labelRu : currentConfig.labelEn}
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
          </Button>
        </DialogTrigger>
        <RoleSwitcherContent
          activeRole={activeRole}
          switchableRoles={switchableRoles}
          hasRole={hasRole}
          onSwitch={handleSwitchRole}
          onActivate={handleActivateRole}
          isActivating={isAddingRole}
          isRu={isRu}
        />
      </Dialog>
    );
  }

  // Full version for profile page
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">
          {isRu ? 'Ваши роли' : 'Your Roles'}
        </h3>
        <Badge variant="secondary" className="text-xs">
          {activeRoles.length} {isRu ? 'активных' : 'active'}
        </Badge>
      </div>

      {/* Current Role */}
      <div className="mb-4">
        <p className="text-xs text-muted-foreground mb-2">
          {isRu ? 'Текущий режим' : 'Current mode'}
        </p>
        <div className={cn(
          "flex items-center gap-3 p-3 rounded-xl border-2 border-primary/30 bg-primary/5"
        )}>
          <div className={cn(
            "w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br",
            currentConfig.color
          )}>
            <CurrentIcon className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="font-medium">
              {isRu ? currentConfig.labelRu : currentConfig.labelEn}
            </p>
            {currentConfig.description && (
              <p className="text-xs text-muted-foreground">
                {isRu ? currentConfig.description.ru : currentConfig.description.en}
              </p>
            )}
          </div>
          <Check className="w-5 h-5 text-primary" />
        </div>
      </div>

      {/* Switch Role */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="w-full gap-2">
            <ArrowRight className="w-4 h-4" />
            {isRu ? 'Переключить роль' : 'Switch Role'}
          </Button>
        </DialogTrigger>
        <RoleSwitcherContent
          activeRole={activeRole}
          switchableRoles={switchableRoles}
          hasRole={hasRole}
          onSwitch={handleSwitchRole}
          onActivate={handleActivateRole}
          isActivating={isAddingRole}
          isRu={isRu}
        />
      </Dialog>
    </Card>
  );
}

function RoleSwitcherContent({
  activeRole,
  switchableRoles,
  hasRole,
  onSwitch,
  onActivate,
  isActivating,
  isRu,
}: {
  activeRole: AppRole;
  switchableRoles: AppRole[];
  hasRole: (role: AppRole) => boolean;
  onSwitch: (role: AppRole) => void;
  onActivate: (role: AppRole) => void;
  isActivating: boolean;
  isRu: boolean;
}) {
  // Always show user role + switchable roles
  const displayRoles: AppRole[] = ['user', ...switchableRoles.filter(r => r !== 'user')];
  
  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>
          {isRu ? 'Выберите режим' : 'Choose Mode'}
        </DialogTitle>
      </DialogHeader>
      
      <div className="space-y-2 mt-4">
        {/* Existing roles */}
        {displayRoles.map((role) => {
          const config = ROLE_CONFIG[role];
          const Icon = ROLE_ICONS[config.icon] || User;
          const isActive = activeRole === role;
          
          return (
            <button
              key={role}
              onClick={() => onSwitch(role)}
              className={cn(
                "w-full flex items-center gap-3 p-3 rounded-xl border transition-all",
                isActive 
                  ? "border-primary bg-primary/5" 
                  : "border-border hover:border-primary/30 hover:bg-muted/50"
              )}
            >
              <div className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br",
                config.color
              )}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-medium">
                  {isRu ? config.labelRu : config.labelEn}
                </p>
                {config.description && (
                  <p className="text-xs text-muted-foreground">
                    {isRu ? config.description.ru : config.description.en}
                  </p>
                )}
              </div>
              {isActive && <Check className="w-5 h-5 text-primary" />}
            </button>
          );
        })}

        {/* Activatable roles */}
        {ACTIVATABLE_ROLES.filter(role => !hasRole(role)).map((role) => {
          const config = ROLE_CONFIG[role];
          const Icon = ROLE_ICONS[config.icon] || User;
          
          return (
            <button
              key={role}
              onClick={() => onActivate(role)}
              disabled={isActivating}
              className="w-full flex items-center gap-3 p-3 rounded-xl border border-dashed border-muted-foreground/30 hover:border-primary/50 hover:bg-muted/30 transition-all"
            >
              <div className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br opacity-60",
                config.color
              )}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-medium text-muted-foreground">
                  {isRu ? config.labelRu : config.labelEn}
                </p>
                <p className="text-xs text-muted-foreground">
                  {isRu ? 'Нажмите чтобы стать' : 'Click to become'}
                </p>
              </div>
              <Plus className="w-5 h-5 text-muted-foreground" />
            </button>
          );
        })}
      </div>
    </DialogContent>
  );
}
