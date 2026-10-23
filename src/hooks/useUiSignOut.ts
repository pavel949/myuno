import { useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { toast } from 'sonner';

/** UI adapter only. AuthContext retains the rejecting server-revocation contract. */
export function useUiSignOut(): () => Promise<boolean> {
  const { signOut } = useAuth();
  const { language } = useLanguage();
  return useCallback(async () => {
    try {
      await signOut();
      return true;
    } catch {
      toast.error(language === 'ru'
        ? 'Не удалось подтвердить выход. Попробуйте ещё раз.'
        : language === 'th'
          ? 'ยืนยันการออกจากระบบไม่สำเร็จ โปรดลองอีกครั้ง'
          : 'Sign-out could not be confirmed. Please try again.');
      return false;
    }
  }, [signOut, language]);
}
