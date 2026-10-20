import { parseCivilDate } from '@/lib/hotelDates';
import { Link } from 'react-router-dom';
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
    const labels: Record<string, [string, string, string]> = {
      pending: ['Ожидает подтверждения', 'Pending confirmation', 'รอการยืนยัน'],
      confirmed: ['Подтверждено', 'Confirmed', 'ยืนยันแล้ว'],
      assigned: ['Исполнитель назначен', 'Assigned', 'มอบหมายแล้ว'],
      in_progress: ['В работе', 'In progress', 'กำลังดำเนินการ'],
      completed: ['Завершено', 'Completed', 'เสร็จสิ้น'],
      cancelled: ['Отменено', 'Cancelled', 'ยกเลิกแล้ว'],
      checked_in: ['Заселение выполнено', 'Checked in', 'เช็กอินแล้ว'],
      checked_out: ['Выезд выполнен', 'Checked out', 'เช็กเอาต์แล้ว'],
      draft: ['Черновик', 'Draft', 'แบบร่าง'],
      pending_payment: ['Ожидает оплаты', 'Awaiting payment', 'รอการชำระเงิน'],
      awaiting_payment: ['Ожидает оплаты', 'Awaiting payment', 'รอการชำระเงิน'],
      expired: ['Истекло', 'Expired', 'หมดอายุ'],
    };
    return value && labels[value] ? t(...labels[value]) : value || t('Статус неизвестен', 'Status unknown', 'ไม่ทราบสถานะ');
  };
  const date = (value: string) => {
    const parsed = parseCivilDate(value);
    return Number.isNaN(parsed.getTime()) ? t('Дата не указана', 'Date unavailable', 'ไม่มีข้อมูลวันที่') : parsed.toLocaleDateString(language === 'ru' ? 'ru-RU' : language === 'th' ? 'th-TH' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };
  const loading = t('Загрузка…', 'Loading…', 'กำลังโหลด…');
  const failed = t('Не удалось загрузить. Повторить', 'Could not load. Retry', 'โหลดไม่สำเร็จ ลองอีกครั้ง');
  return <section className="mb-6 space-y-4" aria-label={t('Бронирования и заявки', 'Bookings and requests', 'การจองและคำขอ')}>
    <nav className="flex flex-wrap gap-x-4 gap-y-2 text-sm" aria-label={t('Отслеживание', 'Tracking', 'ติดตาม')}>
      <a href="#property-bookings" className="inline-flex min-h-11 items-center underline">{t('Жильё', 'Homes', 'ที่พัก')}</a>
      <a href="#service-orders" className="inline-flex min-h-11 items-center underline">{t('Заказы услуг', 'Service orders', 'คำสั่งบริการ')}</a>
      <Link to="/me/requests" className="inline-flex min-h-11 items-center underline">{t('Заявки и обращения', 'Requests and enquiries', 'คำขอและการสอบถาม')}</Link>
      <Link to="/my-stay" className="inline-flex min-h-11 items-center underline">{t('Моё проживание', 'My stay', 'การเข้าพักของฉัน')}</Link>
    </nav>
    <section id="property-bookings" className="scroll-mt-24 border border-border p-4 space-y-2">
      <h2 className="font-semibold">{t('Бронирования жилья', 'Property bookings', 'การจองที่พัก')}</h2>
      {homes.isLoading ? <p role="status">{loading}</p> : homes.error ? <button onClick={() => void homes.refetch()} className="min-h-11 text-sm underline">{failed}</button> : !homes.bookings?.length ? <p className="text-sm text-muted-foreground">{t('Бронирований жилья пока нет.', 'No property bookings yet.', 'ยังไม่มีการจองที่พัก')}</p> : <ul className="divide-y divide-border">{homes.bookings.map(booking => <li key={booking.id} className="py-2 text-sm break-words">
        <p className="font-medium">{language === 'ru' ? booking.owner_properties?.title_ru || booking.owner_properties?.title || booking.id : booking.owner_properties?.title || booking.id}</p>
        <p>{date(booking.check_in)} – {date(booking.check_out)}</p>
        <p>{booking.id} · {status(booking.status)}</p>
      </li>)}</ul>}
    </section>
    <section id="service-orders" className="scroll-mt-24 border border-border p-4 space-y-2">
      <h2 className="font-semibold">{t('Заказы услуг', 'Service orders', 'คำสั่งบริการ')}</h2>
      {services.isLoading ? <p role="status">{loading}</p> : services.error ? <button onClick={() => void services.refetch()} className="min-h-11 text-sm underline">{failed}</button> : !services.orders.length ? <p className="text-sm text-muted-foreground">{t('Заказов услуг пока нет.', 'No service orders yet.', 'ยังไม่มีคำสั่งบริการ')}</p> : <ul className="divide-y divide-border">{services.orders.map(order => <li key={order.id} className="py-2 text-sm break-words">
        <p className="font-medium">{language === 'ru' ? order.service_name_ru || order.service_name : order.service_name}</p>
        <p>{order.order_number} · {status(order.status)}</p>
      </li>)}</ul>}
    </section>
    <h2 className="font-semibold">{t('Другие бронирования', 'Other bookings', 'การจองอื่น ๆ')}</h2>
  </section>;
}
