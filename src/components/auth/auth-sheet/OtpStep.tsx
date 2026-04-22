/**
 * OtpStep — verify 6-digit OTP via Supabase verifyOtp.
 * Single auth.users row guaranteed (Supabase matches by phone, prelink ensured UUID).
 */
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';

interface OtpStepProps {
  phone: string;
  onBack: () => void;
  onSuccess: () => void;
}

export function OtpStep({ phone, onBack, onSuccess }: OtpStepProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) {
      toast.error(isRu ? 'Код должен содержать 6 цифр' : 'Code must be 6 digits');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        phone,
        token: code,
        type: 'sms',
      });
      if (error) {
        toast.error(error.message || (isRu ? 'Неверный код' : 'Invalid code'));
        return;
      }
      onSuccess();
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    setResending(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({ phone });
      if (error) {
        toast.error(isRu ? 'Не удалось отправить повторно' : 'Could not resend');
        return;
      }
      toast.success(isRu ? 'Код отправлен повторно' : 'Code resent');
    } finally {
      setResending(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="w-4 h-4" />
        {isRu ? 'Назад' : 'Back'}
      </button>

      <div className="space-y-2">
        <Label>{isRu ? `Код отправлен на ${phone}` : `Code sent to ${phone}`}</Label>
        <div className="flex justify-center">
          <InputOTP maxLength={6} value={code} onChange={setCode} autoFocus>
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
        </div>
      </div>

      <Button type="submit" size="lg" className="w-full" disabled={loading || code.length !== 6}>
        {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
        {isRu ? 'Подтвердить' : 'Verify'}
      </Button>

      <button
        type="button"
        onClick={resend}
        disabled={resending}
        className="block w-full text-center text-sm text-muted-foreground hover:text-foreground"
      >
        {resending
          ? (isRu ? 'Отправка…' : 'Sending…')
          : (isRu ? 'Отправить код повторно' : 'Resend code')}
      </button>
    </form>
  );
}
