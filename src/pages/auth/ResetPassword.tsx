import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff, CheckCircle, ArrowLeft, AlertCircle } from 'lucide-react';
import { z } from 'zod';
import { useLanguage } from '@/contexts/LanguageContext';
import { PremiumButton } from '@/components/uno/PremiumButton';
import { LanguageSwitcher } from '@/components/uno/LanguageSwitcher';
import { ThemeSwitcher } from '@/components/uno/ThemeSwitcher';
import { BrandWordmark } from '@/components/uno/BrandWordmark';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { APP_ROUTES } from '@/lib/config/routes';
import { toast } from 'sonner';

const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');

type LinkStatus = 'checking' | 'valid' | 'invalid';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>({});
  const [linkStatus, setLinkStatus] = useState<LinkStatus>('checking');
  const [linkError, setLinkError] = useState<string | null>(null);
  const { language } = useLanguage();
  const navigate = useNavigate();

  // When user clicks link in email: Supabase redirects to /auth/reset-password#access_token=...&refresh_token=...&type=recovery
  useEffect(() => {
    const applySessionFromEmailLink = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setLinkStatus('valid');
        return;
      }
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');
      const type = hashParams.get('type');
      if (accessToken && refreshToken && type === 'recovery') {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (error) {
          setLinkError(error.message);
          setLinkStatus('invalid');
          return;
        }
        // Remove tokens from URL for security
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
        setLinkStatus('valid');
      } else {
        setLinkError(null);
        setLinkStatus('invalid');
      }
    };
    applySessionFromEmailLink();
  }, []);

  const validateForm = () => {
    const newErrors: typeof errors = {};
    
    try {
      passwordSchema.parse(password);
    } catch (e) {
      if (e instanceof z.ZodError) {
        newErrors.password = e.errors[0].message;
      }
    }
    
    if (password !== confirmPassword) {
      newErrors.confirm = language === 'ru' ? 'Пароли не совпадают' : 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });
      
      if (error) {
        toast.error(error.message);
      } else {
        setIsSuccess(true);
        toast.success(
          language === 'ru'
            ? 'Пароль успешно изменён'
            : 'Password updated successfully'
        );
        await supabase.auth.signOut();
        // Redirect to login so user can sign in with new password
        setTimeout(() => {
          navigate(APP_ROUTES.AUTH, { replace: true });
        }, 2500);
      }
    } catch (error) {
      toast.error(
        language === 'ru'
          ? 'Не удалось обновить пароль. Попробуйте позже или запросите ссылку заново.'
          : 'Could not update password. Try again later or request a new link.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 pointer-events-none" />
      
      <header className="relative z-10 p-4 flex justify-between items-center">
        <Link to={APP_ROUTES.HOME} className="h-10 px-3 rounded-none bg-primary/10 ring-1 ring-primary/30 flex items-center justify-center hover:scale-105 transition-transform">
          <BrandWordmark as="static" />
        </Link>
        <div className="flex items-center gap-2">
          <ThemeSwitcher variant="buttons" className="scale-90" />
          <LanguageSwitcher size="sm" />
        </div>
      </header>

      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          {linkStatus === 'checking' ? (
            <div className="text-center space-y-6 py-8">
              <div className="w-12 h-12 mx-auto border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-muted-foreground">
                {language === 'ru' ? 'Проверка ссылки...' : 'Checking link...'}
              </p>
            </div>
          ) : linkStatus === 'invalid' ? (
            <div className="text-center space-y-6">
              <div className="w-16 h-16 mx-auto rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-destructive" />
              </div>
              <h1 className="text-2xl font-display font-bold">
                {language === 'ru' ? 'Недействительная или устаревшая ссылка' : 'Invalid or expired link'}
              </h1>
              <p className="text-muted-foreground">
                {language === 'ru'
                  ? 'Ссылка для сброса пароля недействительна или уже использована. Запросите новую.'
                  : 'This password reset link is invalid or has already been used. Request a new one.'}
              </p>
              {linkError && (
                <p className="text-sm text-destructive bg-destructive/10 rounded-none px-3 py-2">
                  {linkError}
                </p>
              )}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link to={APP_ROUTES.AUTH_FORGOT_PASSWORD}>
                  <PremiumButton variant="default" className="w-full sm:w-auto">
                    {language === 'ru' ? 'Запросить новую ссылку' : 'Request new link'}
                  </PremiumButton>
                </Link>
                <Link to={APP_ROUTES.AUTH}>
                  <PremiumButton variant="outline" className="w-full sm:w-auto gap-2">
                    <ArrowLeft className="w-4 h-4" />
                    {language === 'ru' ? 'К входу' : 'Back to login'}
                  </PremiumButton>
                </Link>
              </div>
            </div>
          ) : isSuccess ? (
            <div className="text-center space-y-6">
              <div className="w-16 h-16 mx-auto rounded-full bg-success/10 dark:bg-success/30 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-success dark:text-success" />
              </div>
              <h1 className="text-2xl font-display font-bold">
                {language === 'ru' ? 'Пароль изменён!' : 'Password updated!'}
              </h1>
              <p className="text-muted-foreground">
                {language === 'ru'
                  ? 'Войдите в аккаунт с новым паролем. Перенаправление на страницу входа...'
                  : 'Sign in with your new password. Redirecting to login...'}
              </p>
              <Link to={APP_ROUTES.AUTH}>
                <PremiumButton variant="outline" className="mt-2 gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  {language === 'ru' ? 'Перейти к входу' : 'Go to login'}
                </PremiumButton>
              </Link>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="text-center space-y-2">
                <h1 className="text-3xl font-display font-bold text-gradient-gold">
                  {language === 'ru' ? 'Новый пароль' : 'New password'}
                </h1>
                <p className="text-muted-foreground">
                  {language === 'ru'
                    ? 'Введите новый пароль для вашего аккаунта'
                    : 'Enter a new password for your account'}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    {language === 'ru' ? 'Новый пароль' : 'New password'}
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="new-password"
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className={cn(
                        "w-full h-12 pl-10 pr-12 rounded-none bg-secondary border transition-colors",
                        "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary",
                        errors.password ? "border-destructive" : "border-border"
                      )}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-sm text-destructive">{errors.password}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {language === 'ru' ? 'Минимум 6 символов' : 'At least 6 characters'}
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    {language === 'ru' ? 'Подтвердите пароль' : 'Confirm password'}
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="confirm-password"
                      autoComplete="new-password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className={cn(
                        "w-full h-12 pl-10 pr-4 rounded-none bg-secondary border transition-colors",
                        "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary",
                        errors.confirm ? "border-destructive" : "border-border"
                      )}
                    />
                  </div>
                  {errors.confirm && (
                    <p className="text-sm text-destructive">{errors.confirm}</p>
                  )}
                </div>

                <PremiumButton
                  type="submit"
                  className="w-full"
                  size="lg"
                  isLoading={isLoading}
                >
                  {language === 'ru' ? 'Сохранить пароль' : 'Save password'}
                </PremiumButton>
              </form>

              <div className="text-center">
                <Link to={APP_ROUTES.AUTH} className="text-primary font-medium hover:underline inline-flex items-center gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  {language === 'ru' ? 'Вернуться к входу' : 'Back to login'}
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="relative z-10 p-4 text-center text-sm text-muted-foreground">
        <p>myUNO</p>
      </footer>
    </div>
  );
}
