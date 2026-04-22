/**
 * PhoneStep — collect phone in E.164, call auth-phone-prelink, then signInWithOtp.
 * Only shown when feature_flag:auth_phone is enabled.
 */
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

interface PhoneStepProps {
  onBack: () => void;
  onOtpSent: (phone: string) => void;
}

const E164 = /^\+[1-9]\d{7,14}$/;

export function PhoneStep({ onBack, onOtpSent }: PhoneStepProps) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const [phone, setPhone] = useState('+66');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = phone.replace(/\s|-/g, '');
    if (!E164.test(trimmed)) {
      toast.error(isRu ? 'Введите номер в формате +66...' : 'Enter phone in +66... format');
      return;
    }

    setLoading(true);
    try {
      // Step 1: pre-link existing UUID if profile.phone matches.
      try {
        await supabase.functions.invoke('auth-phone-prelink', { body: { phone: trimmed } });
      } catch (err) {
        // Non-fatal — Supabase OTP still works
        logger.warn('[PhoneStep] prelink failed (non-fatal)', err);
      }

      // Step 2: send OTP
      const { error } = await supabase.auth.signInWithOtp({ phone: trimmed });
      if (error) {
        toast.error(error.message || (isRu ? 'Не удалось отправить код' : 'Could not send code'));
        return;
      }

      onOtpSent(trimmed);
    } finally {
      setLoading(false);
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
        <Label htmlFor="auth-phone-input">{isRu ? 'Номер телефона' : 'Phone number'}</Label>
        <Input
          id="auth-phone-input"
          type="tel"
          autoComplete="tel"
          placeholder="+66 81 234 5678"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
          autoFocus
        />
        <p className="text-xs text-muted-foreground">
          {isRu
            ? 'Мы отправим SMS с 6-значным кодом.'
            : 'We will send a 6-digit code via SMS.'}
        </p>
      </div>

      <Button type="submit" size="lg" className="w-full" disabled={loading}>
        {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
        {isRu ? 'Получить код' : 'Send code'}
      </Button>
    </form>
  );
}
