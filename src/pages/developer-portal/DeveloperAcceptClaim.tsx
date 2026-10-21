/**
 * Accept Developer Claim — /developer-portal/accept-claim?developer_id=xxx
 *
 * Used after an admin sends a magic-link claim invite. The user lands here
 * already authenticated (the magic link signed them in). We then bind their
 * auth.uid() to developers.user_id and create an owner row in developer_users.
 */
import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import NewbuildsLayout from '@/components/newbuilds/NewbuildsLayout';
import { Button } from '@/components/ui/button';
import { APP_ROUTES } from '@/lib/config/routes';
import { Building2, CheckCircle, AlertCircle } from 'lucide-react';

type State = 'loading' | 'found' | 'invalid' | 'already' | 'done' | 'error';

export default function DeveloperAcceptClaim() {
  const [params] = useSearchParams();
  const developerId = params.get('developer_id');
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [state, setState] = useState<State>('loading');
  const [developerName, setDeveloperName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [busy, setBusy] = useState(false);

  // If not logged in, send to /auth and come back here
  useEffect(() => {
    if (!authLoading && !user && developerId) {
      navigate(`${APP_ROUTES.AUTH}?redirect=${encodeURIComponent(window.location.href)}`, { replace: true });
    }
  }, [user, authLoading, developerId, navigate]);

  // Validate developer
  useEffect(() => {
    if (!developerId || !user) return;
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [developerId, user]);

  async function load() {
    setState('loading');
    try {
      const { data, error } = await supabase
        .from('developers')
        .select('id, name_en, user_id')
        .eq('id', developerId!)
        .maybeSingle();

      if (error || !data) { setState('invalid'); return; }
      setDeveloperName(data.name_en);
      if (data.user_id && data.user_id !== user!.id) {
        setState('already');
        return;
      }
      setState('found');
    } catch {
      setState('invalid');
    }
  }

  async function handleClaim() {
    if (!developerId || !user) return;
    setBusy(true);
    try {
      // Bind user_id (only succeeds if still NULL — RLS / app rule)
      const { error: updErr } = await supabase
        .from('developers')
        .update({ user_id: user.id } as never)
        .eq('id', developerId)
        .is('user_id', null);
      if (updErr) throw updErr;

      // Upsert owner membership
      const { error: memErr } = await supabase
        .from('developer_users')
        .upsert(
          [{
            developer_id: developerId,
            auth_user_id: user.id,
            email: user.email ?? '',
            role: 'owner',
            status: 'active',
            last_login_at: new Date().toISOString(),
          }],
          { onConflict: 'developer_id,email' }
        );
      if (memErr) throw memErr;

      qc.invalidateQueries({ queryKey: ['developer-profile'] });
      qc.invalidateQueries({ queryKey: ['developer-team'] });
      qc.invalidateQueries({ queryKey: ['admin-developers'] });
      qc.invalidateQueries({ queryKey: ['all-developers-claim'] });

      setState('done');
      toast.success('Профиль застройщика связан с вашим аккаунтом');
      setTimeout(() => navigate(APP_ROUTES.DEVELOPER_PORTAL, { replace: true }), 1500);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Ошибка');
      setState('error');
      toast.error('Не удалось связать профиль');
    } finally {
      setBusy(false);
    }
  }

  if (authLoading || state === 'loading') {
    return (
      <NewbuildsLayout hideNav>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-[hsl(var(--nb-muted))]">Проверка…</div>
        </div>
      </NewbuildsLayout>
    );
  }

  return (
    <NewbuildsLayout hideNav>
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="nb-glass p-8 rounded-none text-center space-y-5">
            {state === 'found' && (
              <>
                <div className="w-14 h-14 rounded-none bg-[hsl(var(--nb-gold)/0.15)] flex items-center justify-center mx-auto">
                  <Building2 className="w-7 h-7 text-[hsl(var(--nb-gold))]" />
                </div>
                <div>
                  <h1 className="nb-display text-2xl text-[hsl(var(--nb-text))] mb-2">
                    Заявить права на профиль
                  </h1>
                  <p className="text-[hsl(var(--nb-text-secondary))]">
                    Привяжите свой аккаунт к профилю застройщика{' '}
                    <span className="text-[hsl(var(--nb-text))] font-medium">{developerName}</span>
                  </p>
                </div>
                <Button className="nb-btn-gold w-full" onClick={handleClaim} disabled={busy}>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {busy ? 'Связываем…' : 'Подтвердить и войти'}
                </Button>
              </>
            )}

            {state === 'done' && (
              <>
                <CheckCircle className="w-14 h-14 text-success mx-auto" />
                <h1 className="nb-display text-2xl text-[hsl(var(--nb-text))]">Готово!</h1>
                <p className="text-[hsl(var(--nb-text-secondary))]">
                  Перенаправляем в Developer Portal…
                </p>
              </>
            )}

            {state === 'already' && (
              <>
                <AlertCircle className="w-14 h-14 text-accent mx-auto" />
                <h1 className="nb-display text-2xl text-[hsl(var(--nb-text))]">Уже занято</h1>
                <p className="text-[hsl(var(--nb-text-secondary))]">
                  Этот профиль застройщика уже привязан к другому аккаунту. Свяжитесь с администратором.
                </p>
              </>
            )}

            {state === 'invalid' && (
              <>
                <AlertCircle className="w-14 h-14 text-red-400 mx-auto" />
                <h1 className="nb-display text-2xl text-[hsl(var(--nb-text))]">Профиль не найден</h1>
                <p className="text-[hsl(var(--nb-text-secondary))]">
                  Ссылка недействительна или профиль застройщика удалён.
                </p>
              </>
            )}

            {state === 'error' && (
              <>
                <AlertCircle className="w-14 h-14 text-red-400 mx-auto" />
                <h1 className="nb-display text-2xl text-[hsl(var(--nb-text))]">Ошибка</h1>
                <p className="text-[hsl(var(--nb-text-secondary))]">{errorMsg}</p>
                <Button variant="outline" onClick={() => void load()}>Повторить</Button>
              </>
            )}
          </div>
        </div>
      </div>
    </NewbuildsLayout>
  );
}
