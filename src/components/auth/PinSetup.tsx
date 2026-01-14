import React, { useState } from 'react';
import { Shield, Check, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PinInput } from './PinInput';
import { usePinAuth } from '@/hooks/usePinAuth';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface PinSetupProps {
  onComplete: () => void;
  onSkip?: () => void;
}

export const PinSetup: React.FC<PinSetupProps> = ({ onComplete, onSkip }) => {
  const { language } = useLanguage();
  const { setupPin } = usePinAuth();
  const [step, setStep] = useState<'enter' | 'confirm'>('enter');
  const [firstPin, setFirstPin] = useState('');
  const [error, setError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const t = {
    en: {
      title: 'Set up Quick PIN',
      subtitle: 'Create a 6-digit PIN for fast login',
      enterPin: 'Enter your PIN',
      confirmPin: 'Confirm your PIN',
      skip: 'Skip for now',
      pinMismatch: 'PINs do not match. Try again.',
      success: 'PIN set up successfully!',
      error: 'Failed to set up PIN. Please try again.'
    },
    ru: {
      title: 'Настройка быстрого PIN',
      subtitle: 'Создайте 6-значный PIN для быстрого входа',
      enterPin: 'Введите PIN',
      confirmPin: 'Подтвердите PIN',
      skip: 'Пропустить',
      pinMismatch: 'PIN-коды не совпадают. Попробуйте снова.',
      success: 'PIN успешно установлен!',
      error: 'Не удалось установить PIN. Попробуйте снова.'
    }
  };

  const texts = t[language];

  const handleFirstPin = (pin: string) => {
    setFirstPin(pin);
    setStep('confirm');
    setError(false);
  };

  const handleConfirmPin = async (pin: string) => {
    if (pin !== firstPin) {
      setError(true);
      toast.error(texts.pinMismatch);
      setStep('enter');
      setFirstPin('');
      return;
    }

    setIsLoading(true);
    try {
      await setupPin(pin);
      toast.success(texts.success);
      onComplete();
    } catch (err) {
      console.error('Error setting up PIN:', err);
      toast.error(texts.error);
      setError(true);
      setStep('enter');
      setFirstPin('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    setStep('enter');
    setFirstPin('');
    setError(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-6">
      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
        <Shield className="w-8 h-8 text-primary" />
      </div>

      <h2 className="text-2xl font-bold text-foreground mb-2 text-center">
        {texts.title}
      </h2>
      <p className="text-muted-foreground text-center mb-8">
        {texts.subtitle}
      </p>

      <div className="w-full max-w-sm">
        <p className="text-sm text-muted-foreground text-center mb-4">
          {step === 'enter' ? texts.enterPin : texts.confirmPin}
        </p>

        {step === 'confirm' && (
          <button
            onClick={handleBack}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 mx-auto"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        )}

        <PinInput
          key={step}
          onComplete={step === 'enter' ? handleFirstPin : handleConfirmPin}
          disabled={isLoading}
          error={error}
        />

        {isLoading && (
          <div className="flex items-center justify-center gap-2 mt-6 text-primary">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="text-sm">Setting up...</span>
          </div>
        )}
      </div>

      {onSkip && (
        <Button
          variant="ghost"
          onClick={onSkip}
          className="mt-8 text-muted-foreground"
          disabled={isLoading}
        >
          {texts.skip}
        </Button>
      )}
    </div>
  );
};
