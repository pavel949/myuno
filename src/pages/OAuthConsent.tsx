/**
 * OAuth 2.1 consent screen for the myUNO MCP server. Supabase Auth
 * redirects the user here when an MCP client (ChatGPT / Claude / …)
 * asks for authorization. See app-mcp-server-authoring for the flow.
 */
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';

type AuthorizationDetails = {
  redirect_url?: string;
  redirect_to?: string;
  client?: { name?: string; client_uri?: string } | null;
};

// The Supabase JS OAuth namespace is beta and not in current types.
type OAuthNs = {
  getAuthorizationDetails: (id: string) => Promise<{ data: AuthorizationDetails | null; error: { message: string } | null }>;
  approveAuthorization: (id: string) => Promise<{ data: AuthorizationDetails | null; error: { message: string } | null }>;
  denyAuthorization: (id: string) => Promise<{ data: AuthorizationDetails | null; error: { message: string } | null }>;
};
const authOAuth = () =>
  (supabase.auth as unknown as { oauth: OAuthNs }).oauth;

export default function OAuthConsent() {
  const [params] = useSearchParams();
  const authorizationId = params.get('authorization_id') ?? '';
  const [details, setDetails] = useState<AuthorizationDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!authorizationId) return setError('Missing authorization_id');
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        const next = window.location.pathname + window.location.search;
        window.location.href = '/auth?redirect=' + encodeURIComponent(next);
        return;
      }
      try {
        const { data, error } = await authOAuth().getAuthorizationDetails(authorizationId);
        if (!active) return;
        if (error) return setError(error.message);
        const immediate = data?.redirect_url ?? data?.redirect_to;
        if (immediate && !data?.client) {
          window.location.href = immediate;
          return;
        }
        setDetails(data);
      } catch (e) {
        if (!active) return;
        setError(e instanceof Error ? e.message : 'Failed to load authorization');
      }
    })();
    return () => {
      active = false;
    };
  }, [authorizationId]);

  async function decide(approve: boolean) {
    setBusy(true);
    try {
      const { data, error } = approve
        ? await authOAuth().approveAuthorization(authorizationId)
        : await authOAuth().denyAuthorization(authorizationId);
      if (error) {
        setBusy(false);
        return setError(error.message);
      }
      const target = data?.redirect_url ?? data?.redirect_to;
      if (!target) {
        setBusy(false);
        return setError('No redirect returned by the authorization server.');
      }
      window.location.href = target;
    } catch (e) {
      setBusy(false);
      setError(e instanceof Error ? e.message : 'Authorization failed');
    }
  }

  if (error) {
    return (
      <main className="mx-auto max-w-md p-6 space-y-4">
        <h1 className="text-2xl font-serif">Не удалось загрузить запрос</h1>
        <p className="text-sm text-muted-foreground">{error}</p>
      </main>
    );
  }
  if (!details) {
    return (
      <main className="mx-auto max-w-md p-6">
        <p className="text-sm text-muted-foreground">Загрузка…</p>
      </main>
    );
  }
  const clientName = details.client?.name ?? 'внешнее приложение';
  return (
    <main className="mx-auto max-w-md p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-serif">Подключить {clientName} к myUNO</h1>
        <p className="text-sm text-muted-foreground">
          Приложение {clientName} сможет использовать инструменты myUNO от вашего имени
          (поиск недвижимости, каталог услуг, ваш профиль).
        </p>
      </div>
      <div className="flex gap-3">
        <Button onClick={() => decide(true)} disabled={busy}>
          Разрешить
        </Button>
        <Button variant="outline" onClick={() => decide(false)} disabled={busy}>
          Отклонить
        </Button>
      </div>
    </main>
  );
}
