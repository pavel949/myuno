import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { Mail, Lock, User, Eye, EyeOff, ArrowRight, Gift } from 'lucide-react';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { PremiumButton } from '@/components/uno/PremiumButton';
import { LanguageSwitcher } from '@/components/uno/LanguageSwitcher';
import { ThemeSwitcher } from '@/components/uno/ThemeSwitcher';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { usePinAuth } from '@/hooks/usePinAuth';
import { PinLogin } from '@/components/auth/PinLogin';
import { PinSetup } from '@/components/auth/PinSetup';

// Validation schemas with localized messages handled in validateForm
const emailSchema = z.string().email();
const passwordSchema = z.string().min(6);

type AuthView = 'pin-login' | 'email-auth' | 'pin-setup';

export default function Auth() {
  const [searchParams] = useSearchParams();
  const [isLogin, setIsLogin] = useState(!searchParams.get('ref'));
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [referralCode, setReferralCode] = useState(searchParams.get('ref') || '');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; fullName?: string }>({});
  const [showPinSetup, setShowPinSetup] = useState(false);

  const { user, signIn, signUp } = useAuth();
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const { canUsePinLogin, hasPin, isLoading: pinLoading } = usePinAuth();
  
  // Get redirect path from state or query params
  const redirectPath = (location.state as { from?: string })?.from || 
    searchParams.get('redirect') || 
    '/';

  // Determine initial view
  const [view, setView] = useState<AuthView>('email-auth');

  useEffect(() => {
    // If user has PIN set up on this device, show PIN login
    if (!pinLoading && canUsePinLogin) {
      setView('pin-login');
    }
  }, [canUsePinLogin, pinLoading]);

  // Handle successful login - check if need PIN setup
  useEffect(() => {
    if (user && !showPinSetup) {
      // User just logged in, check if they have PIN
      if (!hasPin && !pinLoading) {
        setShowPinSetup(true);
        setView('pin-setup');
      } else if (hasPin || pinLoading === false) {
        navigate(redirectPath, { replace: true });
      }
    }
  }, [user, hasPin, pinLoading, navigate, showPinSetup, redirectPath]);

  const validateForm = () => {
    const newErrors: typeof errors = {};
    const isRu = language === 'ru';
    
    try {
      emailSchema.parse(email);
    } catch (e) {
      if (e instanceof z.ZodError) {
        newErrors.email = isRu ? 'Неверный формат email' : 'Invalid email address';
      }
    }
    
    try {
      passwordSchema.parse(password);
    } catch (e) {
      if (e instanceof z.ZodError) {
        newErrors.password = isRu ? 'Пароль должен быть не менее 6 символов' : 'Password must be at least 6 characters';
      }
    }
    
    if (!isLogin && !fullName.trim()) {
      newErrors.fullName = isRu ? 'Имя обязательно' : 'Name is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    try {
      const isRu = language === 'ru';
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          toast({
            title: isRu ? 'Ошибка' : 'Error',
            description: error.message === 'Invalid login credentials' 
              ? (isRu ? 'Неверный email или пароль' : 'Invalid email or password')
              : error.message,
            variant: 'destructive',
          });
        } else {
          toast({
            title: t('auth.welcomeBack'),
            description: isRu ? 'Вход выполнен успешно' : 'Successfully logged in',
          });
          // Don't navigate here - let the useEffect handle it
        }
      } else {
        const { error, data } = await signUp(email, password, fullName);
        if (error) {
          toast({
            title: isRu ? 'Ошибка' : 'Error',
            description: error.message.includes('already registered')
              ? (isRu ? 'Этот email уже зарегистрирован. Войдите в аккаунт.' : 'This email is already registered. Please log in instead.')
              : error.message,
            variant: 'destructive',
          });
        } else {
          // Apply referral code if provided
          if (referralCode && data?.user) {
            try {
              await supabase.rpc('apply_referral_code', {
                p_referred_id: data.user.id,
                p_code: referralCode.toUpperCase(),
              });
            } catch (refError) {
              console.error('Error applying referral code:', refError);
            }
          }
          
          toast({
            title: t('message.success'),
            description: language === 'ru' 
              ? 'Аккаунт успешно создан!' 
              : 'Account created successfully!',
          });
          // Don't navigate here - let useEffect handle PIN setup
        }
      }
    } catch (error) {
      toast({
        title: language === 'ru' ? 'Ошибка' : 'Error',
        description: language === 'ru' ? 'Произошла непредвиденная ошибка' : 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePinLoginSuccess = () => {
    navigate(redirectPath, { replace: true });
  };

  const handleSwitchToEmail = () => {
    setView('email-auth');
  };

  const handlePinSetupComplete = () => {
    navigate(redirectPath, { replace: true });
  };

  const handleSkipPinSetup = () => {
    navigate(redirectPath, { replace: true });
  };

  // Show loading while checking PIN status
  if (pinLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 pointer-events-none" />
      
      {/* Header */}
      <header className="relative z-10 p-4 flex justify-between items-center">
        <Link to="/" className="w-10 h-10 rounded-xl gradient-gold flex items-center justify-center shadow-gold hover:scale-105 transition-transform">
          <span className="text-xl font-bold text-primary-foreground">U</span>
        </Link>
        <div className="flex items-center gap-2">
          <ThemeSwitcher variant="buttons" className="scale-90" />
          <LanguageSwitcher size="sm" />
        </div>
      </header>

      {/* Main content */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          {/* PIN Login View */}
          {view === 'pin-login' && (
            <PinLogin 
              onSuccess={handlePinLoginSuccess}
              onSwitchToEmail={handleSwitchToEmail}
            />
          )}

          {/* PIN Setup View */}
          {view === 'pin-setup' && (
            <PinSetup 
              onComplete={handlePinSetupComplete}
              onSkip={handleSkipPinSetup}
            />
          )}

          {/* Email Auth View */}
          {view === 'email-auth' && (
            <div className="space-y-8">
              {/* Title */}
              <div className="text-center space-y-2">
                <h1 className="text-3xl font-display font-bold text-gradient-gold">
                  {isLogin ? t('auth.welcomeBack') : t('auth.getStarted')}
                </h1>
                <p className="text-muted-foreground">
                  {isLogin 
                    ? (language === 'ru' ? 'Введите данные для входа' : 'Enter your credentials to continue')
                    : (language === 'ru' ? 'Создайте аккаунт для начала' : 'Create an account to get started')}
                </p>
              </div>

              {/* Quick PIN login option */}
              {canUsePinLogin && isLogin && (
                <button
                  onClick={() => setView('pin-login')}
                  className="w-full p-3 rounded-xl border border-border bg-secondary/50 hover:bg-secondary transition-colors text-center"
                >
                  <span className="text-sm text-muted-foreground">
                    {language === 'ru' ? 'Войти с PIN-кодом' : 'Login with PIN'}
                  </span>
                </button>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Referral code banner (signup only) */}
                {!isLogin && referralCode && (
                  <div className="bg-primary/10 border border-primary/20 rounded-xl p-3 flex items-center gap-3">
                    <Gift className="w-5 h-5 text-primary" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        {language === 'ru' ? 'Реферальный код активен!' : 'Referral code active!'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {language === 'ru' 
                          ? 'Получите бонус после первого бронирования' 
                          : 'Get bonus after your first booking'}
                      </p>
                    </div>
                    <span className="font-mono font-bold text-primary">{referralCode.toUpperCase()}</span>
                  </div>
                )}

                {/* Name field (signup only) */}
                {!isLogin && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      {t('auth.fullName')}
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder={language === 'ru' ? 'Иван Иванов' : 'John Doe'}
                        className={cn(
                          "w-full h-12 pl-10 pr-4 rounded-xl bg-secondary border transition-colors",
                          "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary",
                          errors.fullName ? "border-destructive" : "border-border"
                        )}
                      />
                    </div>
                    {errors.fullName && (
                      <p className="text-sm text-destructive">{errors.fullName}</p>
                    )}
                  </div>
                )}

                {/* Email field */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    {t('auth.email')}
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="your@email.com"
                      className={cn(
                        "w-full h-12 pl-10 pr-4 rounded-xl bg-secondary border transition-colors",
                        "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary",
                        errors.email ? "border-destructive" : "border-border"
                      )}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email}</p>
                  )}
                </div>

                {/* Password field */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    {t('auth.password')}
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      type={showPassword ? 'text' : 'password'}
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

                {/* Referral code field (signup only, if not from link) */}
                {!isLogin && !searchParams.get('ref') && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">
                      {language === 'ru' ? 'Реферальный код (если есть)' : 'Referral code (optional)'}
                    </label>
                    <div className="relative">
                      <Gift className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <input
                        type="text"
                        value={referralCode}
                        onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                        placeholder="ABC123"
                        maxLength={6}
                        className={cn(
                          "w-full h-12 pl-10 pr-4 rounded-xl bg-secondary border transition-colors font-mono uppercase",
                          "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary border-border"
                        )}
                      />
                    </div>
                  </div>
                )}

                {/* Forgot password */}
                {isLogin && (
                  <div className="text-right">
                    <Link to="/auth/forgot-password" className="text-sm text-primary hover:underline">
                      {t('auth.forgotPassword')}
                    </Link>
                  </div>
                )}

                {/* Submit button */}
                <PremiumButton
                  type="submit"
                  className="w-full"
                  size="lg"
                  isLoading={isLoading}
                >
                  {isLogin ? t('auth.login') : t('auth.createAccount')}
                  <ArrowRight className="w-4 h-4 ml-1" />
                </PremiumButton>
              </form>

              {/* Toggle login/signup */}
              <div className="text-center">
                <p className="text-muted-foreground">
                  {isLogin ? t('auth.noAccount') : t('auth.hasAccount')}{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setIsLogin(!isLogin);
                      setErrors({});
                    }}
                    className="text-primary font-medium hover:underline"
                  >
                    {isLogin ? t('auth.signup') : t('auth.login')}
                  </button>
                </p>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 p-4 text-center text-sm text-muted-foreground">
        <p>
          {language === 'ru' 
            ? 'Продолжая, вы соглашаетесь с Условиями использования' 
            : 'By continuing, you agree to our Terms of Service'}
        </p>
      </footer>
    </div>
  );
}
