import { useCallback, useLayoutEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { propertyRequestReturnPath } from '@/lib/owner/propertyNavigation';

/** A successful writer must not take over a newer route, selection, or request. */
export function usePropertyRequestReturn(
  propertyId: string,
  properties: readonly { property_id: string }[],
  loading: boolean,
) {
  const navigate = useNavigate();
  const location = useLocation();
  const mounted = useRef(false);
  const generation = useRef(0);
  const current = useRef({ propertyId, properties, loading });

  useLayoutEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      generation.current += 1;
    };
  }, []);

  useLayoutEffect(() => {
    // Invalidate even if the user later returns to the original route/selection.
    generation.current += 1;
  }, [location, propertyId]);

  useLayoutEffect(() => {
    current.current = { propertyId, properties, loading };
  }, [propertyId, properties, loading]);

  return useCallback(() => {
    const requestGeneration = ++generation.current;
    return () => {
      if (!mounted.current || generation.current !== requestGeneration) return;
      generation.current += 1;
      const latest = current.current;
      navigate(propertyRequestReturnPath(latest.propertyId, latest.properties, latest.loading));
    };
  }, [navigate]);
}
