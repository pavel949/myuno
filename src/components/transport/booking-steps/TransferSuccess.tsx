import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Shield, Handshake, User, MapPin } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { APP_ROUTES } from '@/lib/config/routes';
import type { TransferFormData } from './types';

interface TransferSuccessProps {
  language: string;
  formData: TransferFormData;
  createdOrderNumber: string | null;
}

export function TransferSuccess({ language, formData, createdOrderNumber }: TransferSuccessProps) {
  const navigate = useNavigate();
  const tr = (en: string, ru: string, th: string) => language === 'ru' ? ru : language === 'th' ? th : en;

  return (
    <AppLayout showBottomNav={false}>
      <div className="flex-1 flex flex-col items-center justify-center p-8 min-h-[80vh]">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-success/20 to-success/40 flex items-center justify-center mb-6 animate-in zoom-in duration-500">
          <Check className="w-12 h-12 text-success" />
        </div>
        <h2 className="text-2xl font-display font-bold mb-2 text-center">
          {tr('Transfer request saved', 'Заявка на трансфер сохранена', 'บันทึกคำขอรถรับส่งแล้ว')}
        </h2>
        {createdOrderNumber && (
          <p className="text-lg font-semibold text-primary mb-2">#{createdOrderNumber}</p>
        )}
        <p className="text-muted-foreground text-center max-w-sm mb-2">
          {tr('Flight', 'Рейс', 'เที่ยวบิน')} {formData.flightNumber} • {formData.arrivalDate}
        </p>
        <div className="flex flex-wrap justify-center items-center gap-2 mb-2">
          <Badge variant="secondary" className="bg-warning/10 text-warning text-center">
            <Shield className="w-3 h-3 mr-1" />
            {tr('Awaiting myUNO confirmation', 'Ожидает подтверждения myUNO', 'รอการยืนยันจาก myUNO')}
          </Badge>
          {formData.paymentMethod === 'concierge_advance' && (
            <Badge variant="secondary" className="bg-warning/10 text-warning">
              <Handshake className="w-3 h-3 mr-1" />
              myUNO
            </Badge>
          )}
        </div>

        {formData.paymentMethod === 'concierge_advance' && (
          <p className="text-sm text-muted-foreground text-center max-w-sm mb-4">
            {tr(
              'Please confirm payment arrangements with myUNO.',
              'Способ и условия оплаты необходимо подтвердить с myUNO.',
              'โปรดยืนยันวิธีและเงื่อนไขการชำระเงินกับ myUNO',
            )}
          </p>
        )}

        {formData.direction === 'from-airport' && (
          <div className="w-full max-w-sm p-4 rounded-none bg-card border border-border/50 mb-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">
                  {tr('Name on sign', 'Имя на табличке', 'ชื่อบนป้าย')}
                </p>
                <p className="font-semibold text-lg">{formData.meetingSignName || formData.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                <MapPin className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">
                  {tr('Destination', 'Адрес назначения', 'จุดหมายปลายทาง')}
                </p>
                <p className="font-medium">{formData.destinationAddress}</p>
              </div>
            </div>
          </div>
        )}

        <p className="text-muted-foreground text-center max-w-sm mb-8">
          {tr(
            'Your request is saved, but the trip is not confirmed yet. Check My Bookings for its status; myUNO will arrange the meeting details.',
            'Заявка сохранена. Поездка ещё не подтверждена. Проверьте её статус в «Мои брони»; детали встречи согласует myUNO.',
            'บันทึกคำขอแล้ว การเดินทางยังไม่ได้รับการยืนยัน ดูสถานะได้ที่การจองของฉัน โดย myUNO จะประสานรายละเอียดจุดนัดพบ',
          )}
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button variant="outline" onClick={() => navigate(APP_ROUTES.TRANSPORT)}>
            {tr('Browse More', 'К транспорту', 'ดูบริการเดินทาง')}
          </Button>
          <Button onClick={() => navigate(APP_ROUTES.BOOKINGS)}>
            {tr('My Bookings', 'Мои брони', 'การจองของฉัน')}
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
