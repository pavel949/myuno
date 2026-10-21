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
    <MeShellLayout title={isRu ? 'Мои заказы и брони' : 'My orders and bookings'}>
      {/* The parent MeShell owns chrome; nested AppLayout renders content only. */}
      <div className="-mx-[var(--page-padding-x)]">
        <Bookings />
      </div>
    </MeShellLayout>
  );
}
