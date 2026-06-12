/**
 * @deprecated 2026-06 — PWA install moved into `UnifiedChatFAB` drawer.
 * This component is no longer rendered from `AppLayout`. Kept as a thin no-op
 * shell for one release in case any external page still imports it; safe to
 * delete after that. Do NOT re-mount globally.
 */
import { usePWAInstall } from '@/hooks/usePWAInstall';

const FAB_DISMISSED_KEY = 'pwa_fab_dismissed';
const FAB_DISMISS_DURATION = 3 * 24 * 60 * 60 * 1000; // 3 days
void FAB_DISMISSED_KEY;
void FAB_DISMISS_DURATION;

export function FloatingInstallButton() {
  // No-op: deprecated. See JSDoc above.
  void usePWAInstall;
  return null;
}

