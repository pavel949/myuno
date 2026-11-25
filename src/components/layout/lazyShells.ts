/**
 * Lazy route shells and rarely visited core pages (2026-11-25).
 *
 * Role-gated layouts (admin, MC, vendor, guest, capital) and the Auth /
 * OAuth consent / unsubscribe pages used to be static imports of
 * AnimatedRoutes, which put them in the entry chunk for every visitor.
 * They are lazy here; AnimatedRoutes renders each one inside <Suspense>.
 * Kept in a separate module so AnimatedRoutes imports them by name.
 */
import React from 'react';

export const CapitalLayout = React.lazy(() =>
  import('@/components/capital/CapitalLayout').then((m) => ({ default: m.CapitalLayout })));
export const AdminLayout = React.lazy(() =>
  import('@/components/admin/AdminLayout').then((m) => ({ default: m.AdminLayout })));
export const MCLayout = React.lazy(() =>
  import('@/components/mc/MCLayout').then((m) => ({ default: m.MCLayout })));
export const VendorLayout = React.lazy(() =>
  import('@/components/vendor/VendorLayout').then((m) => ({ default: m.VendorLayout })));
export const GuestLayout = React.lazy(() =>
  import('@/components/guest/GuestLayout').then((m) => ({ default: m.GuestLayout })));

export const Auth = React.lazy(() => import('@/pages/Auth'));
export const OAuthConsent = React.lazy(() => import('@/pages/OAuthConsent'));
export const Unsubscribe = React.lazy(() => import('@/pages/Unsubscribe'));
