export type HeaderSurface = 'customer' | 'workspace';

const WORKSPACE_PREFIXES = [
  '/admin',
  '/vendor',
  '/mc',
  '/owner',
  '/team',
  '/staff',
  '/developer-portal',
  '/guest',
  '/my-stay',
];

/**
 * Resolve which canonical header surface should be used for a route.
 * Keep this in one place so layout selection stays deterministic.
 */
export function resolveHeaderSurface(pathname: string): HeaderSurface {
  const normalizedPath = pathname.toLowerCase();
  const isWorkspaceRoute = WORKSPACE_PREFIXES.some(
    (prefix) => normalizedPath === prefix || normalizedPath.startsWith(`${prefix}/`)
  );

  return isWorkspaceRoute ? 'workspace' : 'customer';
}
