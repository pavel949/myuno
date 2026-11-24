import { useState, useEffect } from 'react';
import { KeyRound, Smartphone, Monitor, Trash2, ChevronRight, Pencil, RotateCcw } from 'lucide-react';
import { SectionCard } from '@/components/uno/SectionCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { usePinManagement } from '@/hooks/usePinManagement';
import { PinManagementDialog } from './PinManagementDialog';
import { LoadingSpinner } from '@/components/uno/LoadingSpinner';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const texts = {
  ru: {
    changePassword: 'Сменить пароль',
    changePasswordDesc: 'Обновить пароль для входа',
    pinSettings: 'PIN-код для входа',
    pinSettingsDesc: 'Быстрый вход по 4-значному коду',
    newPassword: 'Новый пароль',
    confirmPassword: 'Подтвердите пароль',
    save: 'Сохранить',
    cancel: 'Отмена',
    passwordChanged: 'Пароль успешно изменён',
    passwordError: 'Ошибка смены пароля',
    passwordMismatch: 'Пароли не совпадают',
    logoutAll: 'Выйти со всех устройств',
    logoutAllSuccess: 'Вы вышли со всех устройств',
    configured: 'Настроен',
    notConfigured: 'Не настроен',
    setupPin: 'Настроить PIN',
    changePin: 'Изменить PIN',
    resetPin: 'Сбросить PIN',
    disablePin: 'Отключить PIN',
  },
  en: {
    changePassword: 'Change Password',
    changePasswordDesc: 'Update the password you use to sign in',
    pinSettings: 'PIN Login',
    pinSettingsDesc: 'Quick login with 4-digit code',
    newPassword: 'New Password',
    confirmPassword: 'Confirm Password',
    save: 'Save',
    cancel: 'Cancel',
    passwordChanged: 'Password changed successfully',
    passwordError: 'Error changing password',
    passwordMismatch: 'Passwords do not match',
    logoutAll: 'Sign out all devices',
    logoutAllSuccess: 'Signed out from all devices',
    configured: 'Configured',
    notConfigured: 'Not configured',
    setupPin: 'Set up PIN',
    changePin: 'Change PIN',
    resetPin: 'Reset PIN',
    disablePin: 'Disable PIN',
  },
};

type PinDialogMode = 'setup' | 'change' | 'reset' | 'disable' | null;

export function SecuritySettingsSection() {
  const { language } = useLanguage();
  const { signOut } = useAuth();
  const { hasPin, isLoading: pinLoading, checkHasPin } = usePinManagement();
  const t = texts[language === 'th' ? 'en' : language] || texts.en;
  
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [pinDialogMode, setPinDialogMode] = useState<PinDialogMode>(null);
  const [passwordForm, setPasswordForm] = useState({
    newPassword: '',
    confirmPassword: '',
  });

  // Check PIN status on mount
  useEffect(() => {
    checkHasPin();
  }, [checkHasPin]);

  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error(t.passwordMismatch);
      return;
    }
    
    setIsChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.newPassword,
      });
      
      if (error) throw error;
      
      toast.success(t.passwordChanged);
      setPasswordDialogOpen(false);
      setPasswordForm({ newPassword: '', confirmPassword: '' });
    } catch (error: unknown) {
      toast.error(t.passwordError);
      console.error('Password change error:', error);
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleLogoutAllDevices = async () => {
    try {
      await signOut(); // Uses AuthContext signOut which clears caches
      toast.success(t.logoutAllSuccess);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handlePinAction = (action: PinDialogMode) => {
    setPinDialogMode(action);
  };

  const menuItems = [
    {
      icon: KeyRound,
      label: t.changePassword,
      description: t.changePasswordDesc,
      action: () => setPasswordDialogOpen(true),
      badge: null,
    },
    {
      icon: Smartphone,
      label: t.pinSettings,
      description: t.pinSettingsDesc,
      action: hasPin ? undefined : () => handlePinAction('setup'),
      badge: pinLoading ? '...' : (hasPin ? t.configured : t.notConfigured),
      badgeColor: hasPin ? 'text-success bg-success/10' : 'text-muted-foreground bg-muted',
      hasDropdown: hasPin,
      dropdownItems: hasPin ? [
        { label: t.changePin, action: () => handlePinAction('change'), icon: Pencil },
        { label: t.resetPin, action: () => handlePinAction('reset'), icon: RotateCcw },
        { label: t.disablePin, action: () => handlePinAction('disable'), icon: Trash2, destructive: true },
      ] : undefined,
    },
    {
      icon: Monitor,
      label: t.logoutAll,
      description: language === 'ru' ? 'Завершает сеансы, включая этот' : 'Ends sessions, including this one',
      action: handleLogoutAllDevices,
      badge: null,
    },
  ];

  return (
    <>
      <SectionCard noPadding className="overflow-hidden divide-y divide-border">
        {menuItems.map((item, index) => (
          item.hasDropdown ? (
            <DropdownMenu key={index}>
              <DropdownMenuTrigger asChild>
                <button type="button" className="w-full flex items-center gap-3 p-3 sm:p-4 hover:bg-secondary/50 transition-colors text-left">
                  <item.icon className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                      {item.badge && (
                        <span className={`mt-1 inline-block text-xs px-2 py-0.5 ${item.badgeColor}`}>
                          {item.badge}
                        </span>
                      )}
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {item.dropdownItems?.map((dropdownItem, dropdownIndex) => (
                  <DropdownMenuItem 
                    key={dropdownIndex}
                    onClick={dropdownItem.action}
                    className={dropdownItem.destructive ? 'text-destructive focus:text-destructive' : ''}
                  >
                    <dropdownItem.icon className="w-4 h-4 mr-2" />
                    {dropdownItem.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <button
              key={index}
              type="button"
              onClick={item.action}
              className="w-full flex items-center gap-3 p-3 sm:p-4 hover:bg-secondary/50 transition-colors text-left"
            >
              <item.icon className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.description}</p>
              {item.badge && (
                <span className={`mt-1 inline-block text-xs px-2 py-0.5 ${item.badgeColor}`}>
                  {item.badge}
                </span>
              )}
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            </button>
          )
        ))}
        
      </SectionCard>

      {/* Change Password Dialog */}
      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.changePassword}</DialogTitle>
            <DialogDescription>{t.changePasswordDesc}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="profile-new-password">{t.newPassword}</Label>
              <Input
                id="profile-new-password" type="password" autoComplete="new-password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="profile-confirm-password">{t.confirmPassword}</Label>
              <Input
                id="profile-confirm-password" type="password" autoComplete="new-password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPasswordDialogOpen(false)}>{t.cancel}</Button>
            <Button onClick={handleChangePassword} disabled={isChangingPassword}>
              {isChangingPassword ? <LoadingSpinner size="sm" /> : t.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PIN Management Dialog */}
      <PinManagementDialog
        mode={pinDialogMode}
        onClose={() => setPinDialogMode(null)}
        onSuccess={() => checkHasPin()}
      />
    </>
  );
}
