import { createServiceClient } from '../_shared/supabase.ts';
import { createActorClient } from '../_shared/operating-space-auth.ts';
import { requireAuth } from '../_shared/auth-guard.ts';
import { getCorsHeaders } from '../_shared/cors.ts';
import { handleTeamInvitation } from './handler.ts';

Deno.serve((req) => {
  const headers = getCorsHeaders(req);
  return handleTeamInvitation(req, headers, {
    authenticate: request => requireAuth(request, headers),
    actorClient: createActorClient,
    serviceClient: createServiceClient,
    enabled: Deno.env.get('TEAM_MEMBER_INVITES_ENABLED') === 'true',
    appUrl: Deno.env.get('PUBLIC_APP_URL') || 'https://myuno.app',
  });
});
