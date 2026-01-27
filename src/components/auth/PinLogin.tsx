import React, { useState, useCallback } from 'react';
import { Lock, User, KeyRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PinInput } from './PinInput';
import { usePinAuth } from '@/hooks/usePinAuth';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

interface PinLoginProps {
  onSuccess: () => void;
  onSwitchToEmail: () => void;
}

export const PinLogin: React.FC<PinLoginProps> = ({ onSuccess, onSwitchToEmail }) => {
  const { language } = useLanguage();
  const { verifyPin, savedEmail, clearPinData } = usePinAuth();
  const [error, setError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [inputKey, setInputKey] = useState(0);

  const t = {
    en: {
      title: 'Welcome back',
      subtitle: 'Enter your PIN to continue',
      forgotPin: 'Forgot PIN? Login with password',
      wrongPin: 'Wrong PIN. Try again.',
      tooManyAttempts: 'Too many attempts. Please login with password.',
      error: 'Authentication failed. Please try again.',
      useEmail: 'Use email instead',
      notYou: 'Not you?'
    },
    ru: {
      title: 'С возвращением',
      subtitle: 'Введите PIN для продолжения',
      forgotPin: 'Забыли PIN? Войти с паролем',
      wrongPin: 'Неверный PIN. Попробуйте снова.',
      tooManyAttempts: 'Слишком много попыток. Войдите с паролем.',
      error: 'Ошибка аутентификации. Попробуйте снова.',
      useEmail: 'Использовать email',
      notYou: 'Не вы?'
    }
  };

  const texts = t[language];
  const MAX_ATTEMPTS = 5;

  const handlePinComplete = useCallback(async (pin: string) => {
    if (attempts >= MAX_ATTEMPTS) {
      toast.error(texts.tooManyAttempts);
      return;
    }

    setIsLoading(true);
    setError(false);

    try {
      console.log('[PinLogin] Verifying PIN...');
      await verifyPin(pin);
      console.log('[PinLogin] PIN verified successfully');
      toast.success(language === 'en' ? 'Welcome back!' : 'С возвращением!');
      onSuccess();
    } catch (err: any) {
      console.error('[PinLogin] PIN verification error:', err);
      setError(true);
      
      const errorMessage = err?.message || '';
      
      // Check for session-related errors (expired, invalid, not found)
      const isSessionError = 
        errorMessage.includes('Session expired') || 
        errorMessage.includes('expired') ||
        errorMessage.includes('Refresh Token') ||
        errorMessage.includes('refresh_token') ||
        errorMessage.includes('Invalid') ||
        errorMessage.includes('Not Found');
      
      if (isSessionError) {
        console.log('[PinLogin] Session error detected, switching to email login');
        toast.error(language === 'en' ? 'Session expired. Please login with password.' : 'Сессия истекла. Войдите с паролем.');
        onSwitchToEmail();
        return;
      }
      
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      
      // Reset PIN input for retry
      setTimeout(() => {
        setInputKey(prev => prev + 1);
        setError(false);
      }, 600);
      
      if (newAttempts >= MAX_ATTEMPTS) {
        toast.error(texts.tooManyAttempts);
        onSwitchToEmail();
      } else {
        toast.error(texts.wrongPin);
      }
    } finally {
      setIsLoading(false);
    }
  }, [attempts, texts, verifyPin, language, onSuccess, onSwitchToEmail]);

  const handleSwitchUser = useCallback(() => {
    clearPinData();
    onSwitchToEmail();
  }, [clearPinData, onSwitchToEmail]);

  // Mask email for display
  const maskedEmail = savedEmail 
    ? savedEmail.replace(/(.{2})(.*)(@.*)/, '$1***$3')
    : '';

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-6">
      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
        <Lock className="w-8 h-8 text-primary" />
      </div>

      <h2 className="text-2xl font-bold text-foreground mb-2 text-center">
        {texts.title}
      </h2>
      
      {maskedEmail && (
        <div className="flex items-center gap-2 text-muted-foreground mb-2">
          <User className="w-4 h-4" />
          <span className="text-sm">{maskedEmail}</span>
        </div>
      )}
      
      <p className="text-muted-foreground text-center mb-8">
        {texts.subtitle}
      </p>

      <div className="w-full max-w-sm">
        <PinInput
          key={inputKey}
          onComplete={handlePinComplete}
          disabled={isLoading || attempts >= MAX_ATTEMPTS}
          error={error}
        />

        {isLoading && (
          <div className="flex items-center justify-center gap-2 mt-6 text-primary">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {attempts > 0 && attempts < MAX_ATTEMPTS && (
          <p className="text-sm text-muted-foreground text-center mt-4">
            {MAX_ATTEMPTS - attempts} {language === 'en' ? 'attempts left' : 'попыток осталось'}
          </p>
        )}
      </div>

      <div className="flex flex-col items-center gap-2 mt-8">
        <Button
          variant="ghost"
          onClick={onSwitchToEmail}
          className="text-muted-foreground"
          disabled={isLoading}
        >
          <KeyRound className="w-4 h-4 mr-2" />
          {texts.forgotPin}
        </Button>
        
        <button
          onClick={handleSwitchUser}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          disabled={isLoading}
        >
          {texts.notYou}
        </button>
      </div>
    </div>
  );
};
