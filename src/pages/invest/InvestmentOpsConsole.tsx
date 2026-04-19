/**
 * Admin-only Investment Hub Operations Console.
 * Wraps the existing InvestmentHubShell (Market/Deals/Network/Execution + JTBD/KPI/Monetization)
 * which is internal product/ops metadata that shouldn't be exposed to public users.
 */
import InvestmentHubShell from './InvestmentHubShell';

export default function InvestmentOpsConsole() {
  return <InvestmentHubShell />;
}
