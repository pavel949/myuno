import { Navigate } from 'react-router-dom';
import { APP_ROUTES } from '@/lib/config/routes';
import { PEYLAA_PROJECT_ID } from '@/hooks/usePeylaa';

/** Keep the campaign address connected to its canonical project and inquiries.
 * The former campaign embedded unsupported prices, yield and availability. */
export default function PeylaaLanding() {
  return <Navigate to={APP_ROUTES.OFFPLAN_DETAIL(PEYLAA_PROJECT_ID)} replace />;
}
