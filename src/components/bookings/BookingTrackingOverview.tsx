import { parseCivilDate } from '@/lib/hotelDates';
import { Link } from 'react-router-dom';
import { buttonVariants } from '@/components/ui/button';
import { StatusTag, type StatusTone } from '@/components/ui/status-tag';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { pickLang } from '@/lib/i18n/pickLang';
import { useGuestPropertyBookings } from '@/hooks/usePropertyBookings';
import { useGuestServiceOrders } from '@/hooks/useServiceOrders';

/** Read-only views of existing customer records. No merged order model or inferred fulfilment. */
export function BookingTrackingOverview() {
  const { language } = useLanguage();
  const t = (ru: string, en: string, th: string) => pickLang(language, { ru, en, th });
  const homes = useGuestPropertyBookings();
  const services = useGuestServiceOrders();
  const status = (value: string | undefined) => {
    const labels: Record<string, [string, string, string, StatusTone]> = {
      pending: ['Ожидает подтверждения', 'Pending confirmation', 'รอการยืนยัน', 'waiting'],
      confirmed: ['Подтверждено', 'Confirmed', 'ยืนยันแล้ว', 'neutral'],
      assigned: ['Исполнитель назначен', 'Assigned', 'มอบหมายแล้ว', 'neutral'],
      in_progress: ['В работе', 'In progress', 'กำลังดำเนินการ', 'active'],
      completed: ['Завершено', 'Completed', 'เสร็จสิ้น', 'done'],
      cancelled: ['Отменено', 'Cancelled', 'ยกเลิกแล้ว', 'neutral'],
      checked_in: ['Заселение выполнено', 'Checked in', 'เช็กอินแล้ว', 'active'],
      checked_out: ['Выезд выполнен', 'Checked out', 'เช็กเอาต์แล้ว', 'done'],
      draft: ['Черновик', 'Draft', 'แบบร่าง', 'neutral'],
      pending_payment: ['Ожидает оплаты', 'Awaiting payment', 'รอการชำระเงิน', 'waiting'],
      awaiting_payment: ['Ожидает оплаты', 'Awaiting payment', 'รอการชำระเงิน', 'waiting'],
      expired: ['Истекло', 'Expired', 'หมดอายุ', 'blocked'],
    };
    const label = value && Object.prototype.hasOwnProperty.call(labels, value) ? labels[value] : undefined;
    return label
      ? <StatusTag tone={label[3]}>{t(label[0], label[1], label[2])}</StatusTag>
      : <StatusTag tone="neutral">{value || t('Статус неизвестен', 'Status unknown', 'ไม่ทราบสถานะ')}</StatusTag>;
  };
  const date = (value: string) => {
    const parsed = parseCivilDate(value);
    return Number.isNaN(parsed.getTime()) ? t('Дата не указана', 'Date unavailable', 'ไม่มีข้อมูลวันที่') : parsed.toLocaleDateString(language === 'ru' ? 'ru-RU' : language === 'th' ? 'th-TH' : 'en-GB', { calendar: 'gregory', day: 'numeric', month: 'short', year: 'numeric' });
  };
  const navigationLink = cn(buttonVariants({ variant: 'outline', size: 'default' }), 'h-auto min-h-11 whitespace-normal text-center leading-snug');
  const loading = t('Загрузка…', 'Loading…', 'กำลังโหลด…');
  const failed = t('Не удалось загрузить. Повторить', 'Could not load. Retry', 'โหลดไม่สำเร็จ ลองอีกครั้ง');
  return <section className="mb-6 space-y-4" aria-label={t('Бронирования и заявки', 'Bookings and requests', 'การจองและคำขอ')}>
    <nav className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap" aria-label={t('Отслеживание', 'Tracking', 'ติดตาม')}>
      <a href="#property-bookings" className={navigationLink}>{t('Жильё', 'Homes', 'ที่พัก')}</a>
      <a href="#service-orders" className={navigationLink}>{t('Заказы услуг', 'Service orders', 'คำสั่งบริการ')}</a>
      <Link to="/me/requests" className={navigationLink}>{t('Заявки и обращения', 'Requests and enquiries', 'คำขอและการสอบถาม')}</Link>
      <Link to="/my-stay" className={navigationLink}>{t('Моё проживание', 'My stay', 'การเข้าพักของฉัน')}</Link>
    </nav>
    <section id="property-bookings" className="scroll-mt-24 rounded-[var(--bible-radius-card)] border border-border bg-card p-4 space-y-2">
      <h2 className="font-semibold">{t('Бронирования жилья', 'Property bookings', 'การจองที่พัก')}</h2>
      {homes.isLoading ? <p role="status">{loading}</p> : homes.error ? <button onClick={() => void homes.refetch()} className="min-h-11 text-sm underline">{failed}</button> : !homes.bookings?.length ? <p className="text-sm text-muted-foreground">{t('Бронирований жилья пока нет.', 'No property bookings yet.', 'ยังไม่มีการจองที่พัก')}</p> : <ul className="divide-y divide-border">{homes.bookings.map(booking => <li key={booking.id} className="py-2 text-sm break-words">
        <p className="font-medium">{language === 'ru' ? booking.owner_properties?.title_ru || booking.owner_properties?.title || booking.historicalPropertyName || t('Название жилья недоступно', 'Property name unavailable', 'ไม่มีชื่อที่พัก') : booking.owner_properties?.title || booking.historicalPropertyName || t('Название жилья недоступно', 'Property name unavailable', 'ไม่มีชื่อที่พัก')}</p>
        <p>{date(booking.check_in)} – {date(booking.check_out)}</p>
        <div className="flex flex-wrap items-center gap-2"><span>{booking.id}</span>{status(booking.status)}</div>
        <Link className="inline-flex min-h-11 items-center underline" to={`/orders/${booking.id}/tracking`}>{t('Подробнее о заказе', 'Order details', 'รายละเอียดคำสั่ง')}</Link>
      </li>)}</ul>}
    </section>
    <section id="service-orders" className="scroll-mt-24 rounded-[var(--bible-radius-card)] border border-border bg-card p-4 space-y-2">
      <h2 className="font-semibold">{t('Заказы услуг', 'Service orders', 'คำสั่งบริการ')}</h2>
      {services.isLoading ? <p role="status">{loading}</p> : services.error ? <button onClick={() => void services.refetch()} className="min-h-11 text-sm underline">{failed}</button> : !services.orders.length ? <p className="text-sm text-muted-foreground">{t('Заказов услуг пока нет.', 'No service orders yet.', 'ยังไม่มีคำสั่งบริการ')}</p> : <ul className="divide-y divide-border">{services.orders.map(order => <li key={order.id} className="py-2 text-sm break-words">
        <p className="font-medium">{language === 'ru' ? order.service_name_ru || order.service_name : order.service_name}</p>
        <div className="flex flex-wrap items-center gap-2"><span>{order.order_number}</span>{status(order.status)}</div>
      </li>)}</ul>}
    </section>
    <h2 className="font-semibold">{t('Другие бронирования', 'Other bookings', 'การจองอื่น ๆ')}</h2>
  </section>;
}
