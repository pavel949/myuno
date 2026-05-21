/**
 * useCurrentCanvas — classify the current pathname into one of the 6
 * canonical app-shell canvases (`home` · `discover` · `operate` · `wallet`
 * · `me` · `admin`). See `src/types/canvas.ts` for the rule list.
 *
 * Use this for shell-level concerns (analytics, CSS targeting via the
 * `data-canvas` attribute on `NavShell`, debug overlays). It is NOT a
 * routing primitive — routes are defined directly in `AnimatedRoutes.tsx`
 * and the route modules under `routes/`. The hook reads what the router
 * already decided.
 */
import { useLocation } from 'react-router-dom';
import { canvasFromPath, type CanvasId } from '@/types/canvas';

export function useCurrentCanvas(): CanvasId {
  const { pathname } = useLocation();
  return canvasFromPath(pathname);
}
