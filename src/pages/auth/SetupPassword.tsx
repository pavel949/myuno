/**
 * SetupPassword — landing for users who arrive via an admin email invite
 * (Supabase auth.admin.inviteUserByEmail). Supabase auto-creates the session
 * when the invite token resolves, so by the time the component mounts the
 * user is already signed in but has no password set. We collect the password,
 * call supabase.auth.updateUser, then use the shared post-login routing.
 *
 * If somehow the page loads without a session (token expired, link reused,
 * direct navigation), we explain the situation and offer a path back to
 * existing-account sign-in and password recovery.
 */
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import { z } from 'zod';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { PremiumButton } from '@/components/uno/PremiumButton';
import { PasswordStrengthIndicator } from '@/components/auth/PasswordStrengthIndicator';
import { UnderlineInput } from '@/components/auth/UnderlineInput';
import { BrandWordmark } from '@/components/uno/BrandWordmark';
import { APP_ROUTES } from '@/lib/config/routes';
import { pickLang } from '@/lib/i18n/pickLang';
import { cn } from '@/lib/utils';
import { buildAuthPath } from '@/lib/auth/redirectToAuth';

const passwordSchema = z.string().min(8, 'Password must be at least 8 characters');

export default function SetupPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const continuePath = buildAuthPath({ from: searchParams.get('redirect') || '/' });
  const { user, isLoading: authLoading } = useAuth();
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const copy = (en: string, ru: string, th: string) => pickLang(language, { en, ru, th });
  const submittingRef = useRef(false);
  const actorRef = useRef(user?.id);
  actorRef.current = user?.id;
  const mountedRef = useRef(true);
  useEffect(() => { mountedRef.current = true; return () => { mountedRef.current = false; }; }, []);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const meta = (user?.user_metadata ?? {}) as Record<string, unknown>;
  const fullName = (meta.full_name as string | undefined) ?? '';

  useEffect(() => {
    if (!authLoading && user && (meta.password_set === true)) {
      navigate(continuePath, { replace: true });
    }
  }, [authLoading, user, meta.password_set, navigate, continuePath]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submittingRef.current || !user) return;
    setErrors({});

    const parsed = passwordSchema.safeParse(password);
    if (!parsed.success) {
      setErrors({ password: copy('At least 8 characters', 'Минимум 8 символов', 'อย่างน้อย 8 ตัวอักษร') });
      return;
    }
    if (password !== confirmPassword) {
      setErrors({ confirmPassword: copy('Passwords do not match', 'Пароли не совпадают', 'รหัสผ่านไม่ตรงกัน') });
      return;
    }

    submittingRef.current = true;
    const submittingActor = user.id;
    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password,
        data: { password_set: true },
      });
      if (error) throw error;
      if (!mountedRef.current || actorRef.current !== submittingActor) return;
      toast.success(
        copy('Password set', 'Пароль создан', 'ตั้งรหัสผ่านแล้ว'),
        { description: copy('Welcome to myUNO', 'Добро пожаловать в myUNO', 'ยินดีต้อนรับสู่ myUNO') },
      );
      navigate(continuePath, { replace: true });
    } catch (err) {
      if (!mountedRef.current || actorRef.current !== submittingActor) return;
      const message = err instanceof Error ? err.message : String(err);
      toast.error(
        copy('Could not save password', 'Не удалось сохранить пароль', 'บันทึกรหัสผ่านไม่สำเร็จ'),
        { description: message },
      );
    } finally {
      submittingRef.current = false;
      if (mountedRef.current) setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <AppLayout showHeader={false} showFooter={false} showBottomNav={false}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-muted-foreground text-sm">
            {copy('Loading…', 'Подождите…', 'กำลังโหลด…')}
          </p>
        </div>
      </AppLayout>
    );
  }

  if (!user) {
    return (
      <AppLayout showHeader={false} showFooter={false} showBottomNav={false}>
        <div className="max-w-md mx-auto px-4 py-12 space-y-6">
          <BrandWordmark as="static" />
          <div className="flex items-start gap-3 rounded-none border border-destructive/40 bg-destructive/5 p-4">
            <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div className="space-y-1.5">
              <p className="font-semibold text-foreground text-sm">
                {copy('Invite link not active', 'Ссылка-приглашение не активна', 'ลิงก์เชิญใช้งานไม่ได้')}
              </p>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {copy('No active session. The invite link may have expired or already been used. Sign in to your existing account or request a password reset using the invited email. Contact your administrator if you still cannot access it.', 'Сессия не найдена. Возможно, ссылка устарела или уже использована. Войдите в существующий аккаунт или запросите ссылку для установки пароля на тот же email. Если доступа нет, обратитесь к администратору.', 'ไม่พบเซสชัน ลิงก์เชิญอาจหมดอายุหรือถูกใช้แล้ว โปรดเข้าสู่บัญชีเดิมหรือตั้งรหัสผ่านใหม่ด้วยอีเมลที่ได้รับเชิญ หากยังเข้าไม่ได้ให้ติดต่อผู้ดูแล')}
              </p>
            </div>
          </div>
          <PremiumButton
            onClick={() => navigate(APP_ROUTES.AUTH_FORGOT_PASSWORD)}
            className="w-full"
          >
            {copy('Reset password by email', 'Установить пароль по email', 'ตั้งรหัสผ่านใหม่ทางอีเมล')}
          </PremiumButton>
          <PremiumButton variant="outline" onClick={() => navigate(continuePath)} className="w-full">
            {copy('Sign in', 'Войти в аккаунт', 'เข้าสู่ระบบ')}
          </PremiumButton>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout showHeader={false} showFooter={false} showBottomNav={false}>
      <div className="max-w-md mx-auto px-4 py-8 space-y-6">
        <BrandWordmark as="static" />

        <div className="rounded-none border border-primary/30 bg-primary/[0.04] p-4">
          <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground font-semibold">
            {copy('Invitation accepted', 'Приглашение принято', 'ยอมรับคำเชิญแล้ว')}
          </p>
          <p className="mt-1 text-foreground font-semibold">
            {fullName
              ? copy(`Welcome, ${fullName}!`, `Здравствуйте, ${fullName}!`, `ยินดีต้อนรับ ${fullName}!`)
              : (copy('Welcome!', 'Здравствуйте!', 'ยินดีต้อนรับ!'))}
          </p>
          <p className="mt-1 text-[13px] text-muted-foreground leading-relaxed">
            {copy('Create a password for your account.', 'Создайте пароль для вашего аккаунта.', 'ตั้งรหัสผ่านสำหรับบัญชีของคุณ')}

          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <UnderlineInput
              label={copy('New password', 'Новый пароль', 'รหัสผ่านใหม่')}
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={setPassword}
              autoComplete="new-password"
              error={errors.password}
              required
              minLength={8}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className={cn(
                'absolute right-0 top-1/2 -translate-y-1/2 p-2',
                'text-muted-foreground hover:text-foreground',
              )}
              aria-label={showPassword ? copy('Hide password', 'Скрыть пароль', 'ซ่อนรหัสผ่าน') : copy('Show password', 'Показать пароль', 'แสดงรหัสผ่าน')}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <PasswordStrengthIndicator password={password} />

          <UnderlineInput
            label={copy('Confirm password', 'Повторите пароль', 'ยืนยันรหัสผ่าน')}
            type={showPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={setConfirmPassword}
            autoComplete="new-password"
            error={errors.confirmPassword}
            required
            minLength={8}
          />

          <PremiumButton type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting
              ? (copy('Saving…', 'Сохраняем…', 'กำลังบันทึก…'))
              : (copy('Save & continue', 'Сохранить и войти', 'บันทึกและดำเนินการต่อ'))}
          </PremiumButton>
        </form>
      </div>
    </AppLayout>
  );
}
