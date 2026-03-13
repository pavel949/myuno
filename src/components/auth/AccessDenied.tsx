import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { APP_ROUTES } from '@/lib/config/routes';
import { useLanguage } from '@/contexts/LanguageContext';
import { useUserContext } from '@/hooks/useUserContext';
import { useAuth } from '@/contexts/AuthContext';
import { type AppRole, ROLE_METADATA, SELF_ACTIVATABLE_ROLES } from '@/types/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  ArrowLeft, 
  Home, 
  LogIn, 
  UserPlus,
  AlertCircle,
  ArrowRight,
  Store,
  Building2,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AccessDeniedProps {
  requiredRoles: AppRole[];
  currentPath?: string;
  className?: string;
}

/**
 * Informative access denied page that explains:
 * - What role is required
 * - What the user's current role is
 * - How to get access (if possible)
 */
export function AccessDenied({ requiredRoles, currentPath, className }: AccessDeniedProps) {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { user } = useAuth();
  const { activeRole, hasRole } = useUserContext();
  
  const isRussian = language === 'ru';

  // Get the primary required role for messaging
  const primaryRequiredRole = requiredRoles[0];
  const requiredMeta = primaryRequiredRole ? ROLE_METADATA[primaryRequiredRole] : null;
  const currentMeta = ROLE_METADATA[activeRole] || ROLE_METADATA.guest;

  // Check if any required role can be self-activated
  const canSelfActivate = requiredRoles.some(role => SELF_ACTIVATABLE_ROLES.includes(role));
  
  // Determine the onboarding path based on required role
  const getOnboardingPath = () => {
    if (requiredRoles.includes('vendor') || requiredRoles.includes('partner')) {
      return '/vendor/onboarding';
    }
    if (requiredRoles.includes('owner')) {
      return '/owner/onboarding';
    }
    return null;
  };

  const onboardingPath = getOnboardingPath();

  // Role icon mapping
  const getRoleIcon = (role: AppRole) => {
    switch (role) {
      case 'vendor':
      case 'partner':
        return Store;
      case 'owner':
        return Building2;
      case 'admin':
      case 'staff':
      case 'uno_team':
        return Shield;
      default:
        return User;
    }
  };

  const RequiredIcon = primaryRequiredRole ? getRoleIcon(primaryRequiredRole) : Shield;

  return (
    <div className={cn(
      "min-h-[60vh] flex items-center justify-center p-4",
      className
    )}>
      <Card className="max-w-md w-full border-destructive/20">
        <CardHeader className="text-center space-y-4">
          {/* Icon */}
          <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-destructive" />
          </div>
          
          <CardTitle className="text-xl">
            {isRussian ? 'Доступ ограничен' : 'Access Restricted'}
          </CardTitle>
          
          <CardDescription className="text-base">
            {isRussian 
              ? 'У вас нет прав для просмотра этой страницы'
              : 'You don\'t have permission to view this page'
            }
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Role comparison */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            {/* Current role */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {isRussian ? 'Ваша роль:' : 'Your role:'}
              </span>
              <Badge variant="secondary" className="flex items-center gap-1.5">
                <User className="w-3 h-3" />
                {isRussian ? currentMeta.labelRu : currentMeta.labelEn}
              </Badge>
            </div>

            {/* Required role */}
            {requiredMeta && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {isRussian ? 'Требуется:' : 'Required:'}
                </span>
                <Badge variant="outline" className="flex items-center gap-1.5 border-primary/50">
                  <RequiredIcon className="w-3 h-3" />
                  {isRussian ? requiredMeta.labelRu : requiredMeta.labelEn}
                </Badge>
              </div>
            )}
          </div>

          {/* Action section */}
          <div className="space-y-3">
            {!user ? (
              /* Not logged in - show login/signup options */
              <>
                <p className="text-sm text-muted-foreground text-center">
                  {isRussian 
                    ? 'Войдите в аккаунт, чтобы получить доступ'
                    : 'Sign in to your account to access this page'
                  }
                </p>
                <div className="flex gap-2">
                  <Button asChild className="flex-1">
                    <Link to="/auth" state={{ from: currentPath }}>
                      <LogIn className="w-4 h-4 mr-2" />
                      {isRussian ? 'Войти' : 'Sign In'}
                    </Link>
                  </Button>
                  <Button variant="outline" asChild className="flex-1">
                    <Link to="/auth?mode=signup">
                      <UserPlus className="w-4 h-4 mr-2" />
                      {isRussian ? 'Регистрация' : 'Sign Up'}
                    </Link>
                  </Button>
                </div>
              </>
            ) : canSelfActivate && onboardingPath ? (
              /* Can self-activate - show onboarding path */
              <>
                <p className="text-sm text-muted-foreground text-center">
                  {isRussian 
                    ? 'Вы можете получить эту роль, завершив регистрацию'
                    : 'You can get this role by completing registration'
                  }
                </p>
                <Button asChild className="w-full">
                  <Link to={onboardingPath}>
                    {isRussian ? 'Начать регистрацию' : 'Start Registration'}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </>
            ) : (
              /* Admin-only role - show contact info */
              <>
                <p className="text-sm text-muted-foreground text-center">
                  {isRussian 
                    ? 'Эта роль требует подтверждения администратора'
                    : 'This role requires administrator approval'
                  }
                </p>
                <Button variant="outline" className="w-full" disabled>
                  {isRussian ? 'Свяжитесь с поддержкой' : 'Contact Support'}
                </Button>
              </>
            )}
          </div>

          {/* Navigation */}
          <div className="flex gap-2 pt-2 border-t">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(APP_ROUTES.HOME)}
              className="flex-1"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {isRussian ? 'Назад' : 'Go Back'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="flex-1"
            >
              <Link to="/">
                <Home className="w-4 h-4 mr-2" />
                {isRussian ? 'На главную' : 'Home'}
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Inline role gate for embedding within pages
 * Shows a compact message instead of full-page denial
 */
interface RoleRequiredGateProps {
  requiredRoles: AppRole[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function RoleRequiredGate({ requiredRoles, children, fallback }: RoleRequiredGateProps) {
  const { hasRole, isLoading } = useUserContext();
  const { language } = useLanguage();
  
  const isRussian = language === 'ru';

  if (isLoading) {
    return null;
  }

  const hasAccess = requiredRoles.some(role => hasRole(role));

  if (hasAccess) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  // Default inline gate
  const primaryRole = requiredRoles[0];
  const meta = primaryRole ? ROLE_METADATA[primaryRole] : null;

  return (
    <div className="rounded-lg border border-dashed border-muted-foreground/25 p-6 text-center">
      <Shield className="w-8 h-8 mx-auto mb-3 text-muted-foreground/50" />
      <p className="text-sm text-muted-foreground">
        {isRussian ? 'Требуется роль: ' : 'Requires role: '}
        <span className="font-medium text-foreground">
          {meta ? (isRussian ? meta.labelRu : meta.labelEn) : primaryRole}
        </span>
      </p>
    </div>
  );
}
