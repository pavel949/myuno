/**
 * @module AuthSheet
 * @description Airbnb-style unified auth modal/sheet.
 *
 * Steps:
 *   - method: choose Email / Phone / Google / Apple
 *   - email: email + password + name (single screen, signin or signup)
 *   - phone: phone input (E.164)
 *   - otp: 6-digit OTP confirmation
 *
 * All paths finalize through Supabase Auth → single UUID guaranteed.
 */
import React, { useState } from 'react';
import { ResponsiveModal } from '@/components/ui/responsive-modal';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFeatureFlag } from '@/hooks/useFeatureFlags';
import { MethodStep } from './auth-sheet/MethodStep';
import { EmailStep } from './auth-sheet/EmailStep';
import { PhoneStep } from './auth-sheet/PhoneStep';
import { OtpStep } from './auth-sheet/OtpStep';
import { Sparkles } from 'lucide-react';

type Step = 'method' | 'email' | 'phone' | 'otp';

interface AuthSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  intent?: string;
}

export function AuthSheet({ open, onOpenChange, onSuccess, intent }: AuthSheetProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const phoneEnabled = useFeatureFlag('AUTH_PHONE' as any) || false;

  const [step, setStep] = useState<Step>('method');
  const [pendingPhone, setPendingPhone] = useState('');

  // Reset step whenever the sheet opens.
  React.useEffect(() => {
    if (open) setStep('method');
  }, [open]);

  const titleByStep: Record<Step, string> = {
    method: isRu ? 'Войти или зарегистрироваться' : 'Log in or sign up',
    email: isRu ? 'Email' : 'Email',
    phone: isRu ? 'Телефон' : 'Phone',
    otp: isRu ? 'Введите код' : 'Enter code',
  };

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={onOpenChange}
      title={titleByStep[step]}
      description={
        step === 'method'
          ? (isRu ? 'Добро пожаловать в myUNO' : 'Welcome to myUNO')
          : undefined
      }
      icon={<Sparkles className="w-5 h-5 text-primary" />}
      size="sm"
      mobileHeight="max-h-[92vh]"
    >
      <div className="px-1 pb-2">
        {step === 'method' && (
          <MethodStep
            phoneEnabled={phoneEnabled}
            onPickEmail={() => setStep('email')}
            onPickPhone={() => setStep('phone')}
            onSuccess={onSuccess}
            intent={intent}
          />
        )}
        {step === 'email' && (
          <EmailStep
            onBack={() => setStep('method')}
            onSuccess={onSuccess}
          />
        )}
        {step === 'phone' && (
          <PhoneStep
            onBack={() => setStep('method')}
            onOtpSent={(phone) => {
              setPendingPhone(phone);
              setStep('otp');
            }}
          />
        )}
        {step === 'otp' && (
          <OtpStep
            phone={pendingPhone}
            onBack={() => setStep('phone')}
            onSuccess={onSuccess}
          />
        )}
      </div>
    </ResponsiveModal>
  );
}
