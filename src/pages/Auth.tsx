import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { APP_ROUTES } from '@/lib/config/routes';
import { Mail, Lock, Eye, EyeOff, ArrowRight, ArrowLeft, Gift, Phone, ChevronLeft } from 'lucide-react';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useOwnerType } from '@/hooks/useOwnerType';
import { useUserContext } from '@/hooks/useUserContext';
import { PremiumButton } from '@/components/uno/PremiumButton';
import { LanguageSwitcher } from '@/components/uno/LanguageSwitcher';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { PasswordStrengthIndicator } from '@/components/auth/PasswordStrengthIndicator';
import { UnderlineInput } from '@/components/auth/UnderlineInput';
import { GoogleSignInButton, OAuthDivider } from '@/components/auth/GoogleSignInButton';
import { AuthValuePanel } from '@/components/auth/AuthValuePanel';
import { AuthTrustFooter } from '@/components/auth/AuthTrustFooter';
import { motion, AnimatePresence } from 'framer-motion';

// Timeout helper — prevents infinite spinner when Supabase is unreachable
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('TIMEOUT')), ms)
    ),
  ]);
}

// Validation schemas
const emailSchema = z.string().email();
const passwordSchema = z.string().min(6);
const phoneSchema = z.string().min(10).max(20);

type SignupStep = 'phone' | 'register';

