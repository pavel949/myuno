import { Navigate, useLocation } from 'react-router-dom';
import { LoadingState } from '@/components/uno/LoadingSpinner';
import { propertySearchHref } from '@/lib/propertySearchQuery';

/** Old entry URLs remain valid and retain filters, dates and hash. */
export default function PropertySearchRedirect({ defaults = {} }: { defaults?: Record<string, string> }) {
  const location = useLocation();
  return <><LoadingState scope="content" /><Navigate replace state={location.state} to={`${propertySearchHref(location.search, defaults)}${location.hash}`} /></>;
}
