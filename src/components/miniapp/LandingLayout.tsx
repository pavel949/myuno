/**
 * LandingLayout — backward-compatible export for gradient landing / promo pages.
 * Implementation lives in `FeatureLayout` (`mode="landing"`).
 */
import { FeatureLayout, type LandingLayoutProps } from '@/components/layout/FeatureLayout';

export type { LandingLayoutProps } from '@/components/layout/FeatureLayout';

export function LandingLayout(props: LandingLayoutProps) {
  return <FeatureLayout mode="landing" {...props} />;
}
