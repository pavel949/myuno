import { Navigate, useLocation } from 'react-router-dom';
import { propertySearchHref } from '@/lib/propertySearchQuery';

/** Old entry URLs remain valid and retain filters, dates and hash. */
export default function PropertySearchRedirect({ defaults = {} }: { defaults?: Record<string, string> }) {
  const location = useLocation();
  return <Navigate replace to={`${propertySearchHref(location.search, defaults)}${location.hash}`} />;
}
