import { useState } from 'react';
import { lovable } from '@/integrations/lovable/index';
import { useLanguage } from '@/contexts/LanguageContext';
import { LoadingSpinner } from '@/components/uno/LoadingSpinner';
import { toast } from 'sonner';

interface GoogleSignInButtonProps {
  redirectTo?: string;
  label?: { en: string; ru: string; th?: string };
}

/**
 * Google OAuth sign-in button using Lovable Cloud Managed Social Login.
 * Works for both signup and login — Google identifies user by email automatically.
 */
export function GoogleSignInButton({ redirectTo, label }: GoogleSignInButtonProps) {
  const { language } = useLanguage();
  const [loading, setLoading] = useState(false);

  const isRu = language === 'ru';
  const isTh = language === 'th';
  const text = label
    ? (isTh && label.th ? label.th : isRu ? label.ru : label.en)
    : (isTh ? 'ดำเนินการต่อด้วย Google' : isRu ? 'Продолжить с Google' : 'Continue with Google');

  const handleClick = async () => {
    setLoading(true);
    // Bible-v2 audit B3: re-arm the post-auth redirect cleanly on every click
    // so a stale value from a previous cancelled OAuth attempt cannot leak
    // into the next sign-in. The timestamp lets Auth.tsx ignore expired values.
    sessionStorage.removeItem('myuno_post_auth_redirect');
    try {
      const oauthCallbackUrl = `${window.location.origin}/auth/callback`;
      if (redirectTo) {
        try {
          const parsed = new URL(redirectTo, window.location.origin);
          if (parsed.origin === window.location.origin) {
            const path = `${parsed.pathname}${parsed.search}${parsed.hash}` || '/';
            sessionStorage.setItem(
              'myuno_post_auth_redirect',
              JSON.stringify({ path, ts: Date.now() }),
            );
          }
        } catch {
          // Ignore malformed redirect values and continue OAuth safely.
        }
      }
      const result = await lovable.auth.signInWithOAuth('google', {
        // Keep one stable callback URL to avoid provider redirect_uri mismatch.
        redirect_uri: oauthCallbackUrl,
      });
      if (result.error) {
        sessionStorage.removeItem('myuno_post_auth_redirect');
        toast.error(isRu ? 'Ошибка входа через Google' : 'Google sign-in failed');
        console.error('Google OAuth error:', result.error);
        setLoading(false);
      }
      // On success: browser redirects to Google, no further action needed.
    } catch (e) {
      sessionStorage.removeItem('myuno_post_auth_redirect');
      console.error('Google OAuth exception:', e);
      toast.error(isRu ? 'Ошибка входа через Google' : 'Google sign-in failed');
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className="w-full h-12 inline-flex items-center justify-center gap-3 rounded-none border border-border bg-background hover:bg-muted transition-colors text-sm font-medium disabled:opacity-60"
    >
      {loading ? (
        <LoadingSpinner size="sm" />
      ) : (
        <>
          <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          <span>{text}</span>
        </>
      )}
    </button>
  );
}

interface OAuthDividerProps {
  label?: string;
}

export function OAuthDivider({ label }: OAuthDividerProps) {
  const { language } = useLanguage();
  const text = label || (language === 'ru' ? 'или' : language === 'th' ? 'หรือ' : 'or');
  return (
    <div className="relative my-4">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-border" />
      </div>
      <div className="relative flex justify-center text-xs uppercase">
        <span className="bg-background px-2 text-muted-foreground">{text}</span>
      </div>
    </div>
  );
}
