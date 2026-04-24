/**
 * /me/bookings — unified bookings list inside the /me Universal Hub.
 *
 * Re-uses the existing Bookings page content but renders it inside
 * MeShellLayout so it sits next to Feed / Services / Documents / Payments.
 * This addresses the audit gap «нет /me/bookings — единого списка заказов».
 */
import React from 'react';
import { MeShellLayout } from '@/components/layout/MeShellLayout';
import { useLanguage } from '@/contexts/LanguageContext';
import Bookings from '@/pages/Bookings';

export default function MeBookings() {
  const { language } = useLanguage();
  const isRu = language === 'ru';
  return (
    <MeShellLayout title={isRu ? 'Мои бронирования' : 'My bookings'}>
      {/* Bookings page already manages its own AppLayout chrome — but
          rendering it inside MeShell is the simplest way to inherit the
          nav. The duplicate top-bar is acceptable in this transition step
          and will be cleaned up when Bookings is decomposed. */}
      <div className="-mx-[var(--page-padding-x)]">
        <Bookings />
      </div>
    </MeShellLayout>
  );
}
