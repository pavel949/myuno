import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { z } from 'npm:zod@3';
import { requireAuth } from '../_shared/auth-guard.ts';
import { createActorClient, authorizeRpc, AccessDenied, authorizedService } from '../_shared/operating-space-auth.ts';
import { createServiceClient } from '../_shared/supabase.ts';
import { sendEmail, buildEmailHtml } from '../_shared/notify-utils.ts';

const Body = z.object({ property_id: z.string().uuid() }).strict();
const respond = (status: number, body: Record<string, unknown>) => new Response(JSON.stringify(body), {
 status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
});

Deno.serve(async (req: Request) => {
 if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
 if (req.method !== 'POST') return respond(405, { error: 'Method not allowed' });
 try {
  const auth = await requireAuth(req, corsHeaders);
  if (auth instanceof Response) return auth;
  const input = Body.safeParse(await req.json());
  if (!input.success) return respond(400, { error: 'Only property_id is accepted' });
  const actor = createActorClient(req);
  const service = await authorizedService(
   () => authorizeRpc(actor, 'actor_can_notify_property_submission', { p_property_id: input.data.property_id }),
   createServiceClient,
  );
  // Re-read persisted relationship/state after the actor-bound gate, never use supplied PII/title.
  const { data: property, error: propertyError } = await service.from('properties')
   .select('id,owner_id,title_en,title_ru,approval_status,deleted_at').eq('id', input.data.property_id).maybeSingle();
  if (propertyError || !property || property.approval_status !== 'pending' || property.deleted_at !== null) throw new AccessDenied('Forbidden');
  // Re-authorize current persisted scope/permission; a successful prior check is not a lease.
  await authorizeRpc(actor, 'actor_can_notify_property_submission', { p_property_id: property.id });
  const { data: roles, error: roleError } = await service.from('user_roles').select('user_id').eq('role', 'admin');
  if (roleError) throw new AccessDenied('Recipient authority unavailable');
  const ids = [...new Set((roles ?? []).map(r => r.user_id))];
  if (ids.length === 0) return respond(200, { success: true, notified: 0 });
  const { data: profiles, error: profileError } = await service.from('profiles').select('id,email').in('id', ids);
  if (profileError) throw new AccessDenied('Recipient lookup unavailable');
  // Fresh protected-role intersection: stale employee lists and removed admin roles cannot receive the alert.
  const { data: current, error: currentError } = await service.from('user_roles').select('user_id').eq('role', 'admin').in('user_id', ids);
  if (currentError) throw new AccessDenied('Recipient authority unavailable');
  const currentIds = new Set((current ?? []).map(r => r.user_id));
  const emails = [...new Set((profiles ?? []).filter(p => currentIds.has(p.id) && typeof p.email === 'string' && z.string().email().safeParse(p.email).success).map(p => String(p.email)))];
  if (emails.length === 0) return respond(200, { success: true, notified: 0 });
  const title = property.title_ru || property.title_en || property.id;
  const site = Deno.env.get('SITE_URL');
  const html = buildEmailHtml({
   title: 'Новый объект на модерации',
   sections: [{ label: 'Объект', value: title }, { label: 'Статус', value: 'Ожидает проверки' }],
   ...(site ? { ctaText: 'Перейти к модерации', ctaUrl: `${site}/admin/content-moderation` } : {}),
  });
  const result = await sendEmail({ to: emails, subject: `Новый объект на модерации: ${title}`, html });
  return respond(result.success ? 200 : 502, { success: result.success, notified: result.success ? emails.length : 0 });
 } catch (error) {
  if (error instanceof AccessDenied) return respond(403, { error: 'Forbidden' });
  if (error instanceof SyntaxError) return respond(400, { error: 'Invalid JSON' });
  return respond(500, { error: 'Notification unavailable' });
 }
});
