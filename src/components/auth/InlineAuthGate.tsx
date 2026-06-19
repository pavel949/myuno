import React, { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Loader2, Mail, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { lovable } from '@/integrations/lovable';
import { logger } from '@/lib/logger';

interface InlineAuthGateProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  language: 'ru' | 'en';
  /** Prefill from booking form so the user doesn't retype. */
  defaultEmail?: string;
  defaultName?: string;
  defaultPhone?: string;
  /** Fires when auth succeeds (sign-in or sign-up). The parent should
   *  continue the booking flow (e.g. re-call handleSubmit). */
  onAuthenticated: () => void;
  /** Optional context line — e.g. "Бронирование трансфера, ฿1 200" */
  contextLine?: string;
}

const t = (lang: 'ru' | 'en', ru: string, en: string) => (lang === 'ru' ? ru : en);

export function InlineAuthGate({
  open,
  onOpenChange,
  language,
  defaultEmail = '',
  defaultName = '',
  defaultPhone = '',
  onAuthenticated,
  contextLine,
}: InlineAuthGateProps) {
  const { signUp, signIn } = useAuth();
  const [tab, setTab] = useState<'signup' | 'signin'>('signup');
  const [email, setEmail] = useState(defaultEmail);
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  // Sync prefill if it changes while sheet is open.
  React.useEffect(() => { if (defaultEmail) setEmail(defaultEmail); }, [defaultEmail]);

  const handleSignUp = async () => {
    if (!email || !password) {
      toast.error(t(language, 'Введите email и пароль', 'Enter email and password'));
      return;
    }
    if (password.length < 6) {
      toast.error(t(language, 'Пароль минимум 6 символов', 'Password min 6 characters'));
      return;
    }
    setBusy(true);
    try {
      const { error, data } = await signUp({
        email,
        password,
        fullName: defaultName,
        phone: defaultPhone,
      });
      if (error) {
        // If user already exists — switch tab and prompt sign in
        if (/already.*registered|user.*exists/i.test(error.message)) {
          toast.info(t(language, 'Аккаунт уже существует — войдите', 'Account exists — please sign in'));
          setTab('signin');
          return;
        }
        toast.error(error.message);
        return;
      }
      if (data?.session) {
        toast.success(t(language, 'Аккаунт создан', 'Account created'));
        onAuthenticated();
        onOpenChange(false);
      } else {
        // Email confirmation required — but for booking flow we still want to proceed.
        // The user is created; ask them to confirm email afterwards.
        toast.success(t(language,
          'Аккаунт создан. Подтверждение email отправлено.',
          'Account created. Confirmation email sent.'));
        onAuthenticated();
        onOpenChange(false);
      }
    } catch (err) {
      logger.error('[InlineAuthGate] signUp', err);
      toast.error(t(language, 'Не удалось создать аккаунт', 'Failed to create account'));
    } finally {
      setBusy(false);
    }
  };

  const handleSignIn = async () => {
    if (!email || !password) {
      toast.error(t(language, 'Введите email и пароль', 'Enter email and password'));
      return;
    }
    setBusy(true);
    try {
      const { error } = await signIn(email, password);
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success(t(language, 'С возвращением!', 'Welcome back!'));
      onAuthenticated();
      onOpenChange(false);
    } catch (err) {
      logger.error('[InlineAuthGate] signIn', err);
      toast.error(t(language, 'Не удалось войти', 'Failed to sign in'));
    } finally {
      setBusy(false);
    }
  };

  const handleGoogle = async () => {
    setBusy(true);
    try {
      // Redirect back to the current page so the draft restores from sessionStorage.
      const result = await lovable.auth.signInWithOAuth('google', {
        redirect_uri: window.location.href,
      });
      if (result.error) {
        toast.error(result.error.message ?? t(language, 'Ошибка входа через Google', 'Google sign-in failed'));
        setBusy(false);
        return;
      }
      if (result.redirected) {
        // Browser will redirect to Google — nothing more to do here.
        return;
      }
      // Tokens received and session set — proceed.
      onAuthenticated();
      onOpenChange(false);
      setBusy(false);
    } catch (err) {
      logger.error('[InlineAuthGate] google', err);
      toast.error(t(language, 'Ошибка входа через Google', 'Google sign-in failed'));
      setBusy(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[92vh] overflow-y-auto">
        <SheetHeader className="text-left">
          <SheetTitle className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" />
            {t(language, 'Завершите бронирование', 'Finish your booking')}
          </SheetTitle>
          <SheetDescription>
            {t(language,
              'Нужен аккаунт, чтобы вы видели заказ, чек и статус водителя. Данные формы сохранены — ничего не потеряется.',
              'You need an account to track the order, receipt, and driver status. Your form is saved — nothing will be lost.')}
          </SheetDescription>
          {contextLine && (
            <p className="text-xs text-muted-foreground pt-1 font-mono">{contextLine}</p>
          )}
        </SheetHeader>

        <div className="mt-4 space-y-4">
          {/* Google — fastest path */}
          <Button
            type="button"
            variant="outline"
            className="w-full h-11"
            onClick={handleGoogle}
            disabled={busy}
          >
            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" aria-hidden>
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.25 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC04" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/>
            </svg>
            {t(language, 'Продолжить через Google', 'Continue with Google')}
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
            <div className="relative flex justify-center text-[11px] uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                {t(language, 'или по email', 'or with email')}
              </span>
            </div>
          </div>

          <Tabs value={tab} onValueChange={(v) => setTab(v as 'signup' | 'signin')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signup">
                {t(language, 'Создать аккаунт', 'Create account')}
              </TabsTrigger>
              <TabsTrigger value="signin">
                {t(language, 'Войти', 'Sign in')}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="signup" className="space-y-3 mt-4">
              <p className="text-xs text-muted-foreground">
                {t(language,
                  'Рекомендуем — 10 секунд, и заказ сразу в личном кабинете.',
                  'Recommended — 10 seconds and the order lands in your account.')}
              </p>
              <div className="space-y-2">
                <Label htmlFor="ag-email">Email</Label>
                <Input
                  id="ag-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="h-11"
                  autoComplete="email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ag-password">{t(language, 'Пароль', 'Password')}</Label>
                <Input
                  id="ag-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t(language, 'Минимум 6 символов', 'At least 6 characters')}
                  className="h-11"
                  autoComplete="new-password"
                />
              </div>
              <Button
                type="button"
                className="w-full h-11"
                onClick={handleSignUp}
                disabled={busy}
              >
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                  <>
                    <Mail className="w-4 h-4 mr-2" />
                    {t(language, 'Создать и продолжить', 'Create & continue')}
                  </>
                )}
              </Button>
            </TabsContent>

            <TabsContent value="signin" className="space-y-3 mt-4">
              <div className="space-y-2">
                <Label htmlFor="ag-email-in">Email</Label>
                <Input
                  id="ag-email-in"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11"
                  autoComplete="email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ag-password-in">{t(language, 'Пароль', 'Password')}</Label>
                <Input
                  id="ag-password-in"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11"
                  autoComplete="current-password"
                />
              </div>
              <Button
                type="button"
                className="w-full h-11"
                onClick={handleSignIn}
                disabled={busy}
              >
                {busy
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : t(language, 'Войти и продолжить', 'Sign in & continue')}
              </Button>
            </TabsContent>
          </Tabs>

          <p className="text-[11px] text-muted-foreground text-center">
            {t(language,
              'Ваши данные формы сохранены локально и восстановятся автоматически.',
              'Your form data is saved locally and will restore automatically.')}
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
