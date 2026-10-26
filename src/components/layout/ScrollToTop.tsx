import { useLayoutEffect, useRef } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

const publicScrollPositions = new Map<string, number>();
const isPublicJourney = (path: string) => /^\/(property(?:\/|$)|area\/)/.test(path);

export const ScrollToTop = () => {
  const { pathname, key } = useLocation();
  const navigationType = useNavigationType();
  const previousPath = useRef<string | undefined>(undefined);

  useLayoutEffect(() => {
    const pathChanged = previousPath.current !== pathname;
    previousPath.current = pathname;
    if (!isPublicJourney(pathname)) {
      if (pathChanged) window.scrollTo(0, 0);
      return;
    }
    const position = navigationType === 'POP' ? publicScrollPositions.get(key) ?? 0 : pathChanged ? 0 : window.scrollY;
    window.scrollTo(0, position);
    // Lazy catalogue/detail content can mount after the route shell.
    const observer = new ResizeObserver(() => {
      if (window.scrollY < position) window.scrollTo(0, position);
      if (document.documentElement.scrollHeight >= position + window.innerHeight) observer.disconnect();
    });
    if (position > 0) observer.observe(document.body);
    const stopRestoring = () => observer.disconnect();
    window.addEventListener('wheel', stopRestoring, { once: true, passive: true });
    window.addEventListener('touchstart', stopRestoring, { once: true, passive: true });
    window.addEventListener('keydown', stopRestoring, { once: true });
    return () => {
      publicScrollPositions.set(key, window.scrollY);
      // Keep this presentation cache bounded for long browsing sessions.
      if (publicScrollPositions.size > 100) publicScrollPositions.delete(publicScrollPositions.keys().next().value!);
      observer.disconnect();
      window.removeEventListener('wheel', stopRestoring);
      window.removeEventListener('touchstart', stopRestoring);
      window.removeEventListener('keydown', stopRestoring);
    };
  }, [pathname, key, navigationType]);

  return null;
};
