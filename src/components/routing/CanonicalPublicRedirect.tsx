import { Navigate, useLocation } from 'react-router-dom';
import { canonicalRedirectHref } from '@/lib/config/routes';

/** Existing public aliases retain filters, anchor and router return context. */
export function CanonicalPublicRedirect({ to }: { to: string }) {
  const location = useLocation();
  return <Navigate replace state={location.state} to={canonicalRedirectHref(to, location.search, location.hash)} />;
}
