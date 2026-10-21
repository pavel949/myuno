/**
 * useSearchContext — collects the user/role/persona signals consumed by the
 * navigation-index ranking inside useGlobalSearch.
 *
 * Cheap & non-blocking: pulls from already-mounted contexts and the
 * useUserPersonas hook. No extra network calls.
 */
import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useUserPersonas } from '@/hooks/useUserPersonas';
import { useLocation } from 'react-router-dom';
import type { NavCluster, NavSearchContext } from '@/lib/search/navigationIndex';

const CLUSTER_BY_PATH: Array<[RegExp, NavCluster]> = [
  [/^\/(sim|exchange|transport|sos|vip-concierge)/, 'arrive'],
  [/^\/(beauty|medical|pharmacy|fitness|education|pets|restaurants|services|tours|yachts|water|events|flowers|market|insurance)/, 'live'],
  [/^\/(legal|visa)/, 'legal'],
  [/^\/(invest|clearview|newbuilds)/, 'invest'],
  [/^\/(owner|mc)/, 'manage'],
  [/^\/(me|account|profile|favorites|wallet|bookings|support)/, 'me'],
  [/^\/(admin|staff)/, 'admin'],
];

function detectCluster(pathname: string): NavCluster | undefined {
  for (const [re, cluster] of CLUSTER_BY_PATH) {
    if (re.test(pathname)) return cluster;
  }
  return undefined;
}

export function useSearchContext(): NavSearchContext {
  const { user } = useAuth();
  const { personas } = useUserPersonas();
  const location = useLocation();

  return useMemo<NavSearchContext>(() => {
    // Roles: read from user metadata if available, else from app_metadata. Owner /
    // mc / admin flags also live on profiles, but for ranking purposes we accept
    // a slightly loose signal (no hard auth check happens here — RLS still gates
    // any actual data fetch).
    const meta = (user?.user_metadata ?? {}) as Record<string, unknown>;
    const appMeta = (user?.app_metadata ?? {}) as Record<string, unknown>;
    const rawRoles = [
      ...(Array.isArray(meta.roles) ? (meta.roles as string[]) : []),
      ...(Array.isArray(appMeta.roles) ? (appMeta.roles as string[]) : []),
      ...(typeof meta.primary_role === 'string' ? [meta.primary_role as string] : []),
    ].map((r) => String(r).toLowerCase());

    // Derive owner/mc/investor flags from personas as well — many users have
    // those activated through persona selection without a backend role grant.
    const personaRoleMap: Record<string, string> = {
      property_owner: 'owner',
      investor: 'investor',
      real_estate_developer: 'developer',
      local_services_provider: 'provider',
    };
    for (const p of personas) {
      const r = personaRoleMap[p];
      if (r && !rawRoles.includes(r)) rawRoles.push(r);
    }

    return {
      isAuthenticated: !!user,
      roles: [...new Set(rawRoles)],
      personas,
      activeCluster: detectCluster(location.pathname),
    };
  }, [user, personas, location.pathname]);
}
