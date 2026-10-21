import { createClient } from './supabase.ts';

/** Caller-bound client only; SECURITY DEFINER checks derive auth.uid(), never an actor argument. */
export function createActorClient(req: Request) {
  const url = Deno.env.get('SUPABASE_URL');
  const key = Deno.env.get('SUPABASE_ANON_KEY');
  if (!url || !key) throw new Error('Auth configuration unavailable');
  return createClient(url, key, { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } } });
}

export class AccessDenied extends Error {}

export async function authorizeRpc(client: ReturnType<typeof createActorClient>, name: string, args: Record<string, unknown>) {
  const { data, error } = await client.rpc(name, args);
  if (error || data !== true) throw new AccessDenied('Forbidden');
}

/** Authorization always precedes service-role factory, including denied and failed checks. */
export async function authorizedService<T>(authorize: () => Promise<void>, factory: () => T): Promise<T> {
  await authorize();
  return factory();
}