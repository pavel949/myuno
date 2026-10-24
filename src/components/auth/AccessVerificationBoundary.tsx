import { useEffect, useState, type ReactNode } from 'react';

/** Preserve an admitted subtree, not its authority, during the same scope's check. */
export function AccessVerificationBoundary({ identity, pending, children, fallback }: {
  identity: string;
  pending: boolean;
  children: ReactNode;
  fallback: ReactNode;
}) {
  const [admittedIdentity, setAdmittedIdentity] = useState<string | null>(null);
  useEffect(() => {
    if (!pending) setAdmittedIdentity(identity);
  }, [identity, pending]);

  const retain = !pending || admittedIdentity === identity;
  return <>
    {retain && <div key={identity} hidden={pending} inert={pending} aria-hidden={pending || undefined} className={pending ? 'hidden' : 'contents'}>{children}</div>}
    {pending && fallback}
  </>;
}