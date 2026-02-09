import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff, CheckCircle, ArrowLeft } from 'lucide-react';
import { z } from 'zod';
import { useLanguage } from '@/contexts/LanguageContext';
import { PremiumButton } from '@/components/uno/PremiumButton';
import { LanguageSwitcher } from '@/components/uno/LanguageSwitcher';
import { ThemeSwitcher } from '@/components/uno/ThemeSwitcher';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>({});
  const { language } = useLanguage();
  const navigate = useNavigate();

  // Check if user came from email link (has access token)
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        // No session, check if there's an access token in URL
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        
        if (accessToken && refreshToken) {
          // Set session from URL tokens
          await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
        }
      }
    };
    
    checkSession();
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
        
        // Redirect to home after 2 seconds
        setTimeout(() => {
          navigate('/', { replace: true });
        }, 2000);
      }
    } catch (error) {
      toast.error(
        language === 'ru'
          ? 'Произошла ошибка'
          : 'An error occurred'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 pointer-events-none" />
      
      <header className="relative z-10 p-4 flex justify-between items-center">
        <Link to="/" className="w-10 h-10 rounded-xl gradient-gold flex items-center justify-center shadow-gold hover:scale-105 transition-transform">
          <span className="text-xl font-bold text-primary-foreground">U</span>
        </Link>
        <div className="flex items-center gap-2">
          <ThemeSwitcher variant="buttons" className="scale-90" />
          <LanguageSwitcher size="sm" />
        </div>
      </header>

      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          {isSuccess ? (
            <div className="text-center space-y-6">
              <div className="w-16 h-16 mx-auto rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <h1 className="text-2xl font-display font-bold">
                {language === 'ru' ? 'Пароль изменён!' : 'Password updated!'}
              </h1>
              <p className="text-muted-foreground">
                {language === 'ru'
                  ? 'Вы будете перенаправлены на главную страницу...'
                  : 'You will be redirected to the home page...'}
              </p>
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
                        "w-full h-12 pl-10 pr-12 rounded-xl bg-secondary border transition-colors",
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
                        "w-full h-12 pl-10 pr-4 rounded-xl bg-secondary border transition-colors",
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
                <Link to="/auth" className="text-primary font-medium hover:underline inline-flex items-center gap-2">
                  <ArrowLeft className="w-4 h-4" />
                  {language === 'ru' ? 'Вернуться к входу' : 'Back to login'}
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="relative z-10 p-4 text-center text-sm text-muted-foreground">
        <p>myUNO SuperApp</p>
      </footer>
    </div>
  );
}
