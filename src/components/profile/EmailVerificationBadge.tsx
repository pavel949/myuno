import React, { useState } from 'react';
import { CheckCircle, AlertCircle, Mail, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { PremiumButton } from '@/components/uno/PremiumButton';
import { toast } from 'sonner';

interface EmailVerificationBadgeProps {
  variant?: 'inline' | 'card';
}

export function EmailVerificationBadge({ variant = 'inline' }: EmailVerificationBadgeProps) {
  const { user } = useAuth();
  const { language } = useLanguage();
  const [isResending, setIsResending] = useState(false);

  if (!user) return null;

  const isVerified = user.email_confirmed_at !== null;

  const handleResendVerification = async () => {
    if (!user.email) return;
    
    setIsResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (error) throw error;

      toast.success(
        language === 'ru' 
          ? 'Письмо отправлено! Проверьте почту.' 
          : 'Email sent! Check your inbox.'
      );
    } catch (error: any) {
      console.error('Resend verification error:', error);
      toast.error(
        language === 'ru' 
          ? 'Ошибка отправки письма' 
          : 'Failed to send email'
      );
    } finally {
      setIsResending(false);
    }
  };

  if (variant === 'inline') {
    return (
      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
        {isVerified ? (
          <>
            <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-success shrink-0" />
            <span className="text-xs sm:text-sm text-success">
              {language === 'ru' ? 'Email подтверждён' : 'Email verified'}
            </span>
          </>
        ) : (
          <>
            <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-warning shrink-0" />
            <span className="text-xs sm:text-sm text-warning">
              {language === 'ru' ? 'Email не подтверждён' : 'Email not verified'}
            </span>
            <PremiumButton
              variant="ghost"
              size="sm"
              onClick={handleResendVerification}
              disabled={isResending}
              className="h-5 sm:h-6 px-1.5 sm:px-2 text-[10px] sm:text-xs"
            >
              {isResending ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                language === 'ru' ? 'Отправить' : 'Resend'
              )}
            </PremiumButton>
          </>
        )}
      </div>
    );
  }

  // Card variant
  if (isVerified) {
    return (
      <div className="flex items-center gap-3 p-4 bg-success/10 border border-success/30 rounded-xl">
        <div className="w-10 h-10 rounded-full bg-success/15 flex items-center justify-center">
          <CheckCircle className="w-5 h-5 text-success" />
        </div>
        <div className="flex-1">
          <p className="font-medium text-success">
            {language === 'ru' ? 'Email подтверждён' : 'Email Verified'}
          </p>
          <p className="text-sm text-success/80">
            {user.email}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-warning/10 border border-warning/30 rounded-xl">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-warning/15 flex items-center justify-center shrink-0">
          <Mail className="w-5 h-5 text-warning" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-warning">
            {language === 'ru' ? 'Подтвердите email' : 'Verify Your Email'}
          </p>
          <p className="text-sm text-warning/80 mt-1">
            {language === 'ru' 
              ? 'Мы отправили письмо на вашу почту. Перейдите по ссылке для подтверждения.' 
              : 'We sent a verification link to your email. Click the link to verify.'}
          </p>
          <PremiumButton
            variant="outline"
            size="sm"
            onClick={handleResendVerification}
            disabled={isResending}
            className="mt-3 border-warning/40 text-warning hover:bg-warning/10"
          >
            {isResending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {language === 'ru' ? 'Отправка...' : 'Sending...'}
              </>
            ) : (
              <>
                <Mail className="w-4 h-4 mr-2" />
                {language === 'ru' ? 'Отправить письмо повторно' : 'Resend Verification Email'}
              </>
            )}
          </PremiumButton>
        </div>
      </div>
    </div>
  );
}
