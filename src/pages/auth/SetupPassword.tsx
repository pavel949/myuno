/**
 * SetupPassword — landing for users who arrive via an admin email invite
 * (Supabase auth.admin.inviteUserByEmail). Supabase auto-creates the session
 * when the invite token resolves, so by the time the component mounts the
 * user is already signed in but has no password set. We collect the password,
 * call supabase.auth.updateUser, then drop them on the main page.
 *
 * If somehow the page loads without a session (token expired, link reused,
 * direct navigation), we explain the situation and offer a path back to
 * the public /auth signup flow.
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { cn } from '@/lib/utils';

const passwordSchema = z.string().min(8, 'Password must be at least 8 characters');

export default function SetupPassword() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { language } = useLanguage();
  const isRu = language === 'ru';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const meta = (user?.user_metadata ?? {}) as Record<string, unknown>;
  const fullName = (meta.full_name as string | undefined) ?? '';
  const inviteRole = (meta.role as string | undefined) ?? null;

  useEffect(() => {
    if (!authLoading && user && (meta.password_set === true)) {
      navigate('/', { replace: true });
    }
  }, [authLoading, user, meta.password_set, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const parsed = passwordSchema.safeParse(password);
    if (!parsed.success) {
      setErrors({ password: isRu ? 'Минимум 8 символов' : 'At least 8 characters' });
      return;
    }
    if (password !== confirmPassword) {
      setErrors({ confirmPassword: isRu ? 'Пароли не совпадают' : 'Passwords do not match' });
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password,
        data: { password_set: true },
      });
      if (error) throw error;
      toast.success(
        isRu ? 'Пароль создан' : 'Password set',
        { description: isRu ? 'Добро пожаловать в myUNO' : 'Welcome to myUNO' },
      );
      navigate('/', { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      toast.error(
        isRu ? 'Не удалось сохранить пароль' : 'Could not save password',
        { description: message },
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <AppLayout showHeader={false} showFooter={false} showBottomNav={false}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-muted-foreground text-sm">
            {isRu ? 'Подождите…' : 'Loading…'}
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
                {isRu ? 'Ссылка-приглашение не активна' : 'Invite link not active'}
              </p>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {isRu
                  ? 'Сессия не найдена. Возможно, ссылка устарела или уже использована. Зарегистрируйтесь обычным способом или попросите администратора отправить новое приглашение.'
                  : 'No active session. The invite link may have expired or already been used. Please sign up the normal way or ask the administrator to resend the invitation.'}
              </p>
            </div>
          </div>
          <PremiumButton
            onClick={() => navigate(`${APP_ROUTES.AUTH}?mode=signup`)}
            className="w-full"
          >
            {isRu ? 'Перейти к регистрации' : 'Go to sign-up'}
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
            {isRu ? 'Приглашение принято' : 'Invitation accepted'}
          </p>
          <p className="mt-1 text-foreground font-semibold">
            {fullName
              ? (isRu ? `Здравствуйте, ${fullName}!` : `Welcome, ${fullName}!`)
              : (isRu ? 'Здравствуйте!' : 'Welcome!')}
          </p>
          <p className="mt-1 text-[13px] text-muted-foreground leading-relaxed">
            {isRu
              ? 'Email подтверждён. Создайте пароль, чтобы войти в систему.'
              : 'Your email is verified. Create a password to access the system.'}
            {inviteRole && (
              <>
                {' '}
                <span className="text-foreground">
                  {isRu ? `Роль: ${inviteRole}.` : `Role: ${inviteRole}.`}
                </span>
              </>
            )}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <UnderlineInput
              label={isRu ? 'Новый пароль' : 'New password'}
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
              aria-label={isRu ? (showPassword ? 'Скрыть пароль' : 'Показать пароль') : (showPassword ? 'Hide password' : 'Show password')}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <PasswordStrengthIndicator password={password} />

          <UnderlineInput
            label={isRu ? 'Повторите пароль' : 'Confirm password'}
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
              ? (isRu ? 'Сохраняем…' : 'Saving…')
              : (isRu ? 'Сохранить и войти' : 'Save & continue')}
          </PremiumButton>
        </form>
      </div>
    </AppLayout>
  );
}
