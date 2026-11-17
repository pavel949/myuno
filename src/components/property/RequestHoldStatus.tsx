import { Clock, Check, X, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePropertyRequestHold } from '@/hooks/usePropertyRequestHold';
import { formatCountdown, REQUEST_REPLY_WINDOW_MINUTES, type RequestHoldPhase } from '@/lib/property/bookingMode';

type Copy = { title: string; body: string };

function copyFor(phase: RequestHoldPhase, isRu: boolean): Copy {
  const copy: Record<RequestHoldPhase, { ru: Copy; en: Copy }> = {
    awaiting_card: {
      ru: { title: 'Проверяем блокировку на карте', body: 'Обычно это занимает несколько секунд. Отсчёт времени на ответ начнётся после подтверждения банка.' },
      en: { title: 'Checking the hold on your card', body: 'This usually takes a few seconds. The reply window starts once your bank confirms the hold.' },
    },
    awaiting_reply: {
      ru: { title: 'Запрос отправлен. Ждём ответ', body: `Сумма заблокирована, но не списана. Ответ придёт в течение ${REQUEST_REPLY_WINDOW_MINUTES} минут; даты удерживаются за вами.` },
      en: { title: 'Request sent. Waiting for a reply', body: `The amount is on hold, not charged. You will have an answer within ${REQUEST_REPLY_WINDOW_MINUTES} minutes; the dates are held for you.` },
    },
    confirming: {
      ru: { title: 'Запрос принят. Оформляем бронь', body: 'Списываем заблокированную предоплату и подтверждаем бронирование.' },
      en: { title: 'Request accepted. Finalising your booking', body: 'We are charging the held prepayment and confirming the booking.' },
    },
    confirmed: {
      ru: { title: 'Бронирование подтверждено', body: 'Предоплата списана. Подтверждение отправлено на вашу почту.' },
      en: { title: 'Booking confirmed', body: 'Your prepayment has been charged. A confirmation is on its way to your email.' },
    },
    declined: {
      ru: { title: 'Запрос отклонён', body: 'Деньги не списаны, блокировка на карте снята. Выберите другие даты или другой объект.' },
      en: { title: 'Request declined', body: 'Nothing was charged and the hold on your card is released. Try other dates or another home.' },
    },
    expired: {
      ru: { title: 'Ответ не пришёл вовремя', body: 'Деньги не списаны, блокировка на карте снята, даты освобождены. Можно отправить запрос ещё раз.' },
      en: { title: 'No reply in time', body: 'Nothing was charged, the hold on your card is released and the dates are free again. You can send the request again.' },
    },
    unknown: {
      ru: { title: 'Статус запроса неизвестен', body: 'Не удалось определить состояние запроса. Откройте детали заказа или напишите в поддержку.' },
      en: { title: 'Request status unknown', body: 'We could not determine the state of this request. Open the order details or contact support.' },
    },
  };
  return copy[phase][isRu ? 'ru' : 'en'];
}

/** Guest view of a request-to-book hold: state, countdown, and what happens to the money. */
export function RequestHoldStatus({ orderId }: { orderId: string }) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { phase, secondsLeft, isLoading, isError, refetch } = usePropertyRequestHold(orderId);

  if (isLoading) {
    return <div role="status" className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />{isRu ? 'Загружаем статус запроса…' : 'Loading request status…'}</div>;
  }
  if (isError || !phase) {
    return (
      <div role="alert" className="w-full max-w-sm border border-border bg-card p-4 text-sm">
        <p className="font-medium text-foreground">{isRu ? 'Не удалось загрузить статус запроса' : 'Could not load the request status'}</p>
        <p className="mt-1 text-muted-foreground">{isRu ? 'Это не означает отказ. Попробуйте ещё раз.' : 'This does not mean the request was declined. Please try again.'}</p>
        <Button variant="outline" size="sm" className="mt-3 min-h-11" onClick={() => void refetch()}>{isRu ? 'Повторить' : 'Retry'}</Button>
      </div>
    );
  }

  const { title, body } = copyFor(phase, isRu);
  const Icon = phase === 'confirmed' ? Check : phase === 'declined' || phase === 'expired' ? X : phase === 'unknown' ? AlertCircle : Clock;
  return (
    <section aria-live="polite" data-testid="request-hold-status" data-phase={phase} className="w-full max-w-sm border border-border bg-card p-5">
      <div className="flex items-start gap-3">
        <Icon className="mt-1 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
        <div className="min-w-0">
          <h1 className="font-display text-xl font-bold text-foreground">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{body}</p>
        </div>
      </div>
      {phase === 'awaiting_reply' && secondsLeft !== null && (
        <p className="mt-4 border-t border-border pt-4 text-sm text-muted-foreground">
          {isRu ? 'Осталось до ответа' : 'Time left for a reply'}
          <span className="ml-2 font-mono text-2xl font-semibold tabular-nums text-foreground" data-testid="request-hold-countdown">{formatCountdown(secondsLeft)}</span>
        </p>
      )}
    </section>
  );
}
