/**
 * Focus mode hooks — is the Phase 1 scope cut active? (see src/lib/focus/focusMode.ts)
 *
 * One sync point, many readers:
 *  - `useFocusModeFlag()` reads `feature_flag:focus_mode` from system_settings
 *    via React Query. Only the router (AnimatedRoutes) calls it, and it
 *    publishes the value with `setFocusModeActive`.
 *  - `useFocusMode()` subscribes to that published value. It needs no
 *    QueryClient, so any component can use it, and re-renders on change.
 *
 * Until the flag loads, if it fails to load, or if the key is absent, focus
 * mode counts as ON: the narrowed surface is the expected state, and the
 * reverse would flash hidden apps before removing them. Set the flag to
 * `{"enabled": false}` to restore the full surface.
 */
import { useSyncExternalStore } from 'react';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';
import { FOCUS_MODE_FLAG, isFocusModeActive, subscribeFocusMode } from '@/lib/focus/focusMode';

/** Source of truth from system_settings. Call only at the sync point. */
export function useFocusModeFlag(): boolean {
  return useFeatureFlag(FOCUS_MODE_FLAG, true);
}

/** Current focus-mode state for rendering decisions. */
export function useFocusMode(): boolean {
  return useSyncExternalStore(subscribeFocusMode, isFocusModeActive, isFocusModeActive);
}
