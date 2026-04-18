import { Navigate, useSearchParams } from 'react-router-dom';
import { APP_ROUTES } from '@/lib/config/routes';
import PropertyLanding from './PropertyLanding';

/**
 * /property index: landing, or redirect legacy ?query bookmarks to /property/browse
 */
export default function PropertyHubIndexRoute() {
  const [searchParams] = useSearchParams();
  if ([...searchParams.keys()].length > 0) {
    return <Navigate to={`${APP_ROUTES.PROPERTY_BROWSE}?${searchParams.toString()}`} replace />;
  }
  return <PropertyLanding />;
}
