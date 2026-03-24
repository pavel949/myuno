import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { APP_ROUTES } from '@/lib/config/routes';
import { Mail, Lock, User, Eye, EyeOff, ArrowRight, Gift, Phone, ChevronLeft } from 'lucide-react';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { PremiumButton } from '@/components/uno/PremiumButton';
import { LanguageSwitcher } from '@/components/uno/LanguageSwitcher';
import { ThemeSwitcher } from '@/components/uno/ThemeSwitcher';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { PasswordStrengthIndicator } from '@/components/auth/PasswordStrengthIndicator';
import { motion, AnimatePresence } from 'framer-motion';

// Validation schemas
const emailSchema = z.string().email();
const passwordSchema = z.string().min(6);
const phoneSchema = z.string().min(10).max(20);

type SignupStep = 'info' | 'contact' | 'password';

export default function Auth() {
  const [searchParams] = useSearchParams();
  const [isLogin, setIsLogin] = useState(!searchParams.get('ref') && searchParams.get('mode') !== 'signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [referralCode, setReferralCode] = useState(searchParams.get('ref') || '');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string; confirmPassword?: string; fullName?: string; phone?: string }>({});
  const [signupStep, setSignupStep] = useState<SignupStep>('info');
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const SHOW_FORGOT_AFTER = 3;

  const { user, signIn, signUp, isLoading: authLoading } = useAuth();
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const isRu = language === 'ru';
  
  const redirectPath = (location.state as { from?: string })?.from || 
    searchParams.get('redirect') || 
    APP_ROUTES.HOME;

  // Redirect authenticated users immediately
  useEffect(() => {
    if (user && !authLoading) {
      navigate(redirectPath, { replace: true });
    }
  }, [user, authLoading, navigate, redirectPath]);

  const validateStep = (step: SignupStep) => {
    const newErrors: typeof errors = {};
    
    if (step === 'info') {
      if (!fullName.trim()) {
        newErrors.fullName = isRu ? 'Введите ваше имя' : 'Please enter your name';
      }
    }
    
    if (step === 'contact') {
      try { emailSchema.parse(email); } catch { 
        newErrors.email = isRu ? 'Неверный формат email' : 'Invalid email address';
      }
      if (phone && phone.length > 0) {
        try { phoneSchema.parse(phone.replace(/\D/g, '')); } catch {
          newErrors.phone = isRu ? 'Неверный формат телефона' : 'Invalid phone number';
        }
      }
    }
    
    if (step === 'password') {
      try { passwordSchema.parse(password); } catch {
        newErrors.password = isRu ? 'Пароль должен быть не менее 6 символов' : 'Password must be at least 6 characters';
      }
      if (password !== confirmPassword) {
        newErrors.confirmPassword = isRu ? 'Пароли не совпадают' : 'Passwords do not match';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateLoginForm = () => {
    const newErrors: typeof errors = {};
    try { emailSchema.parse(email); } catch {
      newErrors.email = isRu ? 'Неверный формат email' : 'Invalid email address';
    }
    try { passwordSchema.parse(password); } catch {
      newErrors.password = isRu ? 'Пароль должен быть не менее 6 символов' : 'Password must be at least 6 characters';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
    if (signupStep === 'info' && validateStep('info')) setSignupStep('contact');
    else if (signupStep === 'contact' && validateStep('contact')) setSignupStep('password');
  };

  const handlePrevStep = () => {
    if (signupStep === 'contact') setSignupStep('info');
    else if (signupStep === 'password') setSignupStep('contact');
  };

  const handleSignup = async () => {
    if (!validateStep('password')) return;
    if (!termsAccepted) {
      toast({
        title: isRu ? 'Примите условия' : 'Accept terms',
        description: isRu ? 'Необходимо принять Условия использования' : 'You must accept the Terms of Service',
        variant: 'destructive',
      });
      return;
    }
    setIsLoading(true);
    
    try {
      const { error, data } = await signUp({ 
        email, password, fullName, 
        phone: phone.replace(/\D/g, '') 
      });
      
      if (error) {
        let description = error.message;
        if (error.message.includes('already registered') || error.message.includes('User already registered')) {
          description = isRu ? 'Этот email уже зарегистрирован. Войдите в аккаунт.' : 'This email is already registered. Please sign in instead.';
        } else if (error.message.includes('Password should be')) {
          description = isRu ? 'Пароль должен содержать не менее 6 символов' : 'Password must be at least 6 characters';
        }
        toast({ title: isRu ? 'Ошибка регистрации' : 'Registration failed', description, variant: 'destructive' });
      } else {
        if (referralCode && data?.user) {
          try {
            await supabase.rpc('apply_referral_code', { p_referred_id: data.user.id, p_code: referralCode.toUpperCase() });
          } catch (refError) { console.error('Error applying referral code:', refError); }
        }

        if (data?.user) {
          supabase.from('terms_acceptances').insert([
            { user_id: data.user.id, document_type: 'terms', document_version: '1.0' },
            { user_id: data.user.id, document_type: 'privacy', document_version: '1.0' },
          ]).then(({ error }) => { if (error) console.error('Terms acceptance log error:', error); });
        }

        supabase.functions.invoke('notify-new-signup', {
          body: {
            user_email: email, user_name: fullName,
            user_phone: phone.replace(/\D/g, '') || undefined,
            referral_code: referralCode || undefined,
            signup_source: 'auth_page',
          },
        }).catch(err => console.error('Signup notification error:', err));
        
        toast({
          title: isRu ? '🎉 Добро пожаловать!' : '🎉 Welcome aboard!',
          description: isRu ? 'Аккаунт создан. Проверьте почту для подтверждения email.' : 'Account created. Check your email to verify your address.',
        });

        navigate(redirectPath, { replace: true });
      }
    } catch {
      toast({ title: isRu ? 'Ошибка' : 'Error', description: isRu ? 'Произошла непредвиденная ошибка' : 'An unexpected error occurred', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateLoginForm()) return;
    setIsLoading(true);
    
    try {
      const { error } = await signIn(email, password);
      if (error) {
        const newAttempts = loginAttempts + 1;
        setLoginAttempts(newAttempts);

        let description: string;
        if (error.message === 'Invalid login credentials' || error.message.includes('invalid_credentials')) {
          description = isRu ? 'Неверный email или пароль' : 'Invalid email or password';
        } else if (error.message.includes('Email not confirmed')) {
          description = isRu ? 'Email не подтверждён. Проверьте почту и перейдите по ссылке.' : 'Email not confirmed. Check your inbox and click the verification link.';
        } else {
          description = error.message;
        }

        toast({ title: isRu ? 'Ошибка входа' : 'Login failed', description, variant: 'destructive' });
      } else {
        setLoginAttempts(0);
        toast({ title: t('auth.welcomeBack'), description: isRu ? 'Вход выполнен успешно' : 'Successfully logged in' });
      }
    } catch {
      setLoginAttempts(prev => prev + 1);
      toast({ title: isRu ? 'Ошибка' : 'Error', description: isRu ? 'Произошла непредвиденная ошибка' : 'An unexpected error occurred', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const switchToSignup = () => { setIsLogin(false); setSignupStep('info'); setErrors({}); };
  const switchToLogin = () => { setIsLogin(true); setErrors({}); };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const stepIndicator = (
    <div className="flex items-center justify-center gap-2 mb-6">
      {['info', 'contact', 'password'].map((step, idx) => (
        <div
          key={step}
          className={cn(
            "w-2 h-2 rounded-full transition-all",
            signupStep === step ? "w-6 bg-primary" : 
            (idx < ['info', 'contact', 'password'].indexOf(signupStep)) ? "bg-primary" : "bg-muted"
          )}
        />
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10 pointer-events-none" />
      
      {/* Header */}
      <header className="relative z-10 p-4 flex justify-between items-center">
        <Link to={APP_ROUTES.HOME} className="w-10 h-10 rounded-xl gradient-gold flex items-center justify-center shadow-gold hover:scale-105 transition-transform">
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
          <div className="space-y-6">
            {/* Login Form */}
            {isLogin ? (
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <h1 className="text-3xl font-display font-bold text-gradient-gold">
                    {t('auth.welcomeBack')}
                  </h1>
                  <p className="text-muted-foreground">
                    {isRu ? 'Введите данные для входа' : 'Enter your credentials to continue'}
                  </p>
                </div>

                <form onSubmit={handleLogin} name="login" className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t('auth.email')}</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <input
                        type="email"
                        name="email"
                        autoComplete="email"
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
                    {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t('auth.password')}</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        autoComplete="current-password"
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
                    {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground" />
                    <Link to={APP_ROUTES.AUTH_FORGOT_PASSWORD} className="text-sm text-primary hover:underline">
                      {t('auth.forgotPassword')}
                    </Link>
                  </div>

                  {loginAttempts >= SHOW_FORGOT_AFTER && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-sm"
                    >
                      <p className="text-destructive font-medium mb-1">
                        {isRu ? 'Несколько неудачных попыток' : 'Multiple failed attempts'}
                      </p>
                      <p className="text-muted-foreground">
                        {isRu ? 'Может быть, ' : 'Maybe '}
                        <Link to={APP_ROUTES.AUTH_FORGOT_PASSWORD} className="text-primary font-medium hover:underline">
                          {isRu ? 'восстановить пароль?' : 'reset your password?'}
                        </Link>
                      </p>
                    </motion.div>
                  )}

                  <PremiumButton type="submit" className="w-full" size="lg" isLoading={isLoading} data-testid="login-button">
                    {t('auth.login')}
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </PremiumButton>
                </form>

                <div className="text-center">
                  <p className="text-muted-foreground">
                    {t('auth.noAccount')}{' '}
                    <button type="button" onClick={switchToSignup} className="text-primary font-medium hover:underline">
                      {t('auth.signup')}
                    </button>
                  </p>
                </div>
              </div>
            ) : (
              /* Signup Flow */
              <AnimatePresence mode="wait">
                <motion.div
                  key={signupStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  {stepIndicator}

                  {/* Step 1: Name */}
                  {signupStep === 'info' && (
                    <>
                      <div className="text-center space-y-2">
                        <h1 className="text-2xl font-display font-bold">
                          {isRu ? 'Как вас зовут?' : "What's your name?"}
                        </h1>
                        <p className="text-sm text-muted-foreground">
                          {isRu ? 'Это имя будет использоваться для бронирований и верификации' : 'This name will be used for bookings and verification'}
                        </p>
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">{t('auth.fullName')}</label>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                            <input
                              type="text"
                              name="fullName"
                              autoComplete="name"
                              value={fullName}
                              onChange={(e) => setFullName(e.target.value)}
                              placeholder={isRu ? 'Иван Иванов' : 'John Doe'}
                              className={cn(
                                "w-full h-14 pl-10 pr-4 rounded-xl bg-secondary border transition-colors text-lg",
                                "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary",
                                errors.fullName ? "border-destructive" : "border-border"
                              )}
                              autoFocus
                            />
                          </div>
                          {errors.fullName && <p className="text-sm text-destructive">{errors.fullName}</p>}
                        </div>

                        {referralCode && (
                          <div className="bg-primary/10 border border-primary/20 rounded-xl p-3 flex items-center gap-3">
                            <Gift className="w-5 h-5 text-primary" />
                            <div className="flex-1">
                              <p className="text-sm font-medium">
                                {isRu ? 'Реферальный код активен!' : 'Referral code active!'}
                              </p>
                            </div>
                            <span className="font-mono font-bold text-primary">{referralCode.toUpperCase()}</span>
                          </div>
                        )}
                      </div>

                      <PremiumButton onClick={handleNextStep} className="w-full" size="lg">
                        {isRu ? 'Продолжить' : 'Continue'}
                        <ArrowRight className="w-4 h-4 ml-1" />
                      </PremiumButton>
                    </>
                  )}

                  {/* Step 2: Contact */}
                  {signupStep === 'contact' && (
                    <>
                      <div className="text-center space-y-2">
                        <h1 className="text-2xl font-display font-bold">
                          {isRu ? 'Контактные данные' : 'Contact information'}
                        </h1>
                        <p className="text-sm text-muted-foreground">
                          {isRu ? 'Эти данные будут использоваться для связи и верификации' : 'This information will be used for communication and verification'}
                        </p>
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">{t('auth.email')}</label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                            <input
                              type="email"
                              name="email"
                              autoComplete="email"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              placeholder="your@email.com"
                              className={cn(
                                "w-full h-14 pl-10 pr-4 rounded-xl bg-secondary border transition-colors",
                                "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary",
                                errors.email ? "border-destructive" : "border-border"
                              )}
                              autoFocus
                            />
                          </div>
                          {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium flex items-center gap-2">
                            {isRu ? 'Номер телефона' : 'Phone number'}
                            <span className="text-xs text-muted-foreground font-normal">
                              ({isRu ? 'рекомендуется' : 'recommended'})
                            </span>
                          </label>
                          <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                            <input
                              type="tel"
                              name="phone"
                              autoComplete="tel"
                              value={phone}
                              onChange={(e) => setPhone(e.target.value)}
                              placeholder="+7 999 123-45-67"
                              className={cn(
                                "w-full h-14 pl-10 pr-4 rounded-xl bg-secondary border transition-colors",
                                "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary",
                                errors.phone ? "border-destructive" : "border-border"
                              )}
                            />
                          </div>
                          {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
                          <p className="text-xs text-muted-foreground">
                            {isRu ? 'Телефон используется для экстренной связи и подтверждения бронирований' : 'Phone is used for emergency contact and booking confirmations'}
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <button
                          onClick={handlePrevStep}
                          className="h-12 px-4 rounded-xl border border-border hover:bg-secondary transition-colors"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        <PremiumButton onClick={handleNextStep} className="flex-1" size="lg">
                          {isRu ? 'Продолжить' : 'Continue'}
                          <ArrowRight className="w-4 h-4 ml-1" />
                        </PremiumButton>
                      </div>
                    </>
                  )}

                  {/* Step 3: Password */}
                  {signupStep === 'password' && (
                    <>
                      <div className="text-center space-y-2">
                        <h1 className="text-2xl font-display font-bold">
                          {isRu ? 'Создайте пароль' : 'Create a password'}
                        </h1>
                        <p className="text-sm text-muted-foreground">
                          {isRu ? 'Минимум 6 символов для защиты вашего аккаунта' : 'At least 6 characters to protect your account'}
                        </p>
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">{t('auth.password')}</label>
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
                                "w-full h-14 pl-10 pr-12 rounded-xl bg-secondary border transition-colors",
                                "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary",
                                errors.password ? "border-destructive" : "border-border"
                              )}
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            >
                              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                          </div>
                          {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                          <PasswordStrengthIndicator password={password} />
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium">
                            {isRu ? 'Подтвердите пароль' : 'Confirm password'}
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
                                "w-full h-14 pl-10 pr-4 rounded-xl bg-secondary border transition-colors",
                                "focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary",
                                errors.confirmPassword ? "border-destructive" : "border-border"
                              )}
                            />
                          </div>
                          {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword}</p>}
                        </div>

                        {!searchParams.get('ref') && (
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">
                              {isRu ? 'Реферальный код (если есть)' : 'Referral code (optional)'}
                            </label>
                            <div className="relative">
                              <Gift className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                              <input
                                type="text"
                                value={referralCode}
                                onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                                placeholder="ABC123"
                                maxLength={6}
                                className="w-full h-12 pl-10 pr-4 rounded-xl bg-secondary border border-border transition-colors font-mono uppercase focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                              />
                            </div>
                          </div>
                        )}

                        <label className="flex items-start gap-3 p-3 rounded-xl bg-primary/5 border border-primary/10 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={termsAccepted}
                            onChange={(e) => setTermsAccepted(e.target.checked)}
                            className="mt-0.5 w-4 h-4 rounded border-border text-primary focus:ring-primary/50"
                          />
                          <p className="text-xs text-muted-foreground">
                            {isRu ? (
                              <>Я принимаю <Link to={APP_ROUTES.TERMS} target="_blank" className="text-primary hover:underline">Условия использования</Link> и <Link to={APP_ROUTES.PRIVACY} target="_blank" className="text-primary hover:underline">Политику конфиденциальности</Link></>
                            ) : (
                              <>I agree to the <Link to={APP_ROUTES.TERMS} target="_blank" className="text-primary hover:underline">Terms of Service</Link> and <Link to={APP_ROUTES.PRIVACY} target="_blank" className="text-primary hover:underline">Privacy Policy</Link></>
                            )}
                          </p>
                        </label>
                      </div>

                      <div className="flex gap-3">
                        <button
                          onClick={handlePrevStep}
                          className="h-12 px-4 rounded-xl border border-border hover:bg-secondary transition-colors"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        <PremiumButton 
                          onClick={handleSignup} 
                          className="flex-1" 
                          size="lg" 
                          isLoading={isLoading}
                          data-testid="signup-button"
                        >
                          {t('auth.createAccount')}
                          <ArrowRight className="w-4 h-4 ml-1" />
                        </PremiumButton>
                      </div>
                    </>
                  )}

                  {/* Switch to login */}
                  <div className="text-center pt-4">
                    <p className="text-muted-foreground">
                      {t('auth.hasAccount')}{' '}
                      <button type="button" onClick={switchToLogin} className="text-primary font-medium hover:underline">
                        {t('auth.login')}
                      </button>
                    </p>
                  </div>
                </motion.div>
              </AnimatePresence>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 p-4 text-center text-sm text-muted-foreground">
        <p>
          {isRu ? 'Продолжая, вы соглашаетесь с Условиями использования' : 'By continuing, you agree to our Terms of Service'}
        </p>
      </footer>
    </div>
  );
}
