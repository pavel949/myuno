import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { APP_ROUTES } from '@/lib/config/routes';
import { getAdminLoginApiUrl } from '@/lib/admin/adminLoginApi';

/**
 * Optional password gate for admin (e.g. cookie session set by POST /api/admin/login).
 * Not a substitute for Supabase role checks — AdminGuard still applies on /admin/*.
 */
export default function AdminLoginPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const login = useCallback(async () => {
    if (!password.trim()) {
      toast.error(t('admin.login.errorEmpty'));
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(getAdminLoginApiUrl(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        navigate(APP_ROUTES.ADMIN, { replace: true });
        return;
      }
      const errText = await res.text().catch(() => '');
      toast.error(t('admin.login.errorFailed'), {
        description: errText ? errText.slice(0, 200) : undefined,
      });
    } catch {
      toast.error(t('admin.login.errorNetwork'));
    } finally {
      setLoading(false);
    }
  }, [password, navigate, t]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0f1a] px-4">
      <div className="w-full max-w-sm rounded-2xl border border-[#1f2d45] bg-[#111827] p-8 shadow-xl">
        <h1 className="mb-5 text-lg font-extrabold tracking-tight text-[#d4a843]">
          {t('admin.login.title')}
        </h1>
        <label htmlFor="admin-login-pw" className="sr-only">
          {t('admin.login.placeholder')}
        </label>
        <input
          id="admin-login-pw"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') void login();
          }}
          placeholder={t('admin.login.placeholder')}
          className="mb-3 w-full rounded-lg border border-[#1f2d45] bg-[#0a0f1a] px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-[#d4a843] focus:outline-none focus:ring-1 focus:ring-[#d4a843]"
          disabled={loading}
        />
        <button
          type="button"
          onClick={() => void login()}
          disabled={loading}
          className="w-full rounded-lg bg-[#d4a843] py-2.5 text-sm font-bold text-[#0a0f1a] transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {loading ? t('admin.login.submitting') : t('admin.login.enter')}
        </button>
      </div>
    </div>
  );
}
