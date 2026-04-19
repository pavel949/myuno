/**
 * Real Estate zone — currently mirrors existing InvestmentIndex catalog scoped to RE projects.
 * Kept as a separate route so /invest/real-estate has a stable home as Phase 2+ adds dedicated views.
 */
import InvestmentIndex from './InvestmentIndex';

export default function InvestmentRealEstateZone() {
  return <InvestmentIndex />;
}
