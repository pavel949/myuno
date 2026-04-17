/**
 * Accept Developer Team Invite — /developer-portal/accept-invite?token=xxx
 *
 * Public page (no auth required to load). If user is not logged in,
 * they're sent to /auth with a redirect back here. After login, the
 * token is validated and the developer_users row is activated.
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

type InviteState = 'loading' | 'found' | 'invalid' | 'expired' | 'accepted';

export default function DeveloperAcceptInvite() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [state, setState] = useState<InviteState>('loading');
  const [developerName, setDeveloperName] = useState('');
  const [accepting, setAccepting] = useState(false);

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!authLoading && !user && token) {
      navigate(`${APP_ROUTES.AUTH}?redirect=${encodeURIComponent(window.location.href)}`, { replace: true });
    }
  }, [user, authLoading, token, navigate]);

  // Validate token
  useEffect(() => {
    if (!token || !user) return;
    validateToken();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, user]);

  async function validateToken() {
    setState('loading');
    try {
      const { data, error } = await supabase
        .from('developer_users')
        .select('id, status, invite_expires_at, developer_id, developers(name_en)')
        .eq('invite_token', token!)
        .maybeSingle();

      if (error || !data) { setState('invalid'); return; }
      if (data.status === 'active') { setState('accepted'); return; }
      if (data.invite_expires_at && new Date(data.invite_expires_at) < new Date()) {
        setState('expired'); return;
      }
      setDeveloperName((data.developers as Record<string, string> | null)?.name_en ?? '');
      setState('found');
    } catch {
      setState('invalid');
    }
  }

  async function handleAccept() {
    if (!token || !user) return;
    setAccepting(true);
    try {
      const { error } = await supabase
        .from('developer_users')
        .update({
          auth_user_id: user.id,
          status: 'active',
          invite_token: null,
          invite_expires_at: null,
          last_login_at: new Date().toISOString(),
        } as Record<string, unknown>)
        .eq('invite_token', token);
      if (error) throw error;
      qc.invalidateQueries({ queryKey: ['developer-profile'] });
      qc.invalidateQueries({ queryKey: ['developer-team'] });
      setState('accepted');
      toast.success('Вы добавлены в команду!');
      setTimeout(() => navigate(APP_ROUTES.DEVELOPER_PORTAL, { replace: true }), 1500);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Ошибка принятия приглашения');
    } finally {
      setAccepting(false);
    }
  }

  if (authLoading || state === 'loading') {
    return <NewbuildsLayout hideNav><div className="min-h-screen flex items-center justify-center"><div className="text-[hsl(var(--nb-muted))]">Проверка...</div></div></NewbuildsLayout>;
  }

  return (
    <NewbuildsLayout hideNav>
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="nb-glass p-8 rounded-2xl text-center space-y-5">
            {state === 'found' && (
              <>
                <div className="w-14 h-14 rounded-2xl bg-[hsl(var(--nb-gold)/0.15)] flex items-center justify-center mx-auto">
                  <Building2 className="w-7 h-7 text-[hsl(var(--nb-gold))]" />
                </div>
                <div>
                  <h1 className="nb-display text-2xl text-[hsl(var(--nb-text))] mb-2">Приглашение в команду</h1>
                  <p className="text-[hsl(var(--nb-text-secondary))]">
                    Вас приглашают присоединиться к порталу застройщика{' '}
                    <span className="text-[hsl(var(--nb-text))] font-medium">{developerName}</span>
                  </p>
                </div>
                <Button
                  className="nb-btn-gold w-full"
                  onClick={handleAccept}
                  disabled={accepting}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {accepting ? 'Принятие...' : 'Принять приглашение'}
                </Button>
              </>
            )}

            {state === 'accepted' && (
              <>
                <CheckCircle className="w-14 h-14 text-green-400 mx-auto" />
                <h1 className="nb-display text-2xl text-[hsl(var(--nb-text))]">Добро пожаловать!</h1>
                <p className="text-[hsl(var(--nb-text-secondary))]">Вы успешно добавлены в команду. Перенаправление...</p>
              </>
            )}

            {(state === 'invalid' || state === 'expired') && (
              <>
                <AlertCircle className="w-14 h-14 text-red-400 mx-auto" />
                <h1 className="nb-display text-2xl text-[hsl(var(--nb-text))]">
                  {state === 'expired' ? 'Ссылка устарела' : 'Ссылка недействительна'}
                </h1>
                <p className="text-[hsl(var(--nb-text-secondary))]">
                  {state === 'expired'
                    ? 'Приглашение истекло. Попросите администратора отправить новое.'
                    : 'Ссылка недействительна или уже использована.'}
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </NewbuildsLayout>
  );
}