export default function Auth() {
  const [searchParams] = useSearchParams();
  const [isLogin, setIsLogin] = useState(!searchParams.get('ref') && searchParams.get('mode') !== 'signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [referralCode, setReferralCode] = useState(searchParams.get('ref') || '');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [signupStep, setSignupStep] = useState<SignupStep>('phone');
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const SHOW_FORGOT_AFTER = 3;

  const { user, signIn, signUp, isLoading: authLoading } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const isRu = language === 'ru';
  const isTh = language === 'th';
  const { activeRole } = useUserContext();
  const { isMCPortal, isLoading: ownerTypeLoading } = useOwnerType();

  const redirectPath = (location.state as { from?: string })?.from ||
    searchParams.get('redirect') ||
    APP_ROUTES.HOME;

  useEffect(() => {
    if (!user || authLoading) return;
    if (redirectPath !== APP_ROUTES.HOME) {
      navigate(redirectPath, { replace: true });
      return;
    }
    if (ownerTypeLoading) return;
    const dest =
      activeRole === 'vendor' ? '/vendor'
      : activeRole === 'investor' ? '/invest'
      : (activeRole === 'owner' || activeRole === 'property_manager')
        ? (isMCPortal ? '/my-property' : '/mc')
      : isMCPortal ? '/my-property'
      : '/';
    navigate(dest, { replace: true });
  }, [user, authLoading, ownerTypeLoading, navigate, redirectPath, activeRole, isMCPortal]);

  const validatePhoneStep = () => {
    const newErrors: Record<string, string> = {};
    const digits = phone.replace(/\D/g, '');
    if (!digits || digits.length < 10) {
      newErrors.phone = isTh
        ? 'กรุณาใส่เบอร์โทรศัพท์ที่ถูกต้อง'
        : isRu
          ? 'Введите корректный номер телефона'
          : 'Please enter a valid phone number';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateRegisterStep = () => {
    const newErrors: Record<string, string> = {};

    if (!firstName.trim()) {
      newErrors.firstName = isTh ? 'กรุณาใส่ชื่อ' : isRu ? 'Введите имя' : 'Please enter your first name';
    }
    if (!lastName.trim()) {
      newErrors.lastName = isTh ? 'กรุณาใส่นามสกุล' : isRu ? 'Введите фамилию' : 'Please enter your last name';
    }
    try { emailSchema.parse(email); } catch {
      newErrors.email = isTh ? 'รูปแบบอีเมลไม่ถูกต้อง' : isRu ? 'Неверный формат email' : 'Invalid email address';
    }
    try { passwordSchema.parse(password); } catch {
      newErrors.password = isTh
        ? 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'
        : isRu
          ? 'Пароль должен быть не менее 6 символов'
          : 'Password must be at least 6 characters';
    }
    if (password !== confirmPassword) {
      newErrors.confirmPassword = isTh ? 'รหัสผ่านไม่ตรงกัน' : isRu ? 'Пароли не совпадают' : 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateLoginForm = () => {
    const newErrors: Record<string, string> = {};
    try { emailSchema.parse(email); } catch {
      newErrors.email = isTh ? 'รูปแบบอีเมลไม่ถูกต้อง' : isRu ? 'Неверный формат email' : 'Invalid email address';
    }
    try { passwordSchema.parse(password); } catch {
      newErrors.password = isTh
        ? 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'
        : isRu
          ? 'Пароль должен быть не менее 6 символов'
          : 'Password must be at least 6 characters';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePhoneNext = () => {
    if (validatePhoneStep()) setSignupStep('register');
  };

  const handleSignup = async () => {
    if (!validateRegisterStep()) return;
    if (!termsAccepted) {
      toast.error(isTh ? 'กรุณายอมรับข้อกำหนด' : isRu ? 'Примите условия' : 'Accept terms', {
        description: isTh
          ? 'คุณต้องยอมรับข้อกำหนดและเงื่อนไข'
          : isRu
            ? 'Необходимо принять Условия использования'
            : 'You must accept the Terms of Service',
      });
      return;
    }
    setIsLoading(true);

    const fullName = `${firstName.trim()} ${lastName.trim()}`;

    try {
      const { error, data } = await withTimeout(signUp({
        email, password, fullName,
        phone: phone.replace(/\D/g, '')
      }), 15000);

      if (error) {
        let description = error.message;
        if (error.message.includes('already registered') || error.message.includes('User already registered')) {
          description = isTh
            ? 'อีเมลนี้ถูกลงทะเบียนแล้ว กรุณาเข้าสู่ระบบ'
            : isRu
              ? 'Этот email уже зарегистрирован. Войдите в аккаунт.'
              : 'This email is already registered. Please sign in instead.';
        } else if (error.message.includes('Password should be')) {
          description = isTh
            ? 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'
            : isRu
              ? 'Пароль должен содержать не менее 6 символов'
              : 'Password must be at least 6 characters';
        }
        toast.error(isTh ? 'การลงทะเบียนล้มเหลว' : isRu ? 'Ошибка регистрации' : 'Registration failed', {
          description,
        });
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

        toast(isTh ? 'ยินดีต้อนรับ!' : isRu ? '🎉 Добро пожаловать!' : '🎉 Welcome aboard!', {
          description: isTh
            ? 'สร้างบัญชีเรียบร้อยแล้ว กรุณาตรวจสอบอีเมลเพื่อยืนยัน'
            : isRu
              ? 'Аккаунт создан. Проверьте почту для подтверждения email.'
              : 'Account created. Check your email to verify your address.',
        });

        navigate(redirectPath, { replace: true });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      if (msg === 'TIMEOUT') {
        toast.error(isTh ? 'หมดเวลาการเชื่อมต่อ' : isRu ? 'Время ожидания истекло' : 'Connection timed out', {
          description: isTh
            ? 'กรุณาตรวจสอบอินเทอร์เน็ตแล้วลองอีกครั้ง'
            : isRu
              ? 'Проверьте интернет-соединение и попробуйте снова'
              : 'Please check your internet and try again',
        });
      } else {
        toast.error(isTh ? 'ข้อผิดพลาด' : isRu ? 'Ошибка' : 'Error', {
          description: isTh
            ? 'เกิดข้อผิดพลาดที่ไม่คาดคิด'
            : isRu
              ? 'Произошла непредвиденная ошибка'
              : 'An unexpected error occurred',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateLoginForm()) return;
    setIsLoading(true);

    try {
      const { error } = await withTimeout(signIn(email, password), 15000);
      if (error) {
        const newAttempts = loginAttempts + 1;
        setLoginAttempts(newAttempts);

        let description: string;
        if (error.message === 'Invalid login credentials' || error.message.includes('invalid_credentials')) {
          description = isTh
            ? 'อีเมลหรือรหัสผ่านไม่ถูกต้อง'
            : isRu ? 'Неверный email или пароль' : 'Invalid email or password';
        } else if (error.message.includes('Email not confirmed')) {
          description = isTh
            ? 'อีเมลยังไม่ได้รับการยืนยัน กรุณาตรวจสอบกล่องข้อความ'
            : isRu
              ? 'Email не подтверждён. Проверьте почту и перейдите по ссылке.'
              : 'Email not confirmed. Check your inbox and click the verification link.';
        } else {
          description = error.message;
        }

        toast.error(isTh ? 'เข้าสู่ระบบล้มเหลว' : isRu ? 'Ошибка входа' : 'Login failed', {
          description,
        });
      } else {
        setLoginAttempts(0);
        toast(t('auth.welcomeBack'), {
          description: isTh ? 'เข้าสู่ระบบสำเร็จ' : isRu ? 'Вход выполнен успешно' : 'Successfully logged in',
        });
      }
    } catch (err: unknown) {
      setLoginAttempts(prev => prev + 1);
      const msg = err instanceof Error ? err.message : '';
      if (msg === 'TIMEOUT') {
        toast.error(isTh ? 'หมดเวลาการเชื่อมต่อ' : isRu ? 'Время ожидания истекло' : 'Connection timed out', {
          description: isTh
            ? 'กรุณาตรวจสอบอินเทอร์เน็ตแล้วลองอีกครั้ง'
            : isRu
              ? 'Проверьте интернет-соединение и попробуйте снова'
              : 'Please check your internet and try again',
        });
      } else {
        toast.error(isTh ? 'ข้อผิดพลาด' : isRu ? 'Ошибка' : 'Error', {
          description: isTh
            ? 'เกิดข้อผิดพลาดที่ไม่คาดคิด'
            : isRu
              ? 'Произошла непредвиденная ошибка'
              : 'An unexpected error occurred',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const switchToSignup = () => { setIsLogin(false); setSignupStep('phone'); setErrors({}); };
  const switchToLogin = () => { setIsLogin(true); setErrors({}); };

  if (authLoading && user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const stepIndicator = (
    <div className="flex items-center justify-center gap-2 mb-6">
      {['phone', 'register'].map((step, idx) => (
        <div
          key={step}
          className={cn(
            "w-2 h-2 rounded-full transition-all",
            signupStep === step ? "w-6 bg-primary" :
            (idx < ['phone', 'register'].indexOf(signupStep)) ? "bg-primary" : "bg-muted"
          )}
        />
      ))}
    </div>
  );

  // Logo component used in signup steps — neutral mint badge (no gold gradient)
  const AppLogo = () => (
    <div className="flex justify-center mb-4">
      <Link to={APP_ROUTES.HOME} className="w-16 h-16 rounded-2xl bg-primary/10 ring-1 ring-primary/30 flex items-center justify-center hover:scale-105 transition-transform">
        <span className="font-display text-3xl font-bold text-primary">U</span>
      </Link>
    </div>
  );

  // Section header matching reference app style (bold title + colored subtitle)
  const SectionHeader = ({ title, subtitle }: { title: string; subtitle: string }) => (
    <div className="pt-6 pb-2">
      <h2 className="text-lg font-bold">{title}</h2>
      <p className="text-sm text-primary font-medium">{subtitle}</p>
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
                    {isTh ? 'ใส่ข้อมูลเพื่อเข้าสู่ระบบ' : isRu ? 'Введите данные для входа' : 'Enter your credentials to continue'}
                  </p>
                </div>

                <GoogleSignInButton redirectTo={`${window.location.origin}${redirectPath}`} />
                <OAuthDivider />

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
                        {isTh ? 'เข้าสู่ระบบล้มเหลวหลายครั้ง' : isRu ? 'Несколько неудачных попыток' : 'Multiple failed attempts'}
                      </p>
                      <p className="text-muted-foreground">
                        {isTh ? 'ลอง ' : isRu ? 'Может быть, ' : 'Maybe '}
                        <Link to={APP_ROUTES.AUTH_FORGOT_PASSWORD} className="text-primary font-medium hover:underline">
                          {isTh ? 'รีเซ็ตรหัสผ่าน?' : isRu ? 'восстановить пароль?' : 'reset your password?'}
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
                  className="space-y-4"
                >
                  {stepIndicator}

                  {/* Step 1: Phone Entry */}
                  {signupStep === 'phone' && (
                    <>
                      <AppLogo />

                      <div className="text-center space-y-1">
                        <h1 className="text-2xl font-display font-bold">
                          {t('auth.signInOrSignUp')}
                        </h1>
                        <p className="text-sm text-primary font-medium uppercase tracking-wide">
                          {isTh ? 'SIGN IN OR SIGN UP' : isTh ? '' : isRu ? '' : ''}
                        </p>
                      </div>

                      <div className="pt-2">
                        <GoogleSignInButton redirectTo={`${window.location.origin}${redirectPath}`} />
                        <OAuthDivider />
                      </div>

                      <div className="pt-4">
                        <UnderlineInput
                          label={`${t('auth.phone')}/${isTh ? 'Mobile Phone' : isRu ? 'Mobile Phone' : 'Mobile Phone'}*`}
                          type="tel"
                          autoComplete="tel"
                          value={phone}
                          onChange={setPhone}
                          placeholder={isTh ? '0XX-XXX-XXXX' : '+66 XX XXX XXXX'}
                          error={errors.phone}
                          autoFocus
                        />
                      </div>

                      <div className="pt-2">
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {t('auth.termsNotice')}
                        </p>
                      </div>

                      {referralCode && (
                        <div className="bg-primary/10 border border-primary/20 rounded-xl p-3 flex items-center gap-3">
                          <Gift className="w-5 h-5 text-primary" />
                          <div className="flex-1">
                            <p className="text-sm font-medium">
                              {isTh ? 'รหัสอ้างอิงใช้งานแล้ว!' : isRu ? 'Реферальный код активен!' : 'Referral code active!'}
                            </p>
                          </div>
                          <span className="font-mono font-bold text-primary">{referralCode.toUpperCase()}</span>
                        </div>
                      )}

                      <div className="pt-4">
                        <button
                          onClick={handlePhoneNext}
                          className="w-full h-14 rounded-full bg-[#5D3A4A] hover:bg-[#4A2D3A] text-white font-medium text-lg flex items-center justify-center gap-2 transition-colors"
                        >
                          {t('auth.continue')}
                          <ArrowRight className="w-5 h-5" />
                        </button>
                      </div>
                    </>
                  )}

                  {/* Step 2: Registration Form */}
                  {signupStep === 'register' && (
                    <>
                      <AppLogo />

                      <div className="text-center space-y-1">
                        <h1 className="text-2xl font-display font-bold">
                          {t('auth.register')}
                        </h1>
                        <p className="text-sm text-primary font-medium uppercase tracking-wide">
                          REGISTER
                        </p>
                      </div>

                      {/* Section: Signing In */}
                      <SectionHeader
                        title={t('auth.signingIn')}
                        subtitle={isTh ? 'Signing In' : isTh ? '' : ''}
                      />

                      <div className="space-y-2">
                        <UnderlineInput
                          label={`${t('auth.phone')}/${isTh ? 'Mobile Phone' : 'Mobile Phone'}*`}
                          type="tel"
                          value={phone}
                          onChange={() => {}}
                          readOnly
                        />

                        <UnderlineInput
                          label={`${t('auth.email')}/Email*`}
                          type="email"
                          autoComplete="email"
                          value={email}
                          onChange={setEmail}
                          placeholder="your@email.com"
                          error={errors.email}
                          maxLengthDisplay={254}
                        />

                        <div className="space-y-1">
                          <label className="block text-sm text-muted-foreground">
                            {t('auth.password')}/Password*
                          </label>
                          <div className="relative">
                            <input
                              type={showPassword ? 'text' : 'password'}
                              name="new-password"
                              autoComplete="new-password"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              placeholder="••••••••"
                              className={cn(
                                "w-full h-12 bg-transparent border-0 border-b-2 px-0 pr-10 text-base transition-colors",
                                "focus:outline-none focus:ring-0",
                                errors.password ? "border-b-destructive" : "border-b-border focus:border-b-primary"
                              )}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-0 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                            >
                              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                          </div>
                          {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
                          <PasswordStrengthIndicator password={password} />
                        </div>

                        <div className="space-y-1">
                          <label className="block text-sm text-muted-foreground">
                            {t('auth.confirmPassword')}/{isTh ? 'Confirm Password' : 'Confirm Password'}*
                          </label>
                          <div className="relative">
                            <input
                              type={showPassword ? 'text' : 'password'}
                              name="confirm-password"
                              autoComplete="new-password"
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              placeholder="••••••••"
                              className={cn(
                                "w-full h-12 bg-transparent border-0 border-b-2 px-0 pr-10 text-base transition-colors",
                                "focus:outline-none focus:ring-0",
                                errors.confirmPassword ? "border-b-destructive" : "border-b-border focus:border-b-primary"
                              )}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-0 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                            >
                              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                          </div>
                          {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword}</p>}
                        </div>

                        <UnderlineInput
                          label={`${t('auth.referralCode')}/Referral Code`}
                          value={referralCode}
                          onChange={(val) => setReferralCode(val.toUpperCase())}
                          placeholder="ABC123"
                          maxLength={6}
                        />
                      </div>

                      {/* Section: Personal Information */}
                      <SectionHeader
                        title={t('auth.personalInfo')}
                        subtitle={isTh ? 'Personal Information' : isTh ? '' : ''}
                      />

                      <div className="space-y-2">
                        <UnderlineInput
                          label={`${t('auth.firstName')}/${isTh ? 'First Name' : 'First Name'}*`}
                          type="text"
                          autoComplete="given-name"
                          value={firstName}
                          onChange={setFirstName}
                          error={errors.firstName}
                          maxLengthDisplay={50}
                        />

                        <UnderlineInput
                          label={`${t('auth.lastName')}/${isTh ? 'Last Name' : 'Last Name'}*`}
                          type="text"
                          autoComplete="family-name"
                          value={lastName}
                          onChange={setLastName}
                          error={errors.lastName}
                          maxLengthDisplay={50}
                        />
                      </div>

                      {/* Terms */}
                      <label className="flex items-start gap-3 p-3 rounded-xl bg-primary/5 border border-primary/10 cursor-pointer mt-6">
                        <input
                          type="checkbox"
                          checked={termsAccepted}
                          onChange={(e) => setTermsAccepted(e.target.checked)}
                          className="mt-0.5 w-4 h-4 rounded border-border text-primary focus:ring-primary/50"
                        />
                        <p className="text-xs text-muted-foreground">
                          {isTh ? (
                            <>ฉันยอมรับ <Link to={APP_ROUTES.TERMS} target="_blank" className="text-primary hover:underline">ข้อกำหนดและเงื่อนไข</Link> และ <Link to={APP_ROUTES.PRIVACY} target="_blank" className="text-primary hover:underline">นโยบายความเป็นส่วนตัว</Link></>
                          ) : isRu ? (
                            <>Я принимаю <Link to={APP_ROUTES.TERMS} target="_blank" className="text-primary hover:underline">Условия использования</Link> и <Link to={APP_ROUTES.PRIVACY} target="_blank" className="text-primary hover:underline">Политику конфиденциальности</Link></>
                          ) : (
                            <>I agree to the <Link to={APP_ROUTES.TERMS} target="_blank" className="text-primary hover:underline">Terms of Service</Link> and <Link to={APP_ROUTES.PRIVACY} target="_blank" className="text-primary hover:underline">Privacy Policy</Link></>
                          )}
                        </p>
                      </label>

                      {/* Navigation */}
                      <div className="flex items-center gap-4 pt-4">
                        <button
                          onClick={() => setSignupStep('phone')}
                          className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors font-medium"
                        >
                          <ArrowLeft className="w-4 h-4" />
                          {t('auth.back')}/{isTh ? 'Back' : 'Back'}
                        </button>
                        <button
                          onClick={handleSignup}
                          disabled={isLoading}
                          className="flex-1 h-14 rounded-full bg-[#5D3A4A] hover:bg-[#4A2D3A] disabled:opacity-50 text-white font-medium text-base flex items-center justify-center gap-2 transition-colors"
                          data-testid="signup-button"
                        >
                          {isLoading ? (
                            <>
                              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                              </svg>
                            </>
                          ) : (
                            <>
                              {t('auth.continue')}
                              <ArrowRight className="w-5 h-5" />
                            </>
                          )}
                        </button>
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
          {isTh
            ? 'ดำเนินการต่อ คุณยอมรับข้อกำหนดและเงื่อนไข'
            : isRu
              ? 'Продолжая, вы соглашаетесь с Условиями использования'
              : 'By continuing, you agree to our Terms of Service'}
        </p>
      </footer>
    </div>
  );
}
