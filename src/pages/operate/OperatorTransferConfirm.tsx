import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

type State =
  | { kind: 'loading' }
  | { kind: 'success'; orderNumber: string; already?: boolean }
  | { kind: 'error'; message: string };

export default function OperatorTransferConfirm() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [state, setState] = useState<State>({ kind: 'loading' });

  useEffect(() => {
    const id = params.get('id');
    const t = params.get('t');
    if (!id || !t) {
      setState({ kind: 'error', message: 'Ссылка некорректна — отсутствует id или токен.' });
      return;
    }

    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke('confirm-transfer-operator', {
          body: { id, t },
        });
        if (error) throw error;
        if (data?.success) {
          setState({ kind: 'success', orderNumber: data.order_number, already: data.already_confirmed });
        } else {
          setState({ kind: 'error', message: data?.error || 'Не удалось подтвердить' });
        }
      } catch (e) {
        setState({ kind: 'error', message: e instanceof Error ? e.message : 'Ошибка сети' });
      }
    })();
  }, [params]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-card border border-border p-8 text-center space-y-5">
        {state.kind === 'loading' && (
          <>
            <Loader2 className="w-12 h-12 mx-auto animate-spin text-primary" />
            <p className="text-muted-foreground">Подтверждаем заказ…</p>
          </>
        )}
        {state.kind === 'success' && (
          <>
            <CheckCircle2 className="w-16 h-16 mx-auto text-green-600" />
            <h1 className="text-2xl font-bold">
              {state.already ? 'Уже подтверждено' : 'Заказ подтверждён'}
            </h1>
            <p className="text-muted-foreground">
              Трансфер <b>#{state.orderNumber}</b> переведён в статус «confirmed». Клиенту отправлено уведомление с фото точки встречи и контактом водителя.
            </p>
            <Button onClick={() => navigate('/admin/transfers')} className="w-full">
              Открыть админ-панель трансферов
            </Button>
          </>
        )}
        {state.kind === 'error' && (
          <>
            <XCircle className="w-16 h-16 mx-auto text-destructive" />
            <h1 className="text-2xl font-bold">Ошибка</h1>
            <p className="text-muted-foreground">{state.message}</p>
            <Button variant="outline" onClick={() => navigate(-1)} className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" /> Назад
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
