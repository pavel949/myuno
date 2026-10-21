import type { ComponentType } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { MARKET_ENABLED, MarketComingSoonOverlay } from './MarketComingSoonOverlay';

/** Keep disabled commerce out of the DOM and prevent its data/effect hooks from mounting. */
export function withMarketAvailability(Page: ComponentType) {
  function MarketAvailabilityGate() {
    if (MARKET_ENABLED) return <Page />;

    return (
      <AppLayout>
        <MarketComingSoonOverlay />
      </AppLayout>
    );
  }

  MarketAvailabilityGate.displayName = `MarketAvailabilityGate(${Page.displayName || Page.name || 'Page'})`;
  return MarketAvailabilityGate;
}
