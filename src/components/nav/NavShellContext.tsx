/**
 * NavShellContext — signals to legacy chrome (AdaptiveBottomNav, AppHeader)
 * that the unified NavShell is already rendering navigation, so they should
 * step aside to avoid duplicate bottom bars / headers during the migration.
 */
import { createContext, useContext } from 'react';

interface NavShellContextValue {
  active: boolean;
}

export const NavShellContext = createContext<NavShellContextValue>({ active: false });

/** True when an ancestor `<NavShell>` is rendering navigation. */
export function useNavShellActive(): boolean {
  return useContext(NavShellContext).active;
}
