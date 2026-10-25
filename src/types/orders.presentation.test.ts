import { expect, it } from 'vitest';
import { ORDER_STATUS_CONFIG } from './orders';
it('preserves all existing order status identities and localized labels', () => {
 expect(Object.fromEntries(Object.entries(ORDER_STATUS_CONFIG).map(([key, value]) => [key, [value.labelEn, value.labelRu]]))).toEqual({
 draft:['Draft','Черновик'],pending:['Pending','Ожидание'],pending_advance:['Awaiting Advance','Ожидание аванса'],awaiting_client_payment:['Awaiting Payment','Ожидание оплаты'],pending_deposit:['Awaiting Deposit','Ожидание депозита'],deposit_paid:['Deposit Paid','Депозит оплачен'],confirmed:['Confirmed','Подтверждён'],in_progress:['In Progress','В процессе'],checked_in:['Checked In','Заехал'],checked_out:['Checked Out','Выехал'],completed:['Completed','Завершён'],cancelled:['Cancelled','Отменён'],refunded:['Refunded','Возврат'],disputed:['Disputed','Спор'],no_show:['No Show','Неявка'],
 });
});
it('uses theme-aware negative status text instead of destructive action or fixed red colors', () => {
 for (const status of ['cancelled','disputed'] as const) expect(ORDER_STATUS_CONFIG[status]).toMatchObject({color:'text-danger',bgColor:'bg-danger/20'});
});
it('keeps checked-out and no-show neutral without fixed slate/gray palette', () => {
 for (const status of ['checked_out','no_show'] as const) expect(ORDER_STATUS_CONFIG[status]).toMatchObject({color:'text-muted-foreground',bgColor:'bg-muted'});
 // Presentation convergence does not recategorize active/payment/refund states.
 expect(ORDER_STATUS_CONFIG.refunded).toMatchObject({color:'text-accent',bgColor:'bg-accent/20'});
 expect(ORDER_STATUS_CONFIG.pending_deposit).toMatchObject({color:'text-accent',bgColor:'bg-accent/20'});
 expect(ORDER_STATUS_CONFIG.completed).toMatchObject({color:'text-success',bgColor:'bg-success/20'});
});
