/** Review-only React Email-compatible template. Not registered in the live sender. */
import * as React from 'react';
import type { PersistedInquiry } from './propertyInquiryWorker';
export function PropertyInquiryAdminTemplate({ inquiry }: { inquiry: PersistedInquiry }) {
  const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuid.test(inquiry.id) || !uuid.test(inquiry.property_id)) throw new Error('Invalid persisted inquiry identity');
  const href=`https://myuno.app/admin/inbox?source=property_inquiries&request=${encodeURIComponent(inquiry.id)}`;
  return <html lang="ru"><body><h1>Новая заявка myUNO</h1>
    <p>Заявка сохранена. Это не подтверждение бронирования или оплаты.</p>
    <dl>
      <dt>Объект</dt><dd>{inquiry.property_id}</dd>
      <dt>Клиент</dt><dd>{inquiry.name}</dd>
      <dt>Email</dt><dd>{inquiry.email || 'Не указан'}</dd>
      <dt>Телефон</dt><dd>{inquiry.phone || 'Не указан'}</dd>
      <dt>Заезд / выезд</dt><dd>{inquiry.check_in || 'Не указан'} / {inquiry.check_out || 'Не указан'}</dd>
      <dt>Гости</dt><dd>{inquiry.guests ?? 'Не указано'}</dd>
      <dt>Сообщение</dt><dd>{inquiry.message || 'Не указано'}</dd>
    </dl><a href={href}>Открыть точную заявку в myUNO</a>
    <p>myUNO связывается с клиентом. Автоматическая передача поставщику отключена.</p>
  </body></html>;
}
