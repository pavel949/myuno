import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePropertyRequestHold, type RequestDecision } from '@/hooks/usePropertyRequestHold';
import { formatCountdown } from '@/lib/property/bookingMode';

const ERRORS: Record<string, { ru: string; en: string }> = {
  deadline_passed: { ru: 'Время на ответ истекло. Блокировка будет снята.', en: 'The reply window has closed. The hold will be released.' },
  not_awaiting_reply: { ru: 'На этот запрос уже ответили.', en: 'This request has already been answered.' },
  capture_failed: { ru: 'Не удалось списать блокировку. Запрос отменён, гость не оплатил.', en: 'The hold could not be charged. The request was cancelled and the guest has not paid.' },
  forbidden: { ru: 'Недостаточно прав для ответа на этот запрос.', en: 'You are not allowed to answer this request.' },
  stripe_not_configured: { ru: 'Оплата картой не настроена: нет ключей Stripe.', en: 'Card payments are not configured: Stripe keys are missing.' },
};

/**
 * Operator reply to a request-to-book hold. Renders only while a reply is due;
 * the server authorises the actor and enforces the deadline.
 */
export function RequestHoldReplyActions({ orderId }: { orderId: string }) {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  const { phase, secondsLeft, decide } = usePropertyRequestHold(orderId);
  if (phase !== 'awaiting_reply') return null;

  const reply = (decision: RequestDecision) => decide.mutate(decision, {
    onSuccess: () => toast.success(decision === 'accept'
      ? (isRu ? 'Запрос принят. Предоплата списывается.' : 'Request accepted. The prepayment is being charged.')
      : (isRu ? 'Запрос отклонён. Блокировка снята.' : 'Request declined. The hold is released.')),
    onError: error => {
      const known = ERRORS[error.message];
      toast.error(known ? known[isRu ? 'ru' : 'en'] : (isRu ? 'Не удалось отправить ответ. Статус запроса не изменён.' : 'The reply could not be sent. The request is unchanged.'));
    },
  });

  return (
    <section data-testid="request-hold-reply" className="border border-accent bg-card p-4">
      <h3 className="text-sm font-semibold text-foreground">{isRu ? 'Запрос на бронирование ждёт ответа' : 'Booking request awaiting your reply'}</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        {isRu ? 'Карта гостя заблокирована на сумму предоплаты. Без ответа блокировка снимется, даты освободятся.' : 'The guest’s card is on hold for the prepayment. Without a reply the hold is released and the dates are freed.'}
        {secondsLeft !== null && <span className="ml-2 font-mono font-semibold tabular-nums text-foreground">{formatCountdown(secondsLeft)}</span>}
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Button className="min-h-11" disabled={decide.isPending || secondsLeft === 0} onClick={() => reply('accept')}>{isRu ? 'Принять' : 'Accept'}</Button>
        <Button variant="outline" className="min-h-11" disabled={decide.isPending} onClick={() => reply('decline')}>{isRu ? 'Отклонить' : 'Decline'}</Button>
      </div>
    </section>
  );
}
