import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Loader2, CheckCircle2, XCircle, MailX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

type State =
  | { kind: 'loading' }
  | { kind: 'invalid'; message: string }
  | { kind: 'already' }
  | { kind: 'ready' }
  | { kind: 'submitting' }
  | { kind: 'done' }
  | { kind: 'error'; message: string };

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

export default function Unsubscribe() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const [state, setState] = useState<State>({ kind: 'loading' });

  useEffect(() => {
    if (!token) {
      setState({ kind: 'invalid', message: 'Ссылка некорректна — отсутствует токен / Missing token.' });
      return;
    }
    (async () => {
      try {
        const res = await fetch(
          `${SUPABASE_URL}/functions/v1/handle-email-unsubscribe?token=${encodeURIComponent(token)}`,
          { headers: { apikey: SUPABASE_ANON } },
        );
        const data = await res.json();
        if (!res.ok) {
          setState({ kind: 'invalid', message: data?.error || 'Invalid or expired token.' });
          return;
        }
        if (data?.valid === false && data?.reason === 'already_unsubscribed') {
          setState({ kind: 'already' });
          return;
        }
        if (data?.valid) setState({ kind: 'ready' });
        else setState({ kind: 'invalid', message: 'Invalid or expired token.' });
      } catch (e) {
        setState({ kind: 'error', message: e instanceof Error ? e.message : 'Network error' });
      }
    })();
  }, [token]);

  const confirm = async () => {
    if (!token) return;
    setState({ kind: 'submitting' });
    try {
      const { data, error } = await supabase.functions.invoke('handle-email-unsubscribe', {
        body: { token },
      });
      if (error) throw error;
      if (data?.success || data?.reason === 'already_unsubscribed') {
        setState({ kind: 'done' });
      } else {
        setState({ kind: 'error', message: data?.error || 'Unsubscribe failed' });
      }
    } catch (e) {
      setState({ kind: 'error', message: e instanceof Error ? e.message : 'Network error' });
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-card border border-border p-8 text-center space-y-5">
        {state.kind === 'loading' && (
          <>
            <Loader2 className="w-12 h-12 mx-auto animate-spin text-primary" />
            <p className="text-muted-foreground">Проверяем ссылку… / Validating link…</p>
          </>
        )}
        {state.kind === 'ready' && (
          <>
            <MailX className="w-16 h-16 mx-auto text-primary" />
            <h1 className="text-2xl font-bold">Отписаться от рассылки myUNO?</h1>
            <p className="text-muted-foreground">
              Unsubscribe from myUNO emails? You will stop receiving transactional notifications to this address.
            </p>
            <Button onClick={confirm} className="w-full">
              Подтвердить отписку / Confirm unsubscribe
            </Button>
          </>
        )}
        {state.kind === 'submitting' && (
          <>
            <Loader2 className="w-12 h-12 mx-auto animate-spin text-primary" />
            <p className="text-muted-foreground">Обрабатываем… / Processing…</p>
          </>
        )}
        {state.kind === 'done' && (
          <>
            <CheckCircle2 className="w-16 h-16 mx-auto text-green-600" />
            <h1 className="text-2xl font-bold">Вы отписаны</h1>
            <p className="text-muted-foreground">
              You have been unsubscribed. We won't email this address anymore.
            </p>
          </>
        )}
        {state.kind === 'already' && (
          <>
            <CheckCircle2 className="w-16 h-16 mx-auto text-green-600" />
            <h1 className="text-2xl font-bold">Уже отписаны / Already unsubscribed</h1>
            <p className="text-muted-foreground">This address is no longer on our list.</p>
          </>
        )}
        {state.kind === 'invalid' && (
          <>
            <XCircle className="w-16 h-16 mx-auto text-destructive" />
            <h1 className="text-2xl font-bold">Ссылка недействительна</h1>
            <p className="text-muted-foreground">{state.message}</p>
          </>
        )}
        {state.kind === 'error' && (
          <>
            <XCircle className="w-16 h-16 mx-auto text-destructive" />
            <h1 className="text-2xl font-bold">Ошибка / Error</h1>
            <p className="text-muted-foreground">{state.message}</p>
            <Button variant="outline" onClick={() => location.reload()} className="w-full">
              Попробовать снова / Retry
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
