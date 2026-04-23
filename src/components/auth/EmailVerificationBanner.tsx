/**
 * @module EmailVerificationBanner
 * @description Persistent top banner shown to users who haven't verified their email.
 * Soft-verification approach: user can use the app but gets a clear nudge.
 * Dismissible per session; auto-hides once email is confirmed.
 */
import React, { useState } from 'react';
import { Mail, X, Loader2, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const SESSION_KEY = 'uno_email_banner_dismissed';

export function EmailVerificationBanner() {
  const { user } = useAuth();
  const { language } = useLanguage();
  // All hooks at the top — before any conditional returns
  const [isResending, setIsResending] = useState(false);
  const [dismissed, setDismissed] = useState(() => {
    try {
      return sessionStorage.getItem(SESSION_KEY) === '1';
    } catch {
      // ignored — sessionStorage may be unavailable (private browsing)
      return false;
    }
  });

  const isRu = language === 'ru';

  // Don't show if: no user, email confirmed, or dismissed this session
  if (!user || user.email_confirmed_at || dismissed) return null;

  const handleDismiss = () => {
    try { sessionStorage.setItem(SESSION_KEY, '1'); } catch { /* ignored */ }
    setDismissed(true);
  };

  const handleResend = async () => {
    if (!user.email || isResending) return;
    setIsResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email,
        options: { emailRedirectTo: `${window.location.origin}/` },
      });
      if (error) throw error;
      toast.success(
        isRu
          ? `Письмо отправлено на ${user.email}`
          : `Verification email sent to ${user.email}`,
        { icon: <CheckCircle className="w-4 h-4" /> }
      );
    } catch {
      toast.error(isRu ? 'Не удалось отправить письмо' : 'Failed to send email');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div
      className="w-full bg-warning/15 border-b border-warning/30 px-4 py-2.5 flex items-center gap-3"
      role="alert"
    >
      <Mail className="w-4 h-4 text-warning flex-shrink-0" />

      <p className="flex-1 text-sm text-foreground/80 min-w-0">
        {isRu
          ? 'Подтвердите ваш email, чтобы получить полный доступ.'
          : 'Please verify your email to unlock full access.'}
        {' '}
        <button
          onClick={handleResend}
          disabled={isResending}
          className="font-semibold text-primary underline underline-offset-2 hover:no-underline transition-all disabled:opacity-60 inline-flex items-center gap-1"
        >
          {isResending ? (
            <>
              <Loader2 className="w-3 h-3 animate-spin" />
              {isRu ? 'Отправка...' : 'Sending...'}
            </>
          ) : (
            isRu ? 'Отправить повторно' : 'Resend email'
          )}
        </button>
      </p>

      <button
        onClick={handleDismiss}
        aria-label={isRu ? 'Закрыть' : 'Dismiss'}
        className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-none hover:bg-muted transition-colors text-muted-foreground"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
