/**
 * NavigatorEntry — feature-flag switch between Navigator v2 (cluster grid)
 * and v3 (life-situation grid).
 *
 * Flag: `feature_flag:navigator_v3` in `system_settings`. Default OFF.
 * Enable per-environment by setting the row to `true`.
 */
import React, { lazy, Suspense } from 'react';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';

const NavigatorPageV2 = lazy(() => import('./NavigatorPage'));
const NavigatorPageV3 = lazy(() => import('./v3/NavigatorPageV3'));

export default function NavigatorEntry() {
  const v3Enabled = useFeatureFlag('navigator_v3', false);

  return (
    <Suspense fallback={null}>
      {v3Enabled ? <NavigatorPageV3 /> : <NavigatorPageV2 />}
    </Suspense>
  );
}
