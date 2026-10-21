import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';

type State =
  | { kind: 'loading' }
  | { kind: 'success'; orderNumber: string; already?: boolean }
  | { kind: 'error'; message: string };

const T = {
  ru: {
    badLink: 'Ссылка некорректна — отсутствует id или токен.',
    confirming: 'Подтверждаем заказ…',
    already: 'Уже подтверждено',
    confirmed: 'Заказ подтверждён',
    body: (n: string) => `Трансфер #${n} переведён в статус «confirmed». Клиенту отправлено уведомление с фото точки встречи и контактом водителя.`,
    open: 'Открыть админ-панель трансферов',
    error: 'Ошибка',
    networkErr: 'Ошибка сети',
    failed: 'Не удалось подтвердить',
    back: 'Назад',
  },
  en: {
    badLink: 'Invalid link — missing id or token.',
    confirming: 'Confirming booking…',
    already: 'Already confirmed',
    confirmed: 'Booking confirmed',
    body: (n: string) => `Transfer #${n} is now in "confirmed" status. The customer has been notified with the meeting point photo and driver contact.`,
    open: 'Open transfers admin panel',
    error: 'Error',
    networkErr: 'Network error',
    failed: 'Could not confirm',
    back: 'Back',
  },
  th: {
    badLink: 'ลิงก์ไม่ถูกต้อง — ไม่มีรหัสหรือโทเค็น',
    confirming: 'กำลังยืนยันการจอง…',
    already: 'ยืนยันแล้ว',
    confirmed: 'ยืนยันการจองแล้ว',
    body: (n: string) => `การรับส่ง #${n} อยู่ในสถานะ "confirmed" แล้ว ลูกค้าได้รับการแจ้งเตือนพร้อมรูปจุดนัดพบและช่องทางติดต่อคนขับแล้ว`,
    open: 'เปิดแผงควบคุมการรับส่ง',
    error: 'ข้อผิดพลาด',
    networkErr: 'เครือข่ายผิดพลาด',
    failed: 'ไม่สามารถยืนยันได้',
    back: 'กลับ',
  },
} as const;

export default function OperatorTransferConfirm() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const t = T[language as 'ru' | 'en' | 'th'] || T.en;
  const [state, setState] = useState<State>({ kind: 'loading' });

  useEffect(() => {
    const id = params.get('id');
    const tk = params.get('t');
    if (!id || !tk) {
      setState({ kind: 'error', message: t.badLink });
      return;
    }

    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke('confirm-transfer-operator', {
          body: { id, t: tk },
        });
        if (error) throw error;
        if (data?.success) {
          setState({ kind: 'success', orderNumber: data.order_number, already: data.already_confirmed });
        } else {
          setState({ kind: 'error', message: data?.error || t.failed });
        }
      } catch (e) {
        setState({ kind: 'error', message: e instanceof Error ? e.message : t.networkErr });
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-card border border-border p-8 text-center space-y-5">
        {state.kind === 'loading' && (
          <>
            <Loader2 className="w-12 h-12 mx-auto animate-spin text-primary" />
            <p className="text-muted-foreground">{t.confirming}</p>
          </>
        )}
        {state.kind === 'success' && (
          <>
            <CheckCircle2 className="w-16 h-16 mx-auto text-green-600" />
            <h1 className="text-2xl font-bold">
              {state.already ? t.already : t.confirmed}
            </h1>
            <p className="text-muted-foreground">{t.body(state.orderNumber)}</p>
            <Button onClick={() => navigate('/admin/transfers')} className="w-full">
              {t.open}
            </Button>
          </>
        )}
        {state.kind === 'error' && (
          <>
            <XCircle className="w-16 h-16 mx-auto text-destructive" />
            <h1 className="text-2xl font-bold">{t.error}</h1>
            <p className="text-muted-foreground">{state.message}</p>
            <Button variant="outline" onClick={() => navigate(-1)} className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" /> {t.back}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
