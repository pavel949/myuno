/**
 * MethodStep — primary auth method picker.
 * Shows: Continue with email • Continue with phone (if enabled) • Google • Apple.
 */
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Mail, Phone, Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { lovable } from '@/integrations/lovable';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09A6.97 6.97 0 015.5 12c0-.73.13-1.43.34-2.09V7.07H2.18A11 11 0 001 12c0 1.78.43 3.46 1.18 4.93l3.66-2.84z"/>
    <path fill="#EA4335" d="M12 4.93c1.62 0 3.08.56 4.22 1.65l3.16-3.16C17.45 1.69 14.97.5 12 .5 7.7.5 3.99 2.97 2.18 6.07l3.66 2.84C6.71 6.31 9.14 4.93 12 4.93z"/>
  </svg>
);

const AppleIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true" fill="currentColor">
    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
  </svg>
);

interface MethodStepProps {
  phoneEnabled: boolean;
  onPickEmail: () => void;
  onPickPhone: () => void;
  onSuccess: () => void;
  intent?: string;
}

export function MethodStep({ phoneEnabled, onPickEmail, onPickPhone, onSuccess, intent }: MethodStepProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const [oauthLoading, setOauthLoading] = useState<'google' | 'apple' | null>(null);

  const handleOAuth = async (provider: 'google' | 'apple') => {
    setOauthLoading(provider);
    try {
      const result = await lovable.auth.signInWithOAuth(provider, {
        redirect_uri: window.location.origin,
      });
      if (result.error) {
        toast.error(isRu ? 'Не удалось войти' : 'Sign-in failed');
        logger.error('[AuthSheet] OAuth error', result.error);
        return;
      }
      if (result.redirected) return; // browser will navigate away
      onSuccess();
    } catch (err) {
      logger.error('[AuthSheet] OAuth exception', err);
      toast.error(isRu ? 'Ошибка входа' : 'Sign-in error');
    } finally {
      setOauthLoading(null);
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        {isRu
          ? 'Выберите удобный способ входа. Один аккаунт — все сервисы Пхукета.'
          : 'Pick a sign-in method. One account, the whole Phuket ecosystem.'}
      </p>

      <Button
        variant="outline"
        size="lg"
        className="w-full justify-start gap-3 h-12"
        onClick={onPickEmail}
        data-testid="auth-method-email"
      >
        <Mail className="w-5 h-5" />
        <span className="flex-1 text-left">{isRu ? 'Продолжить с email' : 'Continue with email'}</span>
      </Button>

      {phoneEnabled && (
        <Button
          variant="outline"
          size="lg"
          className="w-full justify-start gap-3 h-12"
          onClick={onPickPhone}
          data-testid="auth-method-phone"
        >
          <Phone className="w-5 h-5" />
          <span className="flex-1 text-left">{isRu ? 'Продолжить по телефону' : 'Continue with phone'}</span>
        </Button>
      )}

      <div className="relative my-4">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase tracking-wide">
          <span className="bg-background px-2 text-muted-foreground">{isRu ? 'или' : 'or'}</span>
        </div>
      </div>

      <Button
        variant="outline"
        size="lg"
        className="w-full justify-start gap-3 h-12"
        onClick={() => handleOAuth('google')}
        disabled={!!oauthLoading}
        data-testid="auth-method-google"
      >
        {oauthLoading === 'google' ? <Loader2 className="w-5 h-5 animate-spin" /> : <GoogleIcon />}
        <span className="flex-1 text-left">{isRu ? 'Продолжить через Google' : 'Continue with Google'}</span>
      </Button>

      <Button
        variant="outline"
        size="lg"
        className="w-full justify-start gap-3 h-12"
        onClick={() => handleOAuth('apple')}
        disabled={!!oauthLoading}
        data-testid="auth-method-apple"
      >
        {oauthLoading === 'apple' ? <Loader2 className="w-5 h-5 animate-spin" /> : <AppleIcon />}
        <span className="flex-1 text-left">{isRu ? 'Продолжить через Apple' : 'Continue with Apple'}</span>
      </Button>

      <p className="pt-3 text-[11px] leading-relaxed text-muted-foreground text-center">
        {isRu
          ? 'Продолжая, вы соглашаетесь с Условиями использования и Политикой конфиденциальности.'
          : 'By continuing you agree to the Terms of Service and Privacy Policy.'}
      </p>
    </div>
  );
}
