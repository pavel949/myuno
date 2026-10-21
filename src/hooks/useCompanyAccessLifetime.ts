import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CompanyAccessLifetime } from '@/lib/companyAccessOperation';

/** Invalidates old work during the context render, on Auth changes, and unmount. */
export function useCompanyAccessLifetime(actorId: string | undefined, companyId: string | undefined) {
  const ref = useRef<CompanyAccessLifetime>();
  if (!ref.current || ref.current.actorId !== actorId || ref.current.companyId !== companyId || !ref.current.isActive) {
    ref.current?.invalidate();
    ref.current = new CompanyAccessLifetime(actorId, companyId);
  }
  const lifetime = ref.current;
  useEffect(() => {
    lifetime.activate();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || session?.user.id !== lifetime.actorId) lifetime.invalidate();
    });
    return () => { lifetime.invalidate(); subscription.unsubscribe(); };
  }, [lifetime]);
  return lifetime;
}
