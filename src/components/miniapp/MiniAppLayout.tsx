/**
 * MiniAppLayout — backward-compatible export for catalog / vertical surfaces.
 * Implementation lives in `FeatureLayout` (`mode="miniapp"`).
 */
import { FeatureLayout, type MiniAppLayoutProps } from '@/components/layout/FeatureLayout';

export type { MiniAppCategory, QuickFilterOption, QuickFilterSection, MiniAppLayoutProps } from '@/components/layout/FeatureLayout';

export function MiniAppLayout(props: MiniAppLayoutProps) {
  return <FeatureLayout mode="miniapp" {...props} />;
}
