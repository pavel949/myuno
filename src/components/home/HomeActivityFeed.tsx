import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { pickLang } from '@/lib/i18n/pickLang';

/** The canonical /me feed owns real account activity; Home never invents rows. */
export function HomeActivityFeed() {
  const { language } = useLanguage();
  return (
    <div className="px-4 pb-6">
      <Link to="/me" className="flex min-h-11 items-center justify-between gap-3 border-t border-border py-4 text-foreground hover:text-primary">
        <span>
          <span className="block text-sm font-semibold">{pickLang(language, { ru: 'Мои бронирования и заявки', en: 'My bookings and requests', th: 'การจองและคำขอของฉัน' })}</span>
          <span className="mt-1 block text-sm text-muted-foreground">{pickLang(language, { ru: 'Проживания, услуги, документы и платежи', en: 'Stays, services, documents and payments', th: 'การเข้าพัก บริการ เอกสาร และการชำระเงิน' })}</span>
        </span>
        <ArrowRight className="h-4 w-4 shrink-0" aria-hidden />
      </Link>
    </div>
  );
}
