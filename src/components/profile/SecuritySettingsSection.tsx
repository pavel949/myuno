import { useState } from 'react';
import { KeyRound, Smartphone, Monitor, Trash2, ChevronRight, Shield } from 'lucide-react';
import { motion } from 'framer-motion';
import { SectionCard } from '@/components/uno/SectionCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { LoadingSpinner } from '@/components/uno/LoadingSpinner';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const texts = {
  ru: {
    sectionTitle: 'Безопасность',
    changePassword: 'Сменить пароль',
    changePasswordDesc: 'Рекомендуем менять пароль раз в 3 месяца',
    pinSettings: 'PIN-код для входа',
    pinSettingsDesc: 'Быстрый вход по 4-значному коду',
    activeSessions: 'Активные сессии',
    activeSessionsDesc: 'Управление устройствами',
    deleteAccount: 'Удалить аккаунт',
    deleteAccountDesc: 'Безвозвратное удаление всех данных',
    currentPassword: 'Текущий пароль',
    newPassword: 'Новый пароль',
    confirmPassword: 'Подтвердите пароль',
    save: 'Сохранить',
    cancel: 'Отмена',
    passwordChanged: 'Пароль успешно изменён',
    passwordError: 'Ошибка смены пароля',
    passwordMismatch: 'Пароли не совпадают',
    deleteConfirmTitle: 'Удалить аккаунт?',
    deleteConfirmDesc: 'Это действие необратимо. Все ваши данные, бронирования и баланс кошелька будут удалены.',
    deleteConfirm: 'Да, удалить',
    thisDevice: 'Это устройство',
    logoutAll: 'Выйти со всех устройств',
    logoutAllSuccess: 'Вы вышли со всех устройств',
    configured: 'Настроен',
    notConfigured: 'Не настроен',
  },
  en: {
    sectionTitle: 'Security',
    changePassword: 'Change Password',
    changePasswordDesc: 'We recommend changing your password every 3 months',
    pinSettings: 'PIN Login',
    pinSettingsDesc: 'Quick login with 4-digit code',
    activeSessions: 'Active Sessions',
    activeSessionsDesc: 'Manage your devices',
    deleteAccount: 'Delete Account',
    deleteAccountDesc: 'Permanently delete all your data',
    currentPassword: 'Current Password',
    newPassword: 'New Password',
    confirmPassword: 'Confirm Password',
    save: 'Save',
    cancel: 'Cancel',
    passwordChanged: 'Password changed successfully',
    passwordError: 'Error changing password',
    passwordMismatch: 'Passwords do not match',
    deleteConfirmTitle: 'Delete account?',
    deleteConfirmDesc: 'This action is irreversible. All your data, bookings, and wallet balance will be deleted.',
    deleteConfirm: 'Yes, delete',
    thisDevice: 'This device',
    logoutAll: 'Sign out all devices',
    logoutAllSuccess: 'Signed out from all devices',
    configured: 'Configured',
    notConfigured: 'Not configured',
  },
};

export function SecuritySettingsSection() {
  const { language } = useLanguage();
  const { signOut } = useAuth();
  const t = texts[language === 'th' ? 'en' : language] || texts.en;
  
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    newPassword: '',
    confirmPassword: '',
  });
  
  const hasPinConfigured = !!localStorage.getItem('uno_pin_enabled');

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
    } catch (error: any) {
      toast.error(t.passwordError);
      console.error('Password change error:', error);
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleLogoutAllDevices = async () => {
    try {
      await supabase.auth.signOut({ scope: 'global' });
      toast.success(t.logoutAllSuccess);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleDeleteAccount = async () => {
    // This would typically call an edge function to handle account deletion
    toast.error('Contact support to delete your account');
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
      action: () => {},
      badge: hasPinConfigured ? t.configured : t.notConfigured,
      badgeColor: hasPinConfigured ? 'text-green-600 bg-green-100' : 'text-muted-foreground bg-muted',
    },
    {
      icon: Monitor,
      label: t.activeSessions,
      description: t.activeSessionsDesc,
      action: handleLogoutAllDevices,
      badge: t.thisDevice,
      badgeColor: 'text-blue-600 bg-blue-100',
    },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
      <div className="flex items-center gap-2 mb-3 text-sm font-medium text-muted-foreground">
        <Shield className="w-4 h-4" />
        {t.sectionTitle}
      </div>
      <SectionCard noPadding className="overflow-hidden divide-y divide-border">
        {menuItems.map((item, index) => (
          <button
            key={index}
            onClick={item.action}
            className="w-full flex items-center gap-3 p-4 hover:bg-secondary/50 transition-colors text-left"
          >
            <item.icon className="w-5 h-5 text-muted-foreground flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{item.label}</p>
              <p className="text-xs text-muted-foreground">{item.description}</p>
            </div>
            {item.badge && (
              <span className={`text-xs px-2 py-0.5 rounded-full ${item.badgeColor}`}>
                {item.badge}
              </span>
            )}
            <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          </button>
        ))}
        
        {/* Delete Account */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <button className="w-full flex items-center gap-3 p-4 hover:bg-destructive/10 transition-colors text-left">
              <Trash2 className="w-5 h-5 text-destructive flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-destructive">{t.deleteAccount}</p>
                <p className="text-xs text-muted-foreground">{t.deleteAccountDesc}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-destructive flex-shrink-0" />
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t.deleteConfirmTitle}</AlertDialogTitle>
              <AlertDialogDescription>{t.deleteConfirmDesc}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteAccount} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                {t.deleteConfirm}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
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
              <Label>{t.newPassword}</Label>
              <Input
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                className="mt-1"
              />
            </div>
            <div>
              <Label>{t.confirmPassword}</Label>
              <Input
                type="password"
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
    </motion.div>
  );
}
