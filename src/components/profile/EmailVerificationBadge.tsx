import React, { useState } from 'react';
import { logger } from '@/lib/logger';
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
      logger.error('Resend verification error:', error);
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
            <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-500 shrink-0" />
            <span className="text-xs sm:text-sm text-green-600 dark:text-green-400">
              {language === 'ru' ? 'Email подтверждён' : 'Email verified'}
            </span>
          </>
        ) : (
          <>
            <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500 shrink-0" />
            <span className="text-xs sm:text-sm text-amber-600 dark:text-amber-400">
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
      <div className="flex items-center gap-3 p-4 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 rounded-xl">
        <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
          <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
        </div>
        <div className="flex-1">
          <p className="font-medium text-green-700 dark:text-green-300">
            {language === 'ru' ? 'Email подтверждён' : 'Email Verified'}
          </p>
          <p className="text-sm text-green-600 dark:text-green-400">
            {user.email}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-xl">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center shrink-0">
          <Mail className="w-5 h-5 text-amber-600 dark:text-amber-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-amber-700 dark:text-amber-300">
            {language === 'ru' ? 'Подтвердите email' : 'Verify Your Email'}
          </p>
          <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
            {language === 'ru' 
              ? 'Мы отправили письмо на вашу почту. Перейдите по ссылке для подтверждения.' 
              : 'We sent a verification link to your email. Click the link to verify.'}
          </p>
          <PremiumButton
            variant="outline"
            size="sm"
            onClick={handleResendVerification}
            disabled={isResending}
            className="mt-3 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/50"
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
