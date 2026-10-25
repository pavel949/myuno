/** Known server refusals include a safe next step, never a success claim. */
export function propertyBookingChangeExplanation(error: unknown, isRu: boolean): string | undefined {
  const message = error && typeof error === 'object' && 'message' in error ? String(error.message) : '';
  if (message === 'reservation task schedule reconciliation required') return isRu
    ? 'Даты не изменены: к бронированию уже привязаны задания. Сначала согласуйте перенос заданий с управляющим; затем обновите бронирование. Перенос здесь пока недоступен.'
    : 'Dates were not changed: this reservation has linked tasks. Ask the manager to reconcile their schedule, then refresh the booking. Rescheduling is not available here yet.';
  if (message === 'reservation task expense reconciliation required') return isRu
    ? 'Отмена не выполнена, даты остаются заняты: у связанных заданий есть расходы. Сначала согласуйте расходы с управляющим, затем обновите статус.'
    : 'Cancellation was not completed and dates remain reserved: linked tasks have expenses. Reconcile the expenses with the manager, then refresh the status.';
  return undefined;
}

/** Labels project domain state; an unknown state must never look pending/confirmed. */
export function propertyBookingStatus(status: string | null | undefined) {
  const labels: Record<string, { label: string; labelRu: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    confirmed: { label: 'Confirmed', labelRu: 'Подтверждено', variant: 'default' },
    pending: { label: 'Pending', labelRu: 'Ожидает', variant: 'secondary' },
    pending_payment: { label: 'Awaiting payment', labelRu: 'Ожидает оплаты', variant: 'secondary' },
    cancelled: { label: 'Cancelled', labelRu: 'Отменено', variant: 'destructive' },
    rejected: { label: 'Rejected', labelRu: 'Отклонено', variant: 'destructive' },
    refunded: { label: 'Refunded', labelRu: 'Возвращено', variant: 'outline' },
    expired: { label: 'Expired', labelRu: 'Истекло', variant: 'outline' },
    no_show: { label: 'No-show', labelRu: 'Не заехал', variant: 'destructive' },
    completed: { label: 'Completed', labelRu: 'Завершено', variant: 'outline' },
    checked_in: { label: 'Checked in', labelRu: 'Заселён', variant: 'default' },
    checked_out: { label: 'Checked out', labelRu: 'Выехал', variant: 'outline' },
    in_progress: { label: 'In progress', labelRu: 'В процессе', variant: 'default' },
  };
  return labels[status ?? ''] ?? { label: status ? `Unknown status: ${status}` : 'Status unavailable', labelRu: status ? `Неизвестный статус: ${status}` : 'Статус неизвестен', variant: 'outline' as const };
}
