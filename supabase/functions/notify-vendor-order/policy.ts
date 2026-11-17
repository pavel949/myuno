/** Pure containment handler: no database, credentials, network or customer payload. */
export function supplierDispatchSuppressed(req: Request): Response {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Content-Type': 'application/json',
  };
  if (req.method === 'OPTIONS') return new Response(null, { headers });
  return new Response(JSON.stringify({
    success: false,
    sent: false,
    skipped: 'myuno_managed_intake',
    admin_delivery: 'not_checked',
  }), { status: 200, headers });
}
